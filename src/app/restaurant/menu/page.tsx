"use client";

import * as React from "react";
import { ImageIcon, Link2, Plus, Search, Pencil, Trash2, Upload, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { Switch } from "@/components/ui/switch";
import { useRestaurantFlow } from "@/components/restaurant-flow-provider";
import type { MenuItem } from "@/types/domain";

const categories = [
  "Entradas",
  "Principales",
  "Postres",
  "Bebidas",
  "Vinos",
  "Tragos",
] as const;

type MenuCategory = (typeof categories)[number];

type MenuFormState = {
  id: string | null;
  name: string;
  description: string;
  category: MenuCategory;
  price: string;
  image: string;
  imageUrl: string;
  imageSource: MenuItem["imageSource"];
  imageUrlInput: string;
  active: boolean;
};

const emptyForm: MenuFormState = {
  id: null,
  name: "",
  description: "",
  category: "Entradas",
  price: "",
  image: "",
  imageUrl: "",
  imageSource: null,
  imageUrlInput: "",
  active: true,
};

const allowedImageTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const maxImageSizeBytes = 3 * 1024 * 1024;

const moneyFormatter = new Intl.NumberFormat("es-AR", {
  currency: "ARS",
  maximumFractionDigits: 0,
  style: "currency",
});

function formatMoney(value?: number) {
  return value ? moneyFormatter.format(value) : "Opcional";
}

function normalizePriceInput(value: string) {
  return value.replace(/[^\d]/g, "");
}

function isValidImageUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getImageSourceLabel(source: MenuItem["imageSource"]) {
  if (source === "upload") return "Subida desde computadora";
  if (source === "url") return "Imagen web";
  return "Sin imagen";
}

function getFormFromItem(item: MenuItem): MenuFormState {
  return {
    id: item.id,
    name: item.name,
    description: item.description,
    category: item.category,
    price: item.price ? String(item.price) : "",
    image: item.image,
    imageUrl: item.imageUrl ?? "",
    imageSource: item.imageSource ?? null,
    imageUrlInput: item.imageSource === "url" ? item.imageUrl ?? "" : "",
    active: item.active,
  };
}

export default function MenuPage() {
  const { menuItems, saveMenuItem, deleteMenuItem, setMenuItemActive } = useRestaurantFlow();
  const [selectedCategory, setSelectedCategory] = React.useState<MenuCategory | "Todas">("Todas");
  const [search, setSearch] = React.useState("");
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [form, setForm] = React.useState<MenuFormState>(emptyForm);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [imageError, setImageError] = React.useState<string | null>(null);
  const [imagePreviewFailed, setImagePreviewFailed] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const filteredItems = React.useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return menuItems.filter((item) => {
      const matchesCategory =
        selectedCategory === "Todas" ? true : item.category === selectedCategory;
      const matchesSearch =
        normalizedSearch.length === 0
          ? true
          : `${item.name} ${item.description}`.toLowerCase().includes(normalizedSearch);

      return matchesCategory && matchesSearch;
    });
  }, [menuItems, search, selectedCategory]);

  const categoryCounts = React.useMemo(
    () =>
      categories.reduce(
        (acc, category) => {
          acc[category] = menuItems.filter((item) => item.category === category).length;
          return acc;
        },
        {} as Record<MenuCategory, number>
      ),
    [menuItems]
  );

  const visibleCategories = React.useMemo(() => {
    return [
      { label: "Todas" as const, count: menuItems.length },
      ...categories.map((category) => ({
        label: category,
        count: categoryCounts[category],
      })),
    ];
  }, [categoryCounts, menuItems.length]);

  const activeCount = menuItems.filter((item) => item.active).length;
  const inactiveCount = menuItems.length - activeCount;

  React.useEffect(() => {
    const nextUrl = form.imageUrlInput.trim();

    if (!nextUrl || !isValidImageUrl(nextUrl) || nextUrl === form.imageUrl) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setForm((current) => {
        const currentUrl = current.imageUrlInput.trim();

        if (!isValidImageUrl(currentUrl) || currentUrl === current.imageUrl) {
          return current;
        }

        return {
          ...current,
          imageUrl: currentUrl,
          imageSource: "url",
        };
      });
      setImageError(null);
      setImagePreviewFailed(false);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [form.imageUrl, form.imageUrlInput]);

  function openCreateDialog() {
    setForm(emptyForm);
    setFormError(null);
    setImageError(null);
    setImagePreviewFailed(false);
    setDialogOpen(true);
  }

  function openEditDialog(item: MenuItem) {
    setForm(getFormFromItem(item));
    setFormError(null);
    setImageError(null);
    setImagePreviewFailed(false);
    setDialogOpen(true);
  }

  function handleDeleteMenuItem(item: MenuItem) {
    const confirmed = window.confirm(
      "¿Seguro que querés eliminar este producto? Esta acción no se puede deshacer."
    );

    if (!confirmed) {
      return;
    }

    deleteMenuItem(item.id);
  }

  function closeDialog() {
    setDialogOpen(false);
    setFormError(null);
    setImageError(null);
    setImagePreviewFailed(false);
  }

  function updateField<K extends keyof MenuFormState>(field: K, value: MenuFormState[K]) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
    setFormError(null);
  }

  function handleUploadClick() {
    fileInputRef.current?.click();
  }

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";

    if (!file) {
      return;
    }

    if (!allowedImageTypes.includes(file.type as (typeof allowedImageTypes)[number])) {
      setImageError("Usá una imagen JPG, PNG o WebP.");
      return;
    }

    if (file.size > maxImageSizeBytes) {
      setImageError("La imagen no puede superar los 3 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result !== "string") {
        setImageError("No pudimos leer la imagen. Probá con otro archivo.");
        return;
      }

      setForm((current) => ({
        ...current,
        imageUrl: reader.result as string,
        imageSource: "upload",
        imageUrlInput: "",
      }));
      setImageError(null);
      setImagePreviewFailed(false);
    };
    reader.onerror = () => {
      setImageError("No pudimos leer la imagen. Probá con otro archivo.");
    };
    reader.readAsDataURL(file);
  }

  function handleUseImageUrl() {
    const nextUrl = form.imageUrlInput.trim();

    if (!nextUrl) {
      setImageError("Pegá una URL de imagen para usarla.");
      return;
    }

    if (!isValidImageUrl(nextUrl)) {
      setImageError("La URL debe empezar con http:// o https://.");
      return;
    }

    setForm((current) => ({
      ...current,
      imageUrl: nextUrl,
      imageSource: "url",
    }));
    setImageError(null);
    setImagePreviewFailed(false);
  }

  function handleRemoveImage() {
    setForm((current) => ({
      ...current,
      imageUrl: "",
      imageSource: null,
      imageUrlInput: "",
    }));
    setImageError(null);
    setImagePreviewFailed(false);
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedPrice = normalizePriceInput(form.price);

    if (!form.name.trim()) {
      setFormError("El nombre del producto es obligatorio.");
      return;
    }

    if (form.price.trim() && (!normalizedPrice || Number(normalizedPrice) <= 0)) {
      setFormError("El precio debe ser un número entero mayor a cero o quedar vacío.");
      return;
    }

    const nextItem: MenuItem = {
      id: form.id ?? crypto.randomUUID(),
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      price: normalizedPrice ? Number(normalizedPrice) : undefined,
      image: form.image.trim(),
      imageUrl: form.imageUrl.trim() || undefined,
      imageSource: form.imageUrl.trim() ? form.imageSource : null,
      active: form.active,
    };

    saveMenuItem(nextItem);
    setDialogOpen(false);
  }

  return (
    <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
      <Card className="h-fit">
        <CardHeader className="border-b border-slate-100 pb-4">
          <div>
            <CardTitle>Menu</CardTitle>
            <p className="text-sm text-slate-500">Categorias y productos activos.</p>
          </div>
        </CardHeader>
        <CardContent className="space-y-2 p-3">
          <Button
            className="w-full rounded-2xl bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={openCreateDialog}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nuevo producto
          </Button>

          {visibleCategories.map((category) => {
            const active = selectedCategory === category.label;
            return (
              <button
                key={category.label}
                type="button"
                onClick={() => setSelectedCategory(category.label)}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium transition ${
                  active
                    ? "bg-slate-950 text-white"
                    : "bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{category.label}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-white/10 text-white" : "bg-slate-100 text-slate-500"}`}>
                  {category.count}
                </span>
              </button>
            );
          })}

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            <p className="font-medium text-slate-950">Resumen</p>
            <p className="mt-1">{activeCount} activos</p>
            <p>{inactiveCount} inactivos</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-4 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Productos</CardTitle>
            <p className="text-sm text-slate-500">
              Lista funcional con edicion y activacion por producto.
            </p>
          </div>
          <div className="relative w-full max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar producto"
              className="pl-9"
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
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="align-top text-sm">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-[linear-gradient(135deg,#e2e8f0,#f8fafc)] text-xs font-medium text-slate-500">
                          <ImageIcon className="h-4 w-4 text-slate-400" />
                          {item.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={item.imageUrl}
                              alt={item.name}
                              className="absolute inset-0 h-full w-full object-cover"
                              onError={(event) => {
                                event.currentTarget.style.display = "none";
                              }}
                            />
                          ) : null}
                        </div>
                        <div>
                          <p className="font-medium text-slate-950">{item.name}</p>
                          <p className="mt-1 max-w-md text-xs text-slate-500">
                            {item.description}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{item.category}</td>
                    <td className="px-4 py-3 text-slate-700">{formatMoney(item.price)}</td>
                    <td className="px-4 py-3">
                      <Badge variant={item.active ? "success" : "secondary"}>
                        {item.active ? "Activo" : "Inactivo"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl"
                          onClick={() => openEditDialog(item)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="rounded-xl text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => handleDeleteMenuItem(item)}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </Button>
                        <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                          <Switch
                            checked={item.active}
                            onCheckedChange={(checked) =>
                              setMenuItemActive(item.id, checked)
                            }
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="max-w-3xl overflow-hidden p-0">
          <form className="flex h-[90vh] max-h-[90vh] min-h-0 flex-col" onSubmit={handleSubmit}>
            <div className="border-b border-slate-100 px-6 py-5">
              <DialogHeader className="text-left">
                <DialogTitle className="text-2xl font-semibold text-slate-950">
                  {form.id ? "Editar producto" : "Nuevo producto"}
                </DialogTitle>
                <DialogDescription className="text-sm text-slate-500">
                  Mantiene el catalogo listo para consumos por mesa.
                </DialogDescription>
              </DialogHeader>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              {formError ? (
                <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {formError}
                </div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={form.name}
                    onChange={(event) => updateField("name", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Categoria</Label>
                  <NativeSelect
                    value={form.category}
                    onChange={(event) =>
                      updateField("category", event.target.value as MenuCategory)
                    }
                    className="h-11 focus:border-slate-400"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </NativeSelect>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Descripcion</Label>
                  <Input
                    value={form.description}
                    onChange={(event) => updateField("description", event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio</Label>
                  <Input
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={form.price}
                    onChange={(event) =>
                      updateField("price", normalizePriceInput(event.target.value))
                    }
                    placeholder="Opcional"
                  />
                </div>
                <div className="space-y-4 rounded-3xl border border-slate-200 bg-slate-50 p-4 md:col-span-2">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-medium text-slate-950">Imagen del producto</p>
                      <p className="text-sm text-slate-500">
                        Subí una imagen o usá una URL web. Es opcional.
                      </p>
                    </div>
                    <Badge variant="secondary" className="w-fit rounded-full">
                      {getImageSourceLabel(form.imageSource)}
                    </Badge>
                  </div>

                  <div className="grid gap-4 lg:grid-cols-[180px_minmax(0,1fr)]">
                    <div className="relative flex aspect-square min-h-40 items-center justify-center overflow-hidden rounded-3xl border border-dashed border-slate-300 bg-white">
                      {form.imageUrl && !imagePreviewFailed ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={form.imageUrl}
                          alt={form.name || "Imagen del producto"}
                          className="h-full w-full object-cover"
                          onError={() => {
                            setImagePreviewFailed(true);
                            setImageError("No pudimos cargar la imagen. Podés reemplazarla o quitarla.");
                          }}
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 px-4 text-center text-sm text-slate-500">
                          <ImageIcon className="h-8 w-8 text-slate-300" />
                          <span>{form.imageUrl ? "Imagen no disponible" : "Sin imagen"}</span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Subir desde computadora</Label>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleFileChange}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          className="w-full justify-start rounded-2xl"
                          onClick={handleUploadClick}
                        >
                          <Upload className="mr-2 h-4 w-4" />
                          Subir imagen
                        </Button>
                        <p className="text-xs text-slate-500">
                          JPG, PNG o WebP. Máximo 3 MB.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label>URL de imagen</Label>
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <Input
                            value={form.imageUrlInput}
                            onChange={(event) => {
                              updateField("imageUrlInput", event.target.value);
                              setImageError(null);
                            }}
                            placeholder="https://..."
                          />
                          <Button
                            type="button"
                            variant="outline"
                            className="rounded-2xl"
                            onClick={handleUseImageUrl}
                          >
                            <Link2 className="mr-2 h-4 w-4" />
                            Usar URL
                          </Button>
                        </div>
                      </div>

                      {imageError ? (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                          {imageError}
                        </div>
                      ) : null}

                      {form.imageUrl ? (
                        <Button
                          type="button"
                          variant="outline"
                          className="rounded-2xl text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={handleRemoveImage}
                        >
                          <X className="mr-2 h-4 w-4" />
                          Quitar imagen
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 md:col-span-2">
                  <div>
                    <p className="font-medium text-slate-950">Producto activo</p>
                    <p className="text-sm text-slate-500">
                      Los productos inactivos no aparecen en consumos.
                    </p>
                  </div>
                  <Switch
                    checked={form.active}
                    onCheckedChange={(checked) => updateField("active", checked)}
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="border-t border-slate-100 px-6 py-4">
              <Button type="button" variant="outline" className="rounded-2xl" onClick={closeDialog}>
                Cancelar
              </Button>
              <Button type="submit" className="rounded-2xl">
                Guardar producto
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
