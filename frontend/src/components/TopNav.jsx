import { NavLink } from "react-router-dom";
import Logo from "./Logo";
import { useAuth } from "../context/AuthContext";

const LINKS = [
  { to: "/home", label: "Today" },
  { to: "/menu", label: "Menu" },
  { to: "/plans", label: "My plan" },
  { to: "/orders", label: "Orders" },
];

export default function TopNav() {
  const { user } = useAuth();
  const initial = user?.full_name?.[0]?.toUpperCase() || "A";

  return (
    <div className="hidden md:flex bg-bottle text-white px-10 h-[68px] items-center gap-9">
      <Logo />
      <div className="flex gap-7 text-sm font-bold">
        {LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `py-1.5 border-b-[3px] ${
                isActive ? "border-saffron" : "border-transparent opacity-80"
              }`
            }
          >
            {link.label}
          </NavLink>
        ))}
      </div>
      <div className="ml-auto flex items-center gap-5">
        <div className="text-[13px]">
          <span className="opacity-80">Delivering to</span>{" "}
          <strong>{user?.delivery_point?.name || "Set your point"}</strong> ▾
        </div>
        <NavLink
          to="/profile"
          className="w-8 h-8 rounded-full bg-saffron flex items-center justify-center text-[13px] font-extrabold"
        >
          {initial}
        </NavLink>
      </div>
    </div>
  );
}
