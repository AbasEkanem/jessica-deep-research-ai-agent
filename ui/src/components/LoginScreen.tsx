"use client";

import { useState } from "react";
import { Loader2, ShieldCheck, ArrowRight, UserCheck } from "lucide-react";
import Image from "next/image";
import { signIn } from "next-auth/react";

/* ═══════════════════════════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════════════════════════ */
export function LoginScreen() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState("");
  const [profileError, setProfileError] = useState("");

  /* ── Profile submit ───────────────────────────────────────── */
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) {
      setProfileError("First Name is required");
      return;
    }
    setProfileError("");
    setIsSubmitting(true);
    
    // Attempt credentials sign in
    const res = await signIn("credentials", {
      email: email.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      redirect: false,
    });

    if (res?.error) {
      setProfileError(res.error);
      setIsSubmitting(false);
    }
    // On success, NextAuth will update the session and the parent component 
    // (page.tsx) will automatically re-render without the LoginScreen.
  };

  const handleGoogleSignIn = () => {
    setAuthError("");
    signIn("google").catch((err) => {
      setAuthError("Google Sign-In failed. Try the email option below.");
    });
  };

  /* ── Shared styles ────────────────────────────────────────── */
  const inputWrapStyle: React.CSSProperties = {
    borderRadius: 14,
    border: "1px solid rgba(255,255,255,0.05)",
    background: "rgba(255,255,255,0.02)",
    transition: "border-color 0.2s",
  };
  const inputStyle: React.CSSProperties = {
    width: "100%",
    border: "none",
    background: "transparent",
    padding: "12px 16px",
    fontSize: 14,
    color: "var(--text, #e8e6df)",
    outline: "none",
    fontFamily: "inherit",
    boxSizing: "border-box",
  };
  const submitBtnStyle: React.CSSProperties = {
    display: "flex",
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    border: "none",
    background: "rgba(139,92,246,0.1)",
    padding: "12px 0",
    fontSize: 14,
    fontWeight: 600,
    color: "#c4b5fd",
    cursor: isSubmitting ? "wait" : "pointer",
    transition: "all 0.2s",
    opacity: isSubmitting ? 0.5 : 1,
    fontFamily: "inherit",
  };

  /* ─────────────────────────────────────────────────────────── */
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        minHeight: "100dvh",
        width: "100%",
        alignItems: "center",
        justifyContent: "center",
        padding: "12px 16px",
        color: "var(--text, #e8e6df)",
        overflow: "hidden",
        background: "var(--bg, #0d0d0f)",
      }}
    >
      {/* Background gradients */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at top right, rgba(139,92,246,0.15), transparent 45%)",
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at bottom left, rgba(96,165,250,0.12), transparent 50%)",
          pointerEvents: "none",
        }}
      />

      {/* Card */}
      <div
        style={{
          position: "relative",
          width: "100%",
          maxWidth: 440,
          borderRadius: 24,
          border: "1px solid rgba(255,255,255,0.05)",
          background: "rgba(255,255,255,0.02)",
          padding: 32,
          boxShadow: "0 25px 50px rgba(0,0,0,0.4)",
          backdropFilter: "blur(16px)",
          animation: "fade-up 0.3s ease",
        }}
      >
        {/* ── STEP 1: Google Sign-In ─────────────────────────── */}
        {step === 1 && (
          <>
            {/* Brand header */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  position: "relative",
                  marginBottom: 24,
                  width: 96,
                  height: 96,
                  borderRadius: 24,
                  overflow: "hidden",
                  background: "transparent",
                  boxShadow: "0 10px 30px rgba(0,0,0,0.3)",
                  border: "2px solid rgba(139,92,246,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Image
                  src="/jessica-png.png"
                  alt="Jessica"
                  width={96}
                  height={96}
                  style={{
                    objectFit: "cover",
                    mixBlendMode: "screen",
                    filter: "contrast(200%)",
                    transform: "scale(1.08)",
                  }}
                />
              </div>

              <h2
                style={{
                  fontSize: 24,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  background:
                    "linear-gradient(135deg, #fff, var(--text, #e8e6df), var(--text-muted, #888))",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  margin: 0,
                }}
              >
                Welcome to Jessica 3.0
              </h2>
              <p
                style={{
                  marginTop: 8,
                  fontSize: 13.5,
                  color: "var(--text-muted, #888)",
                }}
              >
                Deep Research Intelligence Agent
              </p>
            </div>

            {/* Auth area */}
            <div
              style={{
                marginTop: 32,
                display: "flex",
                flexDirection: "column",
                gap: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 12,
                    width: "100%",
                    borderRadius: 14,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: "#121212",
                    padding: "12px 0",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#fff",
                    cursor: "pointer",
                    transition: "background 0.2s, border-color 0.2s",
                    fontFamily: "inherit",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#1a1a1a";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#121212";
                    e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                  </svg>
                  Continue with Google
                </button>

                {authError && (
                  <p
                    style={{
                      fontSize: 12,
                      color: "#f87171",
                      fontWeight: 500,
                      margin: 0,
                      textAlign: "center",
                    }}
                  >
                    {authError}
                  </p>
                )}
              </div>

              {/* Divider */}
              <div style={{ display: "flex", alignItems: "center", padding: "0" }}>
                <div style={{ flex: 1, borderTop: "1px solid rgba(255,255,255,0.05)" }} />
                <span
                  style={{
                    padding: "0 16px",
                    fontSize: 11,
                    color: "var(--text-dim, #555)",
                    textTransform: "uppercase",
                    fontWeight: 500,
                    letterSpacing: "0.08em",
                  }}
                >
                  or
                </span>
                <div style={{ flex: 1, borderTop: "1px solid rgba(255,255,255,0.05)" }} />
              </div>

              {/* Manual e-mail fallback */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setAuthError("");
                  if (!email.trim() || !email.includes("@")) {
                    setAuthError("Please enter a valid email address");
                    return;
                  }
                  setStep(2);
                }}
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                <div style={inputWrapStyle}>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email address"
                    style={inputStyle}
                  />
                </div>

                <button
                  type="submit"
                  style={submitBtnStyle}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(139,92,246,0.2)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(139,92,246,0.1)";
                  }}
                >
                  Continue with Email <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </>
        )}

        {/* ── STEP 2: Complete Profile ───────────────────────── */}
        {step === 2 && (
          <div style={{ animation: "fade-up 0.3s ease" }}>
            {/* Header */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  marginBottom: 24,
                  width: 56,
                  height: 56,
                  borderRadius: 14,
                  background: "rgba(139,92,246,0.1)",
                  color: "#a78bfa",
                  border: "2px solid rgba(139,92,246,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <UserCheck size={28} />
              </div>

              <h2
                style={{
                  fontSize: 20,
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  color: "var(--text, #fff)",
                  margin: 0,
                }}
              >
                Complete your Profile
              </h2>
              <p
                style={{
                  marginTop: 8,
                  fontSize: 12,
                  color: "var(--text-muted, #888)",
                  maxWidth: 280,
                }}
              >
                Tell us your name so Jessica can personalize your research workspace
              </p>
            </div>

            <form
              onSubmit={handleProfileSubmit}
              style={{
                marginTop: 28,
                display: "flex",
                flexDirection: "column",
                gap: 14,
              }}
            >
              {/* Pre-filled email (read-only) */}
              <div
                style={{
                  borderRadius: 14,
                  border: "1px solid rgba(255,255,255,0.05)",
                  background: "rgba(255,255,255,0.01)",
                  padding: "10px 16px",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: 10,
                    textTransform: "uppercase",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    color: "var(--text-dim, #555)",
                  }}
                >
                  Email Account
                </p>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 14,
                    fontWeight: 500,
                    color: "var(--text-muted, #888)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {email}
                </p>
              </div>

              {/* First name */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-muted, #888)",
                    marginBottom: 6,
                  }}
                >
                  First Name
                </label>
                <div style={inputWrapStyle}>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Enter your first name"
                    required
                    style={inputStyle}
                  />
                </div>
              </div>

              {/* Last name */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--text-muted, #888)",
                    marginBottom: 6,
                  }}
                >
                  Last Name{" "}
                  <span style={{ fontWeight: 400, opacity: 0.5 }}>(Optional)</span>
                </label>
                <div style={inputWrapStyle}>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Enter your last name"
                    style={inputStyle}
                  />
                </div>
              </div>

              {profileError && (
                <p
                  style={{
                    fontSize: 12,
                    color: "#f87171",
                    fontWeight: 500,
                    margin: 0,
                  }}
                >
                  {profileError}
                </p>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                style={submitBtnStyle}
                onMouseEnter={(e) => {
                  if (!isSubmitting)
                    e.currentTarget.style.background = "rgba(139,92,246,0.2)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(139,92,246,0.1)";
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2
                      size={16}
                      style={{ animation: "jessica-orbit 1s linear infinite" }}
                    />
                    Initializing workspace…
                  </>
                ) : (
                  <>
                    Enter Workspace <ArrowRight size={16} />
                  </>
                )}
              </button>

              {/* Back link */}
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                }}
                style={{
                  background: "none",
                  border: "none",
                  fontSize: 12,
                  color: "var(--text-dim, #555)",
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textAlign: "center",
                  textDecoration: "underline",
                  padding: 0,
                  marginTop: -4,
                }}
              >
                ← Use a different account
              </button>
            </form>
          </div>
        )}

        {/* Security footer */}
        <div
          style={{
            marginTop: 28,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontSize: 11,
            color: "var(--text-dim, #555)",
          }}
        >
          <ShieldCheck size={14} style={{ color: "rgba(16,185,129,0.8)" }} />
          <span>Secured with standard end-to-end cryptographic layers.</span>
        </div>
      </div>
    </div>
  );
}