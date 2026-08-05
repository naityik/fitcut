import { Card, CardBody, SectionLabel } from "@/components/ui/card";
import { supabaseEnvStatus } from "@/lib/supabase";

/**
 * Shown in place of the app when the Supabase keys are missing. This is the one screen
 * that must render without a configured client, so it stays free of hooks, data and
 * routing — everything below it in the tree assumes a working client.
 */
export function SetupNotice() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-[560px] flex-col justify-center px-4 py-10">
      <Card className="animate-fade-up">
        <CardBody className="space-y-4">
          <div>
            <SectionLabel>FitCut</SectionLabel>
            <h1 className="font-display text-xl font-bold tracking-[-0.01em]">
              Supabase is not configured
            </h1>
          </div>

          <p className="text-sm text-muted">
            The app needs a Supabase URL and anon key before it can sign you in or store
            anything. Create <code className="rounded bg-sunken px-1 py-0.5 text-ink">.env</code>{" "}
            from the example file and fill both in:
          </p>

          {/* Names and presence only, never values — this renders on a public page. */}
          <ul className="space-y-1.5 rounded-xl bg-sunken p-3">
            {supabaseEnvStatus.map((v) => (
              <li key={v.name} className="flex items-center gap-2 text-[12px]">
                <span
                  aria-hidden
                  className={`inline-block h-1.5 w-1.5 shrink-0 rounded-full ${
                    v.present ? "bg-jade" : "bg-plateau"
                  }`}
                />
                <code className="text-ink">{v.name}</code>
                <span className={v.present ? "text-jade" : "text-plateau"}>
                  {v.present ? "found at build" : "missing at build"}
                </span>
              </li>
            ))}
          </ul>

          <pre className="overflow-x-auto rounded-xl bg-sunken p-3 text-[12px] leading-relaxed text-ink">
            <code>
              cp .env.example .env{"\n"}
              VITE_SUPABASE_URL=https://your-project-ref.supabase.co{"\n"}
              VITE_SUPABASE_ANON_KEY=your-anon-key
            </code>
          </pre>

          <p className="text-sm text-muted">
            Both values are on the Supabase dashboard under{" "}
            <span className="text-ink">Project Settings → API</span>. The anon key is the
            public one — it is meant to reach the browser, and row-level security is what
            protects your rows.
          </p>

          <p className="border-t border-line pt-3 text-[13px] text-faint">
            Vite reads these when it builds, so restart <code>npm run dev</code> after
            editing <code>.env</code>. On a deployed site, set them in the host's
            environment and redeploy — a rebuild is what picks them up.
          </p>
        </CardBody>
      </Card>
    </div>
  );
}
