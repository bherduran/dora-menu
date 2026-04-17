import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import toast from "react-hot-toast";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error("Giriş başarısız. E-posta veya şifre hatalı.");
      setLoading(false);
      return;
    }

    toast.success("Giriş başarılı!");
    navigate("/admin/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Dora" className="w-20 h-20 mx-auto rounded-full" />
          <h1 className="text-xl font-bold mt-4 text-white">
            D<span className="text-copper">O</span>RA Admin
          </h1>
          <p className="text-zinc-500 text-sm mt-1">Menü yönetim paneli</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">E-posta</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 bg-surface border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-copper transition-colors"
              placeholder="admin@dora.com"
            />
          </div>

          <div>
            <label className="block text-sm text-zinc-400 mb-1.5">Şifre</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 bg-surface border border-white/10 rounded-xl text-white placeholder-zinc-600 focus:outline-none focus:border-copper transition-colors"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-copper hover:bg-copper-light text-white font-medium rounded-xl transition-colors disabled:opacity-50"
          >
            {loading ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
