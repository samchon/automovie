import { defineConfig } from "vite";
import { boutPhysicalCachePlugin } from "./boutPhysicalCachePlugin";

/** This new consumer resolves only public workspace package entries. */
export default defineConfig({
  publicDir: false,
  plugins: [boutPhysicalCachePlugin()],
  server: { fs: { allow: ["../../.."] } },
  build: { chunkSizeWarningLimit: 1600 },
});
