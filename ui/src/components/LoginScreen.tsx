"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, Mail, ArrowRight, UserCheck } from "lucide-react";
import Image from "next/image";

interface LoginScreenProps {
  onLogin: (email: string, firstName: string, lastName: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [step, setStep] = useState(1); // 1 = collect email/google, 2 = profile details
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [showGooglePopup, setShowGooglePopup] = useState(false);
  const [popupEmail, setPopupEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [popupError, setPopupError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [profileError, setProfileError] = useState("");

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setEmailError("Please enter a valid email address");
      return;
    }
    setEmailError("");
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setStep(2);
    }, 800);
  };

  const handleGooglePopupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!popupEmail.trim() || !popupEmail.includes("@")) {
      setPopupError("Please enter a valid Google Account email");
      return;
    }
    setPopupError("");
    setIsSubmitting(true);
    setTimeout(() => {
      setEmail(popupEmail.trim());
      setIsSubmitting(false);
      setShowGooglePopup(false);
      setStep(2);
    }, 1000);
  };

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setProfileError("First Name is required");
      return;
    }
    setProfileError("");
    setIsSubmitting(true);
    setTimeout(() => {
      onLogin(email.trim(), firstName.trim(), lastName.trim());
      setIsSubmitting(false);
    }, 1200);
  };

  return (
    <div style={{
      position: "relative", display: "flex", minHeight: "100dvh", width: "100%",
      alignItems: "center", justifyContent: "center", padding: "12px 16px",
      color: "var(--text, #e8e6df)", overflow: "hidden",
      background: "var(--bg, #0d0d0f)",
    }}>
      {/* Dynamic Background Gradients */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at top right, rgba(139,92,246,0.15), transparent 45%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(circle at bottom left, rgba(96,165,250,0.12), transparent 50%)",
        pointerEvents: "none",
      }} />

      {/* Glassmorphic Login Card */}
      <div style={{
        position: "relative", width: "100%", maxWidth: 440,
        borderRadius: 24, border: "1px solid rgba(255,255,255,0.05)",
        background: "rgba(255,255,255,0.02)", padding: 32,
        boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
        backdropFilter: "blur(16px)",
        animation: "fade-up 0.3s ease",
      }}>

        {/* Step 1: Collect Email */}
        {step === 1 && (
          <>
            {/* Brand Header */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{
                position: "relative", marginBottom: 24, width: 80, height: 80,
                borderRadius: 20, overflow: "hidden",
                background: "var(--surface-3, #1a1a2e)", boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                border: "2px solid rgba(139,92,246,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Image src="/jessica-png.jpg" alt="Jessica" width={80} height={80} style={{ objectFit: "cover" }} />
              </div>
              <h2 style={{
                fontSize: 24, fontWeight: 700, letterSpacing: "-0.02em",
                background: "linear-gradient(135deg, #fff, var(--text, #e8e6df), var(--text-muted, #888))",
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
                margin: 0,
              }}>
                Welcome to Jessica 3.0
              </h2>
              <p style={{ marginTop: 8, fontSize: 13.5, color: "var(--text-muted, #888)" }}>
                Deep Research Intelligence Agent
              </p>
            </div>

            {/* Auth Buttons */}
            <div style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Continue with Google */}
              <button
                onClick={() => setShowGooglePopup(true)}
                style={{
                  display: "flex", width: "100%", alignItems: "center", justifyContent: "center",
                  gap: 12, borderRadius: 14, border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.05)", padding: "12px 0",
                  fontSize: 14, fontWeight: 600, color: "var(--text, #e8e6df)",
                  cursor: "pointer", transition: "all 0.2s", fontFamily: "inherit",
                }}
                onMouseEnter={e => { e.currentTarget.style.background = "rgba(255,255,255,0.1)"; e.currentTarget.style.borderColor = "rgba(139,92,246,0.3)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(255,255,255,0.05)"; e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"; }}
              >
                <svg width={18} height={18} viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12.24 10.285V14.4h6.887c-.275 1.565-1.88 4.604-6.887 4.604-4.33 0-7.859-3.578-7.859-8s3.53-8 7.859-8c2.46 0 4.105 1.025 5.047 1.926l3.227-3.11C18.281 1.7 15.483 1 12.24 1 5.969 1 1 5.97 1 12s4.969 11 11.24 11c6.545 0 10.89-4.604 10.89-11.085 0-.742-.083-1.31-.184-1.63H12.24z" />
                </svg>
                Continue with Google
              </button>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", padding: "4px 0" }}>
                <div style={{ flex: 1, borderTop: "1px solid rgba(255,255,255,0.05)" }} />
                <span style={{ padding: "0 16px", fontSize: 11, color: "var(--text-dim, #555)", textTransform: "uppercase", fontWeight: 500, letterSpacing: "0.08em" }}>or</span>
                <div style={{ flex: 1, borderTop: "1px solid rgba(255,255,255,0.05)" }} />
              </div>

              {/* Email input */}
              <form onSubmit={handleEmailSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div>
                  <div style={{
                    display: "flex", alignItems: "center",
                    borderRadius: 14, border: "1px solid rgba(255,255,255,0.05)",
                    background: "rgba(255,255,255,0.02)", transition: "border-color 0.2s",
                  }}>
                    <div style={{ padding: "0 0 0 12px", display: "flex", alignItems: "center" }}>
                      <Mail size={16} style={{ color: "var(--text-dim, #555)" }} />
                    </div>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your email address"
                      style={{
                        flex: 1, border: "none", background: "transparent",
                        padding: "12px 16px 12px 10px", fontSize: 14,
                        color: "var(--text, #e8e6df)", outline: "none",
                        fontFamily: "inherit",
                      }}
                    />
                  </div>
                  {emailError && (
                    <p style={{ marginTop: 6, fontSize: 12, color: "#f87171", fontWeight: 500 }}>{emailError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    display: "flex", width: "100%", alignItems: "center", justifyContent: "center",
                    gap: 8, borderRadius: 14, border: "none",
                    background: "rgba(139,92,246,0.1)", padding: "12px 0",
                    fontSize: 14, fontWeight: 600, color: "#c4b5fd",
                    cursor: isSubmitting ? "wait" : "pointer", transition: "all 0.2s",
                    opacity: isSubmitting ? 0.5 : 1, fontFamily: "inherit",
                  }}
                  onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = "rgba(139,92,246,0.2)"; }}
                  onMouseLeave={e => { e.currentTarget.style.background = "rgba(139,92,246,0.1)"; }}
                >
                  {isSubmitting ? (
                    <><Loader2 size={16} style={{ animation: "jessica-orbit 1s linear infinite" }} /> Processing...</>
                  ) : (
                    <>Continue with Email <ArrowRight size={16} /></>
                  )}
                </button>
              </form>
            </div>
          </>
        )}

        {/* Step 2: Complete Profile */}
        {step === 2 && (
          <div style={{ animation: "fade-up 0.3s ease" }}>
            {/* Header */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
              <div style={{
                position: "relative", marginBottom: 24, width: 56, height: 56,
                borderRadius: 14, overflow: "hidden",
                background: "rgba(139,92,246,0.1)", color: "#a78bfa",
                border: "2px solid rgba(139,92,246,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <UserCheck size={28} />
              </div>
              <h2 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text, #fff)", margin: 0 }}>
                Complete your Profile
              </h2>
              <p style={{ marginTop: 8, fontSize: 12, color: "var(--text-muted, #888)", maxWidth: 280 }}>
                Tell us your name so Jessica can personalize your research workspace
              </p>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleProfileSubmit} style={{ marginTop: 32, display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Display pre-filled Email */}
              <div style={{
                borderRadius: 14, border: "1px solid rgba(255,255,255,0.05)",
                background: "rgba(255,255,255,0.01)", padding: "10px 16px",
              }}>
                <p style={{ margin: 0, fontSize: 10, textTransform: "uppercase", fontWeight: 700, letterSpacing: "0.08em", color: "var(--text-dim, #555)" }}>Email Account</p>
                <p style={{ margin: "4px 0 0", fontSize: 14, fontWeight: 500, color: "var(--text-muted, #888)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{email}</p>
              </div>

              {/* First Name */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted, #888)", marginBottom: 6 }}>First Name</label>
                <div style={{
                  borderRadius: 14, border: "1px solid rgba(255,255,255,0.05)",
                  background: "rgba(255,255,255,0.02)", transition: "border-color 0.2s",
                }}>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    required
                    style={{
                      width: "100%", border: "none", background: "transparent",
                      padding: "12px 16px", fontSize: 14,
                      color: "var(--text, #e8e6df)", outline: "none",
                      fontFamily: "inherit", boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {/* Last Name */}
              <div>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--text-muted, #888)", marginBottom: 6 }}>Last Name (Optional)</label>
                <div style={{
                  borderRadius: 14, border: "1px solid rgba(255,255,255,0.05)",
                  background: "rgba(255,255,255,0.02)", transition: "border-color 0.2s",
                }}>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                    style={{
                      width: "100%", border: "none", background: "transparent",
                      padding: "12px 16px", fontSize: 14,
                      color: "var(--text, #e8e6df)", outline: "none",
                      fontFamily: "inherit", boxSizing: "border-box",
                    }}
                  />
                </div>
              </div>

              {profileError && (
                <p style={{ fontSize: 12, color: "#f87171", fontWeight: 500, margin: 0 }}>{profileError}</p>
              )}

              {/* Submit */}
              <button
                type="submit"
                disabled={isSubmitting}
                style={{
                  display: "flex", width: "100%", alignItems: "center", justifyContent: "center",
                  gap: 8, borderRadius: 14, border: "none",
                  background: "rgba(139,92,246,0.1)", padding: "12px 0",
                  fontSize: 14, fontWeight: 600, color: "#c4b5fd",
                  cursor: isSubmitting ? "wait" : "pointer", transition: "all 0.2s",
                  opacity: isSubmitting ? 0.5 : 1, fontFamily: "inherit",
                }}
                onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = "rgba(139,92,246,0.2)"; }}
                onMouseLeave={e => { e.currentTarget.style.background = "rgba(139,92,246,0.1)"; }}
              >
                {isSubmitting ? (
                  <><Loader2 size={16} style={{ animation: "jessica-orbit 1s linear infinite" }} /> Initializing workspace...</>
                ) : (
                  <>Enter Workspace <ArrowRight size={16} /></>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Security Footer */}
        <div style={{
          marginTop: 32, display: "flex", alignItems: "center", justifyContent: "center",
          gap: 6, fontSize: 11, color: "var(--text-dim, #555)",
        }}>
          <ShieldCheck size={14} style={{ color: "rgba(16,185,129,0.8)" }} />
          <span>Secured with standard end-to-end cryptographic layers.</span>
        </div>
      </div>

      {/* Google Authentication Pop-up */}
      {showGooglePopup && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 100,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: "rgba(0,0,0,0.75)", backdropFilter: "blur(4px)",
        }}>
          <div style={{
            position: "relative", width: "100%", maxWidth: 380,
            borderRadius: 16, border: "1px solid #333",
            background: "#1e1e1e", padding: 24, boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
            textAlign: "left", animation: "fade-up 0.2s ease",
          }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, borderBottom: "1px solid #333", paddingBottom: 16, marginBottom: 16 }}>
              <svg width={20} height={20} viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span style={{ fontSize: 13, fontWeight: 500, color: "#ccc" }}>Sign in with Google</span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "#fff" }}>Choose an account</h3>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "#888" }}>
                  to continue to <span style={{ color: "#a78bfa", fontWeight: 500 }}>Jessica 3.0</span>
                </p>
              </div>

              <form onSubmit={handleGooglePopupSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <input
                  type="email"
                  value={popupEmail}
                  onChange={(e) => setPopupEmail(e.target.value)}
                  placeholder="Enter your Gmail address"
                  required
                  style={{
                    width: "100%", borderRadius: 8, border: "1px solid #444",
                    background: "#111", padding: "10px 12px", fontSize: 14,
                    color: "#fff", outline: "none", fontFamily: "inherit",
                    boxSizing: "border-box",
                  }}
                />
                {popupError && (
                  <p style={{ fontSize: 12, color: "#f87171", fontWeight: 500, margin: 0 }}>{popupError}</p>
                )}

                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 10, paddingTop: 8, borderTop: "1px solid #333" }}>
                  <button
                    type="button"
                    onClick={() => setShowGooglePopup(false)}
                    style={{
                      borderRadius: 8, padding: "8px 14px", fontSize: 12,
                      fontWeight: 600, color: "#888", background: "none",
                      border: "none", cursor: "pointer", transition: "all 0.2s",
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={e => { e.currentTarget.style.background = "#2a2a2a"; e.currentTarget.style.color = "#fff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "none"; e.currentTarget.style.color = "#888"; }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      display: "flex", alignItems: "center", gap: 6,
                      borderRadius: 8, background: "#2563eb", padding: "8px 16px",
                      fontSize: 12, fontWeight: 600, color: "#fff",
                      border: "none", cursor: isSubmitting ? "wait" : "pointer",
                      transition: "all 0.2s", opacity: isSubmitting ? 0.5 : 1,
                      fontFamily: "inherit",
                    }}
                    onMouseEnter={e => { if (!isSubmitting) e.currentTarget.style.background = "#3b82f6"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = "#2563eb"; }}
                  >
                    {isSubmitting ? (
                      <><Loader2 size={12} style={{ animation: "jessica-orbit 1s linear infinite" }} /> Verifying...</>
                    ) : "Next"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
