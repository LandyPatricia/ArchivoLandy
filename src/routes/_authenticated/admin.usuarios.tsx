import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Search, UserPlus, Eye, EyeOff, Sparkles, Copy, Check, KeyRound } from "lucide-react";
import { Ornamento } from "@/components/brand/Isotipo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  ROLES,
  asignarRol,
  colorRol,
  crearUsuario,
  etiquetaRol,
  listarUsuarios,
  restablecerContrasena,
  usuariosKeys,
  type Rol,
  type Usuario,
} from "@/lib/usuarios";

// Cuentas del archivo.
// ---------------------------------------------------------------------------
// Quién entra y con qué permisos. Los correos salen de `auth.users` a través de
// `listar_usuarios()`, y el cambio de rol pasa por `asignar_rol()`: las dos son
// funciones de la base reservadas a administradores.
//
// Los candados —no quedarse sin administradores, no quitarse el rol a uno
// mismo— viven en la base, no aquí. Esta pantalla los anticipa deshabilitando
// lo que no procede, pero si algo se le escapa, la base lo rechaza igual.
export const Route = createFileRoute("/_authenticated/admin/usuarios")({
  component: Usuarios,
});

function fecha(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function generarPasswordSegura(): string {
  const chars = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789!@#$%&*";
  let pass = "";
  pass += "ABCDEFGHJKMNPQRSTUVWXYZ"[Math.floor(Math.random() * 24)];
  pass += "abcdefghjkmnpqrstuvwxyz"[Math.floor(Math.random() * 24)];
  pass += "23456789"[Math.floor(Math.random() * 8)];
  pass += "!@#$%&*"[Math.floor(Math.random() * 7)];
  for (let i = 0; i < 8; i++) {
    pass += chars[Math.floor(Math.random() * chars.length)];
  }
  return pass
    .split("")
    .sort(() => Math.random() - 0.5)
    .join("");
}

function Usuarios() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const [busqueda, setBusqueda] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [crearAbierto, setCrearAbierto] = useState(false);
  const [aRestablecer, setARestablecer] = useState<Usuario | null>(null);

  const usuarios = useQuery({
    queryKey: usuariosKeys.todos,
    queryFn: listarUsuarios,
    retry: false,
  });

  const cambiar = useMutation({
    mutationFn: ({ id, rol }: { id: string; rol: Rol | null }) => asignarRol(id, rol),
    onMutate: () => setError(null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: usuariosKeys.todos });
      qc.invalidateQueries({ queryKey: usuariosKeys.miRol });
    },
    onError: (e: Error) => setError(e.message),
  });

  // Memorizado porque `?? []` crea un arreglo nuevo en cada render y haria que
  // el useMemo de abajo recalculara siempre.
  const lista = useMemo(() => usuarios.data ?? [], [usuarios.data]);
  const admins = lista.filter((u) => u.rol === "admin").length;

  const visibles = useMemo(() => {
    const aguja = busqueda.trim().toLowerCase();
    if (!aguja) return lista;
    return lista.filter((u) => u.email.toLowerCase().includes(aguja));
  }, [lista, busqueda]);

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 py-10 sm:py-14 flex-1 w-full">
      <div className="text-magenta flex items-center gap-3">
        <Ornamento className="w-24 h-3" />
        <span className="text-xs tracking-[0.25em] uppercase font-semibold">Curaduría</span>
      </div>
      <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-verde mt-3">
        Cuentas y permisos
      </h1>
      <p className="mt-4 text-muted-foreground max-w-2xl leading-relaxed">
        Quién puede entrar al archivo y qué puede hacer. El rol se aplica en la base de datos, así
        que cambia de inmediato en todas las pantallas.
      </p>

      <div className="grid sm:grid-cols-3 gap-4 mt-10">
        <Stat label="Cuentas" value={lista.length} />
        <Stat label="Administradoras" value={admins} />
        <Stat label="Sin rol" value={lista.filter((u) => !u.rol).length} />
      </div>

      <div className="mt-10 flex flex-col sm:flex-row gap-4 sm:items-center sm:justify-between">
        <div className="relative max-w-md w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar por correo…"
            className="w-full rounded-full border-2 border-oro/40 bg-card pl-11 pr-5 py-3 text-sm text-verde placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
        <Button
          onClick={() => setCrearAbierto(true)}
          className="rounded-full bg-magenta hover:bg-magenta/90 text-crema font-semibold px-5 py-2.5 flex items-center justify-center gap-2 shrink-0 shadow-sm"
        >
          <UserPlus className="w-4 h-4" />
          Crear cuenta
        </Button>
      </div>

      <ModalCrearUsuario abierto={crearAbierto} onCerrar={() => setCrearAbierto(false)} />
      <ModalRestablecer usuario={aRestablecer} onCerrar={() => setARestablecer(null)} />

      {error && (
        <div className="mt-6 frame-oro bg-card rounded-lg p-4 border-l-4 border-l-hibisco">
          <p className="text-sm font-semibold text-hibisco">{error}</p>
        </div>
      )}

      {usuarios.isError && (
        <div className="mt-6 frame-oro bg-card rounded-lg p-5 sm:p-8">
          <h2 className="font-serif text-2xl text-verde">No se pudieron leer las cuentas</h2>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            {(usuarios.error as Error)?.message}
          </p>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-2xl">
            Si dice que la función no existe, falta correr la migración{" "}
            <code className="text-verde">20260825120000_usuarios_y_encuadre.sql</code>.
          </p>
        </div>
      )}

      {usuarios.isPending && <p className="mt-8 text-muted-foreground">Cargando cuentas…</p>}

      <div className="mt-8 space-y-3">
        {visibles.map((u) => (
          <FilaUsuario
            key={u.id}
            usuario={u}
            esYo={u.id === user.id}
            unicoAdmin={u.rol === "admin" && admins === 1}
            guardando={cambiar.isPending && cambiar.variables?.id === u.id}
            onCambiar={(rol) => cambiar.mutate({ id: u.id, rol })}
            onRestablecer={() => setARestablecer(u)}
          />
        ))}
      </div>

      {!usuarios.isPending && visibles.length === 0 && (
        <p className="mt-8 text-muted-foreground">No hay cuentas con ese criterio.</p>
      )}

      <div className="mt-16 frame-oro bg-card rounded-lg p-4 sm:p-6 max-w-3xl">
        <h2 className="font-serif text-2xl text-verde">Qué puede hacer cada rol</h2>
        <dl className="mt-4 divide-y divide-border">
          {ROLES.map((r) => (
            <div key={r.value} className="py-3 grid sm:grid-cols-[10rem_1fr] gap-1 sm:gap-4">
              <dt>
                <span
                  className="text-[11px] font-bold uppercase tracking-wide px-2 py-1 rounded-full text-crema"
                  style={{ background: r.color }}
                >
                  {r.label}
                </span>
              </dt>
              <dd className="text-sm text-verde/80 leading-relaxed">{r.hint}</dd>
            </div>
          ))}
          <div className="py-3 grid sm:grid-cols-[10rem_1fr] gap-1 sm:gap-4">
            <dt className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
              Sin rol
            </dt>
            <dd className="text-sm text-verde/80 leading-relaxed">
              La cuenta existe y puede iniciar sesión, pero el panel le queda cerrado.
            </dd>
          </div>
        </dl>
      </div>
    </main>
  );
}

function ModalCrearUsuario({
  abierto,
  onCerrar,
}: {
  abierto: boolean;
  onCerrar: () => void;
}) {
  const qc = useQueryClient();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rol, setRol] = useState<Rol | "">("editor");
  const [verPassword, setVerPassword] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [creadoExitoso, setCreadoExitoso] = useState<{
    email: string;
    password: string;
    rol: Rol | null;
  } | null>(null);

  const crear = useMutation({
    mutationFn: crearUsuario,
    onMutate: () => setErrorLocal(null),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: usuariosKeys.todos });
      toast.success(`Cuenta creada para ${data.email}`);
      setCreadoExitoso({
        email: data.email,
        password,
        rol: data.rol,
      });
    },
    onError: (err: Error) => {
      setErrorLocal(err.message);
    },
  });

  function generarClave() {
    const nueva = generarPasswordSegura();
    setPassword(nueva);
    setVerPassword(true);
  }

  function reiniciar() {
    setEmail("");
    setPassword("");
    setRol("editor");
    setVerPassword(false);
    setCopiado(false);
    setErrorLocal(null);
    setCreadoExitoso(null);
  }

  function cerrar() {
    reiniciar();
    onCerrar();
  }

  async function copiarCredenciales() {
    if (!creadoExitoso) return;
    const urlAcceso =
      typeof window !== "undefined" ? `${window.location.origin}/acceso` : "/acceso";
    const texto = `Datos de acceso a El Archivo de Mis Flores:\n\nSitio: ${urlAcceso}\nCorreo: ${creadoExitoso.email}\nContraseña: ${creadoExitoso.password}\nRol: ${etiquetaRol(creadoExitoso.rol)}`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      toast.success("Credenciales copiadas al portapapeles");
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      toast.error("No se pudo copiar al portapapeles");
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setErrorLocal("Completa todos los campos obligatorios.");
      return;
    }
    if (password.length < 8) {
      setErrorLocal("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    crear.mutate({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      rol: rol ? (rol as Rol) : null,
    });
  }

  return (
    <Dialog open={abierto} onOpenChange={(v) => (!v ? cerrar() : undefined)}>
      <DialogContent className="frame-oro bg-card max-w-lg p-6 sm:p-7 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-verde flex items-center gap-2">
            <UserPlus className="w-6 h-6 text-magenta shrink-0" />
            {creadoExitoso ? "Cuenta creada" : "Crear nueva cuenta"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {creadoExitoso
              ? "Comparte estos datos con la persona para que pueda ingresar al sistema."
              : "Registra una cuenta con correo y contraseña. Quedará confirmada de inmediato para que el usuario pueda ingresar en /acceso."}
          </DialogDescription>
        </DialogHeader>

        {creadoExitoso ? (
          <div className="space-y-5 py-2">
            <div className="rounded-xl border-2 border-verde/30 bg-verde/10 p-5 text-center">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-verde text-crema font-bold text-lg mb-2">
                ✓
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-verde">
                ¡Usuario registrado con éxito!
              </h3>
              <p className="text-xs text-muted-foreground mt-1">
                La cuenta ya está activa y confirmada en Supabase.
              </p>
            </div>

            <div className="rounded-xl border-2 border-oro/40 bg-arena/40 p-4 space-y-2.5 text-xs sm:text-sm text-verde">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Correo:
                </span>
                <span className="font-mono font-bold select-all break-all">
                  {creadoExitoso.email}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Contraseña:
                </span>
                <span className="font-mono font-bold select-all bg-card/80 px-2 py-0.5 rounded border border-oro/30">
                  {creadoExitoso.password}
                </span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Rol inicial:
                </span>
                <span
                  className="text-[11px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full text-crema inline-block self-start sm:self-auto"
                  style={{ background: colorRol(creadoExitoso.rol) }}
                >
                  {etiquetaRol(creadoExitoso.rol)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Button
                type="button"
                onClick={copiarCredenciales}
                className="flex-1 bg-magenta hover:bg-magenta/90 text-crema flex items-center justify-center gap-2 rounded-full py-2.5"
              >
                {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiado ? "¡Copiado al portapapeles!" : "Copiar credenciales"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={reiniciar}
                className="rounded-full border-2 border-oro/40 text-verde hover:bg-card"
              >
                Crear otra
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={cerrar}
                className="rounded-full text-muted-foreground"
              >
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 py-2">
            {errorLocal && (
              <div className="rounded-lg border-2 border-hibisco/40 bg-hibisco/10 p-3 text-xs text-hibisco font-medium">
                {errorLocal}
              </div>
            )}

            <div>
              <Label
                htmlFor="nuevo-email"
                className="text-xs font-semibold uppercase tracking-wider text-verde"
              >
                Correo electrónico *
              </Label>
              <Input
                id="nuevo-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="colaborador@correo.com"
                className="mt-1.5 rounded-lg border-2 border-oro/40 bg-background text-verde placeholder:text-muted-foreground"
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="nuevo-password"
                  className="text-xs font-semibold uppercase tracking-wider text-verde"
                >
                  Contraseña inicial *
                </Label>
                <button
                  type="button"
                  onClick={generarClave}
                  className="text-[11px] font-semibold text-hibisco hover:text-magenta flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generar segura
                </button>
              </div>
              <div className="relative mt-1.5">
                <Input
                  id="nuevo-password"
                  type={verPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  className="pr-10 rounded-lg border-2 border-oro/40 bg-background text-verde placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setVerPassword(!verPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-verde cursor-pointer"
                  aria-label={verPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {verPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[11px] text-muted-foreground mt-1">
                Se guardará confirmada. Podrás copiarla al terminar para enviársela.
              </p>
            </div>

            <div>
              <Label
                htmlFor="nuevo-rol"
                className="text-xs font-semibold uppercase tracking-wider text-verde"
              >
                Rol asignado
              </Label>
              <select
                id="nuevo-rol"
                value={rol}
                onChange={(e) => setRol(e.target.value as Rol | "")}
                className="mt-1.5 w-full rounded-lg border-2 border-oro/40 bg-background px-3 py-2 text-sm text-verde focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="editor">Editora — Curaduría y edición sin gestionar cuentas</option>
                <option value="admin">Administradora — Acceso total, curaduría y cuentas</option>
                <option value="viewer">Lectora — Cuenta registrada, sin acceso al panel</option>
                <option value="">Sin rol — Cuenta registrada sin panel</option>
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={cerrar}
                disabled={crear.isPending}
                className="rounded-full border-2 border-oro/40"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={crear.isPending}
                className="rounded-full bg-magenta hover:bg-magenta/90 text-crema font-semibold px-6"
              >
                {crear.isPending ? "Creando…" : "Crear cuenta"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ModalRestablecer({
  usuario,
  onCerrar,
}: {
  usuario: Usuario | null;
  onCerrar: () => void;
}) {
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [errorLocal, setErrorLocal] = useState<string | null>(null);
  const [listo, setListo] = useState<{ email: string; password: string } | null>(null);

  const restablecer = useMutation({
    mutationFn: restablecerContrasena,
    onMutate: () => setErrorLocal(null),
    onSuccess: (data) => {
      toast.success(`Contraseña restablecida para ${data.email}`);
      setListo({ email: data.email, password });
    },
    onError: (err: Error) => setErrorLocal(err.message),
  });

  function cerrar() {
    setPassword("");
    setVerPassword(false);
    setCopiado(false);
    setErrorLocal(null);
    setListo(null);
    onCerrar();
  }

  async function copiar() {
    if (!listo) return;
    const urlAcceso =
      typeof window !== "undefined" ? `${window.location.origin}/acceso` : "/acceso";
    const texto = `Tu nueva contraseña de El Archivo de Mis Flores:\n\nSitio: ${urlAcceso}\nCorreo: ${listo.email}\nContraseña: ${listo.password}`;
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      toast.success("Datos copiados al portapapeles");
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      toast.error("No se pudo copiar al portapapeles");
    }
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!usuario) return;
    if (password.trim().length < 8) {
      setErrorLocal("La contraseña debe tener al menos 8 caracteres.");
      return;
    }
    restablecer.mutate({ userId: usuario.id, password: password.trim() });
  }

  return (
    <Dialog open={usuario !== null} onOpenChange={(v) => (!v ? cerrar() : undefined)}>
      <DialogContent className="frame-oro bg-card max-w-lg p-6 sm:p-7 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-verde flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-magenta shrink-0" />
            {listo ? "Contraseña restablecida" : "Restablecer contraseña"}
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground leading-relaxed break-words">
            {listo
              ? "La contraseña anterior ya no sirve. Comparte la nueva con la persona."
              : `Pon una contraseña nueva para ${usuario?.email ?? ""}. La anterior dejará de funcionar.`}
          </DialogDescription>
        </DialogHeader>

        {listo ? (
          <div className="space-y-5 py-2">
            <div className="rounded-xl border-2 border-oro/40 bg-arena/40 p-4 space-y-2.5 text-xs sm:text-sm text-verde">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Correo:
                </span>
                <span className="font-mono font-bold select-all break-all">{listo.email}</span>
              </div>
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1">
                <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold">
                  Contraseña nueva:
                </span>
                <span className="font-mono font-bold select-all bg-card/80 px-2 py-0.5 rounded border border-oro/30">
                  {listo.password}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <Button
                type="button"
                onClick={copiar}
                className="flex-1 bg-magenta hover:bg-magenta/90 text-crema flex items-center justify-center gap-2 rounded-full py-2.5"
              >
                {copiado ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                {copiado ? "¡Copiado al portapapeles!" : "Copiar datos"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={cerrar}
                className="rounded-full text-muted-foreground"
              >
                Cerrar
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4 py-2">
            {errorLocal && (
              <div className="rounded-lg border-2 border-hibisco/40 bg-hibisco/10 p-3 text-xs text-hibisco font-medium">
                {errorLocal}
              </div>
            )}

            <div>
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="restablecer-password"
                  className="text-xs font-semibold uppercase tracking-wider text-verde"
                >
                  Contraseña nueva *
                </Label>
                <button
                  type="button"
                  onClick={() => {
                    setPassword(generarPasswordSegura());
                    setVerPassword(true);
                  }}
                  className="text-[11px] font-semibold text-hibisco hover:text-magenta flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Generar segura
                </button>
              </div>
              <div className="relative mt-1.5">
                <Input
                  id="restablecer-password"
                  type={verPassword ? "text" : "password"}
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 8 caracteres"
                  autoComplete="new-password"
                  className="pr-10 rounded-lg border-2 border-oro/40 bg-background text-verde placeholder:text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => setVerPassword(!verPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-verde cursor-pointer"
                  aria-label={verPassword ? "Ocultar contraseña" : "Ver contraseña"}
                >
                  {verPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="outline"
                onClick={cerrar}
                disabled={restablecer.isPending}
                className="rounded-full border-2 border-oro/40"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={restablecer.isPending}
                className="rounded-full bg-magenta hover:bg-magenta/90 text-crema font-semibold px-6"
              >
                {restablecer.isPending ? "Guardando…" : "Restablecer"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}

function FilaUsuario({
  usuario,
  esYo,
  unicoAdmin,
  guardando,
  onCambiar,
  onRestablecer,
}: {
  usuario: Usuario;
  esYo: boolean;
  unicoAdmin: boolean;
  guardando: boolean;
  onCambiar: (rol: Rol | null) => void;
  onRestablecer: () => void;
}) {
  // Cambiar el propio rol o degradar al último administrador deja el archivo
  // sin quién lo administre. La base lo rechaza; aquí se avisa antes.
  const bloqueado = esYo || unicoAdmin;
  const motivo = esYo
    ? "Es tu cuenta: otra administradora tendría que cambiarte el rol."
    : unicoAdmin
      ? "Es la única administradora del archivo. Nombra otra antes de cambiarle el rol."
      : null;

  return (
    // En el telefono, en columna. Estaba en un renglon con `flex-wrap`, y eso
    // no reparte: la insignia y el desplegable no encogen, asi que el bloque
    // flexible se quedaba con lo que sobraba —unos veinte pixeles— y el correo
    // salia en vertical, una letra por renglon. Envolver solo pasa cuando algo
    // ya no cabe, y aqui siempre cabia por los pelos.
    <article className="frame-oro bg-card rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3 sm:gap-4">
      <div className="min-w-0 w-full sm:w-auto sm:flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-verde break-words min-w-0">{usuario.email}</span>
          {esYo && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-verde text-crema">
              Tú
            </span>
          )}
          {!usuario.confirmado && (
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amarillo/40 border-2 border-amarillo text-verde">
              Sin confirmar
            </span>
          )}
        </div>
        <div className="text-xs text-muted-foreground mt-1">
          Registrada el {fecha(usuario.creado_en)} · Último acceso {fecha(usuario.ultimo_acceso)}
        </div>
        {motivo && <div className="text-xs text-muted-foreground mt-1 italic">{motivo}</div>}
      </div>

      {/* El rol que tiene y el rol que se le pone, juntos: son la misma cosa
          leida y escrita, y separados por media tarjeta no se relacionaban. */}
      <div className="flex items-center gap-2 w-full sm:w-auto">
        <span
          className="text-[11px] font-bold uppercase tracking-wide px-3 py-1 rounded-full shrink-0"
          style={
            usuario.rol
              ? { background: colorRol(usuario.rol), color: "var(--crema)" }
              : { border: "2px solid var(--border)", color: "var(--muted-foreground)" }
          }
        >
          {etiquetaRol(usuario.rol)}
        </span>

        <select
          value={usuario.rol ?? ""}
          disabled={bloqueado || guardando}
          onChange={(e) => onCambiar((e.target.value || null) as Rol | null)}
          aria-label={`Rol de ${usuario.email}`}
          className="flex-1 sm:flex-none rounded-full border-2 border-oro/40 bg-card px-4 py-2 text-sm font-semibold text-verde disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <option value="">Sin rol</option>
          {ROLES.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={onRestablecer}
          title="Restablecer contraseña"
          aria-label={`Restablecer contraseña de ${usuario.email}`}
          className="shrink-0 rounded-full border-2 border-oro/40 bg-card p-2 text-verde hover:bg-arena/40 focus:outline-none focus:ring-2 focus:ring-ring cursor-pointer"
        >
          <KeyRound className="w-4 h-4" />
        </button>
      </div>
    </article>
  );
}

function Stat({ label, value }: { label: string; value?: number }) {
  return (
    <div className="frame-oro bg-card rounded-lg p-4 sm:p-6">
      <div className="font-serif text-4xl text-hibisco">{value ?? "—"}</div>
      <div className="text-xs tracking-[0.2em] uppercase text-muted-foreground mt-2">{label}</div>
    </div>
  );
}
