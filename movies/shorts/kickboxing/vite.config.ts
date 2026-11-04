import { defineConfig } from "vite";

/** This new consumer resolves only public workspace package entries. */
export default defineConfig({ publicDir: false, server: { fs: { allow: ["../../.."] } }, build: { chunkSizeWarningLimit: 1600 } });
