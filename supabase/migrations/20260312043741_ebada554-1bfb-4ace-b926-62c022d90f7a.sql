CREATE TABLE public.debug_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  debug_id uuid NOT NULL REFERENCES public.shared_debugs(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Anonymous',
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.debug_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read debug comments"
ON public.debug_comments
FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can insert debug comments"
ON public.debug_comments
FOR INSERT
TO anon, authenticated
WITH CHECK (true);
