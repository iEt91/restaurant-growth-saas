import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { restaurants } from "@/data/mock";

export default function SubscriptionsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Suscripciones</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {restaurants.map((restaurant) => (
          <div key={restaurant.id} className="rounded-2xl border border-slate-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="font-medium text-slate-950">{restaurant.name}</p>
              <Badge variant={restaurant.status === "activo" ? "success" : "danger"}>
                {restaurant.monthlyPlan}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Estado {restaurant.status} · Plan mensual vinculado al tenant.
            </p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
