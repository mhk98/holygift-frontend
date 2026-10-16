import Link from "next/link";

const topLinks = [
  { label: "Login / Sign Up", href: "/login" },
  { label: "Order Track", href: "/track-order" },
  { label: "Contact Us", href: "/contact" },
];

interface Props {
  text?: string | null;
}

export default function MarqueeBanner({ text }: Props) {
  if (!text?.trim()) return null;

  // Duplicate text so the marquee scrolls continuously
  const display = text + "   ★   " + text + "   ★   ";
  return (
    <div
      className="hidden sm:flex items-center"
      style={{ background: "#111111", height: 50 }}
    >
      <div style={{ width: "90%", margin: "0 auto" }} className="flex items-center justify-between gap-4 overflow-hidden">
        {/* Scrolling marquee text */}
        <div className="flex-1 overflow-hidden">
          <div className="flex whitespace-nowrap animate-marquee">
            <span className="text-white font-medium" style={{ fontSize: 13 }}>
              {display}
            </span>
          </div>
        </div>

        {/* Right links — white bordered buttons */}
        <div className="flex items-center gap-1 shrink-0">
          {topLinks.map(({ label, href }) => (
            <Link
              key={label}
              href={href}
              className="text-white font-medium flex items-center justify-center rounded transition-colors hover:bg-[#256429]"
              style={{
                fontSize: 12,
                border: "2px solid hsla(0,0%,100%,0.5)",
                borderRadius: 5,
                height: 30,
                padding: "0 8px",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
