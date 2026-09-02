import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import AppShell from "../components/AppShell";
import { Card } from "../components/ui";
import { money, formatDateFull } from "../lib/format";

const STATUS_LABEL = {
  booked: "Confirmed",
  out_for_delivery: "Out for delivery",
  handed_over: "Handed over",
  skipped: "Skipped",
};

export default function Home() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [busySkip, setBusySkip] = useState(null);

  const load = () => api.home().then(setData).catch((e) => setError(e.message));

  useEffect(() => {
    load();
  }, []);

  const skip = async (orderId) => {
    setBusySkip(orderId);
    try {
      await api.skipOrder(orderId);
      await load();
    } catch (e) {
      setError(e.message);
    } finally {
      setBusySkip(null);
    }
  };

  if (!data) {
    return (
      <AppShell>
        <div className="p-6 text-mutedwarm">{error || "Loading your day…"}</div>
      </AppShell>
    );
  }

  const [todayBreakfast, todayLunch] = data.today;
  const [tomorrowBreakfast, tomorrowLunch] = data.tomorrow;

  return (
    <AppShell>
      <div className="bg-bottle text-white px-5 py-3.5 md:hidden">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-[11px] opacity-85 font-bold tracking-wide">DELIVERING TO</div>
            <div className="text-[15px] font-extrabold mt-0.5">{data.delivering_to} ▾</div>
          </div>
          <Link
            to="/profile"
            className="w-[34px] h-[34px] rounded-full bg-saffron flex items-center justify-center text-sm font-extrabold"
          >
            {user?.full_name?.[0]?.toUpperCase() || "A"}
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-10 grid md:grid-cols-[1fr_340px] gap-5 md:gap-6 items-start">
        <div className="flex flex-col gap-4">
          <div className="hidden md:flex justify-between items-end">
            <div>
              <div className="text-2xl font-extrabold text-ink">Today, {formatDateFull(data.today_date)}</div>
              <div className="text-sm text-mutedwarm mt-1">Two meals in the {data.delivering_to} batch</div>
            </div>
            {data.menu_live && (
              <div className="bg-saffron text-white text-xs font-extrabold px-3 py-2 rounded-md">
                TOMORROW&rsquo;S MENU IS LIVE
              </div>
            )}
          </div>

          <Card className="overflow-hidden">
            <div className="bg-bottle-dark text-white px-4 py-2.5 text-xs font-extrabold flex justify-between">
              <span>TODAY, {formatDateFull(data.today_date).toUpperCase()}</span>
              <span className="text-saffron">2 MEALS</span>
            </div>
            <TodayRow slot={todayBreakfast} onTrack={() => navigate(`/tracking/${todayBreakfast.order_id}`)} />
            <TodayRow
              slot={todayLunch}
              border={false}
              onTrack={() => navigate(`/tracking/${todayLunch.order_id}`)}
            />
          </Card>

          <Card className="p-4 flex flex-col gap-3">
            <div className="flex justify-between items-center">
              <div className="text-xs font-extrabold text-muted tracking-wide">
                TOMORROW, {formatDateFull(data.tomorrow_date).toUpperCase()}
              </div>
              {data.menu_live && (
                <div className="bg-saffron text-white text-[10px] font-extrabold px-2 py-1 rounded tracking-wide">
                  MENU LIVE
                </div>
              )}
            </div>

            <TomorrowRow
              slot={tomorrowBreakfast}
              onBook={() => navigate("/menu?meal=breakfast")}
              onSkip={() => skip(tomorrowBreakfast.order_id)}
              skipping={busySkip === tomorrowBreakfast.order_id}
            />
            <div className="h-px bg-[#F0ECE7]" />
            <TomorrowRow
              slot={tomorrowLunch}
              onBook={() => navigate("/menu?meal=lunch")}
              onSkip={() => skip(tomorrowLunch.order_id)}
              skipping={busySkip === tomorrowLunch.order_id}
            />

            <div className="bg-[#F7F4F0] rounded-lg px-3 py-2.5 text-xs text-mutedwarm leading-relaxed">
              Booking closes at <strong className="text-ink">{data.booking_closes_at}</strong> or when sold
              out. Skips allowed till {data.skip_closes_at}.
            </div>
            <Link to="/skip" className="text-xs font-extrabold text-bottle self-start">
              Manage the whole week →
            </Link>
          </Card>

          {error && <div className="text-sm text-warn font-semibold">{error}</div>}
        </div>

        <div className="flex flex-col gap-4">
          {data.subscription ? (
            <Card className="bg-gradient-to-b from-bottle to-bottle-dark text-white p-4 md:p-5 flex flex-col gap-2 shadow-none">
              <div className="text-[15px] md:text-base font-extrabold">
                {data.subscription.plan.name} plan · {data.subscription.plan.meals_count} days
              </div>
              <div className="text-xs opacity-85">
                {data.subscription.meals_left} meals left · renews {data.subscription.renews_on}
              </div>
              <Link
                to="/plans"
                className="mt-2 bg-saffron text-center py-2.5 rounded-md text-[13px] font-extrabold"
              >
                Manage plan
              </Link>
            </Card>
          ) : (
            <Card className="p-4 flex flex-col gap-2">
              <div className="text-[15px] font-extrabold text-ink">No active plan</div>
              <div className="text-xs text-muted">Subscribe and stop deciding every night.</div>
              <Link to="/plans" className="mt-2 border border-bottle text-bottle text-center py-2.5 rounded-md text-[13px] font-extrabold">
                See plans
              </Link>
            </Card>
          )}

          <div className="flex gap-2.5">
            <Card className="flex-1 p-3.5">
              <div className="text-xl font-extrabold text-bottle-dark">{money(data.spent_this_month)}</div>
              <div className="text-[11px] text-muted mt-0.5 font-bold">SPENT THIS MONTH</div>
            </Card>
            <Card className="flex-1 p-3.5">
              <div className="text-xl font-extrabold text-good">₹0</div>
              <div className="text-[11px] text-muted mt-0.5 font-bold">FEES OR SURGE</div>
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

function TodayRow({ slot, border = true, onTrack }) {
  const isDone = slot.status === "handed_over";
  return (
    <div className={`px-4 py-3.5 flex gap-3 items-center ${border ? "border-b border-[#F0ECE7]" : ""}`}>
      <div className="w-11 h-11 rounded-lg bg-[#F7E7D3] flex-none overflow-hidden">
        {slot.dish_name && <DishThumb name={slot.dish_name} />}
      </div>
      <div className="flex-1">
        <div className="text-sm font-extrabold text-ink">{slot.dish_name || "Not booked"}</div>
        <div className={`text-xs font-bold mt-0.5 ${isDone ? "text-good" : "text-bottle"}`}>
          {slot.status === "handed_over" && "Handed over"}
          {slot.status === "out_for_delivery" && `Out for delivery · ${slot.slot_window}`}
          {slot.status === "booked" && `Confirmed · ${slot.slot_window}`}
          {!slot.status && "Nothing booked for today"}
        </div>
      </div>
      {slot.status === "handed_over" && (
        <div className="text-[11px] font-extrabold text-good border border-good rounded px-2 py-1">DONE</div>
      )}
      {slot.status === "out_for_delivery" && (
        <button onClick={onTrack} className="text-xs font-extrabold text-bottle">
          Track
        </button>
      )}
    </div>
  );
}

function TomorrowRow({ slot, onBook, onSkip, skipping }) {
  const booked = slot.status === "booked";
  return (
    <div className="flex gap-3 items-center">
      <div className="w-10 h-10 rounded-lg bg-[#F0ECE7] flex-none overflow-hidden">
        {(slot.dish_name || slot.preview_dishes[0]) && (
          <DishThumb name={slot.dish_name || slot.preview_dishes[0]} />
        )}
      </div>
      <div className="flex-1">
        <div className="text-sm font-extrabold text-ink">
          <span className="capitalize">{slot.meal_type}</span> ·{" "}
          {slot.dish_name || slot.preview_dishes.join(" or ") || "not booked"}
        </div>
        <div className={`text-xs mt-0.5 ${booked ? "text-good font-bold" : "text-muted"}`}>
          {slot.note || (booked ? "Booked" : slot.status === "skipped" ? "Skipped" : "")}
        </div>
      </div>
      {booked && (
        <button
          onClick={onSkip}
          disabled={skipping}
          className="text-xs font-extrabold text-bottle border border-bottle rounded-md px-2.5 py-1.5"
        >
          {skipping ? "…" : "Skip"}
        </button>
      )}
      {!slot.status && (
        <button onClick={onBook} className="text-xs font-extrabold text-white bg-saffron rounded-md px-3 py-2">
          Book
        </button>
      )}
      {slot.status === "skipped" && <span className="text-xs font-bold text-muted">Skipped</span>}
    </div>
  );
}

export function DishThumb({ name, imageUrl }) {
  const slug = name
    ?.toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  const map = {
    "poha-with-sev": "poha",
    poha: "poha",
    upma: "upma",
    "idli-with-sambhar": "idli-sambhar",
    "sabudana-khichdi": "sabudana-khichdi",
    "misal-pav": "misal-pav",
    "rajma-chawal": "rajma-chawal",
    "chole-chawal": "chole-chawal",
    chole: "chole-chawal",
  };
  const file = map[slug];
  const src = imageUrl
    ? `${import.meta.env.BASE_URL}${imageUrl.replace(/^\//, "")}`
    : file
    ? `${import.meta.env.BASE_URL}dishes/${file}.jpg`
    : null;
  if (!src) return null;
  return (
    <img
      src={src}
      alt={name}
      className="w-full h-full object-cover"
    />
  );
}
