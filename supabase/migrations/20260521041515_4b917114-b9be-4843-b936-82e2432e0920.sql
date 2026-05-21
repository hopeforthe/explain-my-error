
-- shared_debugs: public read
CREATE POLICY "Anyone can view shared debugs"
ON public.shared_debugs FOR SELECT
USING (true);

-- debug_comments: public read + public insert (used by edge fn but also safe for client)
CREATE POLICY "Anyone can view debug comments"
ON public.debug_comments FOR SELECT
USING (true);

CREATE POLICY "Anyone can add debug comments"
ON public.debug_comments FOR INSERT
WITH CHECK (
  content IS NOT NULL
  AND length(content) <= 5000
  AND length(coalesce(author_name, '')) <= 100
);

-- rate_limits: deny all client access (service role bypasses RLS)
CREATE POLICY "No client access to rate limits"
ON public.rate_limits FOR ALL
USING (false)
WITH CHECK (false);

-- Lock down SECURITY DEFINER cleanup function
REVOKE EXECUTE ON FUNCTION public.cleanup_rate_limits() FROM PUBLIC, anon, authenticated;
