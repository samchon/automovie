import type { IAutoMovieLoftSectionFrame } from "./IAutoMovieLoftSectionFrame";
import type { IAutoMovieViewAxis } from "./IAutoMovieViewAxis";
import type { IAutoMovieViewAxisJet } from "./IAutoMovieViewAxisJet";

/**
 * Data and callback contracts shared by the LoftFrameSource operations.
 *
 * @evidence contracts/development/design.md#principled-representation ISource pairs an immutable axis at a physical-mm station with independent frame and optional station-jet snapshots.
 * @evidence contracts/development/design.md#minimal-and-owned-surface LoftFrameSource owns matching and preservation of the source binding used by loft layers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A null jet preserves a finite frame without claiming regular station derivatives; changed snapshots must be re-expressed by their producer.
 * @evidence contracts/development/common.md#meaningful-documentation Explains source lifetime, snapshot independence and null-jet meaning.
 */
export namespace IAutoMovieLoftFrameSource {
  /**
   * An actual source and independent numeric snapshot of its published layer jet.
   *
   * @evidence contracts/development/design.md#principled-representation The callable source determines intermediate frames; station/value/derivatives verify that a copied layer still represents that source datum.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Axis identity and one station jet make geometry ownership visible in the layer record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A stripped or mutated source is invalid, not an instruction to respline; source absence alone selects ordinary layer interpolation.
   * @evidence contracts/development/common.md#meaningful-documentation Same numeric layer copies preserve meaning while sharing the actual immutable axis; JSON cannot serialize that callable and must reconstruct it from the authored tree.
   */
  export interface ISource {
    /** Immutable actual source; its analytic jet callback must remain callable. */
    axis: IAutoMovieViewAxis.IAxis;

    /** Source station of this layer, mm. */
    station: number;

    /** Independently copied finite source value, including at a singular station. */
    frame: IAutoMovieLoftSectionFrame;

    /** Independently copied station jet; null preserves a finite value whose station derivatives are singular or nonfinite. */
    jet: IAutoMovieViewAxisJet.IJet | null;
  }
}
