import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { createServer } from "node:net";
import { setTimeout as delay } from "node:timers/promises";
import { chromium } from "playwright-core";
import { readFile } from "node:fs/promises";

const require = createRequire(import.meta.url);
const { name } = JSON.parse(await readFile(new URL("../package.json", import.meta.url)));
const portfolio = name === "portfolio";
const socket = createServer();
await new Promise(resolve => socket.listen(0, "127.0.0.1", resolve));
const port = socket.address().port;
await new Promise(resolve => socket.close(resolve));
const base = `http://127.0.0.1:${port}`;
const server = spawn(process.execPath, [require.resolve("next/dist/bin/next"), "start", "-p", String(port), "-H", "127.0.0.1"], { stdio: ["ignore", "pipe", "pipe"], env: { ...process.env, NEXT_TELEMETRY_DISABLED: "1", ENABLE_SIGNUP: "false", SUPABASE_URL: "", SUPABASE_PUBLISHABLE_KEY: "", GROQ_API_KEY: "" } });
let log = "";
server.stdout.on("data", chunk => { log += chunk; });
server.stderr.on("data", chunk => { log += chunk; });
let browser;
try {
  let ready = false;
  for (let attempt = 0; attempt < 120; attempt++) {
    if (server.exitCode !== null) throw new Error(`Server exited: ${log}`);
    try { const response = await fetch(base); ready = response.ok; } catch {}
    if (ready) break;
    await delay(250);
  }
  assert(ready, `Server not ready. Run npm run build first. ${log}`);
  const foreign = await fetch(base + "/api/records", { method: "POST", headers: { Origin: "https://foreign.invalid", "Content-Type": "application/json" }, body: "{}" });
  assert.equal(foreign.status, 403, "Foreign-origin mutations must be rejected before backend access");
  if (!portfolio) {
    const guest = await fetch(base + "/api/auth");
    assert.deepEqual(await guest.json(), { email: null, signupEnabled: false });
    assert(guest.headers.get("cache-control")?.includes("no-store"));
    const signup = await fetch(base + "/api/auth", { method: "POST", headers: { Origin: base, "Content-Type": "application/json" }, body: JSON.stringify({ action: "signup", email: "fixture@example.com", password: "fixture-only-password" }) });
    assert.equal(signup.status, 403, "Disabled registration must reject before backend access");
    const logout = await fetch(base + "/api/auth", { method: "DELETE", headers: { Origin: base, "Content-Type": "application/json" }, body: "{}" });
    assert.deepEqual(await logout.json(), { signedOut: true });
  }
  browser = await chromium.launch(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : { channel: "chrome" });
  const page = await browser.newPage();
  const errors = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.addInitScript(() => { Storage.prototype.setItem = () => { throw new DOMException("Test: storage full", "QuotaExceededError"); }; });
  await page.route("**/api/records**", route => route.fulfill({ status: route.request().method() === "GET" ? 200 : 503, contentType: "application/json", body: route.request().method() === "GET" ? "[]" : JSON.stringify({ error: "Provider unavailable" }) }));
  await page.route("**/api/auth", route => route.fulfill({ contentType: "application/json", body: JSON.stringify({ email: null, signupEnabled: false }) }));
  const warns = () => page.evaluate(() => { const event = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(event); return event.defaultPrevented; });
  for (const path of portfolio ? ["/projects/support-desk", "/projects/meeting-notes"] : ["/workspace"]) {
    await page.goto(base + path);
    if (!portfolio) await page.locator(".compose-button").click();
    const input = page.locator(portfolio ? "#source" : ".compose-sheet textarea");
    const draft = "Draft text must survive a failed provider request and unavailable storage.";
    await input.fill(draft);
    await page.waitForTimeout(100);
    assert(await warns(), "Nonempty draft must warn before leaving");
    const generate = page.locator(portfolio ? ".generate" : ".compose-sheet .form-footer button");
    await generate.click();
    await page.locator(".message.error").filter({ hasText: "Provider unavailable" }).waitFor();
    assert.equal(await input.inputValue(), draft);
    assert(await generate.isEnabled(), "Failed provider must allow retry");
    if (portfolio) {
      const dialog = page.waitForEvent("dialog");
      const click = page.locator(".primary.full").click();
      await (await dialog).dismiss();
      await click;
      assert.equal(await input.inputValue(), draft, "Canceled discard must preserve draft");
    }
    await input.fill("");
    await page.waitForTimeout(100);
    assert.equal(await warns(), false, "Empty draft must not warn");
  }
  assert.deepEqual(errors, [], "Browser runtime errors");
  console.log("PASS: blocked-storage draft guard, provider failure retains input/retry, empty draft cleanup" + (portfolio ? ", canceled discard in both tools." : "."));
  console.log("Mocked APIs only: no live AI, database, account, or isolation verification claimed.");
} finally {
  await browser?.close();
  server.kill();
}
