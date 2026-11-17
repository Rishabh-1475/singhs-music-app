'use client';

import { useState, useEffect, useRef } from 'react';
import {
  X,
  Mail,
  Lock,
  Phone,
  AlertCircle,
  Loader2,
  CheckCircle2,
  KeyRound,
  ShieldCheck,
} from 'lucide-react';
import {
  signInWithGoogle,
  loginWithEmail,
  registerWithEmail,
  setupRecaptchaVerifier,
  sendPhoneOtp,
  verifyPhoneOtp,
} from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';

type AuthTab = 'google' | 'email' | 'phone';

export default function AuthModal() {
  const isAuthModalOpen = useAuthStore((s) => s.isAuthModalOpen);
  const closeAuthModal = useAuthStore((s) => s.closeAuthModal);

  const [activeTab, setActiveTab] = useState<AuthTab>('google');

  // Email form state
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Phone form state
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);

  // Status & error states
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isAuthModalOpen) {
      setErrorMessage(null);
      setSuccessMessage(null);
      setIsLoading(false);
      setOtpSent(false);
      setOtpCode('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
    }
  }, [isAuthModalOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isAuthModalOpen) {
        closeAuthModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAuthModalOpen, closeAuthModal]);

  if (!isAuthModalOpen) return null;

  const handleSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setErrorMessage(null);
    setTimeout(() => {
      closeAuthModal();
      setSuccessMessage(null);
    }, 1200);
  };

  // 1. Google Sign-In
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const user = await signInWithGoogle();
      handleSuccess(`Welcome, ${user.displayName || user.email || 'Friend'}!`);
    } catch (err: unknown) {
      const error = err as { message?: string; code?: string };
      console.error('Google Sign-In Error:', error);
      if (error.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in cancelled.');
      } else {
        setErrorMessage(error.message || 'Google authentication failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Email / Password Sign In & Sign Up
  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      if (isSignUp) {
        const user = await registerWithEmail(email, password);
        handleSuccess(`Account created! Welcome, ${user.email}`);
      } else {
        const user = await loginWithEmail(email, password);
        handleSuccess(`Signed in as ${user.email}`);
      }
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('Email Auth Error:', error);
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        setErrorMessage('Invalid email or password.');
      } else if (error.code === 'auth/email-already-in-use') {
        setErrorMessage('An account with this email already exists.');
      } else if (error.code === 'auth/invalid-email') {
        setErrorMessage('Please provide a valid email address.');
      } else {
        setErrorMessage(error.message || 'Authentication error. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Phone Number OTP Dispatch
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const formatted = phoneNumber.trim();
    if (!formatted.startsWith('+') || formatted.length < 8) {
      setErrorMessage('Please enter a valid international phone number starting with + (e.g. +919876543210)');
      return;
    }

    setIsLoading(true);
    try {
      const verifier = setupRecaptchaVerifier('recaptcha-container');
      recaptchaVerifierRef.current = verifier;

      const result = await sendPhoneOtp(formatted, verifier);
      setConfirmationResult(result);
      setOtpSent(true);
      setSuccessMessage('OTP sent! Please check your SMS messages.');
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('Phone OTP Dispatch Error:', error);
      if (error.code === 'auth/invalid-phone-number') {
        setErrorMessage('Invalid phone number format.');
      } else if (error.code === 'auth/too-many-requests') {
        setErrorMessage('Too many requests. Please try again later.');
      } else {
        setErrorMessage(error.message || 'Failed to send OTP code. Please retry.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Verify OTP Code
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!confirmationResult) {
      setErrorMessage('Please request a new OTP first.');
      return;
    }

    if (otpCode.trim().length !== 6) {
      setErrorMessage('Please enter the 6-digit confirmation code.');
      return;
    }

    setIsLoading(true);
    try {
      const user = await verifyPhoneOtp(confirmationResult, otpCode.trim());
      handleSuccess(`Verified! Welcome ${user.phoneNumber || 'User'}`);
    } catch (err: unknown) {
      const error = err as { code?: string; message?: string };
      console.error('Verify OTP Error:', error);
      if (error.code === 'auth/invalid-verification-code') {
        setErrorMessage('Incorrect OTP code. Please check and re-enter.');
      } else {
        setErrorMessage(error.message || 'Verification failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) closeAuthModal();
      }}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="bg-neutral-900/95 border border-white/10 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl max-w-md w-full relative text-white animate-in zoom-in-95 duration-200"
      >
        {/* Invisible container for Firebase Phone Recaptcha */}
        <div id="recaptcha-container"></div>

        {/* Top-Right Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 border border-white/10 flex items-center justify-center text-neutral-400 hover:text-white transition-colors cursor-pointer"
          title="Close modal"
          aria-label="Close modal"
        >
          <X size={16} />
        </button>

        {/* Header Branding */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3 shadow-lg shadow-emerald-500/10">
            <ShieldCheck size={26} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">
            Singh&apos;s Music Company
          </h2>
          <p className="text-xs text-neutral-400 mt-1">
            Sign in to unlock personalized lossless audio &amp; synced playlists
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-white/10 mb-6 text-sm font-semibold">
          <button
            onClick={() => {
              setActiveTab('google');
              setErrorMessage(null);
            }}
            className={`flex-1 pb-3 text-center transition-colors relative ${
              activeTab === 'google'
                ? 'text-emerald-400 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Google
            {activeTab === 'google' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('email');
              setErrorMessage(null);
            }}
            className={`flex-1 pb-3 text-center transition-colors relative ${
              activeTab === 'email'
                ? 'text-emerald-400 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Email
            {activeTab === 'email' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
            )}
          </button>

          <button
            onClick={() => {
              setActiveTab('phone');
              setErrorMessage(null);
            }}
            className={`flex-1 pb-3 text-center transition-colors relative ${
              activeTab === 'phone'
                ? 'text-emerald-400 font-bold'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Phone (OTP)
            {activeTab === 'phone' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
            )}
          </button>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-in fade-in">
            <CheckCircle2 size={16} className="text-emerald-400 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2 animate-in fade-in">
            <AlertCircle size={16} className="text-rose-400 flex-shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: GOOGLE OAUTH */}
        {activeTab === 'google' && (
          <div className="space-y-4 py-2">
            <p className="text-xs text-neutral-300 text-center leading-relaxed">
              Fast, secure one-click authentication. Synchronize your favorites across mobile, tablet, and desktop.
            </p>

            <button
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-2xl bg-white hover:bg-neutral-100 text-neutral-900 font-bold text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin text-neutral-900" />
              ) : (
                /* Official Google "G" SVG Icon */
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.36 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.36 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
              )}
              <span>Continue with Google</span>
            </button>
          </div>
        )}

        {/* TAB 2: EMAIL & PASSWORD */}
        {activeTab === 'email' && (
          <form onSubmit={handleEmailAuth} className="space-y-4">
            <div className="space-y-3">
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  required
                  className="w-full bg-[#16191E] border border-[#22262F] hover:border-neutral-600 focus:border-emerald-400 text-xs sm:text-sm text-white placeholder:text-neutral-500 rounded-2xl py-3 pl-10 pr-4 outline-none transition-colors"
                />
              </div>

              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password (min 6 characters)"
                  required
                  className="w-full bg-[#16191E] border border-[#22262F] hover:border-neutral-600 focus:border-emerald-400 text-xs sm:text-sm text-white placeholder:text-neutral-500 rounded-2xl py-3 pl-10 pr-4 outline-none transition-colors"
                />
              </div>

              {isSignUp && (
                <div className="relative animate-in fade-in">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm Password"
                    required
                    className="w-full bg-[#16191E] border border-[#22262F] hover:border-neutral-600 focus:border-emerald-400 text-xs sm:text-sm text-white placeholder:text-neutral-500 rounded-2xl py-3 pl-10 pr-4 outline-none transition-colors"
                  />
                </div>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <Loader2 size={18} className="animate-spin text-black" />
              ) : isSignUp ? (
                'Create Account'
              ) : (
                'Sign In with Email'
              )}
            </button>

            <div className="text-center pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setErrorMessage(null);
                }}
                className="text-xs text-neutral-400 hover:text-emerald-400 transition-colors"
              >
                {isSignUp
                  ? 'Already have an account? Sign In'
                  : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        )}

        {/* TAB 3: PHONE NUMBER + OTP */}
        {activeTab === 'phone' && (
          <div className="space-y-4">
            {!otpSent ? (
              <form onSubmit={handleSendOtp} className="space-y-4">
                <p className="text-xs text-neutral-400">
                  Enter your mobile number with country code to receive an SMS verification code.
                </p>

                <div className="relative">
                  <Phone size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="tel"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full bg-[#16191E] border border-[#22262F] hover:border-neutral-600 focus:border-emerald-400 text-xs sm:text-sm text-white placeholder:text-neutral-500 rounded-2xl py-3 pl-10 pr-4 outline-none transition-colors font-mono"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin text-black" />
                  ) : (
                    'Send OTP Code'
                  )}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4 animate-in fade-in">
                <p className="text-xs text-neutral-400">
                  Enter the 6-digit confirmation code sent to{' '}
                  <span className="text-white font-mono">{phoneNumber}</span>.
                </p>

                <div className="relative">
                  <KeyRound size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="123456"
                    required
                    autoFocus
                    className="w-full bg-[#16191E] border border-[#22262F] hover:border-neutral-600 focus:border-emerald-400 text-base text-center tracking-[0.5em] text-white placeholder:tracking-normal placeholder:text-neutral-500 rounded-2xl py-3 pl-10 pr-4 outline-none transition-colors font-mono font-bold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || otpCode.length !== 6}
                  className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-sm tracking-wide shadow-lg shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin text-black" />
                  ) : (
                    'Verify & Sign In'
                  )}
                </button>

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode('');
                      setErrorMessage(null);
                    }}
                    className="text-xs text-neutral-400 hover:text-emerald-400 transition-colors"
                  >
                    Change Phone Number or Resend
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Footer info */}
        <p className="text-[10px] text-neutral-500 text-center mt-6">
          By signing in, you agree to SMC&apos;s Terms of Service &bull; Lossless Music Co.
        </p>
      </div>
    </div>
  );
}
