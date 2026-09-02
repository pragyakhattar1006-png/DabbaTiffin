export default function Logo({ size = "md", onDark = true }) {
  const boxSize = size === "lg" ? "w-9 h-9" : "w-7 h-7";
  const textSize = size === "lg" ? "text-2xl" : "text-lg";
  return (
    <div className="flex items-center gap-2.5">
      <div className={`${boxSize} rounded-[9px] bg-saffron flex-none`} />
      <div className={`${textSize} font-extrabold ${onDark ? "text-white" : "text-bottle-dark"}`}>
        Dabba<span className={onDark ? "text-cream" : "text-saffron"}>Tiffin</span>
      </div>
    </div>
  );
}
