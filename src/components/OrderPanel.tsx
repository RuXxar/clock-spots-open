import { CheckCircle2, ListChecks } from "lucide-react";

export function OrderPanel({ order }: { order: string[] }) {
  return (
    <aside className="order-panel">
      <h2>
        <ListChecks size={16} />
        Order of Operations
      </h2>
      <ol>
        {order.map((item) => (
          <li key={item}>
            <CheckCircle2 size={15} />
            <span>{item}</span>
          </li>
        ))}
      </ol>
    </aside>
  );
}
