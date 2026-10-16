
-- === ENUMS ===
CREATE TYPE public.verification_status AS ENUM ('verified','partial','investigating','community');
CREATE TYPE public.relationship_type AS ENUM ('madre_hija','hermanas','abuela_nieta','tia_sobrina','primas','madrina','otro');
CREATE TYPE public.sponsorship_type AS ENUM ('fundador','decada','municipio','digitalizacion','experiencias','aliado');
CREATE TYPE public.sponsor_status AS ENUM ('ejemplo','prospecto','activo','historico');
CREATE TYPE public.recognition_type AS ENUM ('flor_de_oro','embajadora','fotogenia','simpatia','finalista','princesa','otro');
CREATE TYPE public.contribution_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.app_role AS ENUM ('admin','editor','viewer');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own roles readable" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

CREATE TABLE public.municipalities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  cabecera text,
  region text,
  description text,
  emblema text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.municipalities TO anon, authenticated;
GRANT ALL ON public.municipalities TO service_role;
ALTER TABLE public.municipalities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "muni public read" ON public.municipalities FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "muni admin write" ON public.municipalities FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.editions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  year int UNIQUE NOT NULL,
  title text,
  theme text,
  context text,
  notes text,
  cancelled boolean NOT NULL DEFAULT false,
  cancellation_reason text,
  cover_image text,
  verification public.verification_status NOT NULL DEFAULT 'community',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.editions TO anon, authenticated;
GRANT ALL ON public.editions TO service_role;
ALTER TABLE public.editions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ed public read" ON public.editions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "ed admin write" ON public.editions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.people (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  full_name text NOT NULL,
  maiden_name text,
  birth_year int,
  death_year int,
  bio text,
  portrait text,
  origin_municipality_id uuid REFERENCES public.municipalities(id) ON DELETE SET NULL,
  verification public.verification_status NOT NULL DEFAULT 'community',
  is_ambassador boolean NOT NULL DEFAULT true,
  editorial_notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.people TO anon, authenticated;
GRANT ALL ON public.people TO service_role;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
CREATE POLICY "people public read" ON public.people FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "people admin write" ON public.people FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.representations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  edition_id uuid NOT NULL REFERENCES public.editions(id) ON DELETE CASCADE,
  municipality_id uuid REFERENCES public.municipalities(id) ON DELETE SET NULL,
  age int,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(person_id, edition_id, municipality_id)
);
GRANT SELECT ON public.representations TO anon, authenticated;
GRANT ALL ON public.representations TO service_role;
ALTER TABLE public.representations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rep public read" ON public.representations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "rep admin write" ON public.representations FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.recognitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_id uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  edition_id uuid NOT NULL REFERENCES public.editions(id) ON DELETE CASCADE,
  type public.recognition_type NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.recognitions TO anon, authenticated;
GRANT ALL ON public.recognitions TO service_role;
ALTER TABLE public.recognitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rec public read" ON public.recognitions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "rec admin write" ON public.recognitions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.family_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  person_a uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  person_b uuid NOT NULL REFERENCES public.people(id) ON DELETE CASCADE,
  relationship public.relationship_type NOT NULL,
  notes text,
  verification public.verification_status NOT NULL DEFAULT 'community',
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (person_a <> person_b)
);
GRANT SELECT ON public.family_relationships TO anon, authenticated;
GRANT ALL ON public.family_relationships TO service_role;
ALTER TABLE public.family_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fam public read" ON public.family_relationships FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "fam admin write" ON public.family_relationships FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.sponsors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  name text NOT NULL,
  tagline text,
  description text,
  motivation text,
  sponsorship_type public.sponsorship_type NOT NULL,
  status public.sponsor_status NOT NULL DEFAULT 'ejemplo',
  website text,
  logo text,
  cover_image text,
  location text,
  since_year int,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.sponsors TO anon, authenticated;
GRANT ALL ON public.sponsors TO service_role;
ALTER TABLE public.sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sp public read" ON public.sponsors FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "sp admin write" ON public.sponsors FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  excerpt text,
  body text,
  cover_image text,
  related_person_id uuid REFERENCES public.people(id) ON DELETE SET NULL,
  related_edition_id uuid REFERENCES public.editions(id) ON DELETE SET NULL,
  related_municipality_id uuid REFERENCES public.municipalities(id) ON DELETE SET NULL,
  sponsor_id uuid REFERENCES public.sponsors(id) ON DELETE SET NULL,
  published boolean NOT NULL DEFAULT true,
  verification public.verification_status NOT NULL DEFAULT 'community',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.stories TO anon, authenticated;
GRANT ALL ON public.stories TO service_role;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "st public read" ON public.stories FOR SELECT TO anon, authenticated USING (published = true);
CREATE POLICY "st admin all" ON public.stories FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contributor_name text NOT NULL,
  contributor_email text NOT NULL,
  contributor_phone text,
  relation text,
  subject text NOT NULL,
  message text NOT NULL,
  related_person text,
  related_year int,
  attachment_url text,
  status public.contribution_status NOT NULL DEFAULT 'pending',
  editorial_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT, SELECT, UPDATE ON public.contributions TO authenticated;
GRANT INSERT ON public.contributions TO anon;
GRANT ALL ON public.contributions TO service_role;
ALTER TABLE public.contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contrib insert public" ON public.contributions FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "contrib admin read" ON public.contributions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "contrib admin update" ON public.contributions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.sponsorship_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company text NOT NULL,
  role text,
  email text NOT NULL,
  phone text,
  sponsorship_type public.sponsorship_type,
  budget_range text,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT, SELECT, UPDATE ON public.sponsorship_leads TO authenticated;
GRANT INSERT ON public.sponsorship_leads TO anon;
GRANT ALL ON public.sponsorship_leads TO service_role;
ALTER TABLE public.sponsorship_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "lead insert public" ON public.sponsorship_leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "lead admin read" ON public.sponsorship_leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "lead admin update" ON public.sponsorship_leads FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ========= SEED =========
INSERT INTO public.municipalities(slug,name,cabecera,region,description) VALUES
  ('centro','Centro','Villahermosa','Centro','Capital del estado y sede tradicional de la Feria Tabasco.'),
  ('cardenas','Cárdenas','Cárdenas','Chontalpa','Corazón agrícola de la Chontalpa, cuna de múltiples embajadoras.'),
  ('comalcalco','Comalcalco','Comalcalco','Chontalpa','Ciudad del cacao y de la ruta arqueológica maya-chontal.'),
  ('cunduacan','Cunduacán','Cunduacán','Chontalpa','Tradición universitaria y ganadera.'),
  ('huimanguillo','Huimanguillo','Huimanguillo','Chontalpa','El municipio más extenso, entre sierras y llanuras.'),
  ('paraiso','Paraíso','Paraíso','Chontalpa','Puerta al Golfo de México.'),
  ('jalpa-de-mendez','Jalpa de Méndez','Jalpa de Méndez','Chontalpa','Artesanías de jícara pirograbada.'),
  ('nacajuca','Nacajuca','Nacajuca','Chontalpa','Comunidades yokot''anob y cultura viva.'),
  ('centla','Centla','Frontera','Ríos','Frontera fluvial y pantanos.'),
  ('jonuta','Jonuta','Jonuta','Ríos','Ribera del Usumacinta.'),
  ('emiliano-zapata','Emiliano Zapata','Emiliano Zapata','Ríos','Puente entre Tabasco y Chiapas.'),
  ('balancan','Balancán','Balancán','Ríos','Ganadería y arqueología maya.'),
  ('tenosique','Tenosique','Tenosique','Ríos','Danza del Pochó y frontera sur.'),
  ('macuspana','Macuspana','Macuspana','Sierra','Petróleo y ríos.'),
  ('jalapa','Jalapa','Jalapa','Sierra','Serranía y cafetales.'),
  ('tacotalpa','Tacotalpa','Tacotalpa','Sierra','Puerta a la Sierra tabasqueña.'),
  ('teapa','Teapa','Teapa','Sierra','Grutas y aguas termales.');

INSERT INTO public.editions(year,title,theme,context,verification)
SELECT y,
  'Feria Tabasco ' || y,
  CASE WHEN y % 10 = 6 THEN 'Homenaje a las raíces olmecas' WHEN y % 10 = 0 THEN 'Década de la memoria' ELSE 'Tradición chontal' END,
  'Edición de referencia. Datos demostrativos, sujetos a validación con archivos hemerográficos.',
  'community'
FROM generate_series(1956,2024,4) g(y);

INSERT INTO public.people(slug, full_name, maiden_name, birth_year, bio, origin_municipality_id, verification, editorial_notes)
SELECT
  'demo-' || lpad(i::text,2,'0'),
  'Embajadora Demo ' || lpad(i::text,2,'0'),
  CASE WHEN i % 3 = 0 THEN 'Apellido Familiar ' || ((i / 3) + 1) ELSE NULL END,
  1935 + (i * 2),
  'Perfil demostrativo generado para presentar la plataforma. La biografía real deberá redactarse con base en fuentes verificadas y con autorización de la familia.',
  (SELECT id FROM public.municipalities ORDER BY name OFFSET (i % 17) LIMIT 1),
  (ARRAY['community','partial','investigating','verified']::public.verification_status[])[(i % 4) + 1],
  'Registro de ejemplo — no corresponde a una persona real.'
FROM generate_series(1,30) g(i);

-- Assign editions round-robin using a CTE (no window fn in OFFSET)
WITH ed AS (SELECT id, row_number() OVER (ORDER BY year) - 1 AS rn, count(*) OVER () AS total FROM public.editions),
     pp AS (SELECT id, slug, origin_municipality_id, row_number() OVER (ORDER BY slug) - 1 AS rn FROM public.people)
INSERT INTO public.representations(person_id, edition_id, municipality_id, age)
SELECT pp.id, ed.id, pp.origin_municipality_id, 18 + (pp.rn % 6)::int
FROM pp JOIN ed ON ed.rn = (pp.rn % ed.total);

INSERT INTO public.recognitions(person_id, edition_id, type, notes)
SELECT r.person_id, r.edition_id, 'flor_de_oro'::public.recognition_type, 'Reconocimiento máximo de la edición.'
FROM public.representations r JOIN public.people p ON p.id = r.person_id
WHERE (substring(p.slug from 'demo-([0-9]+)')::int) % 4 = 0;

INSERT INTO public.recognitions(person_id, edition_id, type)
SELECT r.person_id, r.edition_id,
  (ARRAY['fotogenia','simpatia','finalista']::public.recognition_type[])[((substring(p.slug from 'demo-([0-9]+)')::int) % 3) + 1]
FROM public.representations r JOIN public.people p ON p.id = r.person_id
WHERE (substring(p.slug from 'demo-([0-9]+)')::int) % 4 <> 0;

INSERT INTO public.sponsors(slug,name,tagline,description,motivation,sponsorship_type,status,location,since_year,website) VALUES
  ('quinta-real-demo','Quinta Real (Ejemplo)','Hospitalidad con memoria','Cadena hotelera de referencia que integra hospedaje contemporáneo con la vocación cultural del sureste.','Preservar el patrimonio de las mujeres tabasqueñas fortalece la identidad del destino.','fundador','ejemplo','Villahermosa, Tabasco',1994,'https://example.com'),
  ('rancho-prado-verde-demo','Rancho Prado Verde (Ejemplo)','Ganadería con arraigo','Empresa familiar dedicada al desarrollo agropecuario del sureste.','Sostener la memoria de nuestras familias es honrar a las mujeres que dieron vida a nuestros pueblos.','decada','ejemplo','Cárdenas, Tabasco',1978,'https://example.com'),
  ('ado-demo','ADO (Ejemplo)','Conectando al sureste','Grupo de movilidad terrestre del sur y sureste de México.','La Feria de Tabasco es un punto de encuentro que merece un archivo vivo.','experiencias','ejemplo','Sureste de México',1939,'https://example.com'),
  ('flor-de-tabasco-demo','Flor de Tabasco (Ejemplo)','Cacao y cultura','Marca artesanal dedicada al chocolate de origen.','Donde florece Tabasco florecemos nosotros.','municipio','ejemplo','Comalcalco, Tabasco',2011,'https://example.com'),
  ('aliado-institucional-demo','Aliado Institucional (Ejemplo)','Convenio de preservación','Instancia pública/privada que respalda la digitalización de archivos.','La memoria colectiva es infraestructura cultural.','digitalizacion','ejemplo','Tabasco',2020,NULL),
  ('memoria-viva-demo','Fundación Memoria Viva (Ejemplo)','Aliado editorial','Fundación cultural dedicada al rescate y publicación de patrimonio familiar.','Este archivo puede convertirse en un modelo replicable.','aliado','ejemplo','Ciudad de México',2015,NULL);

WITH ppl AS (SELECT id, slug, row_number() OVER (ORDER BY slug) AS rn FROM public.people)
INSERT INTO public.family_relationships(person_a, person_b, relationship, notes, verification)
SELECT a.id, b.id, v.rel::public.relationship_type, 'Relación demostrativa.', 'community'
FROM (VALUES
  (1,2,'hermanas'),(2,3,'madre_hija'),(3,4,'abuela_nieta'),
  (5,6,'primas'),(6,7,'hermanas'),(8,9,'madre_hija'),
  (9,10,'madre_hija'),(11,12,'tia_sobrina'),(13,14,'hermanas'),
  (15,16,'madre_hija'),(17,18,'primas'),(19,20,'madre_hija'),
  (21,22,'abuela_nieta'),(23,24,'hermanas'),(25,26,'madre_hija')
) v(a_rn,b_rn,rel)
JOIN ppl a ON a.rn = v.a_rn
JOIN ppl b ON b.rn = v.b_rn;

INSERT INTO public.stories(slug,title,category,excerpt,body,related_person_id,related_edition_id,sponsor_id,verification) VALUES
  ('tres-generaciones-en-la-feria','Tres generaciones en la Feria','Familia','Una familia demostrativa cuya abuela, hija y nieta representaron a su municipio en décadas distintas.','Este relato ilustra cómo el Archivo puede reconstruir cadenas de participación familiares a través del tiempo. En una versión final, incluirá fotografías, cartas y testimonios verificados.',(SELECT id FROM public.people WHERE slug='demo-04'),NULL,(SELECT id FROM public.sponsors WHERE slug='memoria-viva-demo'),'community'),
  ('la-flor-de-oro-1976','La Flor de Oro que nadie olvidó','Flor de Oro','Homenaje demostrativo a una embajadora cuya edición marcó a una generación.','Texto de ejemplo. En la versión final, el relato incluirá fuentes hemerográficas, testimonios y galería fotográfica autorizada.',(SELECT id FROM public.people WHERE slug='demo-08'),(SELECT id FROM public.editions ORDER BY year LIMIT 1),(SELECT id FROM public.sponsors WHERE slug='flor-de-tabasco-demo'),'community'),
  ('vestidos-de-carnaval','Los vestidos que contaron una época','Vestidos','Cómo el vestuario de las embajadoras dibujó las modas del sureste.','Historia editorial demostrativa. Incluirá catálogo de vestidos y bocetos digitalizados.',NULL,NULL,(SELECT id FROM public.sponsors WHERE slug='quinta-real-demo'),'community'),
  ('carros-alegoricos','Carros alegóricos: la ingeniería del asombro','Carros alegóricos','Notas sobre los talleres que construían los desfiles.','En preparación.',NULL,NULL,NULL,'investigating'),
  ('fotografia-recuperada','Una fotografía recuperada','Fotografías recuperadas','Cómo la comunidad aportó una imagen olvidada.','Ejemplo de flujo de contribución comunitaria.',NULL,NULL,(SELECT id FROM public.sponsors WHERE slug='aliado-institucional-demo'),'community'),
  ('detras-de-la-feria','Detrás de la Feria: los jurados','Detrás de la Feria','Nombres, criterios y anécdotas del jurado.','Sección editorial pendiente de contenido definitivo.',NULL,NULL,NULL,'investigating');

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER people_updated BEFORE UPDATE ON public.people FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
