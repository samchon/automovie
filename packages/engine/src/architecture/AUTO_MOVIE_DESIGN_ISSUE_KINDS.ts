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

/**
 * Every raw mark family an observation may record, and the point count each one
 * carries. This table is the only list of the families: a second exported array
 * would be a copy that drifts the first time a family is added.
 */
const PRIMITIVE_POINTS: Record<string, { min: number; max: number }> = {
  line: { min: 2, max: 2 },
  arc: { min: 3, max: 3 },
  polyline: { min: 2, max: Infinity },
  region: { min: 3, max: Infinity },
  text: { min: 1, max: 1 },
  "level-marker": { min: 1, max: 1 },
};

/** Primitive families that carry promotable metric geometry. */
const GEOMETRIC_PRIMITIVES = new Set(["line", "polyline", "region"]);

/** A plain SHA-256 content digest as this project writes it. */
const DIGEST_PATTERN = /^sha256:[0-9a-f]{64}$/;

/** Direction vectors shorter than this are treated as having no direction. */
const AXIS_EPSILON = 1e-12;
