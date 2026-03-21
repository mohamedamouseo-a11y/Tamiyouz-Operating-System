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
    <div className="flex min-h-screen w-full overflow-hidden bg-[#2a2a3a]">
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
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-[#2a2a3a] pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#2a2a3a]/20 via-transparent to-[#2a2a3a]/20 pointer-events-none" />
      </div>

      {/* Right — Login Form */}
      <div className="flex w-full lg:w-[58%] xl:w-[55%] items-center justify-center p-6 sm:p-10 relative">
        <div className="w-full max-w-[480px] relative z-10">
          {/* White card — logo, title, form all inside */}
          <div className="bg-white rounded-[28px] shadow-[0_25px_70px_rgba(0,0,0,0.25)] px-10 py-12 sm:px-14 sm:py-14">
            {/* Logo */}
            <div className="flex flex-col items-center mb-10">
              <img
                src="/tamiyouz-logo.png"
                alt="Tamiyouz"
                className="h-20 w-auto object-contain mb-5"
              />
              <h1 className="text-[1.75rem] font-bold tracking-tight text-gray-900 text-center leading-tight">
                Tamiyouz Operating System
              </h1>
              <p className="text-[14px] text-gray-500 mt-2">
                Excellence is not a skill, but an attitude.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="login-email" className="block text-[15px] font-semibold text-gray-800">
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
                    className="w-full h-[48px] pl-5 pr-14 rounded-xl border border-[#d4af37]/60 bg-white text-gray-900 text-[15px] outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/25 transition-all disabled:opacity-50"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-[#c9a227]" />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <label htmlFor="login-password" className="block text-[15px] font-semibold text-gray-800">
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
                    className="w-full h-[48px] pl-5 pr-14 rounded-xl border border-[#d4af37]/60 bg-white text-gray-900 text-[15px] outline-none focus:border-[#d4af37] focus:ring-2 focus:ring-[#d4af37]/25 transition-all disabled:opacity-50"
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#c9a227] hover:text-[#b8941f] transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loginMutation.isPending}
                className="w-full h-[48px] text-[16px] font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 text-white disabled:opacity-60"
                style={{
                  background: "linear-gradient(to right, #d4af37 0%, #8b6914 55%, #4a3a0a 100%)",
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
            </form>

            {/* Forgot password */}
            <div className="mt-6 text-center">
              <button
                type="button"
                className="text-[14px] text-[#c9a227] hover:text-[#b8941f] transition-colors font-medium"
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
        <div className="absolute inset-0 bg-[#2a2a3a]/90" />
      </div>
    </div>
  );
}
