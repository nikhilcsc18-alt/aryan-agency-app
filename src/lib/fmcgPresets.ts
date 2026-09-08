export interface FMCGPresetProduct {
  name: string;
  brand: string;
  category: string;
  sku: string;
  imageUrl: string;
  mrpPiece: number;
  piecesPerCase: number;
}

export const FMCG_PRODUCT_PRESETS: FMCGPresetProduct[] = [
  {
    name: 'Parle-G Original Gluco Biscuits 800g',
    brand: 'Parle',
    category: 'Biscuits & Bakery',
    sku: 'PARLE-G-800G',
    imageUrl: 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=600&auto=format&fit=crop&q=80',
    mrpPiece: 100,
    piecesPerCase: 12
  },
  {
    name: 'Britannia Good Day Butter Cookies 600g',
    brand: 'Britannia',
    category: 'Biscuits & Bakery',
    sku: 'GDAY-BUTTER-600G',
    imageUrl: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80',
    mrpPiece: 120,
    piecesPerCase: 16
  },
  {
    name: 'Cadbury Dairy Milk Silk Chocolate 150g',
    brand: 'Cadbury',
    category: 'Confectionery & Sweets',
    sku: 'CDM-SILK-150G',
    imageUrl: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80',
    mrpPiece: 175,
    piecesPerCase: 24
  },
  {
    name: 'Nestlé Maggi 2-Minute Masala Noodles 280g',
    brand: 'Nestlé',
    category: 'Snacks & Instant Food',
    sku: 'MAGGI-MASALA-280G',
    imageUrl: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
    mrpPiece: 56,
    piecesPerCase: 24
  },
  {
    name: 'Tata Tea Gold Premium Black Tea 500g',
    brand: 'Tata',
    category: 'Beverages & Tea',
    sku: 'TATA-GOLD-500G',
    imageUrl: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=600&auto=format&fit=crop&q=80',
    mrpPiece: 330,
    piecesPerCase: 20
  },
  {
    name: 'Amul Pure Cow Ghee 1L Tin',
    brand: 'Amul',
    category: 'Dairy & Ghee',
    sku: 'AMUL-GHEE-1L',
    imageUrl: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80',
    mrpPiece: 650,
    piecesPerCase: 12
  },
  {
    name: 'Aashirvaad Superior Sharbati Atta 10kg',
    brand: 'Aashirvaad',
    category: 'Staples & Grains',
    sku: 'AASHIRVAAD-ATTA-10KG',
    imageUrl: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80',
    mrpPiece: 460,
    piecesPerCase: 2
  },
  {
    name: 'Surf Excel Easy Wash Detergent Powder 1kg',
    brand: 'Surf Excel',
    category: 'Personal & Home Care',
    sku: 'SURF-EXCEL-1KG',
    imageUrl: 'https://images.unsplash.com/photo-1584813470613-5b1c1cad3d69?w=600&auto=format&fit=crop&q=80',
    mrpPiece: 145,
    piecesPerCase: 14
  },
  {
    name: 'Colgate MaxFresh Peppermint Gel 150g',
    brand: 'Colgate',
    category: 'Personal & Home Care',
    sku: 'COLGATE-MAX-150G',
    imageUrl: 'https://images.unsplash.com/photo-1559591937-e106093d56d4?w=600&auto=format&fit=crop&q=80',
    mrpPiece: 110,
    piecesPerCase: 36
  },
  {
    name: 'Lay\'s India\'s Magic Masala Chips 50g',
    brand: 'Lay\'s',
    category: 'Snacks & Instant Food',
    sku: 'LAYS-MASALA-50G',
    imageUrl: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80',
    mrpPiece: 20,
    piecesPerCase: 48
  },
  {
    name: 'Dettol Original Antiseptic Bathing Soap 125g',
    brand: 'Dettol',
    category: 'Personal & Home Care',
    sku: 'DETTOL-SOAP-125G',
    imageUrl: 'https://images.unsplash.com/photo-1607006314147-c3b652875185?w=600&auto=format&fit=crop&q=80',
    mrpPiece: 45,
    piecesPerCase: 48
  },
  {
    name: 'Haldiram\'s Nagpur Aloo Bhujia 400g',
    brand: 'Haldiram\'s',
    category: 'Snacks & Instant Food',
    sku: 'HALDIRAM-ALOO-400G',
    imageUrl: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=600&auto=format&fit=crop&q=80',
    mrpPiece: 115,
    piecesPerCase: 20
  },
  {
    name: 'Fortune Sunlite Refined Sunflower Oil 1L',
    brand: 'Fortune',
    category: 'Staples & Grains',
    sku: 'FORTUNE-OIL-1L',
    imageUrl: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80',
    mrpPiece: 165,
    piecesPerCase: 15
  },
  {
    name: 'Dabur 100% Pure Honey Squeezy 500g',
    brand: 'Dabur',
    category: 'Staples & Grains',
    sku: 'DABUR-HONEY-500G',
    imageUrl: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80',
    mrpPiece: 235,
    piecesPerCase: 18
  },
  {
    name: 'Everest Super Garam Masala 100g',
    brand: 'Everest',
    category: 'Staples & Grains',
    sku: 'EVEREST-GARAM-100G',
    imageUrl: 'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=600&auto=format&fit=crop&q=80',
    mrpPiece: 92,
    piecesPerCase: 30
  }
];

/**
 * Utility to compress image files locally in browser via Canvas to WebP/JPEG data URL
 */
export async function compressImageFile(file: File, maxWidth = 800, quality = 0.82): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width);
          width = maxWidth;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(img.src);
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        // Prefer webp if supported, fallback to jpeg
        try {
          const dataUrl = canvas.toDataURL('image/webp', quality);
          resolve(dataUrl);
        } catch {
          const fallbackDataUrl = canvas.toDataURL('image/jpeg', quality);
          resolve(fallbackDataUrl);
        }
      };
      img.onerror = () => reject(new Error('Failed to load selected image'));
    };
    reader.onerror = (err) => reject(err);
  });
}
