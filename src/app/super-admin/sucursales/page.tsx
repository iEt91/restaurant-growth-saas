import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { branches } from "@/data/mock";

export default function BranchesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sucursales</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {branches.map((branch) => (
          <div key={branch.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-slate-950">{branch.name}</p>
              <Badge variant="secondary">{branch.city}</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500">{branch.address}</p>
            <p className="mt-1 text-sm text-slate-500">{branch.phone} · {branch.openingHours}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
