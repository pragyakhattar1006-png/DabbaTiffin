import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import AppShell from "../components/AppShell";
import { Card, OutlineButton, Toggle } from "../components/ui";

export default function Profile() {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();

  const toggleVeg = async () => {
    const updated = await api.updateMe({ veg_only: !user.veg_only });
    updateUser(updated);
  };

  const toggleReminder = async () => {
    const updated = await api.updateMe({ menu_reminder: !user.menu_reminder });
    updateUser(updated);
  };

  const signOut = () => {
    logout();
    navigate("/login");
  };

  if (!user) return null;

  return (
    <AppShell>
      <div className="bg-bottle text-white px-5 py-5 md:px-10 md:py-8 flex gap-3.5 items-center">
        <div className="w-[52px] h-[52px] rounded-full bg-saffron flex items-center justify-center text-xl font-extrabold flex-none">
          {user.full_name[0]?.toUpperCase()}
        </div>
        <div>
          <div className="text-lg font-extrabold">{user.full_name}</div>
          <div className="text-xs opacity-90 mt-0.5">{user.email}</div>
        </div>
      </div>

      <div className="max-w-md mx-auto p-4 flex flex-col gap-3">
        <Card className="overflow-hidden">
          <div className="px-4 py-3.5 border-b border-[#F0ECE7]">
            <div className="text-[11px] font-extrabold text-muted tracking-wide">DELIVERY POINT</div>
            <div className="text-sm font-extrabold mt-1">
              {user.delivery_point?.name} · {user.delivery_point?.handover_type}
            </div>
          </div>
          <button
            onClick={() => navigate("/delivery-point")}
            className="w-full px-4 py-3.5 border-b border-[#F0ECE7] flex justify-between items-center text-left"
          >
            <div className="text-sm font-bold">Change delivery point</div>
            <span className="text-line">›</span>
          </button>
          <div className="px-4 py-3.5 border-b border-[#F0ECE7] flex justify-between items-center">
            <div>
              <div className="text-sm font-extrabold">Veg only</div>
              <div className="text-xs text-muted mt-0.5">Egg and chicken in a later phase</div>
            </div>
            <Toggle checked={user.veg_only} onChange={toggleVeg} />
          </div>
          <div className="px-4 py-3.5 flex justify-between items-center">
            <div>
              <div className="text-sm font-extrabold">Menu reminder</div>
              <div className="text-xs text-muted mt-0.5">Nudge at 19:00 when the menu opens</div>
            </div>
            <Toggle checked={user.menu_reminder} onChange={toggleReminder} />
          </div>
        </Card>

        <Card className="overflow-hidden">
          {["Payment methods", "My plan and billing", "Kitchen and hygiene reports", "Help and support"].map(
            (label, i, arr) => (
              <div
                key={label}
                className={`px-4 py-3.5 text-sm font-bold flex justify-between ${
                  i < arr.length - 1 ? "border-b border-[#F0ECE7]" : ""
                }`}
              >
                {label} <span className="text-line">›</span>
              </div>
            )
          )}
        </Card>

        <OutlineButton onClick={signOut} className="border-line text-muted">
          Log out
        </OutlineButton>
      </div>
    </AppShell>
  );
}
