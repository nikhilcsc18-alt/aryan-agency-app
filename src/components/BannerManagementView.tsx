import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  Check, 
  X, 
  Sparkles, 
  Eye, 
  EyeOff, 
  Palette, 
  UploadCloud, 
  CheckCircle2, 
  RefreshCw,
  Loader2,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  ExternalLink
} from 'lucide-react';
import { PromotionalBanner } from '../types';
import { api } from '../lib/api';

interface BannerManagementViewProps {
  banners: PromotionalBanner[];
  onRefreshBanners: () => Promise<void>;
  onBannerClickPreview?: () => void;
}

export const FMCG_POPULAR_BRANDS = [
  'Parle',
  'Britannia',
  'Sunfeast',
  'Amul',
  "Lay's",
  'Kurkure',
  'Cadbury',
  'Dettol',
  'Honey Bunny',
  'Colgate',
  'Nestle',
  'Haldiram',
  'ITC',
  'Tata',
  'Patanjali',
  'Dabur',
  'PepsiCo',
  'Stayfree'
];

export const FMCG_POPULAR_CATEGORIES = [
  'Biscuits & Bakery',
  'Snacks & Namkeen',
  'Beverages',
  'Dairy & Refrigerated',
  'Personal Care',
  'Spices & Staples',
  'Confectionery & Chocolates',
  'Household & Hygiene'
];

const GRADIENT_PRESETS = [
  { label: 'Golden Wholesale', value: 'from-[#F6BD27] via-[#F4B218] to-[#E89E0B]' },
  { label: 'Amber Trade', value: 'from-[#F59E0B] via-[#D97706] to-[#B45309]' },
  { label: 'Depot Blue', value: 'from-[#0284C7] via-[#0369A1] to-[#075985]' },
  { label: 'Teal Super-Stockist', value: 'from-[#0D9488] via-[#0F766E] to-[#115E59]' },
  { label: 'Emerald Kirana', value: 'from-[#059669] via-[#047857] to-[#065F46]' },
  { label: 'Royal Navy', value: 'from-[#1E3A8A] via-[#1E40AF] to-[#172554]' },
  { label: 'Crimson Scheme', value: 'from-[#DC2626] via-[#B91C1C] to-[#991B1B]' },
  { label: 'Purple FMCG', value: 'from-[#7C3AED] via-[#6D28D9] to-[#5B21B6]' }
];

const FMCG_IMAGE_PRESETS = [
  {
    name: 'बिस्कुट (Biscuits & Bakery)',
    url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=600&auto=format&fit=crop&q=80',
    title: 'दुकानदारों के लिए विशेष थोक स्कीम',
    subtitle: 'Parle • Britannia • Sunfeast • Amul',
    badge: 'थोक ऑफर',
    offer: 'हर पेटी पर अतिरिक्त 5% मार्जिन',
    brands: 'Parle-G • Good Day • Marie Gold • Bourbon',
    gradient: 'from-[#F6BD27] via-[#F4B218] to-[#E89E0B]'
  },
  {
    name: 'नमकीन व चिप्स (Snacks & Chips)',
    url: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?w=600&auto=format&fit=crop&q=80',
    title: "Lay's & Kurkure डायरेक्ट डिपो मार्जिन",
    subtitle: '100% ओरिजिनल फ्रेश स्टॉक सीधे डिपो से',
    badge: 'हॉट सेलिंग',
    offer: '₹5 व ₹10 पैक पर पूरा 18% रिटेलर मार्जिन',
    brands: "Lay's • Kurkure • Uncle Chipps • Doritos",
    gradient: 'from-[#F59E0B] via-[#D97706] to-[#B45309]'
  },
  {
    name: 'अमूल डेयरी (Amul Dairy)',
    url: 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?w=600&auto=format&fit=crop&q=80',
    title: 'अमूल मक्खन व चीज़ थोक सप्लाई',
    subtitle: 'कोल्ड-चेन रेफ्रिजरेटेड वैन से दुकान तक डिलीवरी',
    badge: 'अमूल डिपो',
    offer: 'प्रति कार्टन सीधा ₹120 तक का मुनाफा',
    brands: 'Amul Butter • Cheese Cubes • Paneer • Ghee',
    gradient: 'from-[#0284C7] via-[#0369A1] to-[#075985]'
  },
  {
    name: 'मैगी नूडल्स (Maggi Noodles)',
    url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?w=600&auto=format&fit=crop&q=80',
    title: 'मैगी 2-मिनट नूडल्स डिपो रेट्स',
    subtitle: 'नेस्ले सुपर-स्टॉकिस्ट ऑथेंटिक डिस्ट्रीब्यूशन',
    badge: 'सुपर स्कीम',
    offer: 'थोक पेटी बुकिंग पर अतिरिक्त 4% कैश डिस्काउंट',
    brands: 'Maggi 70g • Maggi Oats • Maggi Masala-ae-Magic',
    gradient: 'from-[#DC2626] via-[#B91C1C] to-[#991B1B]'
  },
  {
    name: 'पर्सनल हाइजीन (Soap & Hygiene)',
    url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80',
    title: 'पर्सनल हाइजीन व सोप थोक कार्टन स्कीम',
    subtitle: 'डेटॉल, कोलगेट, लक्स व लाइफबॉय डिपो स्टॉक',
    badge: 'दुकान डिलीवरी',
    offer: 'जीएसटी पक्के बिल के साथ 24 घंटे में डिस्पैच',
    brands: 'Dettol • Lifebuoy • Lux • Colgate • Whisper',
    gradient: 'from-[#0D9488] via-[#0F766E] to-[#115E59]'
  }
];

/**
 * High-performance client-side image compression:
 * Scales large photos (from mobile camera/gallery) to max 1200x600 and exports an optimized JPEG (~50KB-120KB)
 * guaranteeing fast upload and eliminating browser memory/network timeout issues.
 */
function compressBannerImage(file: File, maxWidth = 1200, maxHeight = 600, quality = 0.85): Promise<{ dataUrl: string; sizeKb: number }> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('कृपया केवल इमेज (JPG, PNG, WEBP) फ़ाइल चुनें।'));
      return;
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('फ़ाइल पढ़ने में त्रुटि हुई।'));
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = () => reject(new Error('इमेज लोड करने में समस्या हुई। कृपया दूसरी फोटो चुनें।'));
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const raw = e.target?.result as string;
          resolve({ dataUrl: raw, sizeKb: Math.round((raw.length * 0.75) / 1024) });
          return;
        }

        // Fill background with white in case of transparent PNG
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        const sizeKb = Math.round((dataUrl.length * 0.75) / 1024);
        resolve({ dataUrl, sizeKb });
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  });
}

export const BannerManagementView: React.FC<BannerManagementViewProps> = ({
  banners = [],
  onRefreshBanners,
  onBannerClickPreview
}) => {
  const safeBanners = Array.isArray(banners) ? banners : [];
  const [editingBanner, setEditingBanner] = useState<PromotionalBanner | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Image Upload State
  const [isCompressing, setIsCompressing] = useState(false);
  const [uploadInfo, setUploadInfo] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const quickUploadRef = useRef<HTMLInputElement | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badgeText, setBadgeText] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [accentColor, setAccentColor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [bgGradient, setBgGradient] = useState('from-[#F6BD27] via-[#F4B218] to-[#E89E0B]');
  const [isActive, setIsActive] = useState(true);
  const [targetCategory, setTargetCategory] = useState('');
  const [targetBrand, setTargetBrand] = useState('');
  const [hideTextOverlay, setHideTextOverlay] = useState(false);
  const [posterFit, setPosterFit] = useState<'cover' | 'fill' | 'contain'>('cover');
  const [showBuyNow, setShowBuyNow] = useState(true);
  const [buyNowText, setBuyNowText] = useState('अभी खरीदें (Buy Now)');

  const openCreateModal = (presetImage?: string) => {
    setEditingBanner(null);
    setIsCreatingNew(true);
    setTitle('');
    setSubtitle('');
    setBadgeText('विशेष ऑफर');
    setCtaText('');
    setAccentColor('');
    setImageUrl(presetImage || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80');
    setBgGradient('from-[#F6BD27] via-[#F4B218] to-[#E89E0B]');
    setIsActive(true);
    setTargetCategory('Biscuits & Bakery');
    setTargetBrand('');
    setHideTextOverlay(false);
    setPosterFit('cover');
    setShowBuyNow(true);
    setBuyNowText('अभी खरीदें (Buy Now)');
    setSaveError(null);
    setUploadInfo(presetImage ? '✓ फोटो लोड हो गई' : null);
  };

  const openEditModal = (b: PromotionalBanner) => {
    setEditingBanner(b);
    setIsCreatingNew(false);
    setTitle(b.title || '');
    setSubtitle(b.subtitle || '');
    setBadgeText(b.badgeText || '');
    setCtaText(b.ctaText || '');
    setAccentColor(b.accentColor || '');
    setImageUrl(b.imageUrl);
    setBgGradient(b.bgGradient);
    setIsActive(b.isActive);
    setTargetCategory(b.targetCategory || '');
    setTargetBrand(b.targetBrand || '');
    setHideTextOverlay(Boolean(b.hideTextOverlay));
    setPosterFit(b.posterFit || 'cover');
    setShowBuyNow(b.showBuyNow !== undefined ? Boolean(b.showBuyNow) : true);
    setBuyNowText(b.buyNowText || 'अभी खरीदें (Buy Now)');
    setSaveError(null);
    setUploadInfo(b.imageUrl ? 'मौजूदा बैनर इमेज लोड है' : null);
  };

  const closeModal = () => {
    setEditingBanner(null);
    setIsCreatingNew(false);
    setSaveError(null);
    setUploadInfo(null);
  };

  // Process and compress image file
  const processImageFile = async (file: File) => {
    try {
      setIsCompressing(true);
      setSaveError(null);
      setUploadInfo('फोटो ऑप्टिमाइज़ हो रही है...');
      
      const { dataUrl, sizeKb } = await compressBannerImage(file);
      setImageUrl(dataUrl);
      setUploadInfo(`✓ फोटो लोड हो गई (${sizeKb} KB - ऑप्टिमाइज़्ड)`);
    } catch (err: any) {
      console.error('Error processing image:', err);
      setSaveError(err?.message || 'फोटो प्रोसेस करने में त्रुटि हुई। कृपया दूसरी फोटो चुनें।');
      setUploadInfo(null);
    } finally {
      setIsCompressing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (quickUploadRef.current) quickUploadRef.current.value = '';
    }
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file);
    }
  };

  // Quick Direct Upload from Header
  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      openCreateModal();
      await processImageFile(file);
    }
  };

  const applyPreset = (preset: typeof FMCG_IMAGE_PRESETS[0]) => {
    setTitle(preset.title);
    setSubtitle(preset.subtitle);
    setBadgeText(preset.badge);
    setCtaText(preset.offer);
    setAccentColor(preset.brands);
    setImageUrl(preset.url);
    setBgGradient(preset.gradient);
    setUploadInfo(`✓ ${preset.name} प्रीसेट लागू किया गया`);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Title is NO LONGER MANDATORY! Default if empty
    const effectiveTitle = title.trim() || (targetBrand ? `${targetBrand} Wholesale Offer` : 'प्रमोशनल बैनर');

    setIsSaving(true);
    setSaveError(null);

    const bannerPayload: Partial<PromotionalBanner> = {
      title: effectiveTitle,
      subtitle: subtitle.trim(),
      badgeText: badgeText.trim() || 'विशेष ऑफर',
      ctaText: ctaText.trim() || undefined,
      accentColor: accentColor.trim() || undefined,
      imageUrl: imageUrl.trim() || 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80',
      bgGradient,
      isActive,
      targetCategory: targetCategory.trim() || undefined,
      targetBrand: targetBrand.trim() || undefined,
      hideTextOverlay,
      posterFit,
      showBuyNow,
      buyNowText: buyNowText.trim() || 'अभी खरीदें (Buy Now)'
    };

    try {
      if (editingBanner) {
        await api.updateBanner(editingBanner.id, bannerPayload);
      } else {
        await api.createBanner(bannerPayload as any);
      }
      if (onRefreshBanners) {
        await onRefreshBanners();
      }
      setSaveSuccess(true);
      setTimeout(() => {
        setSaveSuccess(false);
        closeModal();
      }, 700);
    } catch (err: any) {
      console.error('Error saving banner:', err);
      setSaveError(err?.message || 'बैनर सेव करने में त्रुटि हुई।');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteBanner(id);
      if (onRefreshBanners) {
        await onRefreshBanners();
      }
      setDeleteConfirmId(null);
    } catch (err: any) {
      console.error('Error deleting banner:', err);
      alert('बैनर हटाने में त्रुटि: ' + (err?.message || err));
    }
  };

  const handleToggleActive = async (b: PromotionalBanner) => {
    try {
      await api.updateBanner(b.id, { isActive: !b.isActive });
      if (onRefreshBanners) {
        await onRefreshBanners();
      }
    } catch (err: any) {
      console.error('Error toggling banner status:', err);
    }
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      
      {/* Hidden Quick Upload Input */}
      <input
        ref={quickUploadRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleQuickUpload}
      />

      {/* Top Banner Control Header */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-600 font-bold">
              <ImageIcon className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-black text-slate-900 tracking-tight">
              Promotional Banner Management
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            होम स्क्रीन और रिटेलर ऐप में दिखने वाले प्रमोशनल स्लाइडर बैनर्स, फोटो व ऑफर्स को लाइव मैनेज करें।
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => onRefreshBanners()}
            className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="रिफ्रेश करें"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Direct Photo Upload Action Button */}
          <button
            type="button"
            onClick={() => quickUploadRef.current?.click()}
            className="flex items-center space-x-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-xs active:scale-95 transition-all cursor-pointer"
            title="फोटो अपलोड कर तुरंत नया बैनर बनाएं"
          >
            <UploadCloud className="w-4 h-4" />
            <span>+ फोटो अपलोड करें (Upload Image)</span>
          </button>
          
          <button
            id="admin-add-banner-btn"
            type="button"
            onClick={() => openCreateModal()}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-[#1A73E8] hover:bg-[#1557b0] text-white text-xs font-bold shadow-sm active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ नया बैनर फॉर्म (New Banner)</span>
          </button>
        </div>
      </div>

      {/* Banner Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {safeBanners.map((b, idx) => (
          <div 
            key={b.id} 
            className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col justify-between hover:shadow-md transition-shadow"
          >
            {/* Live Visual Preview of the Banner */}
            <div className={`relative p-4 text-white ${b.imageUrl ? 'bg-slate-950' : `bg-gradient-to-r ${b.bgGradient}`} aspect-[2.2/1] min-h-[175px] max-h-[260px] flex flex-col justify-between overflow-hidden`}>
              
              {/* Full-bleed banner image covering 100% space without blank margins */}
              {b.imageUrl && (
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                  <img 
                    src={b.imageUrl} 
                    alt="" 
                    className={`w-full h-full ${
                      b.posterFit === 'fill' ? 'object-fill' : 'object-cover object-center'
                    }`}
                    referrerPolicy="no-referrer"
                  />
                  {/* If text overlay is NOT hidden, show gradient scrim for contrast */}
                  {!b.hideTextOverlay && (
                    <div className="absolute inset-0 z-[2]">
                      <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/20" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                    </div>
                  )}
                </div>
              )}

              {/* Top Meta Bar */}
              <div className="relative z-10 flex items-start justify-between">
                <div className="flex items-center space-x-1.5 flex-wrap gap-1">
                  {b.hideTextOverlay ? (
                    <span className="px-2 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center space-x-1">
                      <EyeOff className="w-3 h-3" />
                      <span>शुद्ध फोटो मोड (No Text)</span>
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
                      {b.badgeText || 'B2B Wholesale'}
                    </span>
                  )}
                  <span className="text-[10px] font-bold text-white/90 bg-black/50 px-2 py-0.5 rounded backdrop-blur-xs">
                    Slide #{idx + 1}
                  </span>
                </div>
                <div className="flex items-center space-x-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    b.isActive ? 'bg-emerald-600/90 text-white' : 'bg-slate-800/80 text-slate-300'
                  }`}>
                    {b.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
              </div>

              {/* Middle Section: Only displayed if hideTextOverlay is NOT true */}
              {!b.hideTextOverlay ? (
                <div className="relative z-10 my-2 flex items-center justify-between gap-3">
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-black leading-tight drop-shadow-md truncate text-white">
                      {b.title}
                    </h3>
                    {b.subtitle && (
                      <p className="text-xs text-white/95 font-medium truncate drop-shadow-xs">
                        {b.subtitle}
                      </p>
                    )}
                    {b.ctaText && (
                      <p className="text-[11px] font-bold text-amber-300 mt-1 drop-shadow-xs">
                        ⚡ {b.ctaText}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="relative z-10 my-auto py-4">
                  {/* Clean spacer for image-only view */}
                </div>
              )}

              {/* Bottom Action / Target Info Row */}
              <div className="relative z-10 flex items-center justify-between text-[10px] text-white/90 pt-1 border-t border-white/20 bg-black/40 backdrop-blur-xs -mx-4 -mb-4 px-4 py-2 mt-auto">
                <div className="flex items-center space-x-1.5 truncate max-w-[200px]">
                  <span className="font-bold text-amber-300">
                    🔗 {b.targetBrand ? `Brand: ${b.targetBrand}` : b.targetCategory ? `Category: ${b.targetCategory}` : 'All Products'}
                  </span>
                </div>

                {b.showBuyNow !== false && (
                  <div className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-[10px] shadow-sm">
                    <ShoppingBag className="w-3 h-3 stroke-[2.5]" />
                    <span>{b.buyNowText || 'Buy Now'}</span>
                    <ArrowRight className="w-2.5 h-2.5 stroke-[3]" />
                  </div>
                )}
              </div>
            </div>

            {/* Banner Meta and Actions Footer */}
            <div className="p-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center space-x-2 min-w-0">
                <button
                  type="button"
                  onClick={() => handleToggleActive(b)}
                  className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
                    b.isActive 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                      : 'bg-slate-200 text-slate-600 border-slate-300 hover:bg-slate-300'
                  }`}
                  title={b.isActive ? 'Click to deactivate' : 'Click to activate'}
                >
                  {b.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  <span>{b.isActive ? 'Live' : 'Hidden'}</span>
                </button>
                <span className="text-[11px] text-slate-400 truncate">
                  ID: {b.id}
                </span>
              </div>

              <div className="flex items-center space-x-2 shrink-0">
                <button
                  type="button"
                  onClick={() => openEditModal(b)}
                  className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 text-xs font-bold transition-colors cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Edit</span>
                </button>

                {deleteConfirmId === b.id ? (
                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={() => handleDelete(b.id)}
                      className="px-2.5 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors cursor-pointer"
                    >
                      Confirm Delete
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="p-1.5 rounded-lg bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(b.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                    title="Delete Banner"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}

        {safeBanners.length === 0 && (
          <div className="col-span-full p-8 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <ImageIcon className="w-10 h-10 text-slate-400 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-700">कोई सक्रिय बैनर नहीं है</h3>
            <p className="text-xs text-slate-500 mt-1 mb-4">
              पहला प्रमोशनल बैनर जोड़ने के लिए "नया बैनर बनाएं" या "फोटो अपलोड करें" पर क्लिक करें।
            </p>
            <div className="flex items-center justify-center space-x-2">
              <button
                onClick={() => quickUploadRef.current?.click()}
                className="px-4 py-2 bg-amber-500 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer hover:bg-amber-600"
              >
                + Upload Photo Banner
              </button>
              <button
                onClick={() => openCreateModal()}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm cursor-pointer hover:bg-blue-700"
              >
                + Add First Banner
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Edit / Create Banner Modal */}
      {(isCreatingNew || editingBanner) && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
            
            {/* Modal Header */}
            <div className="p-4 bg-[#0B1E3F] text-white flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-amber-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">
                    {editingBanner ? 'Edit Promotional Banner' : 'Create New Promotional Banner'}
                  </h3>
                  <p className="text-[11px] text-blue-200">
                    Retailer B2B Front Screen Banner
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="p-1 rounded-lg text-blue-200 hover:text-white hover:bg-blue-900/50 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body Form */}
            <form onSubmit={handleSave} noValidate className="p-4 sm:p-5 space-y-4 max-h-[80vh] overflow-y-auto text-xs">
              
              {saveError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{saveError}</span>
                </div>
              )}

              {/* Real-Time Live Preview of the Banner */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1.5">
                  लाइव प्रिव्यू (Live Carousel Preview)
                </label>
                <div className={`relative p-4 rounded-xl text-white ${imageUrl ? 'bg-slate-950' : `bg-gradient-to-r ${bgGradient}`} aspect-[2.2/1] min-h-[175px] max-h-[260px] flex flex-col justify-between shadow-inner overflow-hidden border border-slate-700/50`}>
                  
                  {/* Image Background Overlay in Preview - Full Bleed */}
                  {imageUrl && (
                    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
                      <img 
                        src={imageUrl} 
                        alt="" 
                        className={`w-full h-full ${
                          posterFit === 'fill' ? 'object-fill' : 'object-cover object-center'
                        }`}
                        referrerPolicy="no-referrer"
                      />
                      {!hideTextOverlay && (
                        <div className="absolute inset-0 z-[2]">
                          <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/45 to-black/20" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent" />
                        </div>
                      )}
                    </div>
                  )}

                  {/* Preview Header */}
                  <div className="relative z-10 flex items-center justify-between">
                    {hideTextOverlay ? (
                      <span className="px-2.5 py-0.5 rounded-full bg-blue-600 text-white text-[10px] font-black uppercase tracking-wider shadow-xs flex items-center space-x-1">
                        <EyeOff className="w-3 h-3" />
                        <span>शुद्ध फोटो मोड (No Text Overlay)</span>
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider shadow-xs">
                        {badgeText || 'केवल दुकानदारों के लिए'}
                      </span>
                    )}
                    <span className="text-[10px] bg-black/50 backdrop-blur-xs text-white px-2 py-0.5 rounded font-bold">
                      {isActive ? 'Active' : 'Draft'}
                    </span>
                  </div>

                  {/* Preview Text Content (Only if NOT hideTextOverlay) */}
                  {!hideTextOverlay ? (
                    <div className="relative z-10 my-2 flex items-center justify-between gap-3">
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <h4 className="text-base font-black leading-tight text-white drop-shadow-md">
                          {title || 'बैनर का मुख्य शीर्षक'}
                        </h4>
                        {subtitle && (
                          <p className="text-[11px] text-white/95 font-medium drop-shadow-xs">
                            {subtitle}
                          </p>
                        )}
                        {ctaText && (
                          <p className="text-[11px] font-bold text-amber-300 mt-1 drop-shadow-xs">
                            ⚡ {ctaText}
                          </p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="relative z-10 my-auto py-3">
                      {/* Clean space for image only */}
                    </div>
                  )}

                  {/* Preview Footer with Buy Now & Target */}
                  <div className="relative z-10 text-[10px] text-white/90 border-t border-white/20 pt-1.5 flex items-center justify-between bg-black/40 backdrop-blur-xs -mx-4 -mb-4 px-4 py-2 mt-auto">
                    <span className="font-bold text-amber-300 truncate max-w-[200px] drop-shadow-xs">
                      🔗 {targetBrand ? `Brand: ${targetBrand}` : targetCategory ? `Category: ${targetCategory}` : 'All Wholesale Stock'}
                    </span>

                    {showBuyNow && (
                      <div className="inline-flex items-center space-x-1 px-3 py-1 rounded-lg bg-amber-400 text-slate-950 font-black text-[10.5px] shadow-sm">
                        <ShoppingBag className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span>{buyNowText || 'अभी खरीदें (Buy Now)'}</span>
                        <ArrowRight className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* SPECIAL OPTION 1: HIDE TEXT OVERLAY (ONLY SHOW BANNER IMAGE) */}
              <div className="p-3 rounded-xl bg-blue-50/80 border border-blue-200 flex items-center justify-between">
                <div className="space-y-0.5 pr-3">
                  <span className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                    <EyeOff className="w-4 h-4 text-blue-600" />
                    <span>बैनर पर लिखावट छुपाएं (केवल शुद्ध फोटो/पोस्टर दिखाएं)</span>
                  </span>
                  <p className="text-[11px] text-slate-600">
                    यदि आपके बैनर में पहले से डिज़ाइन या टेक्स्ट लिखा है, तो इसे चालू करें। केवल आपकी फोटो दिखेगी, ऊपर कोई फालतू शीर्षक नहीं आएगा।
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={hideTextOverlay}
                    onChange={(e) => setHideTextOverlay(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* SPECIAL OPTION 2: POSTER SIZE & DISPLAY FIT */}
              <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                      <ImageIcon className="w-4 h-4 text-emerald-600" />
                      <span>पोस्टर साइज़ और डिस्प्ले स्टाइल (Proper Poster Fit)</span>
                    </span>
                    <p className="text-[11px] text-slate-600">
                      पोस्टर का साइज़ और फिटिंग चुनें ताकि आपका बैनर पूरा और सही अनुपात में दिखाई दे।
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setPosterFit('cover')}
                    className={`p-2.5 rounded-lg border text-left flex items-start space-x-2.5 transition-all ${
                      posterFit === 'cover'
                        ? 'border-emerald-600 bg-emerald-100/70 shadow-xs ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      posterFit === 'cover' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                    }`}>
                      {posterFit === 'cover' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900 flex items-center space-x-1">
                        <span>फुल स्पेस कवर (Full Banner 100%)</span>
                        <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-emerald-600 text-white font-black">डिफ़ॉल्ट</span>
                      </div>
                      <p className="text-[10.5px] text-slate-600 mt-0.5 leading-snug">
                        बैनर बिना किसी साइड स्पेस या ब्लैंक जगह के पूरे एरिया में एज-टू-एज (Edge-to-Edge) सेट होगा।
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPosterFit('fill')}
                    className={`p-2.5 rounded-lg border text-left flex items-start space-x-2.5 transition-all ${
                      posterFit === 'fill'
                        ? 'border-emerald-600 bg-emerald-100/70 shadow-xs ring-1 ring-emerald-500'
                        : 'border-slate-200 bg-white hover:bg-slate-50'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                      posterFit === 'fill' ? 'border-emerald-600 bg-emerald-600' : 'border-slate-300'
                    }`}>
                      {posterFit === 'fill' && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">स्ट्रेच फिट (Stretch 100%)</div>
                      <p className="text-[10.5px] text-slate-600 mt-0.5 leading-snug">
                        फोटो बिना कुछ कटे पूरे बैनर बॉक्स में 100% चौड़ाई और ऊँचाई में खिंचकर फिट होगी।
                      </p>
                    </div>
                  </button>
                </div>

                <div className="p-2 rounded-lg bg-white/90 border border-emerald-200/90 text-[11px] text-slate-700 flex items-start space-x-2">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">
                    <strong>पूरे स्पेस में सेट:</strong> अब पोस्टर बीच में सिमटने या साइड में ब्लैंक स्पेस छूटने के बजाय पूरे बैनर एरिया में 100% एज-टू-एज दिखेगा।
                  </span>
                </div>
              </div>

              {/* SPECIAL OPTION 3: BUY NOW BUTTON & BRAND/CATEGORY LINK */}
              <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 text-xs flex items-center space-x-1.5">
                      <ShoppingBag className="w-4 h-4 text-amber-600" />
                      <span>'बाय नाउ (Buy Now)' बटन और डायरेक्ट नेविगेशन</span>
                    </span>
                    <p className="text-[11px] text-slate-600">
                      बैनर या 'Buy Now' बटन पर क्लिक करने पर ग्राहक सीधे उस ब्रांड या कैटेगरी के उत्पादों पर पहुंच जाएगा।
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer shrink-0">
                    <input
                      type="checkbox"
                      checked={showBuyNow}
                      onChange={(e) => setShowBuyNow(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                  </label>
                </div>

                {/* Target Brand & Category Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      टारगेट ब्रांड (Direct Target Brand)
                    </label>
                    <select
                      value={targetBrand}
                      onChange={(e) => setTargetBrand(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400 font-medium"
                    >
                      <option value="">-- कोई ब्रांड चुनें (या नीचे टाइप करें) --</option>
                      {FMCG_POPULAR_BRANDS.map(br => (
                        <option key={br} value={br}>{br}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={targetBrand}
                      onChange={(e) => setTargetBrand(e.target.value)}
                      placeholder="या खुद ब्रांड का नाम लिखें (उदा. Parle, Britannia, Lay's)"
                      className="mt-1.5 w-full px-2.5 py-1.5 text-[11px] bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-400"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-800 mb-1">
                      टारगेट कैटेगरी (Direct Target Category)
                    </label>
                    <select
                      value={targetCategory}
                      onChange={(e) => setTargetCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-400 font-medium"
                    >
                      <option value="">-- कोई कैटेगरी चुनें --</option>
                      {FMCG_POPULAR_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>

                    {showBuyNow && (
                      <div className="mt-1.5">
                        <label className="block text-[10.5px] font-semibold text-slate-700 mb-0.5">
                          बटन का नाम (Button Label)
                        </label>
                        <input
                          type="text"
                          value={buyNowText}
                          onChange={(e) => setBuyNowText(e.target.value)}
                          placeholder="उदा. अभी खरीदें (Buy Now) या ऑर्डर करें"
                          className="w-full px-2.5 py-1.5 text-[11px] bg-white border border-slate-300 rounded-lg focus:ring-1 focus:ring-amber-400 font-medium"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* 1-Click Popular FMCG Image Presets */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>त्वरित FMCG प्रीसेट (1-Click Presets)</span>
                  </span>
                  <span className="text-[10px] text-slate-400">रेडीमेड फोटो व टेक्स्ट</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {FMCG_IMAGE_PRESETS.map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-50 text-slate-700 hover:text-amber-800 border border-slate-200 hover:border-amber-300 text-[10.5px] font-semibold transition-colors cursor-pointer shadow-2xs"
                    >
                      {p.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* BANNER PHOTO UPLOAD BOX (DRAG & DROP / CLICK) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-[11px] font-bold text-slate-800">
                    बैनर फोटो अपलोड (Upload Banner Photo) *
                  </label>
                  {uploadInfo && (
                    <span className="text-[10.5px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      {uploadInfo}
                    </span>
                  )}
                </div>

                {/* Upload Zone / Drop Area */}
                <div className="border-2 border-dashed border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50/70 rounded-xl p-3 sm:p-4 transition-all">
                  <div className="flex flex-col sm:flex-row items-center gap-3">
                    
                    {/* Thumbnail if loaded */}
                    {imageUrl ? (
                      <div className="relative shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 border-emerald-400 shadow-md bg-white">
                        <img 
                          src={imageUrl} 
                          alt="Uploaded Banner" 
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setImageUrl('');
                            setUploadInfo(null);
                          }}
                          className="absolute top-1 right-1 p-1 rounded-full bg-black/70 hover:bg-rose-600 text-white transition-colors cursor-pointer"
                          title="फोटो हटाएं"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <div className="shrink-0 w-16 h-16 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                        <UploadCloud className="w-8 h-8" />
                      </div>
                    )}

                    {/* Upload Controls & Instructions */}
                    <div className="flex-1 text-center sm:text-left space-y-1">
                      <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                        <label className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer inline-flex items-center space-x-1.5 active:scale-95 transition-all">
                          {isCompressing ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>प्रोसेसिंग...</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="w-4 h-4" />
                              <span>{imageUrl ? 'फोटो बदलें (Change Photo)' : 'फोटो चुनें (Choose File)'}</span>
                            </>
                          )}
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageFileUpload}
                          />
                        </label>

                        {imageUrl && (
                          <button
                            type="button"
                            onClick={() => {
                              setImageUrl('');
                              setUploadInfo(null);
                            }}
                            className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
                          >
                            हटाएं (Remove)
                          </button>
                        )}
                      </div>
                      <p className="text-[10.5px] text-slate-500">
                        मोबाइल या कंप्यूटर से कोई भी फोटो (JPG, PNG, WEBP) चुनें। यह अपने आप ऑप्टिमाइज़ हो जाएगी।
                      </p>
                    </div>

                  </div>
                </div>

                {/* Optional Manual Image URL Field */}
                <div className="pt-1">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10.5px] text-slate-500 font-medium shrink-0">या वेब URL:</span>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={(e) => {
                        setImageUrl(e.target.value);
                        setUploadInfo(e.target.value ? 'वेब URL सेट है' : null);
                      }}
                      placeholder="https://images.unsplash.com/..."
                      className="flex-1 px-2.5 py-1.5 text-[11px] bg-slate-50 border border-slate-200 rounded-lg focus:ring-1 focus:ring-blue-500 text-slate-700"
                    />
                  </div>
                </div>
              </div>

              {/* Title Field (Optional) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-slate-700">
                    बैनर का नाम / शीर्षक (Title / Internal Reference)
                  </label>
                  <span className="text-[10px] text-slate-500 font-medium">
                    (ऐच्छिक / Optional - अनिवार्य नहीं है)
                  </span>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder={hideTextOverlay ? "उदा. Parle Special Offer (केवल रिकॉर्ड के लिए)" : "उदा. दुकानदारों के लिए सीधे डिपो थोक भाव"}
                  className="w-full px-3 py-2 text-xs font-semibold bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                {hideTextOverlay && (
                  <p className="text-[10px] text-blue-600 mt-1">
                    ✓ 'शुद्ध फोटो मोड' चालू है, इसलिए यह नाम केवल आपके रिकॉर्ड में रहेगा, होम स्क्रीन बैनर पर नहीं दिखेगा।
                  </p>
                )}
              </div>

              {/* Subtitle Field */}
              {!hideTextOverlay && (
                <div>
                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                    उप-शीर्षक (Subtitle / Tagline)
                  </label>
                  <input
                    type="text"
                    value={subtitle}
                    onChange={(e) => setSubtitle(e.target.value)}
                    placeholder="उदा. Best Wholesale Rates • Maximum Retailer Margins"
                    className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  />
                </div>
              )}

              {/* Badge, Offer & Footer Details (Only when text overlay is NOT hidden) */}
              {!hideTextOverlay ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        बैज टेक्स्ट (Badge Text)
                      </label>
                      <input
                        type="text"
                        value={badgeText}
                        onChange={(e) => setBadgeText(e.target.value)}
                        placeholder="उदा. थोक व्यापार डिस्काउंट"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        ऑफर टेक्स्ट (Offer / Margin Callout)
                      </label>
                      <input
                        type="text"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        placeholder="उदा. हर पेटी पर ₹20 से ₹60 तक का मुनाफा"
                        className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Brands & Footer notes */}
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      ब्रांड्स या अतिरिक्त टेक्स्ट (Brands / Footer Text)
                    </label>
                    <input
                      type="text"
                      value={accentColor}
                      onChange={(e) => setAccentColor(e.target.value)}
                      placeholder="उदा. Lay's • Kurkure • Parle-G • Amul • Sunfeast"
                      className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                </>
              ) : (
                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-slate-600 text-[11px]">
                  💡 <strong>शुद्ध फोटो मोड:</strong> आपने लिखावट छुपाने का विकल्प चुना है, इसलिए बैनर पर सिर्फ आपकी अपलोड की गई फोटो और 'बाय नाउ' बटन दिखेगा। कोई अन्य टेक्स्ट टाइप करने की आवश्यकता नहीं है।
                </div>
              )}

              {/* Background Color & Gradient Selection */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                  बैकग्राउंड ग्रेडिएंट थीम (Gradient Theme)
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {GRADIENT_PRESETS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => setBgGradient(p.value)}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        bgGradient === p.value
                          ? 'border-blue-600 ring-2 ring-blue-500/30'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className={`h-6 rounded-lg bg-gradient-to-r ${p.value} mb-1.5 shadow-xs`} />
                      <span className="text-[10px] font-bold text-slate-700 block truncate">
                        {p.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Status Switch */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">बैनर सक्रिय रखें (Active Status)</h4>
                  <p className="text-[10.5px] text-slate-500">होम स्क्रीन पर सभी दुकानदारों को यह बैनर दिखेगा</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="save-banner-submit-btn"
                  type="submit"
                  disabled={isSaving || isCompressing}
                  className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm flex items-center space-x-1.5 active:scale-95 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Banner...</span>
                    </>
                  ) : saveSuccess ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                      <span>Saved!</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{editingBanner ? 'Update Banner' : 'Save & Publish Banner'}</span>
                    </>
                  )}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
