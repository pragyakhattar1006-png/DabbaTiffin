import TopNav from "./TopNav";
import BottomNav from "./BottomNav";

export default function AppShell({ children }) {
  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <TopNav />
      <div className="flex-1 pb-16 md:pb-0">{children}</div>
      <BottomNav />
    </div>
  );
}
