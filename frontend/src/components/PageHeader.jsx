import { useNavigate } from "react-router-dom";

export default function PageHeader({ title, subtitle, dark = false, onBack, right }) {
  const navigate = useNavigate();
  return (
    <div className={`${dark ? "bg-bottle-dark" : "bg-bottle"} text-white px-5 pt-4 pb-5 md:px-10 md:py-6`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => (onBack ? onBack() : navigate(-1))}
            className="flex items-center gap-2 text-xl font-extrabold"
          >
            <span aria-hidden>←</span> {title}
          </button>
          {subtitle && <div className="text-sm opacity-90 mt-1">{subtitle}</div>}
        </div>
        {right}
      </div>
    </div>
  );
}
