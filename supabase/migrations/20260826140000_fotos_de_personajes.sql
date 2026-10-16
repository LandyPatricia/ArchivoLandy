-- Fotos del archivo ligadas a embajadoras de PatrimoniOS
-- ---------------------------------------------------------------------------
-- `media_assets` colgaba las fotos de `people`, la tabla donde vivían las
-- embajadoras antes de que PatrimoniOS fuera la fuente. Esa tabla quedó vacía,
-- así que el selector de embajadoras del panel no ofrecía a nadie y la sección
-- entera servía sólo para fotos de municipio.
--
-- Se agrega el vínculo que corresponde al modelo de hoy: el id del personaje en
-- PatrimoniOS. Es `text` y sin llave foránea a propósito — esa persona vive en
-- OTRA base, y este sitio nunca escribe allá. Seguimos igual que
-- `personaje_settings`, que ya se indexa así.
--
-- `person_id` se conserva sin tocar: no estorba y borrarla perdería el rastro
-- de cualquier fila vieja.

ALTER TABLE public.media_assets
  ADD COLUMN IF NOT EXISTS personaje_id text;

COMMENT ON COLUMN public.media_assets.personaje_id IS
  'Id del personaje en PatrimoniOS al que pertenece la foto. Sin FK: vive en otra base.';

CREATE INDEX IF NOT EXISTS media_assets_personaje_idx
  ON public.media_assets(personaje_id);

-- La restricción exige que cada foto cuelgue de ALGO, para que ninguna quede
-- suelta sin manera de encontrarla. Ahora el personaje también cuenta como
-- destino válido; sin esto, una foto ligada sólo a una embajadora sería
-- rechazada al guardar.
ALTER TABLE public.media_assets
  DROP CONSTRAINT IF EXISTS media_assets_has_target;

ALTER TABLE public.media_assets
  ADD CONSTRAINT media_assets_has_target CHECK (
    personaje_id IS NOT NULL
    OR person_id IS NOT NULL
    OR edition_id IS NOT NULL
    OR municipality_id IS NOT NULL
    OR story_id IS NOT NULL
    OR is_featured
  );
