ALTER TABLE public.media_assets ADD COLUMN IF NOT EXISTS photo_flags text[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.media_people (
  media_id uuid NOT NULL REFERENCES public.media_assets(id) ON DELETE CASCADE,
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  is_primary boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (media_id, person_id)
);

GRANT SELECT ON public.media_people TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.media_people TO authenticated;
GRANT ALL ON public.media_people TO service_role;

ALTER TABLE public.media_people ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read media_people" ON public.media_people FOR SELECT USING (true);
CREATE POLICY "admin write media_people" ON public.media_people FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.media_people (media_id, person_id, is_primary)
SELECT id, person_id, true FROM public.media_assets WHERE person_id IS NOT NULL
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_media_people_person ON public.media_people(person_id);
CREATE INDEX IF NOT EXISTS idx_media_assets_flags ON public.media_assets USING GIN (photo_flags);