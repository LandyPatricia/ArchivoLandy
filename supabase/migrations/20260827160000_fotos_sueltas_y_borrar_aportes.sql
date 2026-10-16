-- Fotos sin destino todavía, y borrar aportes
-- ---------------------------------------------------------------------------
-- 1. `media_assets_has_target` exigía que toda foto colgara de una persona, una
--    edición, un municipio o una historia. Venía del modelo viejo, cuando las
--    fotos SIEMPRE eran de alguien. Hoy el flujo es al revés: se sube la foto y
--    después se elige en qué tarjeta de la portada sale, viéndola junto a las
--    demás. Con la restricción, ese primer guardado era imposible: la foto se
--    subía al bucket, la fila se rechazaba y el archivo se borraba de vuelta.
--
--    Queda `ubicaciones` como destino válido, y se admite la foto todavía sin
--    colocar: el panel ya la muestra aparte, bajo «Sin ubicación», así que no
--    se pierde de vista.
--
-- 2. Los aportes de la comunidad se podían aprobar, descartar y devolver a
--    revisión, pero nunca borrar. Hacía falta para el duplicado, la prueba y el
--    aporte que no debería haberse guardado nunca.

-- ── 1. Una foto puede existir sin destino asignado ─────────────────────────
ALTER TABLE public.media_assets
  DROP CONSTRAINT IF EXISTS media_assets_has_target;

COMMENT ON TABLE public.media_assets IS
  'Fotografías propias del archivo. Una foto recién subida puede no tener destino: se le asigna después desde el panel.';

-- ── 2. Borrar un aporte ────────────────────────────────────────────────────
-- La tabla no tenía ni el permiso ni la política: faltaban los dos.
GRANT DELETE ON public.contributions TO authenticated;

DROP POLICY IF EXISTS "contrib admin delete" ON public.contributions;
CREATE POLICY "contrib admin delete" ON public.contributions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
