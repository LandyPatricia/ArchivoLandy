-- Aprobación de aportes de la comunidad
-- ---------------------------------------------------------------------------
-- `contributions` ya nacía con `status = 'pending'`, pero nada leía esa columna:
-- los aportes entraban a la base y ahí se quedaban. Esto cierra el circuito —
-- revisar, aprobar y publicar— con dos piezas:
--
--   1. Al aprobar hay que decir A QUIÉN pertenece la memoria. El visitante
--      escribe el nombre a mano en `related_person` y eso no basta para
--      enlazar: se guarda el id del personaje de PatrimoniOS que elige quien
--      revisa.
--
--   2. Una vista pública con SÓLO las columnas que pueden verse. El correo y el
--      teléfono de quien aporta nunca salen de aquí, así que la tabla NO se
--      abre a lectura pública: se expone la vista.

-- ── 1. A quién pertenece y quién revisó ────────────────────────────────────
ALTER TABLE public.contributions
  ADD COLUMN IF NOT EXISTS personaje_id text,
  ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;

COMMENT ON COLUMN public.contributions.personaje_id IS
  'Id del personaje en PatrimoniOS al que se atribuye la memoria. Lo elige quien aprueba.';

CREATE INDEX IF NOT EXISTS idx_contributions_status
  ON public.contributions(status, created_at DESC);

-- ── 2. Sello automático de revisión ────────────────────────────────────────
-- Se pone en la base y no en el cliente para que quede aunque el aporte se
-- apruebe desde otro lado (un script, la consola de Supabase).
CREATE OR REPLACE FUNCTION public.touch_contribution_review()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    NEW.reviewed_at = now();
    NEW.reviewed_by = auth.uid();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_touch_contribution_review ON public.contributions;
CREATE TRIGGER trg_touch_contribution_review
  BEFORE UPDATE ON public.contributions
  FOR EACH ROW EXECUTE FUNCTION public.touch_contribution_review();

-- ── 3. Lo que sí es público ────────────────────────────────────────────────
-- Sólo aportes aprobados y ya atribuidos a una persona, y sólo las columnas
-- publicables. `contributor_email` y `contributor_phone` quedan fuera a
-- propósito: se piden para poder responderle a quien aporta, no para mostrarse.
--
-- La vista no lleva `security_invoker`, así que se evalúa con los permisos de su
-- dueño y esquiva la RLS de la tabla. Es justo lo que se busca: el filtro de qué
-- se publica vive en el WHERE de aquí, y la tabla sigue cerrada.
CREATE OR REPLACE VIEW public.memorias_publicas AS
  SELECT
    id,
    personaje_id,
    contributor_name,
    relation,
    subject,
    message,
    related_year,
    created_at
  FROM public.contributions
  WHERE status = 'approved' AND personaje_id IS NOT NULL;

GRANT SELECT ON public.memorias_publicas TO anon, authenticated;

COMMENT ON VIEW public.memorias_publicas IS
  'Aportes aprobados y atribuidos, sin datos de contacto. Es lo único de contributions que ve el público.';
