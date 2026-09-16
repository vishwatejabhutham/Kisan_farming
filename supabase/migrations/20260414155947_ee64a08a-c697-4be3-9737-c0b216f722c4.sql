
-- Create enums
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');
CREATE TYPE public.severity_level AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE public.trend_direction AS ENUM ('rising', 'falling', 'stable');
CREATE TYPE public.urgency_level AS ENUM ('CRITICAL', 'HIGH', 'MEDIUM', 'LOW');

-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- User roles table FIRST
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Role check function (now user_roles exists)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS for user_roles
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Disease reports
CREATE TABLE public.disease_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  district TEXT NOT NULL,
  mandal TEXT,
  crop TEXT NOT NULL,
  disease TEXT NOT NULL,
  cases INTEGER NOT NULL DEFAULT 0,
  severity severity_level NOT NULL DEFAULT 'medium',
  trend trend_direction NOT NULL DEFAULT 'stable',
  trend_pct NUMERIC DEFAULT 0,
  latitude NUMERIC,
  longitude NUMERIC,
  reported_by UUID REFERENCES auth.users(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.disease_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view reports" ON public.disease_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated can create reports" ON public.disease_reports FOR INSERT TO authenticated WITH CHECK (auth.uid() = reported_by);
CREATE POLICY "Users can update own reports" ON public.disease_reports FOR UPDATE TO authenticated USING (auth.uid() = reported_by);
CREATE POLICY "Users can delete own reports" ON public.disease_reports FOR DELETE TO authenticated USING (auth.uid() = reported_by);
CREATE TRIGGER update_disease_reports_updated_at BEFORE UPDATE ON public.disease_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_disease_reports_district ON public.disease_reports(district);
CREATE INDEX idx_disease_reports_disease ON public.disease_reports(disease);
CREATE INDEX idx_disease_reports_created ON public.disease_reports(created_at);

-- Inventory
CREATE TABLE public.inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product TEXT NOT NULL,
  district TEXT NOT NULL,
  mandal TEXT,
  urgency urgency_level NOT NULL DEFAULT 'MEDIUM',
  stock_units INTEGER NOT NULL DEFAULT 0,
  estimated_demand INTEGER NOT NULL DEFAULT 0,
  confidence NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view inventory" ON public.inventory FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage inventory" ON public.inventory FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON public.inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Alerts
CREATE TABLE public.alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  severity severity_level NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT,
  district TEXT,
  mandal TEXT,
  disease TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  acknowledged_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view alerts" ON public.alerts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can create alerts" ON public.alerts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can acknowledge alerts" ON public.alerts FOR UPDATE TO authenticated USING (true);
CREATE TRIGGER update_alerts_updated_at BEFORE UPDATE ON public.alerts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_alerts_severity ON public.alerts(severity);
CREATE INDEX idx_alerts_created ON public.alerts(created_at);

-- Analytics snapshots
CREATE TABLE public.analytics_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  district TEXT NOT NULL,
  disease TEXT,
  crop TEXT,
  new_cases INTEGER DEFAULT 0,
  total_cases INTEGER DEFAULT 0,
  trend trend_direction DEFAULT 'stable',
  predicted_cases INTEGER,
  risk_score NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.analytics_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated can view analytics" ON public.analytics_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can insert analytics" ON public.analytics_snapshots FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_analytics_date ON public.analytics_snapshots(date);
CREATE INDEX idx_analytics_district ON public.analytics_snapshots(district);
