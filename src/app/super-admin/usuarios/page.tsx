import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { users } from "@/data/mock";

const roleLabel: Record<string, string> = {
  super_admin: "Super Admin",
  owner: "Dueño",
  manager: "Gerente",
  employee: "Empleado",
};

export default function UsersPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Usuarios</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {users.map((user) => (
          <div key={user.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-medium text-slate-950">{user.fullName}</p>
              <p className="mt-1 text-sm text-slate-500">{user.email}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="secondary">{roleLabel[user.role]}</Badge>
              <Badge variant={user.active ? "success" : "danger"}>
                {user.active ? "Activo" : "Inactivo"}
              </Badge>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
