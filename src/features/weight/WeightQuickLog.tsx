import * as React from "react";
import { Check, Loader2, Scale } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useWeights } from "./useWeight";
import { WEIGH_IN_PROTOCOL } from "@/constants/plan";
import { relativeDayLabel, type ISODate } from "@/lib/date";

/** Autosaves on blur and on Enter. No save button, by design. */
export function WeightQuickLog({ date }: { date: ISODate }) {
  const { byDate, saveWeight } = useWeights();
  const stored = byDate.get(date);
  const [draft, setDraft] = React.useState<string>(stored != null ? String(stored) : "");
  const [justSaved, setJustSaved] = React.useState(false);

  React.useEffect(() => {
    setDraft(stored != null ? String(stored) : "");
  }, [stored, date]);

  const commit = () => {
    const value = Number.parseFloat(draft);
    if (!Number.isFinite(value) || value === stored) return;
    if (value < 20 || value > 400) return;
    saveWeight.mutate(
      { date, weightKg: Math.round(value * 100) / 100 },
      { onSuccess: () => { setJustSaved(true); setTimeout(() => setJustSaved(false), 1600); } },
    );
  };

  return (
    <Card>
      <CardBody>
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-jade/8 text-jade">
            <Scale className="h-[18px] w-[18px]" strokeWidth={2.2} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold">{relativeDayLabel(date)}'s morning weight</p>
            <p className="truncate text-[11px] text-faint">{WEIGH_IN_PROTOCOL[1]}</p>
          </div>
          <div className="relative flex shrink-0 items-center gap-2">
            <Input
              type="number" inputMode="decimal" step="0.01" placeholder="00.00"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
              className="tnum w-[110px] text-right text-[17px] font-bold"
              aria-label="Morning weight in kilograms"
            />
            <span className="text-[13px] font-medium text-faint">kg</span>
            {saveWeight.isPending && (
              <Loader2 className="absolute -left-6 h-3.5 w-3.5 animate-spin text-faint" />
            )}
            {justSaved && !saveWeight.isPending && (
              <Check className="absolute -left-6 h-4 w-4 text-progress" strokeWidth={2.6} />
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

export function WeighInProtocol() {
  return (
    <Card>
      <CardBody>
        <p className="eyebrow mb-2.5">Weigh-in protocol</p>
        <ul className="space-y-1.5">
          {WEIGH_IN_PROTOCOL.map((rule) => (
            <li key={rule} className="flex gap-2.5 text-[13px] text-muted">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-jade" strokeWidth={2.6} />
              {rule}
            </li>
          ))}
        </ul>
      </CardBody>
    </Card>
  );
}

