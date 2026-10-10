"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  CircleAlert,
  Eye,
  EyeOff,
  LoaderCircle,
} from "lucide-react";
import { authClient } from "@/lib/auth-client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function safeCallbackURL(raw: string | null | undefined, fallback: string) {
  if (!raw) return fallback;
  // Only allow same-origin absolute paths (no //, no scheme).
  if (raw.startsWith("/") && !raw.startsWith("//")) return raw;
  return fallback;
}

function validateName(value: string): string | null {
  if (!value.trim()) return "Enter your full name.";
  if (value.trim().length < 2) return "Name must be at least 2 characters.";
  return null;
}

function validateEmail(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) return "Enter your email address.";
  if (!EMAIL_RE.test(trimmed)) return "Enter a valid email address.";
  return null;
}

function validatePassword(value: string): string | null {
  if (!value) return "Enter your password.";
  if (value.length < 8) return "Password must be at least 8 characters.";
  return null;
}

type FriendlyError = {
  message: string;
  action?: { label: string; href: string };
};

function toFriendlyError(
  raw: string | null | undefined,
  isSignUp: boolean,
  signInHref: string,
): FriendlyError {
  const fallback: FriendlyError = {
    message: isSignUp
      ? "Could not create your account. Check your details and try again."
      : "Could not sign you in. Check your details and try again.",
  };
  if (!raw) return fallback;
  const lower = raw.toLowerCase();

  if (
    lower.includes("already") ||
    lower.includes("duplicate") ||
    lower.includes("taken") ||
    lower.includes("in use")
  ) {
    if (isSignUp) {
      return {
        message: "An account with this email already exists.",
        action: { label: "Sign in instead", href: signInHref },
      };
    }
    return { message: raw.length <= 160 ? raw : fallback.message };
  }
  if (
    lower.includes("invalid") ||
    lower.includes("incorrect") ||
    lower.includes("credential") ||
    lower.includes("mismatch") ||
    lower.includes("not found") ||
    lower.includes("no user") ||
    lower.includes("does not exist")
  ) {
    return {
      message: "Incorrect email or password. Check your details and try again.",
    };
  }
  if (
    (lower.includes("password") &&
      (lower.includes("short") ||
        lower.includes("weak") ||
        lower.includes("8"))) ||
    lower.includes("too short")
  ) {
    return { message: "Password must be at least 8 characters." };
  }
  if (raw.length <= 160) return { message: raw };
  return fallback;
}

function passwordStrength(password: string): { score: number; label: string } {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (password.length >= 12) score += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password) || /[^A-Za-z0-9]/.test(password)) score += 1;
  if (!password) return { score: 0, label: "" };
  if (score <= 1) return { score, label: "Weak" };
  if (score === 2) return { score, label: "Fair" };
  return { score, label: "Strong" };
}

const inputBase =
  "h-12 w-full border bg-canvas px-4 text-sm text-ink placeholder:text-stone focus:outline-none transition-colors disabled:cursor-not-allowed disabled:opacity-60";
const inputIdle = "border-line focus:border-ink";
const inputError = "border-heritage focus:border-heritage";

export function AuthForm({
  mode,
  callbackURL,
}: {
  mode: "sign-in" | "sign-up";
  callbackURL?: string | null;
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<FriendlyError | null>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const isSignUp = mode === "sign-up";
  const target = safeCallbackURL(callbackURL, "/account");
  const callbackQuery =
    callbackURL && callbackURL.startsWith("/") && !callbackURL.startsWith("//")
      ? `?callbackURL=${encodeURIComponent(callbackURL)}`
      : "";
  const signInHref = `/sign-in${callbackQuery}`;

  const fieldErrors = useMemo(() => {
    return {
      name: isSignUp ? validateName(name) : null,
      email: validateEmail(email),
      password: validatePassword(password),
    };
  }, [name, email, password, isSignUp]);

  const show = (field: keyof typeof fieldErrors) =>
    (touched[field] || submitted) && fieldErrors[field];

  const strength = useMemo(() => passwordStrength(password), [password]);
  const passwordMet = password.length >= 8;

  function markTouched(field: keyof typeof touched) {
    setTouched((t) => (t[field] ? t : { ...t, [field]: true }));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setTouched({ name: true, email: true, password: true });
    setServerError(null);

    const errors = {
      name: isSignUp ? validateName(name) : null,
      email: validateEmail(email),
      password: validatePassword(password),
    };
    if (errors.name || errors.email || errors.password) return;

    setPending(true);
    try {
      if (isSignUp) {
        const { error } = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
          callbackURL: target,
        });
        if (error) {
          setServerError(
            toFriendlyError(error.message, true, signInHref),
          );
          return;
        }
      } else {
        const { error } = await authClient.signIn.email({
          email: email.trim(),
          password,
          callbackURL: target,
          rememberMe: true,
        });
        if (error) {
          setServerError(
            toFriendlyError(error.message, false, signInHref),
          );
          return;
        }
      }
      router.push(target);
      router.refresh();
    } catch {
      setServerError({
        message: "Something went wrong. Check your connection and try again.",
      });
    } finally {
      setPending(false);
    }
  }

  const nameError = show("name");
  const emailError = show("email");
  const passwordError = show("password");

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      {isSignUp && (
        <div className="flex flex-col gap-1.5">
          <label htmlFor="auth-name" className="eyebrow text-smoke">
            Full name
          </label>
          <input
            id="auth-name"
            name="name"
            type="text"
            autoComplete="name"
            placeholder="Ava Stone"
            value={name}
            disabled={pending}
            aria-invalid={Boolean(nameError)}
            aria-describedby={nameError ? "auth-name-error" : undefined}
            onChange={(e) => {
              setName(e.target.value);
              if (serverError) setServerError(null);
            }}
            onBlur={() => markTouched("name")}
            className={`${inputBase} ${nameError ? inputError : inputIdle}`}
          />
          {nameError && (
            <p id="auth-name-error" className="text-xs leading-relaxed text-heritage">
              {nameError}
            </p>
          )}
        </div>
      )}

      <div className="flex flex-col gap-1.5">
        <label htmlFor="auth-email" className="eyebrow text-smoke">
          Email address
        </label>
        <input
          id="auth-email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          placeholder="you@example.com"
          value={email}
          disabled={pending}
          aria-invalid={Boolean(emailError)}
          aria-describedby={emailError ? "auth-email-error" : undefined}
          onChange={(e) => {
            setEmail(e.target.value);
            if (serverError) setServerError(null);
          }}
          onBlur={() => markTouched("email")}
          className={`${inputBase} ${emailError ? inputError : inputIdle}`}
        />
        {emailError && (
          <p id="auth-email-error" className="text-xs leading-relaxed text-heritage">
            {emailError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1.5">
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor="auth-password" className="eyebrow text-smoke">
            Password
          </label>
          {isSignUp ? (
            <span className="text-xs text-stone">Minimum 8 characters</span>
          ) : null}
        </div>
        <div className="relative">
          <input
            id="auth-password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={isSignUp ? "new-password" : "current-password"}
            placeholder="Minimum 8 characters"
            value={password}
            disabled={pending}
            aria-invalid={Boolean(passwordError)}
            aria-describedby={
              passwordError
                ? "auth-password-error"
                : isSignUp && password
                  ? "auth-password-strength"
                  : undefined
            }
            onChange={(e) => {
              setPassword(e.target.value);
              if (serverError) setServerError(null);
            }}
            onBlur={() => markTouched("password")}
            className={`${inputBase} pr-12 ${passwordError ? inputError : inputIdle}`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            disabled={pending}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-2 flex h-9 w-9 -translate-y-1/2 items-center justify-center text-smoke transition-colors hover:text-ink disabled:opacity-40"
          >
            {showPassword ? (
              <EyeOff className="h-4.5 w-4.5" aria-hidden="true" />
            ) : (
              <Eye className="h-4.5 w-4.5" aria-hidden="true" />
            )}
          </button>
        </div>
        {passwordError ? (
          <p id="auth-password-error" className="text-xs leading-relaxed text-heritage">
            {passwordError}
          </p>
        ) : isSignUp && password ? (
          <div id="auth-password-strength" className="mt-1 flex flex-col gap-1.5" aria-live="polite">
            <div className="flex items-center gap-1.5" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={`h-0.5 flex-1 ${
                    i < strength.score
                      ? strength.score <= 1
                        ? "bg-heritage"
                        : strength.score === 2
                          ? "bg-gold"
                          : "bg-forest"
                      : "bg-line"
                  }`}
                />
              ))}
            </div>
            <p className="flex items-center gap-1.5 text-xs text-smoke">
              <Check
                className={`h-3.5 w-3.5 ${passwordMet ? "text-forest" : "text-stone"}`}
                aria-hidden="true"
              />
              {passwordMet ? (
                <>
                  8+ characters — <span className="text-ink">{strength.label} password</span>
                </>
              ) : (
                "Use at least 8 characters"
              )}
            </p>
          </div>
        ) : null}
      </div>

      {serverError && (
        <div
          role="alert"
          className="flex items-start gap-3 border border-heritage/30 bg-ivory px-4 py-3 text-sm leading-relaxed text-heritage"
        >
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <p>
            {serverError.message}{" "}
            {serverError.action && (
              <Link href={serverError.action.href} className="link-luxe text-heritage">
                {serverError.action.label}
              </Link>
            )}
          </p>
        </div>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary mt-1 w-full">
        {pending ? (
          <>
            <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
            {isSignUp ? "Creating account…" : "Signing in…"}
          </>
        ) : isSignUp ? (
          "Create account"
        ) : (
          "Sign in"
        )}
      </button>

      <p className="text-center text-xs leading-relaxed text-stone">
        Sessions stay active for 7 days on this device.
      </p>
    </form>
  );
}
