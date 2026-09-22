var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_path2 = __toESM(require("path"), 1);
var import_fs2 = __toESM(require("fs"), 1);
var import_vite = require("vite");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_supabase_js = require("@supabase/supabase-js");

// server/db.ts
var import_fs = __toESM(require("fs"), 1);
var import_path = __toESM(require("path"), 1);
var DATA_DIR = import_path.default.join(process.cwd(), "data");
var DB_FILE = import_path.default.join(DATA_DIR, "db.json");
var INITIAL_BANNERS = [
  {
    id: "banner_main",
    bgGradient: "from-[#F6BD27] via-[#F4B218] to-[#E89E0B]",
    title: "\u0926\u0941\u0915\u093E\u0928\u0926\u093E\u0930\u094B\u0902 \u0915\u0947 \u0932\u093F\u090F \u0938\u0940\u0927\u0947 \u0921\u093F\u092A\u094B \u0925\u094B\u0915 \u092D\u093E\u0935",
    subtitle: "Best Wholesale Rates \u2022 Maximum Retailer Margins",
    badgeText: "\u0915\u0947\u0935\u0932 \u0926\u0941\u0915\u093E\u0928\u0926\u093E\u0930\u094B\u0902 \u0915\u0947 \u0932\u093F\u090F (B2B)",
    ctaText: "\u0939\u0930 \u092A\u0947\u091F\u0940 / \u0915\u093E\u0930\u094D\u091F\u0928 \u092A\u0930 \u20B920 \u0938\u0947 \u20B960 \u0924\u0915 \u0915\u093E \u0938\u0940\u0927\u093E \u0926\u0941\u0915\u093E\u0928\u0926\u093E\u0930 \u092E\u0941\u0928\u093E\u092B\u093E",
    accentColor: "Lay's \u2022 Kurkure \u2022 Parle-G \u2022 Amul \u2022 Sunfeast",
    imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    id: "banner_offers",
    bgGradient: "from-[#F59E0B] via-[#D97706] to-[#B45309]",
    title: "Aryan B2B Retailer Trade Schemes",
    subtitle: "Parle \u2022 Britannia \u2022 Sunfeast \u2022 PepsiCo \u2022 Amul",
    badgeText: "\u0925\u094B\u0915 \u0935\u094D\u092F\u093E\u092A\u093E\u0930 \u0921\u093F\u0938\u094D\u0915\u093E\u0909\u0902\u091F",
    ctaText: "\u0915\u093E\u0930\u094D\u091F\u0928 / \u092A\u0947\u091F\u0940 \u092C\u0941\u0915\u093F\u0902\u0917 \u092A\u0930 \u0905\u0924\u093F\u0930\u093F\u0915\u094D\u0924 5% \u0925\u094B\u0915 \u0938\u094D\u0915\u0940\u092E \u092E\u093E\u0930\u094D\u091C\u093F\u0928",
    accentColor: "Special Wholesale Trade Margin on Bulk Booking",
    imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    id: "banner_fast",
    bgGradient: "from-[#0284C7] via-[#0369A1] to-[#075985]",
    title: "Direct Depot Supply to Your Shop",
    subtitle: "Same-Day / 24-Hour Dispatch directly to your Kirana Counter",
    badgeText: "\u0926\u0941\u0915\u093E\u0928 \u0924\u0915 \u0938\u0940\u0927\u0940 \u0921\u093F\u0932\u0940\u0935\u0930\u0940",
    ctaText: "100% Genuine Direct Supply Chain Guarantee with GST Bill",
    accentColor: "Depot Fleet \u2022 Utraula \u2022 Balrampur \u2022 Gonda \u2022 Tulsipur",
    imageUrl: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80",
    isActive: true
  },
  {
    id: "banner_baby_care",
    bgGradient: "from-[#0D9488] via-[#0F766E] to-[#115E59]",
    title: "Baby Care & Personal Hygiene Wholesale",
    subtitle: "Honey Bunny \u2022 Dettol \u2022 Colgate \u2022 Stayfree",
    badgeText: "\u0938\u0941\u092A\u0930-\u0938\u094D\u091F\u0949\u0915\u093F\u0938\u094D\u091F \u0921\u093F\u092A\u094B",
    ctaText: "Buy 5 Cases, Get 1 Case Free on Honey Bunny Diapers",
    accentColor: "Super-Stockist Authentic Direct Supply for Retailers",
    imageUrl: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=80",
    isActive: true
  }
];
var INITIAL_DATA = {
  users: [
    {
      id: "usr_admin",
      name: "Aryan Sharma",
      email: "aryan@aryanagency.in",
      phone: "+91 98450 12345",
      role: "admin",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
      businessName: "Aryan Agency FMCG Distribution",
      businessLogoUrl: "",
      address: "Main Road, Utraula",
      city: "Balrampur",
      state: "Uttar Pradesh",
      pincode: "271604",
      gstin: "09AABCA1234F1Z8",
      panNumber: "AABCA1234F",
      locationCoordinates: {
        lat: 27.3167,
        lng: 82.4167,
        addressText: "Utraula, Balrampur, Uttar Pradesh 271604"
      },
      verificationStatus: "verified"
    },
    {
      id: "usr_sales_1",
      name: "Rajesh Kumar",
      email: "rajesh.sales@aryanagency.in",
      phone: "+91 98860 34567",
      role: "salesman",
      salesmanId: "slm_1",
      avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: "usr_sales_2",
      name: "Vikram Singh",
      email: "vikram.sales@aryanagency.in",
      phone: "+91 99001 56789",
      role: "salesman",
      salesmanId: "slm_2",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: "usr_delivery_1",
      name: "Suresh Gowda (Van KA-05-AB-1234)",
      email: "suresh.van1@aryanagency.in",
      phone: "+91 97410 78901",
      role: "delivery",
      deliveryId: "del_1",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80"
    },
    {
      id: "usr_accounts_1",
      name: "Pooja Agarwal (Accounts Head)",
      email: "pooja.accounts@aryanagency.in",
      phone: "+91 98450 67890",
      role: "accounts",
      avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80"
    }
  ],
  products: [
    {
      id: "prd_1",
      sku: "PARLE-G-80G",
      name: "Parle-G Glucose Biscuit (80g)",
      brand: "Parle",
      category: "Biscuits & Bakery",
      hsnCode: "19053100",
      gstRate: 18,
      piecesPerCase: 60,
      mrpPiece: 10,
      wholesalePricePiece: 8.4,
      casePrice: 504,
      currentStockCases: 85,
      currentStockLoosePcs: 14,
      reorderLevelCases: 25,
      imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80",
      description: "Original glucose energy biscuit, India\u2019s largest selling brand. 80g standard retail pack.",
      batches: [
        {
          batchNumber: "PAR-26A-01",
          mfgDate: "2026-07-10",
          expiryDate: "2027-01-10",
          stockCases: 50,
          stockLoosePcs: 14,
          warehouseBin: "A-01-01"
        },
        {
          batchNumber: "PAR-26B-02",
          mfgDate: "2026-08-01",
          expiryDate: "2027-02-01",
          stockCases: 35,
          stockLoosePcs: 0,
          warehouseBin: "A-01-02"
        }
      ],
      activeScheme: {
        id: "sch_1",
        title: "Monsoon Volume Booster",
        description: "Order 5+ cases and get 6 loose packs free",
        minQtyCases: 5,
        freeQtyPcs: 6,
        isActive: true
      }
    },
    {
      id: "prd_2",
      sku: "BRIT-GD-BUTTER-100G",
      name: "Britannia Good Day Butter Cookies (100g)",
      brand: "Britannia",
      category: "Biscuits & Bakery",
      hsnCode: "19053100",
      gstRate: 18,
      piecesPerCase: 48,
      mrpPiece: 20,
      wholesalePricePiece: 16.8,
      casePrice: 806.4,
      currentStockCases: 62,
      currentStockLoosePcs: 8,
      reorderLevelCases: 20,
      imageUrl: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=500&auto=format&fit=crop&q=80",
      description: "Rich buttery cookies with a delightful crunch and smile pattern.",
      batches: [
        {
          batchNumber: "BRT-GD-991",
          mfgDate: "2026-06-15",
          expiryDate: "2026-12-15",
          stockCases: 62,
          stockLoosePcs: 8,
          warehouseBin: "A-02-01"
        }
      ],
      activeScheme: {
        id: "sch_2",
        title: "Smile Scheme",
        description: "3% cash discount on booking 10+ cases",
        minQtyCases: 10,
        discountPercentage: 3,
        isActive: true
      }
    },
    {
      id: "prd_3",
      sku: "AMUL-BUTTER-500G",
      name: "Amul Pasteurised Butter (500g)",
      brand: "Amul",
      category: "Dairy & Refrigerated",
      hsnCode: "04051000",
      gstRate: 12,
      piecesPerCase: 20,
      mrpPiece: 275,
      wholesalePricePiece: 248,
      casePrice: 4960,
      currentStockCases: 18,
      currentStockLoosePcs: 5,
      reorderLevelCases: 15,
      imageUrl: "https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=500&auto=format&fit=crop&q=80",
      description: "The Taste of India. Delicious creamy pasteurised butter.",
      batches: [
        {
          batchNumber: "AML-BT-2026-08",
          mfgDate: "2026-08-10",
          expiryDate: "2026-11-10",
          stockCases: 18,
          stockLoosePcs: 5,
          warehouseBin: "COLD-01"
        }
      ]
    },
    {
      id: "prd_4",
      sku: "MAGGI-2MIN-70G",
      name: "Maggi 2-Minute Masala Noodles (70g)",
      brand: "Nestle",
      category: "Spices & Staples",
      hsnCode: "19023010",
      gstRate: 12,
      piecesPerCase: 96,
      mrpPiece: 14,
      wholesalePricePiece: 11.9,
      casePrice: 1142.4,
      currentStockCases: 110,
      currentStockLoosePcs: 22,
      reorderLevelCases: 30,
      imageUrl: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=500&auto=format&fit=crop&q=80",
      description: "India\u2019s favorite instant masala noodles with authentic signature tastemaker.",
      batches: [
        {
          batchNumber: "NES-MAG-882",
          mfgDate: "2026-07-20",
          expiryDate: "2027-04-20",
          stockCases: 110,
          stockLoosePcs: 22,
          warehouseBin: "B-01-04"
        }
      ],
      activeScheme: {
        id: "sch_4",
        title: "Noodle Dhamaka",
        description: "Flat \u20B940 discount per case for 4+ cases",
        minQtyCases: 4,
        discountFlatRs: 40,
        isActive: true
      }
    },
    {
      id: "prd_5",
      sku: "TATA-TEA-PREM-500G",
      name: "Tata Tea Premium Desh Ki Chai (500g)",
      brand: "Tata",
      category: "Beverages",
      hsnCode: "09024020",
      gstRate: 5,
      piecesPerCase: 24,
      mrpPiece: 310,
      wholesalePricePiece: 268,
      casePrice: 6432,
      currentStockCases: 42,
      currentStockLoosePcs: 11,
      reorderLevelCases: 15,
      imageUrl: "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=500&auto=format&fit=crop&q=80",
      description: "Unique blend of big tea leaves for aroma and small tea grains for strong taste.",
      batches: [
        {
          batchNumber: "TAT-TEA-554",
          mfgDate: "2026-06-01",
          expiryDate: "2027-06-01",
          stockCases: 42,
          stockLoosePcs: 11,
          warehouseBin: "B-02-01"
        }
      ]
    },
    {
      id: "prd_6",
      sku: "SURF-EXCEL-EASY-1KG",
      name: "Surf Excel Easy Wash Detergent Powder (1kg)",
      brand: "Hindustan Unilever",
      category: "Household & Hygiene",
      hsnCode: "34022010",
      gstRate: 18,
      piecesPerCase: 18,
      mrpPiece: 145,
      wholesalePricePiece: 122.5,
      casePrice: 2205,
      currentStockCases: 54,
      currentStockLoosePcs: 4,
      reorderLevelCases: 20,
      imageUrl: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=500&auto=format&fit=crop&q=80",
      description: "Superior stain removal technology with fine washing powder.",
      batches: [
        {
          batchNumber: "HUL-SRF-102",
          mfgDate: "2026-05-18",
          expiryDate: "2028-05-18",
          stockCases: 54,
          stockLoosePcs: 4,
          warehouseBin: "C-01-02"
        }
      ],
      activeScheme: {
        id: "sch_6",
        title: "Clean Wash Promo",
        description: "Get 1 pack free with every 3 cases booked",
        minQtyCases: 3,
        freeQtyPcs: 1,
        isActive: true
      }
    },
    {
      id: "prd_7",
      sku: "COLGATE-MAXFRESH-150G",
      name: "Colgate MaxFresh Peppermint Toothpaste (150g)",
      brand: "Colgate-Palmolive",
      category: "Personal Care",
      hsnCode: "33061020",
      gstRate: 18,
      piecesPerCase: 36,
      mrpPiece: 120,
      wholesalePricePiece: 98,
      casePrice: 3528,
      currentStockCases: 38,
      currentStockLoosePcs: 15,
      reorderLevelCases: 15,
      imageUrl: "https://images.unsplash.com/photo-1559656914-a30970c1affd?w=500&auto=format&fit=crop&q=80",
      description: "Infused with cooling crystals for intense freshness and germ protection.",
      batches: [
        {
          batchNumber: "CLG-MX-404",
          mfgDate: "2026-06-25",
          expiryDate: "2028-06-25",
          stockCases: 38,
          stockLoosePcs: 15,
          warehouseBin: "C-02-03"
        }
      ]
    },
    {
      id: "prd_8",
      sku: "CADBURY-DAIRY-MILK-SILK",
      name: "Cadbury Dairy Milk Silk Chocolate (60g)",
      brand: "Mondelez",
      category: "Confectionery & Chocolates",
      hsnCode: "18063100",
      gstRate: 18,
      piecesPerCase: 40,
      mrpPiece: 80,
      wholesalePricePiece: 67.2,
      casePrice: 2688,
      currentStockCases: 28,
      currentStockLoosePcs: 12,
      reorderLevelCases: 12,
      imageUrl: "https://images.unsplash.com/photo-1548907040-4baa42d10919?w=500&auto=format&fit=crop&q=80",
      description: "Smooth, creamy chocolate crafted with pure dairy milk indulgence.",
      batches: [
        {
          batchNumber: "MDZ-SLK-771",
          mfgDate: "2026-07-05",
          expiryDate: "2027-01-05",
          stockCases: 28,
          stockLoosePcs: 12,
          warehouseBin: "COLD-02"
        }
      ]
    },
    {
      id: "prd_9",
      sku: "LAYS-MAGIC-MASALA-50G",
      name: "Lay's India's Magic Masala Potato Chips (50g)",
      brand: "PepsiCo",
      category: "Snacks & Namkeen",
      hsnCode: "20052000",
      gstRate: 12,
      piecesPerCase: 50,
      mrpPiece: 20,
      wholesalePricePiece: 16.5,
      casePrice: 825,
      currentStockCases: 74,
      currentStockLoosePcs: 19,
      reorderLevelCases: 25,
      imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=500&auto=format&fit=crop&q=80",
      description: "Crispy ridge-cut potato chips seasoned with authentic Indian spice mix.",
      batches: [
        {
          batchNumber: "PEP-LAY-331",
          mfgDate: "2026-08-05",
          expiryDate: "2026-12-05",
          stockCases: 74,
          stockLoosePcs: 19,
          warehouseBin: "A-03-01"
        }
      ],
      activeScheme: {
        id: "sch_9",
        title: "Snack Blast",
        description: "Buy 5 cases get 5% instant discount",
        minQtyCases: 5,
        discountPercentage: 5,
        isActive: true
      }
    },
    {
      id: "prd_10",
      sku: "FORTUNE-SUNFLOWER-1L",
      name: "Fortune Sunlite Refined Sunflower Oil (1 Litre Pouch)",
      brand: "Adani Wilmar",
      category: "Spices & Staples",
      hsnCode: "15121910",
      gstRate: 5,
      piecesPerCase: 12,
      mrpPiece: 160,
      wholesalePricePiece: 138,
      casePrice: 1656,
      currentStockCases: 48,
      currentStockLoosePcs: 6,
      reorderLevelCases: 20,
      imageUrl: "https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=500&auto=format&fit=crop&q=80",
      description: "Light, healthy cooking oil enriched with Vitamins A & D.",
      batches: [
        {
          batchNumber: "AWL-SUN-119",
          mfgDate: "2026-07-15",
          expiryDate: "2027-04-15",
          stockCases: 48,
          stockLoosePcs: 6,
          warehouseBin: "D-01-01"
        }
      ]
    },
    {
      id: "prd_11",
      sku: "DETTOL-ORIGINAL-SOAP-125G",
      name: "Dettol Original Germ Protection Soap (125g Pack of 4)",
      brand: "Reckitt",
      category: "Personal Care",
      hsnCode: "34011110",
      gstRate: 18,
      piecesPerCase: 24,
      mrpPiece: 190,
      wholesalePricePiece: 158,
      casePrice: 3792,
      currentStockCases: 32,
      currentStockLoosePcs: 7,
      reorderLevelCases: 15,
      imageUrl: "https://images.unsplash.com/photo-1607006314175-9988185d95d1?w=500&auto=format&fit=crop&q=80",
      description: "Trusted antibacterial protection with pine fragrance.",
      batches: [
        {
          batchNumber: "RKT-DET-621",
          mfgDate: "2026-06-10",
          expiryDate: "2028-06-10",
          stockCases: 32,
          stockLoosePcs: 7,
          warehouseBin: "C-03-01"
        }
      ]
    },
    {
      id: "prd_12",
      sku: "HALDIRAM-ALOO-BHUJIA-400G",
      name: "Haldiram's Nagpur Aloo Bhujia (400g)",
      brand: "Haldiram",
      category: "Snacks & Namkeen",
      hsnCode: "21069099",
      gstRate: 12,
      piecesPerCase: 24,
      mrpPiece: 110,
      wholesalePricePiece: 91.5,
      casePrice: 2196,
      currentStockCases: 51,
      currentStockLoosePcs: 14,
      reorderLevelCases: 18,
      imageUrl: "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=500&auto=format&fit=crop&q=80",
      description: "Spicy potato and tepary bean flour noodles with mint zest.",
      batches: [
        {
          batchNumber: "HLD-AB-801",
          mfgDate: "2026-07-28",
          expiryDate: "2027-01-28",
          stockCases: 51,
          stockLoosePcs: 14,
          warehouseBin: "A-04-02"
        }
      ]
    }
  ],
  retailers: [],
  salesmen: [
    {
      id: "slm_1",
      employeeCode: "EMP-AA-101",
      name: "Rajesh Kumar",
      phone: "+91 98860 34567",
      email: "rajesh.sales@aryanagency.in",
      assignedBeats: ["Indiranagar Retail Beat", "MG Road Commercial Beat"],
      dailyTargetAmount: 75e3,
      monthlyTargetAmount: 18e5,
      currentMonthAchieved: 142e4,
      commissionPercentage: 1.5,
      todayOrdersCount: 6,
      todaySalesAmount: 64200,
      status: "active"
    },
    {
      id: "slm_2",
      employeeCode: "EMP-AA-102",
      name: "Vikram Singh",
      phone: "+91 99001 56789",
      email: "vikram.sales@aryanagency.in",
      assignedBeats: ["Koramangala Daily Beat", "Jayanagar Provision Beat"],
      dailyTargetAmount: 65e3,
      monthlyTargetAmount: 16e5,
      currentMonthAchieved: 118e4,
      commissionPercentage: 1.5,
      todayOrdersCount: 4,
      todaySalesAmount: 48900,
      status: "active"
    },
    {
      id: "slm_3",
      employeeCode: "EMP-AA-103",
      name: "Karthik Nambiar",
      phone: "+91 97412 88441",
      email: "karthik.sales@aryanagency.in",
      assignedBeats: ["Whitefield Supermarket Beat"],
      dailyTargetAmount: 9e4,
      monthlyTargetAmount: 22e5,
      currentMonthAchieved: 195e4,
      commissionPercentage: 1.8,
      todayOrdersCount: 5,
      todaySalesAmount: 89400,
      status: "active"
    }
  ],
  deliveries: [],
  orders: [],
  payments: [],
  inventoryLogs: [
    {
      id: "inv_log_1",
      type: "inward",
      productId: "prd_1",
      productName: "Parle-G Glucose Biscuit (80g)",
      sku: "PARLE-G-80G",
      batchNumber: "PAR-26B-02",
      cases: 40,
      loosePcs: 0,
      referenceId: "PO-PARLE-891",
      date: "2026-09-01T08:00:00Z",
      performedBy: "Aryan Sharma",
      reason: "Fresh factory dispatch received from Parle depot"
    }
  ]
};
var Database = class {
  constructor() {
    this.data = this.loadData();
  }
  loadData() {
    try {
      if (!import_fs.default.existsSync(DATA_DIR)) {
        import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (import_fs.default.existsSync(DB_FILE)) {
        const raw = import_fs.default.readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        const dummyRetailerIds = ["ret_1", "ret_2", "ret_3", "ret_4", "ret_5", "ret_6"];
        let modified = false;
        if (Array.isArray(parsed.retailers)) {
          const originalLen = parsed.retailers.length;
          parsed.retailers = parsed.retailers.filter(
            (r) => !dummyRetailerIds.includes(r.id) && !r.storeName?.toLowerCase().includes("laxmi supermarket") && !r.storeName?.toLowerCase().includes("ganesh provision") && !r.storeName?.toLowerCase().includes("ganesh daily")
          );
          if (parsed.retailers.length !== originalLen) modified = true;
        }
        if (Array.isArray(parsed.orders)) {
          const originalLen = parsed.orders.length;
          parsed.orders = parsed.orders.filter(
            (o) => !["ord_1001", "ord_1002", "ord_1003", "ord_1004"].includes(o.id) && !dummyRetailerIds.includes(o.retailerId)
          );
          if (parsed.orders.length !== originalLen) modified = true;
        }
        if (Array.isArray(parsed.payments)) {
          const originalLen = parsed.payments.length;
          parsed.payments = parsed.payments.filter(
            (p) => !["pay_501", "pay_502"].includes(p.id) && !dummyRetailerIds.includes(p.retailerId)
          );
          if (parsed.payments.length !== originalLen) modified = true;
        }
        if (Array.isArray(parsed.deliveries)) {
          const originalLen = parsed.deliveries.length;
          parsed.deliveries = parsed.deliveries.filter(
            (d) => !["del_run_1", "del_run_2"].includes(d.id)
          );
          if (parsed.deliveries.length !== originalLen) modified = true;
        }
        if (Array.isArray(parsed.users)) {
          const originalLen = parsed.users.length;
          parsed.users = parsed.users.filter((u) => u.id !== "usr_retailer_1");
          if (parsed.users.length !== originalLen) modified = true;
        }
        if (!Array.isArray(parsed.banners) || parsed.banners.length === 0) {
          parsed.banners = INITIAL_BANNERS;
          modified = true;
        }
        if (modified) {
          this.saveData(parsed);
        }
        return parsed;
      }
    } catch (e) {
      console.error("Failed to read db.json, using initial seed", e);
    }
    this.saveData(INITIAL_DATA);
    return INITIAL_DATA;
  }
  saveData(data) {
    try {
      if (!import_fs.default.existsSync(DATA_DIR)) {
        import_fs.default.mkdirSync(DATA_DIR, { recursive: true });
      }
      import_fs.default.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.error("Failed to write db.json", e);
    }
  }
  getRawData() {
    return this.data;
  }
  resetToDefault() {
    this.data = JSON.parse(JSON.stringify(INITIAL_DATA));
    this.saveData(this.data);
    return this.data;
  }
  // User
  getUsers() {
    return this.data.users;
  }
  getUserById(id) {
    return this.data.users.find((u) => u.id === id);
  }
  saveUser(user) {
    const idx = this.data.users.findIndex((u) => u.id === user.id);
    if (idx >= 0) {
      this.data.users[idx] = user;
    } else {
      this.data.users.push(user);
    }
    this.saveData(this.data);
    return user;
  }
  // Products
  getProducts() {
    return this.data.products.map((p) => ({
      ...p,
      sku: p.sku || p.product_sku || p.productSku || p.code || ""
    }));
  }
  getProductById(id) {
    const p = this.data.products.find((prod) => prod.id === id);
    if (!p) return void 0;
    return {
      ...p,
      sku: p.sku || p.product_sku || p.productSku || p.code || ""
    };
  }
  saveProduct(product) {
    const sku = product.sku || product.product_sku || product.productSku || "";
    const cleanProduct = {
      ...product,
      sku,
      product_sku: sku
    };
    const idx = this.data.products.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      this.data.products[idx] = { ...this.data.products[idx], ...cleanProduct };
    } else {
      this.data.products.push(cleanProduct);
    }
    this.saveData(this.data);
    return this.data.products[idx >= 0 ? idx : this.data.products.length - 1];
  }
  deleteProduct(id) {
    const initialLen = this.data.products.length;
    this.data.products = this.data.products.filter((p) => p.id !== id);
    if (this.data.products.length !== initialLen) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }
  // Retailers
  getRetailers() {
    return this.data.retailers;
  }
  getRetailerById(id) {
    return this.data.retailers.find((r) => r.id === id);
  }
  saveRetailer(retailer) {
    const idx = this.data.retailers.findIndex((r) => r.id === retailer.id);
    if (idx >= 0) {
      this.data.retailers[idx] = retailer;
    } else {
      this.data.retailers.push(retailer);
    }
    this.saveData(this.data);
    return retailer;
  }
  deleteRetailer(id) {
    const retailer = this.data.retailers.find((r) => r.id === id);
    if (retailer) {
      retailer.status = "inactive";
      retailer.isActive = false;
      retailer.is_active = false;
      this.saveData(this.data);
      return true;
    }
    return false;
  }
  updateRetailerOutstanding(id, delta) {
    const retailer = this.getRetailerById(id);
    if (retailer) {
      retailer.currentOutstanding = Math.max(0, retailer.currentOutstanding + delta);
      if (retailer.currentOutstanding > retailer.creditLimit) {
        retailer.status = "overdue";
      } else if (retailer.status === "overdue" && retailer.currentOutstanding <= retailer.creditLimit) {
        retailer.status = "active";
      }
      this.saveRetailer(retailer);
    }
  }
  // Salesmen
  getSalesmen() {
    return this.data.salesmen;
  }
  getSalesmanById(id) {
    return this.data.salesmen.find((s) => s.id === id);
  }
  saveSalesman(salesman) {
    const idx = this.data.salesmen.findIndex((s) => s.id === salesman.id);
    if (idx >= 0) {
      this.data.salesmen[idx] = salesman;
    } else {
      this.data.salesmen.push(salesman);
    }
    this.saveData(this.data);
    return salesman;
  }
  deleteSalesman(id) {
    const initLen = this.data.salesmen.length;
    this.data.salesmen = this.data.salesmen.filter((s) => s.id !== id);
    if (this.data.salesmen.length !== initLen) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }
  // Orders
  getOrders() {
    return (this.data.orders || []).filter((o) => Boolean(o && o.id && o.id !== "null" && o.id !== "undefined"));
  }
  getOrderById(id) {
    if (!id || id === "null" || id === "undefined") return void 0;
    return this.data.orders.find((o) => o.id === id);
  }
  deleteOrder(id) {
    if (!id || id === "null" || id === "undefined") return false;
    const initLen = this.data.orders.length;
    this.data.orders = this.data.orders.filter((o) => o.id !== id);
    if (this.data.orders.length !== initLen) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }
  saveOrder(order) {
    if (!order.id || order.id === "null" || order.id === "undefined") {
      order.id = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    }
    const idx = this.data.orders.findIndex((o) => o.id === order.id);
    const isNew = idx < 0;
    if (idx >= 0) {
      this.data.orders[idx] = order;
    } else {
      this.data.orders.push(order);
    }
    if (isNew && order.status !== "cancelled" && order.status !== "draft") {
      this.deductInventoryForOrder(order);
      if (order.outstandingAmount > 0) {
        this.updateRetailerOutstanding(order.retailerId, order.outstandingAmount);
      }
    }
    this.saveData(this.data);
    return order;
  }
  updateOrderStatus(orderId, status, extraDetails) {
    const order = this.getOrderById(orderId);
    if (!order) return void 0;
    const previousStatus = order.status;
    order.status = status;
    if (extraDetails) {
      Object.assign(order, extraDetails);
    }
    if (status === "delivered" && !order.deliveredAt) {
      order.deliveredAt = (/* @__PURE__ */ new Date()).toISOString();
    }
    if (previousStatus === "draft" && status === "booked") {
      this.deductInventoryForOrder(order);
      this.updateRetailerOutstanding(order.retailerId, order.outstandingAmount);
    }
    this.saveData(this.data);
    return order;
  }
  deductInventoryForOrder(order) {
    order.items.forEach((item) => {
      const product = this.getProductById(item.productId);
      if (product) {
        product.currentStockCases = Math.max(0, product.currentStockCases - item.cases);
        product.currentStockLoosePcs = Math.max(0, product.currentStockLoosePcs - item.loosePcs);
        this.data.inventoryLogs.push({
          id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          type: "outward_dispatch",
          productId: product.id,
          productName: product.name,
          sku: product.sku,
          batchNumber: product.batches[0]?.batchNumber || "DEFAULT",
          cases: item.cases,
          loosePcs: item.loosePcs,
          referenceId: order.orderNumber,
          date: (/* @__PURE__ */ new Date()).toISOString(),
          performedBy: order.salesmanName || "System",
          reason: `Order ${order.orderNumber} for ${order.retailerName}`
        });
        this.saveProduct(product);
      }
    });
  }
  // Deliveries
  getDeliveries() {
    return this.data.deliveries;
  }
  saveDelivery(delivery) {
    const idx = this.data.deliveries.findIndex((d) => d.id === delivery.id);
    if (idx >= 0) {
      this.data.deliveries[idx] = delivery;
    } else {
      this.data.deliveries.push(delivery);
    }
    this.saveData(this.data);
    return delivery;
  }
  // Payments
  getPayments() {
    return this.data.payments;
  }
  recordPayment(payment) {
    this.data.payments.unshift(payment);
    this.updateRetailerOutstanding(payment.retailerId, -payment.amount);
    if (payment.orderId) {
      const order = this.getOrderById(payment.orderId);
      if (order) {
        order.amountPaid += payment.amount;
        order.outstandingAmount = Math.max(0, order.grandTotal - order.amountPaid);
        if (order.outstandingAmount <= 0) {
          order.paymentStatus = "paid";
        } else if (order.amountPaid > 0) {
          order.paymentStatus = "partial";
        }
        this.saveOrder(order);
      }
    }
    this.saveData(this.data);
    return payment;
  }
  // Inventory Logs & Inwards
  getInventoryLogs() {
    return this.data.inventoryLogs;
  }
  logInventoryMovement(movement) {
    this.data.inventoryLogs.unshift(movement);
    const product = this.getProductById(movement.productId);
    if (product) {
      if (movement.type === "inward" || movement.type === "return_inward") {
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
  getBanners() {
    if (!Array.isArray(this.data.banners) || this.data.banners.length === 0) {
      this.data.banners = [...INITIAL_BANNERS];
      this.saveData(this.data);
    }
    return this.data.banners;
  }
  saveBanner(banner) {
    if (!Array.isArray(this.data.banners)) {
      this.data.banners = [...INITIAL_BANNERS];
    }
    const idx = this.data.banners.findIndex((b) => b.id === banner.id);
    if (idx >= 0) {
      this.data.banners[idx] = banner;
    } else {
      this.data.banners.unshift(banner);
    }
    this.saveData(this.data);
    return banner;
  }
  deleteBanner(id) {
    if (!Array.isArray(this.data.banners)) {
      return false;
    }
    const lenBefore = this.data.banners.length;
    this.data.banners = this.data.banners.filter((b) => b.id !== id);
    if (this.data.banners.length !== lenBefore) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }
  // App Version & APK Distribution Configuration
  getAppVersionConfig() {
    try {
      const vPath = import_path.default.join(process.cwd(), "public", "download", "version.json");
      if (import_fs.default.existsSync(vPath)) {
        const parsed = JSON.parse(import_fs.default.readFileSync(vPath, "utf-8"));
        this.data.appVersionConfig = {
          version: parsed.version || "1.3.2",
          versionCode: Number(parsed.versionCode) || 132,
          downloadUrl: parsed.downloadUrl || "/download/aryan-agency-app.apk",
          apkUrl: parsed.apkUrl || parsed.downloadUrl || "/download/aryan-agency-app.apk",
          updatedAt: parsed.updatedAt || (/* @__PURE__ */ new Date()).toISOString(),
          releaseNotes: parsed.releaseNotes || "Aryan Agency v1.3.2: \u092C\u093E\u0930\u0915\u094B\u0921 \u0938\u094D\u0915\u0948\u0928\u0930 \u0914\u0930 \u0911\u091F\u094B-\u092B\u093F\u0932",
          fileSize: parsed.fileSize || "8.2 MB",
          minAndroidVersion: parsed.minAndroidVersion || "Android 8.0+"
        };
        return this.data.appVersionConfig;
      }
    } catch (e) {
      console.warn("[db] Failed to load version.json fallback:", e);
    }
    if (!this.data.appVersionConfig) {
      this.data.appVersionConfig = {
        version: "1.3.2",
        versionCode: 132,
        downloadUrl: "/download/aryan-agency-app.apk",
        apkUrl: "/download/aryan-agency-app.apk",
        updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
        releaseNotes: "Aryan Agency Retailer & Distributor App v1.3.2",
        fileSize: "8.2 MB",
        minAndroidVersion: "Android 8.0+"
      };
    }
    return this.data.appVersionConfig;
  }
  saveAppVersionConfig(config) {
    const current = this.getAppVersionConfig();
    this.data.appVersionConfig = {
      ...current,
      ...config,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.saveData(this.data);
    try {
      const paths = [
        import_path.default.join(process.cwd(), "public", "download", "version.json"),
        import_path.default.join(process.cwd(), "dist", "download", "version.json")
      ];
      for (const p of paths) {
        const dir = import_path.default.dirname(p);
        if (!import_fs.default.existsSync(dir)) import_fs.default.mkdirSync(dir, { recursive: true });
        import_fs.default.writeFileSync(p, JSON.stringify(this.data.appVersionConfig, null, 2), "utf-8");
      }
    } catch (e) {
      console.warn("[db] Could not sync version.json file:", e);
    }
    return this.data.appVersionConfig;
  }
};
var db = new Database();

// server/gemini.ts
var import_genai = require("@google/genai");
var aiInstance = null;
function getAI() {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error("GEMINI_API_KEY environment variable is missing");
    }
    aiInstance = new import_genai.GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}
async function generateContentWithFallback(contents, config) {
  const ai = getAI();
  const candidateModels = [
    "gemini-3.8-flash",
    "gemini-3.1-flash-lite",
    "gemini-flash-latest"
  ];
  let lastError = null;
  for (const model of candidateModels) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents,
        config
      });
      return response;
    } catch (err) {
      lastError = err;
      const isOverloaded = err?.status === 503 || err?.status === 429 || err?.code === 503 || err?.code === 429 || err?.message?.includes("503") || err?.message?.includes("429") || err?.message?.includes("high demand") || err?.message?.includes("UNAVAILABLE") || err?.message?.includes("RESOURCE_EXHAUSTED");
      if (isOverloaded) {
        console.warn(`[Gemini AI] Model ${model} is experiencing temporary high demand (503/429). Trying fallback model...`);
        continue;
      }
      console.warn(`[Gemini AI] Model ${model} returned error:`, err?.message || err);
    }
  }
  throw lastError;
}
async function lookupOpenFoodFacts(barcode) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(barcode)}.json`, {
      headers: {
        "User-Agent": "AryanAgencyFMCG/1.0 (info@aryanagency.in)"
      },
      signal: controller.signal
    });
    clearTimeout(timeout);
    if (!res.ok) return null;
    const data = await res.json();
    if (data && data.status === 1 && data.product) {
      const p = data.product;
      const name = p.product_name || p.product_name_en || p.generic_name;
      if (!name) return null;
      const brand = p.brands ? p.brands.split(",")[0].trim() : "General FMCG";
      const imageUrl = p.image_front_url || p.image_url || "";
      const packSize = p.quantity || "";
      let category = "Biscuits & Bakery";
      const catStr = ((p.categories || "") + " " + (p.categories_tags || []).join(" ") + " " + name).toLowerCase();
      if (catStr.includes("biscuit") || catStr.includes("cookie") || catStr.includes("bakery") || catStr.includes("cake") || catStr.includes("rusk")) {
        category = "Biscuits & Bakery";
      } else if (catStr.includes("beverage") || catStr.includes("tea") || catStr.includes("coffee") || catStr.includes("juice") || catStr.includes("drink") || catStr.includes("soda")) {
        category = "Beverages";
      } else if (catStr.includes("snack") || catStr.includes("noodle") || catStr.includes("namkeen") || catStr.includes("chips") || catStr.includes("wafer")) {
        category = "Snacks & Namkeen";
      } else if (catStr.includes("spice") || catStr.includes("masala") || catStr.includes("flour") || catStr.includes("atta") || catStr.includes("oil") || catStr.includes("rice") || catStr.includes("staple")) {
        category = "Spices & Staples";
      } else if (catStr.includes("soap") || catStr.includes("shampoo") || catStr.includes("paste") || catStr.includes("cream") || catStr.includes("personal")) {
        category = "Personal Care";
      } else if (catStr.includes("chocolate") || catStr.includes("sweet") || catStr.includes("candy") || catStr.includes("confectionery")) {
        category = "Confectionery & Chocolates";
      } else if (catStr.includes("milk") || catStr.includes("butter") || catStr.includes("cheese") || catStr.includes("ghee") || catStr.includes("paneer") || catStr.includes("dairy")) {
        category = "Dairy & Refrigerated";
      } else if (catStr.includes("detergent") || catStr.includes("cleaner") || catStr.includes("wash") || catStr.includes("hygiene") || catStr.includes("household")) {
        category = "Household & Hygiene";
      }
      return {
        name,
        brand,
        category,
        packSize,
        imageUrl,
        sku: `${brand.toUpperCase().replace(/[^A-Z0-9]/g, "")}-${barcode.slice(-4)}`
      };
    }
  } catch (e) {
  }
  return null;
}
async function parseNaturalLanguageOrder(orderText) {
  const products = db.getProducts();
  const retailers = db.getRetailers();
  const productCatalogPrompt = products.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    brand: p.brand,
    piecesPerCase: p.piecesPerCase,
    casePrice: p.casePrice,
    wholesalePricePiece: p.wholesalePricePiece,
    gstRate: p.gstRate,
    hsnCode: p.hsnCode,
    stockCases: p.currentStockCases,
    activeScheme: p.activeScheme ? p.activeScheme.title : null
  }));
  const retailerPrompt = retailers.map((r) => ({
    id: r.id,
    name: r.storeName,
    owner: r.ownerName,
    area: r.area,
    beat: r.beatName
  }));
  const prompt = `You are the AI Order Assistant for Aryan Agency (an FMCG distribution company in India).
Convert the following free-form retailer/salesman voice transcript or WhatsApp text order into a structured JSON order.

### Product Catalog:
${JSON.stringify(productCatalogPrompt, null, 2)}

### Retailers:
${JSON.stringify(retailerPrompt, null, 2)}

### Order Text/Voice input:
"${orderText}"

Match mentioned retailer (if any) and products (fuzzy match Hindi/Hinglish terms like 'peti' = cases, 'packet'/'piece' = loosePcs).
Return ONLY a valid JSON object with the following structure:
{
  "retailerId": "matched retailer id or null",
  "retailerName": "matched store name or null",
  "notes": "any special instructions",
  "items": [
    {
      "productId": "matched_product_id",
      "productName": "product name",
      "cases": number,
      "loosePcs": number,
      "confidence": number between 0 and 1,
      "matchedReason": "why matched"
    }
  ],
  "unmatchedItems": [ "any text items you could not match" ]
}`;
  try {
    const response = await generateContentWithFallback(prompt, {
      responseMimeType: "application/json"
    });
    const text = response.text || "{}";
    return JSON.parse(text);
  } catch (err) {
    console.error("Gemini order parsing error:", err);
    return fallbackOrderParser(orderText, products, retailers);
  }
}
function fallbackOrderParser(text, products, retailers) {
  const lower = text.toLowerCase();
  const matchedRetailer = retailers.find(
    (r) => lower.includes(r.name.toLowerCase()) || lower.includes(r.owner.toLowerCase()) || lower.includes(r.area.toLowerCase())
  );
  const items = [];
  products.forEach((p) => {
    const brandName = p.brand.toLowerCase();
    const prodName = p.name.toLowerCase();
    const sku = p.sku.toLowerCase();
    if (lower.includes(brandName) || lower.includes(prodName.split(" ")[0]) || lower.includes(sku)) {
      const match = lower.match(new RegExp(`(\\d+)\\s*(?:cases|case|peti|box|boxes)?\\s*(?:of)?\\s*${p.brand.toLowerCase()}`, "i")) || lower.match(new RegExp(`(\\d+)\\s*${p.name.split(" ")[0].toLowerCase()}`, "i"));
      const cases = match ? parseInt(match[1], 10) : 2;
      items.push({
        productId: p.id,
        productName: p.name,
        cases: cases || 2,
        loosePcs: 0,
        confidence: 0.85,
        matchedReason: `Matched brand ${p.brand}`
      });
    }
  });
  return {
    retailerId: matchedRetailer?.id || null,
    retailerName: matchedRetailer?.storeName || null,
    notes: "Generated via smart parser",
    items: items.length > 0 ? items : [
      {
        productId: products[0].id,
        productName: products[0].name,
        cases: 5,
        loosePcs: 0,
        confidence: 0.9,
        matchedReason: "Top reorder item"
      }
    ],
    unmatchedItems: []
  };
}
async function generateFMCGInsights() {
  const products = db.getProducts();
  const orders = db.getOrders();
  const retailers = db.getRetailers();
  const lowStock = products.filter((p) => p.currentStockCases <= p.reorderLevelCases);
  const overdueRetailers = retailers.filter((r) => r.status === "overdue" || r.currentOutstanding > r.creditLimit);
  const prompt = `You are an expert FMCG Supply Chain & Distribution Consultant advising 'Aryan Agency'.
Here is the current distributor state:
- Total Products: ${products.length}
- Low Stock SKUs: ${JSON.stringify(lowStock.map((p) => ({ name: p.name, stock: p.currentStockCases, reorderLevel: p.reorderLevelCases })))}
- Recent Orders Count: ${orders.length}
- Overdue Retailers: ${JSON.stringify(overdueRetailers.map((r) => ({ name: r.storeName, outstanding: r.currentOutstanding, limit: r.creditLimit })))}

Provide 3 to 4 actionable, highly realistic FMCG recommendations covering:
1. Urgent inventory re-ordering with expected stock-out risks.
2. Trade Scheme optimization to boost high-margin categories (like Biscuits or Personal Care).
3. Retailer credit collection strategy for overdue kirana accounts.
4. Salesman beat push recommendations for this week.

Return ONLY a JSON array of recommendation objects with:
[
  {
    "category": "Inventory" | "Schemes" | "Credit Risk" | "Beat Sales",
    "title": "Short title",
    "severity": "high" | "medium" | "low",
    "insight": "Clear detailed insight",
    "actionText": "Actionable step for Aryan Sharma"
  }
]`;
  try {
    const response = await generateContentWithFallback(prompt, {
      responseMimeType: "application/json"
    });
    return JSON.parse(response.text || "[]");
  } catch (err) {
    console.error("Gemini insights error:", err);
    return [
      {
        category: "Inventory",
        title: "Immediate Reorder Alert: Amul Butter & Maggi",
        severity: "high",
        insight: "Amul Pasteurised Butter (500g) has only 18 cases remaining vs 15 reorder buffer. With upcoming weekend demand from Indiranagar beat, stock will deplete in 48 hours.",
        actionText: "Raise Purchase Order to Amul C&F depot for 40 cases immediately."
      },
      {
        category: "Credit Risk",
        title: "Credit Limit Breach at Balaji Daily Needs & Jai Hind",
        severity: "high",
        insight: "Balaji Daily Needs has \u20B959,200 outstanding against \u20B960,000 credit limit (98.6% utilized). Jai Hind Traders has breached limit with \u20B982,000 dues.",
        actionText: "Instruct Salesman Vikram Singh to collect minimum 50% via UPI before dispatching next indent."
      },
      {
        category: "Schemes",
        title: "Run Monsoon Bumper Scheme on Biscuits",
        severity: "medium",
        insight: "Parle-G and Good Day stock levels are healthy at 147 combined cases. Bundling +6 loose packs on 5+ cases will accelerate beat volume by 22%.",
        actionText: "Broadcast scheme flyer on WhatsApp to all registered retailers."
      },
      {
        category: "Beat Sales",
        title: "Whitefield Beat Expansion Potential",
        severity: "medium",
        insight: "Sri Sai Ram Mart has zero overdue balance and \u20B91.5L credit headroom. High demand observed for Household & Cleaning products like Surf Excel.",
        actionText: "Assign Salesman Karthik to upsell 20+ cases of Detergents and Soaps."
      }
    ];
  }
}
var VERIFIED_FMCG_BARCODES = {
  "8901063012345": {
    name: "Parle-G Glucose Biscuit (80g)",
    brand: "Parle",
    category: "Biscuits & Bakery",
    subCategory: "Glucose Biscuits",
    packSize: "80g",
    unit: "g",
    mrp: 10,
    manufacturer: "Parle Products Pvt. Ltd.",
    hsnCode: "19053100",
    gstRate: 18,
    sku: "PARLE-G-80G",
    piecesPerCase: 60,
    wholesalePricePiece: 8.4,
    imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80"
  },
  "8901063012346": {
    name: "Parle-G Gold Biscuits (1kg)",
    brand: "Parle",
    category: "Biscuits & Bakery",
    subCategory: "Glucose Biscuits",
    packSize: "1kg",
    unit: "kg",
    mrp: 140,
    manufacturer: "Parle Products Pvt. Ltd.",
    hsnCode: "19053100",
    gstRate: 18,
    sku: "PARLE-GOLD-1KG",
    piecesPerCase: 12,
    wholesalePricePiece: 118,
    imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80"
  },
  "8901030383742": {
    name: "Britannia Good Day Butter Cookies (100g)",
    brand: "Britannia",
    category: "Biscuits & Bakery",
    subCategory: "Cookies",
    packSize: "100g",
    unit: "g",
    mrp: 20,
    manufacturer: "Britannia Industries Ltd.",
    hsnCode: "19053100",
    gstRate: 18,
    sku: "BRIT-GD-BUTTER-100G",
    piecesPerCase: 48,
    wholesalePricePiece: 16.8,
    imageUrl: "https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600&auto=format&fit=crop&q=80"
  },
  "8901030705571": {
    name: "Britannia Marie Gold Biscuits (250g)",
    brand: "Britannia",
    category: "Biscuits & Bakery",
    subCategory: "Tea Biscuits",
    packSize: "250g",
    unit: "g",
    mrp: 35,
    manufacturer: "Britannia Industries Ltd.",
    hsnCode: "19053100",
    gstRate: 18,
    sku: "BRIT-MARIE-250G",
    piecesPerCase: 24,
    wholesalePricePiece: 29.5,
    imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80"
  },
  "8901725181223": {
    name: "Sunfeast Mom\u2019s Magic Rich Butter Cookies (150g)",
    brand: "ITC Sunfeast",
    category: "Biscuits & Bakery",
    subCategory: "Cookies",
    packSize: "150g",
    unit: "g",
    mrp: 30,
    manufacturer: "ITC Limited",
    hsnCode: "19053100",
    gstRate: 18,
    sku: "ITC-SUNFEAST-MOM-CHOC",
    piecesPerCase: 36,
    wholesalePricePiece: 24.6,
    imageUrl: "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80"
  },
  "8901058852331": {
    name: "Nestl\xE9 Maggi 2-Minute Masala Noodles (70g)",
    brand: "Nestl\xE9",
    category: "Snacks & Instant Food",
    subCategory: "Instant Noodles",
    packSize: "70g",
    unit: "g",
    mrp: 14,
    manufacturer: "Nestl\xE9 India Limited",
    hsnCode: "19023010",
    gstRate: 12,
    sku: "NESTLE-MAGGI-70G",
    piecesPerCase: 96,
    wholesalePricePiece: 12.2,
    imageUrl: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80"
  },
  "8901058852734": {
    name: "Nestl\xE9 Maggi Masala Noodles (280g Pack of 4)",
    brand: "Nestl\xE9",
    category: "Snacks & Instant Food",
    subCategory: "Instant Noodles",
    packSize: "280g",
    unit: "g",
    mrp: 56,
    manufacturer: "Nestl\xE9 India Limited",
    hsnCode: "19023010",
    gstRate: 12,
    sku: "MAGGI-MASALA-280G",
    piecesPerCase: 24,
    wholesalePricePiece: 48.5,
    imageUrl: "https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80"
  },
  "8901233024567": {
    name: "Cadbury Dairy Milk Silk Chocolate (60g)",
    brand: "Cadbury",
    category: "Confectionery & Sweets",
    subCategory: "Chocolates",
    packSize: "60g",
    unit: "g",
    mrp: 80,
    manufacturer: "Mondelez India Foods Pvt. Ltd.",
    hsnCode: "18063200",
    gstRate: 18,
    sku: "CADBURY-DM-SILK-60G",
    piecesPerCase: 40,
    wholesalePricePiece: 69.6,
    imageUrl: "https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80"
  },
  "8901052002134": {
    name: "Tata Tea Gold Premium Black Tea (500g)",
    brand: "Tata Tea",
    category: "Beverages",
    subCategory: "Tea",
    packSize: "500g",
    unit: "g",
    mrp: 310,
    manufacturer: "Tata Consumer Products Ltd.",
    hsnCode: "09024020",
    gstRate: 5,
    sku: "TATA-TEA-GOLD-500G",
    piecesPerCase: 20,
    wholesalePricePiece: 279,
    imageUrl: "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80"
  },
  "8901262010011": {
    name: "Amul Taaza Homogenised Toned Milk (1L)",
    brand: "Amul",
    category: "Dairy & Refrigerated",
    subCategory: "Milk",
    packSize: "1L",
    unit: "L",
    mrp: 74,
    manufacturer: "Gujarat Co-operative Milk Marketing Federation (GCMMF)",
    hsnCode: "04012000",
    gstRate: 5,
    sku: "AMUL-TAAZA-1L",
    piecesPerCase: 12,
    wholesalePricePiece: 69.5,
    imageUrl: "https://images.unsplash.com/photo-1550583724-b2692b85b150?w=600&auto=format&fit=crop&q=80"
  },
  "8901207010032": {
    name: "Dabur Red Ayurvedic Toothpaste (200g)",
    brand: "Dabur",
    category: "Personal Care",
    subCategory: "Oral Care",
    packSize: "200g",
    unit: "g",
    mrp: 110,
    manufacturer: "Dabur India Limited",
    hsnCode: "33061020",
    gstRate: 18,
    sku: "DABUR-RED-PASTE-200G",
    piecesPerCase: 36,
    wholesalePricePiece: 94.5,
    imageUrl: "https://images.unsplash.com/photo-1559563458-527698bf5295?w=600&auto=format&fit=crop&q=80"
  },
  "8901786010045": {
    name: "Everest Garam Masala (100g)",
    brand: "Everest",
    category: "Spices & Staples",
    subCategory: "Blended Spices",
    packSize: "100g",
    unit: "g",
    mrp: 92,
    manufacturer: "S. Narendrakumar & Co.",
    hsnCode: "09109100",
    gstRate: 5,
    sku: "EVEREST-GARAM-MASALA-100G",
    piecesPerCase: 30,
    wholesalePricePiece: 81,
    imageUrl: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80"
  },
  "8904063200118": {
    name: "Haldiram\u2019s Nagpur Aloo Bhujia (400g)",
    brand: "Haldiram\u2019s",
    category: "Snacks & Namkeen",
    subCategory: "Namkeen",
    packSize: "400g",
    unit: "g",
    mrp: 120,
    manufacturer: "Haldiram Foods International Pvt. Ltd.",
    hsnCode: "21069099",
    gstRate: 12,
    sku: "HALDIRAMS-BHUJIA-400G",
    piecesPerCase: 20,
    wholesalePricePiece: 104,
    imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80"
  }
};
async function lookupProductByBarcode(barcode) {
  const cleanCode = (barcode || "").trim().replace(/[^0-9A-Za-z_-]/g, "");
  if (!cleanCode) {
    return { found: false, source: "none", barcode };
  }
  const products = db.getProducts();
  const existingInDb = products.find(
    (p) => p.barcode === cleanCode || p.barcode_number === cleanCode || p.sku?.toLowerCase() === cleanCode.toLowerCase()
  );
  if (existingInDb) {
    return {
      found: true,
      source: "database",
      barcode: cleanCode,
      name: existingInDb.name,
      brand: existingInDb.brand,
      category: existingInDb.category,
      hsnCode: existingInDb.hsnCode,
      gstRate: existingInDb.gstRate,
      mrp: existingInDb.mrpPiece,
      piecesPerCase: existingInDb.piecesPerCase,
      wholesalePricePiece: existingInDb.wholesalePricePiece,
      sku: existingInDb.sku,
      imageUrl: existingInDb.imageUrl
    };
  }
  if (VERIFIED_FMCG_BARCODES[cleanCode]) {
    const verified = VERIFIED_FMCG_BARCODES[cleanCode];
    return {
      found: true,
      source: "catalog",
      barcode: cleanCode,
      ...verified
    };
  }
  try {
    const offProduct = await lookupOpenFoodFacts(cleanCode);
    if (offProduct && offProduct.name) {
      return {
        found: true,
        source: "catalog",
        barcode: cleanCode,
        name: offProduct.name,
        brand: offProduct.brand || "General FMCG",
        category: offProduct.category || "Biscuits & Bakery",
        packSize: offProduct.packSize || "",
        sku: offProduct.sku || cleanCode,
        imageUrl: offProduct.imageUrl || "",
        piecesPerCase: 24,
        mrp: 20,
        wholesalePricePiece: 17,
        hsnCode: "19053100",
        gstRate: 18
      };
    }
  } catch (e) {
  }
  try {
    const prompt = `You are a real Indian FMCG barcode/GTIN database identifier for wholesale kirana distribution.
Target barcode/GTIN/EAN: "${cleanCode}".

Rules:
1. ONLY identify the product if "${cleanCode}" is a genuine, officially known FMCG retail barcode or standard EAN in India (e.g. Parle, Britannia, ITC, Nestl\xE9, Amul, HUL, Dabur, Haldirams, Everest, Tata, PepsiCo, Coca-Cola).
2. DO NOT GUESS OR FABRICATE FAKE DATA. If you are not 100% sure of the exact real product for this barcode, return {"found": false}.
3. Category MUST be one of: "Biscuits & Bakery", "Beverages", "Spices & Staples", "Personal Care", "Dairy & Refrigerated", "Confectionery & Chocolates", "Snacks & Namkeen", "Household & Hygiene", "Baby Care".
4. Do NOT generate fake image URLs. If you know a verified official image URL, provide it; otherwise leave imageUrl as "".

If verified real product, return JSON:
{
  "found": true,
  "name": "Exact official product name (e.g. Parle-G Gluco Biscuits 80g)",
  "brand": "Brand name",
  "category": "One of allowed categories",
  "subCategory": "Sub-category name",
  "packSize": "e.g. 80g, 500ml, 1kg",
  "unit": "g | kg | ml | L | pcs",
  "mrp": numeric MRP in INR (e.g. 10 or 20),
  "manufacturer": "Company name",
  "hsnCode": "Official Indian GST HSN code (e.g. 19053100)",
  "gstRate": numeric GST rate (0, 5, 12, 18, 28),
  "sku": "UPPERCASE-HYPHENATED-SKU",
  "imageUrl": ""
}

If not found or uncertain:
{
  "found": false
}`;
    const response = await generateContentWithFallback(prompt, {
      responseMimeType: "application/json"
    });
    const parsed = JSON.parse(response.text || "{}");
    if (parsed && parsed.found && parsed.name) {
      return {
        found: true,
        source: "gemini",
        barcode: cleanCode,
        name: parsed.name,
        brand: parsed.brand || "General FMCG",
        category: parsed.category || "Biscuits & Bakery",
        subCategory: parsed.subCategory || "",
        packSize: parsed.packSize || "",
        unit: parsed.unit || "",
        mrp: Number(parsed.mrp) || 0,
        manufacturer: parsed.manufacturer || "",
        hsnCode: parsed.hsnCode || "19053100",
        gstRate: Number(parsed.gstRate) || 18,
        sku: parsed.sku || cleanCode,
        imageUrl: parsed.imageUrl || "",
        piecesPerCase: Number(parsed.piecesPerCase) || 24,
        wholesalePricePiece: Number(parsed.wholesalePricePiece) || (parsed.mrp ? Math.round(parsed.mrp * 0.85 * 100) / 100 : 0)
      };
    }
  } catch (err) {
    console.warn(`[Barcode lookup] AI models busy or offline, barcode ${cleanCode} ready for manual input.`);
  }
  return {
    found: false,
    source: "none",
    barcode: cleanCode
  };
}

// server.ts
import_dotenv.default.config();
var app = (0, import_express.default)();
var PORT = 3e3;
app.use(import_express.default.json({ limit: "50mb" }));
app.use(import_express.default.urlencoded({ extended: true, limit: "50mb" }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Id, X-User-Role, Accept, Cache-Control");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});
var rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_PROJECT_URL || process.env.SUPABASE_URL || "";
var rawSupabaseKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_KEY || "";
var isKeyValid = Boolean(
  rawSupabaseKey && !rawSupabaseKey.includes("placeholder") && !rawSupabaseKey.startsWith("AIza") && !rawSupabaseKey.startsWith("AQ.") && (rawSupabaseKey.startsWith("sb_publishable_") || rawSupabaseKey.startsWith("eyJ"))
);
var isSupabaseReady = Boolean(
  rawSupabaseUrl && isKeyValid && !rawSupabaseUrl.includes("placeholder") && rawSupabaseUrl.startsWith("http")
);
var supabaseServer = isSupabaseReady ? (0, import_supabase_js.createClient)(rawSupabaseUrl, rawSupabaseKey) : null;
var currentActiveUserId = "usr_admin";
async function authenticateRequest(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
    const headerUserId = req.headers["x-user-id"];
    let authenticatedUser = null;
    if (token && supabaseServer) {
      try {
        const { data: { user }, error } = await supabaseServer.auth.getUser(token);
        if (!error && user) {
          const users = db.getUsers();
          authenticatedUser = users.find(
            (u) => user.email && u.email.toLowerCase() === user.email.toLowerCase() || u.id === user.id
          );
          if (!authenticatedUser) {
            let authoritativeRole = "retailer";
            try {
              if (supabaseServer) {
                const { data: dbUser } = await supabaseServer.from("users").select("role").eq("id", user.id).maybeSingle();
                if (dbUser && dbUser.role) {
                  authoritativeRole = dbUser.role;
                }
              }
            } catch (dbErr) {
              console.warn("Supabase DB role lookup error:", dbErr);
            }
            authenticatedUser = {
              id: user.id,
              name: user.user_metadata?.name || user.email?.split("@")[0] || "User",
              email: user.email || "",
              phone: user.user_metadata?.phone || "+91 98000 00000",
              role: authoritativeRole
            };
          }
        }
      } catch (tokenErr) {
        console.warn("Supabase token verification error:", tokenErr);
      }
    }
    if (!authenticatedUser && headerUserId) {
      const users = db.getUsers();
      authenticatedUser = users.find((u) => u.id === headerUserId) || null;
      if (!authenticatedUser) {
        const headerRole = req.headers["x-user-role"];
        const validRoles = ["admin", "salesman", "accounts", "delivery", "retailer"];
        const assignedRole = headerRole && validRoles.includes(headerRole) ? headerRole : "admin";
        authenticatedUser = {
          id: headerUserId,
          name: req.headers["x-user-name"] || "Authorized User",
          email: req.headers["x-user-email"] || "",
          role: assignedRole
        };
      }
    }
    if (!authenticatedUser) {
      const headerRole = req.headers["x-user-role"];
      const validRoles = ["admin", "salesman", "accounts", "delivery", "retailer"];
      if (headerRole && validRoles.includes(headerRole)) {
        const users = db.getUsers();
        authenticatedUser = users.find((u) => u.role === headerRole) || {
          id: `usr_${headerRole}`,
          name: `${headerRole.toUpperCase()} User`,
          email: `${headerRole}@aryanagency.in`,
          role: headerRole
        };
      } else {
        const users = db.getUsers();
        authenticatedUser = users.find((u) => u.id === currentActiveUserId) || users[0] || {
          id: "usr_admin",
          name: "Aryan Agency Admin",
          email: "admin@aryanagency.in",
          role: "admin"
        };
      }
    }
    req.user = authenticatedUser;
    req.userRole = authenticatedUser ? authenticatedUser.role : "admin";
    next();
  } catch (err) {
    console.error("Authentication middleware error:", err);
    next();
  }
}
app.use(authenticateRequest);
function requireRoles(allowedRoles) {
  return (req, res, next) => {
    const role = req.userRole;
    if (!role || role === "anon") {
      return res.status(401).json({
        error: "Authentication Required: Please sign in to Aryan Agency FMCG Distribution portal."
      });
    }
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({
        error: `Forbidden: Access restricted. Your assigned account role '${role.toUpperCase()}' does not have permission for this operation. Authorized roles: ${allowedRoles.map((r) => r.toUpperCase()).join(", ")}.`
      });
    }
    next();
  };
}
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", app: "Aryan Agency FMCG Distribution" });
});
app.get("/api/supabase-status", (req, res) => {
  let projectRef = "";
  try {
    if (rawSupabaseUrl) {
      const parsed = new URL(rawSupabaseUrl);
      projectRef = parsed.hostname.split(".")[0] || "";
    }
  } catch {
  }
  const keyType = !rawSupabaseKey ? "missing" : rawSupabaseKey.startsWith("sb_publishable_") ? "publishable" : rawSupabaseKey.startsWith("eyJ") ? "anon_jwt" : rawSupabaseKey.startsWith("AQ.") || rawSupabaseKey.startsWith("AIza") ? "google_gemini_key_detected" : "invalid";
  res.json({
    isConfigured: isSupabaseReady,
    projectUrlConfigured: Boolean(rawSupabaseUrl),
    projectUrl: rawSupabaseUrl || null,
    projectRef: projectRef || null,
    keyConfigured: Boolean(rawSupabaseKey),
    keyType,
    isValidKeyFormat: isKeyValid
  });
});
app.get("/api/auth/users", (req, res) => {
  const users = db.getUsers();
  res.json(users);
});
app.get("/api/auth/current", (req, res) => {
  const users = db.getUsers();
  const user = req.user || users.find((u) => u.id === currentActiveUserId) || users[0];
  res.json(user);
});
app.post("/api/auth/switch", (req, res) => {
  const { userId } = req.body;
  if (req.userRole !== "admin") {
    return res.status(403).json({
      error: `Forbidden: Role escalation blocked. Role '${req.userRole?.toUpperCase()}' cannot switch accounts or roles. Only Owner/Admin is authorized.`
    });
  }
  const users = db.getUsers();
  const found = users.find((u) => u.id === userId);
  if (found) {
    currentActiveUserId = found.id;
    return res.json({ success: true, user: found });
  }
  res.status(404).json({ error: "User not found" });
});
var handleUpdateUserRole = (req, res) => {
  const targetUserId = req.params.id;
  const { role: newRole } = req.body;
  const validRoles = ["admin", "salesman", "delivery", "accounts", "retailer"];
  if (!validRoles.includes(newRole)) {
    return res.status(400).json({
      error: `Invalid operational role: '${newRole}'. Permitted roles: ${validRoles.join(", ")}`
    });
  }
  const users = db.getUsers();
  const targetUser = users.find((u) => u.id === targetUserId);
  if (!targetUser) {
    return res.status(404).json({ error: "User account not found in system database" });
  }
  targetUser.role = newRole;
  db.saveUser(targetUser);
  if (supabaseServer) {
    Promise.resolve(
      supabaseServer.from("users").update({ role: newRole, updated_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("id", targetUserId)
    ).then(({ error }) => {
      if (error) console.warn("[Supabase Role Sync Warning]:", error.message);
    }).catch((e) => console.warn("[Supabase Role Sync Error]:", e));
  }
  res.json({ success: true, user: targetUser });
};
app.put("/api/auth/users/:id/role", requireRoles(["admin"]), handleUpdateUserRole);
app.put("/api/users/:id/role", requireRoles(["admin"]), handleUpdateUserRole);
app.put("/api/auth/profile", (req, res) => {
  const headerUserId = req.headers["x-user-id"];
  const headerUserRole = req.headers["x-user-role"];
  const currentUserId = req.user?.id || headerUserId || currentActiveUserId;
  const users = db.getUsers();
  const {
    id: bodyId,
    name,
    email,
    phone,
    avatarUrl,
    businessName,
    businessLogoUrl,
    address,
    city,
    state,
    pincode,
    gstin,
    panNumber,
    locationCoordinates,
    role
  } = req.body;
  let user = users.find(
    (u) => u.id === currentUserId || bodyId && u.id === bodyId || email && u.email && u.email.toLowerCase() === email.trim().toLowerCase() || phone && u.phone && u.phone.trim() === phone.trim()
  );
  if (!user) {
    const assignedId = currentUserId || bodyId || `usr_${Date.now()}`;
    const userRole = role || headerUserRole || req.userRole || "retailer";
    user = {
      id: assignedId,
      name: (name || "Retailer Partner").trim(),
      email: (email || `${assignedId}@retailer.aryanagency.in`).trim().toLowerCase(),
      phone: (phone || "+91 98000 00000").trim(),
      role: userRole,
      avatarUrl: avatarUrl || void 0,
      businessName: businessName || void 0,
      businessLogoUrl: businessLogoUrl || void 0,
      address: address || void 0,
      city: city || "Bengaluru",
      state: state || "Karnataka",
      pincode: pincode || "560022",
      gstin: gstin ? gstin.trim().toUpperCase() : void 0,
      panNumber: panNumber ? panNumber.trim().toUpperCase() : void 0,
      locationCoordinates: locationCoordinates || void 0,
      verificationStatus: "pending"
    };
  } else {
    if (name !== void 0) user.name = name.trim();
    if (email !== void 0) user.email = email.trim().toLowerCase();
    if (phone !== void 0) user.phone = phone.trim();
    if (avatarUrl !== void 0) user.avatarUrl = avatarUrl;
    if (businessName !== void 0) user.businessName = businessName;
    if (businessLogoUrl !== void 0) user.businessLogoUrl = businessLogoUrl;
    if (address !== void 0) user.address = address;
    if (city !== void 0) user.city = city;
    if (state !== void 0) user.state = state;
    if (pincode !== void 0) user.pincode = pincode;
    if (gstin !== void 0) user.gstin = gstin.trim().toUpperCase();
    if (panNumber !== void 0) user.panNumber = panNumber.trim().toUpperCase();
    if (locationCoordinates !== void 0) user.locationCoordinates = locationCoordinates;
  }
  if (user.retailerId || user.role === "retailer") {
    const retailerId = user.retailerId || user.id;
    const existingRetailer = db.getRetailerById(retailerId) || db.getRetailers().find(
      (r) => user.phone && r.phone === user.phone || user.email && r.email === user.email || bodyId && r.id === bodyId
    );
    if (existingRetailer) {
      if (businessName) existingRetailer.storeName = businessName;
      if (name) existingRetailer.ownerName = name;
      if (phone) existingRetailer.phone = phone;
      if (email) existingRetailer.email = email;
      if (address) existingRetailer.address = address;
      if (gstin) existingRetailer.gstin = gstin;
      if (panNumber) existingRetailer.panNumber = panNumber;
      if (businessLogoUrl) existingRetailer.logoUrl = businessLogoUrl;
      if (avatarUrl) existingRetailer.photoUrl = avatarUrl;
      if (locationCoordinates?.lat && locationCoordinates?.lng) {
        existingRetailer.lat = locationCoordinates.lat;
        existingRetailer.lng = locationCoordinates.lng;
      }
      db.saveRetailer(existingRetailer);
    }
  }
  db.saveUser(user);
  if (supabaseServer) {
    Promise.resolve(
      supabaseServer.from("users").update({
        name: user.name,
        phone: user.phone,
        avatar_url: user.avatarUrl,
        updated_at: (/* @__PURE__ */ new Date()).toISOString()
      }).eq("id", user.id)
    ).catch((e) => console.warn("[Supabase Profile Sync Warning]:", e));
  }
  res.json({ success: true, user });
});
app.put("/api/retailers/:id/verify", requireRoles(["admin"]), (req, res) => {
  const retailerId = req.params.id;
  const { status, remarks } = req.body;
  if (!["pending", "verified", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Invalid verification status. Must be 'pending', 'verified', or 'rejected'." });
  }
  const retailer = db.getRetailerById(retailerId);
  if (!retailer) {
    return res.status(404).json({ error: "Retailer not found" });
  }
  retailer.verificationStatus = status;
  retailer.verificationRemarks = remarks || "";
  retailer.verifiedAt = status === "verified" ? (/* @__PURE__ */ new Date()).toISOString() : void 0;
  retailer.verifiedBy = status === "verified" ? req.user?.name || "Admin" : void 0;
  db.saveRetailer(retailer);
  const users = db.getUsers();
  const linkedUser = users.find((u) => u.retailerId === retailer.id || u.phone === retailer.phone || retailer.email && u.email === retailer.email);
  if (linkedUser) {
    linkedUser.verificationStatus = status;
    linkedUser.verificationRemarks = remarks || "";
    linkedUser.verifiedAt = retailer.verifiedAt;
    linkedUser.verifiedBy = retailer.verifiedBy;
    db.saveUser(linkedUser);
  }
  res.json({ success: true, retailer, message: `Retailer verification status updated to ${status.toUpperCase()}` });
});
app.get("/api/products", (req, res) => {
  const products = db.getProducts().map((p) => ({
    ...p,
    sku: p.sku || p.product_sku || p.productSku || ""
  }));
  res.json(products);
});
app.get("/api/products/lookup/:barcode", async (req, res) => {
  const barcode = req.params.barcode;
  if (!barcode) {
    return res.status(400).json({ found: false, message: "Barcode is required" });
  }
  try {
    const result = await lookupProductByBarcode(barcode);
    res.json(result);
  } catch (err) {
    console.warn("Barcode lookup notice:", err?.message || err);
    res.json({ found: false, source: "none", barcode, message: "Could not fetch external details; please enter manually." });
  }
});
app.post("/api/products", requireRoles(["admin"]), (req, res) => {
  const newProduct = req.body;
  if (!newProduct.id) {
    newProduct.id = `prd_${Date.now()}`;
  }
  newProduct.sku = newProduct.sku || newProduct.product_sku || newProduct.productSku || "";
  if (!newProduct.casePrice) {
    newProduct.casePrice = Number(newProduct.wholesalePricePiece) * Number(newProduct.piecesPerCase);
  }
  const saved = db.saveProduct(newProduct);
  res.json(saved);
});
app.put("/api/products/:id", requireRoles(["admin"]), (req, res) => {
  const id = req.params.id;
  const existing = db.getProductById(id);
  const updated = existing ? { ...existing, ...req.body, id } : {
    id,
    name: req.body.name || "Unnamed Product",
    brand: req.body.brand || "General FMCG",
    category: req.body.category || "General",
    sku: req.body.sku || req.body.product_sku || req.body.productSku || "",
    product_sku: req.body.sku || req.body.product_sku || req.body.productSku || "",
    hsnCode: req.body.hsnCode || "1905",
    piecesPerCase: Number(req.body.piecesPerCase) || 24,
    wholesalePricePiece: Number(req.body.wholesalePricePiece) || 0,
    casePrice: Number(req.body.casePrice) || Number(req.body.wholesalePricePiece || 0) * (Number(req.body.piecesPerCase) || 24),
    mrpPiece: Number(req.body.mrpPiece) || 0,
    gstRate: Number(req.body.gstRate) || 18,
    currentStockCases: Number(req.body.currentStockCases) || 0,
    currentStockLoosePcs: Number(req.body.currentStockLoosePcs) || 0,
    reorderLevelCases: Number(req.body.reorderLevelCases) || 10,
    primaryWarehouseBin: req.body.primaryWarehouseBin || "BAY-A1",
    imageUrl: req.body.imageUrl || "",
    activeScheme: req.body.activeScheme || null,
    batches: req.body.batches || [],
    packingOptions: req.body.packingOptions || [],
    ...req.body
  };
  updated.sku = req.body.sku || req.body.product_sku || req.body.productSku || (existing ? existing.sku : "") || updated.sku || "";
  updated.product_sku = updated.sku;
  if (updated.wholesalePricePiece && updated.piecesPerCase) {
    updated.casePrice = Number(updated.wholesalePricePiece) * Number(updated.piecesPerCase);
  }
  const saved = db.saveProduct(updated);
  res.json(saved || updated);
});
app.delete("/api/products/:id", requireRoles(["admin"]), (req, res) => {
  const id = req.params.id;
  const deleted = db.deleteProduct(id);
  res.json({ success: deleted });
});
app.get("/api/retailers", (req, res) => {
  const retailers = db.getRetailers();
  res.json(retailers);
});
app.post("/api/retailers", requireRoles(["admin", "salesman", "accounts"]), (req, res) => {
  const newRetailer = req.body;
  const storeName = newRetailer.storeName?.trim();
  if (!storeName) {
    return res.status(400).json({ error: "Retail Outlet / Store Name is required." });
  }
  const ownerName = newRetailer.ownerName?.trim();
  if (!ownerName) {
    return res.status(400).json({ error: "Owner / Proprietor Name is required." });
  }
  const rawPhone = newRetailer.phone?.trim() || "";
  const digitsOnlyPhone = rawPhone.replace(/\D/g, "");
  if (!digitsOnlyPhone || digitsOnlyPhone.length < 10) {
    return res.status(400).json({ error: "A valid 10-digit mobile phone number is required for retailer order and payment tracking." });
  }
  const address = newRetailer.address?.trim();
  if (!address) {
    return res.status(400).json({ error: "Shop address is required for delivery routing." });
  }
  const existingRetailers = db.getRetailers();
  const targetSuffix = digitsOnlyPhone.slice(-10);
  const phoneDuplicate = existingRetailers.find((r) => {
    if (newRetailer.id && r.id === newRetailer.id) return false;
    const existingDigits = (r.phone || "").replace(/\D/g, "");
    return existingDigits.endsWith(targetSuffix);
  });
  if (phoneDuplicate) {
    return res.status(400).json({
      error: `A retailer outlet with phone ${rawPhone} already exists (${phoneDuplicate.storeName}). Please verify the phone number or edit the existing outlet.`
    });
  }
  const gstin = newRetailer.gstin?.trim().toUpperCase() || "";
  if (gstin && gstin.length >= 15) {
    const gstinDuplicate = existingRetailers.find((r) => {
      if (newRetailer.id && r.id === newRetailer.id) return false;
      return (r.gstin || "").trim().toUpperCase() === gstin;
    });
    if (gstinDuplicate) {
      return res.status(400).json({
        error: `A retailer outlet with GSTIN ${gstin} already exists (${gstinDuplicate.storeName}). Each GSTIN must be uniquely registered.`
      });
    }
  }
  if (!newRetailer.id) {
    newRetailer.id = `ret_${Date.now()}`;
  }
  newRetailer.storeName = storeName;
  newRetailer.ownerName = ownerName;
  newRetailer.phone = rawPhone.startsWith("+91") ? rawPhone : `+91 ${rawPhone}`;
  newRetailer.address = address;
  newRetailer.area = newRetailer.area?.trim() || "Indiranagar";
  newRetailer.beatName = newRetailer.beatName?.trim() || "Indiranagar Retail Beat";
  newRetailer.gstin = gstin;
  newRetailer.panNumber = newRetailer.panNumber?.trim().toUpperCase() || "";
  newRetailer.creditLimit = Number(newRetailer.creditLimit) >= 0 ? Number(newRetailer.creditLimit) : 5e4;
  newRetailer.currentOutstanding = Number(newRetailer.currentOutstanding) || 0;
  newRetailer.creditDaysAllowed = Number(newRetailer.creditDaysAllowed) || 14;
  newRetailer.creditEnabled = newRetailer.creditEnabled !== void 0 ? Boolean(newRetailer.creditEnabled) : false;
  newRetailer.status = newRetailer.status || "active";
  newRetailer.createdAt = newRetailer.createdAt || (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
  const saved = db.saveRetailer(newRetailer);
  res.json(saved);
});
app.put("/api/retailers/:id", requireRoles(["admin", "salesman", "accounts"]), (req, res) => {
  const id = req.params.id;
  const existing = db.getRetailerById(id);
  if (!existing) {
    return res.status(404).json({ error: "Retailer not found" });
  }
  const isPrivilegedCreditAdmin = req.userRole === "admin" || req.userRole === "accounts";
  const rawPhone = req.body.phone !== void 0 ? req.body.phone?.trim() : existing.phone;
  if (rawPhone) {
    const digitsOnlyPhone = rawPhone.replace(/\D/g, "");
    if (digitsOnlyPhone.length < 10) {
      return res.status(400).json({ error: "A valid 10-digit mobile phone number is required." });
    }
    const targetSuffix = digitsOnlyPhone.slice(-10);
    const existingRetailers = db.getRetailers();
    const phoneDuplicate = existingRetailers.find((r) => {
      if (r.id === id) return false;
      const existingDigits = (r.phone || "").replace(/\D/g, "");
      return existingDigits.endsWith(targetSuffix);
    });
    if (phoneDuplicate) {
      return res.status(400).json({
        error: `A retailer outlet with phone ${rawPhone} already exists (${phoneDuplicate.storeName}).`
      });
    }
  }
  const updated = {
    ...existing,
    ...req.body,
    id,
    creditEnabled: isPrivilegedCreditAdmin ? req.body.creditEnabled !== void 0 ? Boolean(req.body.creditEnabled) : existing.creditEnabled : existing.creditEnabled,
    creditLimit: isPrivilegedCreditAdmin ? req.body.creditLimit !== void 0 ? Number(req.body.creditLimit) : existing.creditLimit : existing.creditLimit,
    creditDaysAllowed: isPrivilegedCreditAdmin ? req.body.creditDaysAllowed !== void 0 ? Number(req.body.creditDaysAllowed) : existing.creditDaysAllowed : existing.creditDaysAllowed
  };
  db.saveRetailer(updated);
  res.json(updated);
});
app.delete("/api/retailers/:id", requireRoles(["admin"]), (req, res) => {
  const id = req.params.id;
  const success = db.deleteRetailer(id);
  if (!success) {
    return res.status(404).json({ error: "Retailer not found" });
  }
  res.json({ success: true, message: "Retailer successfully marked inactive in Active Master List" });
});
app.get("/api/retailers/:id/ledger", (req, res) => {
  const retailerId = req.params.id;
  const retailer = db.getRetailerById(retailerId);
  if (!retailer) {
    return res.status(404).json({ error: "Retailer not found" });
  }
  const orders = db.getOrders().filter((o) => o.retailerId === retailerId);
  const payments = db.getPayments().filter((p) => p.retailerId === retailerId);
  const entries = [];
  orders.forEach((o) => {
    entries.push({
      id: `led_ord_${o.id}`,
      date: o.orderDate,
      type: "invoice",
      referenceNumber: o.orderNumber,
      description: `Tax Invoice - ${o.items.length} FMCG line items (${o.status})`,
      debit: o.grandTotal,
      credit: 0
    });
  });
  payments.forEach((p) => {
    entries.push({
      id: `led_pay_${p.id}`,
      date: p.paymentDate,
      type: "payment",
      referenceNumber: p.receiptNumber,
      description: `Payment Received via ${p.paymentMode.toUpperCase()} (${p.collectorName || "Direct"})`,
      debit: 0,
      credit: p.amount
    });
  });
  entries.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  let runningBalance = 0;
  const calculatedEntries = entries.map((e) => {
    runningBalance += e.debit - e.credit;
    return {
      ...e,
      runningBalance
    };
  });
  res.json({
    retailer,
    entries: calculatedEntries,
    finalBalance: retailer.currentOutstanding
  });
});
app.get("/api/salesmen", requireRoles(["admin", "salesman", "accounts", "delivery"]), (req, res) => {
  const salesmen = db.getSalesmen();
  res.json(salesmen);
});
app.post("/api/salesmen", requireRoles(["admin"]), (req, res) => {
  const newSalesman = req.body;
  if (!newSalesman.id) {
    newSalesman.id = `slm_${Date.now()}`;
  }
  const saved = db.saveSalesman(newSalesman);
  res.json(saved);
});
app.put("/api/salesmen/:id", requireRoles(["admin"]), (req, res) => {
  const id = req.params.id;
  const salesmen = db.getSalesmen();
  const existing = salesmen.find((s) => s.id === id);
  if (!existing) {
    return res.status(404).json({ error: "Salesman not found" });
  }
  const updated = { ...existing, ...req.body, id };
  db.saveSalesman(updated);
  res.json(updated);
});
app.delete("/api/salesmen/:id", requireRoles(["admin"]), (req, res) => {
  const id = req.params.id;
  const success = db.deleteSalesman(id);
  res.json({ success });
});
app.get("/api/orders", (req, res) => {
  const orders = db.getOrders();
  res.json(orders);
});
app.get("/api/orders/:id", (req, res) => {
  const orderId = req.params.id;
  if (!orderId || orderId === "null" || orderId === "undefined") {
    return res.status(400).json({ error: "Invalid order ID: orders.id cannot be null" });
  }
  const order = db.getOrderById(orderId);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json(order);
});
app.post("/api/orders", requireRoles(["admin", "salesman", "accounts", "retailer"]), (req, res) => {
  const rawOrder = req.body;
  const orderId = rawOrder.id && rawOrder.id !== "null" && rawOrder.id !== "undefined" ? rawOrder.id : `ord_${Date.now()}`;
  const orderNum = rawOrder.orderNumber || `ORD-2026-${Math.floor(1e3 + Math.random() * 9e3)}`;
  const retailer = db.getRetailerById(rawOrder.retailerId);
  const products = db.getProducts();
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTaxable = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalTax = 0;
  const rawItems = Array.isArray(rawOrder.items) ? rawOrder.items : [];
  const calculatedItems = rawItems.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    const piecesPerCase = product?.piecesPerCase || 24;
    const cases = Number(item.cases) || 0;
    const loosePcs = Number(item.loosePcs) || 0;
    const totalPieces = cases * piecesPerCase + loosePcs;
    const unitPrice = Number(item.unitPrice || product?.wholesalePricePiece || 10);
    const grossAmount = totalPieces * unitPrice;
    let discountAmount = Number(item.discountAmount) || 0;
    let freePcsAwarded = 0;
    let schemeApplied = item.schemeApplied || void 0;
    if (product?.activeScheme && product.activeScheme.isActive) {
      const scheme = product.activeScheme;
      if (cases >= scheme.minQtyCases) {
        if (scheme.freeQtyPcs) {
          freePcsAwarded = Math.floor(cases / scheme.minQtyCases) * scheme.freeQtyPcs;
          schemeApplied = `${scheme.title} (+${freePcsAwarded} Pcs Free)`;
        }
        if (scheme.discountPercentage) {
          discountAmount = grossAmount * scheme.discountPercentage / 100;
          schemeApplied = `${scheme.title} (${scheme.discountPercentage}% Off)`;
        }
        if (scheme.discountFlatRs) {
          discountAmount = cases * scheme.discountFlatRs;
          schemeApplied = `${scheme.title} (\u20B9${scheme.discountFlatRs} off/case)`;
        }
      }
    }
    const netGross = Math.max(0, grossAmount - discountAmount);
    const gstRate = Number(item.gstRate || product?.gstRate || 18);
    const taxableAmount = +(netGross / (1 + gstRate / 100)).toFixed(2);
    const taxAmount = +(netGross - taxableAmount).toFixed(2);
    const halfTax = +(taxAmount / 2).toFixed(2);
    subtotal += grossAmount;
    totalDiscount += discountAmount;
    totalTaxable += taxableAmount;
    totalCgst += halfTax;
    totalSgst += halfTax;
    totalTax += taxAmount;
    return {
      productId: item.productId,
      sku: product?.sku || item.sku || "SKU-GEN",
      productName: product?.name || item.productName || "Product",
      brand: product?.brand || item.brand || "General",
      category: product?.category || "Biscuits & Bakery",
      hsnCode: product?.hsnCode || "19053100",
      gstRate,
      cases,
      loosePcs,
      totalPieces,
      unitPrice,
      grossAmount: +grossAmount.toFixed(2),
      discountAmount: +discountAmount.toFixed(2),
      taxableAmount,
      cgstAmount: halfTax,
      sgstAmount: halfTax,
      igstAmount: 0,
      totalAmount: +netGross.toFixed(2),
      schemeApplied,
      freePcsAwarded
    };
  });
  const grandTotal = Math.round(subtotal - totalDiscount);
  const roundOff = +(grandTotal - (subtotal - totalDiscount)).toFixed(2);
  const amountPaid = Number(rawOrder.amountPaid) || 0;
  const outstandingAmount = Math.max(0, grandTotal - amountPaid);
  const paymentStatus = outstandingAmount === 0 ? "paid" : amountPaid > 0 ? "partial" : "unpaid";
  const order = {
    id: orderId,
    orderNumber: orderNum,
    retailerId: rawOrder.retailerId,
    retailerName: retailer?.storeName || rawOrder.retailerName || "Retail Store",
    retailerPhone: retailer?.phone || rawOrder.retailerPhone || "",
    retailerAddress: retailer?.address || rawOrder.retailerAddress || "",
    retailerGstin: retailer?.gstin,
    beatName: retailer?.beatName || rawOrder.beatName || "Daily Beat",
    salesmanId: rawOrder.salesmanId,
    salesmanName: rawOrder.salesmanName,
    orderDate: (/* @__PURE__ */ new Date()).toISOString(),
    expectedDeliveryDate: rawOrder.expectedDeliveryDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    items: calculatedItems,
    subtotal: +subtotal.toFixed(2),
    totalDiscount: +totalDiscount.toFixed(2),
    totalTaxable: +totalTaxable.toFixed(2),
    totalCgst: +totalCgst.toFixed(2),
    totalSgst: +totalSgst.toFixed(2),
    totalTax: +totalTax.toFixed(2),
    roundOff,
    grandTotal,
    amountPaid,
    outstandingAmount,
    status: rawOrder.status || "booked",
    paymentStatus,
    notes: rawOrder.notes
  };
  const saved = db.saveOrder(order);
  if (amountPaid > 0) {
    db.recordPayment({
      id: `pay_${Date.now()}`,
      receiptNumber: `RCP-2026-${Math.floor(100 + Math.random() * 900)}`,
      retailerId: order.retailerId,
      retailerName: order.retailerName,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount: amountPaid,
      paymentMode: rawOrder.paymentMode || "cash",
      paymentDate: (/* @__PURE__ */ new Date()).toISOString(),
      collectedByRole: "salesman",
      collectorName: order.salesmanName || "Salesman",
      status: "confirmed",
      notes: "Collected at order booking"
    });
  }
  res.json(saved);
});
app.put("/api/orders/:id/status", requireRoles(["admin", "salesman", "delivery", "accounts"]), (req, res) => {
  const orderId = req.params.id;
  if (!orderId || orderId === "null" || orderId === "undefined") {
    return res.status(400).json({ error: "Invalid order ID: orders.id cannot be null" });
  }
  const { status, driverName, vehicleNumber, podReceiverName, podNotes, podSignature } = req.body;
  const updated = db.updateOrderStatus(orderId, status, {
    driverName,
    vehicleNumber,
    podReceiverName,
    podNotes,
    podSignature
  });
  if (!updated) {
    return res.status(404).json({ error: "Order not found" });
  }
  res.json(updated);
});
app.delete("/api/orders/:id", requireRoles(["admin"]), (req, res) => {
  const id = req.params.id;
  if (!id || id === "null" || id === "undefined") {
    return res.status(400).json({ error: "Invalid order ID: orders.id cannot be null" });
  }
  const success = db.deleteOrder(id);
  res.json({ success });
});
app.get("/api/deliveries", requireRoles(["admin", "delivery", "salesman", "accounts"]), (req, res) => {
  const deliveries = db.getDeliveries();
  res.json(deliveries);
});
app.post("/api/deliveries", requireRoles(["admin"]), (req, res) => {
  const raw = req.body;
  const deliveryId = `del_run_${Date.now()}`;
  const runNumber = `RUN-2026-${Math.floor(100 + Math.random() * 900)}`;
  const orders = db.getOrders().filter((o) => (raw.orderIds || []).includes(o.id));
  const totalValue = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const delivery = {
    id: deliveryId,
    runNumber,
    date: raw.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
    driverName: raw.driverName || "Suresh Gowda",
    driverPhone: raw.driverPhone || "+91 97410 78901",
    vehicleNumber: raw.vehicleNumber || "KA-05-AB-1234",
    beatNames: raw.beatNames || ["Indiranagar Retail Beat"],
    totalOrders: orders.length,
    deliveredOrders: 0,
    totalOrderValue: totalValue,
    totalCashCollected: 0,
    totalUpiCollected: 0,
    status: "out_for_delivery",
    orderIds: raw.orderIds || []
  };
  orders.forEach((o) => {
    db.updateOrderStatus(o.id, "dispatched", {
      deliveryRunId: delivery.id,
      driverName: delivery.driverName,
      vehicleNumber: delivery.vehicleNumber
    });
  });
  const saved = db.saveDelivery(delivery);
  res.json(saved);
});
app.put("/api/deliveries/:id/dispatch", requireRoles(["admin"]), (req, res) => {
  const deliveryId = req.params.id;
  const deliveries = db.getDeliveries();
  const delivery = deliveries.find((d) => d.id === deliveryId);
  if (!delivery) {
    return res.status(404).json({ error: "Delivery run sheet not found" });
  }
  delivery.status = "out_for_delivery";
  db.saveDelivery(delivery);
  res.json({ success: true, delivery });
});
app.put("/api/deliveries/:id/pod", requireRoles(["admin", "delivery"]), (req, res) => {
  const deliveryId = req.params.id;
  const { orderId, receiverName, podNotes, paymentCollected, paymentMode, podSignature } = req.body;
  const order = db.getOrderById(orderId);
  if (!order) {
    return res.status(404).json({ error: "Order not found" });
  }
  db.updateOrderStatus(orderId, "delivered", {
    podReceiverName: receiverName,
    podNotes,
    podSignature,
    deliveredAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  const amount = Number(paymentCollected) || 0;
  if (amount > 0) {
    db.recordPayment({
      id: `pay_${Date.now()}`,
      receiptNumber: `RCP-2026-${Math.floor(100 + Math.random() * 900)}`,
      retailerId: order.retailerId,
      retailerName: order.retailerName,
      orderId: order.id,
      orderNumber: order.orderNumber,
      amount,
      paymentMode: paymentMode || "upi",
      transactionRef: paymentMode === "upi" ? `UPI/${Date.now().toString().slice(-8)}` : "CASH-SPOT",
      paymentDate: (/* @__PURE__ */ new Date()).toISOString(),
      collectedByRole: "delivery",
      collectorName: order.driverName || "Delivery Driver",
      status: "confirmed",
      notes: `Spot POD collection for ${order.orderNumber}`
    });
  }
  const delivery = db.getDeliveries().find((d) => d.id === deliveryId);
  if (delivery) {
    delivery.deliveredOrders += 1;
    if (paymentMode === "cash") {
      delivery.totalCashCollected += amount;
    } else if (paymentMode === "upi") {
      delivery.totalUpiCollected += amount;
    }
    if (delivery.deliveredOrders >= delivery.totalOrders) {
      delivery.status = "completed";
    }
    db.saveDelivery(delivery);
  }
  res.json({ success: true, order: db.getOrderById(orderId) });
});
app.get("/api/payments", (req, res) => {
  const payments = db.getPayments();
  res.json(payments);
});
app.post("/api/payments", (req, res) => {
  const raw = req.body;
  const payment = {
    id: `pay_${Date.now()}`,
    receiptNumber: `RCP-2026-${Math.floor(100 + Math.random() * 900)}`,
    retailerId: raw.retailerId,
    retailerName: raw.retailerName,
    orderId: raw.orderId,
    orderNumber: raw.orderNumber,
    amount: Number(raw.amount) || 0,
    paymentMode: raw.paymentMode || "upi",
    transactionRef: raw.transactionRef || `REF-${Date.now().toString().slice(-6)}`,
    paymentDate: raw.paymentDate || (/* @__PURE__ */ new Date()).toISOString(),
    collectedByRole: raw.collectedByRole || "admin",
    collectorName: raw.collectorName || "Aryan Sharma",
    status: raw.status || "confirmed",
    notes: raw.notes
  };
  const saved = db.recordPayment(payment);
  res.json(saved);
});
app.get("/api/inventory", requireRoles(["admin", "salesman", "delivery", "accounts"]), (req, res) => {
  const logs = db.getInventoryLogs();
  const products = db.getProducts();
  res.json({ logs, products });
});
app.post("/api/inventory/inward", requireRoles(["admin"]), (req, res) => {
  const { productId, batchNumber, mfgDate, expiryDate, cases, loosePcs, supplierInvoice, reason } = req.body;
  const product = db.getProductById(productId);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  let batch = product.batches.find((b) => b.batchNumber === batchNumber);
  if (batch) {
    batch.stockCases += Number(cases) || 0;
    batch.stockLoosePcs += Number(loosePcs) || 0;
  } else {
    product.batches.push({
      batchNumber,
      mfgDate: mfgDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
      expiryDate: expiryDate || "2027-06-30",
      stockCases: Number(cases) || 0,
      stockLoosePcs: Number(loosePcs) || 0,
      warehouseBin: "BAY-NEW"
    });
  }
  const movement = db.logInventoryMovement({
    id: `inv_in_${Date.now()}`,
    type: "inward",
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    batchNumber,
    cases: Number(cases) || 0,
    loosePcs: Number(loosePcs) || 0,
    referenceId: supplierInvoice || `INW-${Date.now().toString().slice(-4)}`,
    date: (/* @__PURE__ */ new Date()).toISOString(),
    performedBy: "Aryan Sharma (Distributor)",
    reason: reason || "PO Factory Replenishment"
  });
  res.json({ success: true, movement, product: db.getProductById(productId) });
});
app.post("/api/inventory/outward", requireRoles(["admin"]), (req, res) => {
  const { productId, batchNumber, cases, loosePcs, reason, type, referenceId } = req.body;
  const product = db.getProductById(productId);
  if (!product) {
    return res.status(404).json({ error: "Product not found" });
  }
  const casesToDeduct = Number(cases) || 0;
  const looseToDeduct = Number(loosePcs) || 0;
  if (batchNumber && product.batches) {
    const batch = product.batches.find((b) => b.batchNumber === batchNumber);
    if (batch) {
      batch.stockCases = Math.max(0, batch.stockCases - casesToDeduct);
      batch.stockLoosePcs = Math.max(0, batch.stockLoosePcs - looseToDeduct);
    }
  }
  const movement = db.logInventoryMovement({
    id: `inv_out_${Date.now()}`,
    type: type || "damage_adjustment",
    productId: product.id,
    productName: product.name,
    sku: product.sku,
    batchNumber: batchNumber || product.batches[0]?.batchNumber || "GENERAL",
    cases: casesToDeduct,
    loosePcs: looseToDeduct,
    referenceId: referenceId || `ADJ-${Date.now().toString().slice(-4)}`,
    date: (/* @__PURE__ */ new Date()).toISOString(),
    performedBy: "Aryan Sharma (Distributor)",
    reason: reason || "Inventory stock-out / adjustment"
  });
  res.json({ success: true, movement, product: db.getProductById(productId) });
});
app.get("/api/analytics", (req, res) => {
  const products = db.getProducts();
  const orders = db.getOrders();
  const retailers = db.getRetailers();
  const payments = db.getPayments();
  const salesmen = db.getSalesmen();
  const totalProducts = products.length;
  const totalStockValue = products.reduce((sum, p) => sum + p.currentStockCases * p.casePrice, 0);
  const lowStockCount = products.filter((p) => p.currentStockCases <= p.reorderLevelCases).length;
  const totalOutstanding = retailers.reduce((sum, r) => sum + r.currentOutstanding, 0);
  const overdueRetailers = retailers.filter((r) => r.status === "overdue" || r.currentOutstanding > r.creditLimit);
  const totalOrderValue = orders.reduce((sum, o) => sum + o.grandTotal, 0);
  const todayOrders = orders.filter((o) => o.orderDate.startsWith((/* @__PURE__ */ new Date()).toISOString().split("T")[0]));
  const todaySales = todayOrders.reduce((sum, o) => sum + o.grandTotal, 0);
  const totalPaymentsCollected = payments.reduce((sum, p) => sum + p.amount, 0);
  const todayPayments = payments.filter((p) => p.paymentDate.startsWith((/* @__PURE__ */ new Date()).toISOString().split("T")[0]));
  const todayCollected = todayPayments.reduce((sum, p) => sum + p.amount, 0);
  res.json({
    summary: {
      todaySales,
      todayOrdersCount: todayOrders.length,
      totalOrdersCount: orders.length,
      totalOrderValue,
      totalStockValue,
      totalOutstanding,
      totalPaymentsCollected,
      todayCollected,
      lowStockCount,
      overdueRetailersCount: overdueRetailers.length,
      activeRetailersCount: retailers.length,
      salesmenCount: salesmen.length
    },
    topSalesmen: salesmen.map((s) => ({
      name: s.name,
      beats: s.assignedBeats.join(", "),
      monthlyTarget: s.monthlyTargetAmount,
      achieved: s.currentMonthAchieved,
      pct: Math.round(s.currentMonthAchieved / s.monthlyTargetAmount * 100),
      todayOrders: s.todayOrdersCount,
      todaySales: s.todaySalesAmount
    })),
    topProducts: products.slice(0, 5).map((p) => ({
      name: p.name,
      brand: p.brand,
      stockCases: p.currentStockCases,
      casePrice: p.casePrice,
      value: p.currentStockCases * p.casePrice
    }))
  });
});
app.get("/api/banners", (req, res) => {
  const banners = db.getBanners();
  res.json(banners);
});
app.post("/api/banners", requireRoles(["admin", "salesman"]), (req, res) => {
  const raw = req.body;
  const newBanner = {
    id: raw.id || `banner_${Date.now()}`,
    title: raw.title || "Special Wholesale Offer",
    subtitle: raw.subtitle || "",
    badgeText: raw.badgeText || "\u0935\u093F\u0936\u0947\u0937 \u0911\u092B\u0930",
    ctaText: raw.ctaText || "",
    targetCategory: raw.targetCategory || "",
    targetBrand: raw.targetBrand || "",
    imageUrl: raw.imageUrl || "https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80",
    bgGradient: raw.bgGradient || "from-[#F6BD27] via-[#F4B218] to-[#E89E0B]",
    accentColor: raw.accentColor || "",
    isActive: raw.isActive !== void 0 ? Boolean(raw.isActive) : true,
    hideTextOverlay: raw.hideTextOverlay !== void 0 ? Boolean(raw.hideTextOverlay) : false,
    posterFit: raw.posterFit || "cover",
    showBuyNow: raw.showBuyNow !== void 0 ? Boolean(raw.showBuyNow) : true,
    buyNowText: raw.buyNowText || "\u0905\u092D\u0940 \u0916\u0930\u0940\u0926\u0947\u0902 (Buy Now)"
  };
  const saved = db.saveBanner(newBanner);
  res.json(saved);
});
app.put("/api/banners/:id", requireRoles(["admin", "salesman"]), (req, res) => {
  const id = req.params.id;
  const banners = db.getBanners();
  const existing = banners.find((b) => b.id === id);
  const updated = existing ? { ...existing, ...req.body, id } : {
    id,
    title: req.body.title || "Special Promotion",
    subtitle: req.body.subtitle || "",
    badgeText: req.body.badgeText || "HOT DEAL",
    bgGradient: req.body.bgGradient || "from-blue-900 via-indigo-900 to-slate-950",
    imageUrl: req.body.imageUrl || "",
    targetCategory: req.body.targetCategory || "Biscuits & Bakery",
    ctaText: req.body.ctaText || "Shop Now",
    isActive: req.body.isActive !== false,
    priority: Number(req.body.priority) || 5,
    hideTextOverlay: !!req.body.hideTextOverlay,
    posterFit: req.body.posterFit || "cover",
    targetBrand: req.body.targetBrand || "",
    showBuyNow: req.body.showBuyNow !== false,
    buyNowText: req.body.buyNowText || "\u0905\u092D\u0940 \u0916\u0930\u0940\u0926\u0947\u0902 (Buy Now)",
    ...req.body
  };
  const saved = db.saveBanner(updated);
  res.json(saved || updated);
});
app.delete("/api/banners/:id", requireRoles(["admin", "salesman"]), (req, res) => {
  const id = req.params.id;
  const success = db.deleteBanner(id);
  res.json({ success });
});
app.post("/api/ai/parse-order", async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: "Text prompt is required" });
  }
  const parsed = await parseNaturalLanguageOrder(text);
  res.json(parsed);
});
app.get("/api/ai/insights", async (req, res) => {
  const insights = await generateFMCGInsights();
  res.json(insights);
});
app.post("/api/db/reset", requireRoles(["admin"]), (req, res) => {
  const data = db.resetToDefault();
  res.json({ success: true, message: "Database reset to default FMCG demo dataset" });
});
var GITHUB_LATEST_APK_URL = "https://github.com/nikhilcsc18-alt/aryan-agency-app/releases/latest/download/aryan-agency-app.apk";
app.get("/download/aryan-agency-app.apk", (req, res) => {
  const possiblePaths = [
    import_path2.default.join(process.cwd(), "public", "download", "aryan-agency-app.apk"),
    import_path2.default.join(process.cwd(), "dist", "download", "aryan-agency-app.apk")
  ];
  const apkPath = possiblePaths.find((p) => import_fs2.default.existsSync(p));
  if (apkPath) {
    const stat = import_fs2.default.statSync(apkPath);
    if (stat.size > 1024 * 1024) {
      res.setHeader("Content-Type", "application/vnd.android.package-archive");
      res.setHeader("Content-Length", stat.size.toString());
      res.setHeader("Content-Disposition", 'attachment; filename="aryan-agency-app.apk"');
      res.setHeader("Cache-Control", "public, max-age=300");
      const readStream = import_fs2.default.createReadStream(apkPath);
      return readStream.pipe(res);
    }
  }
  return res.redirect(302, GITHUB_LATEST_APK_URL);
});
app.get(["/download/version.json", "/api/app/version"], (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.setHeader("Pragma", "no-cache");
  res.setHeader("Expires", "0");
  const versionConfig = db.getAppVersionConfig();
  res.json(versionConfig);
});
app.post("/api/app/version", requireRoles(["admin"]), (req, res) => {
  const updated = db.saveAppVersionConfig(req.body);
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json({ success: true, versionConfig: updated, message: "App version updated on server. All mobile devices will now see this update." });
});
app.all("/api/*", (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
});
app.use((err, req, res, next) => {
  console.error("[API Error]:", err);
  if (res.headersSent) return next(err);
  res.status(err.status || 500).json({ error: err.message || "Internal Server Error" });
});
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await (0, import_vite.createServer)({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path2.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (req, res) => {
      res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
      res.setHeader("Pragma", "no-cache");
      res.setHeader("Expires", "0");
      res.sendFile(import_path2.default.join(distPath, "index.html"));
    });
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Aryan Agency FMCG server running on http://0.0.0.0:${PORT}`);
  });
}
startServer();
//# sourceMappingURL=server.cjs.map
