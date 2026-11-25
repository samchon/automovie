import type { IAutoMovieDrawingGap } from "./IAutoMovieDrawingGap";
import type { IAutoMovieQuantityFinding } from "./IAutoMovieQuantityFinding";

/**
 * The current seven measured quantity subjects and their declared gaps.
 *
 * Quantities are recomputed from authored footprints, volumes, voids, routes
 * and counts on each call; edits outside those measurements need not change a
 * quantity. measureAutoMovieQuantities throws for an invalid environment or a
 * contributor bound that is not a positive safe integer.
 *
 * Known omitted measurements are stated as gaps. Material take-off and pattern
 * cut waste need separate records this measurement is not handed; an
 * unmeasurable cell or void-less opening is omitted from its numeric tally and
 * counted in a gap. A zero total alone therefore does not prove the
 * corresponding physical quantity is absent.
 */
export interface IAutoMovieQuantityReport {
  /** Report format. */
  version: 1;

  /** Versioned quantity protocol. */
  protocol: "automovie.quantity.v1";

  /** Built environment this report was derived from. */
  environment: string;

  /**
   * Exactly one finding per {@link AutoMovieQuantitySubject}, in the fixed
   * subject order, so a quantity the design has none of is a zero total rather
   * than a missing finding.
   */
  findings: IAutoMovieQuantityFinding[];

  /** Quantities this report could not measure, sorted by gap subject. */
  gaps: IAutoMovieDrawingGap[];

  /** SHA-256 digest over the canonical JSON of every other field. */
  digest: string;
}
