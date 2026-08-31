import { useState, useRef } from "react";
import { api, ApiError } from "../lib/api";
import { useAppContext } from "../lib/AppContext";
import { normalizeWhatsAppNumber } from "../lib/utils";
import type { CreatePigSubmissionRequest, PigSubmission } from "../lib/types";

interface FormState {
  farmerName: string;
  phoneNumber: string;
  email: string;
  location: string;
  animalType: string;
  count: string;
  weight: string;
  expectedPrice: string;
  pigDetails: string;
}

const empty: FormState = {
  farmerName: "",
  phoneNumber: "",
  email: "",
  location: "",
  animalType: "pig",
  count: "",
  weight: "",
  expectedPrice: "",
  pigDetails: "",
};

export default function SellYourPig() {
  const { whatsappNumber } = useAppContext();
  const [form, setForm] = useState<FormState>(empty);
  const [photos, setPhotos] = useState<File[]>([]);
  const [errors, setErrors] = useState<Partial<FormState>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState("");
  const [submission, setSubmission] = useState<PigSubmission | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const validate = (): boolean => {
    const e: Partial<FormState> = {};
    if (!form.farmerName.trim()) e.farmerName = "Name is required";
    if (!form.phoneNumber.trim()) e.phoneNumber = "Phone number is required";
    if (!form.location.trim()) e.location = "Location is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, 5);
    setPhotos(files);
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    setApiError("");

    try {
      // Step 1 — create submission
      const payload: CreatePigSubmissionRequest = {
        farmerName: form.farmerName.trim(),
        phoneNumber: form.phoneNumber.trim(),
        ...(form.email.trim() ? { email: form.email.trim() } : {}),
        ...(form.location.trim() ? { location: form.location.trim() } : {}),
        ...(form.pigDetails.trim()
          ? { pigDetails: `${form.animalType} × ${form.count || "?"} — ${form.pigDetails}`.trim() }
          : { pigDetails: `${form.animalType}${form.count ? ` × ${form.count}` : ""}` }),
        ...(form.weight ? { weight: parseFloat(form.weight) } : {}),
        ...(form.expectedPrice ? { expectedPrice: parseFloat(form.expectedPrice) } : {}),
      };

      const created = await api.post<PigSubmission>("/sell-your-pig", payload);

      // Upload each selected photo to the backend
      if (photos.length > 0) {
        await Promise.all(
          photos.map((photo) => {
            const fd = new FormData();
            fd.append("File", photo);
            return api.postForm(`/admin/pig-submissions/${created.id}/images`, fd);
          })
        );
      }

      setSubmission(created);

      // WhatsApp notification
      if (whatsappNumber) {
        const msg =
          `🌾 *New Pig Sale Submission — Mr.Pork Store*\n\n` +
          `👤 Name: ${form.farmerName}\n` +
          `📞 Phone: ${form.phoneNumber}\n` +
          `📍 Location: ${form.location}\n` +
          `🐷 Animal: ${form.animalType}${form.count ? ` × ${form.count}` : ""}\n` +
          (form.weight ? `⚖️ Est. Weight: ${form.weight} kg\n` : "") +
          (form.expectedPrice ? `💰 Expected Price: ₦${form.expectedPrice}\n` : "") +
          (form.pigDetails ? `📝 Notes: ${form.pigDetails}\n` : "") +
          `\n📋 *Submission ID:* ${created.id}` +
          (photos.length > 0 ? `\n📷 *Photos uploaded:* ${photos.length}` : "");
        window.open(`https://wa.me/${normalizeWhatsAppNumber(whatsappNumber)}?text=${encodeURIComponent(msg)}`, "_blank");
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setApiError(`Submission failed (${err.status}). Please try again or contact us on WhatsApp.`);
      } else {
        setApiError("Network error. Please check your connection and try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const field = (
    key: keyof FormState,
    label: string,
    placeholder: string,
    type = "text"
  ) => (
    <div>
      <label className="block text-sm font-semibold text-[#1C0A00] mb-1.5">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        placeholder={placeholder}
        className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40 transition-all ${
          errors[key] ? "border-red-400 bg-red-50" : "border-gray-200 bg-white"
        }`}
      />
      {errors[key] && <p className="mt-1 text-xs text-red-500">{errors[key]}</p>}
    </div>
  );

  if (submission) {
    return (
      <section className="min-h-screen py-20 px-4 sm:px-6 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="font-display text-3xl font-700 text-[#1C0A00] mb-3">Submission Received!</h2>
          <p className="text-gray-400 text-xs font-mono mb-4">ID: {submission.id}</p>
          <p className="text-gray-500 text-base mb-6 leading-relaxed">
            Your details have been saved and Mr.Pork Store has been notified via WhatsApp. We'll contact you directly if interested.
          </p>
          <button
            onClick={() => { setSubmission(null); setForm(empty); setPhotos([]); }}
            className="bg-[#9B1C1C] hover:bg-[#7F1515] text-white font-semibold px-8 py-3 rounded-xl transition-colors"
          >
            Submit Another
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="min-h-screen py-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-4xl">🌾</span>
            <h1 className="font-display text-4xl sm:text-5xl font-800 text-[#1C0A00]">Sell Your Pig</h1>
          </div>
          <p className="text-[#78350F] text-base max-w-xl">
            Are you a farmer looking to sell your pigs? Submit your details below and Mr.Pork Store will contact you directly if interested. Your information is private and will not be displayed publicly.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex gap-3">
          <span className="text-xl flex-shrink-0">🔒</span>
          <div>
            <p className="text-sm font-semibold text-amber-900 mb-1">Your details are private</p>
            <p className="text-xs text-amber-700 leading-relaxed">
              Farmer submissions are never displayed publicly. Only Mr.Pork Store can view your details.
            </p>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-orange-100 p-6 sm:p-10">
          <div className="grid sm:grid-cols-2 gap-5">
            {field("farmerName", "Full Name *", "e.g. Emeka Okonkwo")}
            {field("phoneNumber", "Phone Number *", "e.g. 08012345678", "tel")}
            {field("location", "Location / Address *", "e.g. Ibadan, Oyo State")}

            <div>
              <label className="block text-sm font-semibold text-[#1C0A00] mb-1.5">
                Email <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                type="email"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="e.g. emeka@gmail.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-[#1C0A00] mb-1.5">Animal Type</label>
              <select
                value={form.animalType}
                onChange={(e) => setForm((f) => ({ ...f, animalType: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40 bg-white"
              >
                <option value="pig">Pig</option>
                <option value="piglet">Piglet</option>
                <option value="sow">Sow (Breeding female)</option>
                <option value="boar">Boar (Breeding male)</option>
              </select>
            </div>

            {field("count", "Number of Animals", "e.g. 5")}
            {field("weight", "Estimated Weight (kg)", "e.g. 80", "number")}
            {field("expectedPrice", "Expected Price (₦)", "e.g. 120000", "number")}

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#1C0A00] mb-1.5">
                Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={form.pigDetails}
                onChange={(e) => setForm((f) => ({ ...f, pigDetails: e.target.value }))}
                placeholder="Breed, feeding routine, health history, or any other relevant details..."
                rows={4}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40 resize-none"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-sm font-semibold text-[#1C0A00] mb-1.5">
                Photos <span className="text-gray-400 font-normal">(optional, up to 5)</span>
              </label>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="w-full border-2 border-dashed border-gray-200 hover:border-[#9B1C1C]/40 rounded-xl px-4 py-6 text-center transition-colors"
              >
                <span className="text-3xl block mb-2">📷</span>
                <span className="text-sm text-gray-500">
                  {photos.length > 0
                    ? `${photos.length} photo(s) selected`
                    : "Click to upload photos of your pig(s)"}
                </span>
              </button>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handlePhotoChange}
                className="hidden"
              />
              {photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {photos.map((f, i) => (
                    <div key={i} className="relative">
                      <img
                        src={URL.createObjectURL(f)}
                        alt={`Photo ${i + 1}`}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => setPhotos((ps) => ps.filter((_, idx) => idx !== i))}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {apiError && (
            <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
              {apiError}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="mt-6 w-full bg-[#9B1C1C] hover:bg-[#7F1515] disabled:opacity-60 text-white font-display font-700 text-lg py-4 rounded-2xl transition-all hover:scale-[1.02] shadow-lg shadow-red-900/20"
          >
            {submitting ? "Submitting…" : "Submit Pig for Sale →"}
          </button>
        </div>
      </div>
    </section>
  );
}
