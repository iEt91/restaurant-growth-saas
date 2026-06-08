"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/native-select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { menuItems } from "@/data/mock";
import type { RestaurantTable, TableConsumptionItem } from "@/types/domain";

const categories = [
  "Entradas",
  "Principales",
  "Postres",
  "Bebidas",
  "Vinos",
  "Tragos",
] as const;

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 0,
  style: "currency",
});

function formatMoney(value: number) {
  return moneyFormatter.format(value);
}

type RestaurantConsumptionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reservationId: string | null;
  tableName: string;
  clientName: string;
  tableStatus: RestaurantTable["status"];
  timeRemainingMinutes: number | null;
  existingItems: TableConsumptionItem[];
  onSave: (items: TableConsumptionItem[]) => void;
};

export function RestaurantConsumptionModal({
  open,
  onOpenChange,
  reservationId,
  tableName,
  clientName,
  tableStatus,
  timeRemainingMinutes,
  existingItems,
  onSave,
}: RestaurantConsumptionModalProps) {
  const activeMenuItems = React.useMemo(
    () => menuItems.filter((item) => item.active),
    []
  );
  const availableCategories = React.useMemo(
    () =>
      categories.filter((category) =>
        activeMenuItems.some((item) => item.category === category)
      ),
    [activeMenuItems]
  );

  const initialCategory =
    existingItems[0]?.category ?? availableCategories[0] ?? categories[0];
  const initialProducts = activeMenuItems.filter(
    (item) => item.category === initialCategory
  );
  const initialProduct = initialProducts[0] ?? activeMenuItems[0] ?? null;

  const [draftItems, setDraftItems] = React.useState<TableConsumptionItem[]>(existingItems);
  const [draftCategory, setDraftCategory] =
    React.useState<(typeof categories)[number]>(initialCategory);
  const [draftProductId, setDraftProductId] = React.useState(initialProduct?.id ?? "");
  const [draftQuantity, setDraftQuantity] = React.useState("1");
  const [draftUnitPrice, setDraftUnitPrice] = React.useState(
    initialProduct?.price ? String(initialProduct.price) : ""
  );

  const productsInCategory = React.useMemo(
    () => activeMenuItems.filter((item) => item.category === draftCategory),
    [activeMenuItems, draftCategory]
  );

  const selectedProduct = React.useMemo(
    () =>
      activeMenuItems.find((item) => item.id === draftProductId) ??
      productsInCategory[0] ??
      null,
    [activeMenuItems, draftProductId, productsInCategory]
  );

  const totalEstimate = React.useMemo(
    () => draftItems.reduce((sum, item) => sum + item.lineTotal, 0),
    [draftItems]
  );

  const hasEditableContext =
    open && Boolean(reservationId) && tableStatus === "Ocupada" && Boolean(selectedProduct);

  function handleAddItem() {
    if (!reservationId || !selectedProduct) {
      return;
    }

    const quantity = Math.max(1, Number(draftQuantity) || 1);
    const unitPrice = Number(draftUnitPrice || selectedProduct.price || 0);
    const lineTotal = quantity * unitPrice;

    setDraftItems((current) => {
      const existingIndex = current.findIndex(
        (item) => item.productId === selectedProduct.id
      );

      if (existingIndex >= 0) {
        return current.map((item, index) => {
          if (index !== existingIndex) {
            return item;
          }

          const nextQuantity = item.quantity + quantity;
          const nextLineTotal = item.lineTotal + lineTotal;

          return {
            ...item,
            quantity: nextQuantity,
            unitPrice: nextQuantity > 0 ? Math.round(nextLineTotal / nextQuantity) : unitPrice,
            lineTotal: nextLineTotal,
          };
        });
      }

      return [
        ...current,
        {
          id: crypto.randomUUID(),
          reservationId,
          tableName,
          category: draftCategory,
          productId: selectedProduct.id,
          productName: selectedProduct.name,
          quantity,
          unitPrice,
          lineTotal,
        },
      ];
    });

    setDraftQuantity("1");
  }

  function handleSave() {
    if (!reservationId) {
      return;
    }

    onSave(draftItems);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl overflow-hidden p-0">
        <div className="flex h-[90vh] max-h-[90vh] min-h-0 flex-col">
          <div className="border-b border-slate-100 px-6 py-5">
            <DialogHeader className="text-left">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary" className="rounded-full">
                  Mesa {tableName}
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  {tableStatus}
                </Badge>
              </div>
              <DialogTitle className="text-2xl font-semibold text-slate-950">
                Agregar consumo
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                {clientName} · {selectedProduct ? "Carga y guarda los items en la mesa." : "Solo disponible para mesas ocupadas."}
              </DialogDescription>
            </DialogHeader>
          </div>

          <ScrollArea className="min-h-0 flex-1">
            <div className="grid gap-5 px-6 py-5 lg:grid-cols-[1.05fr_0.95fr]">
              <Card className="border-slate-200/80 shadow-sm">
                <CardHeader className="space-y-3 border-b border-slate-100 pb-4">
                  <CardTitle className="text-base">Cargar item</CardTitle>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                        Mesa
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-950">{tableName}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                        Cliente
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-950">{clientName}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                        Estado
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-950">{tableStatus}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
                      <p className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                        Tiempo restante
                      </p>
                      <p className="mt-2 text-sm font-medium text-slate-950">
                        {tableStatus === "Ocupada" && timeRemainingMinutes !== null
                          ? `${timeRemainingMinutes} min restantes`
                          : "No disponible"}
                      </p>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">
                        Categoría
                      </span>
                      <NativeSelect
                        value={draftCategory}
                        onChange={(event) => {
                          const nextCategory = event.target.value as (typeof categories)[number];
                          const nextProducts = activeMenuItems.filter(
                            (item) => item.category === nextCategory
                          );
                          const nextProduct = nextProducts[0] ?? activeMenuItems[0] ?? null;

                          setDraftCategory(nextCategory);
                          setDraftProductId(nextProduct?.id ?? "");
                          setDraftUnitPrice(nextProduct?.price ? String(nextProduct.price) : "");
                        }}
                        className="focus:border-violet-400 focus:ring-violet-500/10"
                      >
                        {availableCategories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </NativeSelect>
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Producto</span>
                      <NativeSelect
                        value={draftProductId}
                        onChange={(event) => {
                          const nextProduct = activeMenuItems.find(
                            (item) => item.id === event.target.value
                          );

                          if (!nextProduct) {
                            return;
                          }

                          setDraftProductId(nextProduct.id);
                          setDraftCategory(nextProduct.category);
                          setDraftUnitPrice(nextProduct.price ? String(nextProduct.price) : "");
                        }}
                        className="focus:border-violet-400 focus:ring-violet-500/10"
                      >
                        {productsInCategory.map((product) => (
                          <option key={product.id} value={product.id}>
                            {product.name}
                          </option>
                        ))}
                      </NativeSelect>
                    </label>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">Cantidad</span>
                      <Input
                        type="number"
                        min={1}
                        value={draftQuantity}
                        onChange={(event) => setDraftQuantity(event.target.value)}
                      />
                    </label>

                    <label className="space-y-2">
                      <span className="text-sm font-medium text-slate-700">
                        Precio unitario
                      </span>
                      <Input
                        type="number"
                        min={0}
                        step={100}
                        value={draftUnitPrice}
                        onChange={(event) => setDraftUnitPrice(event.target.value)}
                        placeholder="Opcional"
                      />
                    </label>
                  </div>

                  <Button
                    type="button"
                    className="w-full rounded-2xl"
                    onClick={handleAddItem}
                    disabled={!hasEditableContext}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Agregar item
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 shadow-sm">
                <CardHeader className="border-b border-slate-100 pb-4">
                  <CardTitle className="text-base">Consumos cargados</CardTitle>
                  <p className="text-sm text-slate-500">
                    {draftItems.length} items · Total estimado {formatMoney(totalEstimate)}
                  </p>
                </CardHeader>
                <CardContent className="pt-4">
                  {draftItems.length > 0 ? (
                    <div className="space-y-3">
                      {draftItems.map((item) => (
                        <div
                          key={item.id}
                          className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="space-y-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-medium text-slate-950">
                                  {item.quantity}x {item.productName}
                                </p>
                                <Badge variant="secondary" className="rounded-full">
                                  {item.category}
                                </Badge>
                              </div>
                              <p className="text-sm text-slate-500">
                                {item.unitPrice > 0
                                  ? `${formatMoney(item.unitPrice)} c/u`
                                  : "Precio unitario opcional"}
                              </p>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-9 w-9 rounded-full"
                              onClick={() =>
                                setDraftItems((current) =>
                                  current.filter((currentItem) => currentItem.id !== item.id)
                                )
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                          <p className="mt-3 text-right text-sm font-semibold text-slate-950">
                            {formatMoney(item.lineTotal)}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-5 text-sm text-slate-500">
                      Todavía no hay items cargados para esta mesa.
                    </div>
                  )}

                  <div className="mt-4 rounded-3xl border border-violet-200 bg-violet-50 p-4">
                    <p className="text-[11px] uppercase tracking-[0.22em] text-violet-600">
                      Total estimado
                    </p>
                    <p className="mt-2 text-2xl font-semibold text-violet-700">
                      {formatMoney(totalEstimate)}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>

          <DialogFooter className="border-t border-slate-100 px-6 py-4">
            <Button variant="outline" className="rounded-2xl" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button className="rounded-2xl" onClick={handleSave}>
              Guardar consumo
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
