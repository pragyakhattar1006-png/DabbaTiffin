import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import AppShell from "../components/AppShell";
import { Card, PrimaryButton } from "../components/ui";
import { money } from "../lib/format";
import MockPaymentModal from "../components/MockPaymentModal";

export default function Plans() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState([]);
  const [mySub, setMySub] = useState(null);
  const [selected, setSelected] = useState(null);
  const [paymentMethod] = useState("card");
  const [showPayment, setShowPayment] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const load = async () => {
    const [planList, sub] = await Promise.all([api.plans(), api.mySubscription()]);
    setPlans(planList);
    setMySub(sub);
    const featured = planList.find((p) => p.featured) || planList[0];
    setSelected(featured?.id || null);
  };

  useEffect(() => {
    load();
  }, []);

  const selectedPlan = plans.find((p) => p.id === selected);

  const start = async () => {
    if (!selectedPlan) return;
    setBusy(true);
    setError("");
    try {
      if (paymentMethod === "wallet") {
        updateUser({ wallet_balance: Number(user.wallet_balance) - selectedPlan.total_price });
      }
      const sub = await api.startSubscription({ plan_id: selectedPlan.id, payment_method: paymentMethod });
      setMySub(sub);
      navigate("/payment-success", { state: { subscription: sub } });
    } catch (err) {
      setError(err.message || "Could not start plan");
      throw err;
    } finally {
      setBusy(false);
    }
  };

  const togglePause = async () => {
    if (!mySub) return;
    const updated = await api.pauseSubscription(!mySub.paused);
    setMySub(updated);
  };

  const pay = () => {
    if (selectedPlan) setShowPayment(true);
  };

  return (
    <AppShell>
      <div className="bg-bottle text-white px-5 pt-4 pb-5 md:px-10 md:py-7">
        <div className="text-lg md:text-2xl font-extrabold">Subscribe and stop deciding</div>
        <div className="text-xs md:text-sm opacity-90 mt-1">22 working days. Skip any day free.</div>
      </div>

      <div className="max-w-2xl mx-auto p-4 md:p-8 flex flex-col gap-3">
        {mySub && (
          <Card className="p-4 flex justify-between items-center">
            <div>
              <div className="text-sm font-extrabold">Active: {mySub.plan.name} plan</div>
              <div className="text-xs text-muted mt-1">
                {mySub.meals_left} meals left · renews {mySub.renews_on} {mySub.paused && "· paused"}
              </div>
            </div>
            <button
              onClick={togglePause}
              className="text-xs font-extrabold text-bottle border border-bottle rounded-md px-3 py-2"
            >
              {mySub.paused ? "Resume" : "Pause"}
            </button>
          </Card>
        )}

        {plans.map((plan) => {
          const isSelected = selected === plan.id;
          return (
            <Card
              key={plan.id}
              className={`p-4 relative ${plan.featured ? "border-2 border-bottle" : "border border-line"}`}
            >
              {plan.featured && (
                <div className="absolute -top-2.5 left-4 bg-saffron text-white text-[10px] font-extrabold px-2 py-1 rounded tracking-wide">
                  MOST PICKED
                </div>
              )}
              <button className="w-full flex gap-3 items-center text-left" onClick={() => setSelected(plan.id)}>
                <span
                  className={`w-4 h-4 rounded-full flex-none ${
                    isSelected ? "border-[5px] border-bottle" : "border-2 border-line"
                  }`}
                />
                <span className="flex-1">
                  <div className="text-[15px] font-extrabold">{plan.name}</div>
                  <div className="text-xs text-muted mt-0.5">
                    {plan.meals_count} meals · {money(plan.price_per_meal)} a meal
                  </div>
                </span>
                <span className="text-right">
                  <div className="text-[17px] font-extrabold">{money(plan.total_price)}</div>
                  <div className="text-[11px] text-good font-extrabold">save {money(plan.savings)}</div>
                </span>
              </button>

              {plan.featured && (
                <div className="mt-3.5 bg-[#F7F4F0] rounded-lg p-3 flex flex-col gap-2 text-xs text-ink">
                  <div>✓ Both meals confirmed each night unless skipped</div>
                  <div>✓ Same slot every day at your point</div>
                  <div>✓ Unused days roll into next cycle</div>
                  <div>✓ No fees, no surge, no packaging charge</div>
                </div>
              )}
            </Card>
          );
        })}

        <Card className="p-3.5 text-xs text-mutedwarm leading-relaxed border border-dashed border-line shadow-none">
          Prefer to decide daily? Pay per meal at menu price. Plans only lower the price.
        </Card>

        {error && <div className="text-sm text-warn font-semibold">{error}</div>}

        <div className="bg-cream/60 border border-saffron/40 rounded-lg p-3 text-[12px] text-bottle-dark leading-relaxed">
          <strong>Demo payment:</strong> use card 4242 4242 4242 4242 and OTP 123456 at checkout.
        </div>
        <PrimaryButton onClick={pay} disabled={busy || !selectedPlan} className="py-4 text-base">
          {busy ? "Starting…" : `Start plan · ${selectedPlan ? money(selectedPlan.total_price) : ""}`}
        </PrimaryButton>
        <div className="text-center text-xs text-muted">Cancel anytime before the next cycle</div>
      </div>
      {showPayment && selectedPlan && <MockPaymentModal amount={selectedPlan.total_price} onSuccess={start} onClose={() => setShowPayment(false)} />}
    </AppShell>
  );
}
