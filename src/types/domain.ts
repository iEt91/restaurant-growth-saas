export type UserRole = "super_admin" | "owner" | "manager" | "employee";

export type RestaurantStatus = "activo" | "suspendido";

export type ReservationStatus =
  | "Pendiente"
  | "Confirmada"
  | "Ocupada"
  | "Completada"
  | "Cancelada"
  | "No-show";

export type TableStatus =
  | "Libre"
  | "Reservada"
  | "Ocupada"
  | "Fuera de servicio"
  | "Próxima reserva";

export interface Restaurant {
  id: string;
  name: string;
  logo: string;
  status: RestaurantStatus;
  branchesCount: number;
  monthlyPlan: string;
  ownerName: string;
  city: string;
  cuisine: string;
  activeSince: string;
}

export interface Branch {
  id: string;
  restaurantId: string;
  name: string;
  address: string;
  city: string;
  phone: string;
  openingHours: string;
}

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  restaurantId: string;
  branchId?: string;
  active: boolean;
}

export interface Reservation {
  id: string;
  guestName: string;
  phone: string;
  date: string;
  time: string;
  partySize: number;
  status: ReservationStatus;
  tableName: string;
  channel: string;
  notes?: string;
  vip?: boolean;
}

export interface TableConsumptionItem {
  id: string;
  reservationId: string;
  tableName: string;
  category:
    | "Entradas"
    | "Principales"
    | "Postres"
    | "Bebidas"
    | "Vinos"
    | "Tragos";
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  birthday: string;
  visits: number;
  totalSpent: number;
  averageTicket: number;
  preferences: string[];
  allergies: string[];
  lastVisit: string;
  reservations: string[];
  vip?: boolean;
}

export interface RestaurantTable {
  id: string;
  name: string;
  area: string;
  status: TableStatus;
  capacity: number;
  currentGuest?: string;
  reservationTime?: string;
  customerVisits?: number;
  averageTicket?: number;
  lastVisit?: string;
  preferences?: string[];
  allergies?: string[];
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface MenuItem {
  id: string;
  category:
    | "Entradas"
    | "Principales"
    | "Postres"
    | "Bebidas"
    | "Vinos"
    | "Tragos";
  name: string;
  description: string;
  image: string;
  price?: number;
  active: boolean;
}

export interface Promotion {
  id: string;
  title: string;
  description: string;
  startsAt: string;
  endsAt: string;
  active: boolean;
}

export interface AuditLog {
  id: string;
  actor: string;
  action: string;
  target: string;
  restaurantName: string;
  createdAt: string;
  severity: "low" | "medium" | "high";
}
