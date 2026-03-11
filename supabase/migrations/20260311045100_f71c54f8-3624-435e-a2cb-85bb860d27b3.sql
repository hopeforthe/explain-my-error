CREATE TABLE public.shared_debugs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  input_text TEXT NOT NULL,
  input_mode TEXT NOT NULL DEFAULT 'error',
  result JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_debugs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shared debugs"
  ON public.shared_debugs
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert shared debugs"
  ON public.shared_debugs
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);