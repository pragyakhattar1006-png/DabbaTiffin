import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { Card, PrimaryButton } from "../components/ui";
import { money, formatDateFull } from "../lib/format";
import { DishThumb } from "./Home";
import MockPaymentModal from "../components/MockPaymentModal";

export default function BookingReview() {
  const cart = useCart();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [showPayment, setShowPayment] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  if (cart.count === 0) return <Navigate to="/menu" replace />;

  const confirm = async (propagateError = false) => {
    setBusy(true);
    setError("");
    try {
      const items = [];
      if (cart.items.breakfast) items.push({ meal_type: "breakfast", daily_menu_id: cart.items.breakfast.id });
      if (cart.items.lunch) items.push({ meal_type: "lunch", daily_menu_id: cart.items.lunch.id });
      const booking = await api.createBooking({ date: cart.date, items, payment_method: paymentMethod });
      if (paymentMethod === "wallet") {
        updateUser({ wallet_balance: Number(user.wallet_balance) - booking.total_amount });
      }
      cart.clear();
      navigate(`/confirmation/${booking.id}`);
    } catch (err) {
      setError(err.message || "Could not confirm booking");
      if (propagateError) throw err;
    } finally {
      setBusy(false);
    }
  };

  const pay = () => {
    if (paymentMethod === "card") setShowPayment(true);
    else confirm();
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-bottle text-white px-5 pt-4 pb-5 md:px-10 md:py-6">
        <button onClick={() => navigate(-1)} className="text-xl font-extrabold">
          ← Review booking
        </button>
        <div className="text-sm opacity-90 mt-1">For {formatDateFull(cart.date)}</div>
      </div>

      <div className="max-w-md mx-auto px-4 py-4 flex flex-col gap-3">
        <Card className="p-3.5 flex flex-col gap-3">
          {["breakfast", "lunch"].map((mealType) => {
            const item = cart.items[mealType];
            if (!item) return null;
            return (
              <div key={mealType} className="flex gap-3 items-center">
                <div className="w-10 h-10 rounded-lg bg-canvas flex-none overflow-hidden">
                  <DishThumb name={item.dish.name} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-extrabold text-ink">{item.dish.name}</div>
                  <div className="text-xs text-muted capitalize">
                    {mealType} · {item.dish.description}
                  </div>
                </div>
                <div className="text-sm font-extrabold">{money(item.price)}</div>
              </div>
            );
          })}
        </Card>

        <Card className="p-4">
          <div className="text-xs font-extrabold text-muted tracking-wide mb-3">WHAT YOU PAY</div>
          <div className="flex flex-col gap-2.5 text-[13px] text-ink">
            <Row label={`${cart.count} meal${cart.count > 1 ? "s" : ""}`} value={money(cart.total)} bold />
            <Row label="Taxes" value="Included" bold />
            <Row label="Batch delivery" value="₹0" good />
            <Row label="Packaging" value="₹0" good />
            <Row label="Surge" value="Never" good />
            <div className="h-px bg-[#F0ECE7] my-0.5" />
            <div className="flex justify-between text-[17px] font-extrabold">
              <span>Total</span>
              <span>{money(cart.total)}</span>
            </div>
          </div>
          <div className="mt-3 bg-[#E7EFEA] rounded-lg px-3 py-2.5 text-xs text-bottle leading-relaxed">
            This is the amount charged. Menu price is the final price.
          </div>
        </Card>

        <Card className="p-4">
          <div className="text-xs font-extrabold text-muted tracking-wide mb-2.5">PAY WITH</div>
          <PaymentOption
            label="Card · demo payment"
            active={paymentMethod === "card"}
            onClick={() => setPaymentMethod("card")}
          />
          <PaymentOption
            label={`Tiffin wallet · ${money(user?.wallet_balance)}`}
            active={paymentMethod === "wallet"}
            onClick={() => setPaymentMethod("wallet")}
            disabled={Number(user?.wallet_balance || 0) < cart.total}
          />
        </Card>

        {error && <div className="text-sm text-warn font-semibold">{error}</div>}

        <PrimaryButton onClick={pay} disabled={busy} className="py-4 text-base">
          {busy ? "Confirming…" : `Pay ${money(cart.total)} and confirm`}
        </PrimaryButton>
        <div className="text-center text-xs text-muted">Skip either meal free until 24:00 tonight</div>
      </div>
      {showPayment && <MockPaymentModal amount={cart.total} onSuccess={() => confirm(true)} onClose={() => setShowPayment(false)} />}
    </div>
  );
}

function Row({ label, value, bold, good }) {
  return (
    <div className="flex justify-between">
      <span>{label}</span>
      <span className={`${bold ? "font-bold" : ""} ${good ? "text-good font-bold" : ""}`}>{value}</span>
    </div>
  );
}

function PaymentOption({ label, active, onClick, disabled }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="flex items-center gap-2.5 text-sm font-bold text-ink mt-2 first:mt-0 disabled:opacity-40"
    >
      <span
        className={`w-4 h-4 rounded-full flex-none ${active ? "border-[5px] border-bottle" : "border-2 border-line"}`}
      />
      {label}
    </button>
  );
}
