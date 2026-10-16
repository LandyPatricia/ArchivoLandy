-- Esquema de El Archivo de Mis Flores, generado 2026-10-16 15:36:31.171464+00

set check_function_bodies = false;

-- Extensiones
create extension if not exists pg_stat_statements with schema extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists supabase_vault with schema vault;
create extension if not exists "uuid-ossp" with schema extensions;

-- Tipos
create type public.app_role as enum ('admin', 'editor', 'viewer');
create type public.contribution_status as enum ('pending', 'approved', 'rejected');
create type public.photo_type as enum ('retrato', 'coronacion', 'carro_alegorico', 'vestido', 'familia', 'prensa', 'grupo', 'otro');
create type public.recognition_type as enum ('flor_de_oro', 'embajadora', 'fotogenia', 'simpatia', 'finalista', 'princesa', 'otro');
create type public.relationship_type as enum ('madre_hija', 'hermanas', 'abuela_nieta', 'tia_sobrina', 'primas', 'madrina', 'otro');
create type public.sponsor_status as enum ('ejemplo', 'prospecto', 'activo', 'historico');
create type public.sponsorship_type as enum ('fundador', 'decada', 'municipio', 'digitalizacion', 'experiencias', 'aliado');
create type public.usage_permission as enum ('autorizado', 'dominio_publico', 'uso_editorial', 'pendiente');
create type public.verification_status as enum ('verified', 'partial', 'investigating', 'community');

-- Funciones
CREATE OR REPLACE FUNCTION public.asignar_rol(_user_id uuid, _rol app_role)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  era_admin boolean;
  otros_admins int;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo un administrador puede cambiar roles.';
  END IF;

  IF _user_id = auth.uid() AND _rol IS DISTINCT FROM 'admin' THEN
    RAISE EXCEPTION 'No puedes quitarte a ti mismo el rol de administrador.';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN
    RAISE EXCEPTION 'Esa cuenta no existe.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = 'admin'
  ) INTO era_admin;

  IF era_admin AND _rol IS DISTINCT FROM 'admin' THEN
    SELECT COUNT(*) INTO otros_admins
    FROM public.user_roles WHERE role = 'admin' AND user_id <> _user_id;
    IF otros_admins = 0 THEN
      RAISE EXCEPTION 'El archivo quedaría sin administradores.';
    END IF;
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _user_id;
  IF _rol IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, _rol);
  END IF;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.claim_admin_if_first()
 RETURNS boolean
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  admin_count int;
  uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN RETURN false; END IF;
  SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  IF admin_count = 0 THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (uid, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN true;
  END IF;
  RETURN false;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$function$
;

CREATE OR REPLACE FUNCTION public.listar_usuarios()
 RETURNS TABLE(id uuid, email text, rol app_role, creado_en timestamp with time zone, ultimo_acceso timestamp with time zone, confirmado boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo un administrador puede ver las cuentas.';
  END IF;

  RETURN QUERY
  SELECT
    u.id,
    u.email::text,
    r.role,
    u.created_at,
    u.last_sign_in_at,
    (u.email_confirmed_at IS NOT NULL)
  FROM auth.users u
  LEFT JOIN public.user_roles r ON r.user_id = u.id
  ORDER BY u.created_at ASC;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.mi_rol()
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$function$
;

CREATE OR REPLACE FUNCTION public.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $function$
;

CREATE OR REPLACE FUNCTION public.touch_contribution_review()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.reviewed_at = now();
    NEW.reviewed_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.touch_personaje_settings()
 RETURNS trigger
 LANGUAGE plpgsql
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$
;

-- Tablas
create table public.accesos (
  id uuid default gen_random_uuid() not null,
  creado_en timestamp with time zone default now() not null,
  nombre text not null,
  llave smallint not null,
  etiqueta text,
  ip text,
  agente text
);

create table public.contributions (
  id uuid default gen_random_uuid() not null,
  contributor_name text not null,
  contributor_email text not null,
  contributor_phone text,
  relation text,
  subject text not null,
  message text not null,
  related_person text,
  related_year integer,
  attachment_url text,
  status contribution_status default 'pending'::contribution_status not null,
  editorial_notes text,
  created_at timestamp with time zone default now() not null,
  personaje_id text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone
);

create table public.editions (
  id uuid default gen_random_uuid() not null,
  year integer not null,
  title text,
  theme text,
  context text,
  notes text,
  cancelled boolean default false not null,
  cancellation_reason text,
  cover_image text,
  verification verification_status default 'community'::verification_status not null,
  created_at timestamp with time zone default now() not null
);

create table public.family_relationships (
  id uuid default gen_random_uuid() not null,
  person_a uuid not null,
  person_b uuid not null,
  relationship relationship_type not null,
  notes text,
  verification verification_status default 'community'::verification_status not null,
  created_at timestamp with time zone default now() not null
);

create table public.media_assets (
  id uuid default gen_random_uuid() not null,
  storage_path text not null,
  url text not null,
  mime_type text,
  width integer,
  height integer,
  bytes integer,
  title text,
  caption text,
  alt_text text,
  tags text[] default '{}'::text[] not null,
  photo_type photo_type default 'otro'::photo_type not null,
  person_id uuid,
  edition_id uuid,
  municipality_id uuid,
  story_id uuid,
  year integer,
  credit_author text,
  credit_source text,
  usage_permission usage_permission default 'pendiente'::usage_permission not null,
  verification verification_status default 'community'::verification_status not null,
  is_featured boolean default false not null,
  is_cover boolean default false not null,
  sort_order integer default 0 not null,
  uploaded_by uuid,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  photo_flags text[] default '{}'::text[] not null,
  personaje_id text,
  ubicaciones text[] default '{}'::text[] not null,
  encuadre text,
  encuadre_zoom real default 1 not null
);

create table public.media_people (
  media_id uuid not null,
  person_id uuid not null,
  is_primary boolean default false not null,
  created_at timestamp with time zone default now() not null
);

create table public.municipalities (
  id uuid default gen_random_uuid() not null,
  slug text not null,
  name text not null,
  cabecera text,
  region text,
  description text,
  emblema text,
  created_at timestamp with time zone default now() not null
);

create table public.people (
  id uuid default gen_random_uuid() not null,
  slug text not null,
  full_name text not null,
  maiden_name text,
  birth_year integer,
  death_year integer,
  bio text,
  portrait text,
  origin_municipality_id uuid,
  verification verification_status default 'community'::verification_status not null,
  is_ambassador boolean default true not null,
  editorial_notes text,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);

create table public.personaje_settings (
  personaje_id text not null,
  slug text,
  nombre text,
  municipio text,
  visible boolean default true not null,
  secciones text[] default '{}'::text[] not null,
  destacado boolean default false not null,
  orden integer default 0 not null,
  notas text,
  updated_at timestamp with time zone default now() not null,
  updated_by uuid,
  encuadre text,
  foto_portada_id text,
  encuadre_zoom real default 1 not null
);

create table public.recognitions (
  id uuid default gen_random_uuid() not null,
  person_id uuid not null,
  edition_id uuid not null,
  type recognition_type not null,
  notes text,
  created_at timestamp with time zone default now() not null
);

create table public.representations (
  id uuid default gen_random_uuid() not null,
  person_id uuid not null,
  edition_id uuid not null,
  municipality_id uuid,
  age integer,
  notes text,
  created_at timestamp with time zone default now() not null
);

create table public.sponsors (
  id uuid default gen_random_uuid() not null,
  slug text not null,
  name text not null,
  tagline text,
  description text,
  motivation text,
  sponsorship_type sponsorship_type not null,
  status sponsor_status default 'ejemplo'::sponsor_status not null,
  website text,
  logo text,
  cover_image text,
  location text,
  since_year integer,
  created_at timestamp with time zone default now() not null
);

create table public.sponsorship_leads (
  id uuid default gen_random_uuid() not null,
  name text not null,
  company text not null,
  role text,
  email text not null,
  phone text,
  sponsorship_type sponsorship_type,
  budget_range text,
  message text,
  status text default 'new'::text not null,
  created_at timestamp with time zone default now() not null
);

create table public.stories (
  id uuid default gen_random_uuid() not null,
  slug text not null,
  title text not null,
  category text not null,
  excerpt text,
  body text,
  cover_image text,
  related_person_id uuid,
  related_edition_id uuid,
  related_municipality_id uuid,
  sponsor_id uuid,
  published boolean default true not null,
  verification verification_status default 'community'::verification_status not null,
  created_at timestamp with time zone default now() not null
);

create table public.user_roles (
  id uuid default gen_random_uuid() not null,
  user_id uuid not null,
  role app_role not null,
  created_at timestamp with time zone default now() not null
);

-- Llaves y restricciones
alter table only public.accesos add constraint accesos_pkey PRIMARY KEY (id);
alter table only public.contributions add constraint contributions_pkey PRIMARY KEY (id);
alter table only public.editions add constraint editions_pkey PRIMARY KEY (id);
alter table only public.editions add constraint editions_year_key UNIQUE (year);
alter table only public.family_relationships add constraint family_relationships_check CHECK ((person_a <> person_b));
alter table only public.family_relationships add constraint family_relationships_pkey PRIMARY KEY (id);
alter table only public.media_assets add constraint media_assets_encuadre_formato CHECK (((encuadre IS NULL) OR (encuadre ~ '^\d{1,3}% \d{1,3}%$'::text)));
alter table only public.media_assets add constraint media_assets_encuadre_zoom_rango CHECK (((encuadre_zoom >= (0.5)::double precision) AND (encuadre_zoom <= (3)::double precision)));
alter table only public.media_assets add constraint media_assets_pkey PRIMARY KEY (id);
alter table only public.media_people add constraint media_people_pkey PRIMARY KEY (media_id, person_id);
alter table only public.municipalities add constraint municipalities_pkey PRIMARY KEY (id);
alter table only public.municipalities add constraint municipalities_slug_key UNIQUE (slug);
alter table only public.people add constraint people_pkey PRIMARY KEY (id);
alter table only public.people add constraint people_slug_key UNIQUE (slug);
alter table only public.personaje_settings add constraint personaje_settings_pkey PRIMARY KEY (personaje_id);
alter table only public.personaje_settings add constraint personaje_settings_zoom_rango CHECK (((encuadre_zoom >= (0.5)::double precision) AND (encuadre_zoom <= (3)::double precision)));
alter table only public.recognitions add constraint recognitions_pkey PRIMARY KEY (id);
alter table only public.representations add constraint representations_person_id_edition_id_municipality_id_key UNIQUE (person_id, edition_id, municipality_id);
alter table only public.representations add constraint representations_pkey PRIMARY KEY (id);
alter table only public.sponsors add constraint sponsors_pkey PRIMARY KEY (id);
alter table only public.sponsors add constraint sponsors_slug_key UNIQUE (slug);
alter table only public.sponsorship_leads add constraint sponsorship_leads_pkey PRIMARY KEY (id);
alter table only public.stories add constraint stories_pkey PRIMARY KEY (id);
alter table only public.stories add constraint stories_slug_key UNIQUE (slug);
alter table only public.user_roles add constraint user_roles_pkey PRIMARY KEY (id);
alter table only public.user_roles add constraint user_roles_user_id_role_key UNIQUE (user_id, role);
alter table only public.contributions add constraint contributions_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table only public.family_relationships add constraint family_relationships_person_a_fkey FOREIGN KEY (person_a) REFERENCES people(id) ON DELETE CASCADE;
alter table only public.family_relationships add constraint family_relationships_person_b_fkey FOREIGN KEY (person_b) REFERENCES people(id) ON DELETE CASCADE;
alter table only public.media_assets add constraint media_assets_edition_id_fkey FOREIGN KEY (edition_id) REFERENCES editions(id) ON DELETE SET NULL;
alter table only public.media_assets add constraint media_assets_municipality_id_fkey FOREIGN KEY (municipality_id) REFERENCES municipalities(id) ON DELETE SET NULL;
alter table only public.media_assets add constraint media_assets_person_id_fkey FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE SET NULL;
alter table only public.media_assets add constraint media_assets_story_id_fkey FOREIGN KEY (story_id) REFERENCES stories(id) ON DELETE SET NULL;
alter table only public.media_assets add constraint media_assets_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table only public.media_people add constraint media_people_media_id_fkey FOREIGN KEY (media_id) REFERENCES media_assets(id) ON DELETE CASCADE;
alter table only public.media_people add constraint media_people_person_id_fkey FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE;
alter table only public.people add constraint people_origin_municipality_id_fkey FOREIGN KEY (origin_municipality_id) REFERENCES municipalities(id) ON DELETE SET NULL;
alter table only public.personaje_settings add constraint personaje_settings_updated_by_fkey FOREIGN KEY (updated_by) REFERENCES auth.users(id) ON DELETE SET NULL;
alter table only public.recognitions add constraint recognitions_edition_id_fkey FOREIGN KEY (edition_id) REFERENCES editions(id) ON DELETE CASCADE;
alter table only public.recognitions add constraint recognitions_person_id_fkey FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE;
alter table only public.representations add constraint representations_edition_id_fkey FOREIGN KEY (edition_id) REFERENCES editions(id) ON DELETE CASCADE;
alter table only public.representations add constraint representations_municipality_id_fkey FOREIGN KEY (municipality_id) REFERENCES municipalities(id) ON DELETE SET NULL;
alter table only public.representations add constraint representations_person_id_fkey FOREIGN KEY (person_id) REFERENCES people(id) ON DELETE CASCADE;
alter table only public.stories add constraint stories_related_edition_id_fkey FOREIGN KEY (related_edition_id) REFERENCES editions(id) ON DELETE SET NULL;
alter table only public.stories add constraint stories_related_municipality_id_fkey FOREIGN KEY (related_municipality_id) REFERENCES municipalities(id) ON DELETE SET NULL;
alter table only public.stories add constraint stories_related_person_id_fkey FOREIGN KEY (related_person_id) REFERENCES people(id) ON DELETE SET NULL;
alter table only public.stories add constraint stories_sponsor_id_fkey FOREIGN KEY (sponsor_id) REFERENCES sponsors(id) ON DELETE SET NULL;
alter table only public.user_roles add constraint user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Índices
CREATE INDEX accesos_creado_en_idx ON public.accesos USING btree (creado_en DESC);
CREATE INDEX idx_contributions_status ON public.contributions USING btree (status, created_at DESC);
CREATE INDEX media_assets_personaje_idx ON public.media_assets USING btree (personaje_id);
CREATE INDEX media_assets_story_idx ON public.media_assets USING btree (story_id);
CREATE INDEX idx_media_assets_flags ON public.media_assets USING gin (photo_flags);
CREATE INDEX media_assets_ubicaciones_idx ON public.media_assets USING gin (ubicaciones);
CREATE INDEX media_assets_featured_idx ON public.media_assets USING btree (is_featured) WHERE is_featured;
CREATE INDEX media_assets_edition_idx ON public.media_assets USING btree (edition_id);
CREATE INDEX media_assets_municipality_idx ON public.media_assets USING btree (municipality_id);
CREATE INDEX media_assets_person_idx ON public.media_assets USING btree (person_id);
CREATE INDEX idx_media_people_person ON public.media_people USING btree (person_id);
CREATE INDEX idx_personaje_settings_secciones ON public.personaje_settings USING gin (secciones);
CREATE INDEX idx_personaje_settings_visible ON public.personaje_settings USING btree (visible);

-- Vistas
create view public.memorias_publicas with (security_invoker=true) as
 SELECT id,
    personaje_id,
    contributor_name,
    relation,
    subject,
    message,
    related_year,
    created_at
   FROM contributions
  WHERE status = 'approved'::contribution_status AND personaje_id IS NOT NULL;

-- Triggers
CREATE TRIGGER trg_touch_contribution_review BEFORE UPDATE ON public.contributions FOR EACH ROW EXECUTE FUNCTION touch_contribution_review();
CREATE TRIGGER media_assets_set_updated_at BEFORE UPDATE ON public.media_assets FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER people_updated BEFORE UPDATE ON public.people FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER trg_touch_personaje_settings BEFORE UPDATE ON public.personaje_settings FOR EACH ROW EXECUTE FUNCTION touch_personaje_settings();

-- Seguridad por filas (RLS)
alter table public.accesos enable row level security;
alter table public.contributions enable row level security;
alter table public.editions enable row level security;
alter table public.family_relationships enable row level security;
alter table public.media_assets enable row level security;
alter table public.media_people enable row level security;
alter table public.municipalities enable row level security;
alter table public.people enable row level security;
alter table public.personaje_settings enable row level security;
alter table public.recognitions enable row level security;
alter table public.representations enable row level security;
alter table public.sponsors enable row level security;
alter table public.sponsorship_leads enable row level security;
alter table public.stories enable row level security;
alter table public.user_roles enable row level security;

-- Políticas
create policy "accesos lectura equipo" on public.accesos as permissive for select to authenticated using (true);
create policy "contrib admin delete" on public.contributions as permissive for delete to authenticated using (has_role(auth.uid(), 'admin'::app_role));
create policy "contrib admin read" on public.contributions as permissive for select to authenticated using (has_role(auth.uid(), 'admin'::app_role));
create policy "contrib admin update" on public.contributions as permissive for update to authenticated using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));
create policy "contrib insert equipo" on public.contributions as permissive for insert to authenticated with check (true);
create policy "ed admin write" on public.editions as permissive for all to authenticated using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));
create policy "ed public read" on public.editions as permissive for select to anon, authenticated using (true);
create policy "fam admin write" on public.family_relationships as permissive for all to authenticated using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));
create policy "fam public read" on public.family_relationships as permissive for select to anon, authenticated using (true);
create policy "media admin delete" on public.media_assets as permissive for delete to authenticated using (has_role(auth.uid(), 'admin'::app_role));
create policy "media admin insert" on public.media_assets as permissive for insert to authenticated with check (has_role(auth.uid(), 'admin'::app_role));
create policy "media admin read all" on public.media_assets as permissive for select to authenticated using (has_role(auth.uid(), 'admin'::app_role));
create policy "media admin update" on public.media_assets as permissive for update to authenticated using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));
create policy "media public read" on public.media_assets as permissive for select to public using ((usage_permission <> 'pendiente'::usage_permission));
create policy "admin write media_people" on public.media_people as permissive for all to authenticated using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));
create policy "public read media_people" on public.media_people as permissive for select to public using (true);
create policy "muni admin write" on public.municipalities as permissive for all to authenticated using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));
create policy "muni public read" on public.municipalities as permissive for select to anon, authenticated using (true);
create policy "people admin write" on public.people as permissive for all to authenticated using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));
create policy "people public read" on public.people as permissive for select to anon, authenticated using (true);
create policy "admin write personaje_settings" on public.personaje_settings as permissive for all to authenticated using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));
create policy "public read personaje_settings" on public.personaje_settings as permissive for select to public using (true);
create policy "rec admin write" on public.recognitions as permissive for all to authenticated using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));
create policy "rec public read" on public.recognitions as permissive for select to anon, authenticated using (true);
create policy "rep admin write" on public.representations as permissive for all to authenticated using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));
create policy "rep public read" on public.representations as permissive for select to anon, authenticated using (true);
create policy "sp admin write" on public.sponsors as permissive for all to authenticated using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));
create policy "sp public read" on public.sponsors as permissive for select to anon, authenticated using (true);
create policy "lead admin read" on public.sponsorship_leads as permissive for select to authenticated using (has_role(auth.uid(), 'admin'::app_role));
create policy "lead admin update" on public.sponsorship_leads as permissive for update to authenticated using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));
create policy "lead insert public" on public.sponsorship_leads as permissive for insert to anon, authenticated with check (true);
create policy "st admin all" on public.stories as permissive for all to authenticated using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));
create policy "st public read" on public.stories as permissive for select to anon, authenticated using ((published = true));
create policy "admin reads all roles" on public.user_roles as permissive for select to authenticated using (has_role(auth.uid(), 'admin'::app_role));
create policy "own roles readable" on public.user_roles as permissive for select to authenticated using ((auth.uid() = user_id));
create policy "archivo-media admin delete" on storage.objects as permissive for delete to authenticated using (((bucket_id = 'archivo-media'::text) AND has_role(auth.uid(), 'admin'::app_role)));
create policy "archivo-media admin insert" on storage.objects as permissive for insert to authenticated with check (((bucket_id = 'archivo-media'::text) AND has_role(auth.uid(), 'admin'::app_role)));
create policy "archivo-media admin update" on storage.objects as permissive for update to authenticated using (((bucket_id = 'archivo-media'::text) AND has_role(auth.uid(), 'admin'::app_role)));
create policy "archivo-media public read" on storage.objects as permissive for select to public using ((bucket_id = 'archivo-media'::text));

-- Permisos de tablas y vistas
revoke all on table public.accesos from anon, authenticated, service_role;
revoke all on table public.contributions from anon, authenticated, service_role;
revoke all on table public.editions from anon, authenticated, service_role;
revoke all on table public.family_relationships from anon, authenticated, service_role;
revoke all on table public.media_assets from anon, authenticated, service_role;
revoke all on table public.media_people from anon, authenticated, service_role;
revoke all on table public.memorias_publicas from anon, authenticated, service_role;
revoke all on table public.municipalities from anon, authenticated, service_role;
revoke all on table public.people from anon, authenticated, service_role;
revoke all on table public.personaje_settings from anon, authenticated, service_role;
revoke all on table public.recognitions from anon, authenticated, service_role;
revoke all on table public.representations from anon, authenticated, service_role;
revoke all on table public.sponsors from anon, authenticated, service_role;
revoke all on table public.sponsorship_leads from anon, authenticated, service_role;
revoke all on table public.stories from anon, authenticated, service_role;
revoke all on table public.user_roles from anon, authenticated, service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.accesos to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.accesos to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.accesos to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.contributions to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.contributions to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.editions to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.editions to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.editions to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.family_relationships to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.family_relationships to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.family_relationships to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.media_assets to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.media_assets to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.media_assets to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.media_people to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.media_people to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.media_people to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.memorias_publicas to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.memorias_publicas to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.memorias_publicas to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.municipalities to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.municipalities to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.municipalities to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.people to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.people to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.people to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.personaje_settings to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.personaje_settings to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.personaje_settings to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.recognitions to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.recognitions to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.recognitions to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.representations to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.representations to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.representations to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.sponsors to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.sponsors to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.sponsors to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.sponsorship_leads to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.sponsorship_leads to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.sponsorship_leads to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.stories to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.stories to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.stories to service_role;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.user_roles to anon;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.user_roles to authenticated;
grant DELETE, INSERT, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.user_roles to service_role;
grant DELETE, REFERENCES, SELECT, TRIGGER, TRUNCATE, UPDATE on table public.contributions to anon;

-- Permisos de funciones
revoke all on function asignar_rol(uuid,app_role) from public, anon, authenticated, service_role;
revoke all on function claim_admin_if_first() from public, anon, authenticated, service_role;
revoke all on function has_role(uuid,app_role) from public, anon, authenticated, service_role;
revoke all on function listar_usuarios() from public, anon, authenticated, service_role;
revoke all on function mi_rol() from public, anon, authenticated, service_role;
revoke all on function set_updated_at() from public, anon, authenticated, service_role;
revoke all on function touch_contribution_review() from public, anon, authenticated, service_role;
revoke all on function touch_personaje_settings() from public, anon, authenticated, service_role;
grant execute on function asignar_rol(uuid,app_role) to authenticated;
grant execute on function asignar_rol(uuid,app_role) to postgres;
grant execute on function asignar_rol(uuid,app_role) to service_role;
grant execute on function claim_admin_if_first() to authenticated;
grant execute on function claim_admin_if_first() to postgres;
grant execute on function claim_admin_if_first() to service_role;
grant execute on function has_role(uuid,app_role) to anon;
grant execute on function has_role(uuid,app_role) to authenticated;
grant execute on function has_role(uuid,app_role) to postgres;
grant execute on function has_role(uuid,app_role) to public;
grant execute on function has_role(uuid,app_role) to service_role;
grant execute on function listar_usuarios() to authenticated;
grant execute on function listar_usuarios() to postgres;
grant execute on function listar_usuarios() to service_role;
grant execute on function mi_rol() to authenticated;
grant execute on function mi_rol() to postgres;
grant execute on function mi_rol() to service_role;
grant execute on function set_updated_at() to anon;
grant execute on function set_updated_at() to authenticated;
grant execute on function set_updated_at() to postgres;
grant execute on function set_updated_at() to public;
grant execute on function set_updated_at() to service_role;
grant execute on function touch_contribution_review() to anon;
grant execute on function touch_contribution_review() to authenticated;
grant execute on function touch_contribution_review() to postgres;
grant execute on function touch_contribution_review() to public;
grant execute on function touch_contribution_review() to service_role;
grant execute on function touch_personaje_settings() to anon;
grant execute on function touch_personaje_settings() to authenticated;
grant execute on function touch_personaje_settings() to postgres;
grant execute on function touch_personaje_settings() to public;
grant execute on function touch_personaje_settings() to service_role;

-- Comentarios
comment on column public.contributions.personaje_id is 'Id del personaje en PatrimoniOS al que se atribuye la memoria. Lo elige quien aprueba.';
comment on column public.media_assets.encuadre is 'object-position con que el sitio recorta esta foto. NULL = centrada.';
comment on column public.media_assets.encuadre_zoom is 'Escala del recorte. 1 llena el marco; por debajo la foto se ve completa.';
comment on column public.media_assets.personaje_id is 'Id del personaje en PatrimoniOS al que pertenece la foto. Sin FK: vive en otra base.';
comment on column public.media_assets.ubicaciones is 'Espacios del sitio donde aparece la foto (portada, galeria, municipio…).';
comment on column public.personaje_settings.encuadre is 'object-position del retrato, p.ej. "50% 20%". NULL = encuadre por defecto.';
comment on column public.personaje_settings.encuadre_zoom is 'Escala del retrato. 1 = llena el marco; por debajo se ve la foto completa.';
comment on column public.personaje_settings.foto_portada_id is 'El ID de la foto de la galería que debe usarse como retrato principal.';
comment on table public.accesos is 'Entradas por el muro de acceso temporal. Lo escribe el servidor desde /api/muro.';
comment on table public.contributions is 'Aportes de la comunidad. Entran por /api/contribuir, que verifica el captcha; el público ya no puede insertar directamente.';
comment on table public.media_assets is 'Fotografías propias del archivo. Una foto recién subida puede no tener destino: se le asigna después desde el panel.';
comment on view public.memorias_publicas is 'Aportes aprobados y atribuidos, sin datos de contacto. Es lo único de contributions que ve el público.';

set check_function_bodies = true;