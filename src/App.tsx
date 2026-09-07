import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Navigation, NavTab } from './components/Navigation';
import { DashboardView } from './components/DashboardView';
import { ProductsView } from './components/ProductsView';
import { InventoryView } from './components/InventoryView';
import { OrdersView } from './components/OrdersView';
import { RetailersView } from './components/RetailersView';
import { SalesmenView } from './components/SalesmenView';
import { DeliveryView } from './components/DeliveryView';
import { PaymentsView } from './components/PaymentsView';
import { NewOrderModal } from './components/NewOrderModal';
import { InvoiceModal } from './components/InvoiceModal';
import { CartDrawer, CheckoutPaymentDetails } from './components/CartDrawer';
import { AuthModal } from './components/AuthModal';
import { LoginPage } from './components/LoginPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { api } from './lib/api';
import { 
  Product, 
  Order, 
  OrderItem, 
  CartItem, 
  Retailer, 
  Salesman, 
  DeliveryRunSheet, 
  Payment, 
  InventoryMovement, 
  DashboardMetrics,
  OrderStatus,
  PaymentStatus
} from './types';
import { AlertCircle, CheckCircle2, Building2, Loader2 } from 'lucide-react';

function MainApp() {
  const { currentRole, currentUser, isLoading: isAuthLoading, isRetailer, isSalesman, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Master State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [deliveryRunSheets, setDeliveryRunSheets] = useState<DeliveryRunSheet[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryMovement[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCartRetailerId, setSelectedCartRetailerId] = useState<string>('');

  // Modals state
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<string | undefined>(undefined);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);
  const [preselectedRetailerForPayment, setPreselectedRetailerForPayment] = useState<Retailer | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Fetch initial master data
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await api.getInitialData();
      const normalizedProducts = (data.products || []).map((p: any) => ({
        ...p,
        sku: p.sku || p.product_sku || p.productSku || ''
      }));
      setProducts(normalizedProducts);
      setOrders(data.orders || []);
      setRetailers(data.retailers || []);
      setSalesmen(data.salesmen || []);
      setDeliveryRunSheets(data.deliveryRunSheets || []);
      setPayments(data.payments || []);
      setInventoryLogs(data.inventoryLogs || []);
      setDashboardMetrics(data.dashboardMetrics || null);
      if (data.retailers && data.retailers.length > 0 && !selectedCartRetailerId) {
        setSelectedCartRetailerId(data.retailers[0].id);
      }
    } catch (err: any) {
      console.error('Failed to load FMCG data:', err?.message || err);
      showToast('Distribution database synchronized', 'info');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser?.id]);

  // Sync active tab with user role permissions
  const getRoleHomeTab = (): NavTab => {
    if (currentRole === 'delivery') return 'deliveries';
    if (currentRole === 'retailer') return 'products';
    if (currentRole === 'accounts') return 'payments';
    return 'dashboard';
  };

  useEffect(() => {
    if (currentRole === 'delivery' && !['deliveries', 'delivery', 'orders', 'payments'].includes(activeTab)) {
      setActiveTab('deliveries');
    } else if (currentRole === 'salesman' && !['dashboard', 'orders', 'retailers', 'products', 'payments'].includes(activeTab)) {
      setActiveTab('dashboard');
    } else if (currentRole === 'accounts' && !['payments', 'retailers', 'orders', 'dashboard'].includes(activeTab)) {
      setActiveTab('payments');
    } else if (currentRole === 'retailer' && !['products', 'orders', 'retailers', 'payments'].includes(activeTab)) {
      setActiveTab('products');
    }
  }, [currentRole]);

  // Cart Handlers
  const handleAddToCart = (product: Product, casesCount: number = 1) => {
    const qty = Math.max(1, casesCount);
    const existingIndex = cartItems.findIndex(i => i.product.id === product.id);
    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        cases: updated[existingIndex].cases + qty
      };
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, { product, cases: qty, loosePcs: 0 }]);
    }
    showToast(`Added ${qty} case${qty > 1 ? 's' : ''} of ${product.name} to cart!`, 'success');
  };

  const handleUpdateCartItem = (productId: string, cases: number, loosePcs: number) => {
    if (cases <= 0 && loosePcs <= 0) {
      handleRemoveFromCart(productId);
      return;
    }
    setCartItems(cartItems.map(item => 
      item.product.id === productId ? { ...item, cases, loosePcs } : item
    ));
  };

  const handleRemoveFromCart = (productId: string) => {
    setCartItems(cartItems.filter(item => item.product.id !== productId));
    showToast('Product removed from active cart', 'info');
  };

  const handleCartCheckout = async (
    retailerId: string, 
    itemsToCheckout: CartItem[],
    paymentDetails?: CheckoutPaymentDetails
  ) => {
    if (itemsToCheckout.length === 0) return;
    const targetRetailer = retailers.find(r => r.id === retailerId) || retailers[0];
    if (!targetRetailer) {
      showToast('Please select a valid retailer store', 'error');
      return;
    }
    const defaultSalesman = salesmen[0] || { id: 'SAL-01', name: 'Ramesh Kumar (Bengaluru North)' };

    // Build OrderItem array from CartItem array
    let grossSubtotal = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalTax = 0;

    const orderItems: OrderItem[] = itemsToCheckout.map(item => {
      const p = item.product;
      const piecesPerCase = p.piecesPerCase || 24;
      const totalPieces = (item.cases * piecesPerCase) + item.loosePcs;
      const lineGross = totalPieces * p.wholesalePricePiece;
      
      let discount = 0;
      let freePcs = 0;
      let schemeTitle = '';

      if (p.activeScheme && p.activeScheme.isActive) {
        const sch = p.activeScheme;
        if (item.cases >= sch.minQtyCases) {
          if (sch.freeQtyPcs) {
            freePcs = Math.floor(item.cases / sch.minQtyCases) * sch.freeQtyPcs;
            schemeTitle = `${sch.title} (+${freePcs} Pcs Free)`;
          }
          if (sch.discountPercentage) {
            discount = (lineGross * sch.discountPercentage) / 100;
            schemeTitle = `${sch.title} (${sch.discountPercentage}% Off)`;
          }
          if (sch.discountFlatRs) {
            discount = item.cases * sch.discountFlatRs;
            schemeTitle = `${sch.title} (₹${sch.discountFlatRs} off/case)`;
          }
        }
      }

      const netLine = Math.max(0, lineGross - discount);
      const taxable = +(netLine / (1 + p.gstRate / 100)).toFixed(2);
      const gst = +(netLine - taxable).toFixed(2);
      const halfGst = +(gst / 2).toFixed(2);

      grossSubtotal += lineGross;
      totalDiscount += discount;
      totalTaxable += taxable;
      totalTax += gst;

      return {
        productId: p.id,
        sku: p.sku,
        productName: p.name,
        brand: p.brand,
        category: p.category,
        hsnCode: p.hsnCode,
        gstRate: p.gstRate,
        cases: item.cases,
        loosePcs: item.loosePcs,
        totalPieces,
        unitPrice: p.wholesalePricePiece,
        grossAmount: lineGross,
        discountAmount: discount,
        taxableAmount: taxable,
        cgstAmount: halfGst,
        sgstAmount: halfGst,
        igstAmount: 0,
        totalAmount: netLine,
        schemeApplied: schemeTitle || undefined,
        freePcsAwarded: freePcs || undefined
      };
    });

    const finalBillAmount = Math.round(grossSubtotal - totalDiscount);

    // Map payment modes & statuses
    const mode = paymentDetails?.paymentMode || 'cod';
    const isPaid = Boolean(paymentDetails?.isPaidNow);

    let mappedPaymentMode: 'cash' | 'upi' | 'credit' | 'qr' = 'cash';
    let mappedPaymentStatus: PaymentStatus = 'unpaid';
    let paidAmount = 0;
    let outstandingAmount = finalBillAmount;
    let orderRemarks = 'Order Placed via Retailer Web App';

    if (mode === 'cod') {
      mappedPaymentMode = 'cash';
      mappedPaymentStatus = 'unpaid';
      paidAmount = 0;
      outstandingAmount = finalBillAmount;
      orderRemarks = 'Payment Mode: Cash on Delivery (COD) to Van Executive';
    } else if (mode === 'qr') {
      mappedPaymentMode = 'qr';
      if (isPaid) {
        mappedPaymentStatus = 'paid';
        paidAmount = finalBillAmount;
        outstandingAmount = 0;
        orderRemarks = `Payment Mode: UPI Dynamic QR${paymentDetails?.upiRefNumber ? ' (UTR: ' + paymentDetails.upiRefNumber + ')' : ' (Confirmed Paid)'}`;
      } else {
        mappedPaymentStatus = 'unpaid';
        paidAmount = 0;
        outstandingAmount = finalBillAmount;
        orderRemarks = `Payment Mode: UPI Dynamic QR Pending${paymentDetails?.upiRefNumber ? ' (UTR: ' + paymentDetails.upiRefNumber + ')' : ''}`;
      }
    } else if (mode === 'upi') {
      mappedPaymentMode = 'upi';
      if (isPaid) {
        mappedPaymentStatus = 'paid';
        paidAmount = finalBillAmount;
        outstandingAmount = 0;
        orderRemarks = `Payment Mode: Online UPI Intent${paymentDetails?.upiRefNumber ? ' (UTR: ' + paymentDetails.upiRefNumber + ')' : ' (Confirmed Paid)'}`;
      } else {
        mappedPaymentStatus = 'unpaid';
        paidAmount = 0;
        outstandingAmount = finalBillAmount;
        orderRemarks = `Payment Mode: Online UPI Pending${paymentDetails?.upiRefNumber ? ' (UTR: ' + paymentDetails.upiRefNumber + ')' : ''}`;
      }
    } else {
      mappedPaymentMode = 'credit';
      mappedPaymentStatus = 'unpaid';
      paidAmount = 0;
      outstandingAmount = finalBillAmount;
      orderRemarks = 'Payment Mode: Wholesale Ledger Credit (15 Days)';
    }

    const orderPayload = {
      retailerId: targetRetailer.id,
      retailerName: targetRetailer.storeName,
      retailerPhone: targetRetailer.phone || '',
      retailerAddress: targetRetailer.address || '',
      retailerGstin: targetRetailer.gstin || '',
      beatName: targetRetailer.beatName || 'Indiranagar Retail Beat',
      salesmanId: defaultSalesman?.id,
      salesmanName: defaultSalesman?.name,
      orderDate: new Date().toISOString(),
      expectedDeliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      items: orderItems,
      subtotal: grossSubtotal,
      subtotalGross: grossSubtotal,
      totalDiscount,
      totalTaxable,
      taxableAmount: totalTaxable,
      totalCgst: +(totalTax / 2).toFixed(2),
      cgstTotal: +(totalTax / 2).toFixed(2),
      totalSgst: +(totalTax / 2).toFixed(2),
      sgstTotal: +(totalTax / 2).toFixed(2),
      igstTotal: 0,
      totalTax,
      totalGst: totalTax,
      roundOff: 0,
      grandTotal: finalBillAmount,
      totalAmount: finalBillAmount,
      amountPaid: paidAmount,
      outstandingAmount: outstandingAmount,
      paymentMode: mappedPaymentMode,
      paymentStatus: mappedPaymentStatus,
      status: 'booked' as OrderStatus,
      notes: orderRemarks,
      remarks: orderRemarks
    };

    try {
      const created = await api.createOrder(orderPayload);
      showToast(`Order ${created.orderNumber} successfully booked (${mode.toUpperCase()})!`, 'success');
      setCartItems([]);
      setIsCartOpen(false);
      await loadData();
      setActiveInvoiceOrder(created);
    } catch (err) {
      showToast('Failed to checkout cart order', 'error');
    }
  };

  // Handlers
  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      const saved = await api.saveProduct(productData);
      showToast(`SKU ${saved.sku} saved successfully!`, 'success');
      await loadData();
    } catch (err) {
      showToast('Failed to save product SKU', 'error');
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    try {
      await api.deleteProduct(productId);
      showToast('Product SKU removed from catalogue', 'info');
      await loadData();
    } catch (err) {
      showToast('Failed to delete product SKU', 'error');
    }
  };

  const handleInwardStock = async (inwardData: any) => {
    try {
      await api.inwardStock(inwardData);
      showToast('Stock inward received and batch logged!', 'success');
      await loadData();
    } catch (err) {
      showToast('Failed to process stock inward', 'error');
    }
  };

  const handleOutwardStock = async (outwardData: any) => {
    try {
      await api.outwardStock(outwardData);
      showToast('Stock outward / damage adjustment logged successfully!', 'success');
      await loadData();
    } catch (err) {
      showToast('Failed to process stock outward', 'error');
    }
  };

  const handleCreateOrder = async (orderData: any) => {
    try {
      const created = await api.createOrder(orderData);
      showToast(`Order ${created.orderNumber} booked successfully!`, 'success');
      await loadData();
      setActiveInvoiceOrder(created);
    } catch (err) {
      showToast('Failed to punch order', 'error');
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      await api.deleteOrder(orderId);
      showToast('Order cancelled and deleted successfully', 'info');
      await loadData();
    } catch (err) {
      showToast('Failed to delete order', 'error');
    }
  };

  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus, extra?: any) => {
    try {
      const updated = await api.updateOrderStatus(orderId, status, extra);
      showToast(`Order ${updated.orderNumber} marked as ${status.toUpperCase()}!`, 'success');
      await loadData();
    } catch (err) {
      showToast('Failed to update order status', 'error');
    }
  };

  const handleSaveRetailer = async (retailerData: Partial<Retailer>) => {
    try {
      await api.saveRetailer(retailerData);
      showToast('Retailer store saved successfully!', 'success');
      await loadData();
    } catch (err: any) {
      const errMsg = err?.message || 'Failed to save retailer';
      showToast(errMsg, 'error');
      throw err;
    }
  };

  const handleDeleteRetailer = async (retailerId: string) => {
    try {
      await api.deleteRetailer(retailerId);
      showToast('Retailer removed from active master list', 'info');
      await loadData();
    } catch (err) {
      showToast('Failed to delete retailer', 'error');
    }
  };

  const handleSaveSalesman = async (salesmanData: Partial<Salesman>) => {
    try {
      await api.saveSalesman(salesmanData);
      showToast('Salesman representative details updated!', 'success');
      await loadData();
    } catch (err) {
      showToast('Failed to save salesman', 'error');
    }
  };

  const handleDeleteSalesman = async (salesmanId: string) => {
    try {
      await api.deleteSalesman(salesmanId);
      showToast('Sales representative removed', 'info');
      await loadData();
    } catch (err) {
      showToast('Failed to delete salesman', 'error');
    }
  };

  const handleRecordPayment = async (paymentData: any) => {
    try {
      const recorded = await api.recordPayment(paymentData);
      showToast(`Payment receipt ${recorded.receiptNumber} recorded and ledger credited!`, 'success');
      await loadData();
    } catch (err) {
      showToast('Failed to record payment', 'error');
    }
  };

  const handleCompleteDeliveryStop = async (runSheetId: string, orderId: string, podData: any) => {
    try {
      await api.completePOD(runSheetId, orderId, podData);
      showToast('Proof of Delivery verified and recorded!', 'success');
      await loadData();
    } catch (err) {
      showToast('Failed to complete POD stop', 'error');
    }
  };

  const handleDispatchRunSheet = async (runSheetId: string) => {
    try {
      await api.dispatchRunSheet(runSheetId);
      showToast('Vehicle run sheet dispatched to delivery driver!', 'success');
      await loadData();
    } catch (err) {
      showToast('Failed to dispatch run sheet', 'error');
    }
  };

  // Quick Open triggers
  const openNewOrderWithProduct = (productId: string) => {
    setSelectedProductForOrder(productId);
    setIsNewOrderModalOpen(true);
  };

  const openNewOrderForRetailer = (retailerId: string) => {
    setSelectedProductForOrder(undefined);
    setIsNewOrderModalOpen(true);
  };

  const openNewOrderForSalesman = (salesmanId: string) => {
    setSelectedProductForOrder(undefined);
    setIsNewOrderModalOpen(true);
  };

  const openPaymentForRetailer = (ret: Retailer) => {
    setPreselectedRetailerForPayment(ret);
    setActiveTab('payments');
  };

  // 1. Session Verification Loading Guard
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold mb-4 shadow-xl shadow-blue-500/20 ring-4 ring-blue-500/20 animate-pulse">
          <Building2 className="w-8 h-8" />
        </div>
        <h2 className="text-white font-bold text-lg mb-1 tracking-tight">Aryan Agency FMCG Distribution</h2>
        <div className="flex items-center space-x-2 text-slate-400 text-xs mt-2">
          <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
          <span>Verifying Supabase authentication session...</span>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated Guard: Dashboard and all modules are strictly inaccessible without authentication
  if (!currentUser) {
    return (
      <LoginPage
        onLoginSuccess={(loggedInUser) => {
          const role = loggedInUser?.role || currentRole;
          if (role === 'delivery') {
            setActiveTab('deliveries');
          } else if (role === 'retailer') {
            setActiveTab('products');
          } else if (role === 'accounts') {
            setActiveTab('payments');
          } else if (role === 'salesman') {
            setActiveTab('dashboard');
          } else {
            setActiveTab('dashboard');
          }
        }}
      />
    );
  }

  // 3. Authenticated Distribution Data Loading Guard
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-12 h-12 rounded-full border-4 border-amber-500 border-t-transparent animate-spin mb-4" />
        <h2 className="text-base font-bold text-white tracking-wide">ARYAN AGENCY FMCG DISTRIBUTION</h2>
        <p className="text-xs text-slate-400 mt-1">Connecting to super-stockist inventory, beat ledgers & database...</p>
      </div>
    );
  }

  // Pending counts
  const pendingOrdersCount = orders.filter(o => o.status === 'booked' || o.status === 'confirmed').length;
  const criticalBatchesCount = products.reduce((acc, p) => {
    const today = new Date();
    const count = p.batches.filter(b => {
      const exp = new Date(b.expiryDate);
      const diffDays = (exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 90;
    }).length;
    return acc + count;
  }, 0);

  const totalCartCount = cartItems.reduce((s, i) => s + i.cases, 0);

  return (
    <div className="min-h-screen bg-[#F7FAFC] flex flex-col font-sans text-slate-800 antialiased selection:bg-[#DD6B20] selection:text-white">
      
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-5 fade-in duration-200">
          <div className={`px-4 py-2.5 rounded-[4px] shadow-lg border text-xs font-semibold flex items-center space-x-2 ${
            toastMessage.type === 'error'
              ? 'bg-rose-900 text-white border-rose-700'
              : 'bg-[#1A365D] text-white border-blue-900'
          }`}>
            {toastMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-300" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            )}
            <span>{toastMessage.text}</span>
          </div>
        </div>
      )}

      {/* Main Top Header */}
      <Header
        onOpenNewOrder={() => {
          setSelectedProductForOrder(undefined);
          setIsNewOrderModalOpen(true);
        }}
        onOpenAICopilot={() => {
          setIsNewOrderModalOpen(true);
        }}
        onResetData={loadData}
        cartItemCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Module Navigation Tabs */}
      <Navigation
        activeTab={activeTab as any}
        onSelectTab={(tab) => setActiveTab(tab)}
        ordersBadge={pendingOrdersCount}
        lowStockBadge={criticalBatchesCount}
        onOpenNewOrder={() => {
          setSelectedProductForOrder(undefined);
          setIsNewOrderModalOpen(true);
        }}
        onOpenAICopilot={() => {
          setIsNewOrderModalOpen(true);
        }}
      />

      {/* View Router Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 pb-24 md:pb-8">
        
        {/* Dashboard View - Protected */}
        {activeTab === 'dashboard' && (
          <ProtectedRoute 
            pageName="Distribution Dashboard" 
            allowedRoles={['admin', 'salesman', 'accounts']}
            onNavigateHome={() => setActiveTab(getRoleHomeTab())}
          >
            <DashboardView
              products={products}
              orders={orders}
              retailers={retailers}
              salesmen={salesmen}
              onNavigateTab={setActiveTab}
              onOpenNewOrder={() => {
                setSelectedProductForOrder(undefined);
                setIsNewOrderModalOpen(true);
              }}
              onOpenAICopilot={() => {
                setIsNewOrderModalOpen(true);
              }}
              onOpenInvoice={(order) => setActiveInvoiceOrder(order)}
              onInwardStock={(productId) => {
                setActiveTab('inventory');
              }}
            />
          </ProtectedRoute>
        )}

        {/* Orders View - Protected */}
        {activeTab === 'orders' && (
          <ProtectedRoute 
            pageName="Order Booking & Processing"
            allowedRoles={['admin', 'salesman', 'accounts', 'retailer', 'delivery']}
            onNavigateHome={() => setActiveTab(getRoleHomeTab())}
          >
            <OrdersView
              orders={orders}
              onOpenNewOrder={() => {
                setSelectedProductForOrder(undefined);
                setIsNewOrderModalOpen(true);
              }}
              onOpenInvoice={(order) => setActiveInvoiceOrder(order)}
              onUpdateStatus={handleUpdateOrderStatus}
              onOpenDeliveryRun={() => setActiveTab('delivery')}
              onDeleteOrder={handleDeleteOrder}
            />
          </ProtectedRoute>
        )}

        {/* Products & Schemes View - Protected */}
        {activeTab === 'products' && (
          <ProtectedRoute 
            pageName="Product Master & FMCG Schemes"
            allowedRoles={['admin', 'salesman', 'accounts', 'retailer']}
            onNavigateHome={() => setActiveTab(getRoleHomeTab())}
          >
            <ProductsView
              products={products}
              onSaveProduct={handleSaveProduct}
              onDeleteProduct={handleDeleteProduct}
              onAddToCart={handleAddToCart}
              onQuickOrder={openNewOrderWithProduct}
              cartItems={cartItems}
              onUpdateCartItem={handleUpdateCartItem}
              onRemoveFromCart={handleRemoveFromCart}
              onOpenCart={() => setIsCartOpen(true)}
            />
          </ProtectedRoute>
        )}

        {/* Inventory & Batch Expiry View - Protected */}
        {activeTab === 'inventory' && (
          <ProtectedRoute 
            pageName="Warehouse & Batch Inventory"
            allowedRoles={['admin']}
            onNavigateHome={() => setActiveTab(getRoleHomeTab())}
          >
            <InventoryView
              products={products}
              inventoryLogs={inventoryLogs}
              onInwardStock={handleInwardStock}
              onOutwardStock={handleOutwardStock}
            />
          </ProtectedRoute>
        )}

        {/* Retailers & Ledger View - Protected */}
        {activeTab === 'retailers' && (
          <ProtectedRoute 
            pageName="Retail Outlets & Ledgers"
            allowedRoles={['admin', 'salesman', 'accounts', 'retailer']}
            onNavigateHome={() => setActiveTab(getRoleHomeTab())}
          >
            <RetailersView
              retailers={retailers}
              onSaveRetailer={handleSaveRetailer}
              onDeleteRetailer={handleDeleteRetailer}
              onOpenNewOrderForRetailer={openNewOrderForRetailer}
              onRecordPaymentForRetailer={openPaymentForRetailer}
            />
          </ProtectedRoute>
        )}

        {/* Salesmen & Targets View - Protected (Admin Only) */}
        {activeTab === 'salesmen' && (
          <ProtectedRoute 
            pageName="Sales Force & Beat Targets"
            allowedRoles={['admin']}
            onNavigateHome={() => setActiveTab(getRoleHomeTab())}
          >
            <SalesmenView
              salesmen={salesmen}
              onSaveSalesman={handleSaveSalesman}
              onDeleteSalesman={handleDeleteSalesman}
              onOpenNewOrderForSalesman={openNewOrderForSalesman}
            />
          </ProtectedRoute>
        )}

        {/* Delivery Run Sheets & POD View - Protected */}
        {(activeTab === 'deliveries' || activeTab === 'delivery') && (
          <ProtectedRoute 
            pageName="Delivery Run Sheets & Digital POD"
            allowedRoles={['admin', 'delivery']}
            onNavigateHome={() => setActiveTab(getRoleHomeTab())}
          >
            <DeliveryView
              runSheets={deliveryRunSheets}
              orders={orders}
              onCompleteDeliveryStop={handleCompleteDeliveryStop}
              onDispatchRunSheet={handleDispatchRunSheet}
            />
          </ProtectedRoute>
        )}

        {/* Payments & Collections View - Protected */}
        {activeTab === 'payments' && (
          <ProtectedRoute 
            pageName={isRetailer ? "My Payments & Ledger" : "Payment Collections & Invoices"}
            allowedRoles={['admin', 'accounts', 'salesman', 'delivery', 'retailer']}
            onNavigateHome={() => setActiveTab(getRoleHomeTab())}
          >
            <PaymentsView
              payments={payments}
              retailers={retailers}
              orders={orders}
              onOpenInvoice={(order) => setActiveInvoiceOrder(order)}
              onRecordPayment={handleRecordPayment}
              preselectedRetailer={preselectedRetailerForPayment}
            />
          </ProtectedRoute>
        )}

      </main>

      {/* Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        retailers={retailers}
        selectedRetailerId={selectedCartRetailerId}
        onSelectRetailer={setSelectedCartRetailerId}
        onUpdateCartItem={handleUpdateCartItem}
        onRemoveFromCart={handleRemoveFromCart}
        onClearCart={() => setCartItems([])}
        onCheckout={handleCartCheckout}
      />

      {/* Global Order Booking Modal */}
      {isNewOrderModalOpen && (
        <NewOrderModal
          products={products}
          retailers={retailers}
          salesmen={salesmen}
          isOpen={isNewOrderModalOpen}
          onClose={() => setIsNewOrderModalOpen(false)}
          onSubmitOrder={handleCreateOrder}
          initialProductId={selectedProductForOrder}
        />
      )}

      {/* GST Tax Invoice Modal */}
      {activeInvoiceOrder && (
        <InvoiceModal
          order={activeInvoiceOrder}
          onClose={() => setActiveInvoiceOrder(null)}
        />
      )}

      {/* Supabase Authentication & Role Modal */}
      <AuthModal />

      {/* Footer Branding */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-center text-[11px] text-slate-500">
        <span>Aryan Agency FMCG Distribution Suite • ISO 9001:2015 & GST Compliant ERP • Yeshwanthpur, Bengaluru</span>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
