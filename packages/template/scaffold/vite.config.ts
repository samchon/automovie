import { defineConfig } from "vite";

/** Running production viewer; generated evidence and capture scratch never reload it. */
export default defineConfig({ server: { host: "127.0.0.1", port: 5173, strictPort: true, watch: { ignored: ["**/.tmp/**", "**/.cache/**", "**/output/**"] } } });
