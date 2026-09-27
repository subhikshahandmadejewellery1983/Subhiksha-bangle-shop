// Google Sheets & Drive API Integration Service for Orders & Tracking Numbers
import { getAccessToken } from './googleAuth';

export interface DriveSpreadsheet {
  id: string;
  name: string;
  modifiedTime?: string;
}

export interface SheetTab {
  sheetId: number;
  title: string;
  rowCount?: number;
  columnCount?: number;
}

export interface OrderRecord {
  orderId: string;
  customerName: string;
  phone: string;
  trackingNumber: string;
  carrier: string;
  status: 'Order Placed' | 'Handcrafting' | 'Dispatched' | 'In Transit' | 'Out for Delivery' | 'Delivered' | 'On Hold';
  items: string;
  size?: string;
  quantity?: number;
  dispatchDate?: string;
  estimatedDelivery?: string;
  destination?: string;
  totalAmount?: number;
  trackingUrl?: string;
  rawRowIndex?: number;
}

export interface ColumnMapping {
  orderIdCol: number;
  trackingCol: number;
  customerCol: number;
  phoneCol: number;
  carrierCol: number;
  statusCol: number;
  itemsCol: number;
  dispatchDateCol: number;
  destinationCol: number;
}

// Built-in Demo Orders for immediate testing & fallback
export const SAMPLE_ORDERS: OrderRecord[] = [
  {
    orderId: 'SBK-1082',
    customerName: 'Priya Sundaram',
    phone: '+91 98401 23456',
    trackingNumber: 'BD782910442IN',
    carrier: 'Blue Dart Express',
    status: 'In Transit',
    items: 'Maharani Crimson Kundan Bridal Chooda (24 Pcs)',
    size: '2.6',
    quantity: 1,
    dispatchDate: '2026-09-25',
    estimatedDelivery: '2026-09-28',
    destination: 'Chennai, Tamil Nadu',
    totalAmount: 3499,
    trackingUrl: 'https://www.bluedart.com/tracking'
  },
  {
    orderId: 'SBK-1083',
    customerName: 'Aishwarya Ramesh',
    phone: '+91 94432 98765',
    trackingNumber: 'EL928471920IN',
    carrier: 'India Post Speed Post',
    status: 'Dispatched',
    items: 'Mayura Emerald Royale Silk Kada Bangles (Pair)',
    size: '2.4',
    quantity: 2,
    dispatchDate: '2026-09-26',
    estimatedDelivery: '2026-09-30',
    destination: 'Bengaluru, Karnataka',
    totalAmount: 3798,
    trackingUrl: 'https://www.indiapost.gov.in/'
  },
  {
    orderId: 'SBK-1084',
    customerName: 'Meenakshi Iyer',
    phone: '+91 97910 55443',
    trackingNumber: 'DT882910482',
    carrier: 'DTDC Courier',
    status: 'Delivered',
    items: 'Gulabi Rani Pink Temple Bangle Stack (12 Pcs)',
    size: '2.6',
    quantity: 1,
    dispatchDate: '2026-09-21',
    estimatedDelivery: '2026-09-24',
    destination: 'Coimbatore, Tamil Nadu',
    totalAmount: 1499,
    trackingUrl: 'https://www.dtdc.in/'
  },
  {
    orderId: 'SBK-1085',
    customerName: 'Divya Natarajan',
    phone: '+91 98840 11223',
    trackingNumber: 'DEL938210344',
    carrier: 'Delhivery Logistics',
    status: 'Out for Delivery',
    items: 'Padmavati Antique Gold & Ivory Kada Bangles (4 Pcs)',
    size: '2.8',
    quantity: 1,
    dispatchDate: '2026-09-24',
    estimatedDelivery: '2026-09-27',
    destination: 'Hyderabad, Telangana',
    totalAmount: 2299,
    trackingUrl: 'https://www.delhivery.com/tracking'
  },
  {
    orderId: 'SBK-1086',
    customerName: 'Kavitha Balaji',
    phone: '+91 90030 88776',
    trackingNumber: 'Pending Dispatch',
    carrier: 'India Post Speed Post',
    status: 'Handcrafting',
    items: 'Basanti Haldi Mustard Silk Bangle Stack',
    size: '2.4',
    quantity: 1,
    dispatchDate: 'Expected 2026-09-28',
    estimatedDelivery: '2026-10-02',
    destination: 'Madurai, Tamil Nadu',
    totalAmount: 1299
  }
];

// Helper to construct external tracking URL based on carrier & tracking number
export const getCarrierTrackingUrl = (carrier: string, trackingNumber: string): string => {
  const c = carrier.toLowerCase();
  const num = encodeURIComponent(trackingNumber.trim());

  if (c.includes('india post') || c.includes('speed post')) {
    return `https://www.indiapost.gov.in/`;
  }
  if (c.includes('bluedart') || c.includes('blue dart')) {
    return `https://www.bluedart.com/tracking`;
  }
  if (c.includes('dtdc')) {
    return `https://www.dtdc.in/`;
  }
  if (c.includes('delhivery')) {
    return `https://www.delhivery.com/tracking`;
  }
  if (c.includes('professional')) {
    return `https://www.tpcindia.com/`;
  }
  if (c.includes('fedex')) {
    return `https://www.fedex.com/fedextrack/?trknbr=${num}`;
  }
  if (c.includes('dhl')) {
    return `https://www.dhl.com/en/express/tracking.html?AWB=${num}`;
  }
  return `https://www.google.com/search?q=${encodeURIComponent(`${carrier} tracking ${trackingNumber}`)}`;
};

// 1. Fetch user's Google Drive Spreadsheets
export const listDriveSpreadsheets = async (): Promise<DriveSpreadsheet[]> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const query = encodeURIComponent("mimeType='application/vnd.google-apps.spreadsheet' and trashed=false");
  const url = `https://www.googleapis.com/drive/v3/files?q=${query}&orderBy=modifiedTime desc&pageSize=30&fields=files(id,name,modifiedTime)`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to fetch Google Drive files: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.files || [];
};

// 2. Fetch Spreadsheet Metadata (Inspect sheet tabs)
export const getSpreadsheetTabs = async (spreadsheetId: string): Promise<{ title: string; tabs: SheetTab[] }> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?fields=properties.title,sheets(properties(sheetId,title,gridProperties))`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to inspect spreadsheet: HTTP ${res.status}`);
  }

  const data = await res.json();
  const tabs: SheetTab[] = (data.sheets || []).map((s: any) => ({
    sheetId: s.properties?.sheetId,
    title: s.properties?.title || 'Sheet1',
    rowCount: s.properties?.gridProperties?.rowCount,
    columnCount: s.properties?.gridProperties?.columnCount
  }));

  return {
    title: data.properties?.title || 'Spreadsheet',
    tabs
  };
};

// 3. Read Values from a specific sheet range
export const readSheetValues = async (
  spreadsheetId: string,
  tabTitle: string,
  rangeNotation: string = 'A1:Z500'
): Promise<string[][]> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const fullRange = `${tabTitle}!${rangeNotation}`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(fullRange)}`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` }
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to read sheet data: HTTP ${res.status}`);
  }

  const data = await res.json();
  return data.values || [];
};

// 4. Smart Auto-detect Column Mapping from Header Row
export const detectColumnMapping = (headerRow: string[]): ColumnMapping => {
  const normalized = headerRow.map(h => (h || '').toLowerCase().trim());

  const findIdx = (keywords: string[]): number => {
    return normalized.findIndex(header => 
      keywords.some(k => header.includes(k) || header === k)
    );
  };

  return {
    orderIdCol: findIdx(['order id', 'order #', 'order no', 'orderid', 'order', 'ref', 'invoice']),
    trackingCol: findIdx(['tracking number', 'tracking id', 'tracking #', 'tracking', 'awb', 'consignment', 'waybill', 'docket']),
    customerCol: findIdx(['customer name', 'customer', 'client', 'buyer', 'name']),
    phoneCol: findIdx(['phone', 'whatsapp', 'mobile', 'contact', 'tel']),
    carrierCol: findIdx(['carrier', 'courier', 'shipping partner', 'service', 'logistics']),
    statusCol: findIdx(['status', 'delivery status', 'order status', 'shipment status']),
    itemsCol: findIdx(['items', 'item', 'bangles', 'product', 'design', 'pieces', 'description']),
    dispatchDateCol: findIdx(['dispatch date', 'shipped date', 'date', 'dispatch', 'shipped on']),
    destinationCol: findIdx(['destination', 'city', 'location', 'delivery city', 'address'])
  };
};

// 5. Parse Sheet Rows into OrderRecords
export const parseRowsToOrders = (
  rows: string[][],
  mapping?: Partial<ColumnMapping>
): { orders: OrderRecord[]; headers: string[]; mapping: ColumnMapping } => {
  if (!rows || rows.length === 0) {
    return { orders: [], headers: [], mapping: detectColumnMapping([]) };
  }

  const headerRow = rows[0] || [];
  const detected = detectColumnMapping(headerRow);
  const activeMapping: ColumnMapping = {
    orderIdCol: mapping?.orderIdCol ?? (detected.orderIdCol !== -1 ? detected.orderIdCol : 0),
    trackingCol: mapping?.trackingCol ?? (detected.trackingCol !== -1 ? detected.trackingCol : 1),
    customerCol: mapping?.customerCol ?? (detected.customerCol !== -1 ? detected.customerCol : 2),
    phoneCol: mapping?.phoneCol ?? (detected.phoneCol !== -1 ? detected.phoneCol : 3),
    carrierCol: mapping?.carrierCol ?? (detected.carrierCol !== -1 ? detected.carrierCol : 4),
    statusCol: mapping?.statusCol ?? (detected.statusCol !== -1 ? detected.statusCol : 5),
    itemsCol: mapping?.itemsCol ?? (detected.itemsCol !== -1 ? detected.itemsCol : 6),
    dispatchDateCol: mapping?.dispatchDateCol ?? (detected.dispatchDateCol !== -1 ? detected.dispatchDateCol : 7),
    destinationCol: mapping?.destinationCol ?? (detected.destinationCol !== -1 ? detected.destinationCol : 8)
  };

  const orders: OrderRecord[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || row.length === 0) continue;

    const orderId = (row[activeMapping.orderIdCol] || '').trim();
    const trackingNumber = (row[activeMapping.trackingCol] || '').trim();

    // If both orderId and tracking are empty, skip row
    if (!orderId && !trackingNumber) continue;

    const customerName = (row[activeMapping.customerCol] || 'Valued Customer').trim();
    const phone = (row[activeMapping.phoneCol] || '').trim();
    const carrier = (row[activeMapping.carrierCol] || 'India Post Speed Post').trim();
    const rawStatus = (row[activeMapping.statusCol] || '').trim();
    const items = (row[activeMapping.itemsCol] || 'Silk Thread Bangles').trim();
    const dispatchDate = (row[activeMapping.dispatchDateCol] || '').trim();
    const destination = (row[activeMapping.destinationCol] || '').trim();

    // Normalize status
    let status: OrderRecord['status'] = 'Dispatched';
    const s = rawStatus.toLowerCase();
    if (s.includes('deliver') && !s.includes('out')) {
      status = 'Delivered';
    } else if (s.includes('out for')) {
      status = 'Out for Delivery';
    } else if (s.includes('transit')) {
      status = 'In Transit';
    } else if (s.includes('craft') || s.includes('making') || s.includes('process')) {
      status = 'Handcrafting';
    } else if (s.includes('placed') || s.includes('new') || s.includes('confirm')) {
      status = 'Order Placed';
    } else if (s.includes('hold')) {
      status = 'On Hold';
    } else if (s.includes('dispatch') || s.includes('shipped')) {
      status = 'Dispatched';
    }

    orders.push({
      orderId: orderId || `ORD-${i}`,
      customerName,
      phone,
      trackingNumber: trackingNumber || 'Pending Allocation',
      carrier,
      status,
      items,
      dispatchDate,
      destination,
      trackingUrl: trackingNumber ? getCarrierTrackingUrl(carrier, trackingNumber) : undefined,
      rawRowIndex: i + 1
    });
  }

  return {
    orders,
    headers: headerRow,
    mapping: activeMapping
  };
};

// 6. Create Subhiksha Orders Spreadsheet Template in user's Google Drive
// NOTE: Destructive/mutating operation: caller MUST require explicit user confirmation dialog first
export const createSubhikshaOrdersTemplate = async (): Promise<{ spreadsheetId: string; spreadsheetUrl: string }> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const resource = {
    properties: {
      title: `Subhiksha Homemade Jewellery - Orders & Tracking [${new Date().getFullYear()}]`
    },
    sheets: [
      {
        properties: {
          title: 'Orders & Tracking',
          gridProperties: {
            frozenRowCount: 1
          }
        },
        data: [
          {
            startRow: 0,
            startColumn: 0,
            rowData: [
              {
                values: [
                  { userEnteredValue: { stringValue: 'Order ID' } },
                  { userEnteredValue: { stringValue: 'Tracking Number' } },
                  { userEnteredValue: { stringValue: 'Customer Name' } },
                  { userEnteredValue: { stringValue: 'Customer Phone / WhatsApp' } },
                  { userEnteredValue: { stringValue: 'Carrier / Courier' } },
                  { userEnteredValue: { stringValue: 'Status' } },
                  { userEnteredValue: { stringValue: 'Handcrafted Silk Bangle Items' } },
                  { userEnteredValue: { stringValue: 'Dispatch Date' } },
                  { userEnteredValue: { stringValue: 'Destination' } },
                  { userEnteredValue: { stringValue: 'Total Price (INR)' } }
                ]
              },
              ...SAMPLE_ORDERS.map(o => ({
                values: [
                  { userEnteredValue: { stringValue: o.orderId } },
                  { userEnteredValue: { stringValue: o.trackingNumber } },
                  { userEnteredValue: { stringValue: o.customerName } },
                  { userEnteredValue: { stringValue: o.phone } },
                  { userEnteredValue: { stringValue: o.carrier } },
                  { userEnteredValue: { stringValue: o.status } },
                  { userEnteredValue: { stringValue: o.items } },
                  { userEnteredValue: { stringValue: o.dispatchDate || '' } },
                  { userEnteredValue: { stringValue: o.destination || '' } },
                  { userEnteredValue: { numberValue: o.totalAmount || 1999 } }
                ]
              }))
            ]
          }
        ]
      }
    ]
  };

  const res = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(resource)
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to create spreadsheet template: HTTP ${res.status}`);
  }

  const data = await res.json();
  return {
    spreadsheetId: data.spreadsheetId,
    spreadsheetUrl: data.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${data.spreadsheetId}/edit`
  };
};

// 7. Append New Order Row to Google Sheet
// NOTE: Destructive/mutating operation: caller MUST require explicit user confirmation dialog first
export const appendOrderToSheet = async (
  spreadsheetId: string,
  tabTitle: string,
  newOrder: OrderRecord
): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) throw new Error('Not authenticated with Google Workspace');

  const range = `${tabTitle}!A:J`;
  const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=USER_ENTERED`;

  const values = [
    [
      newOrder.orderId,
      newOrder.trackingNumber,
      newOrder.customerName,
      newOrder.phone,
      newOrder.carrier,
      newOrder.status,
      newOrder.items,
      newOrder.dispatchDate || new Date().toISOString().split('T')[0],
      newOrder.destination || 'India',
      newOrder.totalAmount || 0
    ]
  ];

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ values })
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Failed to append order to spreadsheet: HTTP ${res.status}`);
  }

  return true;
};
