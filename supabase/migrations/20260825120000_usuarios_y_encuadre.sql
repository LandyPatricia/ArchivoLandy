-- Administración de usuarios y encuadre de retratos
-- ---------------------------------------------------------------------------
-- Dos cosas que el panel no podía hacer:
--
-- 1. Ver y cambiar el rol de las demás cuentas. `user_roles` solo dejaba leer
--    la fila propia, y los correos viven en `auth.users`, que PostgREST no
--    expone. Se resuelve con dos funciones SECURITY DEFINER reservadas a
--    administradores, en lugar de abrir `auth.users` al cliente.
--
-- 2. Corregir el encuadre de un retrato. Las fotos vienen de PatrimoniOS y son
--    de sólo lectura, así que el ajuste se guarda aquí, junto al resto de la
--    curaduría.

-- ── 1. Encuadre del retrato ────────────────────────────────────────────────
-- Valor de `object-position` de CSS ("50% 20%"). Todas las fotos se recortan
-- hoy desde arriba por igual, y en varias eso corta la frente o la barbilla.
-- NULL = sin ajuste, se usa el comportamiento por defecto del sitio.
ALTER TABLE public.personaje_settings
  ADD COLUMN IF NOT EXISTS encuadre text;

COMMENT ON COLUMN public.personaje_settings.encuadre IS
  'object-position del retrato, p.ej. "50% 20%". NULL = encuadre por defecto.';

-- ── 2. Lectura de roles por el administrador ───────────────────────────────
-- La política existente ("own roles readable") deja a cada quien ver su propia
-- fila; hace falta además que un administrador vea las de todos.
DROP POLICY IF EXISTS "admin reads all roles" ON public.user_roles;
CREATE POLICY "admin reads all roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- ── 3. Listar las cuentas ──────────────────────────────────────────────────
-- `auth.users` no es accesible desde el cliente y no debe serlo. Esta función
-- expone SÓLO lo que el panel necesita, y sólo a administradores.
CREATE OR REPLACE FUNCTION public.listar_usuarios()
RETURNS TABLE (
  id uuid,
  email text,
  rol public.app_role,
  creado_en timestamptz,
  ultimo_acceso timestamptz,
  confirmado boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.listar_usuarios() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.listar_usuarios() TO authenticated;

-- ── 4. Cambiar el rol de una cuenta ────────────────────────────────────────
-- `_rol` NULL deja la cuenta sin rol (acceso de visitante).
--
-- Dos candados, y viven aquí y no en la interfaz porque la interfaz se puede
-- saltar: el archivo nunca puede quedarse sin ningún administrador, y nadie
-- puede quitarse a sí mismo el rol —si te equivocas contigo mismo, pierdes el
-- panel y ya no hay cómo volver a entrar a arreglarlo.
CREATE OR REPLACE FUNCTION public.asignar_rol(_user_id uuid, _rol public.app_role)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
$$;

REVOKE ALL ON FUNCTION public.asignar_rol(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.asignar_rol(uuid, public.app_role) TO authenticated;

-- ── 5. El rol propio ───────────────────────────────────────────────────────
-- Para el indicador del panel: evita que cada pantalla arme su propia consulta
-- y funciona igual para una cuenta sin rol (devuelve NULL).
CREATE OR REPLACE FUNCTION public.mi_rol()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.mi_rol() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mi_rol() TO authenticated;
