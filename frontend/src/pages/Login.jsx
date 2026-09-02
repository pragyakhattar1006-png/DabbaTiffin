import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Logo from "../components/Logo";
import { PrimaryButton, TextInput, Field } from "../components/ui";

const DEMO_EMAIL = "demo@dabbatiffin.in";
const DEMO_PASSWORD = "Dabba@123";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      await login(email, password);
      navigate("/home");
    } catch (err) {
      setError(err.message || "Could not log in");
    } finally {
      setBusy(false);
    }
  };

  const fillDemo = () => {
    setEmail(DEMO_EMAIL);
    setPassword(DEMO_PASSWORD);
  };

  return (
    <div className="min-h-screen bg-surface md:flex md:items-center md:justify-center">
      <div className="md:w-[1120px] md:rounded-xl md:shadow-phone md:overflow-hidden md:flex md:bg-white">
        <div className="bg-bottle text-white px-6 py-9 md:w-[480px] md:px-12 md:py-14 md:flex md:flex-col">
          <Logo size="lg" />
          <div className="mt-6 md:mt-auto">
            <div className="text-[26px] md:text-[36px] font-extrabold leading-tight tracking-tight">
              Your everyday
              <br />
              breakfast and lunch
            </div>
            <div className="text-sm md:text-base opacity-90 mt-3 leading-relaxed max-w-[400px]">
              Book a night before. Full price upfront. Delivered to your PG, campus or office.
            </div>
            <div className="hidden md:flex gap-7 mt-9">
              <Stat value="₹45" label="A BREAKFAST" />
              <Stat value="8:15" label="FIXED SLOT" />
              <Stat value="₹0" label="DELIVERY FEE" />
            </div>
          </div>
        </div>

        <div className="px-6 py-8 md:flex-1 md:px-20 md:py-14 md:flex md:flex-col md:justify-center">
          <div className="bg-white rounded-xl2 shadow-card p-5 md:p-0 md:shadow-none flex flex-col gap-4 -mt-8 md:mt-0">
            <div className="text-[17px] md:text-[26px] font-extrabold text-ink">Log in</div>

            <div className="bg-cream/60 border border-saffron/40 rounded-lg p-3 text-[12px] text-bottle-dark leading-relaxed">
              <strong>Demo account:</strong> {DEMO_EMAIL} / {DEMO_PASSWORD}{" "}
              <button type="button" onClick={fillDemo} className="ml-1 font-extrabold text-saffron underline">
                Use it
              </button>
            </div>

            <form onSubmit={submit} className="flex flex-col gap-4">
              <Field label="EMAIL">
                <TextInput
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </Field>
              <Field label="PASSWORD">
                <div className="relative">
                  <TextInput
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pr-16"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-bottle"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </Field>
              {error && <div className="text-sm text-warn font-semibold">{error}</div>}
              <PrimaryButton type="submit" disabled={busy}>
                {busy ? "Logging in…" : "Log in"}
              </PrimaryButton>
            </form>

            <div className="text-center text-sm text-muted">
              New here?{" "}
              <Link to="/signup" className="text-bottle font-extrabold">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({ value, label }) {
  return (
    <div>
      <div className="text-xl font-extrabold text-saffron">{value}</div>
      <div className="text-xs opacity-85 font-bold mt-0.5">{label}</div>
    </div>
  );
}
