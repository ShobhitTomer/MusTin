import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcssPlugin from "@tailwindcss/postcss";
import autoprefixer from "autoprefixer";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Add JSX runtime for styled-components
      jsxRuntime: "automatic",
      babel: {
        plugins: [
          [
            "styled-components",
            {
              displayName: true,
              fileName: false,
            },
          ],
        ],
      },
    }),
  ],
  css: {
    postcss: {
      plugins: [tailwindcssPlugin(), autoprefixer],
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
