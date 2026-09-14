import { Product, ProductPackingOption, CartItem } from '../types';

/**
 * Calculates profit margin percentage for retailer.
 * Formula: ((MRP - SellingPrice) / MRP) * 100
 */
export function calculateMarginPercentage(mrp: number, sellingPrice: number): number {
  if (!mrp || mrp <= 0 || !sellingPrice || sellingPrice <= 0) return 0;
  if (sellingPrice >= mrp) return 0;
  const margin = ((mrp - sellingPrice) / mrp) * 100;
  return Math.round(margin * 10) / 10;
}

/**
 * Generates or normalizes a ProductPackingOption object
 */
export function createPackingOption(
  name: string,
  pieces: number,
  sellingPrice: number,
  mrp: number,
  isDefault: boolean = false
): ProductPackingOption {
  const safePieces = Math.max(1, pieces);
  const safeSelling = Math.max(0, sellingPrice);
  const safeMrp = Math.max(safeSelling, mrp);
  const unitPrice = Math.round((safeSelling / safePieces) * 100) / 100;
  const unitMrp = Math.round((safeMrp / safePieces) * 100) / 100;
  const marginPercentage = calculateMarginPercentage(unitMrp, unitPrice);

  return {
    id: `pack_${safePieces}_${Math.round(safeSelling)}_${Math.random().toString(36).slice(2, 6)}`,
    name: name || `Pack of ${safePieces}`,
    pieces: safePieces,
    sellingPrice: safeSelling,
    mrp: safeMrp,
    unitPrice,
    unitMrp,
    marginPercentage,
    isDefault
  };
}

/**
 * Returns effective packing options for a product.
 * If the product has explicit packingOptions defined by Admin, returns them with normalized unit metrics.
 * Otherwise, generates 2 ApnaClub-style tiered options based on standard piecesPerCase and wholesalePricePiece:
 *   Option 1: Pack of 10 (or half case) with ~18-20% margin
 *   Option 2: Pack of 40 (or full case) with higher ~22-25% margin (volume advantage!)
 */
export function getProductPackingOptions(product: Product): ProductPackingOption[] {
  if (product.packingOptions && Array.isArray(product.packingOptions) && product.packingOptions.length > 0) {
    return product.packingOptions.map((opt, idx) => {
      const pcs = opt.pieces || 1;
      const selling = opt.sellingPrice || 0;
      const mrp = opt.mrp || (selling * 1.25);
      const unitPrice = opt.unitPrice || Math.round((selling / pcs) * 100) / 100;
      const unitMrp = opt.unitMrp || Math.round((mrp / pcs) * 100) / 100;
      const margin = opt.marginPercentage !== undefined 
        ? opt.marginPercentage 
        : calculateMarginPercentage(unitMrp, unitPrice);

      return {
        ...opt,
        id: opt.id || `pack_${pcs}_${idx}`,
        pieces: pcs,
        sellingPrice: selling,
        mrp,
        unitPrice,
        unitMrp,
        marginPercentage: margin,
        isDefault: opt.isDefault ?? (idx === 0)
      };
    });
  }

  // Generate smart ApnaClub-style defaults from existing product catalog
  const piecesPerCase = product.piecesPerCase || 24;
  const baseWholesale = product.wholesalePricePiece || (product.casePrice ? product.casePrice / piecesPerCase : 10);
  const baseMrp = product.mrpPiece || Math.round(baseWholesale * 1.25);

  // Tier 1: Smaller starter pack (e.g. 10 pcs, or half case)
  const tier1Pieces = piecesPerCase >= 30 ? 10 : Math.max(1, Math.min(10, Math.floor(piecesPerCase / 2)));
  const tier1Selling = Math.round(tier1Pieces * baseWholesale);
  const tier1Mrp = Math.round(tier1Pieces * baseMrp);
  const tier1Margin = calculateMarginPercentage(tier1Mrp, tier1Selling) || 18;

  // Tier 2: Value / Bulk pack (e.g. 40 pcs, or full case) with higher retailer margin
  const tier2Pieces = piecesPerCase >= 40 ? piecesPerCase : Math.max(tier1Pieces * 2, piecesPerCase);
  // Give a 3-5% extra margin discount for bulk pack
  const tier2SellingPerPc = Math.round(baseWholesale * 0.96 * 100) / 100;
  const tier2Selling = Math.round(tier2Pieces * tier2SellingPerPc);
  const tier2Mrp = Math.round(tier2Pieces * baseMrp);
  const tier2Margin = calculateMarginPercentage(tier2Mrp, tier2Selling) || 24;

  return [
    {
      id: `pack_tier1_${product.id}`,
      name: `Pack of ${tier1Pieces}`,
      pieces: tier1Pieces,
      sellingPrice: tier1Selling,
      mrp: tier1Mrp,
      unitPrice: Math.round((tier1Selling / tier1Pieces) * 100) / 100,
      unitMrp: baseMrp,
      marginPercentage: tier1Margin,
      isDefault: true
    },
    {
      id: `pack_tier2_${product.id}`,
      name: `Pack of ${tier2Pieces}`,
      pieces: tier2Pieces,
      sellingPrice: tier2Selling,
      mrp: tier2Mrp,
      unitPrice: Math.round((tier2Selling / tier2Pieces) * 100) / 100,
      unitMrp: baseMrp,
      marginPercentage: tier2Margin,
      isDefault: false
    }
  ];
}

/**
 * Creates a preset packing option with custom pieces and smart margin discount
 */
export function createPresetPacking(
  pieces: number,
  baseWholesalePerPc: number,
  baseMrpPerPc: number,
  customName?: string,
  extraDiscountPercent: number = 0
): ProductPackingOption {
  const safePieces = Math.max(1, pieces);
  const safeWp = Math.max(0.1, baseWholesalePerPc);
  const safeMrp = Math.max(safeWp, baseMrpPerPc);
  
  // Calculate discount for bulk tiers
  const discountFactor = 1 - (extraDiscountPercent / 100);
  const effectiveUnitPrice = Math.round(safeWp * discountFactor * 100) / 100;
  const sellingPrice = Math.round(effectiveUnitPrice * safePieces * 100) / 100;
  const totalMrp = Math.round(safeMrp * safePieces * 100) / 100;
  const marginPercentage = calculateMarginPercentage(totalMrp, sellingPrice);

  return {
    id: `pack_${safePieces}_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
    name: customName || `Pack of ${safePieces}`,
    pieces: safePieces,
    sellingPrice,
    mrp: totalMrp,
    unitPrice: effectiveUnitPrice,
    unitMrp: safeMrp,
    marginPercentage
  };
}

/**
 * Returns the highest available margin percentage across all packing options of a product
 */
export function getMaxMarginPercentage(product: Product): number {
  const options = getProductPackingOptions(product);
  if (options.length === 0) {
    return product.mrpPiece > 0 
      ? calculateMarginPercentage(product.mrpPiece, product.wholesalePricePiece) 
      : 20;
  }
  return Math.max(...options.map(o => o.marginPercentage));
}

/**
 * Calculates line totals for a cart item supporting both:
 * 1. ApnaClub packing options (packCount * packing.sellingPrice)
 * 2. Traditional FMCG case + loose pcs (cases * casePrice + loosePcs * wholesalePricePiece)
 */
export function calculateCartItemPricing(item: CartItem): {
  grossAmount: number;
  unitPrice: number;
  unitMrp: number;
  marginPercentage: number;
  totalPieces: number;
  packingLabel: string;
  packCount: number;
} {
  const { product, selectedPacking, packCount, cases, loosePcs } = item;

  if (selectedPacking) {
    const qty = Math.max(1, packCount || cases || 1);
    const gross = qty * selectedPacking.sellingPrice;
    const pieces = qty * selectedPacking.pieces;
    return {
      grossAmount: gross,
      unitPrice: selectedPacking.unitPrice || (selectedPacking.sellingPrice / selectedPacking.pieces),
      unitMrp: selectedPacking.unitMrp || (selectedPacking.mrp / selectedPacking.pieces),
      marginPercentage: selectedPacking.marginPercentage,
      totalPieces: pieces,
      packingLabel: `${selectedPacking.name} (${selectedPacking.pieces} pcs)`,
      packCount: qty
    };
  }

  // Fallback to cases + loose pcs
  const pcsPerCase = product.piecesPerCase || 24;
  const effectiveCases = cases || 0;
  const effectiveLoose = loosePcs || 0;
  const totalPieces = (effectiveCases * pcsPerCase) + effectiveLoose;
  const unitPrice = product.wholesalePricePiece || (product.casePrice / pcsPerCase);
  const unitMrp = product.mrpPiece || (unitPrice * 1.25);
  const marginPct = calculateMarginPercentage(unitMrp, unitPrice);
  const gross = (effectiveCases * product.casePrice) + (effectiveLoose * unitPrice);

  const packingLabel = effectiveCases > 0 && effectiveLoose > 0
    ? `${effectiveCases} Cs + ${effectiveLoose} Pcs`
    : effectiveCases > 0
    ? `${effectiveCases} Case (${effectiveCases * pcsPerCase} pcs)`
    : `${effectiveLoose} Loose Pcs`;

  return {
    grossAmount: gross,
    unitPrice,
    unitMrp,
    marginPercentage: marginPct,
    totalPieces,
    packingLabel,
    packCount: effectiveCases > 0 ? effectiveCases : 1
  };
}
