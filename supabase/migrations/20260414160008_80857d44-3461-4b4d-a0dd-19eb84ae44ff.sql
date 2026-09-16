
DROP POLICY "Users can acknowledge alerts" ON public.alerts;
CREATE POLICY "Users can acknowledge alerts" ON public.alerts
  FOR UPDATE TO authenticated
  USING (true)
  WITH CHECK (is_read = true AND acknowledged_by = auth.uid());
