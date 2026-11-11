import { type UserConfig, defineConfig } from "vite";

// GitHub Pages serves the site under the repository name, and that path is
// case-sensitive (currently `/automovie/`). A relative
// base keeps every asset URL correct wherever the build is mounted, so a
// repository rename or a local preview needs no rebuild.
/**
 * Relative asset base, dev and preview ports for the placeholder page. This declaration configures the tool and does not establish a successful build or browser observation.
 *
 * One named configuration owns the ports and the relative base; vite.config.ts reexports it as the tool-required default. Vite owns build algorithms, watchers and server lifetime; this declaration acquires none of those runtime resources.
 */
export const websiteViteConfig: UserConfig = defineConfig({
  base: "./",
  server: { host: "127.0.0.1", port: 5174, strictPort: true },
  preview: { host: "127.0.0.1", port: 4174, strictPort: true },
});
