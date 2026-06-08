export const APP_VERSION = "v 1.2.1";

export const VERSION_HISTORY = [
  {
    version: APP_VERSION,
    date: "2026-06-08",
    notes: [
      "Contador de mesas ocupadas agregado al plano",
      "Plano de mesas sin modal automatico al entrar",
      "Reservas sincronizadas con estados de mesas",
      "Plano de mesas conectado al flujo de reservas",
      "Modal de vista con ficha premium y acciones rapidas",
      "Modal de edicion con flujo visible y acciones rapidas",
      "Anchos de columnas optimizados en reservas",
      "Tabla de reservas estabilizada con columnas fijas",
      "Acciones de reservas separadas por flujo y acciones",
      "Acciones rapidas y modal con scroll interno en reservas",
      "Reservas funcionales con estado local",
      "Horarios comerciales con bloques largos permitidos",
      "Base visual del SaaS multi-tenant",
      "Layout premium para restaurante y super admin",
    ],
  },
] as const;
