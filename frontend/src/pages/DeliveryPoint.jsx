import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../context/AuthContext";
import { Card, Notice, PrimaryButton, TextInput } from "../components/ui";

export default function DeliveryPoint() {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [points, setPoints] = useState([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.deliveryPoints().then((data) => {
      setPoints(data);
      const featured = data.find((p) => p.featured) || data[0];
      setSelected(featured?.id || null);
    });
  }, []);

  const filtered = points.filter((p) =>
    `${p.name} ${p.area}`.toLowerCase().includes(query.toLowerCase())
  );

  const confirm = async () => {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const user = await api.updateMe({ delivery_point_id: selected });
      updateUser(user);
      navigate("/home");
    } catch (err) {
      setError(err.message || "Could not set delivery point");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface">
      <div className="bg-bottle-dark text-white px-5 pt-5 pb-5 md:px-10">
        <div className="text-xl font-extrabold">← Where do you eat?</div>
        <div className="text-sm opacity-90 mt-1">DabbaTiffin delivers in batches to fixed points</div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search hostel, PG, campus or office"
          className="mt-3.5 w-full bg-white rounded-lg px-3 py-3 text-sm text-ink focus:outline-none"
        />
      </div>

      <div className="h-24 md:h-16 bg-[repeating-linear-gradient(135deg,#EDE8E2_0px,#EDE8E2_10px,#F0ECE7_10px,#F0ECE7_20px)] flex items-center justify-center border-b border-line">
        <div className="font-mono text-[11px] text-mutedwarm tracking-wide">
          [ map of nearby delivery points — GPS not required, pick your point below ]
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-5 py-5 flex flex-col gap-3">
        <div className="text-[11px] font-extrabold text-muted tracking-wide">NEAR YOU</div>

        {filtered.map((point) => {
          const isSelected = selected === point.id;
          return (
            <button
              key={point.id}
              type="button"
              onClick={() => setSelected(point.id)}
              className={`text-left bg-white rounded-xl2 p-3.5 flex gap-3 items-start ${
                isSelected ? "border-2 border-bottle" : "border border-line"
              }`}
            >
              <div
                className={`w-[18px] h-[18px] rounded-full flex-none mt-0.5 ${
                  isSelected ? "border-[5px] border-bottle" : "border-2 border-line"
                }`}
              />
              <div className="flex-1">
                <div className="text-[15px] font-extrabold text-ink">{point.name}</div>
                <div className="text-xs text-muted mt-0.5">
                  {point.area} · {point.distance_label} · {point.handover_type}
                </div>
                <div className="flex gap-2 mt-2.5 flex-wrap">
                  {point.breakfast_available && (
                    <span className="bg-[#E7EFEA] text-bottle text-[11px] font-extrabold px-2.5 py-1.5 rounded">
                      Breakfast {point.breakfast_window}
                    </span>
                  )}
                  {point.lunch_available && (
                    <span className="bg-[#E7EFEA] text-bottle text-[11px] font-extrabold px-2.5 py-1.5 rounded">
                      Lunch {point.lunch_window}
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}

        <Notice>
          Not listed? Ask your PG or office admin to add a point. We open one at 15 confirmed orders.
        </Notice>

        {error && <div className="text-sm text-warn font-semibold">{error}</div>}

        <PrimaryButton onClick={confirm} disabled={busy || !selected} className="mt-2">
          {busy ? "Saving…" : "Set as my point"}
        </PrimaryButton>
      </div>
    </div>
  );
}
