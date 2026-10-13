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
