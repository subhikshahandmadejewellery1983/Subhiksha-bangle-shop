import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ShoppingBag,
  Heart,
  Search,
  Star,
  Check,
  Truck,
  Shield,
  Sparkles,
  Scissors,
  ArrowRight,
  ChevronDown,
  Phone,
  Mail,
  Package,
  Eye,
  Tag,
  Lock,
  CreditCard,
  Gift,
  Ruler,
  SlidersHorizontal,
  X,
  Plus,
  Minus,
  MessageCircle,
  Clock,
  Palette,
  Award,
  Globe,
  Share2,
  Copy,
  ExternalLink,
  Camera,
  RotateCcw,
  FileSpreadsheet,
  Boxes,
  Edit
} from 'lucide-react';
import { User } from 'firebase/auth';
import { SilkThreadBangleVisual } from './components/SilkThreadBangleVisual';
import { initAuth } from './services/googleAuth';
import { OrderRecord, SAMPLE_ORDERS } from './services/googleSheetsService';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { GoogleSheetsOrderManager } from './components/GoogleSheetsOrderManager';
import { OriginalPhotosManager, ORIGINAL_TARGET_PRODUCTS } from './components/OriginalPhotosManager';
import { AdminDashboard } from './components/AdminDashboard';

// --- Types ---
interface Product {
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

interface CartItem {
  id: string;
  productId: string;
  name: string;
  size: string;
  price: number;
  image: string;
  quantity: number;
  isCustom?: boolean;
  customDetails?: {
    colorName: string;
    embellishment: string;
    pieces: string;
  };
}

// Helper to map silk color to handmade silk thread bangle image
const getBangleImageForColor = (colorName: string): string => {
  switch (colorName.toLowerCase()) {
    case 'crimson red':
      return '/images/bangles/maharani-crimson-kundan.svg';
    case 'royal emerald':
      return '/images/bangles/mayura-emerald-royale.svg';
    case 'turquoise blue':
    case 'sky blue':
    case 'peacock blue':
      return '/images/bangles/subhiksha-turquoise-pink-kasu.svg';
    case 'shahi plum':
    case 'royal violet':
      return '/images/bangles/shahi-plum-royal-violet.svg';
    case 'rani pink':
      return '/images/bangles/gulabi-rani-pink.svg';
    case 'antique ivory':
      return '/images/bangles/padmavati-antique-ivory.svg';
    case 'mustard gold':
      return '/images/bangles/basanti-haldi-mustard.svg';
    case 'mint sage':
      return '/images/bangles/chandrakala-mint-mirror.svg';
    case 'sunset tangerine':
      return '/images/bangles/surya-amber-kundan.svg';
    default:
      return '/images/bangles/subhiksha-turquoise-pink-kasu.svg';
  }
};

// --- Boutique Catalog (Curated Exclusively: Thread Bangles, Earring Studs & Jhumkas) ---
const INITIAL_PRODUCTS: Product[] = [
  // === 1. THREAD BANGLES ===
  {
    id: "prod-1",
    slug: "maharani-crimson-kundan-bridal-chooda",
    name: "Maharani Crimson Kundan Bridal Chooda Bangles",
    subtitle: "24-Piece Pure Mulberry Silk Thread Bridal Bangle Set with Jadau Kundan & Micro-Pearl Latkans",
    price: 3499,
    originalPrice: 4999,
    rating: 4.95,
    reviewCount: 148,
    category: "Thread Bangles",
    occasion: "Bridal & Wedding",
    primaryColor: "Crimson Red",
    colorHex: "#8B1824",
    sizes: ["2.2", "2.4", "2.6", "2.8", "2.10"],
    pieces: "Full 24-Piece Bridal Bangle Set",
    stock: 12,
    isBestSeller: true,
    isNew: false,
    featured: true,
    image: "/images/bangles/maharani-crimson-kundan.svg",
    images: ["/images/bangles/maharani-crimson-kundan.svg"],
    description: "An opulent 24-piece heirloom bridal chooda hand-wrapped in luminous deep crimson mulberry silk thread. Intricately adorned with fine uncut jadau Kundan stones, micro-pearl tassels (latkans), and delicate antique gold zari filigree.",
    materials: "100% High-twist Mulberry Silk Yarn, Brass Kada core, Hydro Kundan stones, Freshwater seed pearls",
    care: "Keep away from water, perfumes, and heavy dampness. Store in our silk-padded presentation box provided."
  },
  {
    id: "prod-2",
    slug: "mayur-emerald-peacock-designer-kadas",
    name: "Mayura Emerald Royale Silk Kada Bangles",
    subtitle: "Pair of 2 Handcrafted Zardozi Floral Kada Bangles with Silk Wrapping & Green Gemstones",
    price: 1899,
    originalPrice: 2499,
    rating: 4.88,
    reviewCount: 92,
    category: "Thread Bangles",
    occasion: "Sangeet & Festive",
    primaryColor: "Royal Emerald",
    colorHex: "#114B3E",
    sizes: ["2.4", "2.6", "2.8"],
    pieces: "Pair (2 Handmade Kada Bangles)",
    stock: 18,
    isBestSeller: true,
    isNew: true,
    featured: true,
    image: "/images/bangles/mayura-emerald-royale.svg",
    images: ["/images/bangles/mayura-emerald-royale.svg"],
    description: "Inspired by the royal peacock pavilions of Jaipur, this majestic pair features an emerald green base woven meticulously with double-ply silk thread and highlighted with zardozi bullion threadwork.",
    materials: "Emerald Silk Thread, Zinc alloy heavy base, Czech crystal baguettes, Brass wire",
    care: "Gently wipe with dry microfiber cloth. Avoid exposure to harsh sprays and humid areas."
  },
  {
    id: "prod-3",
    slug: "subhiksha-turquoise-rani-pink-kasu",
    name: "Subhiksha Turquoise & Rani Pink Kasu Coin Bangles",
    subtitle: "Handcrafted Sky Blue Silk Thread Bangles with Temple Kasu Coins & Magenta Crystals",
    price: 2199,
    originalPrice: 2899,
    rating: 4.96,
    reviewCount: 114,
    category: "Thread Bangles",
    occasion: "Bridal & Pooja",
    primaryColor: "Turquoise Blue",
    colorHex: "#0096B7",
    sizes: ["2.2", "2.4", "2.6", "2.8"],
    pieces: "Set of 6 Temple Kasu Bangles",
    stock: 15,
    isBestSeller: true,
    isNew: true,
    featured: true,
    image: "/images/bangles/subhiksha-turquoise-pink-kasu.svg",
    images: ["/images/bangles/subhiksha-turquoise-pink-kasu.svg"],
    description: "An auspicious South Indian bridal creation featuring luminous turquoise blue pure silk thread wrapped over solid metal cores. Adorned with antique gold embossed Lakshmi Kasu coins, vibrant magenta pink square crystals, and floral motifs.",
    materials: "Pure Turquoise Mulberry Silk Yarn, Antique Gold Plated Kasu Coins, Austrian Rani Pink Crystals",
    care: "Keep in dry presentation pouch. Avoid water and moisture."
  },
  {
    id: "prod-4",
    slug: "shahi-plum-royal-violet-stack",
    name: "Shahi Plum Royal Violet Bangle Stack",
    subtitle: "Regal Dual-Tone Purple & Lilac Silk Bangles with Amethyst Crystals & Floral Rosettes",
    price: 1799,
    originalPrice: 2299,
    rating: 4.91,
    reviewCount: 78,
    category: "Thread Bangles",
    occasion: "Reception & Cocktail",
    primaryColor: "Shahi Plum",
    colorHex: "#4A154B",
    sizes: ["2.4", "2.6", "2.8"],
    pieces: "Set of 9 Silk Thread Bangles",
    stock: 20,
    isBestSeller: true,
    isNew: false,
    featured: true,
    image: "/images/bangles/shahi-plum-royal-violet.svg",
    images: ["/images/bangles/shahi-plum-royal-violet.svg"],
    description: "A royal evening ensemble combining deep shahi plum and pastel lilac silk threads. Bordered with square amethyst crystal baguettes in gold bezels and highlighted by a centerpiece kada with purple teardrop petals.",
    materials: "High-grade Violet Mulberry Silk Thread, Amethyst Austrian Crystal Baguettes, Mirror Glass, Metal Base",
    care: "Wipe with soft lint-free cloth after wear. Keep in velvet box."
  },
  {
    id: "prod-5",
    slug: "padmavati-antique-gold-ivory-set",
    name: "Padmavati Antique Gold & Ivory Kada Bangles",
    subtitle: "Four-Piece Statement Handmade Kada Bangle Set with Polki Stones & Dual Silk Threading",
    price: 2299,
    originalPrice: 2999,
    rating: 4.97,
    reviewCount: 64,
    category: "Thread Bangles",
    occasion: "Bridal & Reception",
    primaryColor: "Antique Ivory",
    colorHex: "#F5F0E6",
    sizes: ["2.4", "2.6", "2.8", "2.10"],
    pieces: "Set of 4 Broad Handmade Kadas",
    stock: 8,
    isBestSeller: false,
    isNew: false,
    featured: false,
    image: "/images/bangles/padmavati-antique-ivory.svg",
    images: ["/images/bangles/padmavati-antique-ivory.svg"],
    description: "A harmonious marriage of natural raw ivory silk and antique matte gold zari. Features hand-encrusted polki glass mirrors framed in raised brass bezels for a royal vintage appeal.",
    materials: "Raw Unbleached Silk Thread, Antique Gold Zari, Polki Glass, Brass Core",
    care: "Avoid moisture and contact with cosmetics. Keep in velvet box."
  },
  {
    id: "prod-6",
    slug: "rani-pink-gold-temple-stack",
    name: "Gulabi Rani Pink Temple Bangle Stack",
    subtitle: "Festive Stack of 12 Handmade Silk Thread Bangles with Micro Ghungroo Beads",
    price: 1499,
    originalPrice: 1999,
    rating: 4.92,
    reviewCount: 110,
    category: "Thread Bangles",
    occasion: "Reception & Pooja",
    primaryColor: "Rani Pink",
    colorHex: "#C2185B",
    sizes: ["2.2", "2.4", "2.6", "2.8"],
    pieces: "Set of 12 Handmade Bangles",
    stock: 25,
    isBestSeller: true,
    isNew: false,
    featured: false,
    image: "/images/bangles/gulabi-rani-pink.svg",
    images: ["/images/bangles/gulabi-rani-pink.svg"],
    description: "Vibrant fuchsia Rani pink silk thread wrapped over solid metal cores, bordered with delicate matte gold temple ball chains and micro-beaded trims.",
    materials: "Pure Dyed Silk Yarn, Gold Plated Brass Beads, Nickel-free base",
    care: "Store individually in air-tight zip pouches to preserve the golden luster."
  },
  {
    id: "prod-7",
    slug: "haldi-mustard-floral-silk-stack",
    name: "Basanti Haldi Mustard Festive Bangle Stack",
    subtitle: "Set of 12 Handmade Silk Thread Bangles with Gota Patti & Zari Rosettes",
    price: 1599,
    originalPrice: 2099,
    rating: 4.88,
    reviewCount: 82,
    category: "Thread Bangles",
    occasion: "Haldi & Mehendi",
    primaryColor: "Haldi Yellow",
    colorHex: "#D4A017",
    sizes: ["2.2", "2.4", "2.6", "2.8"],
    pieces: "Set of 12 Handmade Bangles",
    stock: 15,
    isBestSeller: true,
    isNew: false,
    featured: false,
    image: "/images/bangles/basanti-haldi-mustard.svg",
    images: ["/images/bangles/basanti-haldi-mustard.svg"],
    description: "Bask in festive sunshine with this cheerful haldi yellow handmade silk thread bangle stack. Includes 12 hand-wrapped bangles embellished with golden gota patti rosettes and delicate bead borders.",
    materials: "Mustard Gold Silk Thread, Gota Patti Lace, Solid Brass Core, Gold-toned Trims",
    care: "Store in dry silk pouches. Do not expose to moisture."
  },
  {
    id: "prod-8",
    slug: "neelam-peacock-royal-blue-kada",
    name: "Neelam Royal Peacock Silk Kada Bangles",
    subtitle: "Cobalt Blue Silk Handmade Bangles with Kundan Floral Centerpiece & Latkans",
    price: 2199,
    originalPrice: 2799,
    rating: 4.91,
    reviewCount: 52,
    category: "Thread Bangles",
    occasion: "Sangeet & Festive",
    primaryColor: "Peacock Blue",
    colorHex: "#10375C",
    sizes: ["2.4", "2.6", "2.8", "2.10"],
    pieces: "Set of 6 Designer Handmade Bangles",
    stock: 14,
    isBestSeller: false,
    isNew: false,
    featured: false,
    image: "/images/bangles/neelam-peacock-blue.svg",
    images: ["/images/bangles/neelam-peacock-blue.svg"],
    description: "Stately peacock blue silk thread wrapped on broad statement kadas, crowned with blooming floral Kundan chakris and dangling gold bell charms that chime with movement.",
    materials: "Royal Blue Mulberry Silk, Kundan Stones, Gold-toned Ghungroos",
    care: "Keep in dry container; avoid damp vanity tables."
  },

  // === 2. EARRING STUDS ===
  {
    id: "prod-stud-1",
    slug: "kemp-lotus-thread-studs",
    name: "Kemp Lotus Temple Silk Thread Studs",
    subtitle: "South Indian Temple Kemp Stone Lotus Flower Silk Studs in Emerald & Ruby",
    price: 499,
    originalPrice: 799,
    rating: 4.96,
    reviewCount: 84,
    category: "Earring Studs",
    occasion: "Temple & Festive",
    primaryColor: "Royal Emerald",
    colorHex: "#114B3E",
    sizes: ["Push Back", "Screw Back", "Clip-On"],
    pieces: "Pair (2 Handmade Silk Studs)",
    stock: 24,
    isBestSeller: true,
    isNew: true,
    featured: true,
    image: "/images/studs/kemp-lotus-thread-studs.svg",
    images: ["/images/studs/kemp-lotus-thread-studs.svg"],
    description: "Exquisite South Indian temple-style silk thread button studs wrapped in royal emerald green pure mulberry silk. Bordered by an antique gold ball chain and crowned with hand-set ruby kemp lotus petals and center pearl roundel.",
    materials: "100% Pure Mulberry Silk Yarn, Kemp Austrian Red Stones, Hypoallergenic Gold Plated Brass Base",
    care: "Avoid moisture and perfumes. Keep in presentation box provided."
  },
  {
    id: "prod-stud-2",
    slug: "silk-thread-kundan-floral-studs",
    name: "Royal Silk Thread Kundan Floral Studs",
    subtitle: "Crimson Red Silk Button Studs with Uncut Kundan Centerpiece & Freshwater Pearl Halo",
    price: 599,
    originalPrice: 899,
    rating: 4.94,
    reviewCount: 68,
    category: "Earring Studs",
    occasion: "Bridal & Wedding",
    primaryColor: "Crimson Red",
    colorHex: "#8B1824",
    sizes: ["Push Back", "Screw Back", "Clip-On"],
    pieces: "Pair (2 Handmade Kundan Studs)",
    stock: 18,
    isBestSeller: true,
    isNew: true,
    featured: true,
    image: "/images/studs/silk-thread-kundan-studs.svg",
    images: ["/images/studs/silk-thread-kundan-studs.svg"],
    description: "Regal bridal studs wrapped in deep crimson red mulberry silk thread with a double rope gold bezel. Features an uncut jadau kundan stone encircled by sixteen luminous freshwater seed pearls.",
    materials: "Crimson Mulberry Silk, Jadau Hydro Kundan, Seed Pearls, Gold-plated Base",
    care: "Store individually in air-tight zip pouches."
  },
  {
    id: "prod-stud-3",
    slug: "rani-pink-mirror-silk-studs",
    name: "Rani Pink Mirrorwork Silk Button Studs",
    subtitle: "Handcrafted Fuchsia Pink Silk Studs with Real Mirror Glass & Gold Beaded Trim",
    price: 449,
    originalPrice: 699,
    rating: 4.91,
    reviewCount: 52,
    category: "Earring Studs",
    occasion: "Sangeet & Haldi",
    primaryColor: "Rani Pink",
    colorHex: "#C2185B",
    sizes: ["Push Back", "Screw Back"],
    pieces: "Pair (2 Handmade Mirror Studs)",
    stock: 20,
    isBestSeller: false,
    isNew: true,
    featured: false,
    image: "/images/studs/rani-pink-mirror-studs.svg",
    images: ["/images/studs/rani-pink-mirror-studs.svg"],
    description: "Playful and radiant fuchsia pink silk thread button studs centering a circular glass mirror framed in gold filigree and delicate beadwork. Pairs effortlessly with festive lehengas.",
    materials: "Rani Pink Pure Silk, Glass Mirror, Gold Electroplated Ball Chain, Hypoallergenic Posts",
    care: "Protect from drops and water."
  },
  {
    id: "prod-stud-4",
    slug: "antique-kasu-coin-silk-studs",
    name: "Antique Lakshmi Kasu Coin Silk Studs",
    subtitle: "Golden Haldi Silk Button Studs with Temple Kasu Coins & Pearl Border",
    price: 549,
    originalPrice: 799,
    rating: 4.93,
    reviewCount: 42,
    category: "Earring Studs",
    occasion: "Pooja & Festive",
    primaryColor: "Haldi Yellow",
    colorHex: "#D4A017",
    sizes: ["Push Back", "Clip-On"],
    pieces: "Pair (2 Handmade Kasu Studs)",
    stock: 16,
    isBestSeller: false,
    isNew: false,
    featured: false,
    image: "/images/studs/antique-coin-silk-studs.svg",
    images: ["/images/studs/antique-coin-silk-studs.svg"],
    description: "Traditional South Indian Lakshmi Kasu coin embossed in matte gold, mounted on bright golden mustard silk thread and bordered with delicate seed pearls.",
    materials: "Mustard Silk Thread, Antique Brass Kasu Coins, Pearl Trim",
    care: "Wipe with dry microfiber cloth."
  },

  // === 3. JHUMKAS ===
  {
    id: "prod-jhumka-1",
    slug: "royal-emerald-bell-silk-jhumka",
    name: "Royal Emerald Bell Silk Thread Jhumkas",
    subtitle: "Peacock Green Bell Jhumkas with Seed Pearl Droplets & Floral Stud Top",
    price: 799,
    originalPrice: 1199,
    rating: 4.98,
    reviewCount: 112,
    category: "Jhumkas",
    occasion: "Bridal & Festive",
    primaryColor: "Royal Emerald",
    colorHex: "#114B3E",
    sizes: ["Push Back", "Screw Back", "Clip-On"],
    pieces: "Pair (2 Hanging Bell Jhumkas)",
    stock: 15,
    isBestSeller: true,
    isNew: true,
    featured: true,
    image: "/images/jhumkas/royal-emerald-silk-jhumka.svg",
    images: ["/images/jhumkas/royal-emerald-silk-jhumka.svg"],
    description: "Grand handcrafted silk thread bell jhumkas in royal emerald green. Accented with golden filigree waistband, hanging seed pearl latkans, and a matching silk stud top with pearl roundel.",
    materials: "Emerald Silk Yarn, Brass Bell Core, Freshwater Seed Pearls, 24K Gold Polish Caps",
    care: "Keep suspended or flat in presentation box."
  },
  {
    id: "prod-jhumka-2",
    slug: "maharani-crimson-kundan-bridal-jhumka",
    name: "Maharani Crimson Kundan Bridal Jhumkas",
    subtitle: "Dual-Tier Deep Red Silk Bridal Jhumkas with Jadau Kundan Top & Pearl Latkans",
    price: 999,
    originalPrice: 1499,
    rating: 4.97,
    reviewCount: 96,
    category: "Jhumkas",
    occasion: "Bridal & Wedding",
    primaryColor: "Crimson Red",
    colorHex: "#8B1824",
    sizes: ["Push Back", "Screw Back", "Clip-On"],
    pieces: "Pair (2 Grand Bridal Jhumkas)",
    stock: 10,
    isBestSeller: true,
    isNew: false,
    featured: true,
    image: "/images/jhumkas/crimson-kundan-bridal-jhumka.svg",
    images: ["/images/jhumkas/crimson-kundan-bridal-jhumka.svg"],
    description: "Heirloom bridal jhumkas wrapped in royal crimson silk yarn with uncut jadau kundan floral top and large silk bell dome. Bordered with a cascade of seed pearls and gold ghungroo latkans.",
    materials: "Crimson Mulberry Silk, Hydro Kundan, Pearls, Brass Bell Foundation",
    care: "Store in soft velvet pouch."
  },
  {
    id: "prod-jhumka-3",
    slug: "peacock-blue-chandbali-silk-jhumka",
    name: "Peacock Blue Chandbali Crescent Silk Jhumkas",
    subtitle: "Royal Blue Crescent Moon Chandbali with Hanging Silk Jhumka Dome",
    price: 899,
    originalPrice: 1299,
    rating: 4.92,
    reviewCount: 74,
    category: "Jhumkas",
    occasion: "Sangeet & Reception",
    primaryColor: "Peacock Blue",
    colorHex: "#10375C",
    sizes: ["Push Back", "Screw Back"],
    pieces: "Pair (2 Chandbali Jhumkas)",
    stock: 14,
    isBestSeller: false,
    isNew: true,
    featured: false,
    image: "/images/jhumkas/peacock-blue-chandbali-jhumka.svg",
    images: ["/images/jhumkas/peacock-blue-chandbali-jhumka.svg"],
    description: "Dramatic combination of a handcrafted royal blue silk crescent moon (chandbali) and a swinging bell jhumka dome. Embellished with pearls and gold detailing for royal Indian events.",
    materials: "Cobalt Blue Silk Thread, Chandbali Frame, Pearl Droplets, Gold Trim",
    care: "Handle with care; avoid moisture."
  },
  {
    id: "prod-jhumka-4",
    slug: "sunshine-haldi-silk-ghungroo-jhumka",
    name: "Sunshine Haldi Silk Jhumkas with Ghungroos",
    subtitle: "Golden Mustard Mini Dome Jhumkas with Chiming Gold Bells for Festive Wear",
    price: 699,
    originalPrice: 999,
    rating: 4.90,
    reviewCount: 56,
    category: "Jhumkas",
    occasion: "Haldi & Mehendi",
    primaryColor: "Haldi Yellow",
    colorHex: "#D4A017",
    sizes: ["Push Back", "Clip-On"],
    pieces: "Pair (2 Festive Mini Jhumkas)",
    stock: 22,
    isBestSeller: true,
    isNew: false,
    featured: false,
    image: "/images/jhumkas/sunshine-haldi-silk-jhumka.svg",
    images: ["/images/jhumkas/sunshine-haldi-silk-jhumka.svg"],
    description: "Lightweight and joyful haldi yellow handmade silk thread jhumkas trimmed with tiny gold chiming ghungroo bells and fuchsia pink crystal accents.",
    materials: "Haldi Silk Yarn, Gold Plated Ghungroos, Czech Pink Crystals",
    care: "Store in dry box away from humidity."
  }
];

// --- Customizer Palette Options ---
const CUSTOM_COLORS = [
  { name: 'Crimson Red', hex: '#8B1824', bgClass: 'bg-[#8B1824]' },
  { name: 'Rani Pink', hex: '#C2185B', bgClass: 'bg-[#C2185B]' },
  { name: 'Royal Emerald', hex: '#114B3E', bgClass: 'bg-[#114B3E]' },
  { name: 'Peacock Blue', hex: '#10375C', bgClass: 'bg-[#10375C]' },
  { name: 'Mustard Gold', hex: '#D4A017', bgClass: 'bg-[#D4A017]' },
  { name: 'Shahi Plum', hex: '#4A154B', bgClass: 'bg-[#4A154B]' },
  { name: 'Antique Ivory', hex: '#EBE2D0', bgClass: 'bg-[#EBE2D0]' },
  { name: 'Mint Sage', hex: '#7A9A8B', bgClass: 'bg-[#7A9A8B]' },
  { name: 'Sunset Tangerine', hex: '#D95C24', bgClass: 'bg-[#D95C24]' },
  { name: 'Midnight Black', hex: '#1E1B18', bgClass: 'bg-[#1E1B18]' }
];

const CUSTOM_EMBELLISHMENTS = [
  { id: 'kundan', name: 'Jadau Kundan & Seed Pearls', addPrice: 450, desc: 'Uncut traditional kundan with delicate pearl border' },
  { id: 'zardozi', name: 'Zardozi Embroidery & Gold Wire', addPrice: 600, desc: 'Heavy royal zardozi bullion wire work' },
  { id: 'latkan', name: 'Hanging Pearl Latkan Tassels', addPrice: 350, desc: 'Bridal cluster latkans with micro bell ghungroos' },
  { id: 'mirror', name: 'Hand-Framed Real Mirrorwork', addPrice: 300, desc: 'Reflective circular mirrors with zari outline' },
  { id: 'minimal-zari', name: 'Refined Gold Zari Borders', addPrice: 150, desc: 'Subtle metallic thread detailing on outer rims' },
  { id: 'plain', name: 'Pure Smooth Mulberry Silk', addPrice: 0, desc: 'Sleek, minimalist pure silk wrapping' }
];

const CUSTOM_SET_TYPES = [
  { id: 'pair', name: 'Pair of Handmade Thread Bangles', basePrice: 999, count: 2 },
  { id: 'set4', name: 'Set of 4 Thread Kadas', basePrice: 1699, count: 4 },
  { id: 'stack12', name: 'Festive Stack of 12 Thread Bangles', basePrice: 2299, count: 12 },
  { id: 'bridal24', name: 'Full 24-Piece Bridal Chooda Bangles', basePrice: 3499, count: 24 },
  { id: 'studs', name: 'Pair of Silk Thread Earring Studs', basePrice: 499, count: 2 },
  { id: 'jhumkas', name: 'Pair of Royal Silk Thread Bell Jhumkas', basePrice: 799, count: 2 }
];

// --- Standard Indian Bangle Sizing Chart ---
const SIZE_CHART = [
  { size: '2.2', innerDiameterInches: '2.125"', innerDiameterMm: '54.0 mm', wristCircumferenceCm: '16.5 - 17.5 cm', fit: 'Extra Small' },
  { size: '2.4', innerDiameterInches: '2.250"', innerDiameterMm: '57.2 mm', wristCircumferenceCm: '17.6 - 18.5 cm', fit: 'Small' },
  { size: '2.6', innerDiameterInches: '2.375"', innerDiameterMm: '60.3 mm', wristCircumferenceCm: '18.6 - 19.8 cm', fit: 'Standard / Medium (Most Common)' },
  { size: '2.8', innerDiameterInches: '2.500"', innerDiameterMm: '63.5 mm', wristCircumferenceCm: '19.9 - 21.0 cm', fit: 'Large' },
  { size: '2.10', innerDiameterInches: '2.625"', innerDiameterMm: '66.7 mm', wristCircumferenceCm: '21.1 - 22.5 cm', fit: 'Extra Large' },
];

export default function App() {
  // Navigation & View state
  const [activeTab, setActiveTab] = useState<'shop' | 'customizer' | 'sizeguide' | 'story' | 'tracking' | 'admin'>('shop');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedOccasion, setSelectedOccasion] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'rating'>('featured');

  // Dynamic Products Catalog & Inventory State
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem('subhiksha_products_catalog');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load saved products catalog', e);
    }
    return INITIAL_PRODUCTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('subhiksha_products_catalog', JSON.stringify(products));
    } catch (e) {
      console.error('Failed to save products catalog', e);
    }
  }, [products]);

  const handleUpdateProduct = (updated: Product) => {
    setProducts(prev => prev.map(p => p.id === updated.id ? updated : p));
  };

  const handleAddProduct = (newProduct: Product) => {
    setProducts(prev => [newProduct, ...prev]);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
  };

  const handleBatchUpdateStock = (productIds: string[], delta: number) => {
    setProducts(prev => prev.map(p => productIds.includes(p.id) ? { ...p, stock: Math.max(0, p.stock + delta) } : p));
  };

  const handleResetToDefaultProducts = () => {
    setProducts(INITIAL_PRODUCTS);
    localStorage.removeItem('subhiksha_products_catalog');
  };

  // Interactive Modals & Drawers
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [quickViewSize, setQuickViewSize] = useState<string>('2.6');
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);
  const [isWishlistOpen, setIsWishlistOpen] = useState<boolean>(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState<boolean>(false);
  const [isGoLiveModalOpen, setIsGoLiveModalOpen] = useState<boolean>(false);
  const [linkCopied, setLinkCopied] = useState<boolean>(false);
  const [orderCompleteData, setOrderCompleteData] = useState<any>(null);

  // Google Sheets Orders & Tracking State
  const [isTrackingModalOpen, setIsTrackingModalOpen] = useState<boolean>(false);
  const [trackingModalInitialId, setTrackingModalInitialId] = useState<string>('');
  const [googleUser, setGoogleUser] = useState<User | null>(null);
  const [syncedOrders, setSyncedOrders] = useState<OrderRecord[]>(SAMPLE_ORDERS);
  const [activeSpreadsheetTitle, setActiveSpreadsheetTitle] = useState<string>('');
  const [isGoogleSheetsConnected, setIsGoogleSheetsConnected] = useState<boolean>(false);

  // Initialize Firebase Auth listener for Google Workspace
  useEffect(() => {
    const unsubscribe = initAuth(
      (user) => {
        setGoogleUser(user);
        setIsGoogleSheetsConnected(true);
      },
      () => {
        setGoogleUser(null);
        setIsGoogleSheetsConnected(false);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // User Uploaded Real Workshop Photos (Stored locally per product)
  const [customUploadedImages, setCustomUploadedImages] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('subhiksha_custom_bangle_images');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleUploadBanglePhoto = (productId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      if (result) {
        setCustomUploadedImages(prev => {
          const updated = { ...prev, [productId]: result };
          localStorage.setItem('subhiksha_custom_bangle_images', JSON.stringify(updated));
          return updated;
        });
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetBanglePhoto = (productId: string) => {
    setCustomUploadedImages(prev => {
      const updated = { ...prev };
      delete updated[productId];
      localStorage.setItem('subhiksha_custom_bangle_images', JSON.stringify(updated));
      return updated;
    });
  };

  const handleBatchUploadPhotos = (mapped: Record<string, string>) => {
    setCustomUploadedImages(prev => {
      const updated = { ...prev, ...mapped };
      localStorage.setItem('subhiksha_custom_bangle_images', JSON.stringify(updated));
      return updated;
    });
    setToastNotification(`Synced ${Object.keys(mapped).length} original workshop photo(s) to preview! 1:1 equal sizing applied.`);
    setTimeout(() => setToastNotification(null), 5000);
  };

  const handleResetAllBanglePhotos = () => {
    setCustomUploadedImages({});
    localStorage.removeItem('subhiksha_custom_bangle_images');
    setToastNotification('Reset all product preview photos to default handcrafted visuals.');
    setTimeout(() => setToastNotification(null), 4000);
  };

  const [toastNotification, setToastNotification] = useState<string | null>(null);
  const [isWindowDragActive, setIsWindowDragActive] = useState<boolean>(false);

  // Global Drag-and-Drop listener to easily drop all 4 workshop photos anywhere on preview
  useEffect(() => {
    const handleDragEnter = (e: DragEvent) => {
      e.preventDefault();
      if (e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files')) {
        setIsWindowDragActive(true);
      }
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      // Only set false if left the window
      if (e.clientX <= 0 || e.clientY <= 0 || e.clientX >= window.innerWidth || e.clientY >= window.innerHeight) {
        setIsWindowDragActive(false);
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsWindowDragActive(false);
      if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
        const fileList = e.dataTransfer.files;
        const fileArray = Array.from(fileList);
        const mapped: Record<string, string> = {};
        let processed = 0;

        fileArray.forEach((file) => {
          const lower = file.name.toLowerCase();
          let matched = ORIGINAL_TARGET_PRODUCTS.find(t => 
            t.hintKeywords.some(k => lower.includes(k))
          );
          if (!matched) {
            const unmatched = ORIGINAL_TARGET_PRODUCTS.find(t => !mapped[t.id]);
            if (unmatched) matched = unmatched;
          }

          if (matched) {
            const reader = new FileReader();
            reader.onload = (ev) => {
              const res = ev.target?.result as string;
              if (res) mapped[matched!.id] = res;
              processed++;
              if (processed === fileArray.length) {
                handleBatchUploadPhotos(mapped);
              }
            };
            reader.readAsDataURL(file);
          } else {
            processed++;
          }
        });
      }
    };

    window.addEventListener('dragenter', handleDragEnter);
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('dragleave', handleDragLeave);
    window.addEventListener('drop', handleDrop);

    return () => {
      window.removeEventListener('dragenter', handleDragEnter);
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('dragleave', handleDragLeave);
      window.removeEventListener('drop', handleDrop);
    };
  }, []);

  // Cart & Wishlist Persisted State
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('subhiksha_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('subhiksha_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Custom Bangle Studio State
  const [customSize, setCustomSize] = useState<string>('2.6');
  const [customColor, setCustomColor] = useState(CUSTOM_COLORS[0]);
  const [customEmbellishment, setCustomEmbellishment] = useState(CUSTOM_EMBELLISHMENTS[0]);
  const [customSetType, setCustomSetType] = useState(CUSTOM_SET_TYPES[3]); // Default to Bridal 24
  const [customNotes, setCustomNotes] = useState<string>('');

  // Interactive Size Finder State
  const [measuredCircumference, setMeasuredCircumference] = useState<number>(19.0);

  // Save Cart & Wishlist
  useEffect(() => {
    localStorage.setItem('subhiksha_cart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('subhiksha_wishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      const matchesOccasion = selectedOccasion === 'All' || product.occasion.toLowerCase().includes(selectedOccasion.toLowerCase());
      const matchesSearch = searchQuery === '' || 
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.materials.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesOccasion && matchesSearch;
    }).sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating') return b.rating - a.rating;
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [products, selectedCategory, selectedOccasion, searchQuery, sortBy]);

  // Cart Calculations
  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  const shippingCost = cartSubtotal >= 1999 || cartSubtotal === 0 ? 0 : 150;
  const totalAmount = Math.max(0, cartSubtotal + shippingCost);

  // Calculated Custom Price
  const customPrice = customSetType.basePrice + customEmbellishment.addPrice;

  // Add Product to Cart
  const handleAddToCart = (product: Product, size: string) => {
    const itemImage = customUploadedImages[product.id] || product.image;
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.productId === product.id && item.size === size);
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += 1;
        return next;
      }
      return [
        ...prev,
        {
          id: `${product.id}-${size}-${Date.now()}`,
          productId: product.id,
          name: product.name,
          size: size,
          price: product.price,
          image: itemImage,
          quantity: 1,
          isCustom: false
        }
      ];
    });
    setIsCartOpen(true);
  };

  // Add Custom Bangle to Cart
  const handleAddCustomToCart = () => {
    const customBangleImage = getBangleImageForColor(customColor.name);
    const customItem: CartItem = {
      id: `custom-${Date.now()}`,
      productId: 'custom-bangle-studio',
      name: `Bespoke Silk Bangle (${customColor.name})`,
      size: customSize,
      price: customPrice,
      image: customBangleImage,
      quantity: 1,
      isCustom: true,
      customDetails: {
        colorName: customColor.name,
        embellishment: customEmbellishment.name,
        pieces: customSetType.name
      }
    };
    setCart(prev => [...prev, customItem]);
    setIsCartOpen(true);
  };

  // Update Cart Quantity
  const handleUpdateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === itemId) {
        const newQty = item.quantity + delta;
        return newQty > 0 ? { ...item, quantity: newQty } : null;
      }
      return item;
    }).filter(Boolean) as CartItem[]);
  };

  // Wishlist toggle
  const toggleWishlist = (productId: string) => {
    setWishlist(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  // Format WhatsApp Order Link
  const getWhatsAppOrderUrl = (orderSummaryText?: string) => {
    const phoneNumber = "919080789855"; // Subhiksha Homemade Jewellery artisan line
    let message = "";
    if (orderSummaryText) {
      message = orderSummaryText;
    } else if (cart.length > 0) {
      message = `Hello Subhiksha Homemade Jewellery,\n\nI would like to place an order for the following handcrafted pieces:\n\n` +
        cart.map((item, idx) => 
          `${idx + 1}. ${item.name}\n   • Size: ${item.size}\n   • Qty: ${item.quantity}\n   • Price: ₹${item.price * item.quantity}` +
          (item.isCustom && item.customDetails ? `\n   • Custom Specs: ${item.customDetails.colorName}, ${item.customDetails.embellishment}, ${item.customDetails.pieces}` : '')
        ).join('\n\n') +
        `\n\nTotal Payable: ₹${totalAmount}\n(Including express shipping & taxes).\n\nPlease share confirmation and payment details!`;
    } else {
      message = "Hello Subhiksha Homemade Jewellery! I am interested in custom bridal silk thread bangles matching my lehenga. Could you please assist me?";
    }
    return `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
  };

  // Size Recommendation Helper
  const recommendedSize = useMemo(() => {
    if (measuredCircumference < 17.5) return SIZE_CHART[0];
    if (measuredCircumference < 18.5) return SIZE_CHART[1];
    if (measuredCircumference < 20.0) return SIZE_CHART[2];
    if (measuredCircumference < 21.5) return SIZE_CHART[3];
    return SIZE_CHART[4];
  }, [measuredCircumference]);

  return (
    <div className="min-h-screen flex flex-col bg-[#FAF7F2] text-[#22201E] relative">
      {/* Toast Notification Alert */}
      {toastNotification && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-[#114B3E] text-white px-5 py-3 rounded-2xl shadow-2xl border border-[#C59B27] flex items-center gap-3 text-xs font-semibold animate-fadeIn max-w-md w-full">
          <Camera className="w-4 h-4 text-[#E8D38B] shrink-0" />
          <span className="flex-1">{toastNotification}</span>
          <button 
            onClick={() => setToastNotification(null)}
            className="text-white/60 hover:text-white p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Global Drag-and-Drop Overlay for 4 Workshop Photos */}
      {isWindowDragActive && (
        <div 
          className="fixed inset-0 z-50 bg-[#114B3E]/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-white text-center animate-fadeIn border-4 border-dashed border-[#E8D38B]"
        >
          <div className="w-20 h-20 rounded-full bg-white/10 border-2 border-[#E8D38B] flex items-center justify-center text-[#E8D38B] mb-4 animate-bounce">
            <Camera className="w-10 h-10" />
          </div>
          <h2 className="font-serif-luxury text-2xl sm:text-3xl font-bold mb-2">
            Drop Your 4 Workshop Photos Here
          </h2>
          <p className="text-sm text-[#F4EFE6] max-w-lg mb-6 leading-relaxed">
            Drop <code>blue pink.webp</code>, <code>green.webp</code>, <code>purple.webp</code>, and <code>Red (1).webp</code>. They will be auto-matched to their products and applied to the preview with strict 1:1 equal square dimensions.
          </p>
          <div className="flex items-center gap-3 text-xs bg-black/40 px-5 py-2.5 rounded-full border border-white/20">
            <span>🔴 Red Chooda</span>
            <span>•</span>
            <span>🟢 Emerald Kada</span>
            <span>•</span>
            <span>🔵 Blue & Pink</span>
            <span>•</span>
            <span>🟣 Royal Purple</span>
          </div>
        </div>
      )}



      {/* 2. Main Luxury Header */}
      <header className="sticky top-0 z-40 bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8D8C8] shadow-xs transition-all">
        {/* Top Masthead: Brand Identity Exactly Centered Horizontally */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-3.5 pb-2.5">
          <div className="relative flex items-center justify-between">
            {/* Left Quick Action Wing */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-start">
              <a
                href={getWhatsAppOrderUrl()}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#25D366]/15 text-[#075E54] hover:bg-[#25D366] hover:text-white transition shadow-sm border border-[#25D366]/30"
                title="Chat with Subhiksha Homemade Jewellery on WhatsApp (+91 90807 89855)"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </a>

              <button
                onClick={() => {
                  setTrackingModalInitialId('');
                  setIsTrackingModalOpen(true);
                }}
                className="hidden md:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#FAF7F2] border border-[#E8D8C8] hover:border-[#9A7416] text-[#1A1816] transition shadow-sm cursor-pointer"
                title="Track Order by ID or Phone"
              >
                <Truck className="w-3.5 h-3.5 text-[#9A7416]" />
                <span>Track Order</span>
              </button>
            </div>

            {/* Exactly Centered Brand Masthead */}
            <div 
              onClick={() => setActiveTab('shop')} 
              className="cursor-pointer group flex flex-col items-center justify-center text-center shrink-0 px-2 sm:px-4 z-10"
            >
              <h1 className="text-xl sm:text-2xl md:text-3xl tracking-wide font-serif-luxury font-bold text-[#1A1816] group-hover:text-[#9A7416] transition leading-tight">
                Subhiksha Homemade Jewellery
              </h1>
              <p className="text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-[0.24em] text-[#8C7A6B] font-medium mt-1">
                Handcrafted Silk Thread Bangles &amp; Bridal Sets
              </p>
            </div>

            {/* Right Action Icons & Utilities Wing */}
            <div className="flex items-center gap-2 sm:gap-3 flex-1 justify-end">
              {/* Admin Portal Button */}
              <button
                onClick={() => setActiveTab('admin')}
                className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border transition shadow-sm cursor-pointer ${
                  activeTab === 'admin'
                    ? 'bg-[#114B3E] text-white border-[#114B3E]'
                    : 'bg-[#FAF7F2] border-[#E8D8C8] hover:border-[#9A7416] text-[#1A1816]'
                }`}
                title="Open Admin Dashboard & Stock Editor"
              >
                <Boxes className="w-3.5 h-3.5 text-[#9A7416]" />
                <span className="hidden xl:inline">Admin Dashboard</span>
                <span className="xl:hidden">Admin</span>
              </button>

              {/* Live Website Guide Trigger */}
              <button
                onClick={() => setIsGoLiveModalOpen(true)}
                className="hidden lg:flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#114B3E] text-white hover:bg-[#0D382E] transition shadow-sm cursor-pointer"
                title="How to take website live & connect domain"
              >
                <Globe className="w-3.5 h-3.5 text-[#E8D38B]" />
                <span>Go Live</span>
              </button>

              {/* Wishlist Button */}
              <button
                onClick={() => setIsWishlistOpen(true)}
                className="relative p-2 text-[#443E38] hover:text-[#C59B27] transition cursor-pointer"
                title="View Wishlist"
              >
                <Heart className="w-5 h-5" />
                {wishlist.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#8B1824] text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                    {wishlist.length}
                  </span>
                )}
              </button>

              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2 text-[#443E38] hover:text-[#C59B27] transition cursor-pointer"
                title="View Cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute top-1 right-1 w-4 h-4 bg-[#C59B27] text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Desktop Navigation Links Tier - Clean Centered Bar */}
        <div className="hidden md:flex border-t border-[#E8D8C8]/60 bg-[#FAF7F2]/80">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-center space-x-7 text-xs font-semibold uppercase tracking-widest text-[#443E38]">
            <button
              onClick={() => { setActiveTab('shop'); setSelectedCategory('All'); }}
              className={`transition hover:text-[#9A7416] pb-1 border-b-2 ${activeTab === 'shop' && selectedCategory === 'All' ? 'border-[#C59B27] text-[#9A7416]' : 'border-transparent'}`}
            >
              All Bangles
            </button>
            <button
              onClick={() => { setActiveTab('shop'); setSelectedCategory('Bridal'); }}
              className={`transition hover:text-[#9A7416] pb-1 border-b-2 ${activeTab === 'shop' && selectedCategory === 'Bridal' ? 'border-[#C59B27] text-[#9A7416]' : 'border-transparent'}`}
            >
              Bridal Choodas
            </button>
            <button
              onClick={() => { setActiveTab('shop'); setSelectedCategory('Kada'); }}
              className={`transition hover:text-[#9A7416] pb-1 border-b-2 ${activeTab === 'shop' && selectedCategory === 'Kada' ? 'border-[#C59B27] text-[#9A7416]' : 'border-transparent'}`}
            >
              Royal Kadas
            </button>
            <button
              onClick={() => setActiveTab('customizer')}
              className={`flex items-center gap-1.5 transition hover:text-[#9A7416] pb-1 border-b-2 ${activeTab === 'customizer' ? 'border-[#C59B27] text-[#9A7416]' : 'border-transparent'}`}
            >
              <Palette className="w-3.5 h-3.5 text-[#C59B27]" />
              Bespoke Studio
            </button>
            <button
              onClick={() => setActiveTab('sizeguide')}
              className={`transition hover:text-[#9A7416] pb-1 border-b-2 ${activeTab === 'sizeguide' ? 'border-[#C59B27] text-[#9A7416]' : 'border-transparent'}`}
            >
              Size Guide
            </button>
            <button
              onClick={() => setActiveTab('story')}
              className={`transition hover:text-[#9A7416] pb-1 border-b-2 ${activeTab === 'story' ? 'border-[#C59B27] text-[#9A7416]' : 'border-transparent'}`}
            >
              Our Craft
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`flex items-center gap-1.5 transition hover:text-[#9A7416] pb-1 border-b-2 ${activeTab === 'tracking' ? 'border-[#C59B27] text-[#9A7416]' : 'border-transparent'}`}
              title="Google Sheets Orders & Tracking Hub"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#114B3E]" />
              <span>Sheets &amp; Tracking</span>
              {isGoogleSheetsConnected && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('admin')}
              className={`flex items-center gap-1.5 transition hover:text-[#9A7416] pb-1 border-b-2 ${activeTab === 'admin' ? 'border-[#C59B27] text-[#9A7416]' : 'border-transparent'}`}
              title="Artisan Product & Inventory Admin Dashboard"
            >
              <Boxes className="w-3.5 h-3.5 text-[#114B3E]" />
              <span>Admin &amp; Stock</span>
              {products.some(p => p.stock <= 10) && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" title="Items low on stock" />
              )}
            </button>
          </nav>
        </div>

        {/* Mobile Navigation Strip */}
        <div className="md:hidden flex items-center justify-around py-2.5 border-t border-[#E8D8C8] bg-[#FAF7F2] text-[11px] font-semibold uppercase tracking-wider text-[#68625B]">
          <button 
            onClick={() => { setActiveTab('shop'); setSelectedCategory('All'); }}
            className={activeTab === 'shop' ? 'text-[#9A7416] font-bold' : ''}
          >
            Bangles
          </button>
          <button 
            onClick={() => setActiveTab('customizer')}
            className={`flex items-center gap-1 ${activeTab === 'customizer' ? 'text-[#9A7416] font-bold' : ''}`}
          >
            <Palette className="w-3 h-3" />
            Studio
          </button>
          <button 
            onClick={() => {
              setTrackingModalInitialId('');
              setIsTrackingModalOpen(true);
            }}
            className="flex items-center gap-1 text-[#114B3E] font-bold"
          >
            <Truck className="w-3 h-3" />
            Track
          </button>
          <button 
            onClick={() => setActiveTab('tracking')}
            className={`flex items-center gap-1 ${activeTab === 'tracking' ? 'text-[#9A7416] font-bold' : ''}`}
          >
            <FileSpreadsheet className="w-3 h-3" />
            Sheets
          </button>
          <button 
            onClick={() => setActiveTab('admin')}
            className={`flex items-center gap-1 ${activeTab === 'admin' ? 'text-[#9A7416] font-bold' : ''}`}
          >
            <Boxes className="w-3 h-3" />
            Admin
          </button>
          <button 
            onClick={() => setIsGoLiveModalOpen(true)}
            className="flex items-center gap-1 text-[#114B3E]"
          >
            <Globe className="w-3 h-3" />
            Live
          </button>
        </div>
      </header>

      {/* 3. Conditional Content Sections */}
      {activeTab === 'shop' && (
        <main className="flex-1">
          {/* Hero Banner Section */}
          <section className="relative overflow-hidden bg-gradient-to-b from-[#F4EFE6] to-[#FAF7F2] border-b border-[#E8D8C8] py-14 sm:py-20 px-4">
            <div className="max-w-6xl mx-auto text-center relative z-10">
              <span className="text-xs uppercase font-semibold tracking-[0.3em] text-[#9A7416] block mb-3">
                100% Handcrafted Silk Thread Bangles
              </span>
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-serif-luxury font-bold text-[#1A1816] mb-4 leading-tight">
                Handmade Silk Thread Bangles & Royal Bridal Choodas
              </h1>
              <p className="max-w-2xl mx-auto text-sm sm:text-base text-[#68625B] font-light leading-relaxed mb-8">
                Every piece is individually hand-wrapped in pure lustrous mulberry silk thread, adorned with uncut jadau Kundan stones, micro-seed pearls, and authentic zardozi embroidery. Tailored exclusively to your bangle dimensions and bridal attire.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4">
                <button
                  onClick={() => {
                    const el = document.getElementById('catalog-grid');
                    el?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="px-6 py-3 rounded-full bg-[#114B3E] text-white hover:bg-[#0D382E] text-xs font-semibold uppercase tracking-wider shadow-lg shadow-[#114B3E]/20 transition flex items-center gap-2"
                >
                  <span>Explore Bangles</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveTab('customizer')}
                  className="px-6 py-3 rounded-full bg-white text-[#9A7416] border border-[#C59B27] hover:bg-[#FAF7F2] text-xs font-semibold uppercase tracking-wider shadow-sm transition flex items-center gap-2"
                >
                  <Palette className="w-4 h-4 text-[#C59B27]" />
                  <span>Customize Your Bangles</span>
                </button>
                <button
                  onClick={() => setActiveTab('sizeguide')}
                  className="px-6 py-3 rounded-full bg-transparent hover:bg-black/5 text-[#443E38] text-xs font-semibold uppercase tracking-wider transition flex items-center gap-1.5"
                >
                  <Ruler className="w-3.5 h-3.5 text-[#9A7416]" />
                  <span>Size Finder</span>
                </button>
              </div>
            </div>
          </section>

          {/* Catalog Filter & Controls Bar */}
          <section id="catalog-grid" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-[#E8D8C8]">
              {/* Category Filter Buttons */}
              <div className="flex items-center flex-wrap gap-1.5 sm:gap-2">
                {[
                  { id: 'All', label: 'All Handmade Bangles' },
                  { id: 'Bridal', label: 'Bridal Chooda Bangles' },
                  { id: 'Kada', label: 'Royal Kada Bangles' },
                  { id: 'Festive', label: 'Festive Bangle Stacks' },
                  { id: 'Kundan', label: 'Kundan & Mirror Bangles' }
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition ${
                      selectedCategory === cat.id
                        ? 'bg-[#1A1816] text-[#FAF7F2] shadow-sm'
                        : 'bg-white border border-[#E8D8C8] text-[#68625B] hover:border-[#9A7416]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Search & Sort Controls */}
              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-3.5 h-3.5 text-[#8C7A6B] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search kundan, emerald, bridal..."
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E8D8C8] rounded-full text-xs text-[#22201E] placeholder-[#8C7A6B] focus:outline-none focus:border-[#C59B27]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C7A6B] hover:text-[#22201E]"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-white border border-[#E8D8C8] text-[#443E38] text-xs rounded-full px-3 py-1.5 focus:outline-none focus:border-[#C59B27] cursor-pointer"
                >
                  <option value="featured">Featured First</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating">Highest Rated</option>
                </select>
              </div>
            </div>

            {/* Results Counter */}
            <div className="py-4 flex items-center justify-between text-xs text-[#8C7A6B]">
              <span>Showing {filteredProducts.length} handcrafted creation{filteredProducts.length === 1 ? '' : 's'}</span>
              <span className="italic">Strict 1:1 Equal Square Dimensions on All Products</span>
            </div>

            {/* Original Workshop Photos Manager & 1:1 Equal Sizing Control */}
            <div id="workshop-photos-section">
              <OriginalPhotosManager
                customUploadedImages={customUploadedImages}
                onBatchUpload={handleBatchUploadPhotos}
                onSingleUpload={handleUploadBanglePhoto}
                onResetPhoto={handleResetBanglePhoto}
                onResetAll={handleResetAllBanglePhotos}
                products={products}
              />
            </div>

            {/* Product Cards Grid - All Cards Strict Equal Dimensions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 items-stretch">
              {filteredProducts.map(product => {
                const isSaved = wishlist.includes(product.id);
                const displayImage = customUploadedImages[product.id] || product.image;
                const isCustomPhoto = !!customUploadedImages[product.id];
                return (
                  <div
                    key={product.id}
                    className="group bg-white rounded-2xl border border-[#E8D8C8] overflow-hidden flex flex-col justify-between shadow-sm hover:shadow-xl transition-all duration-300 h-full"
                  >
                    <div>
                      {/* Image Container with Badges - Strict 1:1 Equal Size */}
                      <div 
                        className="relative aspect-square w-full overflow-hidden bg-[#FAF7F2] cursor-pointer flex items-center justify-center shrink-0" 
                        style={{ aspectRatio: '1 / 1' }}
                        onClick={() => { setQuickViewProduct(product); setQuickViewSize(product.sizes[1] || '2.6'); }}
                      >
                        <img
                          src={displayImage}
                          alt={product.name}
                          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          style={{ aspectRatio: '1 / 1' }}
                        />
                        
                        {/* Status Badges */}
                        <div className="absolute top-3 left-3 flex flex-col gap-1 z-10 pointer-events-none">
                          {product.stock <= 0 && (
                            <span className="bg-red-700 text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                              Out of Stock
                            </span>
                          )}
                          {product.stock > 0 && product.stock <= 5 && (
                            <span className="bg-amber-700 text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                              Only {product.stock} Left
                            </span>
                          )}
                          {product.isBestSeller && (
                            <span className="bg-[#114B3E] text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                              Best Seller
                            </span>
                          )}
                          {product.isNew && (
                            <span className="bg-[#8B1824] text-white text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm">
                              New Arrival
                            </span>
                          )}
                          {isCustomPhoto && (
                            <span className="bg-[#9A7416] text-white text-[9px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm flex items-center gap-1">
                              <Camera className="w-2.5 h-2.5" /> Original Photo
                            </span>
                          )}
                        </div>

                        {/* Top Right Action Controls */}
                        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setActiveTab('admin')}
                            className="p-2 rounded-full bg-white/90 backdrop-blur hover:bg-[#114B3E] hover:text-white text-[#443E38] shadow-sm transition"
                            title="Edit this product in Artisan Admin"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <label
                            className="p-2 rounded-full bg-white/90 backdrop-blur hover:bg-white text-[#443E38] hover:text-[#9A7416] shadow-sm transition cursor-pointer"
                            title="Upload/Replace Original Photo for this Bangle (1:1 Ratio)"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadBanglePhoto(product.id, file);
                              }}
                            />
                          </label>

                          {isCustomPhoto && (
                            <button
                              onClick={() => handleResetBanglePhoto(product.id)}
                              className="p-2 rounded-full bg-white/90 backdrop-blur hover:bg-white text-slate-500 hover:text-red-600 shadow-sm transition"
                              title="Reset to handmade silk thread image"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          <button
                            onClick={() => toggleWishlist(product.id)}
                            className="p-2 rounded-full bg-white/90 backdrop-blur hover:bg-white text-[#443E38] hover:text-[#8B1824] shadow-sm transition"
                            title={isSaved ? "Remove from Wishlist" : "Save to Wishlist"}
                          >
                            <Heart className={`w-4 h-4 ${isSaved ? 'fill-[#8B1824] text-[#8B1824]' : ''}`} />
                          </button>
                        </div>

                        {/* Quick View Button overlay on hover */}
                        <div className="absolute inset-x-0 bottom-3 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => { e.stopPropagation(); setQuickViewProduct(product); setQuickViewSize(product.sizes[1] || '2.6'); }}
                            className="px-4 py-1.5 rounded-full bg-[#1A1816]/90 backdrop-blur text-white text-xs font-medium flex items-center gap-1.5 hover:bg-[#1A1816] shadow-lg transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Quick View</span>
                          </button>
                        </div>
                      </div>

                      {/* Content Section - Strict Equal Height Spacing */}
                      <div className="p-4 flex flex-col justify-between">
                        <div>
                          {/* Rating and Color indicator */}
                          <div className="flex items-center justify-between text-xs mb-1.5">
                            <div className="flex items-center text-amber-500 gap-1 font-medium">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span>{product.rating}</span>
                              <span className="text-[#8C7A6B] font-normal">({product.reviewCount})</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-[#68625B]">
                              <span 
                                className="w-2.5 h-2.5 rounded-full border border-black/10 inline-block" 
                                style={{ backgroundColor: product.colorHex }}
                              />
                              <span>{product.primaryColor}</span>
                            </div>
                          </div>

                          {/* Title & Subtitle - Equal Fixed Heights */}
                          <h3 
                            onClick={() => { setQuickViewProduct(product); setQuickViewSize(product.sizes[1] || '2.6'); }}
                            className="font-serif-luxury font-bold text-base sm:text-lg text-[#1A1816] hover:text-[#9A7416] transition cursor-pointer line-clamp-2 min-h-[3rem]"
                          >
                            {product.name}
                          </h3>
                          <p className="text-xs text-[#8C7A6B] font-light line-clamp-2 mt-1 mb-2 leading-relaxed min-h-[2.25rem]">
                            {product.subtitle}
                          </p>

                          <div className="text-[11px] text-[#68625B] flex items-center gap-2 mb-3 h-5">
                            <span className="font-medium text-[#1A1816]">{product.pieces}</span>
                            <span>·</span>
                            <span>Sizes: {product.sizes.join(', ')}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pricing and Action - Pinned to Bottom */}
                    <div className="p-4 pt-3 border-t border-[#F0E6DA] flex items-center justify-between mt-auto">
                      <div>
                        <div className="flex items-baseline gap-2">
                          <span className="text-base font-bold text-[#1A1816]">₹{product.price.toLocaleString()}</span>
                          <span className="text-xs text-[#8C7A6B] line-through">₹{product.originalPrice.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-700 font-semibold">
                            {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% Off
                          </span>
                          {product.stock <= 0 ? (
                            <span className="text-[10px] text-red-600 font-bold">· Sold Out</span>
                          ) : (
                            <span className="text-[10px] text-[#8C7A6B]">· {product.stock} in stock</span>
                          )}
                        </div>
                      </div>

                      {product.stock <= 0 ? (
                        <button
                          disabled
                          className="px-3.5 py-2 rounded-xl bg-slate-200 text-slate-500 text-xs font-semibold cursor-not-allowed shadow-none"
                        >
                          Sold Out
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(product, product.sizes[1] || '2.6')}
                          className="px-3.5 py-2 rounded-xl bg-[#1A1816] hover:bg-[#9A7416] text-white text-xs font-semibold transition flex items-center gap-1.5 shadow"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>Add</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Customizer Callout Card */}
            <div className="mt-16 bg-gradient-to-r from-[#114B3E] via-[#155A4B] to-[#114B3E] text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-xl">
              <div className="relative z-10 max-w-2xl">
                <span className="text-xs font-semibold tracking-[0.25em] uppercase text-[#E8D38B] block mb-2">
                  Bespoke Bridal Tailoring
                </span>
                <h2 className="text-2xl sm:text-4xl font-serif-luxury font-bold mb-3">
                  Have a specific Bridal Lehenga color to match?
                </h2>
                <p className="text-sm text-emerald-100 font-light leading-relaxed mb-6">
                  Our master artisans hand-dye mulberry silk thread and calibrate Kundan accents to match your exact designer outfit swatch. From pastel mints to royal rani fuchsia.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button
                    onClick={() => setActiveTab('customizer')}
                    className="px-6 py-2.5 rounded-full bg-[#E8D38B] hover:bg-[#F2E3A8] text-[#114B3E] text-xs font-bold uppercase tracking-wider transition shadow"
                  >
                    Open Custom Studio
                  </button>
                  <a
                    href={getWhatsAppOrderUrl("Hello Subhiksha Homemade Jewellery, I would like to send photos of my bridal dress to create custom matching silk bangles!")}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold tracking-wider transition flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Send Lehenga Photo on WhatsApp (9080789855)</span>
                  </a>
                </div>
              </div>

              {/* Decorative accent icon */}
              <div className="absolute right-4 -bottom-10 opacity-10 pointer-events-none hidden lg:block">
                <Scissors className="w-72 h-72 text-white" />
              </div>
            </div>
          </section>
        </main>
      )}

      {/* 4. Bespoke Silk Bangle Customizer Studio */}
      {activeTab === 'customizer' && (
        <section className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <span className="text-xs uppercase font-semibold tracking-[0.3em] text-[#9A7416] block mb-2">
              Interactive Artisan Studio
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif-luxury font-bold text-[#1A1816] mb-3">
              Design Your Bespoke Silk Thread Bangles
            </h1>
            <p className="text-sm text-[#68625B] font-light">
              Select your bangle size, pure silk thread shade, kundan embellishment style, and bundle quantity. Watch your custom set come to life in real-time.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Interactive Visual Simulation */}
            <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-8 border border-[#E8D8C8] shadow-lg sticky top-24">
              <div className="aspect-square rounded-2xl bg-[#FAF7F2] border border-[#E8D8C8] flex flex-col items-center justify-center relative overflow-hidden">
                <SilkThreadBangleVisual
                  config={{
                    primaryColor: customColor.hex,
                    embellishment: customEmbellishment.id as any,
                    hasLatkan: customEmbellishment.id === 'latkan',
                    stackCount: customSetType.count
                  }}
                  sizeLabel={customSize}
                  className="w-full h-full"
                />

                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#E8D8C8] text-[10px] font-semibold text-[#1A1816] flex items-center gap-1.5 shadow-sm">
                  <span className="w-2.5 h-2.5 rounded-full border border-black/15 inline-block" style={{ backgroundColor: customColor.hex }} />
                  <span>{customColor.name}</span>
                </div>

                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full border border-[#E8D8C8] text-[10px] font-semibold text-[#8C7A6B] shadow-sm">
                  {customSetType.name}
                </div>
              </div>

              <div className="mt-6 text-center">
                <span className="text-xs uppercase tracking-wider text-[#8C7A6B]">Total Custom Price</span>
                <div className="text-3xl font-bold font-serif-luxury text-[#1A1816] mt-0.5">
                  ₹{customPrice.toLocaleString()}
                </div>
                <span className="text-[11px] text-emerald-700 font-medium">
                  Includes Handcrafting, Velvet Box & Free Express Shipping
                </span>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex flex-col gap-3">
                <button
                  onClick={handleAddCustomToCart}
                  className="w-full py-3.5 rounded-2xl bg-[#1A1816] hover:bg-[#9A7416] text-white text-xs font-semibold uppercase tracking-wider shadow-lg transition flex items-center justify-center gap-2"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Add Bespoke Set to Cart (₹{customPrice})</span>
                </button>

                <a
                  href={getWhatsAppOrderUrl(
                    `Hello Subhiksha Homemade Jewellery! I customized a bespoke silk thread bangle set on your studio:\n\n• Size: ${customSize}\n• Silk Color: ${customColor.name}\n• Embellishment: ${customEmbellishment.name}\n• Quantity: ${customSetType.name}\n• Total Price: ₹${customPrice}\n${customNotes ? `• Custom Request: ${customNotes}` : ''}\n\nCan you confirm lead time and take my order?`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-2xl bg-[#25D366]/15 hover:bg-[#25D366] text-[#075E54] hover:text-white border border-[#25D366]/30 text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>Order Directly via WhatsApp (9080789855)</span>
                </a>
              </div>
            </div>

            {/* Right: Step-by-Step Customization Controls */}
            <div className="lg:col-span-7 space-y-6">
              {/* Step 1: Bangle Size */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8D8C8] shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-[#9A7416]">Step 1 of 4</span>
                    <h3 className="font-serif-luxury font-bold text-xl text-[#1A1816]">Choose Your Bangle Size</h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('sizeguide')}
                    className="text-xs text-[#9A7416] underline hover:text-[#1A1816] flex items-center gap-1"
                  >
                    <Ruler className="w-3.5 h-3.5" />
                    How to measure?
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                  {SIZE_CHART.map((item) => (
                    <button
                      key={item.size}
                      onClick={() => setCustomSize(item.size)}
                      className={`p-3 rounded-2xl border text-center transition ${
                        customSize === item.size
                          ? 'border-[#C59B27] bg-[#FAF7F2] ring-2 ring-[#C59B27]/20 shadow-sm'
                          : 'border-[#E8D8C8] hover:border-[#9A7416] bg-white'
                      }`}
                    >
                      <span className="text-lg font-bold font-serif-luxury text-[#1A1816] block">{item.size}</span>
                      <span className="text-[10px] text-[#8C7A6B] block">{item.innerDiameterMm}</span>
                      <span className="text-[9px] text-[#68625B] block truncate mt-1">{item.fit.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Silk Thread Color */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8D8C8] shadow-sm">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#9A7416]">Step 2 of 4</span>
                <h3 className="font-serif-luxury font-bold text-xl text-[#1A1816] mb-1">Select Silk Thread Color</h3>
                <p className="text-xs text-[#8C7A6B] mb-4">Woven with 100% fine double-ply Mulberry silk yarn</p>

                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {CUSTOM_COLORS.map((col) => (
                    <button
                      key={col.name}
                      onClick={() => setCustomColor(col)}
                      className={`p-2.5 rounded-2xl border flex items-center gap-2.5 text-left transition ${
                        customColor.name === col.name
                          ? 'border-[#C59B27] bg-[#FAF7F2] ring-2 ring-[#C59B27]/20 shadow-sm'
                          : 'border-[#E8D8C8] hover:border-[#9A7416] bg-white'
                      }`}
                    >
                      <span
                        className="w-6 h-6 rounded-full border border-black/10 shrink-0 shadow-inner"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span className="text-xs font-medium text-[#22201E] line-clamp-1">{col.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Embellishment Style */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8D8C8] shadow-sm">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#9A7416]">Step 3 of 4</span>
                <h3 className="font-serif-luxury font-bold text-xl text-[#1A1816] mb-1">Choose Border & Embellishment</h3>
                <p className="text-xs text-[#8C7A6B] mb-4">Hand-applied by traditional Indian stone setters</p>

                <div className="space-y-2.5">
                  {CUSTOM_EMBELLISHMENTS.map((emb) => (
                    <div
                      key={emb.id}
                      onClick={() => setCustomEmbellishment(emb)}
                      className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                        customEmbellishment.id === emb.id
                          ? 'border-[#C59B27] bg-[#FAF7F2] ring-2 ring-[#C59B27]/20 shadow-sm'
                          : 'border-[#E8D8C8] hover:border-[#9A7416] bg-white'
                      }`}
                    >
                      <div>
                        <h4 className="text-xs font-bold text-[#1A1816]">{emb.name}</h4>
                        <p className="text-[11px] text-[#8C7A6B]">{emb.desc}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-[#9A7416]">
                          {emb.addPrice === 0 ? 'Included' : `+₹${emb.addPrice}`}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 4: Set Type / Quantity */}
              <div className="bg-white rounded-3xl p-6 border border-[#E8D8C8] shadow-sm">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#9A7416]">Step 4 of 4</span>
                <h3 className="font-serif-luxury font-bold text-xl text-[#1A1816] mb-1">Select Bundle Size</h3>
                <p className="text-xs text-[#8C7A6B] mb-4">From single accent pairs to full 24-piece wedding choodas</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {CUSTOM_SET_TYPES.map((type) => (
                    <div
                      key={type.id}
                      onClick={() => setCustomSetType(type)}
                      className={`p-3.5 rounded-2xl border cursor-pointer transition ${
                        customSetType.id === type.id
                          ? 'border-[#C59B27] bg-[#FAF7F2] ring-2 ring-[#C59B27]/20 shadow-sm'
                          : 'border-[#E8D8C8] hover:border-[#9A7416] bg-white'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-xs font-bold text-[#1A1816]">{type.name}</h4>
                        <span className="text-xs font-bold text-[#114B3E]">₹{type.basePrice}</span>
                      </div>
                      <span className="text-[11px] text-[#8C7A6B]">{type.count} Handcrafted Bangles</span>
                    </div>
                  ))}
                </div>

                {/* Optional Custom Note */}
                <div className="mt-4 pt-4 border-t border-[#E8D8C8]">
                  <label className="block text-xs font-semibold text-[#1A1816] mb-1.5">
                    Special Custom Requests (Optional)
                  </label>
                  <input
                    type="text"
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    placeholder="e.g., Mix with Rani Pink for half the set, or add extra latkans..."
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8D8C8] text-xs text-[#22201E] placeholder-[#8C7A6B] focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* 5. Comprehensive Bangle Sizing Guide & Calculator */}
      {activeTab === 'sizeguide' && (
        <section className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs uppercase font-semibold tracking-[0.3em] text-[#9A7416] block mb-2">
              Flawless Wrist Fit
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif-luxury font-bold text-[#1A1816] mb-3">
              Standard Indian Bangle Size Guide
            </h1>
            <p className="text-sm text-[#68625B] font-light">
              Indian bangle sizing indicates diameter in inches and fraction eighths (e.g. 2.6 means 2 inches and 6/8ths, or 2-3/4 inches). Use our interactive calculator below to find your ideal fit.
            </p>
          </div>

          {/* Interactive Calculator Slider */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E8D8C8] shadow-md mb-12">
            <h3 className="font-serif-luxury font-bold text-xl text-[#1A1816] mb-2 text-center">
              Interactive Knuckle Circumference Calculator
            </h3>
            <p className="text-xs text-[#8C7A6B] text-center mb-6 max-w-lg mx-auto">
              Fold your hand like putting on a bangle (thumb touching pinky finger). Measure around the widest part with a soft measuring tape in centimeters:
            </p>

            <div className="max-w-md mx-auto space-y-4">
              <div className="flex items-center justify-between text-xs font-semibold text-[#1A1816]">
                <span>16.0 cm (Smallest)</span>
                <span className="text-base text-[#9A7416] font-bold">{measuredCircumference} cm</span>
                <span>23.0 cm (Largest)</span>
              </div>

              <input
                type="range"
                min="16.0"
                max="23.0"
                step="0.1"
                value={measuredCircumference}
                onChange={(e) => setMeasuredCircumference(parseFloat(e.target.value))}
                className="w-full accent-[#C59B27] cursor-pointer"
              />

              {/* Recommended Size Result Box */}
              <div className="mt-6 p-5 rounded-2xl bg-[#FAF7F2] border border-[#C59B27]/40 text-center">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#9A7416] block">
                  Your Recommended Size
                </span>
                <div className="text-4xl font-serif-luxury font-bold text-[#114B3E] my-1">
                  Size {recommendedSize.size}
                </div>
                <div className="text-xs text-[#443E38] font-medium">
                  {recommendedSize.innerDiameterMm} Inner Diameter ({recommendedSize.innerDiameterInches})
                </div>
                <p className="text-[11px] text-[#8C7A6B] mt-1">
                  {recommendedSize.fit} • Wrist circumference range: {recommendedSize.wristCircumferenceCm}
                </p>

                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={() => {
                      setCustomSize(recommendedSize.size);
                      setActiveTab('customizer');
                    }}
                    className="px-4 py-2 rounded-full bg-[#114B3E] text-white text-xs font-semibold uppercase tracking-wider hover:bg-[#0D382E] transition"
                  >
                    Customize with Size {recommendedSize.size}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Reference Table */}
          <div className="bg-white rounded-3xl border border-[#E8D8C8] overflow-hidden shadow-sm">
            <div className="p-6 border-b border-[#E8D8C8]">
              <h3 className="font-serif-luxury font-bold text-xl text-[#1A1816]">Complete Bangle Size Reference Table</h3>
              <p className="text-xs text-[#8C7A6B]">Standard measurements used across all our handcrafted pieces</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F2] text-[#1A1816] uppercase tracking-wider border-b border-[#E8D8C8]">
                  <tr>
                    <th className="py-3 px-4 font-bold">Indian Size</th>
                    <th className="py-3 px-4 font-bold">Inner Diameter (Inches)</th>
                    <th className="py-3 px-4 font-bold">Inner Diameter (mm)</th>
                    <th className="py-3 px-4 font-bold">Hand Circumference</th>
                    <th className="py-3 px-4 font-bold">Fit Classification</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8D8C8]/60 text-[#443E38]">
                  {SIZE_CHART.map((item) => (
                    <tr key={item.size} className="hover:bg-[#FAF7F2]/50 transition">
                      <td className="py-3.5 px-4 font-bold text-[#1A1816]">{item.size}</td>
                      <td className="py-3.5 px-4">{item.innerDiameterInches}</td>
                      <td className="py-3.5 px-4">{item.innerDiameterMm}</td>
                      <td className="py-3.5 px-4">{item.wristCircumferenceCm}</td>
                      <td className="py-3.5 px-4 font-medium text-[#114B3E]">{item.fit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      )}

      {/* 6. Heritage & Brand Story */}
      {activeTab === 'story' && (
        <section className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="text-xs uppercase font-semibold tracking-[0.3em] text-[#9A7416] block mb-2">
              Subhiksha Homemade Jewellery Heritage
            </span>
            <h1 className="text-3xl sm:text-5xl font-serif-luxury font-bold text-[#1A1816] mb-4">
              Over 400 Precision Silk Wraps in Every Bangle
            </h1>
            <p className="text-sm text-[#68625B] font-light leading-relaxed">
              Founded with the vision to preserve authentic Indian royal adornments, our atelier combines natural mulberry silk filament weaving with exquisite uncut jadau Kundan stones.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-14">
            <div className="bg-white rounded-3xl p-6 border border-[#E8D8C8] shadow-sm text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF7F2] border border-[#C59B27] flex items-center justify-center text-[#9A7416] mb-4">
                <Scissors className="w-6 h-6" />
              </div>
              <h3 className="font-serif-luxury font-bold text-lg text-[#1A1816] mb-2">Pure Mulberry Silk</h3>
              <p className="text-xs text-[#68625B] leading-relaxed">
                We use high-twist continuous filament silk thread that radiates a natural pearlescent sheen under wedding lights without fraying.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#E8D8C8] shadow-sm text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF7F2] border border-[#C59B27] flex items-center justify-center text-[#9A7416] mb-4">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="font-serif-luxury font-bold text-lg text-[#1A1816] mb-2">Jadau Kundan & Zardozi</h3>
              <p className="text-xs text-[#68625B] leading-relaxed">
                Hand-set glass kundan stones and antique zari bullion wires are meticulously fixed onto the silk base by seasoned karigars.
              </p>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-[#E8D8C8] shadow-sm text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-[#FAF7F2] border border-[#C59B27] flex items-center justify-center text-[#9A7416] mb-4">
                <Gift className="w-6 h-6" />
              </div>
              <h3 className="font-serif-luxury font-bold text-lg text-[#1A1816] mb-2">Bridal Keepsake Boxes</h3>
              <p className="text-xs text-[#68625B] leading-relaxed">
                Each bridal chooda set arrives nested in a silk-padded velvet trunk with moisture-resistant chambers for lifelong preservation.
              </p>
            </div>
          </div>

          {/* Testimonial Quote */}
          <div className="bg-[#FAF7F2] rounded-3xl p-8 border border-[#E8D8C8] text-center max-w-2xl mx-auto">
            <div className="flex justify-center text-amber-500 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="font-serif-luxury italic text-lg sm:text-xl text-[#1A1816] mb-4">
              "The crimson silk chooda was so lightweight, I wore all 24 pieces throughout my 8-hour wedding without any redness or fatigue. The stones matched my Sabyasachi lehenga flawlessly!"
            </p>
            <span className="text-xs font-bold text-[#114B3E] block">Pooja S. — Destination Bride, Udaipur</span>
          </div>
        </section>
      )}

      {/* 6.5. Google Sheets Orders & Real-Time Tracking Hub */}
      {activeTab === 'tracking' && (
        <section className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
          {/* Section Introduction & Customer Fast-Track */}
          <div className="mb-8 text-center max-w-3xl mx-auto">
            <span className="text-xs uppercase font-semibold tracking-[0.3em] text-[#9A7416] block mb-2">
              Dispatch &amp; Consignment Management
            </span>
            <h1 className="text-3xl sm:text-4xl font-serif-luxury font-bold text-[#1A1816] mb-3">
              Live Orders &amp; Tracking Numbers
            </h1>
            <p className="text-xs sm:text-sm text-[#68625B] leading-relaxed">
              Directly connected with Google Sheets and Google Drive to retrieve customer order IDs, speed post / express courier tracking numbers, and delivery milestones.
            </p>
          </div>

          {/* Customer Fast Track Search Banner */}
          <div className="bg-gradient-to-r from-[#114B3E] to-[#0D382E] text-white rounded-3xl p-6 sm:p-8 mb-8 border border-[#C59B27]/30 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="p-3.5 rounded-2xl bg-white/10 text-[#E8D38B] border border-white/20 shrink-0">
                <Truck className="w-7 h-7" />
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#E8D38B] block mb-1">
                  Customer Portal
                </span>
                <h3 className="font-serif-luxury font-bold text-2xl text-white">
                  Looking for Your Handcrafted Bangle Parcel?
                </h3>
                <p className="text-xs text-white/80 mt-1 max-w-xl leading-relaxed">
                  Enter your Subhiksha Order ID (e.g. <code>SBK-1082</code>) or registered phone number to view live consignment milestones and courier dispatch numbers.
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setTrackingModalInitialId('');
                setIsTrackingModalOpen(true);
              }}
              className="px-6 py-3.5 rounded-2xl bg-[#E8D38B] hover:bg-[#DFC573] text-[#114B3E] text-xs font-bold uppercase tracking-wider transition shadow-lg shrink-0 flex items-center gap-2 group"
            >
              <span>Track Consignment Now</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </button>
          </div>

          {/* Google Sheets Orders Manager */}
          <GoogleSheetsOrderManager
            user={googleUser}
            onUserChange={(u) => {
              setGoogleUser(u);
              setIsGoogleSheetsConnected(Boolean(u));
            }}
            onOrdersSynced={(ords, title) => {
              setSyncedOrders(ords);
              setActiveSpreadsheetTitle(title);
            }}
            initialOrders={syncedOrders}
          />

          {/* Workflow Guide */}
          <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-5 rounded-2xl bg-white border border-[#E8D8C8] shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-[#FAF7F2] text-[#9A7416] flex items-center justify-center font-bold text-xs mb-3 border border-[#E8D8C8]">
                1
              </div>
              <h4 className="text-xs font-bold text-[#1A1816] mb-1">Order Received on WhatsApp</h4>
              <p className="text-[11px] text-[#68625B] leading-relaxed">
                When customers select silk bangle sizes or customize lehenga colors and order via WhatsApp (+91 90807 89855), an Order ID is generated.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E8D8C8] shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-[#FAF7F2] text-[#9A7416] flex items-center justify-center font-bold text-xs mb-3 border border-[#E8D8C8]">
                2
              </div>
              <h4 className="text-xs font-bold text-[#1A1816] mb-1">Live Google Sheet Sync</h4>
              <p className="text-[11px] text-[#68625B] leading-relaxed">
                Artisans update the Google Sheet with India Post, BlueDart, DTDC, or Delhivery tracking numbers as soon as packages are sealed in keepsake velvet boxes.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-[#E8D8C8] shadow-sm">
              <div className="w-8 h-8 rounded-xl bg-[#FAF7F2] text-[#9A7416] flex items-center justify-center font-bold text-xs mb-3 border border-[#E8D8C8]">
                3
              </div>
              <h4 className="text-xs font-bold text-[#1A1816] mb-1">1-Click WhatsApp Dispatch Notice</h4>
              <p className="text-[11px] text-[#68625B] leading-relaxed">
                With a single click in the manager table, send the tracking link and courier consignment number directly to the customer on WhatsApp.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* 6.6. Artisan Admin & Inventory Dashboard */}
      {activeTab === 'admin' && (
        <AdminDashboard
          products={products}
          onUpdateProduct={handleUpdateProduct}
          onAddProduct={handleAddProduct}
          onDeleteProduct={handleDeleteProduct}
          onUpdateStock={handleUpdateStock}
          onBatchUpdateStock={handleBatchUpdateStock}
          onResetToDefaults={handleResetToDefaultProducts}
          onClose={() => setActiveTab('shop')}
          customUploadedImages={customUploadedImages}
          onSingleUpload={handleUploadBanglePhoto}
        />
      )}

      {/* 7. Quick View Product Modal */}
      {quickViewProduct && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden shadow-2xl border border-[#E8D8C8] relative max-h-[90vh] flex flex-col md:flex-row">
            <button
              onClick={() => setQuickViewProduct(null)}
              className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-[#22201E] shadow transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Left: Product Image - Strict 1:1 Square Ratio */}
            <div 
              className="md:w-1/2 aspect-square w-full bg-[#FAF7F2] relative flex items-center justify-center overflow-hidden shrink-0"
              style={{ aspectRatio: '1 / 1' }}
            >
              <img
                src={customUploadedImages[quickViewProduct.id] || quickViewProduct.image}
                alt={quickViewProduct.name}
                className="w-full h-full object-cover object-center"
                style={{ aspectRatio: '1 / 1' }}
              />
              <div className="absolute bottom-3 right-3 flex items-center gap-2">
                <label className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur text-xs font-semibold text-[#1A1816] shadow-sm hover:bg-white cursor-pointer flex items-center gap-1.5 transition">
                  <Camera className="w-3.5 h-3.5 text-[#9A7416]" />
                  <span>{customUploadedImages[quickViewProduct.id] ? "Change Workshop Photo" : "Upload Workshop Photo"}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadBanglePhoto(quickViewProduct.id, file);
                    }}
                  />
                </label>
                {customUploadedImages[quickViewProduct.id] && (
                  <button
                    onClick={() => handleResetBanglePhoto(quickViewProduct.id)}
                    className="p-1.5 rounded-full bg-white/90 backdrop-blur text-slate-500 hover:text-red-600 shadow-sm transition"
                    title="Reset to handmade silk thread image"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Right: Product Details */}
            <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
              <div>
                <div className="flex items-center gap-2 text-xs text-amber-600 font-semibold mb-1">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{quickViewProduct.rating} ({quickViewProduct.reviewCount} verified reviews)</span>
                </div>

                <h2 className="text-xl sm:text-2xl font-serif-luxury font-bold text-[#1A1816]">
                  {quickViewProduct.name}
                </h2>
                <p className="text-xs text-[#8C7A6B] mt-1 mb-3">
                  {quickViewProduct.subtitle}
                </p>

                <div className="flex items-baseline gap-3 mb-2">
                  <span className="text-2xl font-bold font-serif-luxury text-[#1A1816]">
                    ₹{quickViewProduct.price.toLocaleString()}
                  </span>
                  <span className="text-xs text-[#8C7A6B] line-through">
                    ₹{quickViewProduct.originalPrice.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold text-emerald-700">
                    Save ₹{(quickViewProduct.originalPrice - quickViewProduct.price).toLocaleString()}
                  </span>
                </div>

                {/* Live Stock Level & Admin Shortcut */}
                <div className="flex items-center gap-3 mb-4 text-xs flex-wrap">
                  {quickViewProduct.stock <= 0 ? (
                    <span className="text-red-700 font-bold bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-md">
                      Out of Stock (Crafting Soon)
                    </span>
                  ) : quickViewProduct.stock <= 5 ? (
                    <span className="text-amber-800 font-bold bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-md">
                      Low Stock: Only {quickViewProduct.stock} sets left!
                    </span>
                  ) : (
                    <span className="text-emerald-800 font-medium bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-md">
                      In Stock: {quickViewProduct.stock} sets available
                    </span>
                  )}
                  <button
                    onClick={() => {
                      setQuickViewProduct(null);
                      setActiveTab('admin');
                    }}
                    className="text-[#9A7416] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit className="w-3 h-3" />
                    <span>Edit in Admin</span>
                  </button>
                </div>

                <p className="text-xs text-[#443E38] font-light leading-relaxed mb-4">
                  {quickViewProduct.description}
                </p>

                {/* Size Selector */}
                <div className="mb-4">
                  <label className="block text-xs font-semibold text-[#1A1816] mb-1.5">
                    Select Indian Bangle Size:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {quickViewProduct.sizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setQuickViewSize(size)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                          quickViewSize === size
                            ? 'bg-[#114B3E] text-white'
                            : 'bg-[#FAF7F2] border border-[#E8D8C8] text-[#443E38] hover:border-[#9A7416]'
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Materials & Care */}
                <div className="text-[11px] text-[#68625B] space-y-1.5 pt-3 border-t border-[#E8D8C8]">
                  <div><strong>Materials:</strong> {quickViewProduct.materials}</div>
                  <div><strong>Care:</strong> {quickViewProduct.care}</div>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-6 pt-4 border-t border-[#E8D8C8] flex items-center gap-3">
                {quickViewProduct.stock <= 0 ? (
                  <button
                    disabled
                    className="flex-1 py-3 rounded-2xl bg-slate-200 text-slate-500 text-xs font-semibold uppercase tracking-wider cursor-not-allowed flex items-center justify-center gap-2 shadow-none"
                  >
                    <span>Currently Out of Stock</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      handleAddToCart(quickViewProduct, quickViewSize);
                      setQuickViewProduct(null);
                    }}
                    className="flex-1 py-3 rounded-2xl bg-[#1A1816] hover:bg-[#9A7416] text-white text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2 shadow cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Add to Cart (Size {quickViewSize})</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 8. Slide-over Shopping Cart Drawer */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-[#FAF7F2] h-full shadow-2xl flex flex-col justify-between border-l border-[#E8D8C8] animate-in slide-in-from-right duration-300">
            {/* Cart Header */}
            <div className="p-4 sm:p-5 border-b border-[#E8D8C8] bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-[#9A7416]" />
                <h3 className="font-serif-luxury font-bold text-xl text-[#1A1816]">Your Jewellery Bag</h3>
                <span className="text-xs font-medium text-[#8C7A6B]">({cart.length} items)</span>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-[#443E38] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
              {cart.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8C7A6B]">
                  <ShoppingBag className="w-12 h-12 mb-3 stroke-1 text-[#C59B27]" />
                  <p className="text-sm font-semibold text-[#1A1816] mb-1">Your Bag is Empty</p>
                  <p className="text-xs text-[#8C7A6B] mb-4">Explore our royal bridal collections or create a custom set.</p>
                  <button
                    onClick={() => { setIsCartOpen(false); setActiveTab('shop'); }}
                    className="px-5 py-2.5 rounded-full bg-[#114B3E] text-white text-xs font-semibold uppercase tracking-wider"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                cart.map(item => (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white border border-[#E8D8C8] flex gap-3.5 shadow-sm"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 rounded-xl object-cover bg-[#F4EFE6] shrink-0"
                    />
                    <div className="flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between">
                          <h4 className="text-xs font-bold text-[#1A1816] line-clamp-1">{item.name}</h4>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, -item.quantity)}
                            className="text-[#8C7A6B] hover:text-red-600 transition"
                            title="Remove"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="text-[11px] text-[#8C7A6B] mt-0.5">
                          Size: <strong className="text-[#1A1816]">{item.size}</strong>
                          {item.isCustom && item.customDetails && (
                            <span className="block text-[10px] text-[#9A7416]">
                              {item.customDetails.colorName} • {item.customDetails.pieces}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#F0E6DA]">
                        <span className="text-xs font-bold text-[#1A1816]">
                          ₹{(item.price * item.quantity).toLocaleString()}
                        </span>

                        <div className="flex items-center border border-[#E8D8C8] rounded-lg bg-[#FAF7F2]">
                          <button
                            onClick={() => handleUpdateQuantity(item.id, -1)}
                            className="p-1 hover:bg-[#E8D8C8] text-[#443E38] rounded-l-lg transition"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="px-2.5 text-xs font-semibold">{item.quantity}</span>
                          <button
                            onClick={() => handleUpdateQuantity(item.id, 1)}
                            className="p-1 hover:bg-[#E8D8C8] text-[#443E38] rounded-r-lg transition"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Cart Footer / Checkout Trigger */}
            {cart.length > 0 && (
              <div className="p-4 sm:p-5 border-t border-[#E8D8C8] bg-white space-y-3">
                <div className="space-y-1.5 text-xs text-[#68625B]">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span className="font-semibold text-[#1A1816]">₹{cartSubtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Express Dispatch</span>
                    <span>{shippingCost === 0 ? <strong className="text-emerald-700">Free</strong> : `₹${shippingCost}`}</span>
                  </div>
                  <div className="flex justify-between text-sm font-bold text-[#1A1816] pt-2 border-t border-[#E8D8C8]">
                    <span>Total Amount</span>
                    <span className="font-serif-luxury text-lg">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <button
                    onClick={() => { setIsCartOpen(false); setIsCheckoutOpen(true); }}
                    className="w-full py-3 rounded-xl bg-[#114B3E] hover:bg-[#0D382E] text-white text-xs font-semibold uppercase tracking-wider shadow transition"
                  >
                    Proceed to Delivery & Checkout
                  </button>

                  <a
                    href={getWhatsAppOrderUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-2.5 rounded-xl bg-[#25D366]/15 hover:bg-[#25D366] text-[#075E54] hover:text-white border border-[#25D366]/30 text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Instant Order via WhatsApp (9080789855)</span>
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 9. Checkout & Delivery Address Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 border border-[#E8D8C8] shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsCheckoutOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-[#443E38] transition"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[10px] uppercase font-bold tracking-widest text-[#9A7416] block mb-1">
              Secure Delivery Confirmation
            </span>
            <h2 className="text-2xl font-serif-luxury font-bold text-[#1A1816] mb-4">
              Enter Delivery Details
            </h2>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const orderData = {
                  orderId: `SHJ-${Math.floor(100000 + Math.random() * 900000)}`,
                  name: formData.get('fullName'),
                  phone: formData.get('phone'),
                  address: formData.get('address'),
                  city: formData.get('city'),
                  pincode: formData.get('pincode'),
                  total: totalAmount,
                  itemsCount: cart.length
                };
                setOrderCompleteData(orderData);
                setCart([]);
                setIsCheckoutOpen(false);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-medium text-[#1A1816] mb-1">Full Name</label>
                <input
                  required
                  name="fullName"
                  type="text"
                  placeholder="Bride or Recipient Name"
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8D8C8] text-xs text-[#22201E] focus:outline-none focus:border-[#C59B27]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#1A1816] mb-1">Phone / WhatsApp</label>
                  <input
                    required
                    name="phone"
                    type="tel"
                    placeholder="+91 9876543210"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8D8C8] text-xs text-[#22201E] focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1A1816] mb-1">Pin Code</label>
                  <input
                    required
                    name="pincode"
                    type="text"
                    placeholder="e.g. 560001"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8D8C8] text-xs text-[#22201E] focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-[#1A1816] mb-1">Delivery Address</label>
                <textarea
                  required
                  name="address"
                  rows={2}
                  placeholder="Apartment, Street name, Landmark..."
                  className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8D8C8] text-xs text-[#22201E] focus:outline-none focus:border-[#C59B27] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#1A1816] mb-1">City / State</label>
                  <input
                    required
                    name="city"
                    type="text"
                    placeholder="e.g. Mumbai, Maharashtra"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8D8C8] text-xs text-[#22201E] focus:outline-none focus:border-[#C59B27]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#1A1816] mb-1">Payment Method</label>
                  <select
                    name="paymentMethod"
                    className="w-full px-3.5 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8D8C8] text-xs text-[#22201E] focus:outline-none focus:border-[#C59B27]"
                  >
                    <option value="upi">UPI / Google Pay / PhonePe</option>
                    <option value="card">Credit / Debit Card</option>
                    <option value="netbanking">Net Banking</option>
                    <option value="cod">Cash on Delivery (₹100 advance)</option>
                  </select>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8D8C8] text-xs text-[#68625B]">
                <div className="flex justify-between font-bold text-[#1A1816]">
                  <span>Total Payable:</span>
                  <span>₹{totalAmount.toLocaleString()}</span>
                </div>
                <p className="text-[10px] mt-1 text-[#8C7A6B]">
                  🔒 256-bit encrypted checkout. We dispatch via insured bridal express couriers.
                </p>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#114B3E] hover:bg-[#0D382E] text-white text-xs font-semibold uppercase tracking-wider shadow-lg transition"
              >
                Place Order & Confirm Dispatch
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 10. Order Success Confirmation Banner Modal */}
      {orderCompleteData && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center border border-[#E8D8C8] shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8" />
            </div>

            <span className="text-[10px] uppercase font-bold tracking-widest text-[#9A7416] block mb-1">
              Order Confirmed
            </span>
            <h2 className="text-2xl font-serif-luxury font-bold text-[#1A1816] mb-2">
              Thank You, {orderCompleteData.name}!
            </h2>
            <p className="text-xs text-[#68625B] mb-6">
              Your order ID <strong className="text-[#1A1816]">{orderCompleteData.orderId}</strong> has been received by our master artisans. We will reach out on {orderCompleteData.phone} to finalize the sizing and dispatch date.
            </p>

            <div className="bg-[#FAF7F2] p-4 rounded-2xl border border-[#E8D8C8] text-xs text-left mb-6 space-y-1 text-[#443E38]">
              <div><strong>Deliver to:</strong> {orderCompleteData.address}, {orderCompleteData.city} ({orderCompleteData.pincode})</div>
              <div><strong>Total Amount:</strong> ₹{orderCompleteData.total.toLocaleString()}</div>
            </div>

            <div className="flex flex-col gap-2">
              <button
                onClick={() => {
                  const id = orderCompleteData.orderId;
                  setOrderCompleteData(null);
                  setTrackingModalInitialId(id);
                  setIsTrackingModalOpen(true);
                }}
                className="w-full py-2.5 rounded-xl bg-[#114B3E] hover:bg-[#0D382E] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition shadow"
              >
                <Truck className="w-4 h-4 text-[#E8D38B]" />
                <span>Track Consignment Live Status</span>
              </button>
              <a
                href={getWhatsAppOrderUrl(`Hi Subhiksha Homemade Jewellery, I placed order ${orderCompleteData.orderId} for ₹${orderCompleteData.total}. Could you confirm my estimated dispatch timeline?`)}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-2.5 rounded-xl bg-[#25D366] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#1EBE5D] transition"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Track on WhatsApp (9080789855)</span>
              </a>
              <button
                onClick={() => setOrderCompleteData(null)}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-[#1A1816] text-xs font-semibold uppercase tracking-wider hover:bg-slate-200 transition"
              >
                Back to Shop
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 11. Wishlist Modal */}
      {isWishlistOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-md bg-[#FAF7F2] h-full shadow-2xl flex flex-col justify-between border-l border-[#E8D8C8]">
            <div className="p-4 sm:p-5 border-b border-[#E8D8C8] bg-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Heart className="w-5 h-5 text-[#8B1824] fill-[#8B1824]" />
                <h3 className="font-serif-luxury font-bold text-xl text-[#1A1816]">Saved Wishlist</h3>
              </div>
              <button
                onClick={() => setIsWishlistOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-[#443E38] transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
              {wishlist.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 text-[#8C7A6B]">
                  <Heart className="w-12 h-12 mb-3 text-slate-300 stroke-1" />
                  <p className="text-sm font-semibold text-[#1A1816] mb-1">Your Wishlist is Empty</p>
                  <p className="text-xs text-[#8C7A6B]">Tap the heart icon on any piece to save it for your bridal trousseau.</p>
                </div>
              ) : (
                products.filter(p => wishlist.includes(p.id)).map(product => (
                  <div
                    key={product.id}
                    className="p-3 rounded-2xl bg-white border border-[#E8D8C8] flex items-center justify-between gap-3 shadow-sm"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={customUploadedImages[product.id] || product.image}
                        alt={product.name}
                        className="w-14 h-14 rounded-xl object-cover bg-[#F4EFE6]"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-[#1A1816] line-clamp-1">{product.name}</h4>
                        <span className="text-xs font-semibold text-[#9A7416]">₹{product.price.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          handleAddToCart(product, product.sizes[0] || '2.6');
                          toggleWishlist(product.id);
                        }}
                        className="px-3 py-1.5 rounded-lg bg-[#114B3E] text-white text-xs font-semibold hover:bg-[#0D382E] transition"
                      >
                        Add to Bag
                      </button>
                      <button
                        onClick={() => toggleWishlist(product.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-[#E8D8C8] bg-white text-center">
              <button
                onClick={() => setIsWishlistOpen(false)}
                className="w-full py-2.5 rounded-xl bg-slate-100 text-[#1A1816] text-xs font-semibold uppercase tracking-wider hover:bg-slate-200 transition"
              >
                Close Wishlist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 12. Go Live & Custom Domain Launch Guide Modal */}
      {isGoLiveModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-[#E8D8C8] shadow-2xl relative max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => setIsGoLiveModalOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-[#443E38] transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              <span className="text-xs uppercase font-bold tracking-widest text-emerald-700">
                Your Website is Active &amp; Live Online
              </span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-serif-luxury font-bold text-[#1A1816] mb-3">
              How to Share Your Store &amp; Connect Custom Domain
            </h2>

            <p className="text-xs text-[#68625B] leading-relaxed mb-6">
              Your Subhiksha Handmade Jewellery e-commerce website is already fully operational on the cloud. Customers can browse, configure bespoke silk thread bangles, and place instant orders directly through your WhatsApp.
            </p>

            {/* Live Shared URL Box */}
            <div className="p-4 sm:p-5 rounded-2xl bg-[#FAF7F2] border border-[#E8D8C8] mb-6">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#8C7A6B] block mb-1.5">
                Current Live Store Address (Share with Customers):
              </span>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                <input
                  type="text"
                  readOnly
                  value="https://ais-pre-oyorosdrys7zam6l6rksz2-552365793745.asia-southeast1.run.app"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-white border border-[#E8D8C8] text-xs font-mono text-[#1A1816] focus:outline-none"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText("https://ais-pre-oyorosdrys7zam6l6rksz2-552365793745.asia-southeast1.run.app");
                    setLinkCopied(true);
                    setTimeout(() => setLinkCopied(false), 3000);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#114B3E] hover:bg-[#0D382E] text-white text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-1.5 transition shadow"
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Link</span>
                    </>
                  )}
                </button>
              </div>

              {/* Instant Share Buttons */}
              <div className="mt-3.5 flex flex-wrap items-center gap-2">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent("Explore Subhiksha Handmade Jewellery's exclusive handcrafted silk thread bangles and bridal sets: https://ais-pre-oyorosdrys7zam6l6rksz2-552365793745.asia-southeast1.run.app")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-full bg-[#25D366] text-white text-xs font-semibold flex items-center gap-1.5 hover:bg-[#1EBE5D] transition shadow-sm"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Share on WhatsApp</span>
                </a>

                <a
                  href="https://ais-pre-oyorosdrys7zam6l6rksz2-552365793745.asia-southeast1.run.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-full bg-white border border-[#E8D8C8] text-[#1A1816] text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50 transition shadow-sm"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Live Website</span>
                </a>
              </div>
            </div>

            {/* Step-by-Step Custom Domain Guide */}
            <div className="space-y-4 mb-6">
              <h3 className="font-serif-luxury font-bold text-lg text-[#1A1816] flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#9A7416]" />
                <span>3 Simple Steps to Connect Your Own Domain (e.g. subhikshabangles.com)</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="p-3.5 rounded-2xl bg-white border border-[#E8D8C8] shadow-sm">
                  <span className="w-6 h-6 rounded-full bg-[#114B3E] text-white text-xs font-bold flex items-center justify-center mb-2">
                    1
                  </span>
                  <h4 className="text-xs font-bold text-[#1A1816] mb-1">Buy Custom Domain</h4>
                  <p className="text-[11px] text-[#68625B] leading-relaxed">
                    Purchase your brand name on GoDaddy, Hostinger, or Namecheap (e.g. <strong className="text-[#1A1816]">subhikshabangles.com</strong> or <strong className="text-[#1A1816]">.in</strong> for ~₹499/year).
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#E8D8C8] shadow-sm">
                  <span className="w-6 h-6 rounded-full bg-[#114B3E] text-white text-xs font-bold flex items-center justify-center mb-2">
                    2
                  </span>
                  <h4 className="text-xs font-bold text-[#1A1816] mb-1">Host on Vercel / Netlify</h4>
                  <p className="text-[11px] text-[#68625B] leading-relaxed">
                    Export your project to GitHub and connect it to <strong className="text-[#1A1816]">Vercel</strong> or <strong className="text-[#1A1816]">Netlify</strong> (100% Free Forever tier).
                  </p>
                </div>

                <div className="p-3.5 rounded-2xl bg-white border border-[#E8D8C8] shadow-sm">
                  <span className="w-6 h-6 rounded-full bg-[#114B3E] text-white text-xs font-bold flex items-center justify-center mb-2">
                    3
                  </span>
                  <h4 className="text-xs font-bold text-[#1A1816] mb-1">Add DNS Records</h4>
                  <p className="text-[11px] text-[#68625B] leading-relaxed">
                    In your domain dashboard (GoDaddy/Hostinger), add the <strong className="text-[#1A1816]">A Record</strong> pointing to Vercel (<code className="text-[10px] bg-slate-100 px-1 py-0.5 rounded">76.76.21.21</code>). Free HTTPS is activated automatically!
                  </p>
                </div>
              </div>
            </div>

            {/* How Orders and Payments Work */}
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 mb-6">
              <h4 className="text-xs font-bold text-[#0D382E] flex items-center gap-1.5 mb-1.5">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>Zero-Fee Direct WhatsApp &amp; UPI Ordering Configured</span>
              </h4>
              <p className="text-[11px] text-[#114B3E] leading-relaxed">
                When customers choose silk thread bangle sizes or custom colors and click <em>"Instant Order via WhatsApp"</em>, their complete bridal details, sizes, colors, and prices are pre-filled and sent straight to your phone (<strong className="underline">+91 90807 89855</strong>). You can immediately send your GPay / PhonePe UPI QR code to receive 100% of your earnings with zero transaction fees!
              </p>
            </div>

            {/* Close Button */}
            <div className="flex justify-end">
              <button
                onClick={() => setIsGoLiveModalOpen(false)}
                className="px-6 py-2.5 rounded-full bg-[#1A1816] hover:bg-[#9A7416] text-white text-xs font-semibold uppercase tracking-wider transition"
              >
                Got It, Thank You!
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 13. Floating WhatsApp Concierge Button */}
      <a
        href={getWhatsAppOrderUrl()}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 p-3.5 rounded-full bg-[#25D366] text-white shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-2 group"
        title="Chat with Subhiksha Homemade Jewellery on WhatsApp (+91 90807 89855)"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap group-hover:max-w-xs transition-all duration-300 text-xs font-bold px-0 group-hover:px-1">
          WhatsApp: 9080789855
        </span>
      </a>

      {/* 13. Luxury Footer */}
      <footer className="bg-[#1A1816] text-[#FAF7F2] border-t border-[#332E2A] mt-auto">
        {/* Brand Guarantees / Trust Badges in Footer */}
        <div className="border-b border-[#332E2A] bg-black/25">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
              <div className="flex items-center gap-3.5 p-2">
                <div className="p-2.5 rounded-full bg-white/5 border border-[#E8D38B]/30 text-[#E8D38B] shrink-0">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">100% Pure Silk</h4>
                  <p className="text-[11px] text-[#A89E94]">High-twist mulberry yarn</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-2">
                <div className="p-2.5 rounded-full bg-white/5 border border-[#E8D38B]/30 text-[#E8D38B] shrink-0">
                  <Ruler className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">Custom Sizing</h4>
                  <p className="text-[11px] text-[#A89E94]">Precise 2.2 to 2.10 fits</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-2">
                <div className="p-2.5 rounded-full bg-white/5 border border-[#E8D38B]/30 text-[#E8D38B] shrink-0">
                  <Shield className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">Featherlight Comfort</h4>
                  <p className="text-[11px] text-[#A89E94]">Zero wrist strain for hours</p>
                </div>
              </div>

              <div className="flex items-center gap-3.5 p-2">
                <div className="p-2.5 rounded-full bg-white/5 border border-[#E8D38B]/30 text-[#E8D38B] shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white tracking-wide">Artisan Made</h4>
                  <p className="text-[11px] text-[#A89E94]">Master handcrafted in India</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
            <div>
              <h3 className="font-serif-luxury text-2xl font-bold tracking-wider text-[#E8D38B] mb-2">
                Subhiksha Homemade Jewellery
              </h3>
              <p className="text-xs text-[#A89E94] leading-relaxed mb-4">
                Haute silk thread bridal bangles, royal kundan choodas, and bespoke wedding jewellery handcrafted by master Indian artisans with love and devotion.
              </p>
              <div className="space-y-1.5 text-xs">
                <a
                  href={getWhatsAppOrderUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#25D366] hover:underline font-semibold flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp: +91 90807 89855</span>
                </a>
                <div className="text-[#C59B27] font-semibold flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  <span>subhikshahandmadejewellery@gmail.com</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#E8D38B] mb-4">
                Handmade Bangles
              </h4>
              <ul className="space-y-2 text-xs text-[#A89E94]">
                <li><button onClick={() => { setActiveTab('shop'); setSelectedCategory('Bridal'); }} className="hover:text-white transition">Royal Bridal Choodas (24 Pcs)</button></li>
                <li><button onClick={() => { setActiveTab('shop'); setSelectedCategory('Kada'); }} className="hover:text-white transition">Zardozi Embellished Kadas</button></li>
                <li><button onClick={() => { setActiveTab('shop'); setSelectedCategory('Festive'); }} className="hover:text-white transition">Festive Bangle Stacks</button></li>
                <li><button onClick={() => { setActiveTab('shop'); setSelectedCategory('Kundan'); }} className="hover:text-white transition">Kundan & Mirror Bangles</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#E8D38B] mb-4">
                Client Concierge
              </h4>
              <ul className="space-y-2 text-xs text-[#A89E94]">
                <li><button onClick={() => { setTrackingModalInitialId(''); setIsTrackingModalOpen(true); }} className="hover:text-white transition flex items-center gap-1.5"><Truck className="w-3 h-3 text-[#E8D38B]" /><span>Track Order Consignment</span></button></li>
                <li><button onClick={() => setActiveTab('tracking')} className="hover:text-white transition flex items-center gap-1.5"><FileSpreadsheet className="w-3 h-3 text-[#E8D38B]" /><span>Google Sheets Dispatch Hub</span></button></li>
                <li><button onClick={() => setActiveTab('admin')} className="hover:text-white transition flex items-center gap-1.5"><Boxes className="w-3 h-3 text-[#E8D38B]" /><span>Artisan Admin &amp; Inventory</span></button></li>
                <li><button onClick={() => setActiveTab('sizeguide')} className="hover:text-white transition">Interactive Bangle Size Chart</button></li>
                <li><button onClick={() => setActiveTab('customizer')} className="hover:text-white transition">Custom Lehenga Matching Studio</button></li>
                <li><button onClick={() => setActiveTab('story')} className="hover:text-white transition">Care & Maintenance Guide</button></li>
                <li><a href={getWhatsAppOrderUrl()} target="_blank" rel="noopener noreferrer" className="hover:text-white transition">Direct WhatsApp Inquiry (9080789855)</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-[#E8D38B] mb-4">
                Express Dispatch
              </h4>
              <p className="text-xs text-[#A89E94] leading-relaxed">
                Standard orders dispatch within 48 hours. Bespoke wedding orders require 4-7 business days for hand-weaving and stone setting.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-[#332E2A] flex flex-col sm:flex-row items-center justify-between text-xs text-[#8C7A6B]">
            <p>© 2026 Subhiksha Homemade Jewellery. All rights reserved.</p>
            <p className="mt-2 sm:mt-0">Handcrafted in India • Worldwide Express Shipping</p>
          </div>
        </div>
      </footer>

      {/* Customer Real-Time Order Tracking Modal */}
      <OrderTrackingModal
        isOpen={isTrackingModalOpen}
        onClose={() => setIsTrackingModalOpen(false)}
        orders={syncedOrders}
        isGoogleSheetsConnected={isGoogleSheetsConnected}
        activeSpreadsheetName={activeSpreadsheetTitle}
        onOpenGoogleSheetsHub={() => {
          setIsTrackingModalOpen(false);
          setActiveTab('tracking');
        }}
        initialOrderId={trackingModalInitialId}
      />
    </div>
  );
}
