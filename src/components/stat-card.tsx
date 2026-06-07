import { Card, CardContent } from "@/components/ui/card";

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <Card className="shadow-[0_10px_24px_rgba(15,23,42,0.06)]">
      <CardContent className="p-4">
        <p className="text-xs font-medium uppercase tracking-[0.22em] text-slate-400">
          {label}
        </p>
        <div className="mt-3 flex items-end justify-between gap-3">
          <p className="text-3xl font-semibold tracking-tight text-slate-950">
            {value}
          </p>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
            {hint}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
