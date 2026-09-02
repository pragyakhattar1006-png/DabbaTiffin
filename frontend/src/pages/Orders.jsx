import { useEffect, useState } from "react";
import { api } from "../api";
import AppShell from "../components/AppShell";
import { Card, OutlineButton } from "../components/ui";
import { money, formatDateLabel } from "../lib/format";
import { DishThumb } from "./Home";

const STATUS_TEXT = {
  booked: "confirmed",
  out_for_delivery: "out for delivery",
  handed_over: "on time",
  skipped: "skipped",
};

export default function Orders() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.ordersHistory().then(setData).catch((e) => setError(e.message));
  }, []);

  if (!data) {
    return (
      <AppShell>
        <div className="p-6 text-mutedwarm">{error || "Loading orders…"}</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="bg-bottle text-white px-5 pt-4 pb-5 md:px-10 md:py-7">
        <div className="text-lg md:text-2xl font-extrabold">Orders</div>
        <div className="flex gap-3 mt-3.5 max-w-md">
          <div className="bg-white/15 rounded-lg p-3 flex-1">
            <div className="text-lg font-extrabold">{money(data.spent_this_month)}</div>
            <div className="text-[11px] opacity-85 font-bold mt-0.5">THIS MONTH</div>
          </div>
          <div className="bg-white/15 rounded-lg p-3 flex-1">
            <div className="text-lg font-extrabold">{data.meals_eaten_this_month}</div>
            <div className="text-[11px] opacity-85 font-bold mt-0.5">MEALS EATEN</div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-8 flex flex-col gap-3">
        <Card className="overflow-hidden">
          {data.orders.map((order, i) => (
            <div
              key={order.id}
              className={`px-4 py-3.5 flex gap-3 items-center ${
                i < data.orders.length - 1 ? "border-b border-[#F0ECE7]" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-lg bg-canvas flex-none overflow-hidden">
                <DishThumb name={order.dish_name} />
              </div>
              <div className="flex-1">
                <div className={`text-sm font-extrabold ${order.status === "skipped" ? "text-muted" : "text-ink"}`}>
                  {order.status === "skipped" ? `${order.meal_type} skipped` : order.dish_name}
                </div>
                <div className={`text-xs mt-0.5 ${order.status === "skipped" ? "text-good" : "text-muted"}`}>
                  {formatDateLabel(order.date)} · {order.meal_type} ·{" "}
                  {order.status === "skipped" ? "refunded to wallet" : STATUS_TEXT[order.status]}
                </div>
              </div>
              <div className={`text-sm font-extrabold ${order.status === "skipped" ? "text-good" : "text-ink"}`}>
                {order.status === "skipped" ? `+${money(order.price)}` : money(order.price)}
              </div>
            </div>
          ))}
          {data.orders.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-muted">No orders yet — book tomorrow's menu.</div>
          )}
        </Card>

        <Card className="p-4 flex justify-between items-center">
          <div>
            <div className="text-sm font-extrabold">Tiffin wallet</div>
            <div className="text-xs text-muted mt-0.5">From skipped meals</div>
          </div>
          <div className="text-lg font-extrabold text-bottle-dark">{money(data.wallet_balance)}</div>
        </Card>

        <Card className="p-4 text-[13px] text-mutedwarm leading-relaxed">
          Mess average in your area is ₹3,000–4,000 a month. You are at{" "}
          <strong className="text-ink">{money(data.spent_this_month)}</strong> so far.
        </Card>

        <OutlineButton>Download invoices</OutlineButton>
      </div>
    </AppShell>
  );
}
