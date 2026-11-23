/**
 * The Vite configuration every page `writeAutoMovieModulePage` writes is served
 * or built with: the page's folder as the root, the production's configuration
 * file and public folder, quiet logging, and the page itself as the dependency
 * scanner's entry.
 *
 * The page lives under `node_modules/.cache/automovie/`, and Vite's own entry
 * search skips everything under `node_modules`, so without an entry it finds
 * none, logs "Could not auto-determine entry point" and skips pre-bundling,
 * which makes the first load of a development server slow.
 * `optimizeDeps.entries` is `index.html`, a name without glob characters, which
 * Vite resolves against the root as it is instead of globbing with that skip;
 * it also wins over the production's own `build.rollupOptions.input`, so the
 * scan starts from this page rather than the production's. A host adds its own
 * `server`, `build` or `base` beside these members.
 */
export function planAutoMovieModulePageViteConfig(page: {
  /** The page's folder, the root it is served from. */
  folder: string;

  /** The production's `vite.config.ts`, or `false` when it has none. */
  configFile: string | false;

  /** The production's `public` folder, or `false` when it has none. */
  publicDir: string | false;
}): {
  /** The page's folder. */
  root: string;

  /** The production's configuration file, or `false`. */
  configFile: string | false;

  /** The production's public folder, or `false`. */
  publicDir: string | false;

  /** Only warnings and errors. */
  logLevel: "warn";

  /** Keep earlier output on screen. */
  clearScreen: false;

  /** The dependency scanner's entry. */
  optimizeDeps: {
    /** The page's own `index.html`, relative to `root`. */
    entries: string[];
  };
} {
  return {
    root: page.folder,
    configFile: page.configFile,
    publicDir: page.publicDir,
    logLevel: "warn",
    clearScreen: false,
    optimizeDeps: { entries: ["index.html"] },
  };
}
