import { AutoMovieDesignReferenceMedia } from "@automovie/interface";

import { AUTO_MOVIE_DESIGN_REFERENCE_MEDIA } from "./constants/AUTO_MOVIE_DESIGN_REFERENCE_MEDIA";

/**
 * Test whether a value names a registrable design-reference container.
 *
 * True only for one of the media types in
 * `AUTO_MOVIE_DESIGN_REFERENCE_MEDIA` (PNG, JPEG, SVG, PDF, DXF), compared
 * exactly and case-sensitively; any non-string is false. As a type guard it
 * narrows the value to `AutoMovieDesignReferenceMedia`.
 */
export const isAutoMovieDesignReferenceMedia = (
  value: unknown,
): value is AutoMovieDesignReferenceMedia =>
  (AUTO_MOVIE_DESIGN_REFERENCE_MEDIA as readonly unknown[]).includes(value);
