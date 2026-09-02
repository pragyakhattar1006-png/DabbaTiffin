import { NavLink } from "react-router-dom";

const TABS = [
  { to: "/home", label: "Home" },
  { to: "/menu", label: "Menu" },
  { to: "/plans", label: "Plan" },
  { to: "/orders", label: "Orders" },
  { to: "/profile", label: "Profile" },
];

export default function BottomNav() {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-canvas flex items-center z-20">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `flex-1 text-center text-[11px] font-extrabold ${
              isActive ? "text-bottle" : "text-line"
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}
