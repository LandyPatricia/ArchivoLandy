-- Quién entró por el muro de acceso.
-- ---------------------------------------------------------------------------
-- Mientras el archivo se termina, el sitio está cerrado con tres contraseñas
-- compartidas. Como la contraseña no identifica a nadie, al entrar se pide el
-- nombre y aquí queda la constancia: quién dijo ser, con cuál de las tres
-- claves entró y cuándo.
--
-- Escribe SÓLO el servidor, con la llave de servicio, desde /api/muro. El
-- navegador no puede leer ni escribir esta tabla: es un registro, y la gente
-- que entra no tiene por qué ver quién más entró.

create table if not exists public.accesos (
  id uuid primary key default gen_random_uuid(),
  creado_en timestamptz not null default now(),
  nombre text not null,
  -- Cuál de las tres claves se usó, y con qué etiqueta estaba configurada.
  -- Se guarda la etiqueta del momento y no una referencia: si mañana la clave 2
  -- pasa de «Familias» a «Prensa», lo ya anotado debe seguir diciendo la verdad.
  llave smallint not null,
  etiqueta text,
  ip text,
  agente text
);

comment on table public.accesos is
  'Entradas por el muro de acceso temporal. Lo escribe el servidor desde /api/muro.';

-- Por fecha descendente, que es como se lee: lo último primero.
create index if not exists accesos_creado_en_idx on public.accesos (creado_en desc);

alter table public.accesos enable row level security;

-- Sin políticas de escritura a propósito: la llave de servicio se salta RLS, y
-- nadie más debe poder añadir líneas a un registro.

-- Leerlo, sólo el equipo con sesión iniciada.
drop policy if exists "accesos lectura equipo" on public.accesos;
create policy "accesos lectura equipo"
  on public.accesos for select
  to authenticated
  using (true);
