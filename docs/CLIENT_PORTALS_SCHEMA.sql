-- =========================================================
-- TY STUDIO CLIENT PROJECT PORTALS & ROADMAPS DATABASE SCHEMA
-- Execute this script in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/jphgtjsanffsiqrkhdmo/sql
-- =========================================================

-- 1. Create client_portals table
CREATE TABLE IF NOT EXISTS public.client_portals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_name TEXT NOT NULL,
    project_title TEXT NOT NULL,
    token TEXT UNIQUE NOT NULL,
    client_logo_url TEXT,
    status TEXT DEFAULT 'In Progress',
    start_date DATE,
    target_delivery_date DATE,
    budget_total NUMERIC DEFAULT 0,
    deposit_paid NUMERIC DEFAULT 0,
    invoice_status TEXT DEFAULT 'Deposit Paid',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create portal_phases table
CREATE TABLE IF NOT EXISTS public.portal_phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portal_id UUID NOT NULL REFERENCES public.client_portals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'inactive', -- 'active', 'completed', 'inactive'
    sort_order INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create phase_presentations table (versioned decks linked to phases)
CREATE TABLE IF NOT EXISTS public.phase_presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_id UUID NOT NULL REFERENCES public.portal_phases(id) ON DELETE CASCADE,
    presentation_id UUID NOT NULL REFERENCES public.presentations(id) ON DELETE CASCADE,
    version_label TEXT NOT NULL DEFAULT 'v1 - Initial Concepts',
    is_current_version BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create portal_files table (downloadable final deliverables hub)
CREATE TABLE IF NOT EXISTS public.portal_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    portal_id UUID NOT NULL REFERENCES public.client_portals(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES public.portal_phases(id) ON DELETE SET NULL,
    filename TEXT NOT NULL,
    file_url TEXT NOT NULL,
    category TEXT DEFAULT 'Deliverables',
    file_size TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enables public read and client collaboration
-- =========================================================

ALTER TABLE public.client_portals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.phase_presentations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portal_files ENABLE ROW LEVEL SECURITY;

-- client_portals policies
DROP POLICY IF EXISTS "Allow public read client_portals" ON public.client_portals;
CREATE POLICY "Allow public read client_portals" ON public.client_portals FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public insert client_portals" ON public.client_portals;
CREATE POLICY "Allow public insert client_portals" ON public.client_portals FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update client_portals" ON public.client_portals;
CREATE POLICY "Allow public update client_portals" ON public.client_portals FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Allow public delete client_portals" ON public.client_portals;
CREATE POLICY "Allow public delete client_portals" ON public.client_portals FOR DELETE TO public USING (true);

-- portal_phases policies
DROP POLICY IF EXISTS "Allow public read portal_phases" ON public.portal_phases;
CREATE POLICY "Allow public read portal_phases" ON public.portal_phases FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public insert portal_phases" ON public.portal_phases;
CREATE POLICY "Allow public insert portal_phases" ON public.portal_phases FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update portal_phases" ON public.portal_phases;
CREATE POLICY "Allow public update portal_phases" ON public.portal_phases FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Allow public delete portal_phases" ON public.portal_phases;
CREATE POLICY "Allow public delete portal_phases" ON public.portal_phases FOR DELETE TO public USING (true);

-- phase_presentations policies
DROP POLICY IF EXISTS "Allow public read phase_presentations" ON public.phase_presentations;
CREATE POLICY "Allow public read phase_presentations" ON public.phase_presentations FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public insert phase_presentations" ON public.phase_presentations;
CREATE POLICY "Allow public insert phase_presentations" ON public.phase_presentations FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update phase_presentations" ON public.phase_presentations;
CREATE POLICY "Allow public update phase_presentations" ON public.phase_presentations FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Allow public delete phase_presentations" ON public.phase_presentations;
CREATE POLICY "Allow public delete phase_presentations" ON public.phase_presentations FOR DELETE TO public USING (true);

-- portal_files policies
DROP POLICY IF EXISTS "Allow public read portal_files" ON public.portal_files;
CREATE POLICY "Allow public read portal_files" ON public.portal_files FOR SELECT TO public USING (true);

DROP POLICY IF EXISTS "Allow public insert portal_files" ON public.portal_files;
CREATE POLICY "Allow public insert portal_files" ON public.portal_files FOR INSERT TO public WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update portal_files" ON public.portal_files;
CREATE POLICY "Allow public update portal_files" ON public.portal_files FOR UPDATE TO public USING (true);

DROP POLICY IF EXISTS "Allow public delete portal_files" ON public.portal_files;
CREATE POLICY "Allow public delete portal_files" ON public.portal_files FOR DELETE TO public USING (true);
