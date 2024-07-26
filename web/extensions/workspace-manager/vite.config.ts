import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  envDir: ".",
  build: {
    watch: {
      include: ["src/**"],
    },
    // minify: false, // ___DEBUG__MODE only
    // sourcemap: true, // ___DEBUG___MODE only
    emptyOutDir: true,
    rollupOptions: {
      // externalize deps that shouldn't be bundled into your library
      external: ["/scripts/app.js", "/scripts/api.js"],
      input: {
        input: "/src/main.tsx",
      },
      output: {
        // Provide global variables to use in the UMD build for externalized deps
        globals: {
          Litegraph: "LiteGraph",
        },
        dir: "./dist",
        // assetFileNames: "[name]-[hash][extname]",
        entryFileNames: "[name].js",
        chunkFileNames: `[name]-[hash].js`,
        assetFileNames: `[name].[ext]`,
      },
    },
  },
  plugins: [react()],
}));
