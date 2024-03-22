import { defineConfig } from "vite";
import solid from "vite-plugin-solid";

export default defineConfig({
  plugins: [solid()],

  build: {
    lib: {
      entry: "src/exports.ts",
      name: "Ambush",
      fileName: "ambush",
    },
    rollupOptions: {
      external: ["solid"],
    },
  },
});
