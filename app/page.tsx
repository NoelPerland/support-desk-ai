import Link from "next/link";

export default function Home() {
  return <main className="support dispatch-home">
    <header className="site-nav"><Link className="brand" href="/"><span className="brand-icon">r.</span>Reply Desk</Link><nav aria-label="Main"><a href="#workflow">Workflow</a><a href="#boundaries">Details</a><Link className="button dark" href="/workspace">Open inbox ↗</Link></nav></header>
    <section className="dispatch-intro">
      <div className="dispatch-index"><span>REPLY DESK</span><span>TRIAGE / REVIEW / RESOLVE</span></div>
      <div className="dispatch-heading"><h1>Every request.<br/>A clear next step.</h1><div><p>Sort the urgent from the routine. Draft a useful response, check the details, and keep the ticket moving.</p><Link className="button accent" href="/workspace">Start a support ticket →</Link><p className="small-note">No account needed. Nothing is sent automatically.</p></div></div>
    </section>
    <section className="dispatch-sample" aria-label="Illustrative support inbox">
      <div className="dispatch-sample-head"><span>INBOX / EXAMPLE</span><span>Fictional tickets · illustrative preview</span></div>
      <div className="dispatch-sample-grid"><div className="sample-queue">
        <div className="sample-queue-label">REQUESTS</div>
        <div className="sample-row active"><span className="ticket-number">01</span><div><strong>Charged twice this month</strong><p>Alex · Billing</p></div><span className="priority high">High</span></div>
        <div className="sample-row"><span className="ticket-number">02</span><div><strong>Help changing a team seat</strong><p>Sam · Account</p></div><span className="priority">Normal</span></div>
        <div className="sample-row"><span className="ticket-number">03</span><div><strong>Where can I find invoices?</strong><p>Jo · Billing</p></div><span className="priority low">Low</span></div>
      </div><div className="sample-review"><div className="review-heading"><span className="eyebrow">01 / REPLY DRAFT</span><span>Awaiting review</span></div><h2>Two charges.<br/>One subscription.</h2><p className="sample-summary">Verify both transactions before promising a refund.</p><blockquote>Hi Alex, thanks for flagging this. I understand the timing matters for your accounts. We’ll need to verify both transactions before confirming the next step.</blockquote><div className="sample-next"><span>NEXT STEP</span><p>Check the payment records, then update the customer.</p></div><div className="sample-review-foot"><span>Open → Reviewed → Done</span><span>Copy or export after review</span></div></div></div>
    </section>
    <section id="workflow" className="dispatch-workflow"><h2>A short route to resolution.</h2><ol><li><span>01</span><h3>Capture</h3><p>Paste the request and add approved company policies.</p></li><li><span>02</span><h3>Review</h3><p>Check the priority, reasoning, reply and next steps. Edit freely.</p></li><li><span>03</span><h3>Resolve</h3><p>Save the ticket, track its status, then copy or export the reply.</p></li></ol></section>
    <section id="boundaries" className="dispatch-boundaries"><h2>You stay responsible for the reply.</h2><div><h3>Drafts, never automatic messages</h3><p>AI helps with triage and wording. Check facts and policy before sending a response through your own channels.</p></div><div><h3>A browser-bound demo</h3><p>Guest work stays available in this browser for up to 30 days. Export important tickets and avoid confidential customer information.</p></div></section>
    <footer className="site-footer"><Link className="brand" href="/">Reply Desk</Link><span>Designed & built by Noel Perland</span><a href="https://github.com/NoelPerland/support-desk-ai" target="_blank" rel="noreferrer">Explore the source ↗</a></footer>
  </main>;
}
