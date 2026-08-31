type Section = "home" | "pork" | "chicken" | "sell-pig" | "airtime";

interface HeroProps {
  onNavigate: (s: Section) => void;
}

export default function Hero({ onNavigate }: HeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#1C0A00] min-h-[92vh] flex items-center">
      <div
        className="absolute inset-0 bg-cover bg-center opacity-20"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1597417321971-45e034f7a993?w=1400&h=900&fit=crop&auto=format')",
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-[#1C0A00] via-[#1C0A00]/90 to-transparent" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-20 grid md:grid-cols-2 gap-12 items-center w-full">
        <div>
          <div className="inline-flex items-center gap-2 bg-[#9B1C1C]/30 border border-[#9B1C1C]/50 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 rounded-full bg-[#EA580C] animate-pulse" />
            <span className="text-[#EA580C] text-xs font-semibold uppercase tracking-widest">Fresh & Available Now</span>
          </div>

          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-900 text-white leading-tight mb-6">
            Nigeria's
            <br />
            <span className="text-[#EA580C]">Premium</span>
            <br />
            Pork Store
          </h1>

          <p className="text-gray-300 text-lg leading-relaxed mb-8 max-w-md">
            Farm-fresh pork, live pigs, and quality poultry — delivered with trust. Order directly via WhatsApp for fast, reliable service.
          </p>

          <div className="flex flex-wrap gap-4">
            <button
              onClick={() => onNavigate("pork")}
              className="bg-[#9B1C1C] hover:bg-[#7F1515] text-white font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-lg shadow-red-900/40"
            >
              🐷 Shop Pig
            </button>
            <button
              onClick={() => onNavigate("chicken")}
              className="bg-[#C05621] hover:bg-[#9A3E18] text-white font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105 shadow-lg shadow-orange-900/40"
            >
              🐔 Shop Chicken
            </button>
          </div>

          <div className="mt-12 flex flex-wrap gap-8">
            {[
              { icon: "✅", label: "Verified Fresh", sub: "Daily-sourced" },
              { icon: "📱", label: "WhatsApp Orders", sub: "Instant response" },
              { icon: "🚚", label: "Fast Delivery", sub: "Same-day available" },
            ].map((f) => (
              <div key={f.label} className="flex items-center gap-3">
                <span className="text-2xl">{f.icon}</span>
                <div>
                  <div className="text-white font-semibold text-sm">{f.label}</div>
                  <div className="text-gray-400 text-xs">{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden md:grid grid-cols-2 gap-4">
          {[
            {
              img: "https://images.unsplash.com/photo-1622992599912-d5ce51fe395b?w=400&h=300&fit=crop&auto=format",
              label: "Fresh Pork Cuts",
              //sub: "From ₦2,500/kg",
            },
            {
              img: "https://images.unsplash.com/photo-1616109259043-fd30a7663a5d?w=400&h=300&fit=crop&auto=format",
              label: "Live Pigs",
              sub: "",
            },
            {
              img: "https://images.unsplash.com/photo-1587593810167-a84920ea0781?w=400&h=300&fit=crop&auto=format",
              label: "Dressed Chicken",
              //sub: "From ₦4,000",
            },
            {
              img: "https://images.unsplash.com/photo-1630090374791-c9eb7bab3935?w=400&h=300&fit=crop&auto=format",
              label: "Live Chicken",
              //sub: "From ₦3,500",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="relative rounded-2xl overflow-hidden group cursor-pointer bg-[#2A0F00]"
            >
              <img
                src={item.img}
                alt={item.label}
                className="w-full h-36 object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
              />
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
                <div className="text-white text-xs font-semibold">{item.label}</div>
                <div className="text-[#EA580C] text-xs">{item.sub}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
