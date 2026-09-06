import { 
  Product, 
  Retailer, 
  Salesman, 
  Order, 
  DeliveryRunSheet, 
  PaymentRecord, 
  InventoryMovement, 
  User,
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
    const [products, orders, retailers, salesmen, deliveries, payments, inv, analytics] = await Promise.all([
      this.getProducts(),
      this.getOrders(),
      this.getRetailers(),
      this.getSalesmen(),
      this.getDeliveries(),
      this.getPayments(),
      this.getInventory(),
      this.getAnalytics()
    ]);

    return {
      products,
      orders,
      retailers,
      salesmen,
      deliveryRunSheets: deliveries,
      payments,
      inventoryLogs: inv.logs || [],
      dashboardMetrics: analytics
    };
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
    const res = await authFetch('/api/auth/users');
    return res.json();
  },

  async getCurrentUser(): Promise<User> {
    const res = await authFetch('/api/auth/current');
    return res.json();
  },

  async switchUser(userId: string): Promise<{ success: boolean; user: User }> {
    const res = await authFetch('/api/auth/switch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return res.json();
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
    const res = await authFetch('/api/products');
    return res.json();
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
    const res = await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return res.json();
  },

  async deleteProduct(id: string): Promise<{ success: boolean }> {
    if (isSupabaseConfigured) {
      try {
        await supabaseService.deleteProduct(id);
      } catch (e) {
        console.warn('Supabase deleteProduct fallback:', e);
      }
    }
    const res = await authFetch(`/api/products/${id}`, { method: 'DELETE' });
    return res.json();
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
      try {
        const saved = await supabaseService.saveRetailer(retailer);
        if (saved) return saved;
      } catch (e) {
        console.warn('Supabase saveRetailer fallback to local API:', e);
      }
    }
    const isEdit = !!retailer.id;
    const url = isEdit ? `/api/retailers/${retailer.id}` : '/api/retailers';
    const method = isEdit ? 'PUT' : 'POST';
    const res = await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(retailer)
    });
    return res.json();
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

  const res = await authFetch(`/api/retailers/${safeRetailerId}/ledger`);
  return res.json();
},

  async deleteRetailer(id: string): Promise<{ success: boolean }> {
    if (isSupabaseConfigured) {
      try {
        await supabaseService.deleteRetailer(id);
      } catch (e) {
        console.warn('Supabase deleteRetailer fallback:', e);
      }
    }
    const res = await authFetch(`/api/retailers/${id}`, { method: 'DELETE' });
    return res.json();
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
    const res = await authFetch('/api/salesmen');
    return res.json();
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
    const res = await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(salesman)
    });
    return res.json();
  },

  async deleteSalesman(id: string): Promise<{ success: boolean }> {
    if (isSupabaseConfigured) {
      try {
        await supabaseService.deleteSalesman(id);
      } catch (e) {
        console.warn('Supabase deleteSalesman fallback:', e);
      }
    }
    const res = await authFetch(`/api/salesmen/${id}`, { method: 'DELETE' });
    return res.json();
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
    const res = await authFetch('/api/orders');
    return res.json();
  },

  async getOrder(id: string): Promise<Order> {
    const res = await authFetch(`/api/orders/${id}`);
    return res.json();
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
    const res = await authFetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(orderData)
    });
    return res.json();
  },

  async deleteOrder(id: string): Promise<{ success: boolean }> {
    if (isSupabaseConfigured) {
      try {
        await supabaseService.deleteOrder(id);
      } catch (e) {
        console.warn('Supabase deleteOrder fallback:', e);
      }
    }
    const res = await authFetch(`/api/orders/${id}`, { method: 'DELETE' });
    return res.json();
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
    const res = await authFetch(`/api/orders/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return res.json();
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
    const res = await authFetch('/api/deliveries');
    return res.json();
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
    const res = await authFetch('/api/deliveries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(deliveryData)
    });
    return res.json();
  },

  async completePOD(deliveryId: string, orderId: string, podData: any): Promise<{ success: boolean; order: Order }> {
    const res = await authFetch(`/api/deliveries/${deliveryId}/pod`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderId, ...podData, paymentCollected: podData.cashCollected, receiverName: podData.receiverName })
    });
    return res.json();
  },

  async dispatchRunSheet(deliveryId: string): Promise<any> {
    const res = await authFetch(`/api/deliveries/${deliveryId}/dispatch`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' }
    });
    return res.json();
  },

  async submitPOD(deliveryId: string, podData: any): Promise<{ success: boolean; order: Order }> {
    const res = await authFetch(`/api/deliveries/${deliveryId}/pod`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(podData)
    });
    return res.json();
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
    const res = await authFetch('/api/payments');
    return res.json();
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
    const res = await authFetch('/api/payments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(paymentData)
    });
    return res.json();
  },

  // Inventory
  async getInventory(): Promise<{ logs: InventoryMovement[]; products: Product[] }> {
    const res = await authFetch('/api/inventory');
    return res.json();
  },

  async inwardStock(inwardData: any): Promise<{ success: boolean; movement: InventoryMovement; product: Product }> {
    if (isSupabaseConfigured) {
      try {
        await supabaseService.logInventoryMovement(inwardData);
      } catch (e) {
        console.warn('Supabase logInventoryMovement fallback:', e);
      }
    }
    const res = await authFetch('/api/inventory/inward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inwardData)
    });
    return res.json();
  },

  async outwardStock(outwardData: any): Promise<{ success: boolean; movement: InventoryMovement; product: Product }> {
    if (isSupabaseConfigured) {
      try {
        await supabaseService.logInventoryMovement(outwardData);
      } catch (e) {
        console.warn('Supabase logInventoryMovement fallback:', e);
      }
    }
    const res = await authFetch('/api/inventory/outward', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(outwardData)
    });
    return res.json();
  },

  // Analytics
  async getAnalytics(): Promise<any> {
    const res = await authFetch('/api/analytics');
    return res.json();
  },

  // AI Assistant
  async parseAIOrder(text: string): Promise<any> {
    const res = await authFetch('/api/ai/parse-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text })
    });
    return res.json();
  },

  async getAIInsights(): Promise<any[]> {
    const res = await authFetch('/api/ai/insights');
    return res.json();
  },

  // Reset Data
  async resetDatabase(): Promise<any> {
    const res = await authFetch('/api/db/reset', { method: 'POST' });
    return res.json();
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
