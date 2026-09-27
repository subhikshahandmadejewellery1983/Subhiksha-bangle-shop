import React, { useState, useRef } from 'react';
import { 
  Camera, 
  Upload, 
  Check, 
  RotateCcw, 
  Sparkles, 
  Maximize2, 
  AlertCircle,
  X,
  Layers,
  CheckCircle2,
  Image as ImageIcon
} from 'lucide-react';

interface OriginalPhotosManagerProps {
  customUploadedImages: Record<string, string>;
  onBatchUpload: (mappedImages: Record<string, string>) => void;
  onSingleUpload: (productId: string, file: File) => void;
  onResetPhoto: (productId: string) => void;
  onResetAll: () => void;
  products: Array<{
    id: string;
    name: string;
    primaryColor: string;
    colorHex: string;
    image: string;
    pieces: string;
  }>;
}

export const ORIGINAL_TARGET_PRODUCTS = [
  {
    id: 'prod-1',
    label: 'Maharani Crimson Kundan Bridal Chooda',
    targetFile: 'Red (1).webp',
    colorName: 'Crimson Red',
    colorHex: '#8B1824',
    hintKeywords: ['red', 'crimson', 'chooda', '1']
  },
  {
    id: 'prod-2',
    label: 'Mayura Emerald Royale Silk Kada',
    targetFile: 'green.webp',
    colorName: 'Royal Emerald',
    colorHex: '#114B3E',
    hintKeywords: ['green', 'emerald', 'kada']
  },
  {
    id: 'prod-3',
    label: 'Subhiksha Turquoise & Rani Pink Kasu',
    targetFile: 'blue pink.webp',
    colorName: 'Peacock Blue & Pink',
    colorHex: '#0096B7',
    hintKeywords: ['blue', 'pink', 'turquoise', 'kasu']
  },
  {
    id: 'prod-4',
    label: 'Shahi Plum Royal Violet Bangle Stack',
    targetFile: 'purple.webp',
    colorName: 'Royal Purple',
    colorHex: '#4A154B',
    hintKeywords: ['purple', 'violet', 'plum']
  }
];

export const OriginalPhotosManager: React.FC<OriginalPhotosManagerProps> = ({
  customUploadedImages,
  onBatchUpload,
  onSingleUpload,
  onResetPhoto,
  onResetAll,
  products
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [previewModalImg, setPreviewModalImg] = useState<{ src: string; title: string } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Count how many of the 4 original target products have photos applied
  const activeCount = ORIGINAL_TARGET_PRODUCTS.filter(target => !!customUploadedImages[target.id]).length;

  const handleFilesChosen = (files: FileList | File[]) => {
    const fileArray = Array.from(files);
    if (fileArray.length === 0) return;

    const mapped: Record<string, string> = {};
    let processedCount = 0;

    fileArray.forEach((file) => {
      const lowerName = file.name.toLowerCase();
      // Match by keyword or filename
      let matchedTarget = ORIGINAL_TARGET_PRODUCTS.find(target => 
        target.hintKeywords.some(keyword => lowerName.includes(keyword))
      );

      // If no match found by keyword, fallback to unmatched targets in order
      if (!matchedTarget) {
        const unmatched = ORIGINAL_TARGET_PRODUCTS.find(t => !mapped[t.id] && !customUploadedImages[t.id]);
        if (unmatched) matchedTarget = unmatched;
      }

      if (matchedTarget) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            mapped[matchedTarget!.id] = result;
          }
          processedCount++;
          if (processedCount === fileArray.length) {
            onBatchUpload(mapped);
            setStatusMessage(`Successfully synced ${Object.keys(mapped).length} original workshop image(s)!`);
            setTimeout(() => setStatusMessage(null), 5000);
          }
        };
        reader.readAsDataURL(file);
      } else {
        processedCount++;
      }
    });
  };

  return (
    <div className="w-full mb-8">
      {/* Sleek Luxury Banner for Workshop Photos & Equal Sizing */}
      <div className="bg-gradient-to-r from-[#114B3E] via-[#163830] to-[#2E1815] text-[#F4EFE6] rounded-2xl p-4 sm:p-5 shadow-lg border border-[#C59B27]/30 relative overflow-hidden">
        {/* Subtle decorative background pattern */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 rounded-full bg-[#C59B27]/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-[#C59B27]/20 border border-[#C59B27]/40 flex items-center justify-center shrink-0 text-[#E8D38B]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-serif-luxury font-bold text-base sm:text-lg text-white flex items-center gap-2">
                  Original Workshop Photos & Equal 1:1 Sizing
                </h3>
                <span className={`text-[10px] uppercase tracking-wider font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${
                  activeCount === 4 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-[#C59B27]/20 text-[#E8D38B] border border-[#C59B27]/40'
                }`}>
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  {activeCount} of 4 Original Images Active
                </span>
                <span className="text-[10px] text-white/70 bg-white/10 px-2 py-0.5 rounded-full border border-white/10">
                  Strict 1:1 Equal Ratio Guaranteed
                </span>
              </div>
              <p className="text-xs text-[#E5D7C7] mt-1 max-w-2xl font-light leading-relaxed">
                Seamlessly preview your 4 original silk thread bangle workshop photos: <strong className="text-white font-medium">Red Chooda</strong> (<code>Red (1).webp</code>), <strong className="text-white font-medium">Emerald Kada</strong> (<code>green.webp</code>), <strong className="text-white font-medium">Peacock Blue & Pink</strong> (<code>blue pink.webp</code>), and <strong className="text-white font-medium">Royal Purple</strong> (<code>purple.webp</code>). All images are locked to strict uniform square proportions across all devices.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 w-full md:w-auto shrink-0 flex-wrap">
            <input 
              type="file" 
              ref={fileInputRef} 
              multiple 
              accept="image/*" 
              className="hidden" 
              onChange={(e) => {
                if (e.target.files) handleFilesChosen(e.target.files);
              }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 md:flex-none px-4 py-2 rounded-xl bg-gradient-to-r from-[#C59B27] to-[#DFB33E] hover:from-[#DFB33E] hover:to-[#E8D38B] text-[#1A1816] font-semibold text-xs shadow-md flex items-center justify-center gap-2 transition active:scale-95"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Apply 4 Original Images</span>
            </button>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs border border-white/15 flex items-center justify-center gap-1.5 transition"
            >
              <Layers className="w-3.5 h-3.5 text-[#E8D38B]" />
              <span>{isOpen ? 'Close Manager' : 'Manage Photos'}</span>
            </button>
          </div>
        </div>

        {/* Status Toast Message */}
        {statusMessage && (
          <div className="mt-3 py-2 px-3 bg-emerald-500/20 border border-emerald-400/40 rounded-xl text-xs text-emerald-200 flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-300" />
            <span>{statusMessage}</span>
          </div>
        )}

        {/* Quick 4-Slot Thumbnail Preview Bar */}
        <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
          {ORIGINAL_TARGET_PRODUCTS.map((target) => {
            const hasCustom = !!customUploadedImages[target.id];
            const product = products.find(p => p.id === target.id);
            const imageSrc = customUploadedImages[target.id] || product?.image || '';

            return (
              <div 
                key={target.id}
                className="bg-black/25 hover:bg-black/40 rounded-xl p-2 border border-white/10 flex items-center gap-2.5 transition group"
              >
                <div 
                  className="w-12 h-12 rounded-lg overflow-hidden bg-white/5 border border-white/20 shrink-0 relative cursor-pointer"
                  style={{ aspectRatio: '1 / 1' }}
                  onClick={() => setPreviewModalImg({ src: imageSrc, title: target.label })}
                >
                  <img 
                    src={imageSrc} 
                    alt={target.label}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition"
                    style={{ aspectRatio: '1 / 1' }}
                  />
                  {hasCustom ? (
                    <span className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 rounded-full border border-white flex items-center justify-center" title="Original Photo Applied">
                      <Check className="w-2 h-2 text-white stroke-[3]" />
                    </span>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: target.colorHex }} />
                    <p className="text-[11px] font-bold text-white truncate">{target.colorName}</p>
                  </div>
                  <p className="text-[10px] text-white/60 truncate font-mono">
                    {target.targetFile}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span className={`text-[9px] font-medium px-1.5 py-0.2 rounded ${
                      hasCustom 
                        ? 'text-emerald-300 bg-emerald-950/60 border border-emerald-500/30' 
                        : 'text-[#E8D38B] bg-amber-950/60'
                    }`}>
                      {hasCustom ? 'Original' : '1:1 Ready'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Expanded Modal / Drawer for detailed image management */}
      {isOpen && (
        <div className="mt-4 p-5 sm:p-6 bg-white rounded-2xl border-2 border-[#E8D8C8] shadow-xl animate-fadeIn">
          <div className="flex items-center justify-between pb-4 border-b border-[#F0E6DA]">
            <div>
              <h4 className="font-serif-luxury font-bold text-lg text-[#1A1816] flex items-center gap-2">
                <Camera className="w-5 h-5 text-[#9A7416]" />
                Workshop Photos & 1:1 Equal Sizing Control Center
              </h4>
              <p className="text-xs text-[#8C7A6B] mt-0.5">
                Drop your original photos directly or upload individually. All product cards stay strictly equal in dimensions.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {activeCount > 0 && (
                <button
                  onClick={onResetAll}
                  className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 rounded-lg border border-red-200 flex items-center gap-1 transition"
                  title="Reset all photos to default"
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset All
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 text-[#8C7A6B] hover:text-[#1A1816] rounded-lg hover:bg-[#FAF7F2] transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Drag and Drop Zone */}
          <div 
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragOver(false);
              if (e.dataTransfer.files) handleFilesChosen(e.dataTransfer.files);
            }}
            className={`mt-4 border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
              isDragOver 
                ? 'border-[#9A7416] bg-[#FAF7F2]' 
                : 'border-[#E8D8C8] hover:border-[#C59B27] bg-[#FCFAF7]'
            }`}
          >
            <div className="w-12 h-12 rounded-full bg-[#FAF7F2] border border-[#E8D8C8] mx-auto flex items-center justify-center text-[#9A7416] mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h5 className="font-bold text-sm text-[#1A1816]">
              Drag & Drop all 4 Workshop Photos Here
            </h5>
            <p className="text-xs text-[#8C7A6B] mt-1 max-w-md mx-auto">
              Select or drop <code>blue pink.webp</code>, <code>green.webp</code>, <code>purple.webp</code>, and <code>Red (1).webp</code>. The system automatically associates each file with the corresponding product!
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-3.5 px-4 py-2 rounded-xl bg-[#114B3E] hover:bg-[#0D382E] text-white text-xs font-semibold shadow-sm inline-flex items-center gap-1.5 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              Browse 4 Files from Device
            </button>
          </div>

          {/* 4 Dedicated Slots Grid */}
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ORIGINAL_TARGET_PRODUCTS.map((target) => {
              const hasCustom = !!customUploadedImages[target.id];
              const product = products.find(p => p.id === target.id);
              const imageSrc = customUploadedImages[target.id] || product?.image || '';

              return (
                <div 
                  key={target.id}
                  className={`rounded-2xl p-4 border flex flex-col justify-between transition-all ${
                    hasCustom 
                      ? 'bg-emerald-50/50 border-emerald-300 shadow-sm' 
                      : 'bg-white border-[#E8D8C8]'
                  }`}
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="w-3 h-3 rounded-full border border-black/10 shrink-0" style={{ backgroundColor: target.colorHex }} />
                        <span className="text-xs font-bold text-[#1A1816] truncate">{target.colorName}</span>
                      </div>
                      <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        hasCustom 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-[#FAF7F2] text-[#8C7A6B] border border-[#E8D8C8]'
                      }`}>
                        {hasCustom ? 'Original Active' : 'Default Visual'}
                      </span>
                    </div>

                    {/* Image Preview Box - Strict 1:1 Square */}
                    <div 
                      className="relative aspect-square w-full rounded-xl overflow-hidden bg-[#FAF7F2] border border-[#E8D8C8] cursor-pointer group mb-3 flex items-center justify-center shrink-0"
                      style={{ aspectRatio: '1 / 1' }}
                      onClick={() => setPreviewModalImg({ src: imageSrc, title: target.label })}
                    >
                      <img 
                        src={imageSrc} 
                        alt={target.label}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                        style={{ aspectRatio: '1 / 1' }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <span className="text-white text-xs flex items-center gap-1 bg-black/60 px-2.5 py-1 rounded-full backdrop-blur">
                          <Maximize2 className="w-3 h-3" /> Zoom
                        </span>
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-[#1A1816] line-clamp-1">{target.label}</p>
                    <p className="text-[11px] text-[#8C7A6B] font-mono mt-0.5">Target: {target.targetFile}</p>
                  </div>

                  {/* Actions */}
                  <div className="pt-3 border-t border-[#F0E6DA] mt-3 flex items-center gap-2">
                    <label className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#FAF7F2] hover:bg-[#F3ECE2] text-xs font-semibold text-[#1A1816] border border-[#E8D8C8] cursor-pointer text-center flex items-center justify-center gap-1.5 transition">
                      <Camera className="w-3.5 h-3.5 text-[#9A7416]" />
                      <span>{hasCustom ? 'Replace' : 'Upload'}</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        className="hidden" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) onSingleUpload(target.id, file);
                        }}
                      />
                    </label>

                    {hasCustom && (
                      <button
                        onClick={() => onResetPhoto(target.id)}
                        className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 border border-slate-200 transition"
                        title="Reset this product to default image"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Full Size Modal Preview */}
      {previewModalImg && (
        <div 
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setPreviewModalImg(null)}
        >
          <div 
            className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl p-5 border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E6DA] mb-4">
              <h4 className="font-serif-luxury font-bold text-[#1A1816] text-base">{previewModalImg.title}</h4>
              <button 
                onClick={() => setPreviewModalImg(null)}
                className="p-1 rounded-full text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div 
              className="aspect-square w-full rounded-2xl overflow-hidden bg-[#FAF7F2] border border-[#E8D8C8] flex items-center justify-center"
              style={{ aspectRatio: '1 / 1' }}
            >
              <img 
                src={previewModalImg.src} 
                alt={previewModalImg.title} 
                className="w-full h-full object-cover object-center"
                style={{ aspectRatio: '1 / 1' }}
              />
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-[#8C7A6B]">
              <span>Strict 1:1 Square Aspect Ratio</span>
              <button
                onClick={() => setPreviewModalImg(null)}
                className="px-4 py-1.5 rounded-full bg-[#114B3E] text-white font-medium hover:bg-[#0D382E] transition"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
