-- Añadir la columna foto_portada_id a personaje_settings
-- ---------------------------------------------------------------------------
-- Permite al usuario seleccionar qué imagen específica de la galería
-- debe usarse como foto de portada (override local sobre PatrimoniOS).

ALTER TABLE public.personaje_settings
  ADD COLUMN IF NOT EXISTS foto_portada_id text;

COMMENT ON COLUMN public.personaje_settings.foto_portada_id IS
  'El ID de la foto de la galería que debe usarse como retrato principal.';
