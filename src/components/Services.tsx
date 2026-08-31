type Section = "home" | "pork" | "chicken" | "sell-pig" | "airtime";

interface ServicesProps {
  onNavigate: (s: Section) => void;
}

const services = [
  {
    emoji: "🐷",
    title: "Pig Marketplace",
    desc: "Live pigs and freshly butchered pork cuts. Different weights, sizes, and prices to suit every need.",
    bg: "bg-[#9B1C1C]",
    highlights: ["Live Pigs", "Butchered Pork", "Various Weights", "WhatsApp Orders"],
    section: "pork" as Section,
    cta: "Shop Pork",
  },
  {
    emoji: "🐔",
    title: "Chicken Marketplace",
    desc: "Fresh live and dressed broiler chickens available in multiple sizes at competitive prices.",
    bg: "bg-[#C05621]",
    highlights: ["Live Chicken", "Dressed Chicken", "Multiple Sizes", "Same-Day Ready"],
    section: "chicken" as Section,
    cta: "Shop Chicken",
  },
  {
    emoji: "🌾",
    title: "Sell Your Pig",
    desc: "Farmers can submit their pigs for sale to Mr.Pork Store. Fill out the form and we'll contact you directly.",
    bg: "bg-[#1C0A00]",
    highlights: ["Submit Details", "Private & Secure", "Direct Contact", "Fair Prices"],
    section: "sell-pig" as Section,
    cta: "Submit a Pig",
  },
  {
    emoji: "📱",
    title: "Airtime & Data",
    desc: "Buy affordable airtime and data bundles for MTN, Glo, Airtel, and 9mobile via WhatsApp.",
    bg: "bg-[#166534]",
    highlights: ["MTN, Glo, Airtel", "9mobile", "Data Bundles", "Instant Top-Up"],
    section: "airtime" as Section,
    cta: "Buy Airtime",
  },
];

export default function Services({ onNavigate }: ServicesProps) {
  return (
    <section className="py-20 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="text-center mb-14">
        <h2 className="font-display text-4xl sm:text-5xl font-800 text-[#1C0A00] mb-4">
          Our Services
        </h2>
        <p className="text-[#78350F] text-lg max-w-xl mx-auto">
          Everything you need — from farm-fresh pork and poultry to affordable airtime, all in one place.
        </p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {services.map((s) => (
          <div
            key={s.section}
            className="group rounded-3xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col"
          >
            <div className={`${s.bg} p-8 flex flex-col items-start`}>
              <span className="text-5xl mb-4 block">{s.emoji}</span>
              <h3 className="font-display text-2xl font-700 text-white leading-tight mb-2">{s.title}</h3>
              <p className="text-white/75 text-sm leading-relaxed">{s.desc}</p>
            </div>
            <div className="bg-white p-6 flex flex-col gap-4 flex-1">
              <ul className="space-y-2">
                {s.highlights.map((h) => (
                  <li key={h} className="flex items-center gap-2 text-sm text-gray-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#9B1C1C] flex-shrink-0" />
                    {h}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => onNavigate(s.section)}
                className="mt-auto w-full bg-[#FFF7ED] hover:bg-[#FEE2E2] border border-[#9B1C1C]/20 text-[#9B1C1C] font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                {s.cta} →
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
