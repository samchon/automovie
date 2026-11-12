/**
 * The Vite configuration every page `writeAutoMovieModulePage` writes is served or built with: the page's folder as the root, the production's configuration file and public folder, quiet logging, and the page itself as the dependency scanner's entry.
 *
 * The page lives under `node_modules/.cache/automovie/`, and Vite's own entry search skips everything under `node_modules`, so without an entry it finds none, logs "Could not auto-determine entry point" and skips pre-bundling, which makes the first load of a development server slow. `optimizeDeps.entries` is `index.html`, a name without glob characters, which Vite resolves against the root as it is instead of globbing with that skip; it also wins over the production's own `build.rollupOptions.input`, so the scan starts from this page rather than the production's. A host adds its own `server`, `build` or `base` beside these members.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States every member, why the entry is needed and why it is written as a plain name, its precedence over the production's input, and what a host adds.
 * @evidence contracts/development/implementation.md#principled-implementation Vite's scanner takes explicit `optimizeDeps.entries` first, resolving a pattern without glob characters directly against `root`, and only globs with the `node_modules` skip otherwise; naming the page's own `index.html` makes the scan start where the page does, whatever folder holds it.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One record from the written page, shared by the draw page's build and the inspector's development server.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The production's configuration file is loaded, not replaced; only the root, the public folder and the scan entry are set for the page.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of one page.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record and keeps nothing.
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
