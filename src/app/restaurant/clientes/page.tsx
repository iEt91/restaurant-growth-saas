import { CustomersPanel } from "@/components/customers/customers-panel";
import { customers } from "@/data/mock";

export default function CustomersPage() {
  return <CustomersPanel customers={customers} />;
}
