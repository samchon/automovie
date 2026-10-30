import { defineConfig } from "vite";

/** The observed Chrome delivery host supports native top-level module loading. */
export default defineConfig({ build: { target: "es2022" } });
