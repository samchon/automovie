/**
 * Every container family a design reference may declare.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-review `AUTO_MOVIE_DESIGN_REFERENCE_MEDIA` fixes every container family a design reference may declare. This ensures reviewers can trace each adopted design reading back to its source and uncertainty.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-manifest-review `AUTO_MOVIE_DESIGN_REFERENCE_MEDIA` bounds the auto movie design reference media policy while the engine closes a reviewed reference from source identity through downstream consumers.
 */
export const AUTO_MOVIE_DESIGN_REFERENCE_MEDIA = [
  "image/png",
  "image/jpeg",
  "image/svg+xml",
  "application/pdf",
  "image/vnd.dxf",
] as const;
