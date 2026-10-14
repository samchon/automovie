import type {
  BoxParser,
  DataStream,
  MP4BoxBuffer,
  VisualSampleEntry,
  createFile,
} from "mp4box";
import { createRequire } from "node:module";

/** The subset of `mp4box` this entry's writers and parsers reach. */
interface IMp4BoxModule {
  BoxParser: typeof BoxParser;
  DataStream: typeof DataStream;
  MP4BoxBuffer: typeof MP4BoxBuffer;
  VisualSampleEntry: typeof VisualSampleEntry;
  createFile: typeof createFile;
}

const load: NodeJS.Require = createRequire(__filename);
let mp4: IMp4BoxModule | undefined;

/**
 * The `mp4box` module, loaded on the first call and kept for the life of the process.
 *
 * A generated project seals each codec under a resident generation: it binds the package's on-disk identity and then refuses a later transitive replacement of any module in that closure. The seal has nothing to hold if the codec is already in `require.cache` when the generation is bound, so importing this entry must not load it. Types stay statically imported, because a type reference emits nothing. Every box class a caller tests with `instanceof` must come from this module, since boxes parsed here are instances of its classes and not of another copy's.
 *
 * @evidence contracts/common.md#principled-implementation `createRequire(__filename)` resolves `mp4box` the way a static import from this file would, and the `??=` assignment runs the load once, so the first call is the only point at which the codec enters `require.cache`; the premise is that no import-time code in this package reaches `mp4box` by value, which holds because every other file imports it with `import type`.
 * @evidence contracts/common.md#clear-and-simple-design One accessor owns the deferred load for every MP4 writer, parser and probe of the node entry, and the module interface lists only the five members they reach, so a new use of the codec is visible here.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The module is loaded through Node's own resolver and returned as loaded; nothing on it is replaced or wrapped. The `as IMp4BoxModule` assertion only names the shape `require` returns untyped, and the members listed match the package's published declarations.
 * @evidence contracts/common.md#meaningful-documentation The doc states when the module loads and how long it is kept, why loading on import would defeat the resident seal, why types remain static imports, and that `instanceof` checks must use this copy's classes.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The accessor is one cached lookup after the first call and chooses no algorithm or data structure.
 * @evidence contracts/performance.md#reuse-equivalent-work All accessor calls share the first module resolved from this file; the private mp4 reference is never invalidated, even if external code alters require.cache. This accessor does not authenticate a replacement dependency; the resident-generation owner enforces that separate boundary.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The module-level reference holds exactly one module object from the first call until process exit, which `require.cache` retains in any case; it opens no handle or task.
 */
export const residentMp4Box: () => IMp4BoxModule = (): IMp4BoxModule =>
  (mp4 ??= load("mp4box") as IMp4BoxModule);
