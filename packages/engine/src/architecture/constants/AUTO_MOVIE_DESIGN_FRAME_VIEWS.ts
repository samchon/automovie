/**
 * Every drawing family a source frame may declare.
 *
 * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-review `AUTO_MOVIE_DESIGN_FRAME_VIEWS` fixes every drawing family a source frame may declare. This ensures reviewers can trace each adopted design reading back to its source and uncertainty.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-manifest-review `AUTO_MOVIE_DESIGN_FRAME_VIEWS` bounds the auto movie design frame views policy while the engine closes a reviewed reference from source identity through downstream consumers.
 */
export const AUTO_MOVIE_DESIGN_FRAME_VIEWS = [
  "plan",
  "section",
  "elevation",
  "detail",
  "perspective",
] as const;
