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
  User,
  PromotionalBanner,
  SalesmanVisit,
  AppNotification,
  AdminDeviceToken,
  SalesmanTask,
  SalesTarget,
  TaskStatus,
  StaffMember,
  StaffAttendance,
  StaffPayroll,
  StaffSalaryPaymentPayload,
  PayrollPaymentRecord,
  AttendanceStatus,
  SalaryType,
  PayrollStatus
} from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export interface AppVersionConfig {
  version: string;
  versionCode?: number;
  downloadUrl: string;
  apkUrl?: string;
  updatedAt: string;
  releaseNotes: string;
  fileSize?: string;
  minAndroidVersion?: string;
  isMandatory?: boolean;
}

export interface StoredCredential {
  passwordHash?: string;
  plainPassword?: string;
  userId: string;
  role: string;
  updatedAt: string;
}

export interface DatabaseSchema {
  users: User[];
  products: Product[];
  retailers: Retailer[];
  salesmen: Salesman[];
  orders: Order[];
  deliveries: DeliveryRunSheet[];
  payments: PaymentRecord[];
  inventoryLogs: InventoryMovement[];
  banners?: PromotionalBanner[];
  appVersionConfig?: AppVersionConfig;
  beats?: string[];
  visits?: SalesmanVisit[];
  notifications?: AppNotification[];
  deviceTokens?: AdminDeviceToken[];
  salesmanTasks?: SalesmanTask[];
  salesTargets?: SalesTarget[];
  userCredentials?: Record<string, StoredCredential>;
  staffMembers?: StaffMember[];
  staffAttendance?: StaffAttendance[];
  staffPayrolls?: StaffPayroll[];
  staffSalaryPayments?: PayrollPaymentRecord[];
  businessProfile?: any;
}

function getBannerMainImageUrl(): string {
  try {
    const publicPath = path.join(process.cwd(), 'public', 'download', 'banner_main.jpg');
    if (fs.existsSync(publicPath)) {
      const b64 = fs.readFileSync(publicPath).toString('base64');
      return `data:image/jpeg;base64,${b64}`;
    }
  } catch {}
  return '/download/banner_main.jpg';
}

const INITIAL_RETAILERS: Retailer[] = [
  {
    id: 'ret_672eaf9602624692',
    storeName: 'Paras Kirana Store',
    ownerName: 'Paras Kirana Store',
    phone: '+91 98659 86532',
    address: 'Station Road, Utraula, Balrampur',
    area: 'Utraula Central',
    beatName: 'Utraula Retail Beat',
    status: 'active',
    verificationStatus: 'verified',
    creditLimit: 50000,
    currentOutstanding: 2160,
    creditDaysAllowed: 15,
    creditEnabled: true,
    lat: 27.317204,
    lng: 82.424731
  },
  {
    id: 'ret_1791274745127_5lbh1',
    storeName: 'Suneel kirana store',
    ownerName: 'Suneel',
    phone: '+91 8874255666',
    address: 'GuruDayaldeeh',
    area: 'Utraula',
    beatName: 'Utraula Retail Beat',
    status: 'active',
    verificationStatus: 'verified',
    creditLimit: 50000,
    currentOutstanding: 0,
    creditDaysAllowed: 15,
    creditEnabled: true,
    lat: 27.3167,
    lng: 82.4210
  },
  {
    id: 'ret_1791275454028_g7oc0',
    storeName: 'Jaljeere kirana store',
    ownerName: 'Jaljeere',
    phone: '+91 9044393678',
    address: 'Utraula, Balrampur',
    area: 'Utraula',
    beatName: 'Utraula Retail Beat',
    status: 'active',
    verificationStatus: 'verified',
    creditLimit: 50000,
    currentOutstanding: 0,
    creditDaysAllowed: 15,
    creditEnabled: true,
    lat: 27.317662352509668,
    lng: 82.42373253561384
  },
  {
    id: 'ret_1791729464873_ebcou',
    storeName: 'Ansari provision store',
    ownerName: 'Azhar ansari',
    phone: '+91 9648721927',
    address: 'Near Pushpanjali store',
    area: 'Utraula Central',
    beatName: 'Utraula Retail Beat',
    status: 'active',
    verificationStatus: 'verified',
    creditLimit: 50000,
    currentOutstanding: 0,
    creditDaysAllowed: 15,
    creditEnabled: true,
    lat: 27.3168,
    lng: 82.4212
  },
  {
    id: 'ret_1791636471142_yvjaf',
    storeName: 'Sajjan pan shop',
    ownerName: 'Sajjan yadav',
    phone: '+91 9696914692',
    address: 'Guru dayal dih hatan rode',
    area: 'Utraula Central',
    beatName: 'Utraula Retail Beat',
    status: 'active',
    verificationStatus: 'verified',
    creditLimit: 50000,
    currentOutstanding: 0,
    creditDaysAllowed: 15,
    creditEnabled: true,
    lat: 27.3167,
    lng: 82.4210
  },
  {
    id: 'ret_1791369179248',
    storeName: 'Neeyansh General store',
    ownerName: 'Neeyansh',
    phone: '+919044948582',
    address: 'Utraula, Balrampur (UP)',
    area: 'Utraula Central',
    beatName: 'Utraula Retail Beat',
    status: 'active',
    verificationStatus: 'verified',
    creditLimit: 50000,
    currentOutstanding: 0,
    creditDaysAllowed: 15,
    creditEnabled: true,
    lat: 27.3169,
    lng: 82.4215
  },
  {
    id: 'ret_1791731259995_ff7mm',
    storeName: 'Taj bekars',
    ownerName: 'Asif',
    phone: '+91 7760962403',
    address: 'Super market Asam rode chauraha',
    area: 'Utraula Central',
    beatName: 'Utraula Retail Beat',
    status: 'active',
    verificationStatus: 'verified',
    creditLimit: 50000,
    currentOutstanding: 0,
    creditDaysAllowed: 15,
    creditEnabled: true,
    lat: 27.3165,
    lng: 82.4208
  }
];

const INITIAL_BANNERS: PromotionalBanner[] = [
  {
    id: 'banner_main',
    bgGradient: 'from-[#F6BD27] via-[#F4B218] to-[#E89E0B]',
    title: 'दुकानदारों के लिए सीधे डिपो थोक भाव',
    subtitle: 'Best Wholesale Rates • Maximum Retailer Margins',
    badgeText: 'केवल दुकानदारों के लिए (B2B)',
    ctaText: 'हर पेटी / कार्टन पर ₹20 से ₹60 तक का सीधा दुकानदार मुनाफा',
    accentColor: 'Pramod Snacks & Namkeen • Parle • Britannia',
    imageUrl: getBannerMainImageUrl(),
    isActive: true,
    targetCategory: 'Snacks & Namkeen',
    targetBrand: 'Pramod Snacks & Namkeen',
    hideTextOverlay: true,
    showBuyNow: true,
    buyNowText: 'अभी खरीदें (Buy Now)'
  },
  {
    id: 'banner_offers',
    bgGradient: 'from-[#F59E0B] via-[#D97706] to-[#B45309]',
    title: 'Aryan B2B Retailer Trade Schemes',
    subtitle: 'Parle • Britannia • Sunfeast • PepsiCo • Amul',
    badgeText: 'थोक व्यापार डिस्काउंट',
    ctaText: 'कार्टन / पेटी बुकिंग पर अतिरिक्त 5% थोक स्कीम मार्जिन',
    accentColor: 'Special Wholesale Trade Margin on Bulk Booking',
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=80',
    isActive: true
  },
  {
    id: 'banner_fast',
    bgGradient: 'from-[#0284C7] via-[#0369A1] to-[#075985]',
    title: 'Direct Depot Supply to Your Shop',
    subtitle: 'Same-Day / 24-Hour Dispatch directly to your Kirana Counter',
    badgeText: 'दुकान तक सीधी डिलीवरी',
    ctaText: '100% Genuine Direct Supply Chain Guarantee with GST Bill',
    accentColor: 'Depot Fleet • Utraula • Balrampur • Gonda • Tulsipur',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=600&auto=format&fit=crop&q=80',
    isActive: true
  },
  {
    id: 'banner_baby_care',
    bgGradient: 'from-[#0D9488] via-[#0F766E] to-[#115E59]',
    title: 'Baby Care & Personal Hygiene Wholesale',
    subtitle: 'Honey Bunny • Dettol • Colgate • Stayfree',
    badgeText: 'सुपर-स्टॉकिस्ट डिपो',
    ctaText: 'Buy 5 Cases, Get 1 Case Free on Honey Bunny Diapers',
    accentColor: 'Super-Stockist Authentic Direct Supply for Retailers',
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=80',
    isActive: true
  }
];

const INITIAL_STAFF_MEMBERS: StaffMember[] = [
  {
    id: 'stf_admin_nikhil',
    employeeCode: 'EMP-ADM-001',
    name: 'Nikhil',
    phone: '+91 96284 62862',
    email: 'rockygupta928@gmail.com',
    role: 'admin',
    designation: 'Operations Administrator',
    photoUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&auto=format&fit=crop&q=80',
    joiningDate: '2023-01-01',
    employmentStatus: 'active',
    salaryType: 'monthly_fixed',
    baseSalary: 60000,
    allowances: [],
    deductions: [],
    weeklyOffDay: 0,
    monthlyLeaveQuota: 4,
    userId: '01950726-7687-4a86-a911-adc3a124c0ef',
    createdAt: '2023-01-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'stf_slm_1790147316716',
    employeeCode: 'EMP-AA-104',
    name: 'Azeem Usmani',
    phone: '+91 9696914692',
    email: 'usmani.7565@gmail.com',
    role: 'salesman',
    designation: 'Senior Sales Executive',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&auto=format&fit=crop&q=80',
    assignedBeats: ['Balrampur Central Beat'],
    joiningDate: '2024-03-15',
    employmentStatus: 'active',
    salaryType: 'monthly_fixed',
    baseSalary: 25000,
    allowances: [
      { id: 'alw_1', title: 'Field Travel Allowance', amount: 3000 }
    ],
    deductions: [],
    weeklyOffDay: 0,
    monthlyLeaveQuota: 2,
    userId: '9d201217-f71b-42b2-843e-15f0894bfdc3',
    salesmanId: 'slm_1790147316716',
    createdAt: '2024-03-15T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'stf_slm_1792073770798',
    employeeCode: 'EMP-SE-7381',
    name: 'Nikhil Aryan',
    phone: '+91 96284 62862',
    email: 'nkg8369@gmail.com',
    role: 'salesman',
    designation: 'Senior Sales Executive',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&auto=format&fit=crop&q=80',
    assignedBeats: ['Utraula Retail Beat'],
    joiningDate: '2024-06-01',
    employmentStatus: 'active',
    salaryType: 'monthly_fixed',
    baseSalary: 25000,
    allowances: [
      { id: 'alw_2', title: 'Field Travel Allowance', amount: 3000 }
    ],
    deductions: [],
    weeklyOffDay: 0,
    monthlyLeaveQuota: 2,
    userId: 'bb0f03c0-2389-4c9d-846f-a87653595452',
    salesmanId: 'slm_1792073770798',
    createdAt: '2024-06-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'stf_slm_1792142673681',
    employeeCode: 'EMP-SE-1783',
    name: 'Ravi Shankar',
    phone: '+91 97927 39621',
    email: 'rschaurasiya89@gmail.com',
    role: 'salesman',
    designation: 'Senior Sales Executive',
    photoUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=200&auto=format&fit=crop&q=80',
    assignedBeats: ['Rehra Bazar Beat'],
    joiningDate: '2024-08-01',
    employmentStatus: 'active',
    salaryType: 'monthly_fixed',
    baseSalary: 25000,
    allowances: [
      { id: 'alw_3', title: 'Field Travel Allowance', amount: 3000 }
    ],
    deductions: [],
    weeklyOffDay: 0,
    monthlyLeaveQuota: 2,
    userId: 'usr_sales_1792142673681',
    salesmanId: 'slm_1792142673681',
    createdAt: '2024-08-01T00:00:00Z',
    updatedAt: new Date().toISOString()
  }
];

const INITIAL_DATA: DatabaseSchema = {
  users: [
    {
      id: '01950726-7687-4a86-a911-adc3a124c0ef',
      name: 'Nikhil (Admin)',
      email: 'rockygupta928@gmail.com',
      phone: '+91 96284 62862',
      role: 'admin',
      avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      businessName: 'Aryan Agency FMCG Super-Stockist'
    },
    {
      id: '9d201217-f71b-42b2-843e-15f0894bfdc3',
      name: 'Azeem Usmani',
      email: 'usmani.7565@gmail.com',
      phone: '+91 9696914692',
      role: 'salesman',
      salesmanId: 'slm_1790147316716',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'bb0f03c0-2389-4c9d-846f-a87653595452',
      name: 'Nikhil Aryan',
      email: 'nkg8369@gmail.com',
      phone: '+91 96284 62862',
      role: 'salesman',
      salesmanId: 'slm_1792073770798',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'
    },
    {
      id: 'usr_sales_1792142673681',
      name: 'Ravi Shankar',
      email: 'rschaurasiya89@gmail.com',
      phone: '+91 97927 39621',
      role: 'salesman',
      salesmanId: 'slm_1792142673681',
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
  retailers: INITIAL_RETAILERS,
  salesmen: [
    {
      id: 'slm_1790147316716',
      employeeCode: 'EMP-AA-104',
      name: 'Azeem Usmani',
      phone: '+91 9696914692',
      email: 'usmani.7565@gmail.com',
      assignedBeats: ['Balrampur Central Beat'],
      dailyTargetAmount: 75000,
      monthlyTargetAmount: 1800000,
      currentMonthAchieved: 0,
      commissionPercentage: 1.5,
      todayOrdersCount: 0,
      todaySalesAmount: 0,
      status: 'active'
    },
    {
      id: 'slm_1792073770798',
      employeeCode: 'EMP-SE-7381',
      name: 'Nikhil Aryan',
      phone: '+91 96284 62862',
      email: 'nkg8369@gmail.com',
      assignedBeats: ['Utraula Retail Beat'],
      dailyTargetAmount: 75000,
      monthlyTargetAmount: 1800000,
      currentMonthAchieved: 0,
      commissionPercentage: 1.5,
      todayOrdersCount: 0,
      todaySalesAmount: 0,
      status: 'active'
    },
    {
      id: 'slm_1792142673681',
      employeeCode: 'EMP-SE-1783',
      name: 'Ravi Shankar',
      phone: '+91 97927 39621',
      email: 'rschaurasiya89@gmail.com',
      assignedBeats: ['Rehra Bazar Beat'],
      dailyTargetAmount: 75000,
      monthlyTargetAmount: 1800000,
      currentMonthAchieved: 0,
      commissionPercentage: 1.5,
      todayOrdersCount: 0,
      todaySalesAmount: 0,
      status: 'active'
    }
  ],
  deliveries: [],
  orders: [],
  payments: [],
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
    }
  ],
  staffMembers: INITIAL_STAFF_MEMBERS,
  staffAttendance: [],
  staffPayrolls: [],
  staffSalaryPayments: []
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
        const parsed = JSON.parse(raw);
        let modified = false;

        if (Array.isArray(parsed.retailers)) {
          const originalLen = parsed.retailers.length;
          const isDummyRetailer = (r: any) => {
            const name = (r.storeName || '').toLowerCase();
            const owner = (r.ownerName || '').toLowerCase();
            return (
              name.includes('laxmi supermarket') ||
              name.includes('ganesh daily') ||
              name.includes('ganesh provision') ||
              name.includes('sapthagiri super') ||
              owner.includes('laxmi supermarket') ||
              owner.includes('ganesh daily') ||
              owner.includes('sapthagiri store')
            );
          };
          parsed.retailers = parsed.retailers.filter((r: any) => !isDummyRetailer(r));
          if (parsed.retailers.length !== originalLen) modified = true;

          // Purge dummy user profiles associated with dummy template stores only
          if (Array.isArray(parsed.users)) {
            const origUserLen = parsed.users.length;
            const isDummyUser = (u: any) => {
              const name = (u.name || '').toLowerCase();
              const bName = (u.businessName || '').toLowerCase();
              return (
                bName.includes('laxmi supermarket') ||
                bName.includes('ganesh daily') ||
                bName.includes('sapthagiri super') ||
                name.includes('laxmi supermarket')
              );
            };
            parsed.users = parsed.users.filter((u: any) => !isDummyUser(u));
            if (parsed.users.length !== origUserLen) modified = true;
          }

          // Auto-heal placeholder names using authentic user profiles only
          if (Array.isArray(parsed.retailers)) {
            parsed.retailers.forEach((r: any) => {
              const hasPlaceholder = !r.storeName || 
                r.storeName.includes('Registered Retail Outlet') || 
                r.storeName.includes('Retail Partner Outlet');

              if (hasPlaceholder) {
                const linked = Array.isArray(parsed.users) ? parsed.users.find((u: any) => 
                  (u.retailerId && u.retailerId === r.id) ||
                  (u.phone && r.phone && u.phone.replace(/\D/g, '').slice(-10) === r.phone.replace(/\D/g, '').slice(-10))
                ) : null;

                if (linked && (linked.businessName || linked.name)) {
                  r.storeName = linked.businessName || linked.name;
                  if (linked.name && (!r.ownerName || r.ownerName.includes('Retail Owner'))) {
                    r.ownerName = linked.name;
                  }
                  if (linked.phone && !r.phone) {
                    r.phone = linked.phone;
                  }
                  modified = true;
                }
              }

              // Ensure GPS coordinates exist for Utraula beat retailers if missing
              if (r.lat === undefined || r.lng === undefined) {
                if (r.beatName?.includes('Utraula')) {
                  r.lat = 27.3167 + (Math.random() * 0.005);
                  r.lng = 82.4210 + (Math.random() * 0.005);
                  modified = true;
                } else if (r.beatName?.includes('Balrampur')) {
                  r.lat = 27.4297 + (Math.random() * 0.005);
                  r.lng = 82.1818 + (Math.random() * 0.005);
                  modified = true;
                }
              }
            });

            // Ensure linked users exist in parsed.users for each verified retailer
            if (Array.isArray(parsed.users)) {
              parsed.retailers.forEach((r: any) => {
                const existingUser = parsed.users.find((u: any) => 
                  u.retailerId === r.id ||
                  (u.phone && r.phone && u.phone.replace(/\D/g, '').slice(-10) === r.phone.replace(/\D/g, '').slice(-10))
                );
                if (!existingUser && r.phone) {
                  parsed.users.push({
                    id: `usr_ret_${r.id.replace(/[^a-zA-Z0-9]/g, '').slice(-8)}`,
                    name: r.ownerName,
                    phone: r.phone,
                    email: `${r.id}@retailer.aryanagency.in`,
                    role: 'retailer',
                    businessName: r.storeName,
                    address: r.address,
                    city: r.area || 'Utraula',
                    state: 'Uttar Pradesh',
                    pincode: '271604',
                    gstin: r.gstin,
                    panNumber: r.panNumber,
                    retailerId: r.id,
                    verificationStatus: r.verificationStatus || 'verified',
                    verifiedAt: r.verifiedAt || new Date().toISOString(),
                    verifiedBy: r.verifiedBy || 'NIkhil'
                  });
                  modified = true;
                } else if (existingUser) {
                  // Keep user businessName and verification status synchronized
                  if (existingUser.businessName !== r.storeName) {
                    existingUser.businessName = r.storeName;
                    modified = true;
                  }
                  if (existingUser.verificationStatus !== r.verificationStatus) {
                    existingUser.verificationStatus = r.verificationStatus;
                    modified = true;
                  }
                  if (!existingUser.retailerId) {
                    existingUser.retailerId = r.id;
                    modified = true;
                  }
                }
              });
            }
          }

          if (parsed.retailers.length === 0) {
            parsed.retailers = [...INITIAL_RETAILERS];
            modified = true;
          }
        } else {
          parsed.retailers = [...INITIAL_RETAILERS];
          modified = true;
        }

        if (!Array.isArray(parsed.visits)) {
          parsed.visits = [];
          modified = true;
        }

        if (Array.isArray(parsed.salesmen)) {
          const bangaloreBeats = ['Indiranagar Retail Beat', 'MG Road Commercial Beat', 'Koramangala Daily Beat', 'Whitefield Supermarket Beat', 'Jayanagar Provision Beat'];
          parsed.salesmen.forEach((s: any) => {
            if (Array.isArray(s.assignedBeats)) {
              const prevLen = s.assignedBeats.length;
              s.assignedBeats = s.assignedBeats.filter((b: string) => !bangaloreBeats.includes(b));
              if (s.assignedBeats.length === 0) {
                if (s.id === 'slm_1') s.assignedBeats = ['Utraula Retail Beat', 'Balrampur Central Beat'];
                else if (s.id === 'slm_2') s.assignedBeats = ['Jarwa Rural Beat', 'Tulsipur Provision Beat'];
                else if (s.id === 'slm_3') s.assignedBeats = ['Pachperwa Market Beat', 'Rehra Bazar Beat'];
                else s.assignedBeats = ['Utraula Retail Beat'];
                modified = true;
              } else if (s.assignedBeats.length !== prevLen) {
                modified = true;
              }
            }
          });
        }

        if (Array.isArray(parsed.orders)) {
          const originalLen = parsed.orders.length;
          parsed.orders = parsed.orders.filter((o: any) => 
            !['ord_1001', 'ord_1002', 'ord_1003', 'ord_1004'].includes(o.id) &&
            !['laxmi supermarket', 'ganesh daily', 'sapthagiri super'].some((bad: string) => (o.retailerName || '').toLowerCase().includes(bad))
          );
          if (parsed.orders.length !== originalLen) modified = true;
        }

        if (Array.isArray(parsed.visits)) {
          const origVisitLen = parsed.visits.length;
          parsed.visits = parsed.visits.filter((v: any) => 
            !['laxmi supermarket', 'ganesh daily', 'sapthagiri super'].some((bad: string) => (v.retailerName || '').toLowerCase().includes(bad))
          );
          if (parsed.visits.length !== origVisitLen) modified = true;
        }

        if (Array.isArray(parsed.payments)) {
          const originalLen = parsed.payments.length;
          parsed.payments = parsed.payments.filter((p: any) => 
            !['pay_501', 'pay_502'].includes(p.id)
          );
          if (parsed.payments.length !== originalLen) modified = true;
        }

        if (Array.isArray(parsed.deliveries)) {
          const originalLen = parsed.deliveries.length;
          parsed.deliveries = parsed.deliveries.filter((d: any) => 
            !['del_run_1', 'del_run_2'].includes(d.id)
          );
          if (parsed.deliveries.length !== originalLen) modified = true;
        }

        if (Array.isArray(parsed.users)) {
          const originalLen = parsed.users.length;
          const dummyUserIds = ['usr_sales_1', 'usr_sales_2', 'usr_delivery_1', 'usr_accounts_1', 'usr_admin', 'usr_sales_1792071708611', 'usr_retailer_1'];
          const dummyNames = ['rajesh kumar', 'vikram singh', 'karthik nambiar', 'aryan ', 'amit verma', 'amit', 'aryan sharma', 'suresh gowda (van ka-05-ab-1234)', 'pooja agarwal (accounts head)'];
          parsed.users = parsed.users.filter((u: any) => {
            if (dummyUserIds.includes(u.id)) return false;
            const nameLower = (u.name || '').toLowerCase().trim();
            if (dummyNames.includes(nameLower)) return false;
            return true;
          });
          if (parsed.users.length !== originalLen) modified = true;
        }

        if (Array.isArray(parsed.salesmen)) {
          const originalLen = parsed.salesmen.length;
          const dummySalesmenIds = ['slm_1', 'slm_2', 'slm_3', 'slm_1791978114917', 'slm_1792071708611'];
          const dummySalesmenNames = ['rajesh kumar', 'vikram singh', 'karthik nambiar', 'aryan ', 'amit verma'];
          parsed.salesmen = parsed.salesmen.filter((s: any) => {
            if (dummySalesmenIds.includes(s.id)) return false;
            const nameLower = (s.name || '').toLowerCase().trim();
            if (dummySalesmenNames.includes(nameLower)) return false;
            return true;
          });
          if (parsed.salesmen.length !== originalLen) modified = true;
        }

        if (Array.isArray(parsed.staffMembers)) {
          const originalLen = parsed.staffMembers.length;
          const dummyStaffIds = ['stf_1', 'stf_2', 'stf_3', 'stf_4', 'stf_5', 'stf_bb0f03c0-2389-4c9d-846f-a87653595452'];
          const dummyStaffNames = ['rajesh kumar', 'vikram singh', 'suresh gowda', 'pooja agarwal', 'aryan sharma', 'amit'];
          parsed.staffMembers = parsed.staffMembers.filter((s: any) => {
            if (dummyStaffIds.includes(s.id)) return false;
            const nameLower = (s.name || '').toLowerCase().trim();
            if (dummyStaffNames.includes(nameLower)) return false;
            return true;
          });
          // Ensure genuine staff are included
          INITIAL_STAFF_MEMBERS.forEach(initStaff => {
            if (!parsed.staffMembers.some((s: any) => s.id === initStaff.id || (s.email && s.email.toLowerCase() === initStaff.email.toLowerCase()))) {
              parsed.staffMembers.push(initStaff);
              modified = true;
            }
          });
          if (parsed.staffMembers.length !== originalLen) modified = true;
        } else {
          parsed.staffMembers = [...INITIAL_STAFF_MEMBERS];
          modified = true;
        }

        if (!Array.isArray(parsed.banners) || parsed.banners.length === 0) {
          parsed.banners = INITIAL_BANNERS;
          modified = true;
        }

        if (!Array.isArray(parsed.staffAttendance)) {
          parsed.staffAttendance = [];
          modified = true;
        } else {
          const validStaffIds = new Set(parsed.staffMembers.map((s: any) => s.id));
          const prevLen = parsed.staffAttendance.length;
          parsed.staffAttendance = parsed.staffAttendance.filter((a: any) => validStaffIds.has(a.staffId));
          if (parsed.staffAttendance.length !== prevLen) modified = true;
        }

        if (!Array.isArray(parsed.staffPayrolls)) {
          parsed.staffPayrolls = [];
          modified = true;
        } else {
          const validStaffIds = new Set(parsed.staffMembers.map((s: any) => s.id));
          const prevLen = parsed.staffPayrolls.length;
          parsed.staffPayrolls = parsed.staffPayrolls.filter((p: any) => validStaffIds.has(p.staffId));
          if (parsed.staffPayrolls.length !== prevLen) modified = true;
        }

        if (!Array.isArray(parsed.staffSalaryPayments)) {
          parsed.staffSalaryPayments = [];
          modified = true;
        }

        if (modified) {
          this.saveData(parsed);
        }
        return parsed;
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

  public getUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public saveUser(user: User): User {
    const idx = this.data.users.findIndex(u => u.id === user.id);
    if (idx >= 0) {
      this.data.users[idx] = user;
    } else {
      this.data.users.push(user);
    }
    this.saveData(this.data);
    return user;
  }

  // Products
  public getProducts(): Product[] {
    return this.data.products.map(p => ({
      ...p,
      sku: p.sku || (p as any).product_sku || (p as any).productSku || (p as any).code || ''
    }));
  }

  public getProductById(id: string): Product | undefined {
    const p = this.data.products.find(prod => prod.id === id);
    if (!p) return undefined;
    return {
      ...p,
      sku: p.sku || (p as any).product_sku || (p as any).productSku || (p as any).code || ''
    };
  }

  public saveProduct(product: Product | any): Product {
    const sku = product.sku || product.product_sku || product.productSku || '';
    const cleanProduct = {
      ...product,
      sku,
      product_sku: sku
    };
    const idx = this.data.products.findIndex(p => p.id === product.id);
    if (idx >= 0) {
      this.data.products[idx] = { ...this.data.products[idx], ...cleanProduct };
    } else {
      this.data.products.push(cleanProduct);
    }
    this.saveData(this.data);
    return this.data.products[idx >= 0 ? idx : this.data.products.length - 1];
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
    if (!Array.isArray(this.data.retailers) || this.data.retailers.length === 0) {
      this.data.retailers = [...INITIAL_RETAILERS];
      this.saveData(this.data);
    }
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

  public deleteRetailer(id: string, options: { deleteOrders?: boolean; archiveOrders?: boolean } = { deleteOrders: true }): boolean {
    const idx = this.data.retailers.findIndex(r => r.id === id);
    if (idx >= 0) {
      this.data.retailers.splice(idx, 1);
    }
    
    // Handle associated orders and payments
    if (options.archiveOrders) {
      this.data.orders.forEach(o => {
        if (o.retailerId === id) {
          o.status = 'cancelled';
          o.outstandingAmount = 0;
          o.remarks = (o.remarks ? o.remarks + ' | ' : '') + '[Retailer Account Cleaned Up]';
        }
      });
      this.data.payments.forEach(p => {
        if (p.retailerId === id) {
          p.notes = (p.notes ? p.notes + ' | ' : '') + '[Retailer Account Cleaned Up]';
        }
      });
    } else {
      // Default: cascade delete associated orders and payments
      this.data.orders = this.data.orders.filter(o => o.retailerId !== id);
      this.data.payments = this.data.payments.filter(p => p.retailerId !== id);
    }

    // Also clean up linked user portal login account for this retailer
    if (this.data.users) {
      this.data.users = this.data.users.filter(u => u.retailerId !== id);
    }

    // Also clean up linked tasks and visits
    if (this.data.salesmanTasks) {
      this.data.salesmanTasks = this.data.salesmanTasks.filter(t => t.retailerId !== id);
    }
    if (this.data.visits) {
      this.data.visits = this.data.visits.filter(v => v.retailerId !== id);
    }

    this.saveData(this.data);
    return true;
  }

  public cleanupRetailers(ids: string[], handleOrders: 'delete' | 'archive' = 'delete'): { deletedCount: number; affectedOrders: number } {
    let affectedOrders = 0;
    ids.forEach(id => {
      const ords = this.data.orders.filter(o => o.retailerId === id);
      affectedOrders += ords.length;
      this.deleteRetailer(id, { deleteOrders: handleOrders === 'delete', archiveOrders: handleOrders === 'archive' });
    });
    return { deletedCount: ids.length, affectedOrders };
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
    if (!id) return undefined;
    const cleanId = String(id).trim();

    // 1. Direct match by id
    let found = this.data.salesmen.find(s => s.id === cleanId);
    if (found) return found;

    // 2. Match by userId or employeeCode
    found = this.data.salesmen.find(s => s.userId === cleanId || (s.employeeCode && s.employeeCode.toLowerCase() === cleanId.toLowerCase()));
    if (found) return found;

    // 3. Match from staffMembers
    const staff = this.data.staffMembers?.find(st => 
      st.id === cleanId || 
      st.salesmanId === cleanId || 
      st.userId === cleanId || 
      (st.employeeCode && st.employeeCode.toLowerCase() === cleanId.toLowerCase())
    );
    if (staff && (staff.role === 'salesman' || staff.salesmanId)) {
      const synthesized: Salesman = {
        id: staff.salesmanId || staff.id,
        name: staff.name,
        employeeCode: staff.employeeCode || `EMP-${staff.id.slice(-4)}`,
        phone: staff.phone || '',
        email: staff.email || '',
        assignedBeats: staff.assignedBeats || ['Utraula Retail Beat'],
        dailyTargetAmount: 75000,
        monthlyTargetAmount: 1800000,
        currentMonthAchieved: 0,
        commissionPercentage: 1.5,
        todayOrdersCount: 0,
        todaySalesAmount: 0,
        status: 'active',
        userId: staff.userId
      };
      this.saveSalesman(synthesized);
      return synthesized;
    }

    // 4. Match from users
    const user = this.data.users?.find(u => (u.id === cleanId || u.salesmanId === cleanId) && u.role === 'salesman');
    if (user) {
      const synthesized: Salesman = {
        id: user.salesmanId || user.id,
        name: user.name,
        employeeCode: `EMP-${user.id.slice(-4)}`,
        phone: user.phone || '',
        email: user.email || '',
        assignedBeats: ['Utraula Retail Beat'],
        dailyTargetAmount: 75000,
        monthlyTargetAmount: 1800000,
        currentMonthAchieved: 0,
        commissionPercentage: 1.5,
        todayOrdersCount: 0,
        todaySalesAmount: 0,
        status: 'active',
        userId: user.id
      };
      this.saveSalesman(synthesized);
      return synthesized;
    }

    return undefined;
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
    }
    return true;
  }

  public getBeats(): string[] {
    if (!this.data.beats || this.data.beats.length === 0) {
      const set = new Set<string>([
        'Utraula Retail Beat',
        'Balrampur Central Beat',
        'Jarwa Rural Beat',
        'Tulsipur Provision Beat',
        'Pachperwa Market Beat',
        'Rehra Bazar Beat'
      ]);
      (this.data.retailers || []).forEach(r => { if (r.beatName) set.add(r.beatName); });
      (this.data.salesmen || []).forEach(s => { (s.assignedBeats || []).forEach(b => set.add(b)); });
      this.data.beats = Array.from(set).filter(Boolean);
      this.saveData(this.data);
    }
    return this.data.beats;
  }

  public saveBeat(name: string): string[] {
    const trimmed = (name || '').trim();
    if (!trimmed) return this.getBeats();
    const beats = this.getBeats();
    if (!beats.some(b => b.toLowerCase() === trimmed.toLowerCase())) {
      beats.push(trimmed);
      this.data.beats = beats;
      this.saveData(this.data);
    }
    return this.data.beats;
  }

  // ==========================================
  // Salesman Visits & Field Check-Ins
  // ==========================================
  public getVisits(): SalesmanVisit[] {
    if (!this.data.visits) {
      this.data.visits = [];
    }
    return this.data.visits;
  }

  public getVisitById(id: string): SalesmanVisit | undefined {
    return this.getVisits().find(v => v.id === id);
  }

  public saveVisit(visit: SalesmanVisit): SalesmanVisit {
    if (!this.data.visits) {
      this.data.visits = [];
    }
    const idx = this.data.visits.findIndex(v => v.id === visit.id);
    if (idx >= 0) {
      this.data.visits[idx] = { ...visit, updatedAt: new Date().toISOString() };
    } else {
      this.data.visits.unshift({ ...visit, createdAt: visit.createdAt || new Date().toISOString(), updatedAt: new Date().toISOString() });
    }
    this.saveData(this.data);
    return visit;
  }

  public deleteVisit(id: string): boolean {
    if (!this.data.visits) {
      this.data.visits = [];
    }
    const initLen = this.data.visits.length;
    this.data.visits = this.data.visits.filter(v => v.id !== id);
    if (this.data.visits.length !== initLen) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  public deleteBeat(beatName: string): { affectedRetailers: number; affectedSalesmen: number; beats: string[] } {
    let affectedRetailers = 0;
    let affectedSalesmen = 0;
    const target = (beatName || '').trim();
    if (!target) return { affectedRetailers: 0, affectedSalesmen: 0, beats: this.getBeats() };

    const targetLower = target.toLowerCase();

    // 1. Remove from database beats list
    const currentBeats = this.getBeats();
    this.data.beats = currentBeats.filter(b => b.toLowerCase() !== targetLower);

    // 2. Unassign from all salesmen
    this.data.salesmen.forEach(s => {
      if (s.assignedBeats && s.assignedBeats.some(b => b.toLowerCase() === targetLower)) {
        s.assignedBeats = s.assignedBeats.filter(b => b.toLowerCase() !== targetLower);
        affectedSalesmen++;
      }
    });

    // 3. Reassign any retailer from this beat to default
    this.data.retailers.forEach(r => {
      if (r.beatName && r.beatName.toLowerCase() === targetLower) {
        r.beatName = 'Utraula Retail Beat';
        affectedRetailers++;
      }
    });

    this.saveData(this.data);
    return { affectedRetailers, affectedSalesmen, beats: this.data.beats };
  }

  // Orders
  public getOrders(): Order[] {
    return (this.data.orders || [])
      .filter(o => Boolean(o && o.id && o.id !== 'null' && o.id !== 'undefined'));
  }

  public getOrderById(id: string): Order | undefined {
    if (!id || id === 'null' || id === 'undefined') return undefined;
    return this.data.orders.find(o => o.id === id);
  }

  public deleteOrder(id: string): boolean {
    if (!id || id === 'null' || id === 'undefined') return false;
    const initLen = this.data.orders.length;
    this.data.orders = this.data.orders.filter(o => o.id !== id);
    if (this.data.orders.length !== initLen) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  public saveOrder(order: Order): Order {
    if (!order.id || order.id === 'null' || order.id === 'undefined') {
      order.id = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    }
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

  // Promotional Banners
  private syncBannersJson(banners: PromotionalBanner[]): void {
    try {
      const publicPath = path.join(process.cwd(), 'public', 'download', 'banners.json');
      fs.mkdirSync(path.dirname(publicPath), { recursive: true });
      fs.writeFileSync(publicPath, JSON.stringify(banners, null, 2), 'utf8');

      const distPath = path.join(process.cwd(), 'dist', 'download', 'banners.json');
      if (fs.existsSync(path.join(process.cwd(), 'dist'))) {
        fs.mkdirSync(path.dirname(distPath), { recursive: true });
        fs.writeFileSync(distPath, JSON.stringify(banners, null, 2), 'utf8');
      }
    } catch (e) {
      console.warn('[db] Could not sync banners.json:', e);
    }
  }

  public getBanners(): PromotionalBanner[] {
    if (!Array.isArray(this.data.banners) || this.data.banners.length === 0) {
      this.data.banners = [...INITIAL_BANNERS];
      this.saveData(this.data);
    }
    const freshImage = getBannerMainImageUrl();
    const updated = this.data.banners.map(b => {
      if (b.id === 'banner_main' && (!b.imageUrl || b.imageUrl === '/download/banner_main.jpg' || b.imageUrl.startsWith('/download/'))) {
        return { ...b, imageUrl: freshImage };
      }
      return b;
    });
    this.syncBannersJson(updated);
    return updated;
  }

  public saveBanner(banner: PromotionalBanner): PromotionalBanner {
    if (!Array.isArray(this.data.banners)) {
      this.data.banners = [...INITIAL_BANNERS];
    }
    const idx = this.data.banners.findIndex(b => b.id === banner.id);
    if (idx >= 0) {
      this.data.banners[idx] = banner;
    } else {
      this.data.banners.unshift(banner);
    }
    this.saveData(this.data);
    this.syncBannersJson(this.data.banners);
    return banner;
  }

  public deleteBanner(id: string): boolean {
    if (!Array.isArray(this.data.banners)) {
      return false;
    }
    const lenBefore = this.data.banners.length;
    this.data.banners = this.data.banners.filter(b => b.id !== id);
    if (this.data.banners.length !== lenBefore) {
      this.saveData(this.data);
      this.syncBannersJson(this.data.banners);
      return true;
    }
    return false;
  }

  // App Version & APK Distribution Configuration
  public getAppVersionConfig(): AppVersionConfig {
    try {
      const vPath = path.join(process.cwd(), 'public', 'download', 'version.json');
      if (fs.existsSync(vPath)) {
        const parsed = JSON.parse(fs.readFileSync(vPath, 'utf-8'));
        this.data.appVersionConfig = {
          version: parsed.version || '1.3.4',
          versionCode: Number(parsed.versionCode) || 134,
          downloadUrl: parsed.downloadUrl || 'https://aryanagency.in/download/aryan-agency-app.apk',
          apkUrl: parsed.apkUrl || parsed.downloadUrl || 'https://aryanagency.in/download/aryan-agency-app.apk',
          updatedAt: parsed.updatedAt || new Date().toISOString(),
          releaseNotes: parsed.releaseNotes || 'Aryan Agency v1.3.4: In-app update compatibility fix',
          fileSize: parsed.fileSize || '7.7 MB',
          minAndroidVersion: parsed.minAndroidVersion || 'Android 8.0+'
        };
        return this.data.appVersionConfig;
      }
    } catch (e) {
      console.warn('[db] Failed to load version.json fallback:', e);
    }

    if (!this.data.appVersionConfig) {
      this.data.appVersionConfig = {
        version: '1.3.4',
        versionCode: 134,
        downloadUrl: 'https://aryanagency.in/download/aryan-agency-app.apk',
        apkUrl: 'https://aryanagency.in/download/aryan-agency-app.apk',
        updatedAt: new Date().toISOString(),
        releaseNotes: 'Aryan Agency Retailer & Distributor App v1.3.4',
        fileSize: '7.7 MB',
        minAndroidVersion: 'Android 8.0+'
      };
    }

    return this.data.appVersionConfig;
  }

  public saveAppVersionConfig(config: Partial<AppVersionConfig>): AppVersionConfig {
    const current = this.getAppVersionConfig();
    this.data.appVersionConfig = {
      ...current,
      ...config,
      updatedAt: new Date().toISOString()
    };
    this.saveData(this.data);

    // Sync to public/download/version.json and dist/download/version.json
    try {
      const paths = [
        path.join(process.cwd(), 'public', 'download', 'version.json'),
        path.join(process.cwd(), 'dist', 'download', 'version.json'),
      ];
      for (const p of paths) {
        const dir = path.dirname(p);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(p, JSON.stringify(this.data.appVersionConfig, null, 2), 'utf-8');
      }
    } catch (e) {
      console.warn('[db] Could not sync version.json file:', e);
    }

    return this.data.appVersionConfig;
  }

  // Settings & UPI Configuration
  public getSettings(): any {
    return (this.data as any).settings || {
      allowCOD: true,
      mandatoryOnlinePayment: false,
      upiVpa: 'aryanagency@upi',
      upiPayeeName: 'Aryan Agency FMCG Distribution',
      upiBankName: 'State Bank of India',
      upiAccountNumber: '••••4109',
      upiIfscCode: 'SBIN0000612',
      upiMerchantId: 'MC_ARYAN_FMCG_26',
      upiMerchantCategoryCode: '5411',
      upiStatus: 'active',
      upiAutoVerify: true,
      upiConnectedAt: '2026-01-15T09:00:00.000Z',
      soundboxEnabled: true,
      enableDeliveryCharges: true,
      deliveryCharge: 50,
      freeDeliveryAbove: 2000,
      enableMdr: true,
      mdrPercentage: 0.04
    };
  }

  public updateSettings(newSettings: any): any {
    const current = this.getSettings();
    const updated = { ...current, ...newSettings };
    (this.data as any).settings = updated;
    this.saveData(this.data);
    return updated;
  }

  // ==========================================
  // In-App Notifications & Device Push Tokens
  // ==========================================
  public getNotifications(role?: string, userId?: string): AppNotification[] {
    if (!this.data.notifications) this.data.notifications = [];
    return this.data.notifications.filter(n => {
      if (role === 'admin' && (n.recipientRole === 'admin' || !n.recipientRole)) return true;
      if (userId && n.recipientUserId === userId) return true;
      if (role && n.recipientRole === role && !n.recipientUserId) return true;
      return !n.recipientRole || n.recipientRole === 'admin';
    }).sort((a, b) => new Date(b.createdAt || b.timestamp || 0).getTime() - new Date(a.createdAt || a.timestamp || 0).getTime());
  }

  public addNotification(notification: AppNotification): AppNotification {
    if (!this.data.notifications) this.data.notifications = [];
    const now = Date.now();
    const isDup = this.data.notifications.some(existing => {
      const matchType = existing.type === notification.type;
      const matchRecord = (
        (notification.retailerId && existing.retailerId === notification.retailerId) ||
        (notification.orderId && existing.orderId === notification.orderId) ||
        (notification.paymentId && existing.paymentId === notification.paymentId)
      );
      const timeDiff = now - new Date(existing.createdAt || existing.timestamp || 0).getTime();
      return matchType && matchRecord && timeDiff < 60000;
    });

    if (isDup) {
      return notification;
    }

    const cleanNotif: AppNotification = {
      ...notification,
      id: notification.id || `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      createdAt: notification.createdAt || new Date().toISOString(),
      isRead: Boolean(notification.isRead)
    };

    this.data.notifications.unshift(cleanNotif);
    if (this.data.notifications.length > 300) {
      this.data.notifications = this.data.notifications.slice(0, 300);
    }
    this.saveData(this.data);
    return cleanNotif;
  }

  public markNotificationRead(id: string): boolean {
    if (!this.data.notifications) return false;
    const target = this.data.notifications.find(n => n.id === id);
    if (target) {
      target.isRead = true;
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  public markAllNotificationsRead(role?: string, userId?: string): number {
    if (!this.data.notifications) return 0;
    let count = 0;
    this.data.notifications.forEach(n => {
      const match = (role === 'admin' && (n.recipientRole === 'admin' || !n.recipientRole)) ||
                    (userId && n.recipientUserId === userId) ||
                    (!n.recipientRole && !userId);
      if (match && !n.isRead) {
        n.isRead = true;
        count++;
      }
    });
    if (count > 0) this.saveData(this.data);
    return count;
  }

  public deleteNotification(id: string): boolean {
    if (!this.data.notifications) return false;
    const beforeLen = this.data.notifications.length;
    this.data.notifications = this.data.notifications.filter(n => n.id !== id);
    if (this.data.notifications.length !== beforeLen) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  public clearAllNotifications(role?: string, userId?: string): number {
    if (!this.data.notifications) return 0;
    const beforeLen = this.data.notifications.length;
    this.data.notifications = this.data.notifications.filter(n => {
      const match = (role === 'admin' && (n.recipientRole === 'admin' || !n.recipientRole)) ||
                    (userId && n.recipientUserId === userId) ||
                    (!n.recipientRole && !userId);
      return !match;
    });
    const cleared = beforeLen - this.data.notifications.length;
    if (cleared > 0) this.saveData(this.data);
    return cleared;
  }

  public getDeviceTokens(role?: string): AdminDeviceToken[] {
    if (!this.data.deviceTokens) this.data.deviceTokens = [];
    if (!role) return this.data.deviceTokens.filter(t => t.isActive);
    return this.data.deviceTokens.filter(t => t.role === role && t.isActive);
  }

  public registerDeviceToken(tokenData: Partial<AdminDeviceToken>): AdminDeviceToken {
    if (!this.data.deviceTokens) this.data.deviceTokens = [];
    const nowIso = new Date().toISOString();
    const existingIndex = this.data.deviceTokens.findIndex(t => t.fcmToken === tokenData.fcmToken);

    if (existingIndex >= 0) {
      const updated: AdminDeviceToken = {
        ...this.data.deviceTokens[existingIndex],
        ...tokenData,
        isActive: true,
        updatedAt: nowIso
      } as AdminDeviceToken;
      this.data.deviceTokens[existingIndex] = updated;
      this.saveData(this.data);
      return updated;
    } else {
      const newToken: AdminDeviceToken = {
        id: `dt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: tokenData.userId || 'usr_admin',
        role: tokenData.role || 'admin',
        fcmToken: tokenData.fcmToken!,
        platform: tokenData.platform || 'android',
        deviceInfo: tokenData.deviceInfo || {},
        isActive: true,
        createdAt: nowIso,
        updatedAt: nowIso
      };
      this.data.deviceTokens.push(newToken);
      this.saveData(this.data);
      return newToken;
    }
  }

  public deactivateDeviceToken(fcmToken: string): boolean {
    if (!this.data.deviceTokens) return false;
    const target = this.data.deviceTokens.find(t => t.fcmToken === fcmToken);
    if (target) {
      target.isActive = false;
      target.updatedAt = new Date().toISOString();
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // ==========================================
  // Salesman Tasks
  // ==========================================
  public getSalesmanTasks(salesmanId?: string): SalesmanTask[] {
    if (!this.data.salesmanTasks) {
      this.data.salesmanTasks = [];
    }
    if (salesmanId) {
      return this.data.salesmanTasks.filter(t => t.salesmanId === salesmanId);
    }
    return this.data.salesmanTasks;
  }

  public getSalesmanTaskById(id: string): SalesmanTask | undefined {
    return (this.data.salesmanTasks || []).find(t => t.id === id);
  }

  public saveSalesmanTask(task: SalesmanTask): SalesmanTask {
    if (!this.data.salesmanTasks) {
      this.data.salesmanTasks = [];
    }
    if (!task.id) {
      task.id = `tsk_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    }
    const idx = this.data.salesmanTasks.findIndex(t => t.id === task.id);
    const nowIso = new Date().toISOString();
    if (idx >= 0) {
      this.data.salesmanTasks[idx] = { ...task, updatedAt: nowIso };
    } else {
      this.data.salesmanTasks.unshift({
        ...task,
        createdAt: task.createdAt || nowIso,
        updatedAt: nowIso
      });
    }
    this.saveData(this.data);
    return this.data.salesmanTasks.find(t => t.id === task.id) || task;
  }

  public updateSalesmanTaskStatus(id: string, status: TaskStatus, completionNotes?: string): SalesmanTask | null {
    if (!this.data.salesmanTasks) return null;
    const task = this.data.salesmanTasks.find(t => t.id === id);
    if (!task) return null;
    task.status = status;
    task.updatedAt = new Date().toISOString();
    if (status === 'completed') {
      task.completedAt = new Date().toISOString();
      if (completionNotes) task.completionNotes = completionNotes;
    }
    this.saveData(this.data);
    return task;
  }

  public updateSalesmanTask(id: string, updates: Partial<SalesmanTask>): SalesmanTask | null {
    if (!this.data.salesmanTasks) return null;
    const idx = this.data.salesmanTasks.findIndex(t => t.id === id);
    if (idx < 0) return null;
    const current = this.data.salesmanTasks[idx];
    const updated: SalesmanTask = {
      ...current,
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };
    if (updates.status === 'completed' && !current.completedAt) {
      updated.completedAt = new Date().toISOString();
    }
    this.data.salesmanTasks[idx] = updated;
    this.saveData(this.data);
    return updated;
  }

  public deleteSalesmanTask(id: string): boolean {
    if (!this.data.salesmanTasks) return false;
    const initLen = this.data.salesmanTasks.length;
    this.data.salesmanTasks = this.data.salesmanTasks.filter(t => t.id !== id);
    if (this.data.salesmanTasks.length !== initLen) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // ==========================================
  // Sales Targets
  // ==========================================
  public getSalesTargets(salesmanId?: string): SalesTarget[] {
    if (!this.data.salesTargets) {
      this.data.salesTargets = [];
    }
    if (salesmanId) {
      return this.data.salesTargets.filter(t => t.salesmanId === salesmanId);
    }
    return this.data.salesTargets;
  }

  public saveSalesTarget(target: SalesTarget): SalesTarget {
    if (!this.data.salesTargets) {
      this.data.salesTargets = [];
    }
    if (!target.id) {
      target.id = `tgt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    }
    const nowIso = new Date().toISOString();
    const idx = this.data.salesTargets.findIndex(t => t.id === target.id);
    if (idx >= 0) {
      this.data.salesTargets[idx] = { ...target, updatedAt: nowIso };
    } else {
      this.data.salesTargets.unshift({
        ...target,
        createdAt: target.createdAt || nowIso,
        updatedAt: nowIso
      });
    }
    // Also update target amounts on the Salesman entity itself for easy fast querying
    const salesman = this.getSalesmanById(target.salesmanId);
    if (salesman) {
      if (target.period === 'daily') {
        salesman.dailyTargetAmount = target.targetAmount;
      } else if (target.period === 'monthly') {
        salesman.monthlyTargetAmount = target.targetAmount;
      }
      salesman.targetAssigned = true;
      salesman.effectiveStartDate = target.effectiveStartDate;
      salesman.targetPeriod = target.period;
      this.saveSalesman(salesman);
    }
    this.saveData(this.data);
    return target;
  }

  // ==========================================
  // User Credentials & Password Auth
  // ==========================================
  public setUserCredentials(email: string, plainPassword: string, userId: string, role: string) {
    if (!this.data.userCredentials) {
      this.data.userCredentials = {};
    }
    const cleanEmail = email.trim().toLowerCase();
    this.data.userCredentials[cleanEmail] = {
      plainPassword,
      userId,
      role,
      updatedAt: new Date().toISOString()
    };
    this.saveData(this.data);
  }

  // ==========================================
  // Staff Members Management
  // ==========================================
  public getStaffMembers(): StaffMember[] {
    return this.data.staffMembers || [];
  }

  public getStaffMemberById(id: string): StaffMember | undefined {
    return (this.data.staffMembers || []).find(s => s.id === id);
  }

  public getStaffMemberByEmail(email: string): StaffMember | undefined {
    const clean = email.trim().toLowerCase();
    return (this.data.staffMembers || []).find(s => s.email && s.email.toLowerCase() === clean);
  }

  public getStaffMemberByUserId(userId: string): StaffMember | undefined {
    return (this.data.staffMembers || []).find(s => s.userId === userId);
  }

  public getStaffMemberBySalesmanId(salesmanId: string): StaffMember | undefined {
    return (this.data.staffMembers || []).find(s => s.salesmanId === salesmanId);
  }

  public saveStaffMember(staff: StaffMember): StaffMember {
    if (!this.data.staffMembers) {
      this.data.staffMembers = [];
    }
    const nowIso = new Date().toISOString();
    if (!staff.id) {
      staff.id = `stf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    }
    if (!staff.employeeCode) {
      const codeSuffix = Math.floor(100 + Math.random() * 900);
      staff.employeeCode = `EMP-AA-${codeSuffix}`;
    }
    const idx = this.data.staffMembers.findIndex(s => s.id === staff.id);
    if (idx >= 0) {
      this.data.staffMembers[idx] = { ...staff, updatedAt: nowIso };
    } else {
      this.data.staffMembers.push({
        ...staff,
        createdAt: staff.createdAt || nowIso,
        updatedAt: nowIso
      });
    }
    this.saveData(this.data);
    return staff;
  }

  public deleteStaffMember(id: string, options?: { cascadeTestRecords?: boolean }): boolean {
    if (!this.data.staffMembers) return false;
    const initialLen = this.data.staffMembers.length;
    this.data.staffMembers = this.data.staffMembers.filter(s => s.id !== id);
    if (this.data.staffMembers.length !== initialLen) {
      if (options?.cascadeTestRecords) {
        if (this.data.staffAttendance) {
          this.data.staffAttendance = this.data.staffAttendance.filter(a => a.staffId !== id);
        }
        if (this.data.staffPayrolls) {
          this.data.staffPayrolls = this.data.staffPayrolls.filter(p => p.staffId !== id);
        }
      }
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // ==========================================
  // Staff Attendance Management
  // ==========================================
  public getStaffAttendance(query?: { staffId?: string; date?: string; month?: string; startDate?: string; endDate?: string }): StaffAttendance[] {
    let list = this.data.staffAttendance || [];
    if (!query) return list;

    if (query.staffId) {
      list = list.filter(a => a.staffId === query.staffId);
    }
    if (query.date) {
      list = list.filter(a => a.date === query.date);
    }
    if (query.month) {
      list = list.filter(a => a.date.startsWith(query.month!));
    }
    if (query.startDate) {
      list = list.filter(a => a.date >= query.startDate!);
    }
    if (query.endDate) {
      list = list.filter(a => a.date <= query.endDate!);
    }
    return list.sort((a, b) => b.date.localeCompare(a.date));
  }

  public markStaffAttendance(record: Partial<StaffAttendance>, markedBy?: string): { success: boolean; attendance: StaffAttendance; isUpdate: boolean } {
    if (!this.data.staffAttendance) {
      this.data.staffAttendance = [];
    }
    if (!record.staffId || !record.date || !record.status) {
      throw new Error('staffId, date, and status are required');
    }

    const staff = this.getStaffMemberById(record.staffId);
    const nowIso = new Date().toISOString();
    const existingIdx = this.data.staffAttendance.findIndex(a => a.staffId === record.staffId && a.date === record.date);
    const isSelfCheckIn = record.checkInMethod === 'self_check_in';

    if (existingIdx >= 0) {
      const existing = this.data.staffAttendance[existingIdx];
      // Business Rule: Salesmen cannot submit duplicate attendance or overwrite an existing check-in for the same date
      if (isSelfCheckIn) {
        const currentAppr = existing.approvalStatus || (existing.checkInMethod === 'admin_marked' ? 'approved' : 'pending');
        const formattedAppr = currentAppr === 'pending' ? 'Pending Approval' : currentAppr === 'approved' ? 'Approved' : currentAppr === 'rejected' ? 'Rejected' : 'Correction Required';
        throw new Error(`Attendance already recorded for ${record.date}. Current status: ${formattedAppr}. Duplicate check-in submissions are not permitted.`);
      }

      // Admin or manager updating an existing attendance record
      const history = existing.correctionHistory || [];
      if (existing.status !== record.status) {
        history.push({
          correctedBy: markedBy || 'Admin',
          correctedAt: nowIso,
          previousStatus: existing.status,
          newStatus: record.status,
          reason: record.remarks || 'Attendance updated by Admin'
        });
      }

      const updated: StaffAttendance = {
        ...existing,
        ...record,
        status: record.status,
        approvalStatus: record.approvalStatus !== undefined ? record.approvalStatus : existing.approvalStatus,
        checkInTime: record.checkInTime !== undefined ? record.checkInTime : existing.checkInTime,
        checkOutTime: record.checkOutTime !== undefined ? record.checkOutTime : existing.checkOutTime,
        remarks: record.remarks !== undefined ? record.remarks : existing.remarks,
        correctionHistory: history,
        updatedAt: nowIso
      };
      this.data.staffAttendance[existingIdx] = updated;
      this.saveData(this.data);
      return { success: true, attendance: updated, isUpdate: true };
    } else {
      const approvalStatus = record.approvalStatus || (isSelfCheckIn ? 'pending' : 'approved');
      const newRecord: StaffAttendance = {
        id: `att_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        staffId: record.staffId,
        employeeCode: staff?.employeeCode || record.employeeCode || 'EMP-AA-000',
        staffName: staff?.name || record.staffName || 'Staff Member',
        role: staff?.role || record.role || 'salesman',
        date: record.date,
        status: record.status,
        approvalStatus,
        checkInTime: record.checkInTime,
        checkOutTime: record.checkOutTime,
        checkInMethod: record.checkInMethod || 'admin_marked',
        workingHours: record.workingHours || (record.status === 'present' ? 8.5 : record.status === 'half_day' ? 4.5 : 0),
        remarks: record.remarks || '',
        approvedBy: isSelfCheckIn ? undefined : (markedBy || 'Admin'),
        approvedAt: isSelfCheckIn ? undefined : nowIso,
        approvalAuditTrail: [
          isSelfCheckIn ? {
            action: 'submitted',
            actorId: record.staffId,
            actorName: staff?.name || record.staffName || 'Staff Member',
            actorRole: staff?.role || 'salesman',
            timestamp: nowIso,
            newApprovalStatus: 'pending',
            reason: record.remarks || 'Self check-in via mobile dashboard'
          } : {
            action: 'approved',
            actorId: 'admin',
            actorName: markedBy || 'Admin',
            actorRole: 'admin',
            timestamp: nowIso,
            newApprovalStatus: 'approved',
            reason: 'Direct attendance marked by Administrator'
          }
        ],
        correctionHistory: [],
        createdAt: nowIso,
        updatedAt: nowIso
      };
      this.data.staffAttendance.push(newRecord);
      this.saveData(this.data);
      return { success: true, attendance: newRecord, isUpdate: false };
    }
  }

  public approveStaffAttendance(id: string, approverName: string, approverId?: string): { success: boolean; attendance?: StaffAttendance; error?: string } {
    if (!this.data.staffAttendance) return { success: false, error: 'Attendance table empty' };
    const idx = this.data.staffAttendance.findIndex(a => a.id === id);
    if (idx === -1) return { success: false, error: 'Attendance record not found' };

    const current = this.data.staffAttendance[idx];
    const nowIso = new Date().toISOString();
    const audit = current.approvalAuditTrail || [];
    audit.push({
      action: 'approved',
      actorId: approverId || 'admin',
      actorName: approverName || 'Admin',
      actorRole: 'admin',
      timestamp: nowIso,
      previousApprovalStatus: current.approvalStatus || 'pending',
      newApprovalStatus: 'approved',
      reason: 'Approved by Administrator'
    });

    current.approvalStatus = 'approved';
    current.approvedBy = approverName || 'Admin';
    current.approvedById = approverId;
    current.approvedAt = nowIso;
    current.rejectionReason = undefined;
    current.correctionReason = undefined;
    current.approvalAuditTrail = audit;
    current.updatedAt = nowIso;
    this.saveData(this.data);
    return { success: true, attendance: current };
  }

  public rejectStaffAttendance(id: string, reason: string, approverName: string, approverId?: string): { success: boolean; attendance?: StaffAttendance; error?: string } {
    if (!this.data.staffAttendance) return { success: false, error: 'Attendance table empty' };
    const idx = this.data.staffAttendance.findIndex(a => a.id === id);
    if (idx === -1) return { success: false, error: 'Attendance record not found' };
    if (!reason || !reason.trim()) {
      return { success: false, error: 'Mandatory rejection reason must be provided.' };
    }

    const current = this.data.staffAttendance[idx];
    const nowIso = new Date().toISOString();
    const audit = current.approvalAuditTrail || [];
    audit.push({
      action: 'rejected',
      actorId: approverId || 'admin',
      actorName: approverName || 'Admin',
      actorRole: 'admin',
      timestamp: nowIso,
      previousApprovalStatus: current.approvalStatus || 'pending',
      newApprovalStatus: 'rejected',
      reason: reason.trim()
    });

    current.approvalStatus = 'rejected';
    current.rejectionReason = reason.trim();
    current.approvedBy = approverName || 'Admin';
    current.approvedById = approverId;
    current.approvedAt = nowIso;
    current.approvalAuditTrail = audit;
    current.updatedAt = nowIso;
    this.saveData(this.data);
    return { success: true, attendance: current };
  }

  public requestCorrectionStaffAttendance(id: string, reason: string, approverName: string, approverId?: string): { success: boolean; attendance?: StaffAttendance; error?: string } {
    if (!this.data.staffAttendance) return { success: false, error: 'Attendance table empty' };
    const idx = this.data.staffAttendance.findIndex(a => a.id === id);
    if (idx === -1) return { success: false, error: 'Attendance record not found' };
    if (!reason || !reason.trim()) {
      return { success: false, error: 'Correction reason must be provided.' };
    }

    const current = this.data.staffAttendance[idx];
    const nowIso = new Date().toISOString();
    const audit = current.approvalAuditTrail || [];
    audit.push({
      action: 'correction_requested',
      actorId: approverId || 'admin',
      actorName: approverName || 'Admin',
      actorRole: 'admin',
      timestamp: nowIso,
      previousApprovalStatus: current.approvalStatus || 'pending',
      newApprovalStatus: 'correction_required',
      reason: reason.trim()
    });

    current.approvalStatus = 'correction_required';
    current.correctionReason = reason.trim();
    current.approvedBy = approverName || 'Admin';
    current.approvedById = approverId;
    current.approvedAt = nowIso;
    current.approvalAuditTrail = audit;
    current.updatedAt = nowIso;
    this.saveData(this.data);
    return { success: true, attendance: current };
  }

  public correctStaffAttendance(id: string, newStatus: AttendanceStatus, reason: string, correctedBy: string): { success: boolean; attendance?: StaffAttendance; error?: string } {
    if (!this.data.staffAttendance) return { success: false, error: 'Attendance table empty' };
    const idx = this.data.staffAttendance.findIndex(a => a.id === id);
    if (idx === -1) return { success: false, error: 'Attendance record not found' };

    const current = this.data.staffAttendance[idx];
    const nowIso = new Date().toISOString();
    const history = current.correctionHistory || [];
    history.push({
      correctedBy: correctedBy || 'Admin',
      correctedAt: nowIso,
      previousStatus: current.status,
      newStatus,
      reason: reason || 'Authorized correction'
    });

    current.status = newStatus;
    current.remarks = reason ? `${current.remarks ? current.remarks + ' | ' : ''}Correction: ${reason}` : current.remarks;
    current.correctionHistory = history;
    current.updatedAt = nowIso;
    this.saveData(this.data);
    return { success: true, attendance: current };
  }

  // ==========================================
  // Staff Payroll & Salary Management
  // ==========================================
  public getStaffPayrolls(query?: { staffId?: string; period?: string }): StaffPayroll[] {
    let list = this.data.staffPayrolls || [];
    if (query?.staffId) {
      list = list.filter(p => p.staffId === query.staffId);
    }
    if (query?.period) {
      list = list.filter(p => p.period === query.period);
    }
    return list.sort((a, b) => b.period.localeCompare(a.period));
  }

  public generateStaffPayroll(staffId: string, period: string, options?: { allowances?: any[]; deductions?: any[]; advances?: number; notes?: string }): StaffPayroll {
    if (!this.data.staffPayrolls) {
      this.data.staffPayrolls = [];
    }

    const staff = this.getStaffMemberById(staffId);
    if (!staff) {
      throw new Error(`Staff member ${staffId} not found`);
    }

    const existingIdx = this.data.staffPayrolls.findIndex(p => p.staffId === staffId && p.period === period);
    const existing = existingIdx >= 0 ? this.data.staffPayrolls[existingIdx] : undefined;
    if (existing && (existing.status === 'approved' || existing.status === 'paid')) {
      return existing;
    }

    const [yearStr, monthStr] = period.split('-');
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const totalDaysInMonth = new Date(year, month, 0).getDate();

    const attendance = (this.data.staffAttendance || []).filter(a => a.staffId === staffId && a.date.startsWith(period));
    // Business Rule: ONLY approved attendance counts toward payable attendance days and salary calculations
    const approvedAttendance = attendance.filter(a => a.approvalStatus === 'approved' || (!a.approvalStatus && a.checkInMethod === 'admin_marked'));
    const presentDays = approvedAttendance.filter(a => a.status === 'present').length;
    const paidLeaves = approvedAttendance.filter(a => a.status === 'paid_leave').length;
    const halfDays = approvedAttendance.filter(a => a.status === 'half_day').length;
    const unpaidLeaves = attendance.filter(a => a.status === 'unpaid_leave').length;
    const absentDays = attendance.filter(a => a.status === 'absent').length;
    let weeklyOffs = attendance.filter(a => a.status === 'weekly_off').length;

    if (weeklyOffs === 0) {
      const offDay = staff.weeklyOffDay !== undefined ? staff.weeklyOffDay : 0;
      for (let day = 1; day <= totalDaysInMonth; day++) {
        const d = new Date(year, month - 1, day);
        if (d.getDay() === offDay) {
          const dateStr = `${period}-${String(day).padStart(2, '0')}`;
          const isExplicitUnpaid = attendance.some(a => a.date === dateStr && (a.status === 'absent' || a.status === 'unpaid_leave'));
          if (!isExplicitUnpaid) weeklyOffs++;
        }
      }
    }

    const payableDays = Math.min(totalDaysInMonth, presentDays + paidLeaves + weeklyOffs + (halfDays * 0.5));

    let grossCalculated = 0;
    if (staff.salaryType === 'monthly_fixed') {
      grossCalculated = Math.round((staff.baseSalary / totalDaysInMonth) * payableDays);
    } else if (staff.salaryType === 'daily_wage' || staff.salaryType === 'attendance_based') {
      grossCalculated = Math.round(payableDays * staff.baseSalary);
    }

    const allowanceList = options?.allowances || staff.allowances || [];
    const deductionList = options?.deductions || staff.deductions || [];
    const allowancesTotal = allowanceList.reduce((sum: number, a: any) => sum + (Number(a.amount) || 0), 0);
    const deductionsTotal = deductionList.reduce((sum: number, d: any) => sum + (Number(d.amount) || 0), 0);
    const advancesDeducted = Number(options?.advances || 0);

    const netPayable = Math.max(0, grossCalculated + allowancesTotal - deductionsTotal - advancesDeducted);
    const amountPaid = existing?.amountPaid || 0;
    const remainingDue = Math.max(0, netPayable - amountPaid);
    const nowIso = new Date().toISOString();

    const payroll: StaffPayroll = {
      id: existing?.id || `pr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      staffId: staff.id,
      employeeCode: staff.employeeCode,
      staffName: staff.name,
      role: staff.role,
      period,
      salaryType: staff.salaryType,
      baseSalary: staff.baseSalary,
      totalDaysInMonth,
      presentDays,
      absentDays,
      halfDays,
      paidLeaves,
      unpaidLeaves,
      weeklyOffs,
      payableDays,
      grossCalculated,
      allowancesTotal,
      allowanceBreakdown: allowanceList,
      deductionsTotal,
      deductionBreakdown: deductionList,
      advancesDeducted,
      netPayable,
      amountPaid,
      remainingDue,
      status: existing?.status || 'calculated',
      notes: options?.notes || existing?.notes || `Calculated on ${new Date().toLocaleDateString()}`,
      payments: existing?.payments || [],
      createdAt: existing?.createdAt || nowIso,
      updatedAt: nowIso
    };

    if (existingIdx >= 0) {
      this.data.staffPayrolls[existingIdx] = payroll;
    } else {
      this.data.staffPayrolls.push(payroll);
    }
    this.saveData(this.data);
    return payroll;
  }

  public approveStaffPayroll(payrollId: string, approvedByName: string): { success: boolean; payroll?: StaffPayroll; error?: string } {
    if (!this.data.staffPayrolls) return { success: false, error: 'No payroll records' };
    const p = this.data.staffPayrolls.find(item => item.id === payrollId);
    if (!p) return { success: false, error: 'Payroll not found' };

    p.status = 'approved';
    p.approvedBy = approvedByName || 'Administrator';
    p.approvedAt = new Date().toISOString();
    p.updatedAt = new Date().toISOString();
    this.saveData(this.data);
    return { success: true, payroll: p };
  }

  public recordStaffSalaryPayment(payment: StaffSalaryPaymentPayload): { success: boolean; payroll?: StaffPayroll; payment?: PayrollPaymentRecord; error?: string } {
    if (!this.data.staffPayrolls) return { success: false, error: 'No payroll records' };
    const p = this.data.staffPayrolls.find(item => item.id === payment.payrollId);
    if (!p) return { success: false, error: 'Payroll not found' };

    if (!payment.amount || payment.amount <= 0) {
      return { success: false, error: 'Payment amount must be greater than zero' };
    }

    const nowIso = new Date().toISOString();
    const payRecord: PayrollPaymentRecord = {
      id: `spay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      paymentDate: new Date().toISOString().split('T')[0],
      amount: payment.amount,
      paymentMethod: payment.paymentMethod || 'bank_transfer',
      referenceNumber: payment.referenceNumber,
      paidByName: payment.paidByName || 'Administrator',
      notes: payment.notes,
      createdAt: nowIso
    };

    p.payments = p.payments || [];
    p.payments.push(payRecord);
    p.amountPaid = p.payments.reduce((sum, item) => sum + item.amount, 0);
    p.remainingDue = Math.max(0, p.netPayable - p.amountPaid);
    p.status = p.remainingDue === 0 ? 'paid' : 'partially_paid';
    p.updatedAt = nowIso;

    if (!this.data.staffSalaryPayments) {
      this.data.staffSalaryPayments = [];
    }
    this.data.staffSalaryPayments.push(payRecord);

    this.saveData(this.data);
    return { success: true, payroll: p, payment: payRecord };
  }

  public getStaffStats(period?: string) {
    const curPeriod = period || new Date().toISOString().slice(0, 7);
    const today = new Date().toISOString().split('T')[0];
    const staff = this.data.staffMembers || [];
    const attendance = (this.data.staffAttendance || []).filter(a => a.date === today);
    const payrolls = (this.data.staffPayrolls || []).filter(p => p.period === curPeriod);

    const totalStaff = staff.length;
    const activeStaff = staff.filter(s => s.employmentStatus === 'active').length;
    const presentToday = attendance.filter(a => a.status === 'present').length;
    const absentToday = attendance.filter(a => a.status === 'absent').length;
    const onLeaveToday = attendance.filter(a => a.status === 'paid_leave' || a.status === 'unpaid_leave').length;

    const totalPayrollAmount = payrolls.reduce((sum, p) => sum + p.netPayable, 0);
    const disbursedPayrollAmount = payrolls.reduce((sum, p) => sum + p.amountPaid, 0);
    const pendingPayrollAmount = Math.max(0, totalPayrollAmount - disbursedPayrollAmount);

    return {
      totalStaff,
      activeStaff,
      presentToday,
      absentToday,
      onLeaveToday,
      totalPayrollAmount,
      disbursedPayrollAmount,
      pendingPayrollAmount
    };
  }

  public verifyUserCredentials(email: string, pass: string): { isValid: boolean; user?: User; error?: string } {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Look up user profile with alias support
    let user = (this.data.users || []).find(u => u.email && u.email.toLowerCase() === cleanEmail);
    if (!user && (cleanEmail === 'admin@aryanagency.in' || cleanEmail === 'admin@apnastore.in' || cleanEmail === 'nikhilcsc18@gmail.com' || cleanEmail === 'rockygupta928@gmail.com')) {
      user = (this.data.users || []).find(u => u.email && (u.email.toLowerCase() === 'aryan@aryanagency.in' || u.role === 'admin'));
    }

    if (!user) {
      return { isValid: false, error: 'No account found with this email address.' };
    }

    // Role correction: ensure salesman profiles are mapped to 'salesman' role
    if (user.salesmanId || cleanEmail.includes('.sales@') || this.data.salesmen.some(s => s.id === user?.salesmanId || (s.email && s.email.toLowerCase() === cleanEmail))) {
      if (user.role !== 'salesman') {
        user.role = 'salesman';
        this.saveUser(user);
      }
    }

    // 2. Check credentials store
    const stored = this.data.userCredentials ? this.data.userCredentials[cleanEmail] : null;
    if (stored && stored.plainPassword) {
      if (stored.plainPassword === cleanPass) {
        return { isValid: true, user };
      }
    }

    // 3. Fallback master passwords for seed/enterprise accounts
    const lowerPass = cleanPass.toLowerCase();
    if (
      cleanPass === 'AryanAgency@2026' || lowerPass === 'aryanagency@2026' ||
      cleanPass === 'Sales@2026' || lowerPass === 'sales@2026' ||
      cleanPass === 'Delivery@2026' || lowerPass === 'delivery@2026' ||
      cleanPass === 'password'
    ) {
      return { isValid: true, user };
    }

    return { isValid: false, error: 'Incorrect password. Please verify and try again.' };
  }

  // ==========================================
  // Centralized Business Profile Management
  // ==========================================
  public getBusinessProfile(): any {
    if (!this.data.businessProfile) {
      this.data.businessProfile = {
        businessName: 'Aryan Agency',
        businessType: 'FMCG Distribution — Trusted FMCG Supplier',
        tagline: 'FMCG Distribution — Trusted FMCG Supplier',
        shortTagline: 'Authorised Super Stockist & Wholesale FMCG Depot',
        address: 'Hatan Road, Gurudyaldeeh',
        road: 'Hatan Road',
        area: 'Gurudyaldeeh',
        city: 'Utraula',
        district: 'Balrampur',
        state: 'Uttar Pradesh',
        pincode: '271604',
        fullAddress: 'Hatan Road, Gurudyaldeeh, Utraula, Balrampur, Uttar Pradesh – 271604',
        primaryMobile: '9140529661',
        supportPhoneFormatted: '+91 9140529661',
        email: 'aryanagency@zohomail.in',
        gstin: '09BOGPG2620P1ZQ',
        panNumber: 'BOGPG2620P',
        fssaiNumber: '11223344556677',
        website: 'https://aryanagency.in',
        officialDomain: 'aryanagency.in'
      };
      this.saveData(this.data);
    }
    return this.data.businessProfile;
  }

  public saveBusinessProfile(profile: any): any {
    this.data.businessProfile = {
      ...this.getBusinessProfile(),
      ...profile,
      updatedAt: new Date().toISOString()
    };
    this.saveData(this.data);
    return this.data.businessProfile;
  }
}

export const db = new Database();
