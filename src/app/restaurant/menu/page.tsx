import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { menuItems } from "@/data/mock";

const categories = ["Entradas", "Principales", "Postres", "Bebidas", "Vinos", "Tragos"] as const;

export default function MenuPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Menú</CardTitle>
        <p className="text-sm text-slate-500">
          Vista por categorías con tarjetas visuales para productos.
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="Entradas">
          <TabsList className="mb-6 flex w-full flex-wrap gap-2 rounded-[22px] bg-slate-100 p-2">
            {categories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>

          {categories.map((category) => {
            const items = menuItems.filter((item) => item.category === category);

            return (
              <TabsContent key={category} value={category}>
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {items.map((item) => (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm"
                    >
                      <div className="flex h-36 items-center justify-center bg-[linear-gradient(135deg,_#e2e8f0,_#f8fafc)] text-sm font-medium text-slate-500">
                        {item.image} placeholder
                      </div>
                      <div className="p-5">
                        <div className="flex items-center justify-between gap-3">
                          <h3 className="text-base font-semibold text-slate-950">{item.name}</h3>
                          <Badge variant={item.active ? "success" : "secondary"}>
                            {item.active ? "Activo" : "Inactivo"}
                          </Badge>
                        </div>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{item.description}</p>
                        <div className="mt-4 flex items-center justify-between">
                          <p className="text-sm font-medium text-slate-700">
                            {item.price ? `$${item.price.toLocaleString("es-AR")}` : "Precio opcional"}
                          </p>
                          <Badge variant="outline">{item.category}</Badge>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </CardContent>
    </Card>
  );
}
