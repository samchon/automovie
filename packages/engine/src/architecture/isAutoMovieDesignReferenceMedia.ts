import { AutoMovieDesignReferenceMedia } from "@automovie/interface";

import { AUTO_MOVIE_DESIGN_REFERENCE_MEDIA } from "./constants/AUTO_MOVIE_DESIGN_REFERENCE_MEDIA";

/**
 * Test whether a value names a registrable design-reference container.
 *
 * True only for one of the media types in
 * `AUTO_MOVIE_DESIGN_REFERENCE_MEDIA` (PNG, JPEG, SVG, PDF, DXF), compared
 * exactly and case-sensitively; any non-string is false. As a type guard it
 * narrows the value to `AutoMovieDesignReferenceMedia`. It judges the declared
 * label only; whether the bytes match it is the production inspector's check.
 *
 * @param value Any value, typically a reference's declared `media`.
 * @returns True when the value is one of the registrable media types.
 *
 * @evidence contracts/common.md#principled-implementation Strict membership in the constant media table via `Array.prototype.includes`, which uses SameValueZero, so only an identical string matches and no non-string can.
 * @evidence contracts/common.md#clear-and-simple-design One guard over the one table, used by `validateDesignReference`, so the accepted list lives in a single constant.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No case folding, aliasing or parameter stripping; a near-miss label is refused rather than normalized.
 * @evidence contracts/common.md#meaningful-documentation States the accepted families, exact case-sensitive comparison, the non-string answer, the type narrowing, and that bytes are judged elsewhere.
 * @evidence contracts/performance.md#efficient-algorithms A linear scan of the constant five-entry table, so the cost is fixed and no index is built.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A pure predicate on one value that coordinates no work across calls.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Scans the module's constant table in place; no copy of the table or the value is made or kept.
 */
export const isAutoMovieDesignReferenceMedia = (
  value: unknown,
): value is AutoMovieDesignReferenceMedia =>
  (AUTO_MOVIE_DESIGN_REFERENCE_MEDIA as readonly unknown[]).includes(value);
