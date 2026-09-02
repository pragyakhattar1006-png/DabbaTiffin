export function Card({ children, className = "" }) {
  return (
    <div className={`bg-white rounded-xl2 shadow-card ${className}`}>{children}</div>
  );
}

export function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      className={`bg-saffron text-white text-center py-4 rounded-lg font-extrabold disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function OutlineButton({ children, className = "", ...props }) {
  return (
    <button
      className={`border border-bottle text-bottle text-center py-3.5 rounded-lg font-extrabold disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function DarkButton({ children, className = "", ...props }) {
  return (
    <button
      className={`bg-bottle text-white text-center py-4 rounded-lg font-extrabold disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Notice({ children, className = "" }) {
  return (
    <div
      className={`bg-warnbg border border-dashed border-warnborder rounded-lg p-3 text-[12px] text-warntext leading-relaxed ${className}`}
    >
      {children}
    </div>
  );
}

export function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-11 h-[26px] rounded-full flex items-center p-[3px] transition-colors ${
        checked ? "bg-bottle justify-end" : "bg-line justify-start"
      }`}
    >
      <span className="w-5 h-5 rounded-full bg-white shadow" />
    </button>
  );
}

export function Field({ label, children }) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-[11px] font-bold text-muted tracking-wide">{label}</div>
      {children}
    </div>
  );
}

export function TextInput(props) {
  return (
    <input
      className="border border-line rounded-lg px-3 py-3.5 text-sm focus:outline-none focus:border-bottle bg-white"
      {...props}
    />
  );
}
