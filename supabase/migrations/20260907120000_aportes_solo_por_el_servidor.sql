-- Los aportes entran únicamente por el servidor.
-- ---------------------------------------------------------------------------
-- El formulario de /contribuir ya no escribe en esta tabla desde el navegador:
-- manda a `/api/contribuir`, que comprueba el captcha de Turnstile y sólo
-- entonces inserta, con la llave de servicio.
--
-- Mientras `anon` conserve el permiso de INSERT, esa comprobación es un candado
-- con la llave puesta: cualquiera puede escribir directo en la tabla saltándose
-- la ruta. Se le retira el permiso y se borra la política que lo amparaba.
--
-- OJO: corre esto DESPUÉS de desplegar la versión que usa /api/contribuir. Si
-- se corre antes, el formulario de la versión vieja deja de guardar.
--
-- `service_role` conserva ALL —es con lo que entra la ruta del servidor— y la
-- curaduría sigue leyendo y actualizando como hasta ahora.

REVOKE INSERT ON public.contributions FROM anon;

DROP POLICY IF EXISTS "contrib insert public" ON public.contributions;

-- Las personas con sesión iniciada (el equipo) sí pueden seguir registrando un
-- aporte a mano desde el panel.
DROP POLICY IF EXISTS "contrib insert equipo" ON public.contributions;
CREATE POLICY "contrib insert equipo" ON public.contributions
  FOR INSERT TO authenticated WITH CHECK (true);

COMMENT ON TABLE public.contributions IS
  'Aportes de la comunidad. Entran por /api/contribuir, que verifica el captcha; el público ya no puede insertar directamente.';
