import { KIND } from "../../../lib/product";
import { actor } from "../../../lib/auth";
import { body,failure,reply } from "../../../lib/http";
import { NextRequest } from "next/server";
import { z } from "zod";
import {
  inputSchema,
  kindSchema,
  updateSchema,
  validateResult,
} from "../../../lib/domain";
import {
  AppError,
  database,
  generate,
  hash,
  workspace,
} from "../../../lib/server";

export const runtime = "nodejs";
export const maxDuration = 45;
const fields = "id,kind,source,result,state,created_at";
export async function GET(request: NextRequest) {
  try {
    const kind = KIND;
    const user = await actor();
    return reply(
      await database(
        `${user ? "app_ai_account_records" : "portfolio_ai_records"}?kind=eq.${kind}&select=${fields}&order=created_at.desc&limit=50`,
        await workspace(),
        user ? { headers: { Authorization: `Bearer ${user.token}` } } : {},
      ),
    );
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: NextRequest) {
  try {
    const { kind, source, context } = inputSchema.parse({ ...(await body(request)), kind: KIND });
    const user = await actor();
    const owner = await workspace();
    // Vercel overwrites this header; never trust the general x-forwarded-for chain.
    const ip =
      request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
      (process.env.VERCEL ? "unknown" : "local");
    if (!process.env.GROQ_API_KEY) throw new AppError("AI generation is temporarily unavailable. Your input is still here.");
    const allowed = await database("rpc/portfolio_ai_budget", owner, {
      method: "POST",
      body: JSON.stringify({ p_ip: hash(ip) }),
    });
    if (!allowed)
      throw new AppError(
        "Demo generation limit reached. Try again later; saved work is still available.",
        429,
      );
    const result = await generate(kind, source, context);
    const rows = await database(
      `${user ? "app_ai_account_records" : "portfolio_ai_records"}?select=${fields}`,
      owner,
      {
        method: "POST",
        ...(user ? {headers:{Authorization:`Bearer ${user.token}`}} : {}),
        body: JSON.stringify({
          kind,
          ...(user ? {user_id:user.id} : {owner_key:owner}),
          source,
          result,
          state: "Open",
        }),
      },
    );
    return reply(rows[0], 201);
  } catch (e) {
    return failure(e);
  }
}
export async function PATCH(request: NextRequest) {
  try {
    const data = updateSchema.parse({ ...(await body(request)), kind: KIND });
    const user = await actor();
    const result = validateResult(data.kind, data.result);
    const rows = await database(
      `${user ? "app_ai_account_records" : "portfolio_ai_records"}?id=eq.${data.id}&kind=eq.${data.kind}&select=${fields}`,
      await workspace(),
      { method: "PATCH", ...(user ? {headers:{Authorization:`Bearer ${user.token}`}} : {}), body: JSON.stringify({ result, state: data.state }) },
    );
    if (!rows.length)
      throw new AppError("This item was not found in your workspace.", 404);
    return reply(rows[0]);
  } catch (e) {
    return failure(e);
  }
}
export async function DELETE(request: NextRequest) {
  try {
    const data = z
      .object({ kind: kindSchema, id: z.uuid() })
      .parse({ ...(await body(request)), kind: KIND });
    const user = await actor();
    const rows = await database(
      `${user ? "app_ai_account_records" : "portfolio_ai_records"}?id=eq.${data.id}&kind=eq.${data.kind}&select=id`,
      await workspace(),
      { method: "DELETE", ...(user ? {headers:{Authorization:`Bearer ${user.token}`}} : {}) },
    );
    if (!rows.length)
      throw new AppError("This item was not found in your workspace.", 404);
    return reply({ deleted: true });
  } catch (e) {
    return failure(e);
  }
}
