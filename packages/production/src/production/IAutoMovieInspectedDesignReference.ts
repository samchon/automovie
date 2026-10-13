import type { AutoMovieContentDigest, AutoMovieDesignReferenceMedia } from "@automovie/interface";

import type { IAutoMovieDesignReferenceBounds } from "./IAutoMovieDesignReferenceBounds";

/**
 * What one design-reference asset's bytes actually are.
 *
 * @author Samchon
 */
export interface IAutoMovieInspectedDesignReference {
  /**
   * Container family confirmed by its own parser, never by a name.
   */
  media: AutoMovieDesignReferenceMedia;

  /**
   * SHA-256 of the exact inspected bytes.
   */
  digest: AutoMovieContentDigest;

  /**
   * Source-space extent, or the reason this host cannot measure it.
   */
  bounds: IAutoMovieDesignReferenceBounds;
}
