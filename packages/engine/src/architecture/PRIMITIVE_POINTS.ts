/**
 * Every raw mark family an observation may record, and the point count each one
 * carries. This table is the only list of the families: a second exported array
 * would be a copy that drifts the first time a family is added.
  * @evidence requirements/production-design/references-and-provenance.md#production-design-reference-review `AUTO_MOVIE_DESIGN_REFERENCE_MEDIA` fixes every container family a design reference may declare. This ensures reviewers can trace each adopted design reading back to its source and uncertainty.
 * @evidence specifications/narrative-and-intent/fidelity-references-and-provenance.md#narrative-intent-reference-manifest-review `AUTO_MOVIE_DESIGN_REFERENCE_MEDIA` bounds the auto movie design reference media policy while the engine closes a reviewed reference from source identity through downstream consumers.
 * @author Samchon
 */
export const PRIMITIVE_POINTS: Record<string, { min: number; max: number }> = {
  line: { min: 2, max: 2 },
  arc: { min: 3, max: 3 },
  polyline: { min: 2, max: Infinity },
  region: { min: 3, max: Infinity },
  text: { min: 1, max: 1 },
  "level-marker": { min: 1, max: 1 },
};
