import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api";
import { Card, DarkButton, Notice, OutlineButton } from "../components/ui";
import { money } from "../lib/format";

export default function Confirmation() {
  const { bookingId } = useParams();
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getBooking(bookingId).then(setBooking).catch((e) => setError(e.message));
  }, [bookingId]);

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center text-warn">{error}</div>
    );
  }
  if (!booking) {
    return <div className="min-h-screen bg-surface flex items-center justify-center text-mutedwarm">Loading…</div>;
  }

  const breakfast = booking.meals.find((m) => m.meal_type === "breakfast");
  const lunch = booking.meals.find((m) => m.meal_type === "lunch");

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-bottle-dark text-white px-6 py-9 text-center md:py-14">
        <div className="w-16 h-16 rounded-full bg-saffron flex items-center justify-center text-3xl font-extrabold mx-auto mb-5">
          ✓
        </div>
        <div className="text-2xl font-extrabold">Tomorrow is sorted</div>
        <div className="text-sm opacity-90 mt-2 leading-relaxed max-w-sm mx-auto">
          {breakfast && lunch
            ? "Breakfast and lunch are"
            : breakfast
            ? "Breakfast is"
            : "Lunch is"}{" "}
          in the {booking.date} batch.
        </div>
      </div>

      <div className="flex-1 bg-surface px-4 py-4 max-w-md mx-auto w-full flex flex-col gap-3">
        <Card className="p-4 flex flex-col gap-3">
          <SummaryRow label="Booking code" value={booking.booking_code} />
          <SummaryRow label="Batch" value={booking.batch_code} />
          {breakfast && <SummaryRow label="Breakfast slot" value={breakfast.slot_window} />}
          {lunch && <SummaryRow label="Lunch slot" value={lunch.slot_window} />}
          <SummaryRow label="Paid" value={`${money(booking.total_amount)} · ${booking.payment_method.toUpperCase()}`} />
        </Card>

        <Notice>
          Changed your mind? Skip either meal free until <strong>24:00</strong> tonight and the amount
          returns to your wallet.
        </Notice>

        <Card className="p-4">
          <div className="text-sm font-extrabold text-ink">Make it automatic</div>
          <div className="text-xs text-muted mt-1 leading-relaxed">
            A breakfast plan books every weekday for you at ₹45 a meal.
          </div>
          <Link to="/plans" className="mt-3 block">
            <OutlineButton className="w-full">See plans</OutlineButton>
          </Link>
        </Card>

        <DarkButton onClick={() => navigate("/home")} className="mt-2">
          Back to home
        </DarkButton>
      </div>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between text-[13px]">
      <span className="text-muted">{label}</span>
      <span className="font-extrabold">{value}</span>
    </div>
  );
}
