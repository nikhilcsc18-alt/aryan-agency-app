import { AppNotification, Order, Product, Retailer, PaymentRecord } from '../types';

const STORAGE_KEY_READ_IDS = 'aryan_notifications_read_ids_v1';
const STORAGE_KEY_DISMISSED_IDS = 'aryan_notifications_dismissed_ids_v1';

export function getReadNotificationIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_READ_IDS);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function saveReadNotificationId(id: string): void {
  try {
    const readIds = getReadNotificationIds();
    readIds.add(id);
    localStorage.setItem(STORAGE_KEY_READ_IDS, JSON.stringify(Array.from(readIds)));
  } catch (err) {
    console.error('Failed to save read notification:', err);
  }
}

export function markAllNotificationsAsRead(notifications: AppNotification[]): void {
  try {
    const readIds = getReadNotificationIds();
    notifications.forEach(n => readIds.add(n.id));
    localStorage.setItem(STORAGE_KEY_READ_IDS, JSON.stringify(Array.from(readIds)));
  } catch (err) {
    console.error('Failed to mark all as read:', err);
  }
}

export function getDismissedNotificationIds(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_DISMISSED_IDS);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function dismissNotification(id: string): void {
  try {
    const ids = getDismissedNotificationIds();
    ids.add(id);
    localStorage.setItem(STORAGE_KEY_DISMISSED_IDS, JSON.stringify(Array.from(ids)));
  } catch (err) {
    console.error('Failed to dismiss notification:', err);
  }
}

export function clearAllNotifications(notifications: AppNotification[]): void {
  try {
    const ids = getDismissedNotificationIds();
    notifications.forEach(n => ids.add(n.id));
    localStorage.setItem(STORAGE_KEY_DISMISSED_IDS, JSON.stringify(Array.from(ids)));
  } catch (err) {
    console.error('Failed to clear notifications:', err);
  }
}

/**
 * Builds live notifications from current application state
 */
export function buildLiveNotifications(
  orders: Order[] = [],
  products: Product[] = [],
  retailers: Retailer[] = [],
  payments: PaymentRecord[] = []
): AppNotification[] {
  const readIds = getReadNotificationIds();
  const dismissedIds = getDismissedNotificationIds();
  const notifications: AppNotification[] = [];

  // 1. Feature Notification: Aryan Agency Packing Options Live
  notifications.push({
    id: 'notif_feature_aryan_packings',
    title: 'Aryan Agency Packing Options Active',
    message: 'Ab aap Pack of 1, Pack of 2, Pack of 4, aur Pack of 10 jaisi custom packings bina kisi restriction ke select kar sakte hain. Margin % aur per-unit price har pack par clearly dikh rahe hain!',
    timestamp: 'Just now',
    type: 'scheme',
    isRead: readIds.has('notif_feature_aryan_packings'),
    actionTab: 'products'
  });

  // 2. Recent Order Updates
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = new Date(a.orderDate || '').getTime() || 0;
    const dateB = new Date(b.orderDate || '').getTime() || 0;
    return dateB - dateA;
  });

  if (sortedOrders.length > 0) {
    const latestOrder = sortedOrders[0];
    const statusText = latestOrder.status === 'dispatched' 
      ? 'Out for delivery via distribution vehicle' 
      : latestOrder.status === 'delivered' 
      ? 'Successfully delivered & received' 
      : latestOrder.status === 'confirmed'
      ? 'Confirmed and scheduled for dispatch'
      : 'Order received & pending distributor confirmation';

    const orderAmount = latestOrder.grandTotal || latestOrder.subtotal || 0;

    notifications.push({
      id: `notif_order_${latestOrder.id}`,
      title: `Order #${latestOrder.orderNumber || latestOrder.id.slice(0, 8)} ${latestOrder.status.toUpperCase()}`,
      message: `${latestOrder.retailerName || 'Retailer'}: ${statusText}. Total bill amount ₹${Math.round(orderAmount).toLocaleString('en-IN')}.`,
      timestamp: '15 mins ago',
      type: 'order',
      isRead: readIds.has(`notif_order_${latestOrder.id}`),
      actionTab: 'orders',
      metadata: { orderId: latestOrder.id }
    });

    if (sortedOrders.length > 1) {
      const secondOrder = sortedOrders[1];
      notifications.push({
        id: `notif_order_${secondOrder.id}`,
        title: `Dispatch Notice: #${secondOrder.orderNumber || secondOrder.id.slice(0, 8)}`,
        message: `${secondOrder.retailerName || 'Store'}: ${secondOrder.items?.length || 1} product lines in delivery schedule.`,
        timestamp: '1 hour ago',
        type: 'order',
        isRead: readIds.has(`notif_order_${secondOrder.id}`),
        actionTab: 'orders',
        metadata: { orderId: secondOrder.id }
      });
    }
  }

  // 3. Low Stock Inventory Alerts
  const lowStockProducts = products.filter(p => p.currentStockCases <= p.reorderLevelCases);
  if (lowStockProducts.length > 0) {
    const topLowStock = lowStockProducts[0];
    notifications.push({
      id: `notif_stock_${topLowStock.id}`,
      title: `Stock Alert: ${topLowStock.name}`,
      message: `Only ${topLowStock.currentStockCases} cases remaining in warehouse (Reorder Level: ${topLowStock.reorderLevelCases} cs). New stock inward suggested.`,
      timestamp: '2 hours ago',
      type: 'inventory',
      isRead: readIds.has(`notif_stock_${topLowStock.id}`),
      actionTab: 'inventory',
      metadata: { productId: topLowStock.id }
    });
  }

  // 4. Trade Schemes & High-Margin Offers
  const schemeProducts = products.filter(p => p.activeScheme && p.activeScheme.isActive);
  if (schemeProducts.length > 0) {
    const promo = schemeProducts[0];
    const sch = promo.activeScheme!;
    notifications.push({
      id: `notif_scheme_${promo.id}`,
      title: `Trade Scheme: ${promo.brand}`,
      message: `${promo.name}: ${sch.title || 'Buy wholesale packs to earn extra retailer margin'}. Special scheme valid this week.`,
      timestamp: 'Today, 10:00 AM',
      type: 'scheme',
      isRead: readIds.has(`notif_scheme_${promo.id}`),
      actionTab: 'products',
      metadata: { productId: promo.id }
    });
  }

  // 5. Payment & Collection Reminder
  if (payments && payments.length > 0) {
    const latestPayment = payments[0];
    notifications.push({
      id: `notif_payment_${latestPayment.id}`,
      title: `Payment Received: ₹${Math.round(latestPayment.amount).toLocaleString('en-IN')}`,
      message: `Received via ${latestPayment.paymentMode.toUpperCase()} from ${latestPayment.retailerName || 'Retailer'}. Ledger balance updated.`,
      timestamp: 'Yesterday',
      type: 'payment',
      isRead: readIds.has(`notif_payment_${latestPayment.id}`),
      actionTab: 'payments',
      metadata: { paymentId: latestPayment.id }
    });
  }

  // 6. System Version Notification
  notifications.push({
    id: 'notif_sys_update_v130',
    title: 'Aryan Agency App v1.3.0 Ready',
    message: 'Naya version available hai: Aryan Agency multi-packing support, dynamic margin calculator aur 1-click in-app update ke sath.',
    timestamp: 'Yesterday',
    type: 'system',
    isRead: readIds.has('notif_sys_update_v130'),
    actionTab: 'dashboard'
  });

  // Filter out any dismissed notifications
  return notifications.filter(n => !dismissedIds.has(n.id));
}
