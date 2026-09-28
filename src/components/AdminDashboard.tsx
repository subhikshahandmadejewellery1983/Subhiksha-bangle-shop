import React, { useState, useMemo, useRef } from 'react';
import {
  Boxes,
  PackagePlus,
  Edit3,
  Trash2,
  Plus,
  Minus,
  Search,
  RotateCcw,
  Download,
  Upload,
  AlertTriangle,
  CheckCircle2,
  X,
  Sparkles,
  ArrowUpDown,
  Camera,
  ExternalLink,
  Copy,
  Tag,
  Eye,
  Check,
  Percent,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';

export interface Product {
  id: string;
  slug: string;
  name: string;
  subtitle: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  category: 'Thread Bangles' | 'Earring Studs' | 'Jhumkas' | string;
  occasion: string;
  primaryColor: string;
  colorHex: string;
  sizes: string[];
  pieces: string;
  stock: number;
  isBestSeller?: boolean;
  isNew?: boolean;
  featured?: boolean;
  image: string;
  images: string[];
  description: string;
  materials: string;
  care: string;
}

interface AdminDashboardProps {
  products: Product[];
  onUpdateProduct: (updated: Product) => void;
  onAddProduct: (newProduct: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onUpdateStock: (productId: string, newStock: number) => void;
  onBatchUpdateStock: (productIds: string[], delta: number) => void;
  onResetToDefaults: () => void;
  onClose?: () => void;
  customUploadedImages?: Record<string, string>;
  onSingleUpload?: (productId: string, file: File) => void;
}

// Preset luxury silk colors for bangle sets
const PRESET_SILK_COLORS = [
  { name: 'Crimson Red', hex: '#8B1824' },
  { name: 'Rani Pink', hex: '#C2185B' },
  { name: 'Royal Emerald', hex: '#114B3E' },
  { name: 'Peacock Blue', hex: '#10375C' },
  { name: 'Mustard Gold', hex: '#D4A017' },
  { name: 'Shahi Plum', hex: '#4A154B' },
  { name: 'Antique Ivory', hex: '#EBE2D0' },
  { name: 'Mint Sage', hex: '#7A9A8B' },
  { name: 'Sunset Tangerine', hex: '#D95C24' },
  { name: 'Midnight Black', hex: '#1E1B18' }
];

// Preset curated handmade bangle SVG visuals
const PRESET_BANGLES_IMAGES = [
  { label: 'Maharani Crimson Kundan', path: '/images/bangles/maharani-crimson-kundan.svg' },
  { label: 'Mayura Emerald Royale', path: '/images/bangles/mayura-emerald-royale.svg' },
  { label: 'Subhiksha Turquoise & Pink', path: '/images/bangles/subhiksha-turquoise-pink-kasu.svg' },
  { label: 'Shahi Plum Royal Violet', path: '/images/bangles/shahi-plum-royal-violet.svg' },
  { label: 'Gulabi Rani Pink', path: '/images/bangles/gulabi-rani-pink.svg' },
  { label: 'Basanti Haldi Mustard', path: '/images/bangles/basanti-haldi-mustard.svg' },
  { label: 'Chandrakala Mint Mirror', path: '/images/bangles/chandrakala-mint-mirror.svg' },
  { label: 'Padmavati Antique Ivory', path: '/images/bangles/padmavati-antique-ivory.svg' },
  { label: 'Neelam Peacock Blue', path: '/images/bangles/neelam-peacock-blue.svg' },
  { label: 'Surya Amber Kundan', path: '/images/bangles/surya-amber-kundan.svg' },
  { label: 'Navratna Rainbow Silk', path: '/images/bangles/navratna-rainbow-silk.svg' }
];

const STANDARD_SIZES = ['2.2', '2.4', '2.6', '2.8', '2.10'];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  products,
  onUpdateProduct,
  onAddProduct,
  onDeleteProduct,
  onUpdateStock,
  onBatchUpdateStock,
  onResetToDefaults,
  onClose,
  customUploadedImages = {},
  onSingleUpload
}) => {
  // Filtering & Sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [stockStatusFilter, setStockStatusFilter] = useState<'All' | 'in_stock' | 'low_stock' | 'out_of_stock'>('All');
  const [sortBy, setSortBy] = useState<'stock-asc' | 'stock-desc' | 'price-desc' | 'price-asc' | 'name'>('stock-asc');

  // Modals & Panels
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isBatchRestockOpen, setIsBatchRestockOpen] = useState(false);
  const [batchDelta, setBatchDelta] = useState<number>(10);
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>([]);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const importJsonInputRef = useRef<HTMLInputElement>(null);
  const [uploadTargetId, setUploadTargetId] = useState<string | null>(null);

  // New Product Draft State
  const initialNewProduct: Product = {
    id: `prod-${Date.now()}`,
    slug: 'custom-handmade-silk-bangle',
    name: 'Artisan Handcrafted Silk Thread Bangles',
    subtitle: 'Pure Mulberry Silk Thread Wrapped Bangles with Gold Embellishments',
    price: 1899,
    originalPrice: 2499,
    rating: 4.9,
    reviewCount: 1,
    category: 'Thread Bangles',
    occasion: 'Festive & Celebration',
    primaryColor: 'Crimson Red',
    colorHex: '#8B1824',
    sizes: ['2.4', '2.6', '2.8'],
    pieces: 'Set of 12 Handmade Bangles',
    stock: 20,
    isBestSeller: false,
    isNew: true,
    featured: false,
    image: '/images/bangles/maharani-crimson-kundan.svg',
    images: ['/images/bangles/maharani-crimson-kundan.svg'],
    description: 'Exquisitely handcrafted by Subhiksha artisans using 100% fine mulberry silk threads wrapped firmly around solid metal cores, finished with sparkling gold zari borders.',
    materials: 'Pure Silk Thread, High-density Metal Core, Gold Zari Wire',
    care: 'Store in dry moisture-free silk pouches. Avoid water and perfumes.'
  };

  const [newProductDraft, setNewProductDraft] = useState<Product>(initialNewProduct);

  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => {
      setNotification((curr) => (curr === msg ? null : curr));
    }, 4000);
  };

  // Metrics Calculations
  const metrics = useMemo(() => {
    const totalProducts = products.length;
    const totalInventoryUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);
    const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= 10).length;
    const outOfStockCount = products.filter((p) => p.stock <= 0).length;
    const totalValuation = products.reduce((acc, p) => acc + (p.stock || 0) * p.price, 0);

    return {
      totalProducts,
      totalInventoryUnits,
      lowStockCount,
      outOfStockCount,
      totalValuation
    };
  }, [products]);

  // Filtered & Sorted Products
  const displayedProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Search
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          !searchTerm ||
          p.name.toLowerCase().includes(searchLower) ||
          p.subtitle.toLowerCase().includes(searchLower) ||
          p.id.toLowerCase().includes(searchLower) ||
          p.primaryColor.toLowerCase().includes(searchLower);

        // Category
        const matchesCategory = categoryFilter === 'All' || p.category === categoryFilter;

        // Stock Status
        let matchesStock = true;
        if (stockStatusFilter === 'in_stock') matchesStock = p.stock > 10;
        else if (stockStatusFilter === 'low_stock') matchesStock = p.stock > 0 && p.stock <= 10;
        else if (stockStatusFilter === 'out_of_stock') matchesStock = p.stock <= 0;

        return matchesSearch && matchesCategory && matchesStock;
      })
      .sort((a, b) => {
        if (sortBy === 'stock-asc') return a.stock - b.stock;
        if (sortBy === 'stock-desc') return b.stock - a.stock;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return 0;
      });
  }, [products, searchTerm, categoryFilter, stockStatusFilter, sortBy]);

  // Export Catalog
  const handleExportCatalog = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(products, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `subhiksha-inventory-catalog-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Catalog exported successfully as JSON.');
  };

  // Import Catalog
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id && parsed[0].name) {
          // Replace or merge
          parsed.forEach((p) => {
            const exists = products.find((x) => x.id === p.id);
            if (exists) onUpdateProduct(p);
            else onAddProduct(p);
          });
          showToast(`Imported ${parsed.length} products into inventory!`);
        } else {
          showToast('Invalid catalog JSON format.');
        }
      } catch (err) {
        showToast('Error reading catalog file.');
      }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  // Quick Photo Upload Handler
  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && uploadTargetId && onSingleUpload) {
      onSingleUpload(uploadTargetId, file);
      showToast(`Workshop photo uploaded for ${uploadTargetId}`);
    }
    setUploadTargetId(null);
    if (e.target) e.target.value = '';
  };

  // Execute Batch Restock
  const handleApplyBatchRestock = () => {
    const targets = selectedProductIds.length > 0 ? selectedProductIds : displayedProducts.map((p) => p.id);
    if (targets.length === 0) {
      showToast('No products selected for restock.');
      return;
    }
    onBatchUpdateStock(targets, batchDelta);
    showToast(`Added +${batchDelta} inventory units to ${targets.length} product(s)!`);
    setIsBatchRestockOpen(false);
    setSelectedProductIds([]);
  };

  // Restock All Low Stock Items by +10
  const handleRestockAllLow = () => {
    const lowIds = products.filter((p) => p.stock <= 10).map((p) => p.id);
    if (lowIds.length === 0) {
      showToast('No items currently at low stock level (<=10).');
      return;
    }
    onBatchUpdateStock(lowIds, 10);
    showToast(`Restocked ${lowIds.length} low-stock products by +10 units!`);
  };

  // Save Edited Product
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    onUpdateProduct(editingProduct);
    showToast(`Updated "${editingProduct.name}" and inventory.`);
    setEditingProduct(null);
  };

  // Add New Product
  const handleSaveNew = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductDraft.name.trim() || newProductDraft.price <= 0) {
      showToast('Please provide a valid product name and price.');
      return;
    }

    const slug = newProductDraft.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    const finalProduct: Product = {
      ...newProductDraft,
      id: `prod-${Date.now()}`,
      slug: slug || `bangle-${Date.now()}`,
      images: [newProductDraft.image]
    };

    onAddProduct(finalProduct);
    showToast(`Created new product "${finalProduct.name}" with ${finalProduct.stock} inventory units!`);
    setIsAddModalOpen(false);
    // Reset draft
    setNewProductDraft({
      ...initialNewProduct,
      id: `prod-${Date.now()}`
    });
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#1A1816] pb-24">
      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageFileChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={importJsonInputRef}
        onChange={handleImportJson}
        accept=".json"
        className="hidden"
      />

      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#114B3E] text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-[#E8D38B]/40 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-[#E8D38B] shrink-0" />
          <span className="text-xs sm:text-sm font-medium">{notification}</span>
          <button
            onClick={() => setNotification(null)}
            className="text-white/60 hover:text-white ml-2 p-1"
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner / Breadcrumb */}
      <div className="bg-[#114B3E] text-[#F4EFE6] border-b border-[#0D382E]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] uppercase tracking-widest text-[#E8D38B] font-semibold">
                Subhiksha Artisan Administration
              </span>
              <span className="text-emerald-400">·</span>
              <span className="text-xs text-white/80">Inventory &amp; Product Management</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif-luxury font-bold tracking-tight text-white flex items-center gap-2.5">
              <Boxes className="w-7 h-7 text-[#E8D38B]" />
              <span>Product &amp; Inventory Dashboard</span>
            </h1>
          </div>

          <div className="flex items-center flex-wrap gap-2.5">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-[#C59B27] hover:bg-[#A88118] text-[#1A1816] font-semibold text-xs tracking-wider uppercase transition shadow-md cursor-pointer"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Add New Bangle</span>
            </button>

            <button
              onClick={handleRestockAllLow}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#F4EFE6] font-medium text-xs transition border border-white/20 cursor-pointer"
              title="Add 10 units to all products with <= 10 units"
            >
              <Plus className="w-3.5 h-3.5 text-[#E8D38B]" />
              <span>Restock Low (+10)</span>
            </button>

            <button
              onClick={() => setIsBatchRestockOpen(true)}
              className="flex items-center gap-2 px-3.5 py-2.5 rounded-lg bg-white/10 hover:bg-white/20 text-[#F4EFE6] font-medium text-xs transition border border-white/20 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#E8D38B]" />
              <span>Batch Restock</span>
            </button>

            {onClose && (
              <button
                onClick={onClose}
                className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-950 text-[#F4EFE6] text-xs font-medium transition border border-emerald-800"
              >
                <span>Return to Shop</span>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-6">
        {/* Metric Cards (Zero-pill, high typographic clarity) */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-[#E8D8C8] shadow-sm">
            <span className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider block mb-1">
              Total Catalog
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#1A1816]">
                {metrics.totalProducts}
              </span>
              <span className="text-xs text-[#8C7A6B]">Designs</span>
            </div>
            <span className="text-[11px] text-[#8C7A6B] mt-1 block">Handcrafted sets</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E8D8C8] shadow-sm">
            <span className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider block mb-1">
              Total Stock Units
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#114B3E]">
                {metrics.totalInventoryUnits}
              </span>
              <span className="text-xs text-[#8C7A6B]">Units</span>
            </div>
            <span className="text-[11px] text-[#114B3E] font-medium mt-1 block">Live inventory</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-[#E8D8C8] shadow-sm">
            <span className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider block mb-1">
              Catalog Valuation
            </span>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-bold font-serif-luxury text-[#9A7416]">
                ₹{metrics.totalValuation.toLocaleString()}
              </span>
            </div>
            <span className="text-[11px] text-[#8C7A6B] mt-1 block">Retail inventory sum</span>
          </div>

          <div className={`p-4 rounded-xl border shadow-sm transition ${metrics.lowStockCount > 0 ? 'bg-amber-50/60 border-amber-200' : 'bg-white border-[#E8D8C8]'}`}>
            <span className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider block mb-1">
              Low Stock Alert
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-bold font-serif-luxury ${metrics.lowStockCount > 0 ? 'text-amber-800' : 'text-[#1A1816]'}`}>
                {metrics.lowStockCount}
              </span>
              <span className="text-xs text-[#8C7A6B]">Items</span>
            </div>
            <span className="text-[11px] text-amber-700 font-medium mt-1 block">&le; 10 units remaining</span>
          </div>

          <div className={`p-4 rounded-xl border shadow-sm col-span-2 lg:col-span-1 transition ${metrics.outOfStockCount > 0 ? 'bg-red-50/60 border-red-200' : 'bg-white border-[#E8D8C8]'}`}>
            <span className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider block mb-1">
              Out of Stock
            </span>
            <div className="flex items-baseline gap-2">
              <span className={`text-2xl sm:text-3xl font-bold font-serif-luxury ${metrics.outOfStockCount > 0 ? 'text-red-700' : 'text-[#1A1816]'}`}>
                {metrics.outOfStockCount}
              </span>
              <span className="text-xs text-[#8C7A6B]">Sold out</span>
            </div>
            <span className="text-[11px] text-red-600 font-medium mt-1 block">Needs restocking</span>
          </div>
        </div>

        {/* Toolbar: Search, Filters, Bulk Selection & Catalog Utilities */}
        <div className="bg-white p-4 rounded-xl border border-[#E8D8C8] shadow-sm space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8C7A6B]" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by product name, color, material, or ID..."
                className="w-full pl-10 pr-4 py-2 bg-[#FAF7F2] border border-[#E8D8C8] rounded-lg text-sm text-[#1A1816] placeholder-[#8C7A6B] focus:outline-none focus:border-[#9A7416]"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7A6B] hover:text-[#1A1816]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Sort & Quick Utility Controls */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-xs text-[#8C7A6B] bg-[#FAF7F2] border border-[#E8D8C8] rounded-lg px-2.5 py-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-[#9A7416]" />
                <span className="hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold text-[#1A1816] focus:outline-none cursor-pointer"
                >
                  <option value="stock-asc">Stock: Low &rarr; High (Urgent)</option>
                  <option value="stock-desc">Stock: High &rarr; Low</option>
                  <option value="price-desc">Price: High &rarr; Low</option>
                  <option value="price-asc">Price: Low &rarr; High</option>
                  <option value="name">Product Name (A-Z)</option>
                </select>
              </div>

              <button
                onClick={handleExportCatalog}
                className="flex items-center gap-1 text-xs px-2.5 py-2 rounded-lg border border-[#E8D8C8] hover:bg-[#FAF7F2] text-[#443E38] font-medium transition cursor-pointer"
                title="Download entire catalog JSON"
              >
                <Download className="w-3.5 h-3.5 text-[#114B3E]" />
                <span className="hidden sm:inline">Export JSON</span>
              </button>

              <button
                onClick={() => importJsonInputRef.current?.click()}
                className="flex items-center gap-1 text-xs px-2.5 py-2 rounded-lg border border-[#E8D8C8] hover:bg-[#FAF7F2] text-[#443E38] font-medium transition cursor-pointer"
                title="Import/restore catalog from JSON file"
              >
                <Upload className="w-3.5 h-3.5 text-[#114B3E]" />
                <span className="hidden sm:inline">Import JSON</span>
              </button>

              <button
                onClick={() => setConfirmResetOpen(true)}
                className="flex items-center gap-1 text-xs px-2.5 py-2 rounded-lg border border-red-200 hover:bg-red-50 text-red-700 font-medium transition cursor-pointer"
                title="Reset all products and stock to factory defaults"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Reset Defaults</span>
              </button>
            </div>
          </div>

          {/* Interactive Filter Buttons (Segmented Controls) */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-[#F0E6D8]">
            {/* Category Segmented Control */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
              <span className="text-xs text-[#8C7A6B] mr-1 hidden sm:inline">Category:</span>
              {(['All', 'Thread Bangles', 'Earring Studs', 'Jhumkas'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    categoryFilter === cat
                      ? 'bg-[#114B3E] text-white'
                      : 'bg-[#FAF7F2] text-[#68625B] hover:text-[#1A1816]'
                  }`}
                >
                  {cat === 'All' ? 'All Categories' : cat}
                </button>
              ))}
            </div>

            {/* Stock Level Segmented Control */}
            <div className="flex items-center gap-1 overflow-x-auto">
              <span className="text-xs text-[#8C7A6B] mr-1 hidden sm:inline">Stock Level:</span>
              <button
                onClick={() => setStockStatusFilter('All')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  stockStatusFilter === 'All'
                    ? 'bg-[#9A7416] text-white'
                    : 'bg-[#FAF7F2] text-[#68625B] hover:text-[#1A1816]'
                }`}
              >
                All Levels ({products.length})
              </button>
              <button
                onClick={() => setStockStatusFilter('low_stock')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  stockStatusFilter === 'low_stock'
                    ? 'bg-amber-700 text-white'
                    : 'bg-[#FAF7F2] text-amber-800 hover:bg-amber-50'
                }`}
              >
                Low (&le;10) ({metrics.lowStockCount})
              </button>
              <button
                onClick={() => setStockStatusFilter('out_of_stock')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  stockStatusFilter === 'out_of_stock'
                    ? 'bg-red-700 text-white'
                    : 'bg-[#FAF7F2] text-red-800 hover:bg-red-50'
                }`}
              >
                Sold Out ({metrics.outOfStockCount})
              </button>
              <button
                onClick={() => setStockStatusFilter('in_stock')}
                className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                  stockStatusFilter === 'in_stock'
                    ? 'bg-emerald-800 text-white'
                    : 'bg-[#FAF7F2] text-emerald-800 hover:bg-emerald-50'
                }`}
              >
                In Stock (&gt;10)
              </button>
            </div>
          </div>
        </div>

        {/* Selected Items Batch Restock Action Strip */}
        {selectedProductIds.length > 0 && (
          <div className="bg-[#114B3E] text-white p-3 rounded-xl flex items-center justify-between flex-wrap gap-2 shadow-md animate-fadeIn">
            <div className="flex items-center gap-2 text-xs font-medium">
              <Check className="w-4 h-4 text-[#E8D38B]" />
              <span>{selectedProductIds.length} product(s) selected</span>
              <button
                onClick={() => setSelectedProductIds([])}
                className="underline text-white/70 hover:text-white ml-2"
              >
                Clear selection
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onBatchUpdateStock(selectedProductIds, 5);
                  showToast(`Added +5 stock to ${selectedProductIds.length} items`);
                }}
                className="px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 text-xs font-semibold cursor-pointer"
              >
                +5 Units
              </button>
              <button
                onClick={() => {
                  onBatchUpdateStock(selectedProductIds, 10);
                  showToast(`Added +10 stock to ${selectedProductIds.length} items`);
                }}
                className="px-2.5 py-1 rounded bg-[#C59B27] hover:bg-[#A88118] text-[#1A1816] text-xs font-bold cursor-pointer"
              >
                +10 Units
              </button>
              <button
                onClick={() => {
                  onBatchUpdateStock(selectedProductIds, 25);
                  showToast(`Added +25 stock to ${selectedProductIds.length} items`);
                }}
                className="px-2.5 py-1 rounded bg-white/20 hover:bg-white/30 text-xs font-semibold cursor-pointer"
              >
                +25 Units
              </button>
            </div>
          </div>
        )}

        {/* Main Product Table & Inventory Editor */}
        <div className="bg-white rounded-xl border border-[#E8D8C8] shadow-sm overflow-hidden">
          <div className="p-4 border-b border-[#F0E6D8] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-serif-luxury font-bold text-base text-[#1A1816]">
                Catalog Items &amp; Stock Levels
              </span>
              <span className="text-xs text-[#8C7A6B]">
                ({displayedProducts.length} {displayedProducts.length === 1 ? 'item' : 'items'} found)
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                onClick={() => {
                  if (selectedProductIds.length === displayedProducts.length) {
                    setSelectedProductIds([]);
                  } else {
                    setSelectedProductIds(displayedProducts.map((p) => p.id));
                  }
                }}
                className="text-[#9A7416] hover:underline font-semibold cursor-pointer"
              >
                {selectedProductIds.length === displayedProducts.length ? 'Deselect All' : 'Select All Filtered'}
              </button>
            </div>
          </div>

          {displayedProducts.length === 0 ? (
            <div className="p-12 text-center text-[#8C7A6B] space-y-3">
              <Boxes className="w-12 h-12 mx-auto text-[#E8D8C8] stroke-1" />
              <p className="font-semibold text-sm text-[#1A1816]">No products matched your search or filter.</p>
              <p className="text-xs max-w-sm mx-auto">
                Try resetting your search query or switching to another category.
              </p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setCategoryFilter('All');
                  setStockStatusFilter('All');
                }}
                className="px-4 py-2 rounded-lg bg-[#114B3E] text-white text-xs font-medium hover:bg-[#0D382E]"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#FAF7F2] text-[#68625B] font-semibold border-b border-[#E8D8C8]">
                    <th className="py-3 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={
                          displayedProducts.length > 0 &&
                          selectedProductIds.length === displayedProducts.length
                        }
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedProductIds(displayedProducts.map((p) => p.id));
                          } else {
                            setSelectedProductIds([]);
                          }
                        }}
                        className="rounded border-[#C59B27] text-[#114B3E] focus:ring-[#114B3E]"
                      />
                    </th>
                    <th className="py-3 px-3">Product / Bangles Set</th>
                    <th className="py-3 px-3">Category &amp; Color</th>
                    <th className="py-3 px-3">Pricing (₹)</th>
                    <th className="py-3 px-3">Inventory Stock Level</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E6D8]">
                  {displayedProducts.map((product) => {
                    const isSelected = selectedProductIds.includes(product.id);
                    const isLowStock = product.stock > 0 && product.stock <= 10;
                    const isOutOfStock = product.stock <= 0;
                    const displayImage = customUploadedImages[product.id] || product.image;

                    return (
                      <tr
                        key={product.id}
                        className={`hover:bg-[#FAF7F2]/60 transition ${
                          isSelected ? 'bg-amber-50/40' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-3 px-3 align-middle">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedProductIds((prev) => [...prev, product.id]);
                              } else {
                                setSelectedProductIds((prev) => prev.filter((id) => id !== product.id));
                              }
                            }}
                            className="rounded border-[#C59B27] text-[#114B3E] focus:ring-[#114B3E]"
                          />
                        </td>

                        {/* Product Title & Thumbnail */}
                        <td className="py-3 px-3 align-middle">
                          <div className="flex items-center gap-3">
                            <div className="relative group shrink-0">
                              <img
                                src={displayImage}
                                alt={product.name}
                                className="w-14 h-14 rounded-lg object-cover bg-[#F4EFE6] border border-[#E8D8C8]"
                              />
                              <button
                                onClick={() => {
                                  setUploadTargetId(product.id);
                                  fileInputRef.current?.click();
                                }}
                                className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition"
                                title="Upload real workshop photo"
                              >
                                <Camera className="w-4 h-4 text-[#E8D38B]" />
                              </button>
                            </div>
                            <div className="space-y-0.5 max-w-xs">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-[#1A1816] hover:text-[#9A7416] transition">
                                  {product.name}
                                </span>
                                {product.isBestSeller && (
                                  <span className="text-[10px] text-[#9A7416] font-semibold">
                                    ★ Best Seller
                                  </span>
                                )}
                                {product.isNew && (
                                  <span className="text-[10px] text-emerald-700 font-semibold">
                                    New
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-[#68625B] line-clamp-1">
                                {product.subtitle}
                              </p>
                              <div className="flex items-center gap-2 text-[10px] text-[#8C7A6B]">
                                <span>ID: {product.id}</span>
                                <span aria-hidden="true">·</span>
                                <span>{product.pieces}</span>
                                <span aria-hidden="true">·</span>
                                <span>Sizes: {product.sizes.join(', ')}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category & Color */}
                        <td className="py-3 px-3 align-middle">
                          <div className="space-y-1">
                            <span className="font-semibold text-[#1A1816] block">
                              {product.category}
                            </span>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#68625B]">
                              <span
                                className="w-3 h-3 rounded-full border border-black/20 shrink-0"
                                style={{ backgroundColor: product.colorHex }}
                              />
                              <span className="truncate">{product.primaryColor}</span>
                            </div>
                            <span className="text-[10px] text-[#8C7A6B] block">
                              {product.occasion}
                            </span>
                          </div>
                        </td>

                        {/* Pricing */}
                        <td className="py-3 px-3 align-middle">
                          <div className="space-y-0.5">
                            <span className="text-sm font-bold text-[#9A7416]">
                              ₹{product.price.toLocaleString()}
                            </span>
                            {product.originalPrice > product.price && (
                              <div className="flex items-center gap-1 text-[11px] text-[#8C7A6B]">
                                <span className="line-through">
                                  ₹{product.originalPrice.toLocaleString()}
                                </span>
                                <span className="text-emerald-700 font-semibold text-[10px]">
                                  {Math.round(
                                    ((product.originalPrice - product.price) /
                                      product.originalPrice) *
                                      100
                                  )}
                                  % off
                                </span>
                              </div>
                            )}
                            <span className="text-[10px] text-[#8C7A6B] block">
                              Valuation: ₹{(product.stock * product.price).toLocaleString()}
                            </span>
                          </div>
                        </td>

                        {/* Current Inventory Stock Level & Adjuster */}
                        <td className="py-3 px-3 align-middle">
                          <div className="space-y-2">
                            {/* Stock Indicator */}
                            <div className="flex items-center gap-2">
                              {isOutOfStock ? (
                                <span className="text-red-700 font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Out of Stock (0)</span>
                                </span>
                              ) : isLowStock ? (
                                <span className="text-amber-800 font-bold flex items-center gap-1">
                                  <AlertTriangle className="w-3.5 h-3.5" />
                                  <span>Low Stock ({product.stock} units)</span>
                                </span>
                              ) : (
                                <span className="text-emerald-800 font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  <span>In Stock ({product.stock} units)</span>
                                </span>
                              )}
                            </div>

                            {/* Live Stock Stepper & Quick Add */}
                            <div className="flex items-center gap-1 flex-wrap">
                              <div className="flex items-center border border-[#E8D8C8] rounded-md bg-[#FAF7F2] overflow-hidden">
                                <button
                                  type="button"
                                  onClick={() => onUpdateStock(product.id, Math.max(0, product.stock - 1))}
                                  className="px-2 py-1 text-[#68625B] hover:bg-[#E8D8C8] hover:text-[#1A1816] transition cursor-pointer"
                                  title="Decrease stock by 1"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <input
                                  type="number"
                                  min={0}
                                  value={product.stock}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value, 10);
                                    onUpdateStock(product.id, isNaN(val) ? 0 : Math.max(0, val));
                                  }}
                                  className="w-12 text-center py-0.5 text-xs font-bold text-[#1A1816] bg-white focus:outline-none"
                                />
                                <button
                                  type="button"
                                  onClick={() => onUpdateStock(product.id, product.stock + 1)}
                                  className="px-2 py-1 text-[#68625B] hover:bg-[#E8D8C8] hover:text-[#1A1816] transition cursor-pointer"
                                  title="Increase stock by 1"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              {/* Quick restock buttons */}
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateStock(product.id, product.stock + 5);
                                  showToast(`Added +5 units to ${product.name}`);
                                }}
                                className="px-1.5 py-1 text-[10px] font-semibold rounded bg-[#F4EFE6] hover:bg-[#E8D8C8] text-[#443E38] transition cursor-pointer"
                                title="Quick add 5 units"
                              >
                                +5
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  onUpdateStock(product.id, product.stock + 10);
                                  showToast(`Added +10 units to ${product.name}`);
                                }}
                                className="px-1.5 py-1 text-[10px] font-semibold rounded bg-[#F4EFE6] hover:bg-[#E8D8C8] text-[#443E38] transition cursor-pointer"
                                title="Quick add 10 units"
                              >
                                +10
                              </button>
                            </div>
                          </div>
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-3 align-middle text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => setEditingProduct(product)}
                              className="p-1.5 rounded-lg border border-[#E8D8C8] hover:bg-[#114B3E] hover:text-white text-[#443E38] transition cursor-pointer"
                              title="Edit product details & specifications"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                const duplicated: Product = {
                                  ...product,
                                  id: `prod-${Date.now()}`,
                                  slug: `${product.slug}-copy-${Date.now().toString().slice(-4)}`,
                                  name: `${product.name} (Variant)`,
                                  stock: 10
                                };
                                onAddProduct(duplicated);
                                showToast(`Duplicated into "${duplicated.name}"`);
                              }}
                              className="p-1.5 rounded-lg border border-[#E8D8C8] hover:bg-[#9A7416] hover:text-white text-[#443E38] transition cursor-pointer"
                              title="Duplicate as new product variant"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(product.id)}
                              className="p-1.5 rounded-lg border border-red-200 hover:bg-red-600 hover:text-white text-red-600 transition cursor-pointer"
                              title="Delete product from catalog"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: EDIT PRODUCT DETAILS & INVENTORY                        */}
      {/* ============================================================== */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8D8C8]">
            {/* Header */}
            <div className="sticky top-0 bg-[#FAF7F2] px-6 py-4 border-b border-[#E8D8C8] flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#9A7416]" />
                <h3 className="font-serif-luxury font-bold text-lg text-[#1A1816]">
                  Edit Bangle Product &amp; Inventory
                </h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-[#8C7A6B] hover:text-[#1A1816] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveEdit} className="p-6 space-y-6">
              {/* Product Title & Subtitle */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProduct.name}
                    onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8D8C8] rounded-lg text-sm text-[#1A1816] focus:outline-none focus:border-[#9A7416]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider mb-1">
                    Subtitle / Artisan Note
                  </label>
                  <input
                    type="text"
                    value={editingProduct.subtitle}
                    onChange={(e) => setEditingProduct({ ...editingProduct, subtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8D8C8] rounded-lg text-sm text-[#1A1816] focus:outline-none focus:border-[#9A7416]"
                  />
                </div>
              </div>

              {/* Pricing & Stock Management */}
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8D8C8] space-y-4">
                <span className="text-xs font-bold text-[#114B3E] uppercase tracking-widest block">
                  Pricing &amp; Live Stock Levels
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#443E38] mb-1">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={editingProduct.price}
                      onChange={(e) => setEditingProduct({ ...editingProduct, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E8D8C8] rounded-lg text-sm font-bold text-[#9A7416] focus:outline-none focus:border-[#9A7416]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#443E38] mb-1">
                      Original MRP (₹)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={editingProduct.originalPrice}
                      onChange={(e) => setEditingProduct({ ...editingProduct, originalPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E8D8C8] rounded-lg text-sm text-[#68625B] focus:outline-none focus:border-[#9A7416]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#443E38] mb-1">
                      Inventory Units in Stock *
                    </label>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        required
                        min={0}
                        value={editingProduct.stock}
                        onChange={(e) => setEditingProduct({ ...editingProduct, stock: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                        className="w-full px-3 py-2 bg-white border border-[#E8D8C8] rounded-lg text-sm font-bold text-[#114B3E] focus:outline-none focus:border-[#114B3E]"
                      />
                      <button
                        type="button"
                        onClick={() => setEditingProduct({ ...editingProduct, stock: editingProduct.stock + 10 })}
                        className="px-2.5 py-2 text-xs font-bold rounded-lg bg-[#114B3E] text-white shrink-0 hover:bg-[#0D382E]"
                        title="Add 10 units"
                      >
                        +10
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Category, Occasion, Pieces */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) => setEditingProduct({ ...editingProduct, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8D8C8] rounded-lg text-sm text-[#1A1816] focus:outline-none focus:border-[#9A7416]"
                  >
                    <option value="Thread Bangles">Thread Bangles</option>
                    <option value="Earring Studs">Earring Studs</option>
                    <option value="Jhumkas">Jhumkas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider mb-1">
                    Occasion
                  </label>
                  <input
                    type="text"
                    value={editingProduct.occasion}
                    onChange={(e) => setEditingProduct({ ...editingProduct, occasion: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8D8C8] rounded-lg text-sm text-[#1A1816] focus:outline-none focus:border-[#9A7416]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider mb-1">
                    Pieces / Set Configuration
                  </label>
                  <input
                    type="text"
                    value={editingProduct.pieces}
                    onChange={(e) => setEditingProduct({ ...editingProduct, pieces: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8D8C8] rounded-lg text-sm text-[#1A1816] focus:outline-none focus:border-[#9A7416]"
                  />
                </div>
              </div>

              {/* Color & Visual Swatches */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider">
                  Silk Color &amp; Hex Code
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={editingProduct.colorHex}
                    onChange={(e) => setEditingProduct({ ...editingProduct, colorHex: e.target.value })}
                    className="w-10 h-10 rounded border border-[#E8D8C8] p-0.5 cursor-pointer bg-white"
                  />
                  <input
                    type="text"
                    value={editingProduct.primaryColor}
                    onChange={(e) => setEditingProduct({ ...editingProduct, primaryColor: e.target.value })}
                    placeholder="Color Name (e.g. Crimson Red)"
                    className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#E8D8C8] rounded-lg text-sm text-[#1A1816] focus:outline-none focus:border-[#9A7416]"
                  />
                </div>

                {/* Preset Silk Color Quick Picker */}
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  <span className="text-[11px] text-[#8C7A6B] mr-1">Silk Palette:</span>
                  {PRESET_SILK_COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setEditingProduct({ ...editingProduct, primaryColor: c.name, colorHex: c.hex })}
                      className="flex items-center gap-1 px-2 py-0.5 rounded border border-[#E8D8C8] hover:border-[#9A7416] text-[11px] bg-white"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sizes Available */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider">
                  Standard Sizes Offered
                </label>
                <div className="flex items-center gap-3 flex-wrap">
                  {STANDARD_SIZES.map((size) => {
                    const isChecked = editingProduct.sizes.includes(size);
                    return (
                      <label key={size} className="flex items-center gap-1.5 text-xs text-[#443E38] cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditingProduct({
                                ...editingProduct,
                                sizes: [...editingProduct.sizes, size].sort()
                              });
                            } else {
                              setEditingProduct({
                                ...editingProduct,
                                sizes: editingProduct.sizes.filter((s) => s !== size)
                              });
                            }
                          }}
                          className="rounded border-[#C59B27] text-[#114B3E] focus:ring-[#114B3E]"
                        />
                        <span className="font-semibold">Size {size}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Product Visual / Image Selection */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider">
                  Product Image / Visual
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={customUploadedImages[editingProduct.id] || editingProduct.image}
                    alt="Preview"
                    className="w-16 h-16 rounded-xl object-cover bg-[#F4EFE6] border border-[#E8D8C8] shrink-0"
                  />
                  <div className="flex-1 space-y-2">
                    <input
                      type="text"
                      value={editingProduct.image}
                      onChange={(e) => setEditingProduct({ ...editingProduct, image: e.target.value })}
                      placeholder="Image URL or /images/bangles/..."
                      className="w-full px-3 py-1.5 bg-[#FAF7F2] border border-[#E8D8C8] rounded-lg text-xs text-[#1A1816] focus:outline-none focus:border-[#9A7416]"
                    />
                    <div className="flex items-center gap-2">
                      <select
                        onChange={(e) => {
                          if (e.target.value) {
                            setEditingProduct({ ...editingProduct, image: e.target.value });
                          }
                        }}
                        className="text-xs bg-[#FAF7F2] border border-[#E8D8C8] rounded px-2 py-1 text-[#443E38]"
                      >
                        <option value="">Choose Curated Handmade Bangle SVG...</option>
                        {PRESET_BANGLES_IMAGES.map((img) => (
                          <option key={img.path} value={img.path}>
                            {img.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Description, Materials, Care */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider mb-1">
                    Artisan Description
                  </label>
                  <textarea
                    rows={2}
                    value={editingProduct.description}
                    onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8D8C8] rounded-lg text-xs text-[#1A1816] focus:outline-none focus:border-[#9A7416]"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider mb-1">
                      Materials
                    </label>
                    <input
                      type="text"
                      value={editingProduct.materials}
                      onChange={(e) => setEditingProduct({ ...editingProduct, materials: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8D8C8] rounded-lg text-xs text-[#1A1816] focus:outline-none focus:border-[#9A7416]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider mb-1">
                      Care Instructions
                    </label>
                    <input
                      type="text"
                      value={editingProduct.care}
                      onChange={(e) => setEditingProduct({ ...editingProduct, care: e.target.value })}
                      className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8D8C8] rounded-lg text-xs text-[#1A1816] focus:outline-none focus:border-[#9A7416]"
                    />
                  </div>
                </div>
              </div>

              {/* Feature Badges */}
              <div className="flex items-center gap-6 pt-2 border-t border-[#F0E6D8]">
                <label className="flex items-center gap-2 text-xs font-semibold text-[#1A1816] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.isBestSeller)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isBestSeller: e.target.checked })}
                    className="rounded border-[#C59B27] text-[#114B3E] focus:ring-[#114B3E]"
                  />
                  <span>Mark as Best Seller</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-[#1A1816] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.isNew)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, isNew: e.target.checked })}
                    className="rounded border-[#C59B27] text-[#114B3E] focus:ring-[#114B3E]"
                  />
                  <span>Mark as New Arrival</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-semibold text-[#1A1816] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editingProduct.featured)}
                    onChange={(e) => setEditingProduct({ ...editingProduct, featured: e.target.checked })}
                    className="rounded border-[#C59B27] text-[#114B3E] focus:ring-[#114B3E]"
                  />
                  <span>Featured Collection</span>
                </label>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8D8C8]">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 rounded-lg border border-[#E8D8C8] text-xs font-semibold text-[#68625B] hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-[#114B3E] hover:bg-[#0D382E] text-white text-xs font-bold uppercase tracking-wider transition shadow-md"
                >
                  Save Changes &amp; Update Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: ADD NEW PRODUCT & INITIAL INVENTORY                    */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-[#E8D8C8]">
            <div className="sticky top-0 bg-[#FAF7F2] px-6 py-4 border-b border-[#E8D8C8] flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <PackagePlus className="w-5 h-5 text-[#C59B27]" />
                <h3 className="font-serif-luxury font-bold text-lg text-[#1A1816]">
                  Add New Handmade Bangle to Catalog
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-[#8C7A6B] hover:text-[#1A1816] p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNew} className="p-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider mb-1">
                    Bangle Name / Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anarkali Ruby Red Silk Chooda Set"
                    value={newProductDraft.name}
                    onChange={(e) => setNewProductDraft({ ...newProductDraft, name: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8D8C8] rounded-lg text-sm text-[#1A1816] focus:outline-none focus:border-[#9A7416]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider mb-1">
                    Artisan Subtitle
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Set of 16 Silk Thread Bangles with Uncut Kundan & Zari"
                    value={newProductDraft.subtitle}
                    onChange={(e) => setNewProductDraft({ ...newProductDraft, subtitle: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8D8C8] rounded-lg text-sm text-[#1A1816] focus:outline-none focus:border-[#9A7416]"
                  />
                </div>
              </div>

              {/* Pricing & Initial Inventory */}
              <div className="p-4 rounded-xl bg-[#FAF7F2] border border-[#E8D8C8] space-y-4">
                <span className="text-xs font-bold text-[#114B3E] uppercase tracking-widest block">
                  Initial Inventory &amp; Pricing
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#443E38] mb-1">
                      Selling Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={newProductDraft.price}
                      onChange={(e) => setNewProductDraft({ ...newProductDraft, price: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E8D8C8] rounded-lg text-sm font-bold text-[#9A7416] focus:outline-none focus:border-[#9A7416]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#443E38] mb-1">
                      Original MRP (₹)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={newProductDraft.originalPrice}
                      onChange={(e) => setNewProductDraft({ ...newProductDraft, originalPrice: Number(e.target.value) })}
                      className="w-full px-3 py-2 bg-white border border-[#E8D8C8] rounded-lg text-sm text-[#68625B] focus:outline-none focus:border-[#9A7416]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#443E38] mb-1">
                      Initial Stock Quantity *
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={newProductDraft.stock}
                      onChange={(e) => setNewProductDraft({ ...newProductDraft, stock: Math.max(0, parseInt(e.target.value, 10) || 0) })}
                      className="w-full px-3 py-2 bg-white border border-[#E8D8C8] rounded-lg text-sm font-bold text-[#114B3E] focus:outline-none focus:border-[#114B3E]"
                    />
                  </div>
                </div>
              </div>

              {/* Category, Occasion, Pieces */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider mb-1">
                    Category *
                  </label>
                  <select
                    value={newProductDraft.category}
                    onChange={(e) => setNewProductDraft({ ...newProductDraft, category: e.target.value as any })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8D8C8] rounded-lg text-sm text-[#1A1816] focus:outline-none focus:border-[#9A7416]"
                  >
                    <option value="Thread Bangles">Thread Bangles</option>
                    <option value="Earring Studs">Earring Studs</option>
                    <option value="Jhumkas">Jhumkas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider mb-1">
                    Occasion
                  </label>
                  <input
                    type="text"
                    value={newProductDraft.occasion}
                    onChange={(e) => setNewProductDraft({ ...newProductDraft, occasion: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8D8C8] rounded-lg text-sm text-[#1A1816] focus:outline-none focus:border-[#9A7416]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider mb-1">
                    Pieces Configuration
                  </label>
                  <input
                    type="text"
                    value={newProductDraft.pieces}
                    onChange={(e) => setNewProductDraft({ ...newProductDraft, pieces: e.target.value })}
                    className="w-full px-3 py-2 bg-[#FAF7F2] border border-[#E8D8C8] rounded-lg text-sm text-[#1A1816] focus:outline-none focus:border-[#9A7416]"
                  />
                </div>
              </div>

              {/* Silk Color Swatch */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider">
                  Silk Color &amp; Hex Code
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={newProductDraft.colorHex}
                    onChange={(e) => setNewProductDraft({ ...newProductDraft, colorHex: e.target.value })}
                    className="w-10 h-10 rounded border border-[#E8D8C8] p-0.5 cursor-pointer bg-white"
                  />
                  <input
                    type="text"
                    value={newProductDraft.primaryColor}
                    onChange={(e) => setNewProductDraft({ ...newProductDraft, primaryColor: e.target.value })}
                    placeholder="Color Name"
                    className="flex-1 px-3 py-2 bg-[#FAF7F2] border border-[#E8D8C8] rounded-lg text-sm text-[#1A1816] focus:outline-none focus:border-[#9A7416]"
                  />
                </div>
                <div className="flex items-center gap-1.5 flex-wrap pt-1">
                  {PRESET_SILK_COLORS.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setNewProductDraft({ ...newProductDraft, primaryColor: c.name, colorHex: c.hex })}
                      className="flex items-center gap-1 px-2 py-0.5 rounded border border-[#E8D8C8] hover:border-[#9A7416] text-[11px] bg-white"
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.hex }} />
                      <span>{c.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Visual SVG Preset */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider">
                  Bangles Illustration Preset
                </label>
                <div className="flex items-center gap-3">
                  <img
                    src={newProductDraft.image}
                    alt="Draft Preview"
                    className="w-16 h-16 rounded-xl object-cover bg-[#F4EFE6] border border-[#E8D8C8] shrink-0"
                  />
                  <select
                    value={newProductDraft.image}
                    onChange={(e) => setNewProductDraft({ ...newProductDraft, image: e.target.value })}
                    className="flex-1 text-xs bg-[#FAF7F2] border border-[#E8D8C8] rounded-lg px-3 py-2 text-[#1A1816]"
                  >
                    {PRESET_BANGLES_IMAGES.map((img) => (
                      <option key={img.path} value={img.path}>
                        {img.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#E8D8C8]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-[#E8D8C8] text-xs font-semibold text-[#68625B] hover:bg-[#FAF7F2]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-[#C59B27] hover:bg-[#A88118] text-[#1A1816] text-xs font-bold uppercase tracking-wider transition shadow-md"
                >
                  Publish &amp; Add Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: BATCH RESTOCK INVENTORY                                 */}
      {/* ============================================================== */}
      {isBatchRestockOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E8D8C8] space-y-4">
            <div className="flex items-center justify-between border-b border-[#F0E6D8] pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-[#114B3E]" />
                <h3 className="font-serif-luxury font-bold text-base text-[#1A1816]">
                  Batch Inventory Restocking
                </h3>
              </div>
              <button
                onClick={() => setIsBatchRestockOpen(false)}
                className="text-[#8C7A6B] hover:text-[#1A1816]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#68625B]">
              Add stock units to all currently filtered items ({displayedProducts.length} items) or specific selected items ({selectedProductIds.length || displayedProducts.length} items).
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-[#1A1816] uppercase tracking-wider">
                Units to Add (+Delta)
              </label>
              <div className="flex items-center gap-2">
                {[5, 10, 20, 50].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setBatchDelta(num)}
                    className={`flex-1 py-1.5 text-xs font-bold rounded-lg border transition ${
                      batchDelta === num
                        ? 'bg-[#114B3E] text-white border-[#114B3E]'
                        : 'bg-[#FAF7F2] border-[#E8D8C8] text-[#443E38] hover:bg-[#E8D8C8]'
                    }`}
                  >
                    +{num}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min={1}
                value={batchDelta}
                onChange={(e) => setBatchDelta(Math.max(1, parseInt(e.target.value, 10) || 1))}
                className="w-full mt-2 px-3 py-2 bg-[#FAF7F2] border border-[#E8D8C8] rounded-lg text-sm text-center font-bold text-[#114B3E]"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#F0E6D8]">
              <button
                type="button"
                onClick={() => setIsBatchRestockOpen(false)}
                className="px-4 py-2 rounded-lg border border-[#E8D8C8] text-xs font-semibold text-[#68625B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleApplyBatchRestock}
                className="px-5 py-2 rounded-lg bg-[#114B3E] hover:bg-[#0D382E] text-white text-xs font-bold"
              >
                Confirm Restock (+{batchDelta} Units)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CONFIRM DELETE PRODUCT                                  */}
      {/* ============================================================== */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-red-200 space-y-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="font-serif-luxury font-bold text-base text-[#1A1816]">
                Delete Bangle from Catalog?
              </h3>
            </div>
            <p className="text-xs text-[#68625B] leading-relaxed">
              Are you sure you want to remove this product from the inventory and storefront? This action will remove it from customer view.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteId(null)}
                className="px-3.5 py-1.5 rounded-lg border border-[#E8D8C8] text-xs font-semibold text-[#68625B]"
              >
                Keep Product
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteProduct(confirmDeleteId);
                  showToast('Product removed from catalog.');
                  setConfirmDeleteId(null);
                }}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: CONFIRM RESET TO DEFAULTS                              */}
      {/* ============================================================== */}
      {confirmResetOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-red-200 space-y-4">
            <div className="flex items-center gap-2 text-red-700">
              <RotateCcw className="w-5 h-5 shrink-0" />
              <h3 className="font-serif-luxury font-bold text-base text-[#1A1816]">
                Reset to Factory Catalog?
              </h3>
            </div>
            <p className="text-xs text-[#68625B] leading-relaxed">
              This will restore the 11 original Subhiksha artisan silk thread bangle collections and default inventory numbers.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmResetOpen(false)}
                className="px-3.5 py-1.5 rounded-lg border border-[#E8D8C8] text-xs font-semibold text-[#68625B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onResetToDefaults();
                  showToast('Catalog restored to default handcrafted collections.');
                  setConfirmResetOpen(false);
                }}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold"
              >
                Reset Catalog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
