import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { menuItems } from "@/data/mock";
import { Plus, Search } from "lucide-react";

const categories = [
  "Entradas",
  "Principales",
  "Postres",
  "Bebidas",
  "Vinos",
  "Tragos",
] as const;

export default function MenuPage() {
  return (
    <div className="grid gap-5 xl:grid-cols-[220px_1fr]">
      <Card className="h-fit">
        <CardHeader className="border-b border-slate-100 pb-4">
          <CardTitle>Menu</CardTitle>
          <Button className="w-full rounded-2xl">
            <Plus className="mr-2 h-4 w-4" />
            Nuevo producto
          </Button>
        </CardHeader>
        <CardContent className="space-y-2 p-3">
          {categories.map((category, index) => (
            <button
              key={category}
              type="button"
              className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                index === 0
                  ? "bg-slate-950 text-white"
                  : "bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {category}
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Productos</CardTitle>
            <p className="text-sm text-slate-500">
              Lista compacta con imagen placeholder y estado.
            </p>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              placeholder="Buscar producto"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-white pl-9 pr-4 text-sm outline-none transition focus:border-slate-950"
            />
          </div>
        </CardHeader>
        <CardContent className="p-4">
          <div className="overflow-hidden rounded-3xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-100">
              <thead className="bg-slate-50">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  <th className="px-4 py-3">Producto</th>
                  <th className="px-4 py-3">Categoria</th>
                  <th className="px-4 py-3">Precio</th>
                  <th className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {menuItems.map((item) => (
                  <tr key={item.id} className="align-top text-sm">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[linear-gradient(135deg,#e2e8f0,#f8fafc)] text-xs font-medium text-slate-500">
                          IMG
                        </div>
                        <div>
                          <p className="font-medium text-slate-950">{item.name}</p>
                          <p className="mt-1 max-w-md text-xs text-slate-500">{item.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.category}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {item.price ? `$${item.price.toLocaleString("es-AR")}` : "Opcional"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={item.active ? "success" : "secondary"}>
                        {item.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
