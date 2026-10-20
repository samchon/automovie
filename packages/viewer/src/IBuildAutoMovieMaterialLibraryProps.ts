import type { IAutoMovieModel } from "@automovie/interface";

import type { AutoMovieTextureCache } from "./AutoMovieTextureCache.js";

/**
 * Model definitions, requested identities and the shot's texture owner used to
 * lower borrowed surface materials. Resolution admits the complete requested
 * identity set before constructing any runtime materials.
 *
 * @evidence contracts/common.md#principled-implementation Complete model declarations and requested material ids admit one definition per identity before runtime construction, with an optional already-owned shot cache providing decoded texture bindings.
 * @evidence contracts/common.md#clear-and-simple-design Separates cross-model identity search, borrowing-surface demand and texture ownership in the three inputs the library builder requires.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Equal repeated declarations are allowed but conflicts refuse; null means renderer default while blank ids and missing textured cache cannot silently choose a fallback.
 * @evidence contracts/common.md#meaningful-documentation Documents model borrowing, duplicate/conflict semantics, requested id deduplication and texture-cache requirements and ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The input record chooses no definition-search or material-build algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Repeated requested ids and texture assets are deduplicated by their owning builders/cache, not by this type.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources All supplied models and the optional shot cache remain caller-owned; the returned library owns only its new materials.
 */
export interface IBuildAutoMovieMaterialLibraryProps {
  /**
   * Caller-owned compiled models searched for each requested material. Equal
   * declarations may repeat; conflicting definitions are refused, not ordered.
   */
  models: readonly IAutoMovieModel[];

  /**
   * Material ids requested by borrowing surfaces; null uses their renderer-owned
   * default. Blank ids refuse, and repeated ids are constructed only once.
   */
  materialIds: Iterable<string | null>;

  /**
   * Shot-owned cache primed before construction; omission is supported only
   * when the requested definitions have no texture bindings. The library
   * borrows its resolver and never disposes this cache.
   */
  textures?: AutoMovieTextureCache;
}
