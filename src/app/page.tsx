"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, Lock, Sparkles, UtensilsCrossed } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const router = useRouter();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").toLowerCase();

    if (email.includes("admin") || email.includes("super")) {
      router.push("/super-admin/restaurants");
      return;
    }

    router.push("/restaurant/dashboard");
  }

  return (
    <main className="min-h-screen p-4 sm:p-5 lg:p-6">
      <div className="grid min-h-[calc(100vh-2rem)] w-full gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <section className="relative overflow-hidden rounded-[34px] border border-slate-200 bg-[linear-gradient(180deg,#0b1020,#101626)] p-8 text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.08),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.12),transparent_24%)]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                  Restaurant Growth SaaS
                </p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight">
                  Acceso al panel interno
                </h1>
              </div>
            </div>

            <div className="max-w-xl">
              <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-200">
                <Sparkles className="h-3.5 w-3.5" />
                Sprint 1.2 visual premium
              </p>
              <h2 className="mt-5 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
                Un dashboard serio para operar restaurantes multi-tenant.
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
                Base lista para continuar con Supabase Auth, PostgreSQL y Storage
                sin perder la estetica premium de la referencia.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {["Panel Super Admin", "Panel Restaurante", "Roles y soporte"].map((item) => (
                <Card key={item} className="border-white/10 bg-white/5 shadow-none">
                  <CardContent className="p-4">
                    <p className="text-sm font-medium text-slate-100">{item}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-[34px] border border-slate-200 bg-white p-6 shadow-[0_24px_80px_rgba(15,23,42,0.10)] sm:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Iniciar sesion
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              No hay registro publico. Esta pantalla es solo para entrar al panel interno.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="correo@restaurante.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="********"
                required
              />
            </div>

            <Button type="submit" className="h-12 w-full rounded-2xl">
              Ingresar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-8 rounded-[28px] border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <Lock className="h-4 w-4" />
              Acceso de demostracion
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Si escribes un email con admin o super, entras al Super Admin. Si no, al panel restaurante.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
