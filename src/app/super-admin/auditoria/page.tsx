import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { auditLogs } from "@/data/mock";

const severity = {
  low: "secondary",
  medium: "warning",
  high: "danger",
} as const;

export default function AuditPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Auditoría</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {auditLogs.map((log) => (
          <div key={log.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-medium text-slate-950">{log.action}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {log.actor} · {log.target} · {log.restaurantName}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={severity[log.severity]}>{log.severity}</Badge>
                <Badge variant="outline">{log.createdAt}</Badge>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
