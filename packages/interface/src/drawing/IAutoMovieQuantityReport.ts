import { IAutoMovieDrawingGap } from "./IAutoMovieDrawingGap";
import { IAutoMovieQuantityFinding } from "./IAutoMovieQuantityFinding";

/**
 * Every quantity the design can currently answer for, and every one it cannot.
 *
 * Quantities are arithmetic over the authored design, not a bill somebody typed: an area is the area of an authored footprint and a length is the length of an authored route, so a change to the design is a change to the quantity. `measureAutoMovieQuantities` validates the design first and throws for an invalid one or a contributor bound that is not a positive safe integer.
 *
 * What the design cannot answer is stated as a gap rather than omitted or defaulted to zero. Material take-off and pattern cut waste need material assemblies and surface patterns, which are separate records the measurement is not handed, so a report never reads as a building that needs no material.
 *
 * @evidence contracts/common.md#principled-implementation `measureAutoMovieQuantities` sums support-surface footprint areas net of holes, shell volumes and convex cell volumes, closed-form opening areas and route polyline lengths, counts elements, openings and model occurrences, finishes each subject in `AUTOMOVIE_QUANTITY_SUBJECTS` order, and digests the record with SHA-256 over `canonicalizeAutoMovieJson`.
 * @evidence contracts/common.md#clear-and-simple-design The report holds one finding per subject plus the gap list and identity fields; units, bounds and approximations stay on the findings that own them, and gaps reuse the drawing's gap record so one reader handles all three derivations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every subject is always present, so an absent quantity is a stated zero, and every quantity outside the measurement's reach, such as `material-quantity` and `pattern-cut-waste`, is a declared gap rather than an estimate.
 * @evidence contracts/common.md#meaningful-documentation States where quantities come from, the refusals, and why unmeasurable quantities are gaps; members give the fixed subject order and completeness, the gap order, and the digest's coverage.
 * @author Samchon
 */
export interface IAutoMovieQuantityReport {
  /** Report format. */
  version: 1;

  /** Versioned quantity protocol. */
  protocol: "automovie.quantity.v1";

  /** Built environment this report was derived from. */
  environment: string;

  /**
   * Exactly one finding per {@link AutoMovieQuantitySubject}, in the fixed subject order, so a quantity the design has none of is a zero total rather than a missing finding.
   */
  findings: IAutoMovieQuantityFinding[];

  /** Quantities this report could not measure, sorted by gap subject. */
  gaps: IAutoMovieDrawingGap[];

  /** SHA-256 digest over the canonical JSON of every other field. */
  digest: string;
}
