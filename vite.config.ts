import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Splitting vendor code into its own chunks means a returning
        // visitor's browser can cache "firebase" and "vendor" separately
        // from our own app code — so a deploy that only changes our
        // screens doesn't force a re-download of the entire Firebase SDK.
        // Firebase's modular SDK is the single biggest contributor to
        // bundle size here, bigger than any of our own code.
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("firebase")) return "firebase";
            if (id.includes("react") || id.includes("scheduler")) return "vendor";
            return "deps";
          }
        },
      },
    },
  },
});
