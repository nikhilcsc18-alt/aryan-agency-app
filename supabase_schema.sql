-- ====================================================================
-- ARYAN AGENCY FMCG DISTRIBUTION - SUPABASE POSTGRESQL SCHEMA
-- ISO 9001:2015 & GST-Compliant FMCG Wholesale & Distribution System
-- ====================================================================

-- Enable UUID extension for unique primary key generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ====================================================================
-- 1. USERS TABLE (Distributor Admin, Salesmen, Delivery, Retailers)
-- ====================================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'salesman', 'delivery', 'accounts', 'retailer')),
    avatar_url TEXT,
    salesman_id TEXT,
    retailer_id TEXT,
    delivery_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 2. CATEGORIES TABLE (FMCG Product Categories & GST Slabs)
-- ====================================================================
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    description TEXT,
    gst_rate NUMERIC(5,2) DEFAULT 18.00 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 3. BRANDS TABLE (FMCG Principal Manufacturers & Super-Stockists)
-- ====================================================================
CREATE TABLE IF NOT EXISTS brands (
    id TEXT PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    code TEXT UNIQUE NOT NULL,
    company_name TEXT NOT NULL,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 4. PRODUCTS TABLE (Catalogue, Pricing, Stock, Schemes & Batches)
-- ====================================================================
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    sku TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    brand TEXT NOT NULL,
    category TEXT NOT NULL,
    category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
    brand_id TEXT REFERENCES brands(id) ON DELETE SET NULL,
    hsn_code TEXT NOT NULL,
    gst_rate NUMERIC(5,2) DEFAULT 18.00 NOT NULL,
    pieces_per_case INTEGER NOT NULL DEFAULT 24,
    mrp_piece NUMERIC(10,2) NOT NULL,
    wholesale_price_piece NUMERIC(10,2) NOT NULL,
    case_price NUMERIC(10,2) NOT NULL,
    current_stock_cases INTEGER NOT NULL DEFAULT 0,
    current_stock_loose_pcs INTEGER NOT NULL DEFAULT 0,
    reorder_level_cases INTEGER NOT NULL DEFAULT 10,
    image_url TEXT,
    description TEXT,
    batches JSONB DEFAULT '[]'::jsonb,
    active_scheme JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 5. RETAILERS TABLE (Kirana Stores, Supermarkets, Beat & Credit Ledger)
-- ====================================================================
CREATE TABLE IF NOT EXISTS retailers (
    id TEXT PRIMARY KEY,
    store_name TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    address TEXT NOT NULL,
    area TEXT NOT NULL,
    beat_name TEXT NOT NULL,
    gstin TEXT,
    pan_number TEXT,
    credit_limit NUMERIC(12,2) DEFAULT 50000.00 NOT NULL,
    current_outstanding NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    credit_days_allowed INTEGER DEFAULT 14 NOT NULL,
    lat NUMERIC(10,7),
    lng NUMERIC(10,7),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'overdue', 'blocked')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 6. SALESMEN TABLE (Daily Sales Representatives, Beats & Targets)
-- ====================================================================
CREATE TABLE IF NOT EXISTS salesmen (
    id TEXT PRIMARY KEY,
    employee_code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    phone TEXT NOT NULL,
    email TEXT,
    assigned_beats TEXT[] DEFAULT ARRAY[]::TEXT[],
    daily_target_amount NUMERIC(12,2) DEFAULT 75000.00 NOT NULL,
    monthly_target_amount NUMERIC(12,2) DEFAULT 1800000.00 NOT NULL,
    current_month_achieved NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    commission_percentage NUMERIC(5,2) DEFAULT 1.50 NOT NULL,
    today_orders_count INTEGER DEFAULT 0,
    today_sales_amount NUMERIC(12,2) DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'on_leave', 'inactive')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 7. ORDERS TABLE (FMCG Sales Invoices & Bookings)
-- ====================================================================
CREATE TABLE IF NOT EXISTS orders (
    id TEXT PRIMARY KEY DEFAULT ('ord_' || replace(uuid_generate_v4()::text, '-', '')),
    order_number TEXT UNIQUE NOT NULL DEFAULT ('ORD-2026-' || floor(1000 + random() * 9000)::text),
    retailer_id TEXT NOT NULL REFERENCES retailers(id) ON DELETE RESTRICT,
    retailer_name TEXT NOT NULL,
    retailer_phone TEXT,
    retailer_address TEXT,
    retailer_gstin TEXT,
    beat_name TEXT NOT NULL,
    salesman_id TEXT REFERENCES salesmen(id) ON DELETE SET NULL,
    salesman_name TEXT,
    order_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    expected_delivery_date DATE NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(12,2) NOT NULL,
    total_discount NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    total_taxable NUMERIC(12,2) NOT NULL,
    total_cgst NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    total_sgst NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    total_tax NUMERIC(12,2) NOT NULL,
    round_off NUMERIC(6,2) DEFAULT 0.00,
    grand_total NUMERIC(12,2) NOT NULL,
    amount_paid NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    outstanding_amount NUMERIC(12,2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'booked' CHECK (status IN ('draft', 'booked', 'confirmed', 'packed', 'dispatched', 'delivered', 'cancelled')),
    payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
    delivery_run_id TEXT,
    driver_name TEXT,
    vehicle_number TEXT,
    pod_receiver_name TEXT,
    pod_signature TEXT,
    pod_notes TEXT,
    notes TEXT,
    is_interstate BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Guarantee orders.id and order_number defaults so orders.id is never NULL
ALTER TABLE orders ALTER COLUMN id SET DEFAULT ('ord_' || replace(uuid_generate_v4()::text, '-', ''));
ALTER TABLE orders ALTER COLUMN order_number SET DEFAULT ('ORD-2026-' || floor(1000 + random() * 9000)::text);

-- ====================================================================
-- 8. ORDER ITEMS TABLE (Normalized Line Items with Tax & Scheme Details)
-- ====================================================================
CREATE TABLE IF NOT EXISTS order_items (
    id TEXT PRIMARY KEY DEFAULT ('item_' || replace(uuid_generate_v4()::text, '-', '')),
    order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    sku TEXT NOT NULL,
    product_name TEXT NOT NULL,
    brand TEXT,
    category TEXT,
    hsn_code TEXT,
    gst_rate NUMERIC(5,2) DEFAULT 18.00 NOT NULL,
    cases INTEGER NOT NULL DEFAULT 0,
    loose_pcs INTEGER NOT NULL DEFAULT 0,
    total_pieces INTEGER NOT NULL DEFAULT 0,
    unit_price NUMERIC(10,2) NOT NULL,
    gross_amount NUMERIC(12,2) NOT NULL,
    discount_amount NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    taxable_amount NUMERIC(12,2) NOT NULL,
    cgst_amount NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    sgst_amount NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    igst_amount NUMERIC(12,2) DEFAULT 0.00 NOT NULL,
    total_amount NUMERIC(12,2) NOT NULL,
    scheme_applied TEXT,
    free_pcs_awarded INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 9. PAYMENTS TABLE (Collections, Receipts & Retailer Ledger Credits)
-- ====================================================================
CREATE TABLE IF NOT EXISTS payments (
    id TEXT PRIMARY KEY,
    receipt_number TEXT UNIQUE NOT NULL,
    retailer_id TEXT NOT NULL REFERENCES retailers(id) ON DELETE RESTRICT,
    retailer_name TEXT NOT NULL,
    order_id TEXT REFERENCES orders(id) ON DELETE SET NULL,
    order_number TEXT,
    amount NUMERIC(12,2) NOT NULL,
    payment_mode TEXT NOT NULL CHECK (payment_mode IN ('upi', 'cash', 'cheque', 'bank_transfer', 'credit_note')),
    transaction_ref TEXT,
    cheque_number TEXT,
    cheque_date DATE,
    bank_name TEXT,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    collected_by_role TEXT NOT NULL DEFAULT 'admin',
    collector_name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'pending_clearance', 'bounced')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 10. INVENTORY & BATCH STOCK TABLE
-- ====================================================================
CREATE TABLE IF NOT EXISTS inventory (
    id TEXT PRIMARY KEY DEFAULT ('inv_' || replace(uuid_generate_v4()::text, '-', '')),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    sku TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    mfg_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    stock_cases INTEGER NOT NULL DEFAULT 0,
    stock_loose_pcs INTEGER NOT NULL DEFAULT 0,
    warehouse_bin TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS inventory_movements (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL CHECK (type IN ('inward', 'outward_dispatch', 'return_inward', 'damage_adjustment', 'manual_adjustment')),
    product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    product_name TEXT NOT NULL,
    sku TEXT NOT NULL,
    batch_number TEXT NOT NULL,
    cases INTEGER NOT NULL DEFAULT 0,
    loose_pcs INTEGER NOT NULL DEFAULT 0,
    reference_id TEXT NOT NULL,
    date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    performed_by TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- 11. DELIVERIES TABLE (Vehicle Run Sheets & Proof of Delivery POD)
-- ====================================================================
CREATE TABLE IF NOT EXISTS deliveries (
    id TEXT PRIMARY KEY,
    run_number TEXT UNIQUE NOT NULL,
    date DATE NOT NULL,
    driver_name TEXT NOT NULL,
    driver_phone TEXT,
    vehicle_number TEXT NOT NULL,
    beat_names TEXT[] DEFAULT ARRAY[]::TEXT[],
    total_orders INTEGER NOT NULL DEFAULT 0,
    delivered_orders INTEGER NOT NULL DEFAULT 0,
    total_order_value NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_cash_collected NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_upi_collected NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'loading' CHECK (status IN ('loading', 'out_for_delivery', 'completed', 'returned')),
    order_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Synonym view for compatibility with delivery_run_sheets
CREATE OR REPLACE VIEW delivery_run_sheets AS SELECT * FROM deliveries;

-- ====================================================================
-- PERFORMANCE INDEXES
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand);
CREATE INDEX IF NOT EXISTS idx_retailers_beat ON retailers(beat_name);
CREATE INDEX IF NOT EXISTS idx_retailers_status ON retailers(status);
CREATE INDEX IF NOT EXISTS idx_orders_retailer ON orders(retailer_id);
CREATE INDEX IF NOT EXISTS idx_orders_salesman ON orders(salesman_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_payments_retailer ON payments(retailer_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_batch ON inventory(batch_number);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES & ROLE-BASED ACCESS CONTROL
-- ====================================================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;
ALTER TABLE salesmen ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Security Definer Helpers to resolve authenticated user roles safely
CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS TEXT AS $$
DECLARE
    usr_role TEXT;
BEGIN
    SELECT role INTO usr_role 
    FROM public.users 
    WHERE id = auth.uid()::text OR email = auth.jwt()->>'email' 
    LIMIT 1;

    IF usr_role IS NULL THEN
        usr_role := coalesce(auth.jwt()->'user_metadata'->>'role', 'anon');
    END IF;

    RETURN usr_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (get_auth_role() = 'admin' OR auth.role() = 'service_role');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_salesman()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (get_auth_role() = 'salesman');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_delivery()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (get_auth_role() = 'delivery');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_accounts()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (get_auth_role() = 'accounts');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_retailer()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN (get_auth_role() = 'retailer');
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Retrieve authoritative Retailer ID for current authenticated user
CREATE OR REPLACE FUNCTION get_auth_retailer_id()
RETURNS TEXT AS $$
DECLARE
    v_ret_id TEXT;
BEGIN
    -- 1. Check retailer_id on users table
    SELECT retailer_id INTO v_ret_id 
    FROM public.users 
    WHERE id = auth.uid()::text OR email = auth.jwt()->>'email'
    LIMIT 1;
    
    IF v_ret_id IS NOT NULL AND v_ret_id <> '' THEN
        RETURN v_ret_id;
    END IF;

    -- 2. Fallback: match by email on retailers table
    SELECT id INTO v_ret_id 
    FROM public.retailers 
    WHERE lower(email) = lower(auth.jwt()->>'email')
    LIMIT 1;

    RETURN v_ret_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Clean up any prior policies
DO $$ 
DECLARE 
    tbl TEXT;
BEGIN
    FOR tbl IN 
        SELECT unnest(ARRAY[
            'users', 'categories', 'brands', 'products', 'retailers', 
            'salesmen', 'orders', 'order_items', 'payments', 
            'inventory', 'inventory_movements', 'deliveries'
        ])
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "allow_all_ops_on_%I" ON %I;', tbl, tbl);
    END LOOP;
END $$;

-- 1. USERS RLS POLICIES
DROP POLICY IF EXISTS "users_select_policy" ON users;
CREATE POLICY "users_select_policy" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "users_insert_policy" ON users;
CREATE POLICY "users_insert_policy" ON users FOR INSERT WITH CHECK (
    is_admin() OR (role = 'retailer')
);

DROP POLICY IF EXISTS "users_update_policy" ON users;
CREATE POLICY "users_update_policy" ON users FOR UPDATE USING (
    is_admin() OR id = auth.uid()::text OR email = auth.jwt()->>'email'
) WITH CHECK (
    is_admin() OR (role = (SELECT u.role FROM public.users u WHERE u.id = auth.uid()::text))
);

DROP POLICY IF EXISTS "users_delete_policy" ON users;
CREATE POLICY "users_delete_policy" ON users FOR DELETE USING (is_admin());

-- 2. CATEGORIES & BRANDS RLS POLICIES
DROP POLICY IF EXISTS "categories_select_policy" ON categories;
CREATE POLICY "categories_select_policy" ON categories FOR SELECT USING (true);
DROP POLICY IF EXISTS "categories_admin_all" ON categories;
CREATE POLICY "categories_admin_all" ON categories FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "brands_select_policy" ON brands;
CREATE POLICY "brands_select_policy" ON brands FOR SELECT USING (true);
DROP POLICY IF EXISTS "brands_admin_all" ON brands;
CREATE POLICY "brands_admin_all" ON brands FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 3. PRODUCTS RLS POLICIES (Read-only for Salesman/Delivery/Accounts, Write for Admin)
DROP POLICY IF EXISTS "products_select_policy" ON products;
CREATE POLICY "products_select_policy" ON products FOR SELECT USING (true);

DROP POLICY IF EXISTS "products_admin_modify" ON products;
CREATE POLICY "products_admin_modify" ON products FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "products_admin_update" ON products;
CREATE POLICY "products_admin_update" ON products FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "products_admin_delete" ON products;
CREATE POLICY "products_admin_delete" ON products FOR DELETE USING (is_admin());

-- 4. RETAILERS RLS POLICIES
-- Admin, Salesman, Accounts can view/manage retailers.
-- Retailer accounts can ONLY SELECT and UPDATE their own retailer profile!
DROP POLICY IF EXISTS "retailers_select_policy" ON retailers;
CREATE POLICY "retailers_select_policy" ON retailers FOR SELECT USING (
    is_admin() OR is_salesman() OR is_accounts() OR
    (is_retailer() AND (id = get_auth_retailer_id() OR lower(email) = lower(auth.jwt()->>'email')))
);

DROP POLICY IF EXISTS "retailers_insert_policy" ON retailers;
CREATE POLICY "retailers_insert_policy" ON retailers FOR INSERT WITH CHECK (
    is_admin() OR is_salesman() OR
    (is_retailer() AND (id = get_auth_retailer_id() OR lower(email) = lower(auth.jwt()->>'email')))
);

DROP POLICY IF EXISTS "retailers_update_policy" ON retailers;
CREATE POLICY "retailers_update_policy" ON retailers FOR UPDATE USING (
    is_admin() OR is_salesman() OR is_accounts() OR
    (is_retailer() AND (id = get_auth_retailer_id() OR lower(email) = lower(auth.jwt()->>'email')))
) WITH CHECK (
    is_admin() OR is_salesman() OR is_accounts() OR
    (is_retailer() AND (id = get_auth_retailer_id() OR lower(email) = lower(auth.jwt()->>'email')))
);

DROP POLICY IF EXISTS "retailers_delete_policy" ON retailers;
CREATE POLICY "retailers_delete_policy" ON retailers FOR DELETE USING (is_admin());

-- 5. SALESMEN RLS POLICIES (Admin manages, all can view)
DROP POLICY IF EXISTS "salesmen_select_policy" ON salesmen;
CREATE POLICY "salesmen_select_policy" ON salesmen FOR SELECT USING (true);

DROP POLICY IF EXISTS "salesmen_admin_modify" ON salesmen;
CREATE POLICY "salesmen_admin_modify" ON salesmen FOR INSERT WITH CHECK (is_admin());
DROP POLICY IF EXISTS "salesmen_admin_update" ON salesmen;
CREATE POLICY "salesmen_admin_update" ON salesmen FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "salesmen_admin_delete" ON salesmen;
CREATE POLICY "salesmen_admin_delete" ON salesmen FOR DELETE USING (is_admin());

-- 6. ORDERS RLS POLICIES
-- Admin, Salesman, Accounts can view orders; Delivery views assigned/packed orders.
-- Retailer accounts can ONLY view and place orders belonging to their own retailer profile!
DROP POLICY IF EXISTS "orders_select_policy" ON orders;
CREATE POLICY "orders_select_policy" ON orders FOR SELECT USING (
    is_admin() OR is_salesman() OR is_delivery() OR is_accounts() OR
    (is_retailer() AND (retailer_id = get_auth_retailer_id() OR retailer_id IN (
        SELECT r.id FROM public.retailers r WHERE lower(r.email) = lower(auth.jwt()->>'email')
    )))
);

DROP POLICY IF EXISTS "orders_insert_policy" ON orders;
CREATE POLICY "orders_insert_policy" ON orders FOR INSERT WITH CHECK (
    is_admin() OR is_salesman() OR
    (is_retailer() AND (retailer_id = get_auth_retailer_id() OR retailer_id IN (
        SELECT r.id FROM public.retailers r WHERE lower(r.email) = lower(auth.jwt()->>'email')
    )))
);

DROP POLICY IF EXISTS "orders_update_policy" ON orders;
CREATE POLICY "orders_update_policy" ON orders FOR UPDATE USING (
    is_admin() OR is_salesman() OR is_delivery() OR is_accounts()
);

DROP POLICY IF EXISTS "orders_delete_policy" ON orders;
CREATE POLICY "orders_delete_policy" ON orders FOR DELETE USING (is_admin());

-- 7. ORDER ITEMS RLS POLICIES
-- Retailer can ONLY view order items for orders belonging to their own retailer profile!
DROP POLICY IF EXISTS "order_items_select_policy" ON order_items;
CREATE POLICY "order_items_select_policy" ON order_items FOR SELECT USING (
    is_admin() OR is_salesman() OR is_delivery() OR is_accounts() OR
    (is_retailer() AND order_id IN (
        SELECT o.id FROM public.orders o 
        WHERE o.retailer_id = get_auth_retailer_id() OR o.retailer_id IN (
            SELECT r.id FROM public.retailers r WHERE lower(r.email) = lower(auth.jwt()->>'email')
        )
    ))
);

DROP POLICY IF EXISTS "order_items_insert_policy" ON order_items;
CREATE POLICY "order_items_insert_policy" ON order_items FOR INSERT WITH CHECK (
    is_admin() OR is_salesman() OR
    (is_retailer() AND order_id IN (
        SELECT o.id FROM public.orders o 
        WHERE o.retailer_id = get_auth_retailer_id() OR o.retailer_id IN (
            SELECT r.id FROM public.retailers r WHERE lower(r.email) = lower(auth.jwt()->>'email')
        )
    ))
);

DROP POLICY IF EXISTS "order_items_admin_modify" ON order_items;
CREATE POLICY "order_items_admin_modify" ON order_items FOR UPDATE USING (is_admin());
DROP POLICY IF EXISTS "order_items_admin_delete" ON order_items;
CREATE POLICY "order_items_admin_delete" ON order_items FOR DELETE USING (is_admin());

-- 8. PAYMENTS RLS POLICIES
-- Admin and Accounts manage collections; Salesman and Delivery record receipts.
-- Retailer can ONLY view payment receipts recorded for their own retailer profile!
DROP POLICY IF EXISTS "payments_select_policy" ON payments;
CREATE POLICY "payments_select_policy" ON payments FOR SELECT USING (
    is_admin() OR is_accounts() OR is_salesman() OR is_delivery() OR
    (is_retailer() AND (retailer_id = get_auth_retailer_id() OR retailer_id IN (
        SELECT r.id FROM public.retailers r WHERE lower(r.email) = lower(auth.jwt()->>'email')
    )))
);

DROP POLICY IF EXISTS "payments_insert_policy" ON payments;
CREATE POLICY "payments_insert_policy" ON payments FOR INSERT WITH CHECK (
    is_admin() OR is_accounts() OR is_salesman() OR is_delivery() OR
    (is_retailer() AND (retailer_id = get_auth_retailer_id() OR retailer_id IN (
        SELECT r.id FROM public.retailers r WHERE lower(r.email) = lower(auth.jwt()->>'email')
    )))
);

DROP POLICY IF EXISTS "payments_update_policy" ON payments;
CREATE POLICY "payments_update_policy" ON payments FOR UPDATE USING (
    is_admin() OR is_accounts()
);

DROP POLICY IF EXISTS "payments_delete_policy" ON payments;
CREATE POLICY "payments_delete_policy" ON payments FOR DELETE USING (is_admin());

-- 9. DELIVERIES RLS POLICIES
-- Admin creates & dispatches; Delivery partner updates status and POD
DROP POLICY IF EXISTS "deliveries_select_policy" ON deliveries;
CREATE POLICY "deliveries_select_policy" ON deliveries FOR SELECT USING (true);

DROP POLICY IF EXISTS "deliveries_insert_policy" ON deliveries;
CREATE POLICY "deliveries_insert_policy" ON deliveries FOR INSERT WITH CHECK (is_admin() OR auth.role() = 'anon');

DROP POLICY IF EXISTS "deliveries_update_policy" ON deliveries;
CREATE POLICY "deliveries_update_policy" ON deliveries FOR UPDATE USING (
    is_admin() OR is_delivery() OR auth.role() = 'anon'
);

DROP POLICY IF EXISTS "deliveries_delete_policy" ON deliveries;
CREATE POLICY "deliveries_delete_policy" ON deliveries FOR DELETE USING (is_admin());

-- 10. INVENTORY & BATCH MOVEMENTS RLS POLICIES
DROP POLICY IF EXISTS "inventory_select_policy" ON inventory;
CREATE POLICY "inventory_select_policy" ON inventory FOR SELECT USING (true);
DROP POLICY IF EXISTS "inventory_admin_all" ON inventory;
CREATE POLICY "inventory_admin_all" ON inventory FOR ALL USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "movements_select_policy" ON inventory_movements;
CREATE POLICY "movements_select_policy" ON inventory_movements FOR SELECT USING (true);
DROP POLICY IF EXISTS "movements_admin_all" ON inventory_movements;
CREATE POLICY "movements_admin_all" ON inventory_movements FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Automatic User Sync Trigger on Supabase Auth SignUp
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    assigned_role user_role := 'retailer';
BEGIN
    -- Security Rule: Never trust client-provided role metadata during public self-signup.
    -- All new registrations strictly receive the safe default 'retailer' role.
    -- Privileged roles (admin, salesman, delivery, accounts) can only be granted by an authenticated Admin.
    INSERT INTO public.users (id, name, email, phone, role)
    VALUES (
        new.id::text,
        coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.email,
        coalesce(new.raw_user_meta_data->>'phone', '+91 98000 00000'),
        assigned_role
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        name = EXCLUDED.name,
        updated_at = timezone('utc'::text, now());
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Enable Real-Time Replication if supported
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE users, products, retailers, salesmen, orders, order_items, payments, inventory, deliveries;
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- ====================================================================
-- SEED DATA (ARYAN AGENCY FMCG DISTRIBUTION MASTER DATA)
-- ====================================================================

-- 1. Categories Seed
INSERT INTO categories (id, name, code, description, gst_rate) VALUES
('cat_1', 'Biscuits & Bakery', 'BAKERY', 'Biscuits, cookies, rusks and bakery products', 18.00),
('cat_2', 'Beverages', 'BEV', 'Juices, health drinks, tea and coffees', 12.00),
('cat_3', 'Spices & Staples', 'STAPLES', 'Packaged spices, cooking oils, flour and pulses', 5.00),
('cat_4', 'Personal Care', 'PERSONAL', 'Soaps, shampoos, oral care and skin care', 18.00),
('cat_5', 'Confectionery & Chocolates', 'CONF', 'Chocolates, candies, toffees and gums', 18.00),
('cat_6', 'Snacks & Namkeen', 'SNACKS', 'Potato chips, namkeens and extruded snacks', 12.00),
('cat_7', 'Dairy & Refrigerated', 'DAIRY', 'Ghee, butter, cheese and dairy products', 12.00),
('cat_8', 'Household & Hygiene', 'HOUSEHOLD', 'Detergents, cleaners, dishwash and dish bars', 18.00)
ON CONFLICT (id) DO NOTHING;

-- 2. Brands Seed
INSERT INTO brands (id, name, code, company_name) VALUES
('brd_1', 'Parle', 'PARLE', 'Parle Products Pvt. Ltd.'),
('brd_2', 'Britannia', 'BRIT', 'Britannia Industries Ltd.'),
('brd_3', 'ITC Sunfeast', 'ITC', 'ITC Limited'),
('brd_4', 'Cadbury', 'MONDELEZ', 'Mondelez India Foods Ltd.'),
('brd_5', 'Tata Tea', 'TATA', 'Tata Consumer Products Ltd.'),
('brd_6', 'Amul', 'GCMMF', 'Gujarat Co-operative Milk Marketing Federation'),
('brd_7', 'Hindustan Unilever', 'HUL', 'Hindustan Unilever Limited'),
('brd_8', 'Nestle', 'NESTLE', 'Nestle India Limited')
ON CONFLICT (id) DO NOTHING;

-- 3. Users Seed
INSERT INTO users (id, name, email, phone, role, avatar_url) VALUES
('usr_admin', 'Aryan Sharma', 'aryan@aryanagency.in', '+91 98450 12345', 'admin', 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'),
('usr_sales_1', 'Rajesh Kumar', 'rajesh.sales@aryanagency.in', '+91 98860 34567', 'salesman', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80'),
('usr_sales_2', 'Vikram Singh', 'vikram.sales@aryanagency.in', '+91 99001 56789', 'salesman', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80'),
('usr_delivery_1', 'Suresh Gowda (Van KA-05-AB-1234)', 'suresh.van1@aryanagency.in', '+91 97410 78901', 'delivery', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80'),
('usr_accounts_1', 'Pooja Agarwal (Accounts Head)', 'pooja.accounts@aryanagency.in', '+91 98450 67890', 'accounts', 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80')
ON CONFLICT (id) DO NOTHING;

-- 4. Salesmen Seed
INSERT INTO salesmen (id, employee_code, name, phone, email, assigned_beats, daily_target_amount, monthly_target_amount, current_month_achieved, commission_percentage, today_orders_count, today_sales_amount, status) VALUES
('slm_1', 'EMP-0101', 'Rajesh Kumar', '+91 98860 34567', 'rajesh.sales@aryanagency.in', ARRAY['Malleswaram Beat', 'Yeshwanthpur Main Beat', 'Rajajinagar 1st Block'], 75000.00, 1800000.00, 1425000.00, 1.50, 6, 68450.00, 'active'),
('slm_2', 'EMP-0102', 'Vikram Singh', '+91 99001 56789', 'vikram.sales@aryanagency.in', ARRAY['Indiranagar 100ft Beat', 'Koramangala 4th Block Beat', 'HSR Sector 1 Beat'], 85000.00, 2100000.00, 1860000.00, 1.75, 8, 89200.00, 'active'),
('slm_3', 'EMP-0103', 'Anil Deshmukh', '+91 98440 11223', 'anil.sales@aryanagency.in', ARRAY['Jayanagar 4th T Block', 'JP Nagar Phase 2 Beat', 'Banashankari 2nd Stage'], 65000.00, 1600000.00, 1290000.00, 1.50, 5, 54200.00, 'active')
ON CONFLICT (id) DO NOTHING;

-- 5. Retailers Seed
-- NOTE: Hardcoded sample retailers (such as Laxmi Supermarket, Ganesh Daily Needs, etc.)
-- have been removed to guarantee 100% data isolation for retail partners.
-- Each retail partner registers with their own outlet or is onboarded cleanly by distributor admin.

-- 6. Products Seed
INSERT INTO products (id, sku, name, brand, category, hsn_code, gst_rate, pieces_per_case, mrp_piece, wholesale_price_piece, case_price, current_stock_cases, current_stock_loose_pcs, reorder_level_cases, image_url, description, batches, active_scheme) VALUES
('prd_1', 'PARLE-G-80G', 'Parle-G Glucose Biscuit (80g)', 'Parle', 'Biscuits & Bakery', '19053100', 18.00, 60, 10.00, 8.40, 504.00, 85, 14, 25, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=500&auto=format&fit=crop&q=80', 'Original glucose energy biscuit, India''s largest selling brand. 80g standard retail pack.', '[{"batchNumber":"PAR-26A-01","mfgDate":"2026-07-10","expiryDate":"2027-01-10","stockCases":50,"stockLoosePcs":14,"warehouseBin":"A-01-01"},{"batchNumber":"PAR-26A-02","mfgDate":"2026-08-01","expiryDate":"2027-02-01","stockCases":35,"stockLoosePcs":0,"warehouseBin":"A-01-02"}]'::jsonb, '{"id":"sch_1","title":"Monsoon Display Scheme 10+1","description":"Buy 10 cases get 1 case Parle-G 80g free","minQtyCases":10,"freeQtyPcs":60,"isActive":true}'::jsonb),
('prd_2', 'GOOD-DAY-BUTTER-100G', 'Britannia Good Day Butter Cookies (100g)', 'Britannia', 'Biscuits & Bakery', '19053100', 18.00, 48, 30.00, 25.20, 1209.60, 42, 8, 15, 'https://images.unsplash.com/photo-1590080875515-8a3a8dc5735e?w=500&auto=format&fit=crop&q=80', 'Rich butter cookies with signature cashew smile cut pattern.', '[{"batchNumber":"BRIT-GD-881","mfgDate":"2026-06-15","expiryDate":"2026-12-15","stockCases":42,"stockLoosePcs":8,"warehouseBin":"A-02-01"}]'::jsonb, '{"id":"sch_2","title":"Special 5% Cash Discount","description":"Flat 5% trade discount on 5+ cases","minQtyCases":5,"discountPercentage":5,"isActive":true}'::jsonb),
('prd_3', 'CADBURY-DAIRYMILK-50G', 'Cadbury Dairy Milk Chocolate (50g)', 'Cadbury', 'Confectionery & Chocolates', '18063200', 18.00, 36, 45.00, 38.25, 1377.00, 60, 4, 20, 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=500&auto=format&fit=crop&q=80', 'Smooth milk chocolate bar, temperature controlled storage.', '[{"batchNumber":"CAD-DM-092","mfgDate":"2026-07-20","expiryDate":"2027-04-20","stockCases":60,"stockLoosePcs":4,"warehouseBin":"C-COLD-01"}]'::jsonb, '{"id":"sch_3","title":"Chocolate Festival 12+1","description":"Buy 12 cases get 1 case Dairy Milk 50g free","minQtyCases":12,"freeQtyPcs":36,"isActive":true}'::jsonb),
('prd_4', 'TATA-GOLD-TEA-500G', 'Tata Tea Gold Leaf (500g Jar Pack)', 'Tata Tea', 'Beverages', '09024020', 5.00, 24, 310.00, 275.00, 6600.00, 28, 0, 10, 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=500&auto=format&fit=crop&q=80', 'Exquisite tea blend with 15% gently rolled long tea leaves for rich aroma.', '[{"batchNumber":"TAT-GLD-441","mfgDate":"2026-05-10","expiryDate":"2027-05-10","stockCases":28,"stockLoosePcs":0,"warehouseBin":"B-03-01"}]'::jsonb, NULL),
('prd_5', 'AMUL-PURE-GHEE-1L', 'Amul Pure Cow Ghee (1L Tin)', 'Amul', 'Dairy & Refrigerated', '04059020', 12.00, 12, 650.00, 585.00, 7020.00, 18, 2, 8, 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?w=500&auto=format&fit=crop&q=80', 'Pure aromatic cow ghee from Anand, Gujarat. Superstockist primary item.', '[{"batchNumber":"AML-GHEE-201","mfgDate":"2026-06-01","expiryDate":"2027-03-01","stockCases":18,"stockLoosePcs":2,"warehouseBin":"D-01-01"}]'::jsonb, NULL),
('prd_6', 'AASHIRVAAD-ATTA-10KG', 'Aashirvaad Superior Sharbati Atta (10kg)', 'ITC Sunfeast', 'Spices & Staples', '11010000', 5.00, 4, 480.00, 430.00, 1720.00, 55, 0, 15, 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=500&auto=format&fit=crop&q=80', '100% pure whole wheat chakki atta with 4-step advantage.', '[{"batchNumber":"ITC-AASH-771","mfgDate":"2026-07-25","expiryDate":"2026-10-25","stockCases":55,"stockLoosePcs":0,"warehouseBin":"B-01-01"}]'::jsonb, NULL)
ON CONFLICT (id) DO NOTHING;

-- 7. Orders & Invoices Seed
-- Production isolation: Orders, Order Items, Payments and Deliveries start clean.
-- All transactions are generated from actual retailer indents and distributor fulfillment.
