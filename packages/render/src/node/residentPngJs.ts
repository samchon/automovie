import { createRequire } from "node:module";
import type { PNG } from "pngjs";

/** The subset of `pngjs` the picture probe reaches. */
interface IPngModule {
  PNG: typeof PNG;
}

const load: NodeJS.Require = createRequire(__filename);
let png: IPngModule | undefined;

/**
 * The `pngjs` module, loaded on the first call and kept for the life of the process.
 *
 * Deferring the load lets a host bind its resident codec generation before the decoder enters `require.cache`; importing this entry for another helper does not load the decoder. `probeProductionPngPicture` is the only caller in this package.
 *
 * @evidence contracts/common.md#principled-implementation `createRequire(__filename)` resolves `pngjs` exactly as a static import from this file would, and `??=` runs the load once, so the first call is the only point at which the decoder enters `require.cache`; this holds because every other render file imports `pngjs` with `import type`.
 * @evidence contracts/common.md#clear-and-simple-design One accessor owns this package's deferred decoder load, resolved from its declared dependency; its interface names only the `PNG` member the picture probe uses.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The module is loaded through Node's resolver and returned unchanged; the `as IPngModule` assertion only names the untyped `require` result by the package's published declaration.
 * @evidence contracts/common.md#meaningful-documentation The doc states when the decoder loads and how long it is kept, how deferred loading allows a host to bind its resident codec generation first, and its one caller.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The accessor is a cached lookup after the first call and chooses no algorithm.
 * @evidence contracts/performance.md#reuse-equivalent-work All accessor calls share the first module resolved from this file; the private png reference is never invalidated, even if external code alters require.cache. This accessor does not authenticate later dependency bytes; the resident-generation owner enforces that separate boundary.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The module-level reference keeps one module object from the first call until process exit, which `require.cache` retains anyway; no handle or task is opened.
 */
export const residentPngJs: () => IPngModule = (): IPngModule =>
  (png ??= load("pngjs") as IPngModule);
