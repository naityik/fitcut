import * as React from "react";
import { useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { useAuth } from "./AuthProvider";
import { LADDER } from "@/constants/plan";

type Mode = "signin" | "signup";
interface FormValues { name: string; email: string; password: string }

export function AuthPage() {
  const { signInWithEmail, signUpWithEmail } = useAuth();
  const [mode, setMode] = React.useState<Mode>("signin");
  const [error, setError] = React.useState<string | null>(null);
  const [notice, setNotice] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const { register, handleSubmit, formState } = useForm<FormValues>({
    defaultValues: { name: "", email: "", password: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setError(null); setNotice(null); setBusy(true);
    try {
      if (mode === "signin") {
        await signInWithEmail(values.email, values.password);
      } else {
        const { needsConfirmation } = await signUpWithEmail(values.email, values.password, values.name);
        if (needsConfirmation) setNotice("Check your inbox to confirm the address, then sign in.");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
    }
  });

  return (
    <div className="flex min-h-full flex-col lg:flex-row">
      {/* Left: the ladder, which is what this app is actually about */}
      <div className="relative hidden overflow-hidden bg-ink px-12 py-16 lg:flex lg:w-[46%] lg:flex-col lg:justify-between">
        <div>
          <p className="font-display text-[11px] font-bold uppercase tracking-[0.18em] text-white/40">
            16 weeks · 5 Aug → 24 Nov
          </p>
          <h1 className="mt-4 max-w-[12ch] font-display text-5xl font-extrabold leading-[0.95] tracking-[-0.03em] text-white">
            One rung at a time.
          </h1>
          <p className="mt-5 max-w-[36ch] text-[15px] leading-relaxed text-white/55">
            Cut calories only when the scale says to. Add cardio only when the diet has done its part.
            Never cut more than you need to.
          </p>
        </div>

        <div className="space-y-2.5">
          {LADDER.map((rung, i) => (
            <motion.div
              key={rung.index}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.06 * i, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="flex items-center gap-3"
              style={{ paddingLeft: rung.index * 10 }}
            >
              <div className="h-px flex-1 bg-white/10" />
              <span className="tnum shrink-0 text-[13px] font-semibold text-white/70">
                {rung.kcal.toLocaleString()}
              </span>
              {rung.cardioKcal > 0 && (
                <span className="tnum shrink-0 text-[11px] font-semibold text-cardio">
                  +{rung.cardioKcal}
                </span>
              )}
            </motion.div>
          ))}
          <p className="pt-3 text-[11px] text-white/30">The step ladder. You start at the top.</p>
        </div>
      </div>

      {/* Right: the form */}
      <div className="flex flex-1 items-center justify-center px-5 py-14">
        <div className="w-full max-w-[380px]">
          <div className="lg:hidden">
            <p className="eyebrow">FitCut</p>
            <h1 className="mt-2 font-display text-3xl font-extrabold tracking-[-0.03em]">
              One rung at a time.
            </h1>
          </div>

          <h2 className="mt-8 font-display text-xl font-bold tracking-[-0.02em] lg:mt-0">
            {mode === "signin" ? "Sign in" : "Create your account"}
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            {mode === "signin"
              ? "Pick up where the log left off."
              : "Your phase starts the day you say it does."}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3.5">
            {mode === "signup" && (
              <Field label="Name">
                <Input placeholder="Your name" autoComplete="name" {...register("name", { required: true })} />
              </Field>
            )}
            <Field label="Email">
              <Input type="email" placeholder="you@example.com" autoComplete="email"
                {...register("email", { required: true })} />
            </Field>
            <Field label="Password" hint={mode === "signup" ? "At least 8 characters." : undefined}>
              <Input type="password" placeholder="••••••••"
                autoComplete={mode === "signin" ? "current-password" : "new-password"}
                {...register("password", { required: true, minLength: 8 })} />
            </Field>

            {error && (
              <p className="rounded-xl bg-plateau/8 px-3 py-2.5 text-[13px] text-plateau">{error}</p>
            )}
            {notice && (
              <p className="rounded-xl bg-jade/8 px-3 py-2.5 text-[13px] text-jade">{notice}</p>
            )}

            <Button type="submit" variant="accent" size="lg" className="w-full"
              disabled={busy || formState.isSubmitting}>
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              {mode === "signin" ? "Sign in" : "Create account"}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          <p className="mt-5 text-center text-[13px] text-muted">
            {mode === "signin" ? "No account yet?" : "Already have one?"}{" "}
            <button
              className="font-semibold text-jade underline-offset-4 hover:underline"
              onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null); setNotice(null); }}
            >
              {mode === "signin" ? "Create one" : "Sign in"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
