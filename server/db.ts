import fs from 'fs';
import path from 'path';
import { 
  Product, 
  Retailer, 
  Salesman, 
  Order, 
  DeliveryRunSheet, 
  PaymentRecord, 
  InventoryMovement, 
  User 
} from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface DatabaseSchema {
  users: User[];
  products: Product[];
  retailers: Retailer[];
  salesmen: Salesman[];
  orders: Order[];
  deliveries: DeliveryRunSheet[];
  payments: PaymentRecord[];
  inventoryLogs: InventoryMovement[];
}

const INITIAL_DATA: DatabaseSchema = {
  users: [
    {
      id: 'usr_admin',
      name: 'Aryan Sharma',
      email: 'aryan@aryanagency.in',
      phone: '+91 98450 12345',
      role: 'admin',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_sales_1',
      name: 'Rajesh Kumar',
      email: 'rajesh.sales@aryanagency.in',
      phone: '+91 98860 34567',
      role: 'salesman',
      salesmanId: 'slm_1',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_sales_2',
      name: 'Vikram Singh',
      email: 'vikram.sales@aryanagency.in',
      phone: '+91 99001 56789',
      role: 'salesman',
      salesmanId: 'slm_2',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_delivery_1',
      name: 'Suresh Gowda (Van KA-05-AB-1234)',
      email: 'suresh.van1@aryanagency.in',
      phone: '+91 97410 78901',
      role: 'delivery',
      deliveryId: 'del_1',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_accounts_1',
      name: 'Pooja Agarwal (Accounts Head)',
      email: 'pooja.accounts@aryanagency.in',
      phone: '+91 98450 67890',
      role: 'accounts',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_retailer_1',
      name: 'Ramesh Gupta (Laxmi Supermarket)',
      email: 'laxmi.supermarket@gmail.com',
      phone: '+91 98455 22334',
      role: 'retailer',
      retailerId: 'ret_1',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80'
    }
  ],
  products: [
    {
      id: 'prd_1',
      sku: 'PARLE-G-80G',
      name: 'Parle-G Glucose Biscuit (80g)',
      brand: 'Parle',
      category: 'Biscuits & Bakery',
      hsnCode: '19053100',
      gstRate: 18,
      piecesPerCase: 60,
      mrpPiece: 10,
      wholesalePricePiece: 8.40,
      casePrice: 504,
      currentStockCases: 85,
      currentStockLoosePcs: 14,
      reorderLevelCases: 25,
      imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
      description: 'Original glucose energy biscuit, India’s largest selling brand. 80g standard retail pack.',
      batches: [
        {
          batchNumber: 'PAR-26A-01',
          mfgDate: '2026-07-10',
          expiryDate: '2027-01-10',
          stockCases: 50,
          stockLoosePcs: 14,
          warehouseBin: 'A-01-01'
        },
        {
          batchNumber: 'PAR-26B-02',
          mfgDate: '2026-08-01',
          expiryDate: '2027-02-01',
          stockCases: 35,
          stockLoosePcs: 0,
          warehouseBin: 'A-01-02'
        }
      ],
      activeScheme: {
        id: 'sch_1',
        title: 'Monsoon Volume Booster',
        description: 'Order 5+ cases and get 6 loose packs free',
        minQtyCases: 5,
        freeQtyPcs: 6,
        isActive: true
      }
    },
    {
      id: 'prd_2',
      sku: 'BRIT-GD-BUTTER-100G',
      name: 'Britannia Good Day Butter Cookies (100g)',
      brand: 'Britannia',
      category: 'Biscuits & Bakery',
      hsnCode: '19053100',
      gstRate: 18,
      piecesPerCase: 48,
      mrpPiece: 20,
      wholesalePricePiece: 16.80,
      casePrice: 806.40,
      currentStockCases: 62,
      currentStockLoosePcs: 8,
      reorderLevelCases: 20,
      imageUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=500&auto=format&fit=crop&q=80',
      description: 'Rich buttery cookies with a delightful crunch and smile pattern.',
      batches: [
        {
          batchNumber: 'BRT-GD-991',
          mfgDate: '2026-06-15',
          expiryDate: '2026-12-15',
          stockCases: 62,
          stockLoosePcs: 8,
          warehouseBin: 'A-02-01'
        }
      ],
      activeScheme: {
        id: 'sch_2',
        title: 'Smile Scheme',
        description: '3% cash discount on booking 10+ cases',
        minQtyCases: 10,
        discountPercentage: 3,
        isActive: true
      }
    },
    {
      id: 'prd_3',
      sku: 'AMUL-BUTTER-500G',
      name: 'Amul Pasteurised Butter (500g)',
      brand: 'Amul',
      category: 'Dairy & Refrigerated',
      hsnCode: '04051000',
      gstRate: 12,
      piecesPerCase: 20,
      mrpPiece: 275,
      wholesalePricePiece: 248.00,
      casePrice: 4960.00,
      currentStockCases: 18,
      currentStockLoosePcs: 5,
      reorderLevelCases: 15,
      imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop&q=80',
      description: 'The Taste of India. Delicious creamy pasteurised butter.',
      batches: [
        {
          batchNumber: 'AML-BT-2026-08',
          mfgDate: '2026-08-10',
          expiryDate: '2026-11-10',
          stockCases: 18,
          stockLoosePcs: 5,
          warehouseBin: 'COLD-01'
        }
      ]
    },
    {
      id: 'prd_4',
      sku: 'MAGGI-2MIN-70G',
      name: 'Maggi 2-Minute Masala Noodles (70g)',
      brand: 'Nestle',
      category: 'Spices & Staples',
      hsnCode: '19023010',
      gstRate: 12,
      piecesPerCase: 96,
      mrpPiece: 14,
      wholesalePricePiece: 11.90,
      casePrice: 1142.40,
      currentStockCases: 110,
      currentStockLoosePcs: 22,
      reorderLevelCases: 30,
      imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=80',
      description: 'India’s favorite instant masala noodles with authentic signature tastemaker.',
      batches: [
        {
          batchNumber: 'NES-MAG-882',
          mfgDate: '2026-07-20',
          expiryDate: '2027-04-20',
          stockCases: 110,
          stockLoosePcs: 22,
          warehouseBin: 'B-01-04'
        }
      ],
      activeScheme: {
        id: 'sch_4',
        title: 'Noodle Dhamaka',
        description: 'Flat ₹40 discount per case for 4+ cases',
        minQtyCases: 4,
        discountFlatRs: 40,
        isActive: true
      }
    },
    {
      id: 'prd_5',
      sku: 'TATA-TEA-PREM-500G',
      name: 'Tata Tea Premium Desh Ki Chai (500g)',
      brand: 'Tata',
      category: 'Beverages',
      hsnCode: '09024020',
      gstRate: 5,
      piecesPerCase: 24,
      mrpPiece: 310,
      wholesalePricePiece: 268.00,
      casePrice: 6432.00,
      currentStockCases: 42,
      currentStockLoosePcs: 11,
      reorderLevelCases: 15,
      imageUrl: 'https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=80',
      description: 'Unique blend of big tea leaves for aroma and small tea grains for strong taste.',
      batches: [
        {
          batchNumber: 'TAT-TEA-554',
          mfgDate: '2026-06-01',
          expiryDate: '2027-06-01',
          stockCases: 42,
          stockLoosePcs: 11,
          warehouseBin: 'B-02-01'
        }
      ]
    },
    {
      id: 'prd_6',
      sku: 'SURF-EXCEL-EASY-1KG',
      name: 'Surf Excel Easy Wash Detergent Powder (1kg)',
      brand: 'Hindustan Unilever',
      category: 'Household & Hygiene',
      hsnCode: '34022010',
      gstRate: 18,
      piecesPerCase: 18,
      mrpPiece: 145,
      wholesalePricePiece: 122.50,
      casePrice: 2205.00,
      currentStockCases: 54,
      currentStockLoosePcs: 4,
      reorderLevelCases: 20,
      imageUrl: 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=80',
      description: 'Superior stain removal technology with fine washing powder.',
      batches: [
        {
          batchNumber: 'HUL-SRF-102',
          mfgDate: '2026-05-18',
          expiryDate: '2028-05-18',
          stockCases: 54,
          stockLoosePcs: 4,
          warehouseBin: 'C-01-02'
        }
      ],
      activeScheme: {
        id: 'sch_6',
        title: 'Clean Wash Promo',
        description: 'Get 1 pack free with every 3 cases booked',
        minQtyCases: 3,
        freeQtyPcs: 1,
        isActive: true
      }
    },
    {
      id: 'prd_7',
      sku: 'COLGATE-MAXFRESH-150G',
      name: 'Colgate MaxFresh Peppermint Toothpaste (150g)',
      brand: 'Colgate-Palmolive',
      category: 'Personal Care',
      hsnCode: '33061020',
      gstRate: 18,
      piecesPerCase: 36,
      mrpPiece: 120,
      wholesalePricePiece: 98.00,
      casePrice: 3528.00,
      currentStockCases: 38,
      currentStockLoosePcs: 15,
      reorderLevelCases: 15,
      imageUrl: 'https://images.unsplash.com/photo-1559656914-a30970c1affd?w=500&auto=format&fit=crop&q=80',
      description: 'Infused with cooling crystals for intense freshness and germ protection.',
      batches: [
        {
          batchNumber: 'CLG-MX-404',
          mfgDate: '2026-06-25',
          expiryDate: '2028-06-25',
          stockCases: 38,
          stockLoosePcs: 15,
          warehouseBin: 'C-02-03'
        }
      ]
    },
    {
      id: 'prd_8',
      sku: 'CADBURY-DAIRY-MILK-SILK',
      name: 'Cadbury Dairy Milk Silk Chocolate (60g)',
      brand: 'Mondelez',
      category: 'Confectionery & Chocolates',
      hsnCode: '18063100',
      gstRate: 18,
      piecesPerCase: 40,
      mrpPiece: 80,
      wholesalePricePiece: 67.20,
      casePrice: 2688.00,
      currentStockCases: 28,
      currentStockLoosePcs: 12,
      reorderLevelCases: 12,
      imageUrl: 'https://images.unsplash.com/photo-1548907040-4baa42d10919?w=500&auto=format&fit=crop&q=80',
      description: 'Smooth, creamy chocolate crafted with pure dairy milk indulgence.',
      batches: [
        {
          batchNumber: 'MDZ-SLK-771',
          mfgDate: '2026-07-05',
          expiryDate: '2027-01-05',
          stockCases: 28,
          stockLoosePcs: 12,
          warehouseBin: 'COLD-02'
        }
      ]
    },
    {
      id: 'prd_9',
      sku: 'LAYS-MAGIC-MASALA-50G',
      name: 'Lay\'s India\'s Magic Masala Potato Chips (50g)',
      brand: 'PepsiCo',
      category: 'Snacks & Namkeen',
      hsnCode: '20052000',
      gstRate: 12,
      piecesPerCase: 50,
      mrpPiece: 20,
      wholesalePricePiece: 16.50,
      casePrice: 825.00,
      currentStockCases: 74,
      currentStockLoosePcs: 19,
      reorderLevelCases: 25,
      imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=80',
      description: 'Crispy ridge-cut potato chips seasoned with authentic Indian spice mix.',
      batches: [
        {
          batchNumber: 'PEP-LAY-331',
          mfgDate: '2026-08-05',
          expiryDate: '2026-12-05',
          stockCases: 74,
          stockLoosePcs: 19,
          warehouseBin: 'A-03-01'
        }
      ],
      activeScheme: {
        id: 'sch_9',
        title: 'Snack Blast',
        description: 'Buy 5 cases get 5% instant discount',
        minQtyCases: 5,
        discountPercentage: 5,
        isActive: true
      }
    },
    {
      id: 'prd_10',
      sku: 'FORTUNE-SUNFLOWER-1L',
      name: 'Fortune Sunlite Refined Sunflower Oil (1 Litre Pouch)',
      brand: 'Adani Wilmar',
      category: 'Spices & Staples',
      hsnCode: '15121910',
      gstRate: 5,
      piecesPerCase: 12,
      mrpPiece: 160,
      wholesalePricePiece: 138.00,
      casePrice: 1656.00,
      currentStockCases: 48,
      currentStockLoosePcs: 6,
      reorderLevelCases: 20,
      imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80',
      description: 'Light, healthy cooking oil enriched with Vitamins A & D.',
      batches: [
        {
          batchNumber: 'AWL-SUN-119',
          mfgDate: '2026-07-15',
          expiryDate: '2027-04-15',
          stockCases: 48,
          stockLoosePcs: 6,
          warehouseBin: 'D-01-01'
        }
      ]
    },
    {
      id: 'prd_11',
      sku: 'DETTOL-ORIGINAL-SOAP-125G',
      name: 'Dettol Original Germ Protection Soap (125g Pack of 4)',
      brand: 'Reckitt',
      category: 'Personal Care',
      hsnCode: '34011110',
      gstRate: 18,
      piecesPerCase: 24,
      mrpPiece: 190,
      wholesalePricePiece: 158.00,
      casePrice: 3792.00,
      currentStockCases: 32,
      currentStockLoosePcs: 7,
      reorderLevelCases: 15,
      imageUrl: 'https://images.unsplash.com/photo-1607006314175-9988185d95d1?w=500&auto=format&fit=crop&q=80',
      description: 'Trusted antibacterial protection with pine fragrance.',
      batches: [
        {
          batchNumber: 'RKT-DET-621',
          mfgDate: '2026-06-10',
          expiryDate: '2028-06-10',
          stockCases: 32,
          stockLoosePcs: 7,
          warehouseBin: 'C-03-01'
        }
      ]
    },
    {
      id: 'prd_12',
      sku: 'HALDIRAM-ALOO-BHUJIA-400G',
      name: 'Haldiram\'s Nagpur Aloo Bhujia (400g)',
      brand: 'Haldiram',
      category: 'Snacks & Namkeen',
      hsnCode: '21069099',
      gstRate: 12,
      piecesPerCase: 24,
      mrpPiece: 110,
      wholesalePricePiece: 91.50,
      casePrice: 2196.00,
      currentStockCases: 51,
      currentStockLoosePcs: 14,
      reorderLevelCases: 18,
      imageUrl: 'https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=500&auto=format&fit=crop&q=80',
      description: 'Spicy potato and tepary bean flour noodles with mint zest.',
      batches: [
        {
          batchNumber: 'HLD-AB-801',
          mfgDate: '2026-07-28',
          expiryDate: '2027-01-28',
          stockCases: 51,
          stockLoosePcs: 14,
          warehouseBin: 'A-04-02'
        }
      ]
    }
  ],
  retailers: [
    {
      id: 'ret_1',
      storeName: 'Laxmi Supermarket',
      ownerName: 'Ramesh Gupta',
      phone: '+91 98455 22334',
      email: 'laxmi.supermarket@gmail.com',
      address: '#42, 100ft Road, Indiranagar',
      area: 'Indiranagar',
      beatName: 'Indiranagar Retail Beat',
      gstin: '29ABCDE1234F1Z5',
      panNumber: 'ABCDE1234F',
      creditLimit: 100000,
      currentOutstanding: 28450,
      creditDaysAllowed: 15,
      lat: 12.9784,
      lng: 77.6408,
      status: 'active',
      createdAt: '2025-01-10'
    },
    {
      id: 'ret_2',
      storeName: 'Shree Ganesh Provision Stores',
      ownerName: 'Ganesh Hegde',
      phone: '+91 94481 99882',
      email: 'ganesh.provisions@yahoo.com',
      address: '#118, Brigade Road, Ashok Nagar',
      area: 'MG Road Area',
      beatName: 'MG Road Commercial Beat',
      gstin: '29BCDEF2345G1Z6',
      panNumber: 'BCDEF2345G',
      creditLimit: 75000,
      currentOutstanding: 41200,
      creditDaysAllowed: 10,
      lat: 12.9734,
      lng: 77.6074,
      status: 'active',
      createdAt: '2025-02-14'
    },
    {
      id: 'ret_3',
      storeName: 'Balaji Daily Needs & Bakery',
      ownerName: 'Murali Krishna',
      phone: '+91 98802 77665',
      email: 'balajidaily@gmail.com',
      address: '#89, 5th Block, Koramangala',
      area: 'Koramangala',
      beatName: 'Koramangala Daily Beat',
      gstin: '29CDEFG3456H1Z7',
      panNumber: 'CDEFG3456H',
      creditLimit: 60000,
      currentOutstanding: 59200,
      creditDaysAllowed: 7,
      lat: 12.9352,
      lng: 77.6245,
      status: 'overdue',
      createdAt: '2025-03-01'
    },
    {
      id: 'ret_4',
      storeName: 'Sri Sai Ram Mart',
      ownerName: 'Venkatesh Rao',
      phone: '+91 97400 11223',
      email: 'sairammart.blr@gmail.com',
      address: '#15, ITPL Main Road, Whitefield',
      area: 'Whitefield',
      beatName: 'Whitefield Supermarket Beat',
      gstin: '29DEFGH4567I1Z8',
      panNumber: 'DEFGH4567I',
      creditLimit: 150000,
      currentOutstanding: 14500,
      creditDaysAllowed: 21,
      lat: 12.9698,
      lng: 77.7500,
      status: 'active',
      createdAt: '2025-01-20'
    },
    {
      id: 'ret_5',
      storeName: 'Metro Kirana & General Store',
      ownerName: 'Anand Patel',
      phone: '+91 99165 44332',
      email: 'metrokirana@gmail.com',
      address: '#73, Commercial Street, Tasker Town',
      area: 'Commercial Street',
      beatName: 'MG Road Commercial Beat',
      gstin: '29EFGHI5678J1Z9',
      panNumber: 'EFGHI5678J',
      creditLimit: 50000,
      currentOutstanding: 0,
      creditDaysAllowed: 10,
      lat: 12.9822,
      lng: 77.6083,
      status: 'active',
      createdAt: '2025-04-12'
    },
    {
      id: 'ret_6',
      storeName: 'Jai Hind Traders',
      ownerName: 'Sanjay Agarwal',
      phone: '+91 98451 88990',
      email: 'jaihind.traders@gmail.com',
      address: '#22, 12th Main, 4th Block Jayanagar',
      area: 'Jayanagar',
      beatName: 'Jayanagar Provision Beat',
      gstin: '29FGHIJ6789K1Z0',
      panNumber: 'FGHIJ6789K',
      creditLimit: 80000,
      currentOutstanding: 82000,
      creditDaysAllowed: 7,
      lat: 12.9299,
      lng: 77.5826,
      status: 'blocked',
      createdAt: '2025-02-05'
    }
  ],
  salesmen: [
    {
      id: 'slm_1',
      employeeCode: 'EMP-AA-101',
      name: 'Rajesh Kumar',
      phone: '+91 98860 34567',
      email: 'rajesh.sales@aryanagency.in',
      assignedBeats: ['Indiranagar Retail Beat', 'MG Road Commercial Beat'],
      dailyTargetAmount: 75000,
      monthlyTargetAmount: 1800000,
      currentMonthAchieved: 1420000,
      commissionPercentage: 1.5,
      todayOrdersCount: 6,
      todaySalesAmount: 64200,
      status: 'active'
    },
    {
      id: 'slm_2',
      employeeCode: 'EMP-AA-102',
      name: 'Vikram Singh',
      phone: '+91 99001 56789',
      email: 'vikram.sales@aryanagency.in',
      assignedBeats: ['Koramangala Daily Beat', 'Jayanagar Provision Beat'],
      dailyTargetAmount: 65000,
      monthlyTargetAmount: 1600000,
      currentMonthAchieved: 1180000,
      commissionPercentage: 1.5,
      todayOrdersCount: 4,
      todaySalesAmount: 48900,
      status: 'active'
    },
    {
      id: 'slm_3',
      employeeCode: 'EMP-AA-103',
      name: 'Karthik Nambiar',
      phone: '+91 97412 88441',
      email: 'karthik.sales@aryanagency.in',
      assignedBeats: ['Whitefield Supermarket Beat'],
      dailyTargetAmount: 90000,
      monthlyTargetAmount: 2200000,
      currentMonthAchieved: 1950000,
      commissionPercentage: 1.8,
      todayOrdersCount: 5,
      todaySalesAmount: 89400,
      status: 'active'
    }
  ],
  deliveries: [
    {
      id: 'del_run_1',
      runNumber: 'RUN-2026-088',
      date: '2026-09-02',
      driverName: 'Suresh Gowda',
      driverPhone: '+91 97410 78901',
      vehicleNumber: 'KA-05-AB-1234',
      beatNames: ['Indiranagar Retail Beat', 'MG Road Commercial Beat'],
      totalOrders: 4,
      deliveredOrders: 2,
      totalOrderValue: 56740,
      totalCashCollected: 18500,
      totalUpiCollected: 24200,
      status: 'out_for_delivery',
      orderIds: ['ord_1001', 'ord_1002', 'ord_1003', 'ord_1004']
    },
    {
      id: 'del_run_2',
      runNumber: 'RUN-2026-087',
      date: '2026-09-01',
      driverName: 'Manjunath Reddy',
      driverPhone: '+91 96112 33445',
      vehicleNumber: 'KA-04-CD-5678',
      beatNames: ['Koramangala Daily Beat'],
      totalOrders: 6,
      deliveredOrders: 6,
      totalOrderValue: 84300,
      totalCashCollected: 35000,
      totalUpiCollected: 49300,
      status: 'completed',
      orderIds: ['ord_0998', 'ord_0999']
    }
  ],
  orders: [
    {
      id: 'ord_1001',
      orderNumber: 'ORD-2026-1001',
      retailerId: 'ret_1',
      retailerName: 'Laxmi Supermarket',
      retailerPhone: '+91 98455 22334',
      retailerAddress: '#42, 100ft Road, Indiranagar',
      retailerGstin: '29ABCDE1234F1Z5',
      beatName: 'Indiranagar Retail Beat',
      salesmanId: 'slm_1',
      salesmanName: 'Rajesh Kumar',
      orderDate: '2026-09-02T09:30:00Z',
      expectedDeliveryDate: '2026-09-02',
      items: [
        {
          productId: 'prd_1',
          sku: 'PARLE-G-80G',
          productName: 'Parle-G Glucose Biscuit (80g)',
          brand: 'Parle',
          category: 'Biscuits & Bakery',
          hsnCode: '19053100',
          gstRate: 18,
          cases: 6,
          loosePcs: 0,
          totalPieces: 360,
          unitPrice: 8.40,
          grossAmount: 3024.00,
          discountAmount: 0,
          taxableAmount: 2562.71,
          cgstAmount: 230.64,
          sgstAmount: 230.64,
          igstAmount: 0,
          totalAmount: 3024.00,
          schemeApplied: 'Monsoon Volume Booster (+6 Pcs Free)',
          freePcsAwarded: 6
        },
        {
          productId: 'prd_4',
          sku: 'MAGGI-2MIN-70G',
          productName: 'Maggi 2-Minute Masala Noodles (70g)',
          brand: 'Nestle',
          category: 'Spices & Staples',
          hsnCode: '19023010',
          gstRate: 12,
          cases: 5,
          loosePcs: 0,
          totalPieces: 480,
          unitPrice: 11.90,
          grossAmount: 5712.00,
          discountAmount: 200.00,
          taxableAmount: 4921.43,
          cgstAmount: 295.29,
          sgstAmount: 295.29,
          igstAmount: 0,
          totalAmount: 5512.00,
          schemeApplied: 'Noodle Dhamaka (₹40 off/case)',
          freePcsAwarded: 0
        },
        {
          productId: 'prd_3',
          sku: 'AMUL-BUTTER-500G',
          productName: 'Amul Pasteurised Butter (500g)',
          brand: 'Amul',
          category: 'Dairy & Refrigerated',
          hsnCode: '04051000',
          gstRate: 12,
          cases: 2,
          loosePcs: 0,
          totalPieces: 40,
          unitPrice: 248.00,
          grossAmount: 9920.00,
          discountAmount: 0,
          taxableAmount: 8857.14,
          cgstAmount: 531.43,
          sgstAmount: 531.43,
          igstAmount: 0,
          totalAmount: 9920.00
        }
      ],
      subtotal: 18656.00,
      totalDiscount: 200.00,
      totalTaxable: 16341.28,
      totalCgst: 1057.36,
      totalSgst: 1057.36,
      totalTax: 2114.72,
      roundOff: 0.00,
      grandTotal: 18456.00,
      amountPaid: 18456.00,
      outstandingAmount: 0,
      status: 'delivered',
      paymentStatus: 'paid',
      deliveryRunId: 'del_run_1',
      driverName: 'Suresh Gowda',
      vehicleNumber: 'KA-05-AB-1234',
      deliveredAt: '2026-09-02T11:45:00Z',
      podReceiverName: 'Ramesh Gupta (Owner)',
      podNotes: 'Delivered in good condition. Instant UPI settlement done.'
    },
    {
      id: 'ord_1002',
      orderNumber: 'ORD-2026-1002',
      retailerId: 'ret_2',
      retailerName: 'Shree Ganesh Provision Stores',
      retailerPhone: '+91 94481 99882',
      retailerAddress: '#118, Brigade Road, Ashok Nagar',
      retailerGstin: '29BCDEF2345G1Z6',
      beatName: 'MG Road Commercial Beat',
      salesmanId: 'slm_1',
      salesmanName: 'Rajesh Kumar',
      orderDate: '2026-09-02T10:15:00Z',
      expectedDeliveryDate: '2026-09-02',
      items: [
        {
          productId: 'prd_2',
          sku: 'BRIT-GD-BUTTER-100G',
          productName: 'Britannia Good Day Butter Cookies (100g)',
          brand: 'Britannia',
          category: 'Biscuits & Bakery',
          hsnCode: '19053100',
          gstRate: 18,
          cases: 10,
          loosePcs: 0,
          totalPieces: 480,
          unitPrice: 16.80,
          grossAmount: 8064.00,
          discountAmount: 241.92,
          taxableAmount: 6628.88,
          cgstAmount: 596.60,
          sgstAmount: 596.60,
          igstAmount: 0,
          totalAmount: 7822.08,
          schemeApplied: 'Smile Scheme (3% off)'
        },
        {
          productId: 'prd_5',
          sku: 'TATA-TEA-PREM-500G',
          productName: 'Tata Tea Premium Desh Ki Chai (500g)',
          brand: 'Tata',
          category: 'Beverages',
          hsnCode: '09024020',
          gstRate: 5,
          cases: 2,
          loosePcs: 0,
          totalPieces: 48,
          unitPrice: 268.00,
          grossAmount: 12864.00,
          discountAmount: 0,
          taxableAmount: 12251.43,
          cgstAmount: 306.29,
          sgstAmount: 306.29,
          igstAmount: 0,
          totalAmount: 12864.00
        }
      ],
      subtotal: 20928.00,
      totalDiscount: 241.92,
      totalTaxable: 18880.31,
      totalCgst: 902.89,
      totalSgst: 902.89,
      totalTax: 1805.77,
      roundOff: -0.08,
      grandTotal: 20686.00,
      amountPaid: 0,
      outstandingAmount: 20686.00,
      status: 'dispatched',
      paymentStatus: 'unpaid',
      deliveryRunId: 'del_run_1',
      driverName: 'Suresh Gowda',
      vehicleNumber: 'KA-05-AB-1234'
    },
    {
      id: 'ord_1003',
      orderNumber: 'ORD-2026-1003',
      retailerId: 'ret_4',
      retailerName: 'Sri Sai Ram Mart',
      retailerPhone: '+91 97400 11223',
      retailerAddress: '#15, ITPL Main Road, Whitefield',
      retailerGstin: '29DEFGH4567I1Z8',
      beatName: 'Whitefield Supermarket Beat',
      salesmanId: 'slm_3',
      salesmanName: 'Karthik Nambiar',
      orderDate: '2026-09-02T11:00:00Z',
      expectedDeliveryDate: '2026-09-03',
      items: [
        {
          productId: 'prd_6',
          sku: 'SURF-EXCEL-EASY-1KG',
          productName: 'Surf Excel Easy Wash Detergent Powder (1kg)',
          brand: 'Hindustan Unilever',
          category: 'Household & Hygiene',
          hsnCode: '34022010',
          gstRate: 18,
          cases: 4,
          loosePcs: 0,
          totalPieces: 72,
          unitPrice: 122.50,
          grossAmount: 8820.00,
          discountAmount: 0,
          taxableAmount: 7474.58,
          cgstAmount: 672.71,
          sgstAmount: 672.71,
          igstAmount: 0,
          totalAmount: 8820.00,
          schemeApplied: 'Clean Wash Promo (+1 Pcs Free)',
          freePcsAwarded: 1
        },
        {
          productId: 'prd_7',
          sku: 'COLGATE-MAXFRESH-150G',
          productName: 'Colgate MaxFresh Peppermint Toothpaste (150g)',
          brand: 'Colgate-Palmolive',
          category: 'Personal Care',
          hsnCode: '33061020',
          gstRate: 18,
          cases: 2,
          loosePcs: 0,
          totalPieces: 72,
          unitPrice: 98.00,
          grossAmount: 7056.00,
          discountAmount: 0,
          taxableAmount: 5979.66,
          cgstAmount: 538.17,
          sgstAmount: 538.17,
          igstAmount: 0,
          totalAmount: 7056.00
        }
      ],
      subtotal: 15876.00,
      totalDiscount: 0,
      totalTaxable: 13454.24,
      totalCgst: 1210.88,
      totalSgst: 1210.88,
      totalTax: 2421.76,
      roundOff: 0.00,
      grandTotal: 15876.00,
      amountPaid: 0,
      outstandingAmount: 15876.00,
      status: 'confirmed',
      paymentStatus: 'unpaid'
    }
  ],
  payments: [
    {
      id: 'pay_501',
      receiptNumber: 'RCP-2026-501',
      retailerId: 'ret_1',
      retailerName: 'Laxmi Supermarket',
      orderId: 'ord_1001',
      orderNumber: 'ORD-2026-1001',
      amount: 18456.00,
      paymentMode: 'upi',
      transactionRef: 'UPI/HDFC/2026090288910',
      paymentDate: '2026-09-02T11:45:00Z',
      collectedByRole: 'delivery',
      collectorName: 'Suresh Gowda',
      status: 'confirmed',
      notes: 'Spot settlement at delivery'
    },
    {
      id: 'pay_502',
      receiptNumber: 'RCP-2026-502',
      retailerId: 'ret_4',
      retailerName: 'Sri Sai Ram Mart',
      amount: 25000.00,
      paymentMode: 'bank_transfer',
      transactionRef: 'NEFT/SBI/990021334',
      paymentDate: '2026-09-01T15:20:00Z',
      collectedByRole: 'admin',
      collectorName: 'Aryan Sharma',
      status: 'confirmed',
      notes: 'Previous outstanding settlement'
    }
  ],
  inventoryLogs: [
    {
      id: 'inv_log_1',
      type: 'inward',
      productId: 'prd_1',
      productName: 'Parle-G Glucose Biscuit (80g)',
      sku: 'PARLE-G-80G',
      batchNumber: 'PAR-26B-02',
      cases: 40,
      loosePcs: 0,
      referenceId: 'PO-PARLE-891',
      date: '2026-09-01T08:00:00Z',
      performedBy: 'Aryan Sharma',
      reason: 'Fresh factory dispatch received from Parle depot'
    },
    {
      id: 'inv_log_2',
      type: 'outward_dispatch',
      productId: 'prd_1',
      productName: 'Parle-G Glucose Biscuit (80g)',
      sku: 'PARLE-G-80G',
      batchNumber: 'PAR-26A-01',
      cases: 6,
      loosePcs: 0,
      referenceId: 'ORD-2026-1001',
      date: '2026-09-02T10:00:00Z',
      performedBy: 'Warehouse Team',
      reason: 'Dispatched for Laxmi Supermarket'
    }
  ]
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      }
    } catch (e) {
      console.error('Failed to read db.json, using initial seed', e);
    }
    this.saveData(INITIAL_DATA);
    return INITIAL_DATA;
  }

  private saveData(data: DatabaseSchema) {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Failed to write db.json', e);
    }
  }

  public getRawData(): DatabaseSchema {
    return this.data;
  }

  public resetToDefault(): DatabaseSchema {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.saveData(this.data);
    return this.data;
  }

  // User
  public getUsers(): User[] {
    return this.data.users;
  }

  // Products
  public getProducts(): Product[] {
    return this.data.products;
  }

  public getProductById(id: string): Product | undefined {
    return this.data.products.find(p => p.id === id);
  }

  public saveProduct(product: Product): Product {
    const idx = this.data.products.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      this.data.products[idx] = product;
    } else {
      this.data.products.push(product);
    }
    this.saveData(this.data);
    return product;
  }

  public deleteProduct(id: string): boolean {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter(p => p.id !== id);
    if (this.data.products.length !== initialLen) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // Retailers
  public getRetailers(): Retailer[] {
    return this.data.retailers;
  }

  public getRetailerById(id: string): Retailer | undefined {
    return this.data.retailers.find(r => r.id === id);
  }

  public saveRetailer(retailer: Retailer): Retailer {
    const idx = this.data.retailers.findIndex(r => r.id === retailer.id);
    if (idx >= 0) {
      this.data.retailers[idx] = retailer;
    } else {
      this.data.retailers.push(retailer);
    }
    this.saveData(this.data);
    return retailer;
  }

  public deleteRetailer(id: string): boolean {
    const initLen = this.data.retailers.length;
    this.data.retailers = this.data.retailers.filter(r => r.id !== id);
    if (this.data.retailers.length !== initLen) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  public updateRetailerOutstanding(id: string, delta: number) {
    const retailer = this.getRetailerById(id);
    if (retailer) {
      retailer.currentOutstanding = Math.max(0, retailer.currentOutstanding + delta);
      if (retailer.currentOutstanding > retailer.creditLimit) {
        retailer.status = 'overdue';
      } else if (retailer.status === 'overdue' && retailer.currentOutstanding <= retailer.creditLimit) {
        retailer.status = 'active';
      }
      this.saveRetailer(retailer);
    }
  }

  // Salesmen
  public getSalesmen(): Salesman[] {
    return this.data.salesmen;
  }

  public getSalesmanById(id: string): Salesman | undefined {
    return this.data.salesmen.find(s => s.id === id);
  }

  public saveSalesman(salesman: Salesman): Salesman {
    const idx = this.data.salesmen.findIndex(s => s.id === salesman.id);
    if (idx >= 0) {
      this.data.salesmen[idx] = salesman;
    } else {
      this.data.salesmen.push(salesman);
    }
    this.saveData(this.data);
    return salesman;
  }

  public deleteSalesman(id: string): boolean {
    const initLen = this.data.salesmen.length;
    this.data.salesmen = this.data.salesmen.filter(s => s.id !== id);
    if (this.data.salesmen.length !== initLen) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // Orders
  public getOrders(): Order[] {
    return this.data.orders;
  }

  public getOrderById(id: string): Order | undefined {
    return this.data.orders.find(o => o.id === id);
  }

  public deleteOrder(id: string): boolean {
    const initLen = this.data.orders.length;
    this.data.orders = this.data.orders.filter(o => o.id !== id);
    if (this.data.orders.length !== initLen) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  public saveOrder(order: Order): Order {
    const idx = this.data.orders.findIndex(o => o.id === order.id);
    const isNew = idx < 0;

    if (idx >= 0) {
      this.data.orders[idx] = order;
    } else {
      this.data.orders.push(order);
    }

    // If new order booked/confirmed, adjust inventory and retailer outstanding
    if (isNew && order.status !== 'cancelled' && order.status !== 'draft') {
      this.deductInventoryForOrder(order);
      if (order.outstandingAmount > 0) {
        this.updateRetailerOutstanding(order.retailerId, order.outstandingAmount);
      }
    }

    this.saveData(this.data);
    return order;
  }

  public updateOrderStatus(orderId: string, status: Order['status'], extraDetails?: Partial<Order>): Order | undefined {
    const order = this.getOrderById(orderId);
    if (!order) return undefined;

    const previousStatus = order.status;
    order.status = status;

    if (extraDetails) {
      Object.assign(order, extraDetails);
    }

    if (status === 'delivered' && !order.deliveredAt) {
      order.deliveredAt = new Date().toISOString();
    }

    if (previousStatus === 'draft' && status === 'booked') {
      this.deductInventoryForOrder(order);
      this.updateRetailerOutstanding(order.retailerId, order.outstandingAmount);
    }

    this.saveData(this.data);
    return order;
  }

  private deductInventoryForOrder(order: Order) {
    order.items.forEach(item => {
      const product = this.getProductById(item.productId);
      if (product) {
        product.currentStockCases = Math.max(0, product.currentStockCases - item.cases);
        product.currentStockLoosePcs = Math.max(0, product.currentStockLoosePcs - item.loosePcs);
        
        // Log movement
        this.data.inventoryLogs.push({
          id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: 'outward_dispatch',
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          batchNumber: product.batches[0]?.batchNumber || 'DEFAULT',
          cases: item.cases,
          loosePcs: item.loosePcs,
          referenceId: order.orderNumber,
          date: new Date().toISOString(),
          performedBy: order.salesmanName || 'System',
          reason: `Order ${order.orderNumber} for ${order.retailerName}`
        });

        this.saveProduct(product);
      }
    });
  }

  // Deliveries
  public getDeliveries(): DeliveryRunSheet[] {
    return this.data.deliveries;
  }

  public saveDelivery(delivery: DeliveryRunSheet): DeliveryRunSheet {
    const idx = this.data.deliveries.findIndex(d => d.id === delivery.id);
    if (idx >= 0) {
      this.data.deliveries[idx] = delivery;
    } else {
      this.data.deliveries.push(delivery);
    }
    this.saveData(this.data);
    return delivery;
  }

  // Payments
  public getPayments(): PaymentRecord[] {
    return this.data.payments;
  }

  public recordPayment(payment: PaymentRecord): PaymentRecord {
    this.data.payments.unshift(payment);
    
    // Update retailer outstanding
    this.updateRetailerOutstanding(payment.retailerId, -payment.amount);

    // If payment is linked to order, adjust order amount paid
    if (payment.orderId) {
      const order = this.getOrderById(payment.orderId);
      if (order) {
        order.amountPaid += payment.amount;
        order.outstandingAmount = Math.max(0, order.grandTotal - order.amountPaid);
        if (order.outstandingAmount <= 0) {
          order.paymentStatus = 'paid';
        } else if (order.amountPaid > 0) {
          order.paymentStatus = 'partial';
        }
        this.saveOrder(order);
      }
    }

    this.saveData(this.data);
    return payment;
  }

  // Inventory Logs & Inwards
  public getInventoryLogs(): InventoryMovement[] {
    return this.data.inventoryLogs;
  }

  public logInventoryMovement(movement: InventoryMovement): InventoryMovement {
    this.data.inventoryLogs.unshift(movement);
    
    // update product stock
    const product = this.getProductById(movement.productId);
    if (product) {
      if (movement.type === 'inward' || movement.type === 'return_inward') {
        product.currentStockCases += movement.cases;
        product.currentStockLoosePcs += movement.loosePcs;
      } else {
        product.currentStockCases = Math.max(0, product.currentStockCases - movement.cases);
        product.currentStockLoosePcs = Math.max(0, product.currentStockLoosePcs - movement.loosePcs);
      }
      this.saveProduct(product);
    }

    this.saveData(this.data);
    return movement;
  }
}

export const db = new Database();
