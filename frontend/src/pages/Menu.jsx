import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { api } from "../api";
import { useCart } from "../context/CartContext";
import AppShell from "../components/AppShell";
import { Card, Notice, PrimaryButton } from "../components/ui";
import { money, formatDateFull } from "../lib/format";
import { DishThumb } from "./Home";

function tomorrowISO() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export default function Menu() {
  const [params, setParams] = useSearchParams();
  const mealType = params.get("meal") === "lunch" ? "lunch" : "breakfast";
  const navigate = useNavigate();
  const cart = useCart();
  const date = useMemo(tomorrowISO, []);

  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    api
      .menu(date, mealType)
      .then(setMenu)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [date, mealType]);

  const selectedForMeal = cart.items[mealType];

  const toggleAdd = (item) => {
    if (selectedForMeal?.id === item.id) {
      cart.setItem(mealType, null, date);
    } else {
      cart.setItem(mealType, item, date);
    }
  };

  return (
    <AppShell>
      <div className="bg-bottle text-white px-5 pt-4 pb-0 md:px-10 md:pt-6">
        <div className="text-lg md:text-2xl font-extrabold">Menu for {formatDateFull(date)}</div>
        <div className="text-xs md:text-sm opacity-90 mt-1">Veg only at launch · rotating daily menu</div>
        <div className="flex gap-6 mt-3.5">
          {["breakfast", "lunch"].map((m) => (
            <button
              key={m}
              onClick={() => setParams({ meal: m })}
              className={`text-sm font-extrabold pb-2.5 capitalize ${
                mealType === m ? "border-b-[3px] border-saffron" : "opacity-70"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-4 md:p-8 flex flex-col gap-3 pb-28">
        <Notice className="bg-[#E7EFEA] border-0 text-bottle">
          <strong>Veg only</strong> at launch. Cooked that morning, assembled at your point.
        </Notice>

        {error && <div className="text-sm text-warn font-semibold">{error}</div>}
        {loading && <div className="text-sm text-mutedwarm">Loading menu…</div>}

        <div className="grid md:grid-cols-3 gap-4">
          {menu.map((item) => {
            const isSelected = selectedForMeal?.id === item.id;
            return (
              <Card
                key={item.id}
                className={`p-3.5 flex gap-3 md:flex-col md:p-0 md:overflow-hidden ${
                  isSelected ? "border-2 border-bottle" : "border border-transparent"
                } ${item.sold_out ? "opacity-55" : ""}`}
              >
                <div className="w-[74px] h-[74px] md:w-full md:h-[118px] rounded-lg md:rounded-none bg-canvas flex-none overflow-hidden">
                  <DishThumb name={item.dish.name} imageUrl={item.dish.image_url} />
                </div>
                <div className="flex-1 md:p-3.5">
                  <div className="text-[15px] font-extrabold text-ink">{item.dish.name}</div>
                  <div className="text-xs text-muted mt-1 leading-snug">
                    {item.sold_out ? `Sold out for ${date}` : `${item.dish.description} · ${item.dish.kcal} kcal`}
                  </div>
                  <div className="flex justify-between items-center mt-2.5">
                    <div className="text-base font-extrabold text-ink">
                      {money(item.price)} {!item.sold_out && <span className="text-[11px] text-muted font-bold">all in</span>}
                    </div>
                    <button
                      disabled={item.sold_out}
                      onClick={() => toggleAdd(item)}
                      className={
                        item.sold_out
                          ? "border border-line text-line text-xs font-extrabold px-3.5 py-1.5 rounded-md"
                          : isSelected
                          ? "bg-saffron text-white text-xs font-extrabold px-4 py-1.5 rounded-md"
                          : "border border-bottle text-bottle text-xs font-extrabold px-5 py-1.5 rounded-md"
                      }
                    >
                      {item.sold_out ? "Sold out" : isSelected ? "Added" : "Add"}
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {cart.count > 0 && (
        <div className="fixed bottom-16 md:bottom-0 left-0 right-0 bg-white border-t border-canvas px-5 py-3 flex items-center gap-3 z-10">
          <div className="flex-1">
            <div className="text-base font-extrabold text-ink">{money(cart.total)}</div>
            <div className="text-[11px] text-good font-bold">Final price, nothing added later</div>
          </div>
          <PrimaryButton onClick={() => navigate("/booking")} className="px-7 py-3.5">
            Review
          </PrimaryButton>
        </div>
      )}
    </AppShell>
  );
}
