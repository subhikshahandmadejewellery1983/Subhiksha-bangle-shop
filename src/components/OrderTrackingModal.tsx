import React, { useState, useMemo } from 'react';
import {
  Search,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  ExternalLink,
  Copy,
  Check,
  AlertCircle,
  MessageCircle,
  X,
  Sparkles,
  MapPin,
  Calendar,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { OrderRecord, getCarrierTrackingUrl } from '../services/googleSheetsService';

interface OrderTrackingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderRecord[];
  isGoogleSheetsConnected?: boolean;
  activeSpreadsheetName?: string;
  onOpenGoogleSheetsHub?: () => void;
  initialOrderId?: string;
}

export const OrderTrackingModal: React.FC<OrderTrackingModalProps> = ({
  isOpen,
  onClose,
  orders,
  isGoogleSheetsConnected = false,
  activeSpreadsheetName,
  onOpenGoogleSheetsHub,
  initialOrderId = ''
}) => {
  const [searchTerm, setSearchTerm] = useState(initialOrderId || '');
  const [copiedTracking, setCopiedTracking] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(Boolean(initialOrderId));

  // Find matching order
  const foundOrder = useMemo(() => {
    if (!searchTerm.trim()) return null;
    const term = searchTerm.trim().toLowerCase();
    return orders.find(
      (o) =>
        o.orderId.toLowerCase() === term ||
        o.trackingNumber.toLowerCase() === term ||
        o.phone.replace(/[^0-9]/g, '').includes(term.replace(/[^0-9]/g, '')) ||
        (term.length >= 3 && o.customerName.toLowerCase().includes(term))
    );
  }, [searchTerm, orders]);

  if (!isOpen) return null;

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedTracking(text);
    setTimeout(() => setCopiedTracking(null), 2500);
  };

  const getStatusColor = (status: OrderRecord['status']) => {
    switch (status) {
      case 'Delivered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'Out for Delivery':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'In Transit':
      case 'Dispatched':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'Handcrafting':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-300';
    }
  };

  // 5 Step Timeline:
  // 1: Order Placed
  // 2: Handcrafting with Pure Silk
  // 3: Quality Check & Keepsake Box Packing
  // 4: Dispatched & Tracking Assigned
  // 5: Delivered
  const getTimelineSteps = (status: OrderRecord['status']) => {
    let currentStep = 1;
    if (status === 'Handcrafting') currentStep = 2;
    else if (status === 'Dispatched') currentStep = 4;
    else if (status === 'In Transit') currentStep = 4;
    else if (status === 'Out for Delivery') currentStep = 4;
    else if (status === 'Delivered') currentStep = 5;

    return [
      { step: 1, label: 'Order Confirmed', desc: 'Silk color & size verified' },
      { step: 2, label: 'Artisan Handcrafting', desc: 'Hand-wrapped Mulberry silk & stone setting' },
      { step: 3, label: 'Boxed & Sealed', desc: 'Keepsake velvet presentation packaging' },
      { step: 4, label: 'Dispatched with Tracking', desc: 'Handed over to courier partner' },
      { step: 5, label: 'Delivered', desc: 'At customer doorstep' }
    ].map((s) => ({
      ...s,
      isCompleted: s.step <= currentStep,
      isCurrent: s.step === currentStep
    }));
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#FAF7F2] rounded-3xl max-w-2xl w-full border border-[#E8D8C8] shadow-2xl overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
        {/* Header Strip */}
        <div className="bg-[#114B3E] px-6 py-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/10 border border-white/20 text-[#E8D38B]">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif-luxury font-bold text-xl tracking-wide text-white">
                  Order & Tracking Status
                </h3>
                {isGoogleSheetsConnected && (
                  <span className="text-[10px] bg-emerald-500/20 text-emerald-200 border border-emerald-400/30 px-2 py-0.5 rounded-full flex items-center gap-1 font-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                    Live Google Sheet
                  </span>
                )}
              </div>
              <p className="text-xs text-white/80">
                Subhiksha Homemade Jewellery • Real-Time Consignment Tracking
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-white/80 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Search Box */}
          <div className="mb-6">
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#68625B] mb-2">
              Enter Order ID or Customer Phone Number
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setHasSearched(true);
                  }}
                  placeholder="e.g. SBK-1082, EL928471920IN, or 98401 23456"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-[#E8D8C8] text-sm text-[#1A1816] placeholder-[#A89E94] focus:outline-none focus:border-[#C59B27] focus:ring-2 focus:ring-[#C59B27]/20 transition"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') setHasSearched(true);
                  }}
                />
                {searchTerm && (
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setHasSearched(false);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C7A6B] hover:text-[#1A1816] text-xs p-1"
                  >
                    Clear
                  </button>
                )}
              </div>
              <button
                onClick={() => setHasSearched(true)}
                className="px-5 py-2.5 rounded-xl bg-[#114B3E] hover:bg-[#0D382E] text-white text-xs font-semibold uppercase tracking-wider transition shadow-sm flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Track</span>
              </button>
            </div>

            {/* Quick Demo Chips */}
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-xs text-[#8C7A6B]">
              <span className="text-[11px] font-medium">Try Sample Orders:</span>
              {orders.slice(0, 4).map((o) => (
                <button
                  key={o.orderId}
                  onClick={() => {
                    setSearchTerm(o.orderId);
                    setHasSearched(true);
                  }}
                  className="px-2.5 py-1 rounded-full bg-white hover:bg-[#F2ECE3] border border-[#E8D8C8] text-[11px] font-mono text-[#1A1816] hover:text-[#9A7416] transition"
                >
                  {o.orderId}
                </button>
              ))}
            </div>
          </div>

          {/* Search Result */}
          {foundOrder ? (
            <div className="space-y-6">
              {/* Order Overview Card */}
              <div className="bg-white rounded-2xl p-5 border border-[#E8D8C8] shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0E6DA]">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-lg text-[#1A1816]">
                        #{foundOrder.orderId}
                      </span>
                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${getStatusColor(
                          foundOrder.status
                        )}`}
                      >
                        {foundOrder.status}
                      </span>
                    </div>
                    <p className="text-xs text-[#68625B] mt-0.5">
                      Recipient: <strong className="text-[#1A1816]">{foundOrder.customerName}</strong>
                      {foundOrder.destination && ` • ${foundOrder.destination}`}
                    </p>
                  </div>

                  {foundOrder.dispatchDate && (
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C7A6B] block">
                        Dispatched On
                      </span>
                      <span className="text-xs font-semibold text-[#1A1816]">
                        {foundOrder.dispatchDate}
                      </span>
                    </div>
                  )}
                </div>

                {/* Items Description */}
                <div className="py-3 flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-[#FAF7F2] border border-[#E8D8C8] text-[#9A7416] shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-[#1A1816]">{foundOrder.items}</h4>
                    <p className="text-[11px] text-[#68625B]">
                      {foundOrder.size && `Size: ${foundOrder.size} • `}
                      {foundOrder.quantity && `Qty: ${foundOrder.quantity} • `}
                      {foundOrder.totalAmount && `₹${foundOrder.totalAmount}`}
                    </p>
                  </div>
                </div>

                {/* Tracking Number Highlight Box */}
                <div className="mt-2 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8D8C8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C7A6B] block">
                      Courier &amp; Tracking Number
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs font-semibold text-[#114B3E]">
                        {foundOrder.carrier}
                      </span>
                      <span className="text-slate-300">|</span>
                      <span className="font-mono font-bold text-sm text-[#1A1816]">
                        {foundOrder.trackingNumber}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(foundOrder.trackingNumber)}
                      className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 border border-[#E8D8C8] text-xs font-semibold text-[#1A1816] flex items-center gap-1.5 transition shadow-sm"
                      title="Copy Tracking Number"
                    >
                      {copiedTracking === foundOrder.trackingNumber ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-[#8C7A6B]" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>

                    <a
                      href={foundOrder.trackingUrl || getCarrierTrackingUrl(foundOrder.carrier, foundOrder.trackingNumber)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3.5 py-1.5 rounded-lg bg-[#114B3E] hover:bg-[#0D382E] text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-sm"
                    >
                      <span>Track on Courier Site</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Progress Timeline */}
              <div className="bg-white rounded-2xl p-5 border border-[#E8D8C8] shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1816] mb-4 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-[#9A7416]" />
                  <span>Shipment Milestone Timeline</span>
                </h4>

                <div className="space-y-4 relative before:absolute before:left-3.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E8D8C8]">
                  {getTimelineSteps(foundOrder.status).map((s) => (
                    <div key={s.step} className="flex items-start gap-3 relative z-10">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition ${
                          s.isCompleted
                            ? 'bg-[#114B3E] text-white ring-4 ring-[#FAF7F2]'
                            : 'bg-white border-2 border-[#D1C2B4] text-[#A89E94] ring-4 ring-[#FAF7F2]'
                        }`}
                      >
                        {s.isCompleted ? <Check className="w-4 h-4" /> : s.step}
                      </div>
                      <div className="flex-1 pt-0.5">
                        <div className="flex items-center justify-between">
                          <h5
                            className={`text-xs font-bold ${
                              s.isCompleted ? 'text-[#1A1816]' : 'text-[#8C7A6B]'
                            }`}
                          >
                            {s.label}
                          </h5>
                          {s.isCurrent && (
                            <span className="text-[10px] font-semibold text-[#114B3E] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                              Current Status
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#68625B] mt-0.5">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* WhatsApp Support Action */}
              <div className="p-4 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-full bg-[#25D366] text-white">
                    <MessageCircle className="w-5 h-5" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-[#0D382E]">Need Help with This Order?</h5>
                    <p className="text-[11px] text-[#075E54]">
                      Connect directly with Subhiksha artisan line on WhatsApp (+91 90807 89855).
                    </p>
                  </div>
                </div>
                <a
                  href={`https://wa.me/919080789855?text=${encodeURIComponent(
                    `Hello Subhiksha Homemade Jewellery, I have an inquiry regarding my order #${foundOrder.orderId} (Tracking: ${foundOrder.trackingNumber}). Could you please update me?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold tracking-wide flex items-center justify-center gap-1.5 transition shadow"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp Artisan</span>
                </a>
              </div>
            </div>
          ) : hasSearched && searchTerm ? (
            <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-[#D1C2B4] p-6">
              <AlertCircle className="w-10 h-10 text-[#C59B27] mx-auto mb-3" />
              <h4 className="font-serif-luxury font-bold text-lg text-[#1A1816] mb-1">
                No Order Found for "{searchTerm}"
              </h4>
              <p className="text-xs text-[#68625B] max-w-sm mx-auto mb-4 leading-relaxed">
                Please verify the Order ID (e.g. <code>SBK-1082</code>) or the 10-digit mobile number used when placing your WhatsApp order.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <a
                  href={`https://wa.me/919080789855?text=${encodeURIComponent(
                    `Hello Subhiksha Homemade Jewellery, I placed an order with details "${searchTerm}". Could you please check my order status and tracking number?`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-[#25D366] text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>Inquire on WhatsApp</span>
                </a>
                {onOpenGoogleSheetsHub && (
                  <button
                    onClick={() => {
                      onClose();
                      onOpenGoogleSheetsHub();
                    }}
                    className="px-4 py-2 rounded-xl bg-white border border-[#E8D8C8] text-[#1A1816] text-xs font-semibold flex items-center gap-1.5 hover:bg-slate-50"
                  >
                    <span>Check Google Sheets Hub</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6 border border-[#E8D8C8] text-center">
              <Package className="w-10 h-10 text-[#9A7416] mx-auto mb-2" />
              <h4 className="font-serif-luxury font-bold text-base text-[#1A1816] mb-1">
                Real-Time Consignment Lookup
              </h4>
              <p className="text-xs text-[#68625B] max-w-md mx-auto leading-relaxed">
                Track your handcrafted silk thread bangles from our artisan workshop to your doorstep with live dispatch updates from our official Google Sheets order dispatch log.
              </p>
            </div>
          )}

          {/* Sync Information / Admin link */}
          <div className="mt-5 pt-4 border-t border-[#E8D8C8] flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#8C7A6B] gap-2">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {isGoogleSheetsConnected
                  ? `Synced with Google Sheet: "${activeSpreadsheetName || 'Orders'}"`
                  : 'Currently showing store sample dispatch records'}
              </span>
            </span>

            {onOpenGoogleSheetsHub && (
              <button
                onClick={() => {
                  onClose();
                  onOpenGoogleSheetsHub();
                }}
                className="text-[#9A7416] hover:text-[#1A1816] font-semibold underline flex items-center gap-1"
              >
                <span>Artisan Google Sheets Hub</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
