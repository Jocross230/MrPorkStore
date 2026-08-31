import { useState } from "react";
import { useCart } from "../lib/CartContext";

type Section = "home" | "pork" | "chicken" | "sell-pig" | "airtime";

interface NavbarProps {
  currentSection: Section;
  onNavigate: (s: Section) => void;
  onAdminClick: () => void;
  onCartClick: () => void;
}

const links: { label: string; section: Section }[] = [
  { label: "Pig Market", section: "pork" },
  { label: "Chicken Market", section: "chicken" },
  { label: "Sell Your Pig", section: "sell-pig" },
  { label: "Data & Airtime", section: "airtime" },
];

export default function Navbar({ currentSection, onNavigate, onAdminClick, onCartClick }: NavbarProps) {
  const [open, setOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <nav className="sticky top-0 z-40 bg-[#1C0A00] shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => { onNavigate("home"); setOpen(false); }}
            className="flex items-center gap-2 group"
          >
            <span className="text-2xl">🐷</span>
            <span className="font-display font-800 text-white text-lg leading-tight">
              Mr.Pork <span className="text-[#EA580C]">Store</span>
            </span>
          </button>

          <div className="hidden md:flex items-center gap-1">
            {links.map((l) => (
              <button
                key={l.section}
                onClick={() => onNavigate(l.section)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  currentSection === l.section
                    ? "bg-[#9B1C1C] text-white"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {l.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onCartClick}
              className="relative text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Open cart"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 bg-[#EA580C] text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 leading-none">
                  {totalItems > 99 ? "99+" : totalItems}
                </span>
              )}
            </button>
            <button
              onClick={onAdminClick}
              className="hidden md:block text-xs text-gray-500 hover:text-gray-300 transition-colors px-2 py-1"
            >
              Admin
            </button>
            <button
              onClick={() => setOpen(!open)}
              className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              aria-label="Toggle menu"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {open ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden border-t border-white/10 py-3 space-y-1 pb-4">
            {links.map((l) => (
              <button
                key={l.section}
                onClick={() => { onNavigate(l.section); setOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                  currentSection === l.section
                    ? "bg-[#9B1C1C] text-white"
                    : "text-gray-300 hover:text-white hover:bg-white/10"
                }`}
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={() => { onAdminClick(); setOpen(false); }}
              className="w-full text-left px-4 py-3 rounded-lg text-xs text-gray-500 hover:text-gray-300 transition-colors"
            >
              Admin Portal
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}
