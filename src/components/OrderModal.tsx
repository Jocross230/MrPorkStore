import { useState } from "react";
import { api, ApiError } from "../lib/api";
import { useAppContext } from "../lib/AppContext";
import { normalizeWhatsAppNumber } from "../lib/utils";
import type { CreateOrderRequest, Order, ProductVariant } from "../lib/types";

interface OrderModalProps {
  productId: string;
  productName: string;
  variant: ProductVariant | null;
  basePrice: number | null;
  onClose: () => void;
}

export default function OrderModal({
  productId,
  productName,
  variant,
  basePrice,
  onClose,
}: OrderModalProps) {
  const { whatsappNumber } = useAppContext();
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);

  const displayPrice = variant ? variant.price : basePrice;
  const variantLabel = variant
    ? [variant.name, variant.weightOrSize].filter(Boolean).join(" — ")
    : null;

  const handleSubmit = async () => {
    if (!customerName.trim() || !phoneNumber.trim()) {
      setError("Name and phone number are required.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload: CreateOrderRequest = {
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(deliveryAddress.trim() ? { deliveryAddress: deliveryAddress.trim() } : {}),
        items: [
          {
            productId,
            productVariantId: variant?.id ?? null,
            quantity,
          },
        ],
      };
      const created = await api.post<Order>("/orders", payload);
      setOrder(created);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(`Order failed (${err.status}). Please try again or contact us on WhatsApp.`);
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppConfirm = () => {
    if (!order || !whatsappNumber) return;
    const msg =
      `Hello Mr.Pork Store! 👋\n\n` +
      `I just placed an order.\n\n` +
      `📋 *Order ID:* ${order.id}\n` +
      `👤 *Name:* ${order.customerName}\n` +
      `📞 *Phone:* ${order.phoneNumber}\n` +
      `🛒 *Item:* ${productName}${variantLabel ? ` (${variantLabel})` : ""}\n` +
      `🔢 *Qty:* ${quantity}\n` +
      `💰 *Total:* ₦${order.totalAmount.toLocaleString()}\n\n` +
      `Please confirm and arrange delivery. Thank you!`;
    window.open(`https://wa.me/${normalizeWhatsAppNumber(whatsappNumber)}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-md my-8 shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="font-display font-700 text-lg text-[#1C0A00]">Place Order</h2>
            <p className="text-sm text-gray-400 mt-0.5">{productName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {order ? (
          <div className="p-6 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="font-display font-700 text-xl text-[#1C0A00] mb-2">Order Placed!</h3>
            <p className="text-gray-500 text-sm mb-1">
              Order <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{order.id}</span>
            </p>
            <p className="text-[#9B1C1C] font-display font-700 text-2xl mb-4">
              ₦{order.totalAmount.toLocaleString()}
            </p>
            <p className="text-gray-400 text-sm mb-6">
              Confirm your order and arrange delivery via WhatsApp.
            </p>
            <div className="flex gap-3">
              <button
                onClick={handleWhatsAppConfirm}
                className="flex-1 bg-[#25D366] hover:bg-[#1DA851] text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Confirm on WhatsApp
              </button>
              <button onClick={onClose} className="px-5 bg-gray-100 text-gray-600 font-semibold py-3 rounded-xl text-sm">
                Done
              </button>
            </div>
          </div>
        ) : (
          <div className="p-6 space-y-4">
            {variantLabel && (
              <div className="bg-orange-50 border border-orange-100 rounded-xl px-4 py-3 flex justify-between text-sm">
                <span className="text-gray-600">{variantLabel}</span>
                {displayPrice !== null && (
                  <span className="text-[#9B1C1C] font-display font-700">
                    ₦{displayPrice.toLocaleString()}
                  </span>
                )}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Emeka Okonkwo"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number *</label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 08012345678"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Email <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. emeka@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                Delivery Address <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                placeholder="e.g. 12 Adeola Street, Lagos"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity</label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#9B1C1C] transition-colors"
                >
                  −
                </button>
                <span className="font-display font-700 text-lg w-8 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#9B1C1C] transition-colors"
                >
                  +
                </button>
                {displayPrice !== null && (
                  <span className="ml-auto text-[#9B1C1C] font-display font-700">
                    ₦{(displayPrice * quantity).toLocaleString()}
                  </span>
                )}
              </div>
            </div>

            {error && (
              <p className="text-red-500 text-sm flex items-center gap-1.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full bg-[#9B1C1C] hover:bg-[#7F1515] disabled:opacity-60 text-white font-display font-700 py-4 rounded-2xl text-base transition-colors"
            >
              {loading ? "Placing Order…" : "Place Order"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
