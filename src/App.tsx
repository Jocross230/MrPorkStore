import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Services from "./components/Services";
import PorkMarketplace from "./components/PorkMarketplace";
import ChickenMarketplace from "./components/ChickenMarketplace";
import SellYourPig from "./components/SellYourPig";
import AirtimeData from "./components/AirtimeData";
import Footer from "./components/Footer";
import AdminDashboard from "./admin/AdminDashboard";
import { AppProvider } from "./lib/AppContext";
import { CartProvider } from "./lib/CartContext";
import CartDrawer from "./components/CartDrawer";
import { api, setOnUnauthorized, isAuthenticated, clearToken, setToken, ApiError } from "./lib/api";
import type { LoginResponse } from "./lib/types";

export type Section = "home" | "pork" | "chicken" | "sell-pig" | "airtime";

// ─── Reset Password View ───────────────────────────────────────────────────────

function ResetPasswordView({ token }: { token: string }) {
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (!newPassword.trim()) { setError("Please enter a new password."); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    if (newPassword.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/reset-password", { token, newPassword });
      setDone(true);
      window.history.replaceState({}, "", window.location.pathname);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.status === 400 ? "Invalid or expired reset link. Please request a new one." : "Reset failed. Please try again.");
      } else {
        setError("Network error. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FFF7ED] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">🔑</span>
          <h2 className="font-display text-2xl font-700 text-[#1C0A00]">Reset Password</h2>
        </div>
        <p className="text-sm text-gray-400 mb-6">Mr.Pork Store · Admin Portal</p>

        {done ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-[#1C0A00] font-semibold mb-2">Password reset successfully!</p>
            <p className="text-sm text-gray-400 mb-6">You can now log in with your new password.</p>
            <button
              onClick={() => window.location.replace(window.location.pathname)}
              className="w-full bg-[#9B1C1C] hover:bg-[#7F1515] text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-3">
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="New password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40"
                autoFocus
                autoComplete="new-password"
              />
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleReset()}
                placeholder="Confirm new password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40"
                autoComplete="new-password"
              />
            </div>
            {error && (
              <p className="text-red-500 text-sm mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </p>
            )}
            <button
              onClick={handleReset}
              disabled={loading}
              className="w-full bg-[#9B1C1C] hover:bg-[#7F1515] disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Forgot Password Modal ─────────────────────────────────────────────────────

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [forgotEmail, setForgotEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!forgotEmail.trim()) { setError("Please enter your email address."); return; }
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email: forgotEmail });
      setMessage("If that email is registered, a reset link has been sent. In development, check the server logs for the reset URL.");
    } catch {
      setMessage("If that email is registered, a reset link has been sent.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">✉️</span>
          <h2 className="font-display text-2xl font-700 text-[#1C0A00]">Forgot Password</h2>
        </div>
        <p className="text-sm text-gray-400 mb-6">Enter your admin email to receive a reset link.</p>

        {message ? (
          <div className="text-center">
            <div className="w-14 h-14 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">{message}</p>
            <button
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm transition-colors"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-3 mb-3">
              <input
                type="email"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                placeholder="admin@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40"
                autoFocus
                autoComplete="email"
              />
            </div>
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <div className="flex gap-3">
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 bg-[#9B1C1C] hover:bg-[#7F1515] disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── App ───────────────────────────────────────────────────────────────────────

export default function App() {
  const [section, setSection] = useState<Section>("home");
  const [adminAuthed, setAdminAuthed] = useState(isAuthenticated);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showCart, setShowCart] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  useEffect(() => {
    setOnUnauthorized(() => {
      setAdminAuthed(false);
      setShowAdminLogin(true);
    });
  }, []);

  // Password reset URL — check after all hooks
  const resetToken = new URLSearchParams(window.location.search).get("token");
  if (resetToken) {
    return (
      <AppProvider>
        <ResetPasswordView token={resetToken} />
      </AppProvider>
    );
  }

  const handleAdminLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setLoginError("Please enter your email and password.");
      return;
    }
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await api.post<LoginResponse>("/auth/login", { email, password });
      const token = res.token;
      if (!token) throw new Error("No token in response");
      setToken(token);
      setAdminAuthed(true);
      setShowAdminLogin(false);
      setPassword("");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setLoginError("Invalid email or password.");
      } else {
        setLoginError("Login failed. Please try again.");
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleAdminLogout = () => {
    clearToken();
    setAdminAuthed(false);
    setEmail("");
    setPassword("");
  };

  const navigate = (s: Section) => {
    setSection(s);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (adminAuthed) {
    return (
      <AppProvider>
        <AdminDashboard onLogout={handleAdminLogout} />
      </AppProvider>
    );
  }

  return (
    <AppProvider>
      <CartProvider>
      <CartDrawer isOpen={showCart} onClose={() => setShowCart(false)} />
      {showForgotPassword && (
        <ForgotPasswordModal
          onClose={() => {
            setShowForgotPassword(false);
            setShowAdminLogin(true);
          }}
        />
      )}

      {showAdminLogin && !showForgotPassword && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 w-full max-w-sm shadow-2xl">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">🔐</span>
              <h2 className="font-display text-2xl font-700 text-[#1C0A00]">Admin Login</h2>
            </div>
            <p className="text-sm text-gray-400 mb-6">Mr.Pork Store · Admin Portal</p>

            <div className="space-y-3 mb-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                placeholder="Email address"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40"
                autoFocus
                autoComplete="email"
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdminLogin()}
                placeholder="Password"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#9B1C1C]/40"
                autoComplete="current-password"
              />
            </div>

            {loginError && (
              <p className="text-red-500 text-sm mb-3 flex items-center gap-1.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {loginError}
              </p>
            )}

            <div className="flex gap-3 mb-4">
              <button
                onClick={handleAdminLogin}
                disabled={loginLoading}
                className="flex-1 bg-[#9B1C1C] hover:bg-[#7F1515] disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                {loginLoading ? "Logging in…" : "Login"}
              </button>
              <button
                onClick={() => {
                  setShowAdminLogin(false);
                  setPassword("");
                  setLoginError("");
                }}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-600 font-semibold py-3 rounded-xl text-sm transition-colors"
              >
                Cancel
              </button>
            </div>

            <button
              onClick={() => {
                setShowAdminLogin(false);
                setShowForgotPassword(true);
              }}
              className="w-full text-center text-xs text-gray-400 hover:text-[#9B1C1C] transition-colors py-1"
            >
              Forgot password?
            </button>
          </div>
        </div>
      )}

      <div className="min-h-screen bg-[#FFF7ED]">
        <Navbar
          currentSection={section}
          onNavigate={navigate}
          onAdminClick={() => setShowAdminLogin(true)}
          onCartClick={() => setShowCart(true)}
        />

        {section === "home" && (
          <>
            <Hero onNavigate={navigate} />
            <Services onNavigate={navigate} />
          </>
        )}
        {section === "pork" && <PorkMarketplace />}
        {section === "chicken" && <ChickenMarketplace />}
        {section === "sell-pig" && <SellYourPig />}
        {section === "airtime" && <AirtimeData />}

        <Footer onNavigate={navigate} onAdminClick={() => setShowAdminLogin(true)} />
      </div>
      </CartProvider>
    </AppProvider>
  );
}
