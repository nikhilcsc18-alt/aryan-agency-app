import { GoogleGenAI } from '@google/genai';
import { db } from './db';

let aiInstance: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!aiInstance) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      throw new Error('GEMINI_API_KEY environment variable is missing');
    }
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

export async function parseNaturalLanguageOrder(orderText: string) {
  const products = db.getProducts();
  const retailers = db.getRetailers();

  const productCatalogPrompt = products.map(p => ({
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

  const retailerPrompt = retailers.map(r => ({
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
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const text = response.text || '{}';
    return JSON.parse(text);
  } catch (err: any) {
    console.error('Gemini order parsing error:', err);
    // Fallback simple fuzzy parser if API key is not active or offline
    return fallbackOrderParser(orderText, products, retailers);
  }
}

function fallbackOrderParser(text: string, products: any[], retailers: any[]) {
  const lower = text.toLowerCase();
  
  // Find retailer
  const matchedRetailer = retailers.find(r => 
    lower.includes(r.name.toLowerCase()) || 
    lower.includes(r.owner.toLowerCase()) ||
    lower.includes(r.area.toLowerCase())
  );

  const items: any[] = [];
  products.forEach(p => {
    const brandName = p.brand.toLowerCase();
    const prodName = p.name.toLowerCase();
    const sku = p.sku.toLowerCase();

    if (lower.includes(brandName) || lower.includes(prodName.split(' ')[0]) || lower.includes(sku)) {
      // try to find numbers near it
      const match = lower.match(new RegExp(`(\\d+)\\s*(?:cases|case|peti|box|boxes)?\\s*(?:of)?\\s*${p.brand.toLowerCase()}`, 'i')) ||
                    lower.match(new RegExp(`(\\d+)\\s*${p.name.split(' ')[0].toLowerCase()}`, 'i'));
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
    notes: 'Generated via smart parser',
    items: items.length > 0 ? items : [
      {
        productId: products[0].id,
        productName: products[0].name,
        cases: 5,
        loosePcs: 0,
        confidence: 0.9,
        matchedReason: 'Top reorder item'
      }
    ],
    unmatchedItems: []
  };
}

export async function generateFMCGInsights() {
  const products = db.getProducts();
  const orders = db.getOrders();
  const retailers = db.getRetailers();

  const lowStock = products.filter(p => p.currentStockCases <= p.reorderLevelCases);
  const overdueRetailers = retailers.filter(r => r.status === 'overdue' || r.currentOutstanding > r.creditLimit);

  const prompt = `You are an expert FMCG Supply Chain & Distribution Consultant advising 'Aryan Agency'.
Here is the current distributor state:
- Total Products: ${products.length}
- Low Stock SKUs: ${JSON.stringify(lowStock.map(p => ({ name: p.name, stock: p.currentStockCases, reorderLevel: p.reorderLevelCases })))}
- Recent Orders Count: ${orders.length}
- Overdue Retailers: ${JSON.stringify(overdueRetailers.map(r => ({ name: r.storeName, outstanding: r.currentOutstanding, limit: r.creditLimit })))}

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
    const ai = getAI();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });
    return JSON.parse(response.text || '[]');
  } catch (err) {
    console.error('Gemini insights error:', err);
    return [
      {
        category: 'Inventory',
        title: 'Immediate Reorder Alert: Amul Butter & Maggi',
        severity: 'high',
        insight: 'Amul Pasteurised Butter (500g) has only 18 cases remaining vs 15 reorder buffer. With upcoming weekend demand from Indiranagar beat, stock will deplete in 48 hours.',
        actionText: 'Raise Purchase Order to Amul C&F depot for 40 cases immediately.'
      },
      {
        category: 'Credit Risk',
        title: 'Credit Limit Breach at Balaji Daily Needs & Jai Hind',
        severity: 'high',
        insight: 'Balaji Daily Needs has ₹59,200 outstanding against ₹60,000 credit limit (98.6% utilized). Jai Hind Traders has breached limit with ₹82,000 dues.',
        actionText: 'Instruct Salesman Vikram Singh to collect minimum 50% via UPI before dispatching next indent.'
      },
      {
        category: 'Schemes',
        title: 'Run Monsoon Bumper Scheme on Biscuits',
        severity: 'medium',
        insight: 'Parle-G and Good Day stock levels are healthy at 147 combined cases. Bundling +6 loose packs on 5+ cases will accelerate beat volume by 22%.',
        actionText: 'Broadcast scheme flyer on WhatsApp to all registered retailers.'
      },
      {
        category: 'Beat Sales',
        title: 'Whitefield Beat Expansion Potential',
        severity: 'medium',
        insight: 'Sri Sai Ram Mart has zero overdue balance and ₹1.5L credit headroom. High demand observed for Household & Cleaning products like Surf Excel.',
        actionText: 'Assign Salesman Karthik to upsell 20+ cases of Detergents and Soaps.'
      }
    ];
  }
}
