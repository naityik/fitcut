import { Activity } from "lucide-react";
import { Card, CardBody } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/primitives";

const PLANNED = [
  "Weight progression per exercise",
  "Estimated 1RM over time",
  "Training volume, weekly and monthly",
  "Personal records and best sets",
  "Moving averages and trend lines",
  "Plateau detection per lift",
];

export function AnalyticsPage() {
  return (
    <div className="animate-fade-up">
      <header className="mb-5">
        <p className="eyebrow">Phase 2</p>
        <h1 className="mt-1 font-display text-[26px] font-extrabold leading-none tracking-[-0.03em]">
          Exercise analytics
        </h1>
      </header>

      <Card>
        <CardBody>
          <EmptyState icon={<Activity className="h-6 w-6" />} title="Being built next">
            Every set you log now feeds this page. The data model is already in place — the charts
            arrive in the next phase.
          </EmptyState>

          <ul className="mt-5 space-y-1.5">
            {PLANNED.map((item) => (
              <li key={item} className="flex gap-2.5 text-[13px] text-muted">
                <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-faint" />
                {item}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
