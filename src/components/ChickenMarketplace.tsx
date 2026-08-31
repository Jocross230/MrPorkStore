import { useState, useEffect } from "react";
import { api, ApiError } from "../lib/api";
import { useAppContext } from "../lib/AppContext";
import type { Product } from "../lib/types";
import ProductCard from "./ProductCard";

type Tab = "all" | "Live Chicken" | "Dressed Chicken";

export default function ChickenMarketplace() {
  const { whatsappNumber } = useAppContext();
  const [tab, setTab] = useState<Tab>("all");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    api
      .get<Product[]>("/products")
      .then((data) => setProducts(data.filter((p) => p.isActive && p.category.toLowerCase() === "chicken")))
      .catch((err) => {
        setError(
          err instanceof ApiError && err.status === 404
            ? "No products found."
            : "Could not load products. Please try again."
        );
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered =
    tab === "all"
      ? products
      : products.filter((p) => p.productType === tab);

  const handleBulk = () => {
    if (!whatsappNumber) return;
    const msg = "Hello Mr.Pork Store! I'd like to enquire about a bulk order for chicken. Please assist.";
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <section className="min-h-screen py-16 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🐔</span>
            <h1 className="font-display text-4xl sm:text-5xl font-800 text-[#1C0A00]">
              Chicken Marketplace
            </h1>
          </div>
          <p className="text-[#78350F] text-base">
            Live broilers and freshly dressed chicken — healthy, farm-sourced, and ready for delivery.
          </p>
        </div>

        <div className="flex gap-2 bg-white border border-orange-100 rounded-xl p-1 self-start sm:self-auto shadow-sm">
          {(
            [
              ["all", "All"],
              ["Live Chicken", "Live Chicken"],
              ["Dressed Chicken", "Dressed"],
            ] as [Tab, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === value
                  ? "bg-[#C05621] text-white shadow-sm"
                  : "text-gray-500 hover:text-[#C05621]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-orange-100" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-20">
          <span className="text-5xl block mb-4">⚠️</span>
          <p className="text-gray-500">{error}</p>
          <button onClick={() => window.location.reload()} className="mt-4 text-[#9B1C1C] hover:underline text-sm">
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <span className="text-5xl block mb-4">🐔</span>
          <p>No products in this category yet.</p>
        </div>
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}

      <div className="mt-16 bg-[#C05621] rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-display text-2xl font-700 text-white mb-2">Ordering for an event?</h3>
          <p className="text-orange-100 text-sm">
            We supply for parties, restaurants, and caterers. Get special pricing for bulk chicken orders.
          </p>
        </div>
        <button
          onClick={handleBulk}
          className="flex-shrink-0 bg-white hover:bg-orange-50 text-[#C05621] font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105"
        >
          Enquire on WhatsApp
        </button>
      </div>
    </section>
  );
}
