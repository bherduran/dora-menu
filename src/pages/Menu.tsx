import { useState, useRef, useEffect } from "react";
import { supabase, type Category, type Product } from "../lib/supabase";

interface MenuCategory extends Category {
  products: Product[];
}

function Menu() {
  const [categories, setCategories] = useState<MenuCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<number | null>(null);
  const categoryRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const isScrolling = useRef(false);

  useEffect(() => {
    async function fetchMenu() {
      const [catRes, prodRes] = await Promise.all([
        supabase.from("categories").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("products").select("*").eq("is_active", true).order("sort_order"),
      ]);

      if (catRes.data && prodRes.data) {
        const menu: MenuCategory[] = catRes.data.map((cat) => ({
          ...cat,
          products: prodRes.data.filter((p) => p.category_id === cat.id),
        }));
        setCategories(menu);
        setActiveCategory(menu[0]?.id ?? null);
      }
      setLoading(false);
    }
    fetchMenu();
  }, []);

  useEffect(() => {
    if (categories.length === 0) return;
    const observers = categories.map((cat) => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && !isScrolling.current) {
            setActiveCategory(cat.id);
            scrollTabIntoView(cat.id);
          }
        },
        { rootMargin: "-30% 0px -60% 0px" }
      );
      const el = categoryRefs.current[cat.id];
      if (el) observer.observe(el);
      return observer;
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [categories]);

  function scrollTabIntoView(id: number) {
    const tab = document.getElementById(`tab-${id}`);
    tab?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
  }

  function handleTabClick(id: number) {
    setActiveCategory(id);
    isScrolling.current = true;
    categoryRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });
    scrollTabIntoView(id);
    setTimeout(() => { isScrolling.current = false; }, 800);
  }

  function getImageUrl(product: Product) {
    if (!product.image_url) return null;
    return supabase.storage.from("product-images").getPublicUrl(product.image_url).data.publicUrl;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-center">
          <img src="/logo.png" alt="Dora" className="w-20 h-20 mx-auto rounded-full animate-pulse" />
          <p className="text-zinc-500 mt-4 text-sm">Menü yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] max-w-lg mx-auto">
      {/* Header */}
      <header className="pt-8 pb-4 px-5 text-center">
        <img
          src="/logo.png"
          alt="Dora Lounge & Kahve Evi"
          className="w-28 h-28 mx-auto rounded-full object-cover shadow-lg shadow-copper/20"
        />
        <h1 className="text-2xl font-bold mt-4 tracking-tight">
          D<span className="text-copper">O</span>RA
        </h1>
        <p className="text-sm text-zinc-500 tracking-widest uppercase mt-1">
          Lounge & Kahve Evi
        </p>
        <div className="w-12 h-0.5 bg-copper/40 mx-auto mt-4 rounded-full" />
      </header>

      {/* Category Tabs — Sticky */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-md border-b border-white/5">
        <div className="flex gap-1 px-4 py-3 overflow-x-auto no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat.id}
              id={`tab-${cat.id}`}
              onClick={() => handleTabClick(cat.id)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                activeCategory === cat.id
                  ? "bg-copper text-white shadow-md shadow-copper/30"
                  : "bg-surface-light text-zinc-400 hover:text-zinc-200"
              }`}
            >
              <span className="mr-1.5">{cat.icon}</span>
              {cat.name}
            </button>
          ))}
        </div>
      </nav>

      {/* Menu Sections */}
      <main className="px-4 pb-20 pt-4">
        {categories.map((cat) => (
          <section
            key={cat.id}
            ref={(el) => { categoryRefs.current[cat.id] = el; }}
            className="mb-8 scroll-mt-20"
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="text-2xl">{cat.icon}</span>
              <h2 className="text-lg font-semibold text-white">{cat.name}</h2>
              <div className="flex-1 h-px bg-white/5" />
            </div>

            <div className="space-y-3">
              {cat.products.map((product) => {
                const imageUrl = getImageUrl(product);
                return (
                  <div
                    key={product.id}
                    className="group flex items-center gap-4 bg-surface rounded-2xl p-4 border border-white/[0.04] hover:border-copper/20 transition-all duration-300"
                  >
                    {/* Product Image */}
                    <div className="w-16 h-16 rounded-xl bg-surface-lighter flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform duration-300 overflow-hidden">
                      {imageUrl ? (
                        <img src={imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        cat.icon
                      )}
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-[15px] font-semibold text-white truncate">
                        {product.name}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                        {product.description}
                      </p>
                    </div>

                    {/* Price */}
                    <div className="flex-shrink-0">
                      <span className="text-copper font-bold text-[15px]">
                        ₺{product.price}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        ))}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 border-t border-white/5">
        <p className="text-xs text-zinc-600">Dora Lounge & Kahve Evi</p>
        <p className="text-[10px] text-zinc-700 mt-1">
          Fiyatlar güncel tarih itibarıyla geçerlidir
        </p>
      </footer>
    </div>
  );
}

export default Menu;
