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
 * @evidence requirements/building-exterior/structure-and-envelope.md#building-structural-support Reports the whole population a support sweep judged beside the floating bodies it found.
 * @evidence specifications/building-envelope/structure-envelope-and-materials.md#building-envelope-structural-support-input-output Separates measured, ground-borne, body-borne, floating, and unresolved outcomes instead of collapsing them into one list.
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
   * measured once in a document is a cost nobody can re-measure.
   */
  compared: number;
  /** Bodies whose underside meets the stated ground plane within tolerance. */
  grounded: number;
  /** Bodies resting on another body's top within tolerance. */
  borne: number;
  /** Every body with clear air under it, in stable record order. */
  floating: IAutoMovieBuiltFloatingBody[];
  /** Bodies whose extent the record does not resolve, so nothing was judged. */
  unresolved: AutoMovieBuiltPlacementBodyLocator[];
}
