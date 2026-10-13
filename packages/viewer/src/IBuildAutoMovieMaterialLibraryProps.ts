import type { IAutoMovieModel } from "@automovie/interface";

import type { AutoMovieTextureCache } from "./AutoMovieTextureCache.js";

/**
 * Model definitions, requested identities and the shot's texture owner used to
 * lower borrowed surface materials. Resolution admits the complete requested
 * identity set before constructing any runtime materials.
 *
 * @author Samchon
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
