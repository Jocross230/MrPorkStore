import { useState, useEffect } from "react";
import { api, ApiError } from "../lib/api";
import { useAppContext } from "../lib/AppContext";
import type { Product } from "../lib/types";
import ProductCard from "./ProductCard";

type Tab = "all" | "Live Pig" | "Butchered Pork";

export default function PigMarketplace() {
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
      .then((data) => setProducts(data.filter((p) => p.isActive && p.category.toLowerCase() === "pork")))
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
    const msg = "Hello Mr.Pork Store! I'd like to enquire about a bulk order for pork. Please assist.";
    window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <section className="min-h-screen py-16 px-4 sm:px-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 mb-10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-4xl">🐷</span>
            <h1 className="font-display text-4xl sm:text-5xl font-800 text-[#1C0A00]">
              Pig Marketplace
            </h1>
          </div>
          <p className="text-[#78350F] text-base">
            Farm-fresh live pigs and quality butchered pork — all cuts available. Order via WhatsApp for fast delivery.
          </p>
        </div>

        <div className="flex gap-2 bg-white border border-orange-100 rounded-xl p-1 self-start sm:self-auto shadow-sm">
          {(
            [
              ["all", "All Products"],
              ["Live Pig", "Live Pigs"],
              ["Butchered Pork", "Butchered Pork"],
            ] as [Tab, string][]
          ).map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTab(value)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                tab === value
                  ? "bg-[#9B1C1C] text-white shadow-sm"
                  : "text-gray-500 hover:text-[#9B1C1C]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-2xl h-80 animate-pulse border border-orange-100" />
          ))}
        </div>
      )}

      {!loading && error && (
        <div className="text-center py-20">
          <span className="text-5xl block mb-4">⚠️</span>
          <p className="text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 text-[#9B1C1C] hover:underline text-sm"
          >
            Retry
          </button>
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <span className="text-5xl block mb-4">🐷</span>
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

      <div className="mt-16 bg-[#1C0A00] rounded-3xl p-8 sm:p-12 flex flex-col sm:flex-row items-center justify-between gap-6">
        <div>
          <h3 className="font-display text-2xl font-700 text-white mb-2">Need a bulk order?</h3>
          <p className="text-gray-300 text-sm">
            Special pricing available for large quantities. Contact us directly for quotes.
          </p>
        </div>
        <button
          onClick={handleBulk}
          className="flex-shrink-0 bg-[#25D366] hover:bg-[#1DA851] text-white font-semibold px-8 py-4 rounded-xl transition-all hover:scale-105 flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          WhatsApp Bulk Order
        </button>
      </div>
    </section>
  );
}
