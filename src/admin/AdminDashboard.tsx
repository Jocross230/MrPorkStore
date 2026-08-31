import { useState, useEffect, useRef } from "react";
import { api, ApiError } from "../lib/api";
import { normalizeWhatsAppNumber } from "../lib/utils";
import { useAppContext } from "../lib/AppContext";
import type {
  Product, ProductVariant, ProductImage,
  Order, OrderStatus,
  PigSubmission, PigSubmissionStatus, PigSubmissionImage,
  DataNetwork, DataPlan,
  AppSetting,
} from "../lib/types";

type AdminTab =
  | "overview"
  | "products"
  | "orders"
  | "submissions"
  | "networks"
  | "plans"
  | "settings";

interface AdminDashboardProps {
  onLogout: () => void;
}

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <p className="text-sm text-gray-500 mb-1">{label}</p>
      <p className={`font-display font-700 text-3xl ${color}`}>{value}</p>
    </div>
  );
}

export default function AdminDashboard({ onLogout }: AdminDashboardProps) {
  const { reloadSettings } = useAppContext();
  const [tab, setTab] = useState<AdminTab>("overview");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Counts for overview badges
  const [productCount, setProductCount] = useState(0);
  const [newOrderCount, setNewOrderCount] = useState(0);
  const [newSubCount, setNewSubCount] = useState(0);

  const loadCounts = () => {
    api.get<Product[]>("/products").then((d) => setProductCount(d.length)).catch(() => {});
    api.get<Order[]>("/orders").then((d) => setNewOrderCount(d.filter((o) => o.status === "NEW").length)).catch(() => {});
    api.get<PigSubmission[]>("/admin/pig-submissions").then((d) => setNewSubCount(d.filter((s) => s.status === "NEW").length)).catch(() => {});
  };

  useEffect(() => { loadCounts(); }, []);

  const navItems: { id: AdminTab; label: string; emoji: string; badge?: number }[] = [
    { id: "overview", label: "Overview", emoji: "📊" },
    { id: "products", label: "Products", emoji: "🛒", badge: productCount },
    { id: "orders", label: "Orders", emoji: "📦", badge: newOrderCount },
    { id: "submissions", label: "Pig Submissions", emoji: "🌾", badge: newSubCount },
    { id: "networks", label: "Data Networks", emoji: "📶" },
    { id: "plans", label: "Data Plans", emoji: "📡" },
    { id: "settings", label: "App Settings", emoji: "⚙️" },
  ];

  const NavButton = ({ item }: { item: (typeof navItems)[0] }) => (
    <button
      onClick={() => { setTab(item.id); setMobileMenuOpen(false); }}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium mb-1 transition-colors relative ${
        tab === item.id
          ? "bg-[#FFF7ED] text-[#9B1C1C]"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <span>{item.emoji}</span>
      <span className="flex-1 text-left">{item.label}</span>
      {item.badge !== undefined && item.badge > 0 && (
        <span className="bg-[#9B1C1C] text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold flex-shrink-0">
          {item.badge > 9 ? "9+" : item.badge}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-[#1C0A00] text-white px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="sm:hidden p-1 hover:bg-white/10 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <span className="text-lg">🐷</span>
          <span className="font-display font-700">
            Mr.Pork Store <span className="text-[#EA580C] text-sm font-500">Admin</span>
          </span>
        </div>
        <button
          onClick={onLogout}
          className="text-xs text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 bg-white/10 px-3 py-1.5 rounded-lg"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Logout
        </button>
      </div>

      <div className="flex flex-1">
        <aside className="hidden sm:flex flex-col w-56 bg-white border-r border-gray-100 sticky top-14 h-[calc(100vh-3.5rem)] overflow-y-auto">
          <nav className="p-3 flex-1">
            {navItems.map((item) => <NavButton key={item.id} item={item} />)}
          </nav>
        </aside>

        {mobileMenuOpen && (
          <div className="fixed inset-0 z-20 bg-black/50 sm:hidden" onClick={() => setMobileMenuOpen(false)}>
            <aside className="w-64 bg-white h-full" onClick={(e) => e.stopPropagation()}>
              <nav className="p-3 pt-5">
                {navItems.map((item) => <NavButton key={item.id} item={item} />)}
              </nav>
            </aside>
          </div>
        )}

        <main className="flex-1 p-4 sm:p-8 max-w-5xl overflow-x-hidden">
          {tab === "overview" && (
            <OverviewTab
              productCount={productCount}
              newOrderCount={newOrderCount}
              newSubCount={newSubCount}
              onNavigate={setTab}
            />
          )}
          {tab === "products" && <ProductsTab onCountChange={setProductCount} />}
          {tab === "orders" && <OrdersTab onNewCount={setNewOrderCount} />}
          {tab === "submissions" && <SubmissionsTab onNewCount={setNewSubCount} />}
          {tab === "networks" && <NetworksTab />}
          {tab === "plans" && <PlansTab />}
          {tab === "settings" && <SettingsTab onSaved={reloadSettings} />}
        </main>
      </div>
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────

function OverviewTab({
  productCount, newOrderCount, newSubCount, onNavigate,
}: {
  productCount: number;
  newOrderCount: number;
  newSubCount: number;
  onNavigate: (t: AdminTab) => void;
}) {
  return (
    <div>
      <h1 className="font-display text-2xl font-700 text-[#1C0A00] mb-6">Dashboard</h1>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total Products" value={productCount} color="text-[#9B1C1C]" />
        <StatCard label="New Orders" value={newOrderCount} color="text-blue-600" />
        <StatCard label="New Submissions" value={newSubCount} color="text-[#C05621]" />
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {([
          ["orders", "View Orders", "📦", "bg-blue-50 text-blue-700"],
          ["submissions", "View Submissions", "🌾", "bg-orange-50 text-orange-700"],
          ["products", "Manage Products", "🛒", "bg-red-50 text-[#9B1C1C]"],
        ] as [AdminTab, string, string, string][]).map(([id, label, emoji, cls]) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className={`${cls} rounded-2xl p-6 text-left font-semibold hover:opacity-80 transition-opacity`}
          >
            <span className="text-3xl block mb-3">{emoji}</span>
            {label} →
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Products ─────────────────────────────────────────────────────────────────

function ProductsTab({ onCountChange }: { onCountChange: (n: number) => void }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | null>(null);
  const [creating, setCreating] = useState(false);
  const [filterCat, setFilterCat] = useState<"all" | "Pork" | "Chicken">("all");

  const emptyForm = (): Omit<Product, "id" | "createdAt"> => ({
    name: "", description: null, category: "Pork", productType: "Live Pig",
    weightOrSize: null, price: 0, stockQuantity: null,
    isAvailable: true, isActive: true,
  });

  const [form, setForm] = useState(emptyForm());
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [managingId, setManagingId] = useState<string | null>(null);
  const imgRef = useRef<HTMLInputElement>(null);
  const varImgRef = useRef<HTMLInputElement>(null);
  const [newVariant, setNewVariant] = useState({ name: "", weightOrSize: "", price: "", displayOrder: "0" });
  const [editingVariant, setEditingVariant] = useState<ProductVariant | null>(null);
  const [editVariantForm, setEditVariantForm] = useState({ name: "", weightOrSize: "", price: "", displayOrder: "0" });
  const [variantError, setVariantError] = useState("");

  const load = () => {
    setLoading(true);
    api.get<Product[]>("/products")
      .then((d) => { setProducts(d); onCountChange(d.length); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const loadManaged = (id: string) => {
    setManagingId(id);
    api.get<ProductVariant[]>(`/products/${id}/variants`)
      .then((d) => setVariants([...d].sort((a, b) => a.displayOrder - b.displayOrder)))
      .catch(() => setVariants([]));
    api.get<ProductImage[]>(`/products/${id}/images`)
      .then(setImages)
      .catch(() => setImages([]));
  };

  const filtered = filterCat === "all" ? products : products.filter((p) => p.category === filterCat);

  const openCreate = () => { setForm(emptyForm()); setImageFile(null); setCreating(true); setEditing(null); setFormError(""); };
  const openEdit = (p: Product) => { setForm({ ...p }); setImageFile(null); setEditing(p); setCreating(false); setFormError(""); };
  const close = () => { setCreating(false); setEditing(null); };

  const save = async () => {
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    setSaving(true);
    setFormError("");
    try {
      let savedId: string;
      if (creating) {
        const created = await api.post<Product>("/products", form);
        savedId = created.id;
      } else if (editing) {
        await api.put<{ message: string }>(`/products/${editing.id}`, form);
        savedId = editing.id;
      } else return;

      if (imageFile) {
        const fd = new FormData();
        fd.append("File",imageFile);
        try { await api.postForm(`/products/${savedId}/images`, fd); } catch { /* non-fatal */ }
      }

      load();
      close();
    } catch (err) {
      setFormError(err instanceof ApiError ? `Save failed (${err.status})` : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try { await api.delete(`/products/${id}`); load(); } catch { alert("Delete failed."); }
  };

  const addVariant = async () => {
    if (!managingId) return;
    if (!newVariant.name.trim() || !newVariant.price) { setVariantError("Name and price are required."); return; }
    try {
      await api.post(`/products/${managingId}/variants`, {
        name: newVariant.name,
        weightOrSize: newVariant.weightOrSize || null,
        price: parseFloat(newVariant.price),
        displayOrder: parseInt(newVariant.displayOrder) || 0,
        isAvailable: true,
      });
      loadManaged(managingId);
      setNewVariant({ name: "", weightOrSize: "", price: "", displayOrder: "0" });
      setVariantError("");
    } catch { setVariantError("Failed to add variant."); }
  };

  const startEditVariant = (v: ProductVariant) => {
    setEditingVariant(v);
    setEditVariantForm({ name: v.name, weightOrSize: v.weightOrSize ?? "", price: String(v.price), displayOrder: String(v.displayOrder) });
    setVariantError("");
  };

  const saveEditVariant = async () => {
    if (!editingVariant || !editVariantForm.name.trim() || !editVariantForm.price) { setVariantError("Name and price are required."); return; }
    try {
      await api.put(`/product-variants/${editingVariant.id}`, {
        name: editVariantForm.name,
        weightOrSize: editVariantForm.weightOrSize || null,
        price: parseFloat(editVariantForm.price),
        displayOrder: parseInt(editVariantForm.displayOrder) || 0,
        isAvailable: editingVariant.isAvailable,
      });
      setEditingVariant(null);
      if (managingId) loadManaged(managingId);
      setVariantError("");
    } catch { setVariantError("Failed to save variant."); }
  };

  const deleteVariant = async (vid: string) => {
    if (!managingId || !confirm("Delete this variant?")) return;
    try { await api.delete(`/product-variants/${vid}`); loadManaged(managingId); } catch { alert("Delete failed."); }
  };

  const deleteImage = async (imgId: string) => {
    if (!managingId || !confirm("Delete this image?")) return;
    try { await api.delete(`/product-images/${imgId}`); loadManaged(managingId); } catch { alert("Delete failed."); }
  };

  const uploadImage = async (file: File) => {
    if (!managingId) return;
    const fd = new FormData();
    fd.append("File",file);
    try { await api.postForm(`/products/${managingId}/images`, fd); loadManaged(managingId); } catch { alert("Upload failed."); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-700 text-[#1C0A00]">Products</h1>
        <button onClick={openCreate} className="bg-[#9B1C1C] hover:bg-[#7F1515] text-white font-semibold px-5 py-2.5 rounded-xl text-sm flex items-center gap-2 transition-colors">
          + Add Product
        </button>
      </div>

      <div className="flex gap-2 mb-5">
        {(["all", "Pork", "Chicken"] as const).map((c) => (
          <button key={c} onClick={() => setFilterCat(c)} className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition-colors ${filterCat === c ? "bg-[#9B1C1C] text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
            {c === "all" ? "All" : c === "Pork" ? "🐷 Pork" : "🐔 Chicken"}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}</div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 flex items-center justify-center text-2xl">
                {p.category === "Chicken" ? "🐔" : "🐷"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-display font-700 text-[#1C0A00]">{p.name}</span>
                  <span className="text-xs capitalize text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{p.productType}</span>
                </div>
                {p.description && <p className="text-xs text-gray-400 truncate">{p.description}</p>}
                {p.price > 0 && <p className="text-xs text-[#9B1C1C] mt-0.5">₦{p.price.toLocaleString()}</p>}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-3 py-1.5 rounded-lg font-semibold ${p.isAvailable ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {p.isAvailable ? "Live" : "Hidden"}
                </span>
                <button onClick={() => loadManaged(p.id)} className="p-2 text-gray-400 hover:text-blue-500 transition-colors" title="Manage variants & images">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
                </button>
                <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-[#9B1C1C] transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => deleteProduct(p.id)} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      {(creating || editing) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg my-8 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-display font-700 text-lg text-[#1C0A00]">{creating ? "Add Product" : "Edit Product"}</h2>
              <button onClick={close} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40">
                    <option>Pork</option><option>Chicken</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Product Type</label>
                  <input type="text" value={form.productType} onChange={(e) => setForm((f) => ({ ...f, productType: e.target.value }))} placeholder="e.g. Live Pig" className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Description</label>
                <textarea value={form.description ?? ""} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))} rows={2} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40 resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Base Price (₦)</label>
                  <input type="number" value={form.price || ""} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value ? parseFloat(e.target.value) : 0 }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Weight / Size</label>
                  <input type="text" value={form.weightOrSize ?? ""} onChange={(e) => setForm((f) => ({ ...f, weightOrSize: e.target.value || null }))} className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Product Image</label>
                <button type="button" onClick={() => imgRef.current?.click()} className="w-full border-2 border-dashed border-gray-200 hover:border-[#9B1C1C]/40 rounded-lg px-4 py-3 text-sm text-gray-500 text-center transition-colors">
                  {imageFile ? imageFile.name : "Click to select image file"}
                </button>
                <input ref={imgRef} type="file" accept="image/*" onChange={(e) => setImageFile(e.target.files?.[0] ?? null)} className="hidden" />
              </div>
              <div className="flex items-center gap-4 text-sm">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))} className="accent-[#9B1C1C]" />
                  Available
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="accent-[#9B1C1C]" />
                  Active (visible)
                </label>
              </div>
              {formError && <p className="text-red-500 text-sm">{formError}</p>}
            </div>
            <div className="px-6 pb-6 flex gap-3">
              <button onClick={save} disabled={saving} className="flex-1 bg-[#9B1C1C] hover:bg-[#7F1515] disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm">{saving ? "Saving…" : (creating ? "Create" : "Save")}</button>
              <button onClick={close} className="px-6 bg-gray-100 text-gray-600 font-semibold py-3 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Variants & Images modal */}
      {managingId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-lg my-8 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-display font-700 text-lg text-[#1C0A00]">Variants & Images</h2>
              <button onClick={() => setManagingId(null)} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Variants */}
              <div>
                <h3 className="font-display font-700 text-sm text-[#1C0A00] mb-3">Variants</h3>
                {variants.length === 0 ? <p className="text-sm text-gray-400 mb-3">No variants yet.</p> : (
                  <div className="space-y-2 mb-3">
                    {variants.map((v) => (
                      <div key={v.id}>
                        {editingVariant?.id === v.id ? (
                          <div className="bg-blue-50 rounded-xl px-4 py-3 space-y-2">
                            <div className="grid grid-cols-2 gap-2">
                              <input type="text" value={editVariantForm.name} onChange={(e) => setEditVariantForm((f) => ({ ...f, name: e.target.value }))} placeholder="Name" className="border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
                              <input type="text" value={editVariantForm.weightOrSize} onChange={(e) => setEditVariantForm((f) => ({ ...f, weightOrSize: e.target.value }))} placeholder="Weight/Size" className="border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
                              <input type="number" value={editVariantForm.price} onChange={(e) => setEditVariantForm((f) => ({ ...f, price: e.target.value }))} placeholder="Price (₦)" className="border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
                              <input type="number" value={editVariantForm.displayOrder} onChange={(e) => setEditVariantForm((f) => ({ ...f, displayOrder: e.target.value }))} placeholder="Display order" className="border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
                            </div>
                            <div className="flex gap-2">
                              <button onClick={saveEditVariant} className="flex-1 bg-[#9B1C1C] hover:bg-[#7F1515] text-white font-semibold rounded-lg text-xs py-1.5 transition-colors">Save</button>
                              <button onClick={() => setEditingVariant(null)} className="flex-1 bg-gray-100 text-gray-600 font-semibold rounded-lg text-xs py-1.5">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 text-sm">
                            <div className="flex-1">
                              <span className="font-semibold text-[#1C0A00]">{v.name}</span>
                              {v.weightOrSize && <span className="text-gray-400 ml-2">{v.weightOrSize}</span>}
                              <span className="text-[#9B1C1C] font-bold ml-2">₦{v.price.toLocaleString()}</span>
                            </div>
                            <button onClick={() => startEditVariant(v)} className="text-gray-400 hover:text-blue-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
                            <button onClick={() => deleteVariant(v.id)} className="text-gray-400 hover:text-red-500 transition-colors"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <input type="text" value={newVariant.name} onChange={(e) => setNewVariant((v) => ({ ...v, name: e.target.value }))} placeholder="Name (e.g. 1 kg)" className="border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
                  <input type="text" value={newVariant.weightOrSize} onChange={(e) => setNewVariant((v) => ({ ...v, weightOrSize: e.target.value }))} placeholder="Weight/Size (optional)" className="border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
                  <input type="number" value={newVariant.price} onChange={(e) => setNewVariant((v) => ({ ...v, price: e.target.value }))} placeholder="Price (₦)" className="border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
                  <button onClick={addVariant} className="bg-[#9B1C1C] hover:bg-[#7F1515] text-white font-semibold rounded-lg text-xs transition-colors">Add Variant</button>
                </div>
                {variantError && <p className="text-red-500 text-xs mt-1">{variantError}</p>}
              </div>
              {/* Images */}
              <div>
                <h3 className="font-display font-700 text-sm text-[#1C0A00] mb-3">Images</h3>
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {images.map((img) => (
                      <div key={img.id} className="relative">
                        <img src={img.imageUrl} alt="product" className="w-16 h-16 object-cover rounded-lg bg-gray-100" />
                        <button onClick={() => deleteImage(img.id)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => varImgRef.current?.click()} className="w-full border-2 border-dashed border-gray-200 hover:border-[#9B1C1C]/40 rounded-lg px-4 py-3 text-sm text-gray-500 text-center transition-colors">
                  📷 Upload Image
                </button>
                <input ref={varImgRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} className="hidden" />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Orders ────────────────────────────────────────────────────────────────────

function OrdersTab({ onNewCount }: { onNewCount: (n: number) => void }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<"all" | OrderStatus>("all");

  const load = () => {
    setLoading(true);
    api.get<Order[]>("/orders")
      .then((d) => { setOrders(d); onNewCount(d.filter((o) => o.status === "NEW").length); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: OrderStatus) => {
    try {
      await api.patch(`/orders/${id}/status`, { status });
      load();
      if (selected?.id === id) setSelected((o) => o ? { ...o, status } : null);
    } catch { alert("Update failed."); }
  };

  const filtered = filterStatus === "all" ? orders : orders.filter((o) => o.status === filterStatus);

  const statusColors: Record<OrderStatus, string> = {
    NEW: "bg-blue-100 text-blue-700",
    CONFIRMED: "bg-indigo-100 text-indigo-700",
    PROCESSING: "bg-yellow-100 text-yellow-700",
    COMPLETED: "bg-green-100 text-green-700",
    CANCELLED: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-700 text-[#1C0A00]">Orders</h1>
        <span className="text-sm text-gray-500">{orders.length} total</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {(["all", "NEW", "CONFIRMED", "PROCESSING", "COMPLETED", "CANCELLED"] as const).map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterStatus === s ? "bg-[#9B1C1C] text-white" : "bg-white text-gray-600 border border-gray-200"}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400"><span className="text-5xl block mb-4">📦</span><p>No orders found.</p></div>
      ) : (
        <div className="space-y-3">
          {[...filtered].reverse().map((o) => (
            <div key={o.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:border-[#9B1C1C]/30 transition-colors" onClick={() => setSelected(o)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-700 text-[#1C0A00]">{o.customerName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColors[o.status]}`}>{o.status}</span>
                  </div>
                  <p className="text-sm text-gray-500">📞 {o.phoneNumber} · {o.items.length} item(s) · <span className="text-[#9B1C1C] font-bold">₦{o.totalAmount.toLocaleString()}</span></p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(o.createdAt).toLocaleString("en-NG")}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md my-8 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-display font-700 text-lg">Order Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 space-y-3">
              {[
                ["Customer", selected.customerName],
                ["Phone", selected.phoneNumber],
                ["Email", selected.email || "—"],
                ["Delivery", selected.deliveryAddress || "—"],
                ["Total", `₦${selected.totalAmount.toLocaleString()}`],
                ["Placed", new Date(selected.createdAt).toLocaleString("en-NG")],
              ].map(([l, v]) => (
                <div key={l} className="flex gap-3 text-sm">
                  <span className="text-gray-400 w-24 flex-shrink-0">{l}</span>
                  <span className="text-[#1C0A00] font-medium">{v}</span>
                </div>
              ))}
              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Items</p>
                {selected.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm py-1">
                    <span className="text-gray-700">{item.productName}{item.variantLabel ? ` · ${item.variantLabel}` : ""} × {item.quantity}</span>
                    <span className="text-[#9B1C1C] font-semibold">₦{item.subtotal.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 pb-6 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {(["NEW", "CONFIRMED", "PROCESSING", "COMPLETED", "CANCELLED"] as OrderStatus[]).map((s) => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} className={`flex-1 min-w-0 py-2 rounded-lg text-xs font-semibold transition-colors ${selected.status === s ? "bg-[#9B1C1C] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Pig Submissions ──────────────────────────────────────────────────────────

function SubmissionsTab({ onNewCount }: { onNewCount: (n: number) => void }) {
  const { whatsappNumber } = useAppContext();
  const [submissions, setSubmissions] = useState<PigSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PigSubmission | null>(null);
  const [images, setImages] = useState<PigSubmissionImage[]>([]);
  const [filterStatus, setFilterStatus] = useState<"all" | PigSubmissionStatus>("all");
  const subImgRef = useRef<HTMLInputElement>(null);

  const load = () => {
    setLoading(true);
    api.get<PigSubmission[]>("/admin/pig-submissions")
      .then((d) => { setSubmissions(d); onNewCount(d.filter((s) => s.status === "NEW").length); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openDetail = (s: PigSubmission) => {
    setSelected(s);
    api.get<PigSubmissionImage[]>(`/admin/pig-submissions/${s.id}/images`).then(setImages).catch(() => setImages([]));
  };

  const updateStatus = async (id: string, status: PigSubmissionStatus) => {
    try {
      await api.put(`/admin/pig-submissions/${id}/status`, { status });
      load();
      if (selected?.id === id) setSelected((s) => s ? { ...s, status } : null);
    } catch { alert("Update failed."); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this submission?")) return;
    try { await api.delete(`/admin/pig-submissions/${id}`); load(); setSelected(null); } catch { alert("Delete failed."); }
  };

  const contactViaWhatsApp = (s: PigSubmission) => {
    const phone = normalizeWhatsAppNumber(s.phoneNumber);
    const msg = `Hello ${s.farmerName}! 👋 This is Mr.Pork Store.\n\nWe received your pig submission and we're interested. Please share more details or confirm availability. Thank you!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(msg)}`, "_blank");
  };

  const deleteImage = async (imgId: string) => {
    if (!selected || !confirm("Delete this image?")) return;
    try { await api.delete(`/admin/pig-submission-images/${imgId}`); openDetail(selected); } catch { alert("Delete failed."); }
  };

  const uploadSubImage = async (file: File) => {
    if (!selected) return;
    const fd = new FormData();
    fd.append("File",file);
    try { await api.postForm(`/admin/pig-submissions/${selected.id}/images`, fd); openDetail(selected); } catch { alert("Upload failed."); }
  };

  const filtered = filterStatus === "all" ? submissions : submissions.filter((s) => s.status === filterStatus);

  const statusColors: Record<PigSubmissionStatus, string> = {
    NEW: "bg-blue-100 text-blue-700",
    CONTACTED: "bg-yellow-100 text-yellow-700",
    APPROVED: "bg-green-100 text-green-700",
    REJECTED: "bg-red-100 text-red-700",
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-700 text-[#1C0A00]">Pig Submissions</h1>
        <span className="text-sm text-gray-500">{submissions.length} total</span>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {(["all", "NEW", "CONTACTED", "APPROVED", "REJECTED"] as const).map((s) => (
          <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterStatus === s ? "bg-[#9B1C1C] text-white" : "bg-white text-gray-600 border border-gray-200"}`}>{s}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-20 bg-white rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400"><span className="text-5xl block mb-4">🌾</span><p>No submissions found.</p></div>
      ) : (
        <div className="space-y-3">
          {[...filtered].reverse().map((s) => (
            <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 cursor-pointer hover:border-[#9B1C1C]/30 transition-colors" onClick={() => openDetail(s)}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-display font-700 text-[#1C0A00]">{s.farmerName}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${statusColors[s.status]}`}>{s.status}</span>
                  </div>
                  <p className="text-sm text-gray-500">📍 {s.location ?? "—"}{s.weight ? ` · ⚖️ ${s.weight} kg` : ""}{s.expectedPrice ? ` · 💰 ₦${s.expectedPrice.toLocaleString()}` : ""}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(s.createdAt).toLocaleString("en-NG")}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl w-full max-w-md my-8 shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="font-display font-700 text-lg">Submission Details</h2>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
            </div>
            <div className="p-6 space-y-3">
              {[
                ["👤 Name", selected.farmerName],
                ["📞 Phone", selected.phoneNumber],
                ["📧 Email", selected.email || "—"],
                ["📍 Location", selected.location || "—"],
                ["⚖️ Weight", selected.weight ? `${selected.weight} kg` : "—"],
                ["💰 Expected", selected.expectedPrice ? `₦${selected.expectedPrice.toLocaleString()}` : "—"],
                ["📝 Details", selected.pigDetails || "—"],
                ["📅 Submitted", new Date(selected.createdAt).toLocaleString("en-NG")],
              ].map(([l, v]) => (
                <div key={l} className="flex gap-3 text-sm">
                  <span className="text-gray-400 w-28 flex-shrink-0">{l}</span>
                  <span className="text-[#1C0A00] font-medium flex-1 break-words">{v}</span>
                </div>
              ))}

              <div className="border-t border-gray-100 pt-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Photos</p>
                {images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {images.map((img) => (
                      <div key={img.id} className="relative">
                        <img src={img.imageUrl} alt="pig" className="w-20 h-20 object-cover rounded-lg cursor-pointer" onClick={() => window.open(img.imageUrl, "_blank")} />
                        <button onClick={() => deleteImage(img.id)} className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">×</button>
                      </div>
                    ))}
                  </div>
                )}
                <button type="button" onClick={() => subImgRef.current?.click()} className="w-full border-2 border-dashed border-gray-200 hover:border-[#9B1C1C]/40 rounded-lg px-4 py-2 text-xs text-gray-500 text-center transition-colors">
                  📷 Upload Photo
                </button>
                <input ref={subImgRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSubImage(f); e.target.value = ""; }} className="hidden" />
              </div>
            </div>
            <div className="px-6 pb-6 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Update Status</p>
              <div className="flex flex-wrap gap-2">
                {(["NEW", "CONTACTED", "APPROVED", "REJECTED"] as PigSubmissionStatus[]).map((s) => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)} className={`flex-1 min-w-0 py-2 rounded-lg text-xs font-semibold transition-colors ${selected.status === s ? "bg-[#9B1C1C] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>{s}</button>
                ))}
              </div>
              <button onClick={() => contactViaWhatsApp(selected)} className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
                Contact Farmer
              </button>
              <button onClick={() => remove(selected.id)} className="w-full bg-red-50 hover:bg-red-100 text-red-600 font-semibold py-3 rounded-xl text-sm">Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Data Networks ────────────────────────────────────────────────────────────

function NetworksTab() {
  const [networks, setNetworks] = useState<DataNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", logoUrl: "", isActive: true });
  const [editing, setEditing] = useState<DataNetwork | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    api.get<DataNetwork[]>("/data-networks/all").then(setNetworks).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ name: "", logoUrl: "", isActive: true }); setCreating(true); setEditing(null); };
  const openEdit = (n: DataNetwork) => { setForm({ name: n.name, logoUrl: n.logoUrl ?? "", isActive: n.isActive }); setEditing(n); setCreating(false); };
  const close = () => { setCreating(false); setEditing(null); };

  const save = async () => {
    if (!form.name.trim()) { alert("Name required."); return; }
    setSaving(true);
    try {
      const body = { name: form.name, logoUrl: form.logoUrl || null, isActive: form.isActive };
      if (creating) await api.post("/data-networks", body);
      else if (editing) await api.put(`/data-networks/${editing.id}`, body);
      load(); close();
    } catch { alert("Save failed."); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this network?")) return;
    try { await api.delete(`/data-networks/${id}`); load(); } catch { alert("Delete failed."); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-700 text-[#1C0A00]">Data Networks</h1>
        <button onClick={openCreate} className="bg-[#9B1C1C] hover:bg-[#7F1515] text-white font-semibold px-5 py-2.5 rounded-xl text-sm">+ Add Network</button>
      </div>

      {loading ? <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}</div> : (
        <div className="space-y-3">
          {networks.map((n) => (
            <div key={n.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                {n.logoUrl ? <img src={n.logoUrl} alt={n.name} className="w-full h-full object-contain" /> : <span className="text-lg">📶</span>}
              </div>
              <div className="flex-1">
                <span className="font-display font-700 text-[#1C0A00]">{n.name}</span>
                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-semibold ${n.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>{n.isActive ? "Active" : "Inactive"}</span>
              </div>
              <button onClick={() => openEdit(n)} className="p-2 text-gray-400 hover:text-[#9B1C1C]"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
              <button onClick={() => remove(n.id)} className="p-2 text-gray-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h2 className="font-display font-700 text-lg mb-4">{creating ? "Add Network" : "Edit Network"}</h2>
            <div className="space-y-3">
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Network name (e.g. MTN)" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
              <input type="url" value={form.logoUrl} onChange={(e) => setForm((f) => ({ ...f, logoUrl: e.target.value }))} placeholder="Logo URL (optional)" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} className="accent-[#9B1C1C]" />Active</label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={save} disabled={saving} className="flex-1 bg-[#9B1C1C] hover:bg-[#7F1515] disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm">{saving ? "Saving…" : "Save"}</button>
              <button onClick={close} className="px-5 bg-gray-100 text-gray-600 font-semibold py-3 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Data Plans ───────────────────────────────────────────────────────────────

function PlansTab() {
  const [plans, setPlans] = useState<DataPlan[]>([]);
  const [networks, setNetworks] = useState<DataNetwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterNetworkId, setFilterNetworkId] = useState("all");
  const [form, setForm] = useState({ networkId: "", name: "", dataSize: "", validity: "", price: "", isAvailable: true });
  const [editing, setEditing] = useState<DataPlan | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get<DataPlan[]>("/data-plans/all"),
      api.get<DataNetwork[]>("/data-networks/all"),
    ]).then(([p, n]) => { setPlans(p); setNetworks(n); }).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm({ networkId: networks[0]?.id ?? "", name: "", dataSize: "", validity: "", price: "", isAvailable: true }); setCreating(true); setEditing(null); };
  const openEdit = (p: DataPlan) => { setForm({ networkId: p.networkId, name: p.name, dataSize: p.dataSize, validity: p.validity ?? "", price: String(p.price), isAvailable: p.isAvailable }); setEditing(p); setCreating(false); };
  const close = () => { setCreating(false); setEditing(null); };

  const save = async () => {
    if (!form.name.trim() || !form.dataSize.trim() || !form.price) { alert("Name, data size, and price required."); return; }
    setSaving(true);
    try {
      const body = { networkId: form.networkId, name: form.name, dataSize: form.dataSize, validity: form.validity || null, price: parseFloat(form.price), isAvailable: form.isAvailable };
      if (creating) await api.post("/data-plans", body);
      else if (editing) await api.put(`/data-plans/${editing.id}`, body);
      load(); close();
    } catch { alert("Save failed."); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this plan?")) return;
    try { await api.delete(`/data-plans/${id}`); load(); } catch { alert("Delete failed."); }
  };

  const filtered = filterNetworkId === "all" ? plans : plans.filter((p) => p.networkId === filterNetworkId);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-700 text-[#1C0A00]">Data Plans</h1>
        <button onClick={openCreate} className="bg-[#9B1C1C] hover:bg-[#7F1515] text-white font-semibold px-5 py-2.5 rounded-xl text-sm">+ Add Plan</button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <button onClick={() => setFilterNetworkId("all")} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterNetworkId === "all" ? "bg-[#9B1C1C] text-white" : "bg-white text-gray-600 border border-gray-200"}`}>All</button>
        {networks.map((n) => <button key={n.id} onClick={() => setFilterNetworkId(n.id)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filterNetworkId === n.id ? "bg-[#9B1C1C] text-white" : "bg-white text-gray-600 border border-gray-200"}`}>{n.name}</button>)}
      </div>

      {loading ? (
        <div className="space-y-3">{[1, 2].map((i) => <div key={i} className="h-16 bg-white rounded-2xl animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400"><span className="text-5xl block mb-4">📡</span><p>No plans found.</p></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="font-display font-700 text-[#1C0A00]">{p.name}</span>
                  <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{p.networkName}</span>
                  {!p.isAvailable && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Hidden</span>}
                </div>
                <p className="text-xs text-gray-500">{p.dataSize}{p.validity ? ` · ${p.validity}` : ""} · <span className="text-[#9B1C1C] font-bold">₦{p.price.toLocaleString()}</span></p>
              </div>
              <button onClick={() => openEdit(p)} className="p-2 text-gray-400 hover:text-[#9B1C1C]"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg></button>
              <button onClick={() => remove(p.id)} className="p-2 text-gray-400 hover:text-red-500"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
            </div>
          ))}
        </div>
      )}

      {(creating || editing) && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6">
            <h2 className="font-display font-700 text-lg mb-4">{creating ? "Add Plan" : "Edit Plan"}</h2>
            <div className="space-y-3">
              <select value={form.networkId} onChange={(e) => setForm((f) => ({ ...f, networkId: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40 bg-white">
                {networks.map((n) => <option key={n.id} value={n.id}>{n.name}</option>)}
              </select>
              <input type="text" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Plan name (e.g. Daily Lite)" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
              <input type="text" value={form.dataSize} onChange={(e) => setForm((f) => ({ ...f, dataSize: e.target.value }))} placeholder="Data size (e.g. 1 GB)" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
              <input type="text" value={form.validity} onChange={(e) => setForm((f) => ({ ...f, validity: e.target.value }))} placeholder="Validity (e.g. 30 days, optional)" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
              <input type="number" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="Price (₦)" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
              <label className="flex items-center gap-2 text-sm cursor-pointer"><input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm((f) => ({ ...f, isAvailable: e.target.checked }))} className="accent-[#9B1C1C]" />Available to customers</label>
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={save} disabled={saving} className="flex-1 bg-[#9B1C1C] hover:bg-[#7F1515] disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm">{saving ? "Saving…" : "Save"}</button>
              <button onClick={close} className="px-5 bg-gray-100 text-gray-600 font-semibold py-3 rounded-xl text-sm">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── App Settings ─────────────────────────────────────────────────────────────

function SettingsTab({ onSaved }: { onSaved: () => void }) {
  const [settings, setSettings] = useState<AppSetting | null>(null);
  const [form, setForm] = useState({ whatsappNumber: "", businessName: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Change password
  const [cpForm, setCpForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [cpSaving, setCpSaving] = useState(false);
  const [cpMessage, setCpMessage] = useState("");
  const [cpError, setCpError] = useState("");

  useEffect(() => {
    api.get<AppSetting>("/app-settings")
      .then((d) => { setSettings(d); setForm({ whatsappNumber: d.whatsappNumber, businessName: d.businessName }); })
      .catch(() => setError("Could not load settings."))
      .finally(() => setLoading(false));
  }, []);

  const save = async () => {
    if (!form.whatsappNumber.trim()) { setError("WhatsApp number cannot be empty."); return; }
    setSaving(true);
    setError("");
    try {
      await api.put("/app-settings", form);
      setSaved(true);
      onSaved();
      setTimeout(() => setSaved(false), 3000);
    } catch { setError("Save failed. Please try again."); } finally { setSaving(false); }
  };

  const changePassword = async () => {
    if (!cpForm.currentPassword.trim() || !cpForm.newPassword.trim()) { setCpError("All fields are required."); return; }
    if (cpForm.newPassword !== cpForm.confirmPassword) { setCpError("New passwords do not match."); return; }
    if (cpForm.newPassword.length < 6) { setCpError("New password must be at least 6 characters."); return; }
    setCpSaving(true);
    setCpError("");
    setCpMessage("");
    try {
      await api.post("/auth/change-password", { currentPassword: cpForm.currentPassword, newPassword: cpForm.newPassword });
      setCpMessage("Password changed successfully.");
      setCpForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setCpError("Current password is incorrect.");
      } else {
        setCpError("Failed to change password. Please try again.");
      }
    } finally {
      setCpSaving(false);
    }
  };

  if (loading) return <div className="h-40 bg-white rounded-2xl animate-pulse" />;

  return (
    <div>
      <h1 className="font-display text-2xl font-700 text-[#1C0A00] mb-6">App Settings</h1>
      <div className="space-y-6 max-w-lg">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-display font-700 text-base text-[#1C0A00] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-[#25D366]" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" /></svg>
            Business Info
          </h2>
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Business Name</label>
              <input type="text" value={form.businessName} onChange={(e) => setForm((f) => ({ ...f, businessName: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">WhatsApp Number</label>
              <input type="text" value={form.whatsappNumber} onChange={(e) => setForm((f) => ({ ...f, whatsappNumber: e.target.value }))} placeholder="e.g. 2348012345678" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" />
              <p className="text-xs text-gray-400 mt-1">Country code without + (e.g. 2348012345678)</p>
            </div>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button onClick={save} disabled={saving} className={`w-full font-display font-700 py-4 rounded-2xl text-base transition-all hover:scale-[1.02] ${saved ? "bg-green-500 text-white" : "bg-[#9B1C1C] hover:bg-[#7F1515] text-white shadow-lg shadow-red-900/20"}`}>
          {saving ? "Saving…" : saved ? "✓ Saved!" : "Save Settings"}
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="font-display font-700 text-base text-[#1C0A00] mb-4 flex items-center gap-2">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
            Change Password
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Current Password</label>
              <input type="password" value={cpForm.currentPassword} onChange={(e) => setCpForm((f) => ({ ...f, currentPassword: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" autoComplete="current-password" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">New Password</label>
              <input type="password" value={cpForm.newPassword} onChange={(e) => setCpForm((f) => ({ ...f, newPassword: e.target.value }))} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" autoComplete="new-password" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm New Password</label>
              <input type="password" value={cpForm.confirmPassword} onChange={(e) => setCpForm((f) => ({ ...f, confirmPassword: e.target.value }))} onKeyDown={(e) => e.key === "Enter" && changePassword()} className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40" autoComplete="new-password" />
            </div>
          </div>
          {cpError && <p className="text-red-500 text-sm mt-3">{cpError}</p>}
          {cpMessage && <p className="text-green-600 text-sm mt-3 flex items-center gap-1.5"><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>{cpMessage}</p>}
          <button onClick={changePassword} disabled={cpSaving} className="mt-4 w-full bg-gray-800 hover:bg-gray-900 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors">
            {cpSaving ? "Changing…" : "Change Password"}
          </button>
        </div>
      </div>
    </div>
  );
}
