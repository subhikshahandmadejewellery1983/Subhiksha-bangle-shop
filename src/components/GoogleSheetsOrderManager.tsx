import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  RefreshCw,
  Plus,
  ExternalLink,
  Search,
  CheckCircle2,
  Clock,
  Truck,
  AlertTriangle,
  User as UserIcon,
  LogOut,
  ChevronDown,
  ChevronRight,
  Sparkles,
  MessageCircle,
  Copy,
  Check,
  Filter,
  Layers,
  Settings,
  Shield,
  HelpCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import { User } from 'firebase/auth';
import { GoogleSignInButton } from './GoogleSignInButton';
import { googleSignIn, logout, getAccessToken } from '../services/googleAuth';
import {
  DriveSpreadsheet,
  SheetTab,
  OrderRecord,
  ColumnMapping,
  listDriveSpreadsheets,
  getSpreadsheetTabs,
  readSheetValues,
  parseRowsToOrders,
  createSubhikshaOrdersTemplate,
  appendOrderToSheet,
  getCarrierTrackingUrl
} from '../services/googleSheetsService';

interface GoogleSheetsOrderManagerProps {
  user: User | null;
  onUserChange: (user: User | null) => void;
  onOrdersSynced: (orders: OrderRecord[], spreadsheetTitle: string) => void;
  initialOrders: OrderRecord[];
}

export const GoogleSheetsOrderManager: React.FC<GoogleSheetsOrderManagerProps> = ({
  user,
  onUserChange,
  onOrdersSynced,
  initialOrders
}) => {
  // Authentication & Loading States
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Spreadsheet Selection States
  const [driveSheets, setDriveSheets] = useState<DriveSpreadsheet[]>([]);
  const [isLoadingSheets, setIsLoadingSheets] = useState(false);
  const [selectedSpreadsheetId, setSelectedSpreadsheetId] = useState<string>('');
  const [customSpreadsheetInput, setCustomSpreadsheetInput] = useState<string>('');
  const [spreadsheetTitle, setSpreadsheetTitle] = useState<string>('');
  const [sheetTabs, setSheetTabs] = useState<SheetTab[]>([]);
  const [selectedTab, setSelectedTab] = useState<string>('');

  // Data & Parsing States
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [rawRows, setRawRows] = useState<string[][]>([]);
  const [sheetHeaders, setSheetHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping | null>(null);
  const [orders, setOrders] = useState<OrderRecord[]>(initialOrders);
  const [showMappingSettings, setShowMappingSettings] = useState(false);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // User Confirmation Modals (Mandatory for Workspace mutating actions)
  const [confirmTemplateModal, setConfirmTemplateModal] = useState(false);
  const [isCreatingTemplate, setIsCreatingTemplate] = useState(false);
  const [templateSuccessUrl, setTemplateSuccessUrl] = useState<string | null>(null);

  const [confirmAddModal, setConfirmAddModal] = useState(false);
  const [isAddingOrder, setIsAddingOrder] = useState(false);
  const [newOrderForm, setNewOrderForm] = useState({
    orderId: `SBK-${Math.floor(1000 + Math.random() * 9000)}`,
    customerName: '',
    phone: '',
    trackingNumber: '',
    carrier: 'India Post Speed Post',
    status: 'Dispatched' as OrderRecord['status'],
    items: 'Handcrafted Silk Thread Bangles Set',
    destination: 'India',
    totalAmount: 1999
  });

  // Load user spreadsheets when authenticated
  useEffect(() => {
    if (user) {
      loadDriveFiles();
    }
  }, [user]);

  // Load spreadsheets from Google Drive
  const loadDriveFiles = async () => {
    setIsLoadingSheets(true);
    setAuthError(null);
    try {
      const files = await listDriveSpreadsheets();
      setDriveSheets(files);

      // Auto-select if there is an existing "Orders" or "Subhiksha" sheet
      if (files.length > 0) {
        const found = files.find(f => 
          f.name.toLowerCase().includes('order') || 
          f.name.toLowerCase().includes('subhiksha') || 
          f.name.toLowerCase().includes('tracking')
        ) || files[0];
        
        if (found) {
          handleSelectSpreadsheet(found.id);
        }
      }
    } catch (err: any) {
      console.error('Failed to list drive spreadsheets:', err);
      setAuthError(err.message || 'Failed to list Google Drive files');
    } finally {
      setIsLoadingSheets(false);
    }
  };

  // Sign in handler
  const handleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        onUserChange(result.user);
      }
    } catch (err: any) {
      console.error('Sign in failed:', err);
      setAuthError(err.message || 'Google Sign-In failed. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };

  // Sign out handler
  const handleSignOut = async () => {
    await logout();
    onUserChange(null);
    setDriveSheets([]);
    setSelectedSpreadsheetId('');
    setSpreadsheetTitle('');
    setSheetTabs([]);
    setSelectedTab('');
  };

  // Select spreadsheet and fetch its tabs
  const handleSelectSpreadsheet = async (sheetId: string) => {
    if (!sheetId) return;
    setSelectedSpreadsheetId(sheetId);
    setIsLoadingData(true);
    setAuthError(null);

    try {
      const meta = await getSpreadsheetTabs(sheetId);
      setSpreadsheetTitle(meta.title);
      setSheetTabs(meta.tabs);

      const firstTab = meta.tabs[0]?.title || 'Sheet1';
      setSelectedTab(firstTab);

      // Fetch data for the first tab
      await fetchTabData(sheetId, firstTab);
    } catch (err: any) {
      console.error('Failed to load spreadsheet details:', err);
      setAuthError(err.message || 'Failed to load spreadsheet');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Extract Spreadsheet ID from custom input / URL
  const handleApplyCustomSpreadsheet = () => {
    let cleanId = customSpreadsheetInput.trim();
    if (!cleanId) return;

    // Check if user pasted full URL (e.g. https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit)
    const match = cleanId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (match && match[1]) {
      cleanId = match[1];
    }

    handleSelectSpreadsheet(cleanId);
  };

  // Fetch and parse tab data
  const fetchTabData = async (sheetId: string, tabName: string) => {
    setIsLoadingData(true);
    setAuthError(null);
    try {
      const values = await readSheetValues(sheetId, tabName);
      setRawRows(values);

      if (values.length > 0) {
        const parsed = parseRowsToOrders(values);
        setSheetHeaders(parsed.headers);
        setColumnMapping(parsed.mapping);
        setOrders(parsed.orders);
        onOrdersSynced(parsed.orders, spreadsheetTitle || 'Google Sheet');
      } else {
        setOrders([]);
        onOrdersSynced([], spreadsheetTitle || 'Google Sheet');
      }
    } catch (err: any) {
      console.error('Failed to read tab values:', err);
      setAuthError(err.message || 'Failed to read data from sheet tab');
    } finally {
      setIsLoadingData(false);
    }
  };

  // Refresh current sheet data
  const handleRefreshData = () => {
    if (selectedSpreadsheetId && selectedTab) {
      fetchTabData(selectedSpreadsheetId, selectedTab);
    }
  };

  // Re-parse when user customizes column mapping
  const handleUpdateMapping = (field: keyof ColumnMapping, colIndex: number) => {
    if (!columnMapping) return;
    const updated = { ...columnMapping, [field]: colIndex };
    setColumnMapping(updated);
    const parsed = parseRowsToOrders(rawRows, updated);
    setOrders(parsed.orders);
    onOrdersSynced(parsed.orders, spreadsheetTitle || 'Google Sheet');
  };

  // Create Template Confirmation Action
  const handleCreateTemplateConfirmed = async () => {
    setIsCreatingTemplate(true);
    try {
      const res = await createSubhikshaOrdersTemplate();
      setTemplateSuccessUrl(res.spreadsheetUrl);
      setConfirmTemplateModal(false);
      // Reload user spreadsheets and select newly created one
      await loadDriveFiles();
      handleSelectSpreadsheet(res.spreadsheetId);
    } catch (err: any) {
      alert(`Error creating template: ${err.message}`);
    } finally {
      setIsCreatingTemplate(false);
    }
  };

  // Add Order Confirmation Action
  const handleAddOrderConfirmed = async () => {
    if (!selectedSpreadsheetId || !selectedTab) return;
    setIsAddingOrder(true);
    try {
      const record: OrderRecord = {
        orderId: newOrderForm.orderId,
        customerName: newOrderForm.customerName || 'Customer',
        phone: newOrderForm.phone,
        trackingNumber: newOrderForm.trackingNumber || 'Pending Allocation',
        carrier: newOrderForm.carrier,
        status: newOrderForm.status,
        items: newOrderForm.items,
        destination: newOrderForm.destination,
        totalAmount: Number(newOrderForm.totalAmount) || 0,
        dispatchDate: new Date().toISOString().split('T')[0]
      };

      await appendOrderToSheet(selectedSpreadsheetId, selectedTab, record);
      setConfirmAddModal(false);
      // Reset form
      setNewOrderForm({
        orderId: `SBK-${Math.floor(1000 + Math.random() * 9000)}`,
        customerName: '',
        phone: '',
        trackingNumber: '',
        carrier: 'India Post Speed Post',
        status: 'Dispatched',
        items: 'Handcrafted Silk Thread Bangles Set',
        destination: 'India',
        totalAmount: 1999
      });
      // Refresh sheet data
      await fetchTabData(selectedSpreadsheetId, selectedTab);
    } catch (err: any) {
      alert(`Failed to add order to sheet: ${err.message}`);
    } finally {
      setIsAddingOrder(false);
    }
  };

  // Filter orders
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      searchQuery === '' ||
      o.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.phone.includes(searchQuery);

    const matchesStatus = statusFilter === 'All' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E8D8C8] shadow-sm overflow-hidden">
      {/* 1. Header Banner */}
      <div className="bg-[#114B3E] p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-[#E8D38B]/20 text-[#E8D38B] border border-[#E8D38B]/30">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-serif-luxury font-bold text-2xl tracking-wide text-white">
                Google Sheets Orders &amp; Tracking Hub
              </h2>
              <span className="text-[10px] uppercase font-bold tracking-widest bg-[#E8D38B] text-[#114B3E] px-2 py-0.5 rounded-full">
                Workspace
              </span>
            </div>
            <p className="text-xs text-white/80 mt-0.5">
              Sync customer order IDs, courier tracking numbers, and delivery statuses directly from your Google Drive spreadsheet
            </p>
          </div>
        </div>

        {/* User Status / Connect Button */}
        <div>
          {user ? (
            <div className="flex items-center gap-3 bg-white/10 px-4 py-2 rounded-2xl border border-white/20">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Artisan'}
                  className="w-8 h-8 rounded-full border border-[#E8D38B]"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#E8D38B] text-[#114B3E] flex items-center justify-center font-bold text-xs">
                  {user.email?.[0].toUpperCase() || 'A'}
                </div>
              )}
              <div className="text-left text-xs">
                <p className="font-semibold text-white leading-tight truncate max-w-[160px]">
                  {user.displayName || 'Subhiksha Artisan'}
                </p>
                <p className="text-[10px] text-white/70 font-mono truncate max-w-[160px]">
                  {user.email}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="p-1.5 rounded-lg hover:bg-white/20 text-white/80 hover:text-white transition ml-1"
                title="Disconnect Google Account"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <GoogleSignInButton
              onClick={handleSignIn}
              loading={isSigningIn}
              label="Connect Google Drive & Sheets"
            />
          )}
        </div>
      </div>

      {authError && (
        <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>{authError}</span>
        </div>
      )}

      {/* 2. Spreadsheet Selector & Actions Bar */}
      <div className="p-6 bg-[#FAF7F2] border-b border-[#E8D8C8]">
        {user ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
              {/* Drive Spreadsheets Dropdown */}
              <div className="md:col-span-5">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#68625B] mb-1.5 flex items-center justify-between">
                  <span>Select Google Drive Spreadsheet</span>
                  <button
                    onClick={loadDriveFiles}
                    disabled={isLoadingSheets}
                    className="text-[#9A7416] hover:text-[#1A1816] flex items-center gap-1 normal-case text-[11px]"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoadingSheets ? 'animate-spin' : ''}`} />
                    <span>Refresh Drive</span>
                  </button>
                </label>
                <select
                  value={selectedSpreadsheetId}
                  onChange={(e) => handleSelectSpreadsheet(e.target.value)}
                  disabled={isLoadingSheets}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8D8C8] text-xs font-medium text-[#1A1816] focus:outline-none focus:border-[#C59B27]"
                >
                  <option value="">-- Choose a Spreadsheet from your Drive --</option>
                  {driveSheets.map((sheet) => (
                    <option key={sheet.id} value={sheet.id}>
                      {sheet.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Tab Selector */}
              <div className="md:col-span-3">
                <label className="block text-xs font-semibold uppercase tracking-wider text-[#68625B] mb-1.5">
                  Sheet Tab
                </label>
                <select
                  value={selectedTab}
                  onChange={(e) => {
                    setSelectedTab(e.target.value);
                    if (selectedSpreadsheetId) {
                      fetchTabData(selectedSpreadsheetId, e.target.value);
                    }
                  }}
                  disabled={sheetTabs.length === 0 || isLoadingData}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white border border-[#E8D8C8] text-xs font-medium text-[#1A1816] focus:outline-none focus:border-[#C59B27]"
                >
                  {sheetTabs.map((tab) => (
                    <option key={tab.sheetId} value={tab.title}>
                      {tab.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Refresh / Actions */}
              <div className="md:col-span-4 flex items-center gap-2">
                <button
                  onClick={handleRefreshData}
                  disabled={!selectedSpreadsheetId || isLoadingData}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#114B3E] hover:bg-[#0D382E] disabled:bg-slate-300 text-white text-xs font-semibold uppercase tracking-wider transition flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
                  <span>{isLoadingData ? 'Syncing...' : 'Sync Sheet'}</span>
                </button>

                <button
                  onClick={() => setConfirmAddModal(true)}
                  disabled={!selectedSpreadsheetId}
                  className="px-3.5 py-2.5 rounded-xl bg-white border border-[#C59B27] text-[#9A7416] hover:bg-[#FAF7F2] disabled:opacity-50 text-xs font-semibold transition flex items-center gap-1 shadow-sm"
                  title="Add New Order to Google Sheet"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Add Order</span>
                </button>

                {selectedSpreadsheetId && (
                  <a
                    href={`https://docs.google.com/spreadsheets/d/${selectedSpreadsheetId}/edit`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-white border border-[#E8D8C8] hover:bg-slate-50 text-[#68625B] hover:text-[#1A1816] transition shadow-sm"
                    title="Open Spreadsheet in Google Sheets"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>

            {/* Custom Spreadsheet ID or Create Template Strip */}
            <div className="pt-3 border-t border-[#E8D8C8] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 flex-1 max-w-md">
                <input
                  type="text"
                  value={customSpreadsheetInput}
                  onChange={(e) => setCustomSpreadsheetInput(e.target.value)}
                  placeholder="Or paste Google Sheets URL / Spreadsheet ID..."
                  className="flex-1 px-3 py-1.5 rounded-lg bg-white border border-[#E8D8C8] text-xs text-[#1A1816] focus:outline-none focus:border-[#C59B27]"
                />
                <button
                  onClick={handleApplyCustomSpreadsheet}
                  className="px-3 py-1.5 rounded-lg bg-white border border-[#E8D8C8] hover:bg-slate-50 text-[#1A1816] font-semibold transition"
                >
                  Load
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setConfirmTemplateModal(true)}
                  className="text-xs text-[#114B3E] hover:underline font-semibold flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-[#C59B27]" />
                  <span>Create Subhiksha Orders Sheet Template in My Drive</span>
                </button>

                {sheetHeaders.length > 0 && (
                  <button
                    onClick={() => setShowMappingSettings(!showMappingSettings)}
                    className="text-xs text-[#68625B] hover:text-[#1A1816] flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#E8D8C8] bg-white"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Column Mapping</span>
                  </button>
                )}
              </div>
            </div>

            {/* Optional Column Mapping Configuration Accordion */}
            {showMappingSettings && columnMapping && sheetHeaders.length > 0 && (
              <div className="mt-3 p-4 rounded-2xl bg-white border border-[#E8D8C8] space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-[#1A1816] uppercase tracking-wider flex items-center gap-1.5">
                    <Settings className="w-3.5 h-3.5 text-[#9A7416]" />
                    <span>Map Spreadsheet Columns</span>
                  </h4>
                  <span className="text-[11px] text-[#8C7A6B]">
                    Smart auto-detected from row 1
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-[#68625B] mb-1">
                      Order ID Column
                    </label>
                    <select
                      value={columnMapping.orderIdCol}
                      onChange={(e) => handleUpdateMapping('orderIdCol', Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#E8D8C8] bg-[#FAF7F2] text-xs"
                    >
                      {sheetHeaders.map((h, idx) => (
                        <option key={idx} value={idx}>
                          Col {idx + 1}: {h || `Column ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#68625B] mb-1">
                      Tracking # Column
                    </label>
                    <select
                      value={columnMapping.trackingCol}
                      onChange={(e) => handleUpdateMapping('trackingCol', Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#E8D8C8] bg-[#FAF7F2] text-xs"
                    >
                      {sheetHeaders.map((h, idx) => (
                        <option key={idx} value={idx}>
                          Col {idx + 1}: {h || `Column ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#68625B] mb-1">
                      Customer Name Column
                    </label>
                    <select
                      value={columnMapping.customerCol}
                      onChange={(e) => handleUpdateMapping('customerCol', Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#E8D8C8] bg-[#FAF7F2] text-xs"
                    >
                      {sheetHeaders.map((h, idx) => (
                        <option key={idx} value={idx}>
                          Col {idx + 1}: {h || `Column ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-[#68625B] mb-1">
                      Courier / Carrier Column
                    </label>
                    <select
                      value={columnMapping.carrierCol}
                      onChange={(e) => handleUpdateMapping('carrierCol', Number(e.target.value))}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#E8D8C8] bg-[#FAF7F2] text-xs"
                    >
                      {sheetHeaders.map((h, idx) => (
                        <option key={idx} value={idx}>
                          Col {idx + 1}: {h || `Column ${idx + 1}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <div>
              <h3 className="font-serif-luxury font-bold text-lg text-[#1A1816]">
                Connect Google Account to Read Live Order Tracking
              </h3>
              <p className="text-xs text-[#68625B] max-w-xl">
                Sign in with your store Google account (<code>subhikshahandmadejewellery@gmail.com</code>) with permission to load your customer order tracking spreadsheet directly.
              </p>
            </div>
            <GoogleSignInButton onClick={handleSignIn} loading={isSigningIn} />
          </div>
        )}
      </div>

      {/* 3. Orders Statistics Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-6 border-b border-[#E8D8C8] bg-white">
        <div className="p-3.5 rounded-2xl bg-[#FAF7F2] border border-[#E8D8C8]">
          <span className="text-[10px] uppercase font-bold tracking-wider text-[#8C7A6B] block">
            Total Synced Orders
          </span>
          <span className="font-serif-luxury font-bold text-2xl text-[#1A1816]">
            {orders.length}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-amber-50/60 border border-amber-200/80">
          <span className="text-[10px] uppercase font-bold tracking-wider text-amber-800 block">
            In Transit / Dispatched
          </span>
          <span className="font-serif-luxury font-bold text-2xl text-amber-900">
            {orders.filter((o) => o.status === 'Dispatched' || o.status === 'In Transit').length}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-200/80">
          <span className="text-[10px] uppercase font-bold tracking-wider text-blue-800 block">
            Out for Delivery
          </span>
          <span className="font-serif-luxury font-bold text-2xl text-blue-900">
            {orders.filter((o) => o.status === 'Out for Delivery').length}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/80">
          <span className="text-[10px] uppercase font-bold tracking-wider text-emerald-800 block">
            Delivered
          </span>
          <span className="font-serif-luxury font-bold text-2xl text-emerald-900">
            {orders.filter((o) => o.status === 'Delivered').length}
          </span>
        </div>
      </div>

      {/* 4. Filter & Search Controls */}
      <div className="p-6 border-b border-[#E8D8C8] flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8C7A6B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by Order ID, tracking #, customer name..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-[#FAF7F2] border border-[#E8D8C8] text-xs text-[#1A1816] placeholder-[#A89E94] focus:outline-none focus:border-[#C59B27]"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
          <span className="text-[11px] font-semibold text-[#8C7A6B] uppercase tracking-wider flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" />
            Status:
          </span>
          {[
            'All',
            'Dispatched',
            'In Transit',
            'Out for Delivery',
            'Delivered',
            'Handcrafting'
          ].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                statusFilter === st
                  ? 'bg-[#114B3E] text-white shadow-sm'
                  : 'bg-[#FAF7F2] border border-[#E8D8C8] text-[#68625B] hover:text-[#1A1816]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* 5. Orders Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-[#FAF7F2] border-b border-[#E8D8C8] text-[11px] uppercase tracking-wider text-[#68625B]">
              <th className="py-3 px-4 font-semibold">Order ID</th>
              <th className="py-3 px-4 font-semibold">Tracking Number</th>
              <th className="py-3 px-4 font-semibold">Courier Carrier</th>
              <th className="py-3 px-4 font-semibold">Customer &amp; Phone</th>
              <th className="py-3 px-4 font-semibold">Handmade Items</th>
              <th className="py-3 px-4 font-semibold">Status</th>
              <th className="py-3 px-4 font-semibold">Dispatched</th>
              <th className="py-3 px-4 font-semibold text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F0E6DA]">
            {filteredOrders.length > 0 ? (
              filteredOrders.map((order, idx) => {
                const trackingUrl =
                  order.trackingUrl || getCarrierTrackingUrl(order.carrier, order.trackingNumber);

                return (
                  <tr
                    key={order.orderId || idx}
                    className="hover:bg-[#FAF7F2]/60 transition group"
                  >
                    {/* Order ID */}
                    <td className="py-3.5 px-4 font-mono font-bold text-[#1A1816]">
                      {order.orderId}
                    </td>

                    {/* Tracking Number with Copy */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-semibold text-[#114B3E] bg-[#114B3E]/5 px-2 py-0.5 rounded border border-[#114B3E]/10">
                          {order.trackingNumber}
                        </span>
                        {order.trackingNumber && (
                          <button
                            onClick={() => handleCopy(order.orderId, order.trackingNumber)}
                            className="text-[#8C7A6B] hover:text-[#1A1816] p-1 transition"
                            title="Copy Tracking Number"
                          >
                            {copiedId === order.orderId ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Carrier */}
                    <td className="py-3.5 px-4">
                      <span className="font-medium text-[#1A1816]">{order.carrier}</span>
                    </td>

                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-[#1A1816]">{order.customerName}</div>
                      {order.phone && (
                        <div className="text-[11px] text-[#8C7A6B] font-mono">{order.phone}</div>
                      )}
                    </td>

                    {/* Items */}
                    <td className="py-3.5 px-4 max-w-xs">
                      <div className="truncate text-[#1A1816]" title={order.items}>
                        {order.items}
                      </div>
                      {order.destination && (
                        <div className="text-[10px] text-[#8C7A6B] truncate">
                          To: {order.destination}
                        </div>
                      )}
                    </td>

                    {/* Status */}
                    <td className="py-3.5 px-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          order.status === 'Delivered'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : order.status === 'Out for Delivery'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : order.status === 'In Transit' || order.status === 'Dispatched'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : order.status === 'Handcrafting'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : 'bg-slate-50 text-slate-700 border-slate-200'
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>

                    {/* Dispatch Date */}
                    <td className="py-3.5 px-4 text-[#68625B]">
                      {order.dispatchDate || '—'}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Courier Link */}
                        <a
                          href={trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg border border-[#E8D8C8] bg-white hover:bg-slate-50 text-[#114B3E] transition"
                          title="Open Carrier Tracking Page"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>

                        {/* WhatsApp update message to customer */}
                        {order.phone && (
                          <a
                            href={`https://wa.me/${order.phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                              `Hello ${order.customerName}! Greetings from Subhiksha Homemade Jewellery ✨\n\nYour handcrafted silk thread bangles order #${order.orderId} has been dispatched!\n\n• Carrier: ${order.carrier}\n• Tracking Number: ${order.trackingNumber}\n• Items: ${order.items}\n\nTrack your shipment directly here: ${trackingUrl}\n\nThank you for supporting handloom silk jewellery!`
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-[#25D366]/15 hover:bg-[#25D366] text-[#075E54] hover:text-white transition border border-[#25D366]/30"
                            title="Send Tracking Info to Customer via WhatsApp"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-10 text-center text-[#8C7A6B]">
                  No orders found matching the filter or search query.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mandatory User Confirmation Modal for Creating Template in Google Drive */}
      {confirmTemplateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#E8D8C8] shadow-2xl p-6 relative">
            <div className="w-12 h-12 rounded-2xl bg-[#E8D38B]/30 text-[#9A7416] flex items-center justify-center mb-4">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="font-serif-luxury font-bold text-xl text-[#1A1816] mb-2">
              Create Orders &amp; Tracking Sheet in Google Drive?
            </h3>
            <p className="text-xs text-[#68625B] leading-relaxed mb-6">
              This action will create a new Google Sheet named <strong className="text-[#1A1816]">"Subhiksha Homemade Jewellery - Orders &amp; Tracking [2026]"</strong> in your Google Drive with formatted columns for Order ID, Tracking Number, Customer Name, Courier, and Delivery Status.
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmTemplateModal(false)}
                disabled={isCreatingTemplate}
                className="px-4 py-2 rounded-xl border border-[#E8D8C8] text-xs font-semibold text-[#68625B] hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTemplateConfirmed}
                disabled={isCreatingTemplate}
                className="px-5 py-2 rounded-xl bg-[#114B3E] hover:bg-[#0D382E] text-white text-xs font-semibold uppercase tracking-wider transition shadow"
              >
                {isCreatingTemplate ? 'Creating in Drive...' : 'Confirm & Create Sheet'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mandatory User Confirmation Modal for Appending New Order to Google Sheet */}
      {confirmAddModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#E8D8C8] shadow-2xl p-6 relative">
            <h3 className="font-serif-luxury font-bold text-xl text-[#1A1816] mb-1">
              Add New Order to Google Sheet
            </h3>
            <p className="text-xs text-[#68625B] mb-5">
              Confirm details to append a new row to <strong className="text-[#1A1816]">{spreadsheetTitle}</strong> ({selectedTab}):
            </p>

            <div className="space-y-3.5 mb-6 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#68625B] mb-1">Order ID</label>
                  <input
                    type="text"
                    value={newOrderForm.orderId}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, orderId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8D8C8] font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#68625B] mb-1">Tracking Number</label>
                  <input
                    type="text"
                    value={newOrderForm.trackingNumber}
                    placeholder="e.g. BD782910442IN"
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, trackingNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8D8C8] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#68625B] mb-1">Customer Name</label>
                  <input
                    type="text"
                    value={newOrderForm.customerName}
                    placeholder="e.g. Shalini Menon"
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, customerName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8D8C8]"
                  />
                </div>
                <div>
                  <label className="block font-medium text-[#68625B] mb-1">Phone / WhatsApp</label>
                  <input
                    type="text"
                    value={newOrderForm.phone}
                    placeholder="e.g. +91 98401 23456"
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8D8C8]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-[#68625B] mb-1">Courier Carrier</label>
                  <select
                    value={newOrderForm.carrier}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, carrier: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8D8C8] bg-white"
                  >
                    <option value="India Post Speed Post">India Post Speed Post</option>
                    <option value="Blue Dart Express">Blue Dart Express</option>
                    <option value="DTDC Courier">DTDC Courier</option>
                    <option value="Delhivery Logistics">Delhivery Logistics</option>
                    <option value="Professional Couriers">Professional Couriers</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-[#68625B] mb-1">Status</label>
                  <select
                    value={newOrderForm.status}
                    onChange={(e) => setNewOrderForm({ ...newOrderForm, status: e.target.value as any })}
                    className="w-full px-3 py-2 rounded-xl border border-[#E8D8C8] bg-white"
                  >
                    <option value="Dispatched">Dispatched</option>
                    <option value="In Transit">In Transit</option>
                    <option value="Out for Delivery">Out for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Handcrafting">Handcrafting</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-medium text-[#68625B] mb-1">Handmade Items Details</label>
                <input
                  type="text"
                  value={newOrderForm.items}
                  onChange={(e) => setNewOrderForm({ ...newOrderForm, items: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-[#E8D8C8]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setConfirmAddModal(false)}
                disabled={isAddingOrder}
                className="px-4 py-2 rounded-xl border border-[#E8D8C8] text-xs font-semibold text-[#68625B] hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleAddOrderConfirmed}
                disabled={isAddingOrder}
                className="px-5 py-2 rounded-xl bg-[#114B3E] hover:bg-[#0D382E] text-white text-xs font-semibold uppercase tracking-wider transition shadow"
              >
                {isAddingOrder ? 'Saving to Google Sheet...' : 'Confirm & Save to Sheet'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
