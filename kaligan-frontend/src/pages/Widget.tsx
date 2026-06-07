import { useState } from "react";
import { PageHead, Card } from "../components/ui";
import * as I from "../components/icons";

const platforms = ["HTML", "React", "Next.js", "WordPress", "Shopify"];
const snippet = `<script src="https://cdn.kaligan.ai/w.js" data-id="ws_8fa3"></script>`;

export default function Widget() {
  const [plat, setPlat] = useState("WordPress");
  const [copied, setCopied] = useState(false);
  const [verify, setVerify] = useState<"idle" | "checking" | "ok">("idle");

  const copy = () => { navigator.clipboard?.writeText(snippet); setCopied(true); setTimeout(() => setCopied(false), 1800); };
  const doVerify = () => { setVerify("checking"); setTimeout(() => setVerify("ok"), 1600); };

  const steps = ["Verify site", "Get code", "Install", "Verify"];
  return (
    <>
      <PageHead title="Install your widget" subtitle="Get your AI live on your website in under 5 minutes." />
      <div className="flex items-center gap-3 mb-6 fadeup text-[13px] font-semibold">
        {steps.map((s, i) => (
          <span key={s} className="flex items-center gap-3">
            <span className={`flex items-center gap-2 ${i <= 2 ? "text-emerald-700" : "text-ink-muted"}`}>
              <span className={`w-5 h-5 rounded-full grid place-items-center text-[11px] ${i <= 2 ? "bg-emerald-600 text-white" : "bg-mint-100 text-emerald-700"}`}>{i + 1}</span>{s}
            </span>
            {i < steps.length - 1 && <span className="w-6 h-px bg-line" />}
          </span>
        ))}
      </div>

      <Card className="p-6 max-w-3xl fadeup">
        <label className="field-label">Your install code</label>
        <div className="flex items-stretch gap-2">
          <code className="flex-1 bg-ink text-mint-100 text-[13px] rounded-xl px-4 py-3.5 font-mono overflow-x-auto">{snippet}</code>
          <button onClick={copy} className={`btn ${copied ? "bg-success text-white" : "btn-primary"} whitespace-nowrap`}>
            {copied ? <><I.Check width={15} height={15} /> Copied</> : <>📋 Copy</>}
          </button>
        </div>
        <p className="text-ink-muted text-[13px] mt-2">Paste this just before the <code className="bg-surface-2 px-1 rounded">&lt;/body&gt;</code> tag on your site.</p>

        <label className="field-label mt-6">Platform</label>
        <div className="flex flex-wrap gap-2">
          {platforms.map((p) => (
            <button key={p} onClick={() => setPlat(p)} className={`text-[13px] font-semibold px-3.5 py-1.5 rounded-full transition ${plat === p ? "bg-emerald-600 text-white" : "bg-surface border border-line hover:border-mint-300"}`}>{p}</button>
          ))}
        </div>
        <ol className="list-decimal ml-5 mt-4 space-y-1.5 text-[14px] text-ink">
          <li>Go to Appearance → Theme File Editor (or use a “Header &amp; Footer” plugin).</li>
          <li>Paste the snippet into the footer. No coding needed.</li>
          <li>Save and reload your site.</li>
        </ol>
        <button className="btn btn-ghost mt-4 text-[13px]">Send these steps to my developer</button>

        <div className="border-t border-line mt-6 pt-5 flex items-center gap-4">
          <button onClick={doVerify} className="btn btn-primary">
            {verify === "checking" ? "Checking…" : verify === "ok" ? <><I.Check width={15} height={15} /> Installed</> : "Verify installation"}
          </button>
          {verify === "ok" && <span className="text-success text-[13.5px] font-semibold">✓ Widget active · website connected · AI ready to talk to visitors</span>}
          {verify === "checking" && <span className="text-ink-muted text-[13.5px]">Looking for the widget on your site…</span>}
        </div>
      </Card>
    </>
  );
}
