import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Mail, Eye, EyeOff } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: () => {
      toast.success("Login successful");
      window.location.href = "/";
    },
    onError: (error) => {
      toast.error(error.message || "Login failed");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ email, password });
  };

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches && videoRef.current) {
      videoRef.current.pause();
    }
  }, []);

  return (
    <div className="flex min-h-screen w-full overflow-hidden" style={{ background: "#33333d" }}>
      {/* Left — Video Hero (robot only) */}
      <div className="relative hidden lg:flex lg:w-[42%] xl:w-[45%] items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          poster="/login-hero-poster.png"
          onLoadedData={() => setVideoLoaded(true)}
          onError={() => setVideoError(true)}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${videoLoaded && !videoError ? "opacity-100" : "opacity-0"}`}
          style={{ objectPosition: "center center" }}
        >
          <source src="/login-hero.mp4" type="video/mp4" />
        </video>
        <img
          src="/login-hero-poster.png"
          alt="Tamiyouz TOS"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-1000 ${videoLoaded && !videoError ? "opacity-0" : "opacity-100"}`}
          style={{ objectPosition: "center center" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to right, transparent 60%, #33333d 100%)" }}
        />
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(to bottom, rgba(51,51,61,0.15) 0%, transparent 20%, transparent 80%, rgba(51,51,61,0.15) 100%)" }}
        />
      </div>

      {/* Right — Login Form */}
      <div className="flex w-full lg:w-[58%] xl:w-[55%] items-center justify-center p-6 sm:p-10 relative">
        <div className="w-full max-w-[460px] relative z-10">
          {/* Card container with subtle off-white / warm-white background */}
          <div
            className="rounded-[24px] px-10 py-11 sm:px-12 sm:py-12"
            style={{
              background: "linear-gradient(180deg, #fafafa 0%, #f5f4f0 100%)",
              boxShadow: "0 30px 80px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.06)",
            }}
          >
            {/* Logo area — slightly different (warmer/lighter) tint behind logo */}
            <div className="flex flex-col items-center mb-8">
              <div
                className="flex items-center justify-center rounded-2xl mb-5"
                style={{
                  width: 80,
                  height: 80,
                }}
              >
                <img
                  src="/tamiyouz-logo.png"
                  alt="Tamiyouz"
                  className="h-[72px] w-auto object-contain"
                />
              </div>
              <h1
                className="text-center leading-tight"
                style={{
                  fontSize: "1.65rem",
                  fontWeight: 700,
                  letterSpacing: "-0.01em",
                  color: "#1a1a1a",
                  fontStyle: "italic",
                }}
              >
                Tamiyouz Operating System
              </h1>
              <p
                className="mt-2 text-center"
                style={{
                  fontSize: "13.5px",
                  color: "#888888",
                  fontStyle: "italic",
                }}
              >
                Excellence is not a skill, but an attitude.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email */}
              <div className="space-y-2">
                <label
                  htmlFor="login-email"
                  className="block"
                  style={{ fontSize: "14px", fontWeight: 600, color: "#2d2d2d" }}
                >
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="login-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loginMutation.isPending}
                    className="w-full outline-none transition-all disabled:opacity-50"
                    style={{
                      height: 46,
                      paddingLeft: 16,
                      paddingRight: 48,
                      borderRadius: 10,
                      border: "1.5px solid #c9a227",
                      background: "transparent",
                      color: "#1a1a1a",
                      fontSize: "14.5px",
                    }}
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <Mail className="h-[18px] w-[18px]" style={{ color: "#c9a227" }} />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label
                  htmlFor="login-password"
                  className="block"
                  style={{ fontSize: "14px", fontWeight: 600, color: "#2d2d2d" }}
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loginMutation.isPending}
                    className="w-full outline-none transition-all disabled:opacity-50"
                    style={{
                      height: 46,
                      paddingLeft: 16,
                      paddingRight: 48,
                      borderRadius: 10,
                      border: "1.5px solid #c9a227",
                      background: "transparent",
                      color: "#1a1a1a",
                      fontSize: "14.5px",
                    }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center transition-colors"
                    style={{ color: "#c9a227" }}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-[18px] w-[18px]" />
                    ) : (
                      <Eye className="h-[18px] w-[18px]" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <div className="pt-1">
                <button
                  type="submit"
                  disabled={loginMutation.isPending}
                  className="w-full text-white disabled:opacity-60 transition-all duration-300"
                  style={{
                    height: 46,
                    fontSize: "15.5px",
                    fontWeight: 600,
                    borderRadius: 10,
                    background: "linear-gradient(to right, #d4af37 0%, #a07d1c 40%, #6b5310 70%, #3d2f08 100%)",
                    boxShadow: "0 4px 16px rgba(180,150,40,0.25)",
                  }}
                >
                  {loginMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Signing in...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </button>
              </div>
            </form>

            {/* Forgot password */}
            <div className="mt-5 text-center">
              <button
                type="button"
                className="transition-colors"
                style={{
                  fontSize: "13.5px",
                  color: "#5b9bd5",
                  fontWeight: 500,
                }}
                onClick={() =>
                  toast.info("Please contact your administrator to reset your password.")
                }
              >
                Forgot password?
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile fallback background */}
      <div className="fixed inset-0 lg:hidden -z-10">
        <img
          src="/login-hero-poster.png"
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0" style={{ background: "rgba(51,51,61,0.9)" }} />
      </div>
    </div>
  );
}
