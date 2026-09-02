import { useState } from "react";
import { Field, OutlineButton, PrimaryButton, TextInput } from "./ui";
import { money } from "../lib/format";

export const DEMO_CARD = {
  number: "4242 4242 4242 4242",
  expiry: "12/30",
  cvv: "123",
  otp: "123456",
};

// A deliberately local-only payment screen. It does not contact a bank or store card data.
export default function MockPaymentModal({ amount, onSuccess, onClose }) {
  const [step, setStep] = useState("card");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "" });
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const useDemo = () => {
    setCard({ number: DEMO_CARD.number, expiry: DEMO_CARD.expiry, cvv: DEMO_CARD.cvv });
    setOtp(DEMO_CARD.otp);
    setError("");
  };

  const continueToOtp = (event) => {
    event.preventDefault();
    const number = card.number.replace(/\s/g, "");
    if (number !== "4242424242424242" || card.expiry !== DEMO_CARD.expiry || card.cvv !== DEMO_CARD.cvv) {
      setError("Use the demo card details shown above to continue.");
      return;
    }
    setError("");
    setStep("otp");
  };

  const verifyOtp = async (event) => {
    event.preventDefault();
    if (otp !== DEMO_CARD.otp) {
      setError("That OTP is not valid. Use the demo OTP shown above.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await onSuccess();
      onClose();
    } catch (err) {
      setError(err.message || "Payment could not be completed");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 flex items-end sm:items-center justify-center sm:p-4" role="dialog" aria-modal="true" aria-labelledby="mock-payment-title">
      <div className="bg-surface w-full max-w-md rounded-t-xl2 sm:rounded-xl2 shadow-phone overflow-hidden">
        <div className="bg-bottle text-white px-5 py-4 flex items-start justify-between">
          <div>
            <div id="mock-payment-title" className="text-lg font-extrabold">Demo card payment</div>
            <div className="text-xs opacity-85 mt-0.5">No money will be charged</div>
          </div>
          <button type="button" onClick={onClose} disabled={busy} className="text-2xl leading-none opacity-90" aria-label="Close payment">×</button>
        </div>

        <div className="p-5 flex flex-col gap-4">
          <div className="bg-cream/60 border border-saffron/40 rounded-lg p-3 text-[12px] text-bottle-dark leading-relaxed">
            <strong>Demo details:</strong> Card {DEMO_CARD.number} · Expiry {DEMO_CARD.expiry} · CVV {DEMO_CARD.cvv} · OTP {DEMO_CARD.otp}
            <button type="button" onClick={useDemo} className="ml-1 font-extrabold text-saffron underline">Use it</button>
          </div>

          <div className="flex justify-between items-center text-sm font-extrabold text-ink">
            <span>{step === "card" ? "Enter card details" : "Verify OTP"}</span>
            <span>{money(amount)}</span>
          </div>

          {step === "card" ? (
            <form onSubmit={continueToOtp} className="flex flex-col gap-3">
              <Field label="CARD NUMBER">
                <TextInput required inputMode="numeric" autoComplete="cc-number" value={card.number} onChange={(e) => setCard((current) => ({ ...current, number: e.target.value }))} placeholder="4242 4242 4242 4242" />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="EXPIRY">
                  <TextInput required value={card.expiry} onChange={(e) => setCard((current) => ({ ...current, expiry: e.target.value }))} placeholder="MM/YY" />
                </Field>
                <Field label="CVV">
                  <TextInput required inputMode="numeric" value={card.cvv} onChange={(e) => setCard((current) => ({ ...current, cvv: e.target.value }))} placeholder="123" />
                </Field>
              </div>
              {error && <div className="text-sm text-warn font-semibold">{error}</div>}
              <PrimaryButton type="submit">Continue to OTP</PrimaryButton>
              <OutlineButton type="button" onClick={onClose}>Cancel</OutlineButton>
            </form>
          ) : (
            <form onSubmit={verifyOtp} className="flex flex-col gap-3">
              <div className="text-xs text-muted">An OTP was sent to your demo phone number.</div>
              <Field label="ONE-TIME PASSWORD">
                <TextInput required inputMode="numeric" maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="123456" />
              </Field>
              {error && <div className="text-sm text-warn font-semibold">{error}</div>}
              <PrimaryButton type="submit" disabled={busy}>{busy ? "Verifying…" : `Pay ${money(amount)}`}</PrimaryButton>
              <OutlineButton type="button" onClick={() => { setStep("card"); setError(""); }} disabled={busy}>Back to card</OutlineButton>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
