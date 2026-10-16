-- Encuadre de las fotos del sitio
-- ---------------------------------------------------------------------------
-- Las fotos que sube el equipo se pintan recortadas: en la portada, dentro de
-- la banda de su tarjeta; en el panel, dentro de su miniatura. El recorte por
-- defecto —centrado— acierta en un retrato y falla en una foto de grupo, donde
-- corta justo las caras de los extremos.
--
-- Igual que con los retratos del acervo, el ajuste NO toca el archivo: se
-- guarda cómo lo pinta el sitio. La foto original queda intacta en el bucket,
-- así que reencuadrar es gratis y siempre reversible.
--
--   · `encuadre`      el `object-position` de CSS, «50% 50%» por defecto.
--   · `encuadre_zoom` la escala; 1 llena el marco, por debajo se ve completa.
--
-- Los mismos límites y el mismo formato que `personaje_settings`, para que un
-- valor signifique lo mismo en las dos tablas.

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS encuadre text,
  ADD COLUMN IF NOT EXISTS encuadre_zoom real NOT NULL DEFAULT 1;

-- Dos porcentajes separados por un espacio, o nada. Sin esto, un valor mal
-- formado no rompe la consulta: rompe el diseño de la portada, que es peor
-- porque no avisa.
ALTER TABLE public.media_assets
  DROP CONSTRAINT IF EXISTS media_assets_encuadre_formato;
ALTER TABLE public.media_assets
  ADD CONSTRAINT media_assets_encuadre_formato
  CHECK (encuadre IS NULL OR encuadre ~ '^\d{1,3}% \d{1,3}%$');

ALTER TABLE public.media_assets
  DROP CONSTRAINT IF EXISTS media_assets_encuadre_zoom_rango;
ALTER TABLE public.media_assets
  ADD CONSTRAINT media_assets_encuadre_zoom_rango
  CHECK (encuadre_zoom >= 0.5 AND encuadre_zoom <= 3);

COMMENT ON COLUMN public.media_assets.encuadre IS
  'object-position con que el sitio recorta esta foto. NULL = centrada.';
COMMENT ON COLUMN public.media_assets.encuadre_zoom IS
  'Escala del recorte. 1 llena el marco; por debajo la foto se ve completa.';
