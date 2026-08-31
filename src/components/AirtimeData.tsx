import { useState, useEffect } from "react";
import { api } from "../lib/api";
import { useAppContext } from "../lib/AppContext";
import { normalizeWhatsAppNumber } from "../lib/utils";
import type { DataNetwork, DataPlan } from "../lib/types";

export default function AirtimeData() {
  const { whatsappNumber } = useAppContext();
  const [tab, setTab] = useState<"airtime" | "data">("airtime");
  const [networks, setNetworks] = useState<DataNetwork[]>([]);
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [selectedNetworkId, setSelectedNetworkId] = useState("");
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [airtimeAmount, setAirtimeAmount] = useState("");
  const [networksLoading, setNetworksLoading] = useState(true);
  const [plansLoading, setPlansLoading] = useState(false);

  // Load active networks
  useEffect(() => {
    api
      .get<DataNetwork[]>("/data-networks")
      .then((data) => {
        const active = data.filter((n) => n.isActive);
        setNetworks(active);
        if (active.length > 0) setSelectedNetworkId(active[0].id);
      })
      .catch(() => setNetworks([]))
      .finally(() => setNetworksLoading(false));
  }, []);

  // Load plans when network changes
  useEffect(() => {
    if (!selectedNetworkId) return;
    setPlansLoading(true);
    setSelectedPlanId("");
    api
      .get<DataPlan[]>(`/data-plans/network/${selectedNetworkId}`)
      .then((data) => setPlans(data.filter((p) => p.isAvailable)))
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
  }, [selectedNetworkId]);

  const selectedNetwork = networks.find((n) => n.id === selectedNetworkId);
  const selectedPlan = plans.find((p) => p.id === selectedPlanId);

  const handleAirtimeBuy = () => {
    if (!phoneNumber.trim() || !airtimeAmount.trim()) {
      alert("Please enter your phone number and airtime amount.");
      return;
    }
    if (!whatsappNumber) return;
    const msg =
      `📱 *Airtime Purchase Request*\n\n` +
      `📶 Network: ${selectedNetwork?.name ?? "N/A"}\n` +
      `📞 Phone Number: ${phoneNumber}\n` +
      `💰 Amount: ₦${airtimeAmount}\n\n` +
      `Please process my airtime recharge. Thank you!`;
    window.open(`https://wa.me/${normalizeWhatsAppNumber(whatsappNumber)}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const handleDataBuy = () => {
    if (!phoneNumber.trim() || !selectedPlan) {
      alert("Please select a bundle and enter your phone number.");
      return;
    }
    if (!whatsappNumber) return;
    const msg =
      `📱 *Data Bundle Purchase Request*\n\n` +
      `📶 Network: ${selectedNetwork?.name ?? "N/A"}\n` +
      `📞 Phone Number: ${phoneNumber}\n` +
      `📦 Bundle: ${selectedPlan.name} — ${selectedPlan.dataSize}${selectedPlan.validity ? ` / ${selectedPlan.validity}` : ""} — ₦${selectedPlan.price.toLocaleString()}\n\n` +
      `Please process my data bundle. Thank you!`;
    window.open(`https://wa.me/${normalizeWhatsAppNumber(whatsappNumber)}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const NetworkSelector = () => (
    <div className="mb-6">
      <p className="text-sm font-semibold text-[#1C0A00] mb-3">Select Network</p>
      {networksLoading ? (
        <div className="grid grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 rounded-xl bg-gray-100 animate-pulse" />
          ))}
        </div>
      ) : networks.length === 0 ? (
        <p className="text-sm text-gray-400">No networks available at this time.</p>
      ) : (
        <div className="grid grid-cols-4 gap-3 flex-wrap">
          {networks.map((n) => (
            <button
              key={n.id}
              onClick={() => setSelectedNetworkId(n.id)}
              className={`py-3 rounded-xl border-2 font-display font-700 text-xs transition-all flex flex-col items-center gap-1 ${
                selectedNetworkId === n.id
                  ? "border-[#9B1C1C] bg-red-50 text-[#9B1C1C] scale-105"
                  : "border-gray-200 text-gray-600 hover:border-gray-300"
              }`}
            >
              {n.logoUrl ? (
                <img src={n.logoUrl} alt={n.name} className="w-7 h-7 object-contain rounded" />
              ) : (
                <span className="text-xl">📶</span>
              )}
              <span className="text-xs">{n.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <section className="min-h-screen py-16 px-4 sm:px-6 max-w-5xl mx-auto">
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-3">
          <span className="text-4xl">📱</span>
          <h1 className="font-display text-4xl sm:text-5xl font-800 text-[#1C0A00]">
            Airtime & Data
          </h1>
        </div>
        <p className="text-[#78350F] text-base max-w-xl">
          Buy affordable airtime and data bundles for all networks — fast and reliable via WhatsApp.
        </p>
      </div>

      <div className="flex gap-2 mb-8 bg-white border border-orange-100 rounded-xl p-1 w-fit shadow-sm">
        {([
          ["airtime", "📶 Airtime"],
          ["data", "📡 Data Bundles"],
        ] as ["airtime" | "data", string][]).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTab(val)}
            className={`px-5 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
              tab === val
                ? "bg-[#166534] text-white shadow-sm"
                : "text-gray-500 hover:text-[#166534]"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-6 sm:p-10 max-w-2xl">
        <NetworkSelector />

        <div className="mb-6">
          <label className="block text-sm font-semibold text-[#1C0A00] mb-1.5">
            Phone Number to Recharge
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="e.g. 08012345678"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40"
          />
        </div>

        {tab === "airtime" && (
          <>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-[#1C0A00] mb-1.5">
                Airtime Amount (₦)
              </label>
              <div className="flex flex-wrap gap-2 mb-3">
                {[100, 200, 500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    onClick={() => setAirtimeAmount(String(amt))}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                      airtimeAmount === String(amt)
                        ? "bg-[#9B1C1C] text-white border-[#9B1C1C]"
                        : "bg-white text-gray-600 border-gray-200 hover:border-[#9B1C1C]"
                    }`}
                  >
                    ₦{amt.toLocaleString()}
                  </button>
                ))}
              </div>
              <input
                type="number"
                value={airtimeAmount}
                onChange={(e) => setAirtimeAmount(e.target.value)}
                placeholder="Or enter custom amount"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40"
              />
            </div>

            <button
              onClick={handleAirtimeBuy}
              className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-display font-700 py-4 rounded-2xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Buy Airtime via WhatsApp
            </button>
          </>
        )}

        {tab === "data" && (
          <>
            {plansLoading ? (
              <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="h-20 rounded-xl bg-gray-100 animate-pulse" />
                ))}
              </div>
            ) : plans.length === 0 ? (
              <p className="text-sm text-gray-400 mb-6">No data plans available for this network.</p>
            ) : (
              <div className="mb-6">
                <p className="text-sm font-semibold text-[#1C0A00] mb-3">Select Bundle</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {plans.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setSelectedPlanId(p.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all ${
                        selectedPlanId === p.id
                          ? "border-[#166534] bg-green-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="font-display font-700 text-base text-[#1C0A00]">{p.dataSize}</div>
                      {p.validity && <div className="text-xs text-gray-500">{p.validity}</div>}
                      <div className="text-[#166534] font-semibold text-sm mt-1">
                        ₦{p.price.toLocaleString()}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={handleDataBuy}
              className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-display font-700 py-4 rounded-2xl transition-all hover:scale-[1.02] flex items-center justify-center gap-2 shadow-lg shadow-green-900/20"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
              </svg>
              Buy Data via WhatsApp
            </button>
          </>
        )}
      </div>
    </section>
  );
}
