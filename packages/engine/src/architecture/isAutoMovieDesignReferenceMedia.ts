import { AutoMovieDesignReferenceMedia } from "@automovie/interface";

import { AUTO_MOVIE_DESIGN_REFERENCE_MEDIA } from "./constants/AUTO_MOVIE_DESIGN_REFERENCE_MEDIA";

/**
 * Test whether a value names a registrable design-reference container.
 *
 * True only for one of the media types in
 * `AUTO_MOVIE_DESIGN_REFERENCE_MEDIA` (PNG, JPEG, SVG, PDF, DXF), compared
 * exactly and case-sensitively; any non-string is false. As a type guard it
 * narrows the value to `AutoMovieDesignReferenceMedia`.
 *
 * @evidence contracts/common.md#principled-implementation Uses `Array.prototype.includes` with SameValueZero over the registered constant, so the guard and the media union read the same list and an unregistered or differently cased string fails.
 * @evidence contracts/common.md#clear-and-simple-design The registry constant owns the list and this guard only tests membership; `validateDesignReference` is its in-repository caller, and the package export lets a production test a media string without re-spelling the list.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Widens the constant to `readonly unknown[]` only so `includes` accepts an unknown value, a type-level cast with no runtime effect; no media type is special-cased.
 * @evidence contracts/common.md#meaningful-documentation Names the five accepted types, the exact case-sensitive comparison, the false answer for non-strings, and the narrowing it performs.
 * @evidence contracts/performance.md#cost-and-resources A linear scan of a five-entry module constant per call, cheaper than hashing the value, with no allocation, cache or retained state.
 */
export const isAutoMovieDesignReferenceMedia = (
  value: unknown,
): value is AutoMovieDesignReferenceMedia =>
  (AUTO_MOVIE_DESIGN_REFERENCE_MEDIA as readonly unknown[]).includes(value);
