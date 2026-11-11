import type { IAutoMovieModel } from "@automovie/interface";

import type { AutoMovieTextureCache } from "./AutoMovieTextureCache.js";

/**
 * Model definitions, requested identities and the shot's texture owner used to
 * lower borrowed surface materials. Resolution admits the complete requested
 * identity set before constructing any runtime materials.
 *
 * @evidence contracts/development/design.md#principled-representation Complete model declarations and requested material ids admit one definition per identity before runtime construction, with an optional already-owned shot cache providing decoded texture bindings.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Separates cross-model identity search, borrowing-surface demand and texture ownership in the three inputs the library builder requires.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Equal repeated declarations are allowed but conflicts refuse; null means renderer default while blank ids and missing textured cache cannot silently choose a fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Documents model borrowing, duplicate/conflict semantics, requested id deduplication and texture-cache requirements and ownership.
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
