/**
 * Every reason family that keeps a reading unsettled.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-review `AUTO_MOVIE_DESIGN_ISSUE_KINDS` fixes every reason family that keeps a reading unsettled. This ensures reviewers can trace each adopted design reading back to its source and uncertainty.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-manifest-review `AUTO_MOVIE_DESIGN_ISSUE_KINDS` bounds the auto movie design issue kinds policy while the engine closes a reviewed reference from source identity through downstream consumers.
 */
export const AUTO_MOVIE_DESIGN_ISSUE_KINDS = [
  "unknown-scale",
  "ambiguous-geometry",
  "occluded",
  "illegible",
  "conflicting-dimension",
  "other",
] as const;
