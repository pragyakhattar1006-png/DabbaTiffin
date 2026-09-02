import { useEffect, useState } from "react";
import { api } from "../api";
import AppShell from "../components/AppShell";
import { Card, Notice } from "../components/ui";

export default function Skip() {
  const [days, setDays] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(null);

  const load = () => api.ordersWeek().then(setDays).catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const act = async (orderId, action) => {
    setBusy(orderId);
    try {
      if (action === "skip") await api.skipOrder(orderId);
      else await api.undoSkip(orderId);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <AppShell>
      <div className="bg-bottle text-white px-5 pt-4 pb-5 md:px-10 md:py-7">
        <div className="text-lg md:text-2xl font-extrabold">← My week</div>
        <div className="text-xs md:text-sm opacity-90 mt-1">Travelling or eating out? Skip ahead.</div>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-8 flex flex-col gap-3">
        <Notice>
          Skips for the next day close at <strong>24:00</strong>. Skipped meals return to your wallet.
        </Notice>

        {error && <div className="text-sm text-warn font-semibold">{error}</div>}

        <Card className="py-1 overflow-hidden">
          {days.map((day, i) => {
            const bothSkipped = day.breakfast_status === "skipped" && day.lunch_status === "skipped";
            const noService = !day.service_available;
            return (
              <div
                key={day.date}
                className={`flex justify-between items-center px-4 py-3 ${
                  i < days.length - 1 ? "border-b border-[#F0ECE7]" : ""
                } ${bothSkipped ? "bg-[#FDF1E9]" : ""}`}
              >
                <div>
                  <div className={`text-sm font-extrabold ${bothSkipped ? "text-warn" : ""}`}>{day.label}</div>
                  <div className={`text-xs mt-0.5 ${bothSkipped ? "text-warn" : "text-muted"}`}>
                    {noService
                      ? "No service"
                      : !day.menu_open
                      ? "Menu not open yet"
                      : bothSkipped
                      ? "Both meals skipped"
                      : [day.breakfast_dish, day.lunch_dish].filter(Boolean).join(" · ") || "Nothing booked"}
                  </div>
                </div>
                {noService ? (
                  <span className="text-xs text-line font-bold">—</span>
                ) : !day.menu_open ? (
                  <span className="text-xs text-line font-bold">—</span>
                ) : (
                  <div className="flex gap-2">
                    <SkipButton
                      label="B"
                      status={day.breakfast_status}
                      orderId={day.breakfast_order_id}
                      busy={busy === day.breakfast_order_id}
                      onAct={act}
                    />
                    <SkipButton
                      label="L"
                      status={day.lunch_status}
                      orderId={day.lunch_order_id}
                      busy={busy === day.lunch_order_id}
                      onAct={act}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </Card>
      </div>
    </AppShell>
  );
}

function SkipButton({ label, status, orderId, busy, onAct }) {
  if (!orderId) {
    return (
      <span className="text-[11px] text-line font-bold border border-line rounded px-2 py-1.5">
        No {label}
      </span>
    );
  }
  if (status === "skipped") {
    return (
      <button
        disabled={busy}
        onClick={() => onAct(orderId, "undo")}
        className="text-[11px] font-extrabold text-warn border border-warnborder rounded px-2.5 py-1.5"
      >
        Undo
      </button>
    );
  }
  return (
    <button
      disabled={busy}
      onClick={() => onAct(orderId, "skip")}
      className="text-[11px] font-extrabold text-bottle border border-bottle rounded px-2.5 py-1.5"
    >
      Skip {label}
    </button>
  );
}
