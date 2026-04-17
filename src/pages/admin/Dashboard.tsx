import { useState, useEffect, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase, type Category, type Product } from "../../lib/supabase";
import toast from "react-hot-toast";

type Tab = "products" | "categories";

interface ProductForm {
  id?: number;
  category_id: number;
  name: string;
  description: string;
  price: string;
  sort_order: string;
  is_active: boolean;
}

interface CategoryForm {
  id?: number;
  name: string;
  icon: string;
  sort_order: string;
  is_active: boolean;
}

const emptyProduct: ProductForm = { category_id: 0, name: "", description: "", price: "", sort_order: "0", is_active: true };
const emptyCategory: CategoryForm = { name: "", icon: "☕", sort_order: "0", is_active: true };

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("products");
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);
  const [categoryForm, setCategoryForm] = useState<CategoryForm>(emptyCategory);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { fetchData(); }, []);

  async function fetchData() {
    const [catRes, prodRes] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("products").select("*").order("sort_order"),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (prodRes.data) setProducts(prodRes.data);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    navigate("/admin");
  }

  // --- Product CRUD ---
  async function saveProduct(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    let image_url = undefined;
    if (imageFile) {
      const ext = imageFile.name.split(".").pop();
      const path = `${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, imageFile);
      if (error) { toast.error("Fotoğraf yüklenemedi"); setSaving(false); return; }
      image_url = path;
    }

    const data = {
      category_id: productForm.category_id,
      name: productForm.name,
      description: productForm.description,
      price: parseFloat(productForm.price),
      sort_order: parseInt(productForm.sort_order),
      is_active: productForm.is_active,
      ...(image_url && { image_url }),
    };

    if (productForm.id) {
      const { error } = await supabase.from("products").update(data).eq("id", productForm.id);
      if (error) { toast.error("Güncellenemedi"); setSaving(false); return; }
      toast.success("Ürün güncellendi");
    } else {
      const { error } = await supabase.from("products").insert(data);
      if (error) { toast.error("Eklenemedi"); setSaving(false); return; }
      toast.success("Ürün eklendi");
    }

    setShowForm(false);
    setProductForm(emptyProduct);
    setImageFile(null);
    setSaving(false);
    fetchData();
  }

  function editProduct(p: Product) {
    setProductForm({
      id: p.id,
      category_id: p.category_id,
      name: p.name,
      description: p.description,
      price: String(p.price),
      sort_order: String(p.sort_order),
      is_active: p.is_active,
    });
    setTab("products");
    setShowForm(true);
  }

  async function deleteProduct(id: number) {
    if (!confirm("Bu ürünü silmek istediğinize emin misiniz?")) return;
    await supabase.from("products").delete().eq("id", id);
    toast.success("Ürün silindi");
    fetchData();
  }

  // --- Category CRUD ---
  async function saveCategory(e: FormEvent) {
    e.preventDefault();
    setSaving(true);

    const data = {
      name: categoryForm.name,
      icon: categoryForm.icon,
      sort_order: parseInt(categoryForm.sort_order),
      is_active: categoryForm.is_active,
    };

    if (categoryForm.id) {
      const { error } = await supabase.from("categories").update(data).eq("id", categoryForm.id);
      if (error) { toast.error("Güncellenemedi"); setSaving(false); return; }
      toast.success("Kategori güncellendi");
    } else {
      const { error } = await supabase.from("categories").insert(data);
      if (error) { toast.error("Eklenemedi"); setSaving(false); return; }
      toast.success("Kategori eklendi");
    }

    setShowForm(false);
    setCategoryForm(emptyCategory);
    setSaving(false);
    fetchData();
  }

  function editCategory(c: Category) {
    setCategoryForm({
      id: c.id,
      name: c.name,
      icon: c.icon,
      sort_order: String(c.sort_order),
      is_active: c.is_active,
    });
    setTab("categories");
    setShowForm(true);
  }

  async function deleteCategory(id: number) {
    if (!confirm("Bu kategori ve altındaki tüm ürünler silinecek. Emin misiniz?")) return;
    await supabase.from("categories").delete().eq("id", id);
    toast.success("Kategori silindi");
    fetchData();
  }

  function openNewForm() {
    if (tab === "products") {
      setProductForm({ ...emptyProduct, category_id: categories[0]?.id ?? 0 });
    } else {
      setCategoryForm(emptyCategory);
    }
    setShowForm(true);
  }

  function getCategoryName(id: number) {
    return categories.find((c) => c.id === id)?.name ?? "—";
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-50 bg-surface border-b border-white/5 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="Dora" className="w-8 h-8 rounded-full" />
          <span className="font-semibold text-sm">
            D<span className="text-copper">O</span>RA Admin
          </span>
        </div>
        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            className="text-xs text-zinc-500 hover:text-copper transition-colors"
          >
            Menüyü Gör ↗
          </a>
          <button
            onClick={handleLogout}
            className="text-xs text-zinc-500 hover:text-red-400 transition-colors"
          >
            Çıkış
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => { setTab("products"); setShowForm(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "products" ? "bg-copper text-white" : "bg-surface-light text-zinc-400"
            }`}
          >
            Ürünler ({products.length})
          </button>
          <button
            onClick={() => { setTab("categories"); setShowForm(false); }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === "categories" ? "bg-copper text-white" : "bg-surface-light text-zinc-400"
            }`}
          >
            Kategoriler ({categories.length})
          </button>
          <div className="flex-1" />
          <button
            onClick={openNewForm}
            className="px-4 py-2 bg-copper/20 text-copper rounded-lg text-sm font-medium hover:bg-copper/30 transition-colors"
          >
            + Yeni {tab === "products" ? "Ürün" : "Kategori"}
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="mb-6 bg-surface border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4">
              {tab === "products"
                ? productForm.id ? "Ürünü Düzenle" : "Yeni Ürün"
                : categoryForm.id ? "Kategoriyi Düzenle" : "Yeni Kategori"
              }
            </h3>

            {tab === "products" ? (
              <form onSubmit={saveProduct} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={productForm.name}
                      onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                      placeholder="Ürün adı"
                      required
                      className="w-full px-3 py-2.5 bg-surface-light border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-copper"
                    />
                  </div>
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={productForm.description}
                      onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                      placeholder="Açıklama"
                      className="w-full px-3 py-2.5 bg-surface-light border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-copper"
                    />
                  </div>
                  <select
                    value={productForm.category_id}
                    onChange={(e) => setProductForm({ ...productForm, category_id: Number(e.target.value) })}
                    className="px-3 py-2.5 bg-surface-light border border-white/10 rounded-xl text-sm text-white focus:outline-none focus:border-copper"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    placeholder="Fiyat (₺)"
                    required
                    step="0.01"
                    min="0"
                    className="px-3 py-2.5 bg-surface-light border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-copper"
                  />
                  <input
                    type="number"
                    value={productForm.sort_order}
                    onChange={(e) => setProductForm({ ...productForm, sort_order: e.target.value })}
                    placeholder="Sıra"
                    className="px-3 py-2.5 bg-surface-light border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-copper"
                  />
                  <label className="flex items-center gap-2 text-sm text-zinc-400">
                    <input
                      type="checkbox"
                      checked={productForm.is_active}
                      onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                      className="rounded accent-copper"
                    />
                    Aktif
                  </label>
                  <div className="col-span-2">
                    <label className="block text-xs text-zinc-500 mb-1">Ürün Fotoğrafı</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                      className="w-full text-sm text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-surface-lighter file:text-copper file:text-sm file:font-medium hover:file:bg-copper/20"
                    />
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={saving} className="px-4 py-2 bg-copper text-white rounded-xl text-sm font-medium disabled:opacity-50">
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setProductForm(emptyProduct); }} className="px-4 py-2 bg-surface-lighter text-zinc-400 rounded-xl text-sm">
                    İptal
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={saveCategory} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      placeholder="Kategori adı"
                      required
                      className="w-full px-3 py-2.5 bg-surface-light border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-copper"
                    />
                  </div>
                  <input
                    type="text"
                    value={categoryForm.icon}
                    onChange={(e) => setCategoryForm({ ...categoryForm, icon: e.target.value })}
                    placeholder="Emoji ikon"
                    className="px-3 py-2.5 bg-surface-light border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-copper"
                  />
                  <input
                    type="number"
                    value={categoryForm.sort_order}
                    onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: e.target.value })}
                    placeholder="Sıra"
                    className="px-3 py-2.5 bg-surface-light border border-white/10 rounded-xl text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-copper"
                  />
                  <label className="flex items-center gap-2 text-sm text-zinc-400">
                    <input
                      type="checkbox"
                      checked={categoryForm.is_active}
                      onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                      className="rounded accent-copper"
                    />
                    Aktif
                  </label>
                </div>
                <div className="flex gap-2 pt-2">
                  <button type="submit" disabled={saving} className="px-4 py-2 bg-copper text-white rounded-xl text-sm font-medium disabled:opacity-50">
                    {saving ? "Kaydediliyor..." : "Kaydet"}
                  </button>
                  <button type="button" onClick={() => { setShowForm(false); setCategoryForm(emptyCategory); }} className="px-4 py-2 bg-surface-lighter text-zinc-400 rounded-xl text-sm">
                    İptal
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        {/* Product List */}
        {tab === "products" && (
          <div className="space-y-2">
            {categories.map((cat) => {
              const catProducts = products.filter((p) => p.category_id === cat.id);
              if (catProducts.length === 0) return null;
              return (
                <div key={cat.id}>
                  <h4 className="text-xs text-zinc-500 uppercase tracking-wider mb-2 mt-4">
                    {cat.icon} {cat.name}
                  </h4>
                  {catProducts.map((p) => (
                    <div
                      key={p.id}
                      className="flex items-center gap-3 bg-surface rounded-xl p-3 mb-2 border border-white/[0.04]"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-medium ${p.is_active ? "text-white" : "text-zinc-600 line-through"}`}>
                            {p.name}
                          </span>
                          {!p.is_active && (
                            <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">
                              Pasif
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-600 truncate">{p.description}</p>
                      </div>
                      <span className="text-copper font-semibold text-sm">₺{p.price}</span>
                      <div className="flex gap-1">
                        <button onClick={() => editProduct(p)} className="p-1.5 rounded-lg hover:bg-surface-lighter text-zinc-500 hover:text-copper transition-colors text-xs">
                          ✏️
                        </button>
                        <button onClick={() => deleteProduct(p.id)} className="p-1.5 rounded-lg hover:bg-surface-lighter text-zinc-500 hover:text-red-400 transition-colors text-xs">
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        )}

        {/* Category List */}
        {tab === "categories" && (
          <div className="space-y-2">
            {categories.map((c) => (
              <div
                key={c.id}
                className="flex items-center gap-3 bg-surface rounded-xl p-3 border border-white/[0.04]"
              >
                <span className="text-2xl">{c.icon}</span>
                <div className="flex-1">
                  <span className={`text-sm font-medium ${c.is_active ? "text-white" : "text-zinc-600 line-through"}`}>
                    {c.name}
                  </span>
                  <span className="text-xs text-zinc-600 ml-2">
                    ({products.filter((p) => p.category_id === c.id).length} ürün)
                  </span>
                </div>
                <span className="text-xs text-zinc-600">Sıra: {c.sort_order}</span>
                <div className="flex gap-1">
                  <button onClick={() => editCategory(c)} className="p-1.5 rounded-lg hover:bg-surface-lighter text-zinc-500 hover:text-copper transition-colors text-xs">
                    ✏️
                  </button>
                  <button onClick={() => deleteCategory(c.id)} className="p-1.5 rounded-lg hover:bg-surface-lighter text-zinc-500 hover:text-red-400 transition-colors text-xs">
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
