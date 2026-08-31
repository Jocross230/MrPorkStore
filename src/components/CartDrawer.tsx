import { useState, useEffect } from "react";
import { api, ApiError } from "../lib/api";
import { useAppContext } from "../lib/AppContext";
import { useCart } from "../lib/CartContext";
import { normalizeWhatsAppNumber } from "../lib/utils";
import type { Order } from "../lib/types";

type DrawerView = "cart" | "checkout" | "success";

const WaIcon = () => (
  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, updateQuantity, removeItem, clearCart, totalItems, totalPrice } = useCart();
  const { whatsappNumber } = useAppContext();
  const [view, setView] = useState<DrawerView>("cart");
  const [customerName, setCustomerName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [email, setEmail] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setView("cart");
      setOrder(null);
      setError("");
    }
  }, [isOpen]);

  const placeOrder = async () => {
    if (!customerName.trim() || !phoneNumber.trim()) {
      setError("Name and phone number are required.");
      return;
    }
    if (items.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const payload = {
        customerName: customerName.trim(),
        phoneNumber: phoneNumber.trim(),
        ...(email.trim() ? { email: email.trim() } : {}),
        ...(deliveryAddress.trim() ? { deliveryAddress: deliveryAddress.trim() } : {}),
        items: items.map((it) => ({
          productId: it.productId,
          productVariantId: it.productVariantId,
          quantity: it.quantity,
        })),
      };
      const created = await api.post<Order>("/orders", payload);
      clearCart();
      setOrder(created);
      setView("success");
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
    const normalized = normalizeWhatsAppNumber(whatsappNumber);
    const itemLines = order.items
      .map((it) => `• ${it.productName}${it.variantLabel ? ` — ${it.variantLabel}` : ""} × ${it.quantity}`)
      .join("\n");
    const msg =
      `Hello Mr.Pork Store! 👋\n\n` +
      `I just placed an order.\n\n` +
      `📋 *Order ID:* ${order.id}\n\n` +
      `🛒 *Items:*\n${itemLines}\n\n` +
      `💰 *Total:* ₦${order.totalAmount.toLocaleString()}\n\n` +
      `👤 *Name:* ${order.customerName}\n` +
      `📞 *Phone:* ${order.phoneNumber}\n\n` +
      `Please confirm my order and arrange delivery. Thank you!`;
    window.open(`https://wa.me/${normalized}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} />

      <div className="fixed inset-y-0 right-0 w-full max-w-md bg-white z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 flex-shrink-0">
          {view === "cart" && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-xl">🛒</span>
                <h2 className="font-display font-700 text-lg text-[#1C0A00]">Cart</h2>
                {totalItems > 0 && (
                  <span className="bg-[#9B1C1C] text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {totalItems > 9 ? "9+" : totalItems}
                  </span>
                )}
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><CloseIcon /></button>
            </>
          )}
          {view === "checkout" && (
            <>
              <div className="flex items-center gap-2">
                <button onClick={() => { setView("cart"); setError(""); }} className="text-gray-400 hover:text-[#9B1C1C] transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <h2 className="font-display font-700 text-lg text-[#1C0A00]">Checkout</h2>
              </div>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><CloseIcon /></button>
            </>
          )}
          {view === "success" && (
            <>
              <h2 className="font-display font-700 text-lg text-[#1C0A00]">Order Placed!</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors"><CloseIcon /></button>
            </>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {/* ── Cart view ── */}
          {view === "cart" && (
            items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 py-20">
                <span className="text-6xl mb-4">🛒</span>
                <p className="font-display font-700 text-lg text-[#1C0A00] mb-2">Your cart is empty</p>
                <p className="text-gray-400 text-sm mb-6">Browse the Pork or Chicken marketplace to add items.</p>
                <button onClick={onClose} className="bg-[#9B1C1C] hover:bg-[#7F1515] text-white font-semibold px-6 py-3 rounded-xl text-sm transition-colors">
                  Continue Shopping
                </button>
              </div>
            ) : (
              <div className="p-4 space-y-3">
                {items.map((item) => {
                  const key = `${item.productId}-${item.productVariantId ?? "null"}`;
                  return (
                    <div key={key} className="bg-gray-50 rounded-2xl p-4">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-700 text-[#1C0A00] text-sm leading-snug">{item.productName}</p>
                          {item.variantLabel && (
                            <p className="text-xs text-gray-500 mt-0.5">{item.variantLabel}</p>
                          )}
                          <p className="text-[#9B1C1C] font-semibold text-sm mt-1">
                            ₦{item.unitPrice.toLocaleString()} × {item.quantity}
                            {" = "}
                            <span className="font-700">₦{(item.unitPrice * item.quantity).toLocaleString()}</span>
                          </p>
                        </div>
                        <button
                          onClick={() => removeItem(item.productId, item.productVariantId)}
                          className="text-gray-300 hover:text-red-500 transition-colors flex-shrink-0"
                        >
                          <CloseIcon />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.productId, item.productVariantId, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#9B1C1C] hover:text-[#9B1C1C] transition-colors font-bold"
                        >
                          −
                        </button>
                        <span className="font-display font-700 text-base w-8 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.productVariantId, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-600 hover:border-[#9B1C1C] hover:text-[#9B1C1C] transition-colors font-bold"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          )}

          {/* ── Checkout view ── */}
          {view === "checkout" && (
            <div className="p-6 space-y-4">
              <div className="bg-orange-50 border border-orange-100 rounded-xl p-4 space-y-1.5">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.productVariantId}`} className="flex justify-between text-sm gap-2">
                    <span className="text-gray-600 truncate">
                      {item.productName}{item.variantLabel ? ` · ${item.variantLabel}` : ""} × {item.quantity}
                    </span>
                    <span className="text-[#9B1C1C] font-semibold flex-shrink-0">₦{(item.unitPrice * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-orange-200 pt-2 flex justify-between text-sm font-display font-700">
                  <span>Estimated Total</span>
                  <span className="text-[#9B1C1C]">₦{totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name *</label>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. Emeka Okonkwo" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number *</label>
                <input type="tel" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g. 08012345678" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Email <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="e.g. emeka@example.com" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Delivery Address <span className="text-gray-400 font-normal">(optional)</span></label>
                <input type="text" value={deliveryAddress} onChange={(e) => setDeliveryAddress(e.target.value)} placeholder="e.g. 12 Adeola Street, Lagos" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
              </div>

              {error && (
                <p className="text-red-500 text-sm flex items-center gap-1.5">
                  <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  {error}
                </p>
              )}
            </div>
          )}

          {/* ── Success view ── */}
          {view === "success" && order && (
            <div className="p-6 text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              </div>
              <h3 className="font-display font-700 text-2xl text-[#1C0A00] mb-2">Order Placed!</h3>
              <p className="text-gray-500 text-sm mb-1">
                Order <span className="font-mono text-xs bg-gray-100 px-1.5 py-0.5 rounded">{order.id}</span>
              </p>
              <p className="text-[#9B1C1C] font-display font-700 text-2xl mb-6">₦{order.totalAmount.toLocaleString()}</p>

              <div className="bg-gray-50 rounded-2xl p-4 text-left mb-6 space-y-2">
                {order.items.map((it) => (
                  <div key={it.id} className="flex justify-between text-sm gap-2">
                    <span className="text-gray-600">{it.productName}{it.variantLabel ? ` · ${it.variantLabel}` : ""} × {it.quantity}</span>
                    <span className="text-[#9B1C1C] font-semibold flex-shrink-0">₦{it.subtotal.toLocaleString()}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={handleWhatsAppConfirm}
                disabled={!whatsappNumber}
                className="w-full bg-[#25D366] hover:bg-[#1DA851] disabled:opacity-50 text-white font-display font-700 py-4 rounded-2xl text-base transition-colors flex items-center justify-center gap-2 mb-3"
              >
                <WaIcon />
                Confirm on WhatsApp
              </button>
              <button onClick={onClose} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm transition-colors">
                Done
              </button>
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        {view === "cart" && items.length > 0 && (
          <div className="border-t border-gray-100 p-4 space-y-3 bg-white flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{totalItems} item{totalItems !== 1 ? "s" : ""}</span>
              <span className="font-display font-700 text-xl text-[#9B1C1C]">₦{totalPrice.toLocaleString()}</span>
            </div>
            <p className="text-xs text-gray-400">Estimated total — final price confirmed by Mr.Pork Store.</p>
            <div className="flex gap-3">
              <button
                onClick={clearCart}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-500 text-sm font-semibold rounded-xl transition-colors"
              >
                Clear
              </button>
              <button
                onClick={() => { setError(""); setView("checkout"); }}
                className="flex-1 bg-[#9B1C1C] hover:bg-[#7F1515] text-white font-display font-700 py-3 rounded-xl text-base transition-colors"
              >
                Checkout →
              </button>
            </div>
          </div>
        )}

        {view === "checkout" && (
          <div className="border-t border-gray-100 p-4 bg-white flex-shrink-0">
            <button
              onClick={placeOrder}
              disabled={loading}
              className="w-full bg-[#9B1C1C] hover:bg-[#7F1515] disabled:opacity-60 text-white font-display font-700 py-4 rounded-2xl text-base transition-colors"
            >
              {loading ? "Placing Order…" : `Place Order · ₦${totalPrice.toLocaleString()}`}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
