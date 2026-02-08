"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
  ReactNode,
  FormEvent,
} from "react";
import { Target, Lock, Loader2 } from "lucide-react";

const DEMO_PASSWORD = "Endurance";
const AUTH_KEY = "deal_cmd_auth";

interface AuthContextValue {
  isAuthenticated: boolean;
  login: (password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  isAuthenticated: false,
  login: () => false,
  logout: () => {},
});

// --- Hyperspace Canvas Component ---
function HyperspaceAnimation({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const cx = canvas.width / 2;
    const cy = canvas.height / 2;
    const STAR_COUNT = 600;
    const DURATION = 2200; // ms
    const start = performance.now();

    // Initialize stars with random 3D positions
    const stars = Array.from({ length: STAR_COUNT }, () => ({
      x: (Math.random() - 0.5) * canvas.width * 3,
      y: (Math.random() - 0.5) * canvas.height * 3,
      z: Math.random() * 2000,
      prevX: 0,
      prevY: 0,
    }));

    let raf: number;

    const draw = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / DURATION, 1);

      // Eased speed: starts slow, ramps up exponentially
      const speed = 2 + Math.pow(progress, 2) * 120;
      // Trail length grows with speed
      const trailFactor = Math.min(1, progress * 2.5);
      // White flash at the end
      const flashAlpha = progress > 0.85 ? (progress - 0.85) / 0.15 : 0;

      // Fade-in dark background
      ctx.fillStyle = `rgba(15, 23, 42, ${0.3 + (1 - trailFactor) * 0.7})`;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      for (const star of stars) {
        // Store previous projected position for trails
        const prevZ = star.z + speed;
        star.prevX = (star.x / prevZ) * 500 + cx;
        star.prevY = (star.y / prevZ) * 500 + cy;

        // Move star toward camera
        star.z -= speed;

        // Reset star if it passes the camera
        if (star.z <= 0) {
          star.z = 2000;
          star.x = (Math.random() - 0.5) * canvas.width * 3;
          star.y = (Math.random() - 0.5) * canvas.height * 3;
          star.prevX = (star.x / star.z) * 500 + cx;
          star.prevY = (star.y / star.z) * 500 + cy;
        }

        // Project 3D to 2D
        const sx = (star.x / star.z) * 500 + cx;
        const sy = (star.y / star.z) * 500 + cy;

        // Star brightness based on proximity
        const brightness = Math.min(1, (2000 - star.z) / 1500);
        const size = Math.max(0.5, (1 - star.z / 2000) * 3);

        // Color: white core with slight blue/indigo tint on streaks
        const blue = Math.round(180 + brightness * 75);
        const green = Math.round(180 + brightness * 75);

        if (trailFactor > 0.1) {
          // Draw streak line
          ctx.beginPath();
          ctx.moveTo(star.prevX, star.prevY);
          ctx.lineTo(sx, sy);
          ctx.strokeStyle = `rgba(${Math.round(200 + brightness * 55)}, ${green}, ${blue}, ${brightness * trailFactor * 0.9})`;
          ctx.lineWidth = size * trailFactor;
          ctx.stroke();
        }

        // Draw star point
        ctx.beginPath();
        ctx.arc(sx, sy, size * 0.6, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
        ctx.fill();
      }

      // Central glow as speed increases
      if (progress > 0.3) {
        const glowAlpha = (progress - 0.3) * 0.3;
        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, canvas.width * 0.5);
        grad.addColorStop(0, `rgba(99, 102, 241, ${glowAlpha * 0.4})`);
        grad.addColorStop(0.5, `rgba(99, 102, 241, ${glowAlpha * 0.1})`);
        grad.addColorStop(1, "transparent");
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      // White flash at the end
      if (flashAlpha > 0) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.pow(flashAlpha, 0.5)})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      if (progress < 1) {
        raf = requestAnimationFrame(draw);
      } else {
        onComplete();
      }
    };

    raf = requestAnimationFrame(draw);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", handleResize);
    };
  }, [onComplete]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 z-[100]"
      style={{ background: "#0f172a" }}
    />
  );
}

// --- Main Auth Provider ---
export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isJumping, setIsJumping] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [shaking, setShaking] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(AUTH_KEY);
      if (stored === "authenticated") {
        setIsAuthenticated(true);
      }
    }
    setIsLoading(false);
  }, []);

  const login = (pw: string): boolean => {
    if (pw === DEMO_PASSWORD) {
      if (typeof window !== "undefined") {
        localStorage.setItem(AUTH_KEY, "authenticated");
      }
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setIsJumping(false);
    setPassword("");
    setError("");
    if (typeof window !== "undefined") {
      localStorage.removeItem(AUTH_KEY);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      setError("");
      setIsJumping(true);
    } else {
      setError("Incorrect password");
      setShaking(true);
      setTimeout(() => setShaking(false), 500);
    }
  };

  const handleHyperspaceComplete = useCallback(() => {
    setIsJumping(false);
    setIsAuthenticated(true);
  }, []);

  // Loading state — prevent flash
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
      </div>
    );
  }

  // Hyperspace jump animation
  if (isJumping) {
    return <HyperspaceAnimation onComplete={handleHyperspaceComplete} />;
  }

  // Login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-slate-800 border border-slate-700 mb-4">
              <Target className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Deal Command Center</h1>
            <p className="text-sm text-slate-400 mt-1">
              Enterprise Multi-Threading
            </p>
          </div>

          {/* Login Card */}
          <form onSubmit={handleSubmit}>
            <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 space-y-4 shadow-2xl">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError("");
                    }}
                    placeholder="Enter password"
                    autoFocus
                    className={`w-full bg-slate-700 border rounded-lg pl-10 pr-4 py-2.5 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all ${
                      error
                        ? "border-red-500"
                        : "border-slate-600"
                    } ${shaking ? "animate-[shake_0.5s_ease-in-out]" : ""}`}
                  />
                </div>
                {error && (
                  <p className="text-xs text-red-400 mt-1.5">{error}</p>
                )}
              </div>

              <button
                type="submit"
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800"
              >
                Sign In
              </button>
            </div>
          </form>

          <p className="text-center text-[11px] text-slate-600 mt-6">
            Protected workspace access
          </p>
        </div>

        {/* Shake animation */}
        <style jsx global>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
          }
        `}</style>
      </div>
    );
  }

  // Authenticated — render app
  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
