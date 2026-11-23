import { AutoMovieDesignReferenceMedia } from "@automovie/interface";

import { AUTO_MOVIE_DESIGN_REFERENCE_MEDIA } from "./constants/AUTO_MOVIE_DESIGN_REFERENCE_MEDIA";

/**
 * Test whether a value names a registrable design-reference container.
 *
 * True only for one of the media types in `AUTO_MOVIE_DESIGN_REFERENCE_MEDIA`
 * (PNG, JPEG, SVG, PDF, DXF), compared exactly and case-sensitively; any
 * non-string is false. As a type guard it narrows the value to
 * `AutoMovieDesignReferenceMedia`. It judges the declared label only; whether
 * the bytes match it is the production inspector's check.
 *
 * @param value Any value, typically a reference's declared `media`.
 * @returns True when the value is one of the registrable media types.
 */
export const isAutoMovieDesignReferenceMedia: (
  value: unknown,
) => value is AutoMovieDesignReferenceMedia = (
  value: unknown,
): value is AutoMovieDesignReferenceMedia =>
  (AUTO_MOVIE_DESIGN_REFERENCE_MEDIA as readonly unknown[]).includes(value);
