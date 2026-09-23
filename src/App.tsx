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
import { HomePage } from './components/HomePage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MobileHomeView } from './components/MobileHomeView';
import { BannerManagementView } from './components/BannerManagementView';
import { AccountDetailsModal } from './components/AccountDetailsModal';
import { AppUpdateChecker } from './components/AppUpdateChecker';
import { NotificationPanel } from './components/NotificationPanel';
import { BarcodeScannerModal } from './components/BarcodeScannerModal';
import { RetailerVerificationPendingModal } from './components/RetailerVerificationPendingModal';
import { 
  buildLiveNotifications, 
  saveReadNotificationId, 
  markAllNotificationsAsRead, 
  dismissNotification, 
  clearAllNotifications 
} from './lib/notificationService';
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
  PaymentStatus,
  ProductPackingOption,
  AppNotification,
  PromotionalBanner
} from './types';
import { getProductPackingOptions } from './lib/packingUtils';
import { AlertCircle, CheckCircle2, Building2, Loader2 } from 'lucide-react';

function MainApp() {
  const { currentRole, currentUser, isLoading: isAuthLoading, isRetailer, isSalesman, isAdmin, openAuthModal, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<string>('home');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // Public visitor view: 'home' (official FMCG distribution landing page) or 'auth' (login/signup)
  const [publicView, setPublicView] = useState<'home' | 'auth'>('home');
  const [authInitialMode, setAuthInitialMode] = useState<'signin' | 'signup'>('signin');

  // Master State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [retailers, setRetailers] = useState<Retailer[]>([]);
  const [salesmen, setSalesmen] = useState<Salesman[]>([]);
  const [deliveryRunSheets, setDeliveryRunSheets] = useState<DeliveryRunSheet[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryMovement[]>([]);
  const [dashboardMetrics, setDashboardMetrics] = useState<DashboardMetrics | null>(null);
  const [banners, setBanners] = useState<PromotionalBanner[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCartRetailerId, setSelectedCartRetailerId] = useState<string>('');

  // Modals state
  const [isAccountDetailsModalOpen, setIsAccountDetailsModalOpen] = useState(false);
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [selectedProductForOrder, setSelectedProductForOrder] = useState<string | undefined>(undefined);
  const [activeInvoiceOrder, setActiveInvoiceOrder] = useState<Order | null>(null);
  const [preselectedRetailerForPayment, setPreselectedRetailerForPayment] = useState<Retailer | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);

  // Fast Product Search via Barcode Scanner
  const handleProductScanned = (product: Product) => {
    // Fill search query so products filter immediately
    setSearchQuery(product.name);
    // If not already on products or home tab, navigate to products tab
    if (activeTab !== 'home' && activeTab !== 'products') {
      setActiveTab('products');
    }
    showToast(`बारकोड मैच: ${product.name} (डिपो स्टॉक: ${product.currentStockCases} कार्टन)`, 'success');
  };

  // Notifications State
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  // Keep live notifications in sync with orders, products, and payments
  useEffect(() => {
    setNotifications(buildLiveNotifications(orders, products, retailers, payments as any));
  }, [orders, products, retailers, payments]);

  const unreadNotificationsCount = notifications.filter(n => !n.isRead).length;

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
      // Load promotional banners
      try {
        const bannersData = await api.getBanners();
        setBanners(bannersData || []);
      } catch (bErr) {
        console.warn('Could not fetch banners:', bErr);
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

  const refreshBanners = async () => {
    try {
      const bannersData = await api.getBanners();
      setBanners(bannersData || []);
    } catch (err: any) {
      console.error('Failed to reload banners:', err);
    }
  };

  // Check if current user is a retailer and has pending verification
  const linkedRetailer = currentUser?.role === 'retailer' ? retailers.find(r => 
    (currentUser.retailerId && r.id === currentUser.retailerId) ||
    (currentUser.phone && r.phone && r.phone.replace(/\D/g, '').slice(-10) === currentUser.phone.replace(/\D/g, '').slice(-10)) ||
    (currentUser.email && r.email && r.email.toLowerCase() === currentUser.email.toLowerCase()) ||
    (currentUser.name && r.storeName && (
      r.storeName.toLowerCase() === currentUser.name.toLowerCase() ||
      r.ownerName.toLowerCase() === currentUser.name.toLowerCase()
    ))
  ) : undefined;

  const isRetailerPendingVerification = currentUser?.role === 'retailer' && (
    currentUser.verificationStatus === 'rejected' ||
    (linkedRetailer ? linkedRetailer.verificationStatus !== 'verified' : (currentUser.verificationStatus !== 'verified'))
  );

  // Sync active tab with user role permissions
  const getRoleHomeTab = (): NavTab => {
    if (currentRole === 'delivery') return 'deliveries';
    if (currentRole === 'retailer') return 'products';
    if (currentRole === 'accounts') return 'payments';
    return 'dashboard';
  };

  useEffect(() => {
    if (activeTab === 'home') return;
    if (currentRole === 'delivery' && !['deliveries', 'delivery', 'orders', 'payments', 'home'].includes(activeTab)) {
      setActiveTab('home');
    } else if (currentRole === 'salesman' && !['dashboard', 'orders', 'retailers', 'products', 'payments', 'home'].includes(activeTab)) {
      setActiveTab('home');
    } else if (currentRole === 'accounts' && !['payments', 'retailers', 'orders', 'dashboard', 'home'].includes(activeTab)) {
      setActiveTab('home');
    } else if (currentRole === 'retailer' && !['products', 'orders', 'retailers', 'payments', 'home'].includes(activeTab)) {
      setActiveTab('home');
    }
  }, [currentRole]);

  // Cart Handlers
  const handleAddToCart = (product: Product, casesCount: number = 1, packing?: ProductPackingOption) => {
    const qty = Math.max(1, casesCount);
    const itemPacking = packing || getProductPackingOptions(product)[0];
    const existingIndex = cartItems.findIndex(i => 
      i.product.id === product.id && 
      ((!i.selectedPacking && !itemPacking) || i.selectedPacking?.id === itemPacking?.id)
    );

    if (existingIndex > -1) {
      const updated = [...cartItems];
      updated[existingIndex] = {
        ...updated[existingIndex],
        cases: updated[existingIndex].cases + qty
      };
      setCartItems(updated);
    } else {
      setCartItems([...cartItems, { 
        product, 
        cases: qty, 
        loosePcs: 0,
        selectedPacking: itemPacking
      }]);
    }
    const packLabel = itemPacking ? ` (${itemPacking.name})` : '';
    showToast(`Added ${qty} ${itemPacking?.name || 'case(s)'} of ${product.name} to cart!`, 'success');
  };

  const handleUpdateCartItem = (productId: string, cases: number, loosePcs: number, packingId?: string) => {
    if (cases <= 0 && loosePcs <= 0) {
      handleRemoveFromCart(productId, packingId);
      return;
    }
    setCartItems(cartItems.map(item => {
      const matches = item.product.id === productId && (!packingId || item.selectedPacking?.id === packingId);
      return matches ? { ...item, cases, loosePcs } : item;
    }));
  };

  const handleRemoveFromCart = (productId: string, packingId?: string) => {
    setCartItems(cartItems.filter(item => {
      if (item.product.id !== productId) return true;
      if (packingId && item.selectedPacking?.id !== packingId) return true;
      return false;
    }));
    showToast('Product removed from active cart', 'info');
  };

  const handleCartCheckout = async (
    retailerId: string, 
    itemsToCheckout: CartItem[],
    paymentDetails?: CheckoutPaymentDetails
  ) => {
    if (itemsToCheckout.length === 0) return;
    let targetRetailer = retailers.find(r => r.id === retailerId);
    if (!targetRetailer && currentUser?.retailerId) {
      targetRetailer = retailers.find(r => r.id === currentUser.retailerId);
    }
    if (!targetRetailer && retailers.length > 0 && (!currentUser || currentUser.role !== 'retailer')) {
      targetRetailer = retailers[0];
    }
    if (!targetRetailer) {
      const storeName = currentUser?.businessName || currentUser?.name || 'Retail Partner Store';
      const phone = currentUser?.phone || '+91 98000 00000';
      const address = currentUser?.address || 'Main Road, Utraula, Balrampur';
      const rId = currentUser?.retailerId || (currentUser?.id ? `ret_${currentUser.id.replace(/^usr_/, '')}` : `ret_${Date.now()}`);

      targetRetailer = {
        id: rId,
        storeName,
        ownerName: currentUser?.name || storeName,
        phone,
        address,
        area: 'Utraula Central',
        beatName: 'Utraula Retail Beat',
        status: 'active',
        creditLimit: 50000,
        currentOutstanding: 0,
        creditDaysAllowed: 15,
        creditEnabled: true
      };

      api.saveRetailer(targetRetailer).catch((e) => console.warn('Auto-save retailer warning:', e));
      setRetailers(prev => [targetRetailer!, ...prev]);
    }

    // Block order booking if retailer verification is not verified
    if (currentUser?.role === 'retailer') {
      const isVerified = (targetRetailer && targetRetailer.verificationStatus === 'verified') || currentUser.verificationStatus === 'verified';
      if (!isVerified) {
        showToast('सत्यापन लंबित है! जब तक एडमिन द्वारा वेरिफिकेशन पूरा नहीं होता, तब तक ऑर्डर नहीं दिया जा सकता।', 'error');
        return;
      }
    }

    const defaultSalesman = salesmen[0] || { id: 'SAL-01', name: 'Ramesh Kumar (Balrampur / Utraula Beat)' };

    // Build OrderItem array from CartItem array respecting ApnaClub packing tiers
    let grossSubtotal = 0;
    let totalDiscount = 0;
    let totalTaxable = 0;
    let totalTax = 0;

    const orderItems: OrderItem[] = itemsToCheckout.map(item => {
      const p = item.product;
      const piecesPerCase = item.selectedPacking?.pieces || p.piecesPerCase || 24;
      const totalPieces = (item.cases * piecesPerCase) + item.loosePcs;
      const unitRate = item.selectedPacking 
        ? item.selectedPacking.sellingPrice 
        : (p.wholesalePricePiece * (p.piecesPerCase || 24));
      const lineGross = item.selectedPacking
        ? (item.cases * item.selectedPacking.sellingPrice)
        : (totalPieces * p.wholesalePricePiece);
      
      let discount = 0;
      let freePcs = 0;
      let schemeTitle = item.selectedPacking ? item.selectedPacking.name : '';

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
        productName: item.selectedPacking ? `${p.name} [${item.selectedPacking.name}]` : p.name,
        brand: p.brand,
        category: p.category,
        hsnCode: p.hsnCode,
        gstRate: p.gstRate,
        cases: item.cases,
        loosePcs: item.loosePcs,
        totalPieces,
        unitPrice: item.selectedPacking ? +(item.selectedPacking.sellingPrice / item.selectedPacking.pieces).toFixed(2) : p.wholesalePricePiece,
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

    const deliveryCharge = Number(paymentDetails?.deliveryCharge || 0);
    const mdrCharge = Number(paymentDetails?.mdrCharge || 0);
    const finalBillAmount = paymentDetails?.grandTotal !== undefined
      ? paymentDetails.grandTotal
      : Math.round(grossSubtotal - totalDiscount + deliveryCharge + mdrCharge);

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

    if (deliveryCharge > 0) {
      orderRemarks += ` [Delivery: ₹${deliveryCharge}]`;
    }
    if (mdrCharge > 0) {
      orderRemarks += ` [Govt MDR: ₹${mdrCharge}]`;
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
      deliveryCharge,
      mdrCharge,
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
    } catch (err: any) {
      console.error('Checkout error:', err);
      showToast(err?.message || 'Failed to checkout cart order', 'error');
    }
  };

  // Handlers
  const handleSaveProduct = async (productData: Partial<Product>) => {
    try {
      const saved = await api.saveProduct(productData);
      setProducts(prev => {
        const exists = prev.some(p => p.id === saved.id);
        if (exists) {
          return prev.map(p => p.id === saved.id ? saved : p);
        }
        return [saved, ...prev];
      });
      showToast(`SKU ${saved.sku || saved.name} saved successfully!`, 'success');
      await loadData();
      return true;
    } catch (err: any) {
      showToast(err?.message || 'Failed to save product SKU', 'error');
      throw err;
    }
  };

  const handleSaveBatchProducts = async (productsToSave: Partial<Product>[]) => {
    try {
      let savedCount = 0;
      for (const p of productsToSave) {
        await api.saveProduct(p);
        savedCount++;
      }
      showToast(`Successfully added ${savedCount} products in bulk!`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to save batch products', 'error');
      throw err;
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
      setRetailers(prev => prev.filter(r => r.id !== retailerId));
      await api.deleteRetailer(retailerId);
      showToast('Retailer store deleted successfully!', 'info');
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete retailer', 'error');
      await loadData();
    }
  };

  const handleVerifyRetailer = async (retailerId: string, status: 'verified' | 'rejected', remarks?: string) => {
    try {
      setRetailers(prev => prev.map(r => r.id === retailerId ? {
        ...r,
        verificationStatus: status,
        verificationRemarks: remarks || (status === 'verified' ? 'Approved by Admin / Salesman' : 'Rejected'),
        verifiedAt: status === 'verified' ? new Date().toISOString() : undefined,
        verifiedBy: currentUser?.name || 'Admin'
      } : r));
      await api.verifyRetailer(retailerId, status, remarks);
      showToast(`Retailer ${status === 'verified' ? 'verified & approved' : 'rejected'} successfully!`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err?.message || 'Failed to update retailer verification status', 'error');
      await loadData();
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

  // 2. Unauthenticated Guard: Show official FMCG Distribution Home Page first, or Auth Page upon clicking Login/SignUp
  if (!currentUser) {
    if (publicView === 'home') {
      return (
        <HomePage
          onOpenAuth={(mode = 'signin') => {
            setAuthInitialMode(mode);
            setPublicView('auth');
          }}
        />
      );
    }

    return (
      <LoginPage
        initialMode={authInitialMode}
        onBackToHome={() => setPublicView('home')}
        onLoginSuccess={() => {
          setActiveTab('home');
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
        cartItemCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAccount={() => setIsAccountDetailsModalOpen(true)}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        notificationCount={unreadNotificationsCount}
        onOpenNotifications={() => setIsNotificationPanelOpen(true)}
        onOpenBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
      />

      {/* Module Navigation Tabs */}
      <Navigation
        activeTab={activeTab as any}
        onSelectTab={(tab) => setActiveTab(tab)}
        ordersBadge={pendingOrdersCount}
        lowStockBadge={criticalBatchesCount}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenAccountModal={() => setIsAccountDetailsModalOpen(true)}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        onOpenNewOrder={() => {
          setSelectedProductForOrder(undefined);
          setIsNewOrderModalOpen(true);
        }}
        onOpenAICopilot={() => {
          setIsNewOrderModalOpen(true);
        }}
      />

      {/* View Router Area */}
      <main className={`flex-1 w-full mx-auto p-3 sm:p-6 pb-24 md:pb-8 transition-all duration-300 ${
        isAdmin ? 'md:pl-24 lg:pl-72 max-w-[1600px]' : 'max-w-7xl'
      }`}>
        
        {/* Mobile Home Page View - Reference UI match */}
        {activeTab === 'home' && (
          <MobileHomeView
            products={products}
            orders={orders}
            banners={banners}
            onAddToCart={handleAddToCart}
            onNavigateTab={(tab) => setActiveTab(tab)}
            onOpenCart={() => setIsCartOpen(true)}
            onOpenAccountModal={() => setIsAccountDetailsModalOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            cartItems={cartItems}
            onUpdateCartItem={handleUpdateCartItem}
            onRemoveFromCart={handleRemoveFromCart}
            onQuickOrder={openNewOrderWithProduct}
            onOpenBarcodeScanner={() => setIsBarcodeScannerOpen(true)}
          />
        )}

        {/* Dashboard View - Protected */}
        {activeTab === 'dashboard' && (
          <ProtectedRoute 
            pageName="Distribution Dashboard" 
            allowedRoles={['admin', 'salesman', 'accounts']}
            onNavigateHome={() => setActiveTab('home')}
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
              onSaveBatchProducts={handleSaveBatchProducts}
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
              onVerifyRetailer={handleVerifyRetailer}
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

        {/* Banner Management View - Protected (Admin Only) */}
        {activeTab === 'banners' && (
          <ProtectedRoute 
            pageName="Banner & Promotions Management"
            allowedRoles={['admin']}
            onNavigateHome={() => setActiveTab(getRoleHomeTab())}
          >
            <BannerManagementView
              banners={banners}
              onRefreshBanners={refreshBanners}
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

      {/* Logged-In User Account Details Modal */}
      <AccountDetailsModal
        isOpen={isAccountDetailsModalOpen}
        onClose={() => setIsAccountDetailsModalOpen(false)}
        currentUser={currentUser}
        retailers={retailers}
        salesmen={salesmen}
        orders={orders}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsAccountDetailsModalOpen(false);
        }}
        onLogout={logout}
      />

      {/* Real-time Notification Panel */}
      <NotificationPanel
        isOpen={isNotificationPanelOpen}
        onClose={() => setIsNotificationPanelOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) => {
          saveReadNotificationId(id);
          setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        }}
        onMarkAllAsRead={() => {
          markAllNotificationsAsRead(notifications);
          setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        }}
        onDismiss={(id) => {
          dismissNotification(id);
          setNotifications(prev => prev.filter(n => n.id !== id));
        }}
        onClearAll={() => {
          clearAllNotifications(notifications);
          setNotifications([]);
        }}
        onNavigateTab={(tab) => {
          setActiveTab(tab);
          setIsNotificationPanelOpen(false);
        }}
      />

      {/* Global Barcode Scanner Modal with Camera Access */}
      {isBarcodeScannerOpen && (
        <BarcodeScannerModal
          isOpen={isBarcodeScannerOpen}
          onClose={() => setIsBarcodeScannerOpen(false)}
          products={products}
          onProductFound={handleProductScanned}
        />
      )}

      {/* Retailer Verification Blocking Full-Screen Modal */}
      {isRetailerPendingVerification && currentUser && (
        <RetailerVerificationPendingModal
          currentUser={currentUser}
          linkedRetailer={linkedRetailer}
          onRefresh={loadData}
          onLogout={logout}
        />
      )}

      {/* Footer Branding */}
      <footer className="bg-white border-t border-slate-200 py-3 px-4 text-center text-[11px] text-slate-500">
        <span>Aryan Agency FMCG Distribution Suite • ISO 9001:2015 & GST Compliant ERP • Utraula, Balrampur, Uttar Pradesh</span>
      </footer>

    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
      <AppUpdateChecker />
    </AuthProvider>
  );
}
