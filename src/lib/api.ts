import { 
  Product, 
  Retailer, 
  Salesman, 
  Order, 
  DeliveryRunSheet, 
  PaymentRecord, 
  InventoryMovement, 
  User,
  UserRole,
  Category,
  Brand
} from '../types';
import { supabaseService, isSupabaseConfigured, supabaseUrl } from './supabase';

let activeToken: string | null = null;
let activeUserId: string | null = null;
let activeUserRole: string | null = null;
let activeRetailerId: string | null = null;

export function setApiAuthContext(
  token: string | null,
  userId: string | null,
  role: string | null,
  retailerId: string | null = null
) {
  activeToken = token;
  activeUserId = userId;
  activeUserRole = role;
  activeRetailerId = retailerId;
}


async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json');
  }
  if (activeToken) {
    headers.set('Authorization', `Bearer ${activeToken}`);
  }
  if (activeUserId) {
    headers.set('X-User-Id', activeUserId);
  }
  if (activeUserRole) {
    headers.set('X-User-Role', activeUserRole);
  }

  const res = await fetch(url, { ...options, headers });
  return res;
}

/**
 * Safe JSON fetch wrapper that guards against HTML responses (Vite fallback, 502/503 proxies, or 404 HTML)
 * completely preventing "Unexpected token '<', '<html><hea'... is not valid JSON" errors.
 */
async function safeJsonFetch<T>(url: string, options: RequestInit = {}, fallbackValue: T): Promise<T> {
  try {
    const res = await authFetch(url, options);
    const text = await res.text();
    const trimmed = text.trim();

    // Guard against HTML error or SPA index pages
    if (trimmed.startsWith('<') || trimmed.toLowerCase().startsWith('<!doctype html>')) {
      console.warn(`[safeJsonFetch] Non-JSON HTML response for ${url} (${res.status}). Using fallback.`);
      return fallbackValue;
    }

    if (!res.ok) {
      console.warn(`[safeJsonFetch] HTTP error ${res.status} for ${url}:`, trimmed.slice(0, 100));
      return fallbackValue;
    }

    try {
      return JSON.parse(text) as T;
    } catch (parseErr) {
      console.warn(`[safeJsonFetch] Parse error for ${url}:`, parseErr);
      return fallbackValue;
    }
  } catch (err) {
    console.warn(`[safeJsonFetch] Network/fetch error for ${url}:`, err);
    return fallbackValue;
  }
}

/**
 * Safe mutation fetch wrapper for POST / PUT / DELETE
 */
async function safeMutationFetch<T>(url: string, options: RequestInit = {}, fallbackValue: T = {} as T): Promise<T> {
  try {
    const res = await authFetch(url, options);
    const text = await res.text();
    const trimmed = text.trim();

    if (trimmed.startsWith('<') || trimmed.toLowerCase().startsWith('<!doctype html>')) {
      throw new Error(`Server returned HTML response instead of JSON for ${url} (HTTP ${res.status})`);
    }

    if (!res.ok) {
      let msg = `Operation failed with status ${res.status}`;
      try {
        const parsed = JSON.parse(text);
        if (parsed.error) msg = parsed.error;
      } catch {}
      throw new Error(msg);
    }

    try {
      return JSON.parse(text) as T;
    } catch {
      return fallbackValue;
    }
  } catch (err: any) {
    console.error(`[Mutation Error] ${url}:`, err.message || err);
    throw err;
  }
}

export const api = {
  // Database status checker
  async checkDatabaseStatus() {
    return await supabaseService.checkConnection();
  },

  // Initial Full FMCG Data Sync
  async getInitialData(): Promise<{
    products: Product[];
    orders: Order[];
    retailers: Retailer[];
    salesmen: Salesman[];
    deliveryRunSheets: DeliveryRunSheet[];
    payments: PaymentRecord[];
    inventoryLogs: InventoryMovement[];
    dashboardMetrics: any;
  }> {
    try {
      const [
        productsRes,
        ordersRes,
        retailersRes,
        salesmenRes,
        deliveriesRes,
        paymentsRes,
        invRes,
        analyticsRes
      ] = await Promise.allSettled([
        this.getProducts(),
        this.getOrders(),
        this.getRetailers(),
        this.getSalesmen(),
        this.getDeliveries(),
        this.getPayments(),
        this.getInventory(),
        this.getAnalytics()
      ]);

      const products = productsRes.status === 'fulfilled' ? productsRes.value : [];
      const orders = ordersRes.status === 'fulfilled' ? ordersRes.value : [];
      const retailers = retailersRes.status === 'fulfilled' ? retailersRes.value : [];
      const salesmen = salesmenRes.status === 'fulfilled' ? salesmenRes.value : [];
      const deliveries = deliveriesRes.status === 'fulfilled' ? deliveriesRes.value : [];
      const payments = paymentsRes.status === 'fulfilled' ? paymentsRes.value : [];
      const inv = invRes.status === 'fulfilled' ? invRes.value : { logs: [], products: [] };
      const analytics = analyticsRes.status === 'fulfilled' ? analyticsRes.value : null;

      return {
        products: Array.isArray(products) ? products : [],
        orders: Array.isArray(orders) ? orders : [],
        retailers: Array.isArray(retailers) ? retailers : [],
        salesmen: Array.isArray(salesmen) ? salesmen : [],
        deliveryRunSheets: Array.isArray(deliveries) ? deliveries : [],
        payments: Array.isArray(payments) ? payments : [],
        inventoryLogs: inv?.logs || [],
        dashboardMetrics: analytics
      };
    } catch (err) {
      console.warn('[getInitialData fallback caught]:', err);
      return {
        products: [],
        orders: [],
        retailers: [],
        salesmen: [],
        deliveryRunSheets: [],
        payments: [],
        inventoryLogs: [],
        dashboardMetrics: null
      };
    }
  },

  // Auth & Users
  async getUsers(): Promise<User[]> {
    if (isSupabaseConfigured) {
      try {
        const users = await supabaseService.getUsers();
        if (users && users.length > 0) return users;
      } catch (e) {
        console.warn('Supabase getUsers fallback to local API:', e);
      }
    }
    return safeJsonFetch<User[]>('/api/auth/users', {}, []);
  },

  async getCurrentUser(): Promise<User> {
    return safeJsonFetch<User>('/api/auth/current', {}, {
      id: 'usr_admin',
      name: 'Aryan Sharma',
      email: 'aryan@aryanagency.in',
      phone: '+91 98450 12345',
      role: 'admin'
    });
  },

  async switchUser(userId: string): Promise<{ success: boolean; user: User }> {
    return safeMutationFetch<{ success: boolean; user: User }>('/api/auth/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
  },

  // Categories & Brands
  async getCategories(): Promise<Category[]> {
    if (isSupabaseConfigured) {
      try {
        const categories = await supabaseService.getCategories();
        if (categories && categories.length > 0) return categories;
      } catch (e) {
        console.warn('Supabase getCategories fallback:', e);
      }
    }
    return [
      { id: 'cat_1', name: 'Biscuits & Bakery', code: 'BAKERY', gstRate: 18 },
      { id: 'cat_2', name: 'Beverages', code: 'BEV', gstRate: 12 },
      { id: 'cat_3', name: 'Spices & Staples', code: 'STAPLES', gstRate: 5 },
      { id: 'cat_4', name: 'Personal Care', code: 'PERSONAL', gstRate: 18 },
      { id: 'cat_5', name: 'Confectionery & Chocolates', code: 'CONF', gstRate: 18 },
      { id: 'cat_6', name: 'Snacks & Namkeen', code: 'SNACKS', gstRate: 12 },
      { id: 'cat_7', name: 'Dairy & Refrigerated', code: 'DAIRY', gstRate: 12 },
      { id: 'cat_8', name: 'Household & Hygiene', code: 'HOUSEHOLD', gstRate: 18 }
    ];
  },

  async getBrands(): Promise<Brand[]> {
    if (isSupabaseConfigured) {
      try {
        const brands = await supabaseService.getBrands();
        if (brands && brands.length > 0) return brands;
      } catch (e) {
        console.warn('Supabase getBrands fallback:', e);
      }
    }
    return [
      { id: 'brd_1', name: 'Parle', code: 'PARLE', companyName: 'Parle Products Pvt. Ltd.' },
      { id: 'brd_2', name: 'Britannia', code: 'BRIT', companyName: 'Britannia Industries Ltd.' },
      { id: 'brd_3', name: 'ITC Sunfeast', code: 'ITC', companyName: 'ITC Limited' },
      { id: 'brd_4', name: 'Cadbury', code: 'MONDELEZ', companyName: 'Mondelez India Foods Ltd.' },
      { id: 'brd_5', name: 'Tata Tea', code: 'TATA', companyName: 'Tata Consumer Products Ltd.' },
      { id: 'brd_6', name: 'Amul', code: 'GCMMF', companyName: 'GCMMF' }
    ];
  },

  // Products
  async getProducts(): Promise<Product[]> {
    if (isSupabaseConfigured) {
      try {
        const products = await supabaseService.getProducts();
        if (products && products.length > 0) return products;
      } catch (e) {
        console.warn('Supabase getProducts fallback to local API:', e);
      }
    }
    return safeJsonFetch<Product[]>('/api/products', {}, []);
  },

  async saveProduct(product: Partial<Product>): Promise<Product> {
    if (isSupabaseConfigured) {
      try {
        const saved = await supabaseService.saveProduct(product);
        if (saved) return saved;
      } catch (e) {
        console.warn('Supabase saveProduct fallback to local API:', e);
      }
    }
    const isEdit = !!product.id;
    const url = isEdit ? `/api/products/${product.id}` : '/api/products';
    const method = isEdit ? 'PUT' : 'POST';
    return safeMutationFetch<Product>(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    if (isSupabaseConfigured) {
      try {
        await supabaseService.deleteProduct(id);
      } catch (e) {
        console.warn('Supabase deleteProduct fallback:', e);
      }
    }
    return safeMutationFetch<{ success: boolean }>(`/api/products/${id}`, { method: 'DELETE' }, { success: true });
  },

  // Retailers
 async getRetailers(): Promise<Retailer[]> {
  if (isSupabaseConfigured) {
    try {
      const retailers = await supabaseService.getRetailers();

      if (retailers) {
        if (activeUserRole === 'retailer' && activeRetailerId) {
          return retailers.filter(r => r.id === activeRetailerId);
        }

        return retailers;
      }
    } catch (e) {
      console.warn('Supabase getRetailers fallback to local API:', e);
    }
  }

  const res = await authFetch('/api/retailers');
  const retailers = await res.json();

  if (activeUserRole === 'retailer' && activeRetailerId) {
    return retailers.filter((r: Retailer) => r.id === activeRetailerId);
  }

  return retailers;
},

  async saveRetailer(retailer: Partial<Retailer>): Promise<Retailer> {
    if (isSupabaseConfigured) {
      // Directly call Supabase service. Do NOT swallow errors so that validation or duplicate errors
      // are accurately surfaced to the user interface!
      const saved = await supabaseService.saveRetailer(retailer);
      if (saved) return saved;
    }
    const isEdit = !!retailer.id;
    const url = isEdit ? `/api/retailers/${retailer.id}` : '/api/retailers';
    const method = isEdit ? 'PUT' : 'POST';
    return safeMutationFetch<Retailer>(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(retailer)
    });
  },

  async updateUserRole(userId: string, role: string): Promise<any> {
    if (isSupabaseConfigured) {
      try {
        await supabaseService.updateUserRole(userId, role as any);
      } catch (err) {
        console.warn('Supabase updateUserRole error/fallback:', err);
      }
    }
    return safeMutationFetch<any>(`/api/users/${userId}/role`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role })
    });
  },

  async getRetailerLedger(id: string): Promise<{ retailer: Retailer; entries: any[]; finalBalance: number }> {
    if (
      activeUserRole === 'retailer' &&
      activeRetailerId &&
      id !== activeRetailerId
    ) {
      throw new Error('Unauthorized: You can only access your own ledger.');
    }

    const safeRetailerId =
      activeUserRole === 'retailer' && activeRetailerId
        ? activeRetailerId
        : id;

    return safeJsonFetch<{ retailer: Retailer; entries: any[]; finalBalance: number }>(
      `/api/retailers/${safeRetailerId}/ledger`,
      {},
      { retailer: {} as any, entries: [], finalBalance: 0 }
    );
  },

  async deleteRetailer(id: string): Promise<{ success: boolean }> {
    if (isSupabaseConfigured) {
      try {
        await supabaseService.deleteRetailer(id);
      } catch (e) {
        console.warn('Supabase deleteRetailer fallback:', e);
      }
    }
    return safeMutationFetch<{ success: boolean }>(`/api/retailers/${id}`, { method: 'DELETE' }, { success: true });
  },

  // Salesmen
  async getSalesmen(): Promise<Salesman[]> {
    if (isSupabaseConfigured) {
      try {
        const salesmen = await supabaseService.getSalesmen();
        if (salesmen && salesmen.length > 0) return salesmen;
      } catch (e) {
        console.warn('Supabase getSalesmen fallback to local API:', e);
      }
    }
    return safeJsonFetch<Salesman[]>('/api/salesmen', {}, []);
  },

  async saveSalesman(salesman: Partial<Salesman>): Promise<Salesman> {
    if (isSupabaseConfigured) {
      try {
        const saved = await supabaseService.saveSalesman(salesman);
        if (saved) return saved;
      } catch (e) {
        console.warn('Supabase saveSalesman fallback to local API:', e);
      }
    }
    const isEdit = !!salesman.id;
    const url = isEdit ? `/api/salesmen/${salesman.id}` : '/api/salesmen';
    const method = isEdit ? 'PUT' : 'POST';
    return safeMutationFetch<Salesman>(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(salesman)
    });
  },

  async deleteSalesman(id: string): Promise<{ success: boolean }> {
    if (isSupabaseConfigured) {
      try {
        await supabaseService.deleteSalesman(id);
      } catch (e) {
        console.warn('Supabase deleteSalesman fallback:', e);
      }
    }
    return safeMutationFetch<{ success: boolean }>(`/api/salesmen/${id}`, { method: 'DELETE' }, { success: true });
  },

  // Orders
  async getOrders(): Promise<Order[]> {
    if (isSupabaseConfigured) {
      try {
        const orders = await supabaseService.getOrders();
        if (orders && orders.length > 0) return orders;
      } catch (e) {
        console.warn('Supabase getOrders fallback to local API:', e);
      }
    }
    return safeJsonFetch<Order[]>('/api/orders', {}, []);
  },

  async getOrder(id: string): Promise<Order | null> {
    return safeJsonFetch<Order | null>(`/api/orders/${id}`, {}, null);
  },

  async createOrder(orderData: any): Promise<Order> {
    if (isSupabaseConfigured) {
      try {
        const created = await supabaseService.createOrder(orderData);
        if (created) return created;
      } catch (e) {
        console.warn('Supabase createOrder fallback to local API:', e);
      }
    }
    return safeMutationFetch<Order>('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
  },

  async deleteOrder(id: string): Promise<{ success: boolean }> {
    if (isSupabaseConfigured) {
      try {
        await supabaseService.deleteOrder(id);
      } catch (e) {
        console.warn('Supabase deleteOrder fallback:', e);
      }
    }
    return safeMutationFetch<{ success: boolean }>(`/api/orders/${id}`, { method: 'DELETE' }, { success: true });
  },

  async updateOrderStatus(id: string, statusOrData: any, extra?: any): Promise<Order> {
    if (isSupabaseConfigured) {
      try {
        const status = typeof statusOrData === 'string' ? statusOrData : statusOrData.status;
        const updated = await supabaseService.updateOrderStatus(id, status, extra || statusOrData);
        if (updated) return updated;
      } catch (e) {
        console.warn('Supabase updateOrderStatus fallback to local API:', e);
      }
    }
    const payload = typeof statusOrData === 'string' 
      ? { status: statusOrData, ...(extra || {}) } 
      : statusOrData;
    return safeMutationFetch<Order>(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
  },

  // Deliveries
  async getDeliveries(): Promise<DeliveryRunSheet[]> {
    if (isSupabaseConfigured) {
      try {
        const deliveries = await supabaseService.getDeliveries();
        if (deliveries && deliveries.length > 0) return deliveries;
      } catch (e) {
        console.warn('Supabase getDeliveries fallback to local API:', e);
      }
    }
    return safeJsonFetch<DeliveryRunSheet[]>('/api/deliveries', {}, []);
  },

  async createDeliveryRun(deliveryData: any): Promise<DeliveryRunSheet> {
    if (isSupabaseConfigured) {
      try {
        const created = await supabaseService.saveDelivery(deliveryData);
        if (created) return created;
      } catch (e) {
        console.warn('Supabase createDelivery fallback to local API:', e);
      }
    }
    return safeMutationFetch<DeliveryRunSheet>('/api/deliveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deliveryData)
    });
  },

  async completePOD(deliveryId: string, orderId: string, podData: any): Promise<{ success: boolean; order: Order }> {
    return safeMutationFetch<{ success: boolean; order: Order }>(`/api/deliveries/${deliveryId}/pod`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, ...podData, paymentCollected: podData.cashCollected, receiverName: podData.receiverName })
    });
  },

  async dispatchRunSheet(deliveryId: string): Promise<any> {
    return safeMutationFetch<any>(`/api/deliveries/${deliveryId}/dispatch`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
  },

  async submitPOD(deliveryId: string, podData: any): Promise<{ success: boolean; order: Order }> {
    return safeMutationFetch<{ success: boolean; order: Order }>(`/api/deliveries/${deliveryId}/pod`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(podData)
    });
  },

  // Payments
  async getPayments(): Promise<PaymentRecord[]> {
    if (isSupabaseConfigured) {
      try {
        const payments = await supabaseService.getPayments();
        if (payments && payments.length > 0) return payments;
      } catch (e) {
        console.warn('Supabase getPayments fallback to local API:', e);
      }
    }
    return safeJsonFetch<PaymentRecord[]>('/api/payments', {}, []);
  },

  async recordPayment(paymentData: any): Promise<PaymentRecord> {
    if (isSupabaseConfigured) {
      try {
        const recorded = await supabaseService.recordPayment(paymentData);
        if (recorded) return recorded;
      } catch (e) {
        console.warn('Supabase recordPayment fallback to local API:', e);
      }
    }
    return safeMutationFetch<PaymentRecord>('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
  },

  // Inventory
  async getInventory(): Promise<{ logs: InventoryMovement[]; products: Product[] }> {
    return safeJsonFetch<{ logs: InventoryMovement[]; products: Product[] }>(
      '/api/inventory',
      {},
      { logs: [], products: [] }
    );
  },

  async inwardStock(inwardData: any): Promise<{ success: boolean; movement: InventoryMovement; product: Product }> {
    if (isSupabaseConfigured) {
      try {
        await supabaseService.logInventoryMovement(inwardData);
      } catch (e) {
        console.warn('Supabase logInventoryMovement fallback:', e);
      }
    }
    return safeMutationFetch<{ success: boolean; movement: InventoryMovement; product: Product }>('/api/inventory/inward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inwardData)
    });
  },

  async outwardStock(outwardData: any): Promise<{ success: boolean; movement: InventoryMovement; product: Product }> {
    if (isSupabaseConfigured) {
      try {
        await supabaseService.logInventoryMovement(outwardData);
      } catch (e) {
        console.warn('Supabase logInventoryMovement fallback:', e);
      }
    }
    return safeMutationFetch<{ success: boolean; movement: InventoryMovement; product: Product }>('/api/inventory/outward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(outwardData)
    });
  },

  // Analytics
  async getAnalytics(): Promise<any> {
    return safeJsonFetch<any>('/api/analytics', {}, null);
  },

  // AI Assistant
  async parseAIOrder(text: string): Promise<any> {
    return safeMutationFetch<any>('/api/ai/parse-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
  },

  async getAIInsights(): Promise<any[]> {
    return safeJsonFetch<any[]>('/api/ai/insights', {}, []);
  },

  // Reset Data
  async resetDatabase(): Promise<any> {
    return safeMutationFetch<any>('/api/db/reset', { method: 'POST' });
  }
};

export function formatINR(val: number): string {
  if (isNaN(val)) return '₹0';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(val);
}

export function formatINRDecimals(val: number): string {
  if (isNaN(val)) return '₹0.00';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(val);
}
