import { IAutoMovieDrawingGap } from "./IAutoMovieDrawingGap";
import { IAutoMovieQuantityFinding } from "./IAutoMovieQuantityFinding";

/**
 * The current seven measured quantity subjects and their declared gaps.
 *
 * Quantities are recomputed from authored footprints, volumes, voids, routes and counts on each call; edits outside those measurements need not change a quantity. measureAutoMovieQuantities throws for an invalid environment or a contributor bound that is not a positive safe integer.
 *
 * Known omitted measurements are stated as gaps. Material take-off and pattern cut waste need separate records this measurement is not handed; an unmeasurable cell or void-less opening is omitted from its numeric tally and counted in a gap. A zero total alone therefore does not prove the corresponding physical quantity is absent.
 *
 * @evidence contracts/common.md#principled-implementation The producer sums footprint areas net of holes, shell/cell formulas, arc-corrected void areas and route lengths, plus element/opening/model-reference counts. Overlapping support patches and cells are added rather than unioned; fixed subject coverage does not establish complete authored geometry. Canonical JSON hashing identifies produced metadata without a source/execution-authenticity guarantee.
 * @evidence contracts/common.md#clear-and-simple-design The report holds one finding per subject plus the gap list and identity fields; units, bounds and approximations stay on the findings that own them, and gaps reuse the drawing's gap record so one reader handles all three derivations.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every subject is present, including zero totals when no owner contributes; known unavailable inputs and unsupported work use named gaps. The fixed gap list is not an exhaustive discovery of every quantity, modelling defect or numerical failure, and canonical encoding can refuse non-finite computed output.
 * @evidence contracts/common.md#meaningful-documentation States where quantities come from, the refusals, and why unmeasurable quantities are gaps; members give the fixed subject order and completeness, the gap order, and the digest's coverage.
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
