import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import { nitro } from "nitro/vite";
import tailwindcss from "@tailwindcss/vite";
import { mediaDev } from "./vite-plugin-media-dev";

export default defineConfig({
  plugins: [
    // Antes que nada: en desarrollo Vite se queda con las peticiones de imagen
    // y el handler del servidor nunca las ve. Ver el plugin.
    mediaDev(),
    tanstackStart({
      server: { entry: "server" },
    }),
    tailwindcss(),
    tsconfigPaths(),
    react(),
    nitro({
      defaultPreset: "cloudflare-module",
    }),
  ],
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
