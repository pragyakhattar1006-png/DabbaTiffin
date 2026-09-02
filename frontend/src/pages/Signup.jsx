import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Card, Field, PrimaryButton, TextInput } from "../components/ui";

export default function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    mobile: "+91 ",
    veg_only: true,
  });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signup(form);
      navigate("/delivery-point");
    } catch (err) {
      setError(err.message || "Could not create account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-bottle-dark text-white px-5 py-6 md:px-10">
        <button onClick={() => navigate(-1)} className="text-xl font-extrabold flex items-center gap-2">
          ← Create account
        </button>
        <div className="text-sm opacity-90 mt-1">Two minutes, then you are on the menu</div>
      </div>

      <div className="max-w-md mx-auto px-5 py-6 flex flex-col gap-4">
        <Card className="p-5 flex flex-col gap-4">
          <Field label="FULL NAME">
            <TextInput required value={form.full_name} onChange={set("full_name")} placeholder="Aarav Kulkarni" />
          </Field>
          <Field label="EMAIL">
            <TextInput
              type="email"
              required
              value={form.email}
              onChange={set("email")}
              placeholder="aarav.k@example.com"
            />
          </Field>
          <Field label="PASSWORD">
            <TextInput
              type="password"
              required
              minLength={6}
              value={form.password}
              onChange={set("password")}
              placeholder="8+ characters, one number"
            />
            <div className="text-[11px] text-muted">8+ characters, one number</div>
          </Field>
          <Field label="MOBILE (FOR HANDOVER)">
            <TextInput required value={form.mobile} onChange={set("mobile")} placeholder="+91 98765 43210" />
          </Field>
        </Card>

        <Card className="p-4 flex gap-3 items-start">
          <button
            type="button"
            onClick={() => setForm((f) => ({ ...f, veg_only: !f.veg_only }))}
            className={`w-5 h-5 rounded flex-none flex items-center justify-center text-white text-xs font-extrabold ${
              form.veg_only ? "bg-bottle" : "bg-line"
            }`}
          >
            {form.veg_only ? "✓" : ""}
          </button>
          <div className="text-[13px] text-ink leading-relaxed">
            Keep me on <strong>veg only</strong> meals. Egg and chicken arrive in a later phase.
          </div>
        </Card>

        {error && <div className="text-sm text-warn font-semibold">{error}</div>}

        <PrimaryButton onClick={submit} disabled={busy}>
          {busy ? "Creating account…" : "Continue"}
        </PrimaryButton>
        <div className="text-center text-sm text-muted">
          Already have an account?{" "}
          <Link to="/login" className="text-bottle font-extrabold">
            Log in
          </Link>
        </div>
      </div>
    </div>
  );
}
