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
      router.push("/super-admin/restaurantes");
      return;
    }

    router.push("/restaurant/dashboard");
  }

  return (
    <main className="min-h-screen p-4 sm:p-5 lg:p-6">
      <div className="grid min-h-[calc(100vh-2rem)] w-full items-stretch gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="relative overflow-hidden rounded-[36px] border border-slate-200/80 bg-white/85 p-8 shadow-[0_18px_60px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(15,23,42,0.05),_transparent_28%),radial-gradient(circle_at_bottom_left,_rgba(148,163,184,0.18),_transparent_32%)]" />
          <div className="relative z-10">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-white shadow-sm">
                <UtensilsCrossed className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-400">
                  Restaurant Growth SaaS
                </p>
                <h1 className="text-2xl font-semibold tracking-tight text-slate-950">
                  Acceso al panel interno
                </h1>
              </div>
            </div>

            <div className="mt-10 max-w-xl space-y-6">
              <div>
                <p className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
                  <Sparkles className="h-3.5 w-3.5" />
                  Sprint 1 visual listo para demo
                </p>
                <h2 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
                  La base premium para operar restaurantes multi-tenant.
                </h2>
                <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
                  Un sistema interno limpio, moderno y preparado para crecer con
                  Supabase Auth, PostgreSQL y Storage sin tocar todavía la lógica
                  real de reservas.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {[
                  "Panel Super Admin",
                  "Panel Restaurante",
                  "Roles y soporte",
                ].map((item) => (
                  <Card key={item} className="border-slate-200/80 bg-slate-50/70 shadow-none">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-slate-700">{item}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[36px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_60px_rgba(15,23,42,0.08)] sm:p-8">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
              Iniciar sesión
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              No hay registro público por ahora. Esta pantalla es solo para
              entrar al panel interno.
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
                placeholder="••••••••"
                required
              />
            </div>

            <Button type="submit" className="h-12 w-full rounded-2xl">
              Ingresar
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>

          <div className="mt-8 rounded-3xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-2 text-sm font-medium text-slate-900">
              <Lock className="h-4 w-4" />
              Acceso de demostración
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Si escribes un email con <span className="font-medium">admin</span>
              , entrarás al panel Super Admin. En cualquier otro caso se abre el
              panel restaurante.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
