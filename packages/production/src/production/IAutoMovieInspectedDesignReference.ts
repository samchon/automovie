import type { AutoMovieContentDigest, AutoMovieDesignReferenceMedia } from "@automovie/interface";

import type { IAutoMovieDesignReferenceBounds } from "./IAutoMovieDesignReferenceBounds";

/**
 * What one design-reference asset's bytes actually are.
 *
 * @evidence requirements/external-inputs/media-families-and-declared-facts.md#external-media-image-video Carries the container-confirmed image family, source extent and exact inspected-byte digest together.
 * @evidence requirements/external-inputs/media-families-and-declared-facts.md#external-media-spatial-data Carries drawing-family and extent observations without claiming geospatial adoption.
 * @evidence specifications/interchange-and-adoption/media-inspection-boundaries.md#interchange-image-video-inspection Exposes the image inspector's parsed container facts as one result.
 * @evidence specifications/interchange-and-adoption/media-inspection-boundaries.md#interchange-design-drawing-inspection Keeps an unsupported drawing extent distinct from its confirmed container family.
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
