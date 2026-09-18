import { AutoMovieDesignReferenceMedia } from "@automovie/interface";
import { AUTO_MOVIE_DESIGN_REFERENCE_MEDIA } from "./AUTO_MOVIE_DESIGN_REFERENCE_MEDIA";

/**
 * Test whether a value names a registrable design-reference container.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-review `isAutoMovieDesignReferenceMedia` tests whether a value names a registrable design-reference container. This ensures reviewers can trace each adopted design reading back to its source and uncertainty.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-manifest-review `isAutoMovieDesignReferenceMedia` accepts only the declared container families that may enter a reviewed reference manifest.
 */
export const isAutoMovieDesignReferenceMedia = (
  value: unknown,
): value is AutoMovieDesignReferenceMedia =>
  (AUTO_MOVIE_DESIGN_REFERENCE_MEDIA as readonly unknown[]).includes(value);
