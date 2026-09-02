import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { Card, DarkButton, OutlineButton } from "../components/ui";
import { money } from "../lib/format";

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [subscription, setSubscription] = useState(state?.subscription || null);
  const [error, setError] = useState("");

  // Route state is unavailable after a refresh, so restore the active plan from the API.
  useEffect(() => {
    if (subscription) return;
    api.mySubscription().then(setSubscription).catch((err) => setError(err.message));
  }, [subscription]);

  if (error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4 text-center">
        <div>
          <p className="text-warn font-semibold">We could not load your payment details.</p>
          <OutlineButton className="mt-4 px-6" onClick={() => navigate("/plans")}>Back to plans</OutlineButton>
        </div>
      </div>
    );
  }

  if (!subscription) {
    return <div className="min-h-screen bg-surface flex items-center justify-center text-mutedwarm">Loading payment confirmation…</div>;
  }

  const { plan } = subscription;
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div className="bg-bottle-dark text-white px-6 py-9 text-center md:py-14">
        <div className="w-16 h-16 rounded-full bg-saffron flex items-center justify-center text-3xl font-extrabold mx-auto mb-5">✓</div>
        <h1 className="text-2xl font-extrabold">Payment successful</h1>
        <p className="text-sm opacity-90 mt-2">Your {plan.name} plan is now active.</p>
      </div>

      <main className="flex-1 bg-surface px-4 py-4 max-w-md mx-auto w-full flex flex-col gap-3">
        <Card className="p-4 flex flex-col gap-3">
          <SummaryRow label="Plan" value={plan.name} />
          <SummaryRow label="Amount paid" value={money(plan.total_price)} />
          <SummaryRow label="Meals available" value={`${subscription.meals_left} meals`} />
          <SummaryRow label="Renews on" value={subscription.renews_on} />
        </Card>

        <div className="bg-[#E7EFEA] rounded-lg px-3 py-3 text-xs text-bottle leading-relaxed">
          Your meals are ready to use. You can pause your plan anytime before its next renewal.
        </div>

        <DarkButton onClick={() => navigate("/home")} className="mt-2">Back to home</DarkButton>
        <OutlineButton onClick={() => navigate("/plans")}>View my plan</OutlineButton>
      </main>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex justify-between text-[13px] gap-4">
      <span className="text-muted">{label}</span>
      <span className="font-extrabold text-right">{value}</span>
    </div>
  );
}
