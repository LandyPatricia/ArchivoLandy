-- Zoom del encuadre y ubicación de las fotos del sitio
-- ---------------------------------------------------------------------------
-- Dos cosas que el panel no podía expresar:
--
-- 1. El encuadre sólo movía la foto dentro del marco. Con retratos de cuerpo
--    entero o fotos de grupo, mover no basta: hace falta acercar. Se guarda
--    aparte porque `encuadre` es un `object-position` de CSS y el acercamiento
--    es una escala; meter los dos en el mismo texto obligaría a inventar un
--    formato propio que después habría que parsear a mano en cada lectura.
--
-- 2. Las fotos que no son de una persona —grupales, carros y barcos
--    alegóricos, vistas de la feria— no tenían dónde decir EN QUÉ PARTE del
--    sitio salen. Antes se colgaban de un municipio o de nada.

-- ── 1. Acercamiento del retrato ────────────────────────────────────────────
ALTER TABLE public.personaje_settings
  ADD COLUMN IF NOT EXISTS encuadre_zoom real NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.personaje_settings.encuadre_zoom IS
  'Escala del retrato. 1 = llena el marco; por debajo se ve la foto completa.';

-- Por debajo de 0.5 la foto seria un sello diminuto y por encima de 3, un
-- borron. El limite vive aqui y no solo en la interfaz, que se puede saltar.
ALTER TABLE public.personaje_settings
  DROP CONSTRAINT IF EXISTS personaje_settings_zoom_rango;
ALTER TABLE public.personaje_settings
  ADD CONSTRAINT personaje_settings_zoom_rango
  CHECK (encuadre_zoom >= 0.5 AND encuadre_zoom <= 3);

-- ── 2. Dónde se muestra una foto del sitio ─────────────────────────────────
-- `text[]` y no un enum, por lo mismo que `personaje_settings.secciones`:
-- cuando el sitio gane un espacio nuevo basta con añadirlo al catálogo de
-- `src/lib/fotos-sitio.ts`, sin migrar la base.
ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS ubicaciones text[] NOT NULL DEFAULT '{}';

COMMENT ON COLUMN public.media_assets.ubicaciones IS
  'Espacios del sitio donde aparece la foto (portada, galeria, municipio…).';

CREATE INDEX IF NOT EXISTS media_assets_ubicaciones_idx
  ON public.media_assets USING GIN (ubicaciones);
