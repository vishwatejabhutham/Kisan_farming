
CREATE POLICY "Public can view reports" ON public.disease_reports FOR SELECT TO anon USING (true);
CREATE POLICY "Public can view alerts" ON public.alerts FOR SELECT TO anon USING (true);
CREATE POLICY "Public can view inventory" ON public.inventory FOR SELECT TO anon USING (true);
CREATE POLICY "Public can view analytics" ON public.analytics_snapshots FOR SELECT TO anon USING (true);
