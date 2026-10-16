-- Curaduría de personajes de PatrimoniOS
-- ---------------------------------------------------------------------------
-- Los personajes viven en PatrimoniOS y desde aquí son de sólo lectura. Lo que
-- SÍ es nuestro es la decisión editorial: si un personaje se publica y en qué
-- partes del sitio aparece. Eso se guarda en esta tabla, indexada por el id del
-- personaje en PatrimoniOS.
--
-- `secciones` es text[] y no un enum a propósito: cuando el sitio gane una
-- sección nueva basta con añadirla al catálogo de src/lib/personajes-settings.ts,
-- sin migrar la base.

CREATE TABLE IF NOT EXISTS public.personaje_settings (
  personaje_id text PRIMARY KEY,
  slug text,
  nombre text,
  municipio text,
  visible boolean NOT NULL DEFAULT true,
  secciones text[] NOT NULL DEFAULT '{}',
  destacado boolean NOT NULL DEFAULT false,
  orden int NOT NULL DEFAULT 0,
  notas text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

GRANT SELECT ON public.personaje_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.personaje_settings TO authenticated;
GRANT ALL ON public.personaje_settings TO service_role;

ALTER TABLE public.personaje_settings ENABLE ROW LEVEL SECURITY;

-- Lectura pública: las páginas del sitio necesitan saber qué mostrar.
CREATE POLICY "public read personaje_settings" ON public.personaje_settings
  FOR SELECT USING (true);

-- Escritura sólo para administradores, igual que el resto de la curaduría.
CREATE POLICY "admin write personaje_settings" ON public.personaje_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE INDEX IF NOT EXISTS idx_personaje_settings_secciones
  ON public.personaje_settings USING GIN (secciones);
CREATE INDEX IF NOT EXISTS idx_personaje_settings_visible
  ON public.personaje_settings(visible);

-- `updated_at` se mantiene solo, para que el panel no dependa de que el cliente
-- lo mande en cada guardado.
CREATE OR REPLACE FUNCTION public.touch_personaje_settings()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_personaje_settings ON public.personaje_settings;
CREATE TRIGGER trg_touch_personaje_settings
  BEFORE UPDATE ON public.personaje_settings
  FOR EACH ROW EXECUTE FUNCTION public.touch_personaje_settings();
