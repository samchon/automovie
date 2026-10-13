import { AutoMovieBuiltPlacementBodyLocator } from "./AutoMovieBuiltPlacementBodyLocator";
import { IAutoMovieBuiltFloatingBody } from "./IAutoMovieBuiltFloatingBody";

/**
 * What one whole-building support sweep measured, not only what it found.
 *
 * The census is part of the answer. An empty finding list from a sweep that
 * resolved nothing reads exactly like a clean building, which is the failure a
 * measurement script in this repository has already shipped once, so the counts
 * travel beside the findings and a caller compares them.
 *
 * Every measured body lands in exactly one of {@link grounded}, {@link borne}
 * and {@link floating}, judged by the underside of its world box. The ground
 * height is the sweep's own `groundY` argument, `0` by default, not anything
 * read from the environment context.
 *
 * @evidence contracts/common.md#principled-implementation Each resolved body is classified by its world-box underside: grounded against `groundY`, else borne by the nearest overlapping drawn part found through a top-height-descending list and a binary search, else floating.
 * @evidence contracts/common.md#clear-and-simple-design Grounded and borne bodies are counted while only floating ones are listed, which keeps the report proportional to its findings, and measured and unresolved state the census beside them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A body whose underside is below the ground height counts as grounded rather than sunk, and body resolution re-stages the whole element hierarchy per element, a quadratic cost that `compared` leaves out.
 * @evidence contracts/common.md#meaningful-documentation States the meaning of every count, the ground height source and default, the record order of floating bodies, and what the cost count omits.
 * @author Samchon
 */
export interface IAutoMovieBuiltSupportSweepReport {
  /** Bodies whose extent resolved and were therefore judged. */
  measured: number;

  /**
   * Candidate inspections performed after pruning, the sweep's own cost.
   *
   * It belongs in the answer for the same reason the overlap sweep's does: a
   * caller deciding whether to run this every round needs the number, and a cost
   * measured once in a document is a cost nobody can re-measure. It counts part
   * inspections only, not the resolution of each body.
   */
  compared: number;

  /**
   * Bodies whose underside is at or below the ground height plus the
   * tolerance, including bodies sunk below it.
   */
  grounded: number;

  /** Bodies resting on another body's top within tolerance. */
  borne: number;

  /**
   * Every body with clear air under it, in stable record order: elements
   * first, then populations.
   */
  floating: IAutoMovieBuiltFloatingBody[];

  /** Bodies whose extent the record does not resolve, so nothing was judged. */
  unresolved: AutoMovieBuiltPlacementBodyLocator[];
}
