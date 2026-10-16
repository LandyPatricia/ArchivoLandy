
DO $$ BEGIN
  CREATE TYPE public.photo_type AS ENUM ('retrato','coronacion','carro_alegorico','vestido','familia','prensa','grupo','otro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.usage_permission AS ENUM ('autorizado','dominio_publico','uso_editorial','pendiente');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  storage_path text NOT NULL,
  url text NOT NULL,
  mime_type text,
  width int,
  height int,
  bytes int,
  title text,
  caption text,
  alt_text text,
  tags text[] NOT NULL DEFAULT '{}',
  photo_type public.photo_type NOT NULL DEFAULT 'otro',
  person_id uuid REFERENCES public.people(id) ON DELETE SET NULL,
  edition_id uuid REFERENCES public.editions(id) ON DELETE SET NULL,
  municipality_id uuid REFERENCES public.municipalities(id) ON DELETE SET NULL,
  story_id uuid REFERENCES public.stories(id) ON DELETE SET NULL,
  year int,
  credit_author text,
  credit_source text,
  usage_permission public.usage_permission NOT NULL DEFAULT 'pendiente',
  verification public.verification_status NOT NULL DEFAULT 'community',
  is_featured boolean NOT NULL DEFAULT false,
  is_cover boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT media_assets_has_target CHECK (
    person_id IS NOT NULL OR edition_id IS NOT NULL OR municipality_id IS NOT NULL OR story_id IS NOT NULL OR is_featured
  )
);

CREATE INDEX media_assets_person_idx ON public.media_assets(person_id);
CREATE INDEX media_assets_edition_idx ON public.media_assets(edition_id);
CREATE INDEX media_assets_municipality_idx ON public.media_assets(municipality_id);
CREATE INDEX media_assets_story_idx ON public.media_assets(story_id);
CREATE INDEX media_assets_featured_idx ON public.media_assets(is_featured) WHERE is_featured;

GRANT SELECT ON public.media_assets TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.media_assets TO authenticated;
GRANT ALL ON public.media_assets TO service_role;

ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media public read"
  ON public.media_assets FOR SELECT
  USING (usage_permission <> 'pendiente');

CREATE POLICY "media admin read all"
  ON public.media_assets FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "media admin insert"
  ON public.media_assets FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "media admin update"
  ON public.media_assets FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "media admin delete"
  ON public.media_assets FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER media_assets_set_updated_at
  BEFORE UPDATE ON public.media_assets
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage policies for archivo-media bucket (bucket created via tool separately)
CREATE POLICY "archivo-media public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'archivo-media');

CREATE POLICY "archivo-media admin insert"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'archivo-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "archivo-media admin update"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'archivo-media' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "archivo-media admin delete"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'archivo-media' AND public.has_role(auth.uid(), 'admin'));
