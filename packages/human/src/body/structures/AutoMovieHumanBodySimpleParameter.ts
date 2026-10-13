/**
 * A simple body parameter, or one the expansion derives from them, as the
 * abscissa of a term curve in the simple-tier table.
 *
 * @evidence contracts/common.md#principled-implementation A closed union identifies directly authored and derived coordinates read by simple-shape term curves.
 * @evidence contracts/common.md#clear-and-simple-design The parameter vocabulary is shared by curve schemas and the common parameter evaluator.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Derived muscle and fat coordinates remain model outputs rather than newly measured physiological traits.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes term abscissae and derived model-coordinate meanings.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The term parameter vocabulary is a type declaration without executable processing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The term parameter vocabulary coordinates no cross-call computation or caching.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The term parameter vocabulary type itself acquires no retained runtime resources.
 *
 * @author Samchon
 */
export type AutoMovieHumanBodySimpleParameter =
  | "sex"
  | "ageYears"
  | "bodyMassIndex"
  | "muscle"
  /** The legacy muscle coordinate times the authored age/sex maturity ramp; not an individual physiological capacity. */
  | "developedMuscle"
  /** The definition gates' estimated excess fat after essential-fat and developed-muscle adjustments, held above their model minimum. */
  | "excessFatPercent";
