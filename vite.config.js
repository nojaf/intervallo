import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import rescript from "@nojaf/vite-plugin-rescript";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react({
      include: ["**/*.res.mjs"],
    }),
    rescript(),
  ],
  server: {
    watch: {
      // We ignore ReScript build artifacts to avoid unnecessarily triggering HMR on incremental compilation
      ignored: ["**/lib/bs/**", "**/lib/ocaml/**", "**/lib/rescript.lock"],
    },
  },
});
