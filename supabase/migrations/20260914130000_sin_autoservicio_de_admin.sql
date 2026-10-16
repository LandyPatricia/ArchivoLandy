-- Nadie se hace administrador solo.
-- ---------------------------------------------------------------------------
-- El archivo nació con una puerta de cortesía: `claim_admin_if_first()` le daba
-- el mando a la primera cuenta que lo pidiera, para que el proyecto pudiera
-- arrancar sin tocar la base a mano. Eso tenía sentido exactamente un día.
--
-- Hoy ya hay administradores, así que la función no concede nada —comprueba que
-- el conteo sea cero—, pero sigue expuesta a cualquier cuenta autenticada. Se
-- le quita el permiso: una puerta que no lleva a ninguna parte igual conviene
-- tapiarla, porque el día que alguien borre los roles para depurar algo, la
-- puerta vuelve a abrirse sin que nadie se dé cuenta.
--
-- A partir de aquí los administradores se nombran desde /admin/usuarios, que es
-- donde se ve quién tiene qué.

revoke execute on function public.claim_admin_if_first() from authenticated;
revoke execute on function public.claim_admin_if_first() from anon;
revoke execute on function public.claim_admin_if_first() from public;

comment on function public.claim_admin_if_first() is
  'Obsoleta. Servía para que la primera cuenta se hiciera administradora; ya no se puede ejecutar. Los roles se reparten desde /admin/usuarios.';
