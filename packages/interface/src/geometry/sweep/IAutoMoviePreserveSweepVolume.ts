import type { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";
import type { IAutoMovieSweepOrientation } from "./IAutoMovieSweepOrientation";
import type { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";

/**
 * Shared pose frames and scale slots for volume compensation at joint stations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Metre rest geometry defines a cubic-metre target; normalized-u registrations address dimensionless scale and girth buffers. Girth multiplies after settlement and may change final volume; fixed slot identities and buffer capacity remain caller premises.
 * @evidence contracts/development/design.md#principled-representation Metre rest geometry defines a cubic-metre target; normalized-u registrations address dimensionless scale and girth buffers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface preserveAutoMovieSweepVolume compiles a writer used after orientation updates by the owning sweep rig.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Girth multiplies after settlement and may change final volume; fixed slot identities and buffer capacity remain caller premises.
 */
export namespace IAutoMoviePreserveSweepVolume {
  /**
   * Compile the volume-settled joint-scale update of a sealed sweep rig.
   *
   * Section moments and the authored sweep's rest-volume target are computed once. Each pose updates the shared orientation first, then this writer settles the joint factor and writes every registered scale slot. The network's separate girth multipliers apply after that settlement, matching the rig's existing ordering; the target is the authored sweep's volume before girth correction.
   *
   * @evidence contracts/development/design.md#principled-representation Rest moments and metre frames define a cubic-metre volume target; station flags and dimensionless scale/girth slots define the compensation. The writer checks final positive finite scale products.
   * @evidence contracts/development/design.md#minimal-and-owned-surface rigAutoMovieSweep supplies its sealed scale registration and live orientation; the volume closure owns only its integration and settlement work buffers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The target precedes girth correction, so the contract does not promise final volume preservation after a separate girth constraint changes scale.
   * @evidence contracts/development/common.md#meaningful-documentation Specifies buffer ownership, slot stability, frame layout, callback use and staged scale publication on success.
   */
  export type IProps = {
    /** Immutable authored rest sweep in model metres. Compilation integrates its unscaled section moments and scaled rest frames to establish a cubic-metre target before girth correction. */
    surface: IAutoMovieSweepSurface;

    /** Shared current-pose section orientation. The caller updates it before each returned writer invocation; its frames supply the posed flux integral. Retained throughout the writer's lifetime. */
    orientation: IAutoMovieSweepOrientation;

    /** One flag per authored station: true marks a two-bone joint whose scale receives the common settlement factor. Read during compilation; the owning sweep rig calls this helper only when some joint is present. */
    joints: readonly boolean[];

    /** Sealed normalized-u scale registrations in slot order, retained and read on every pose. Length and slot identities must remain unchanged after compilation. */
    scaleU: readonly number[];

    /** Live positive dimensionless radial factors, one per scaleU slot, borrowed from the owning rig. Applied after volume settlement, so girth correction can change the final volume. */
    girth: Float64Array;

    /** Shared writable dimensionless scale output, one per scaleU slot. A pose stages and checks every positive finite product before publishing with set; failures leave this buffer unchanged. */
    scales: Float64Array;

    /**
     * Synchronous serializer used only during compilation: write twelve scalars at scalar offset at, ordered origin XYZ then x, y and normal axes. Origins use model metres, axes are dimensionless; the destination is borrowed for the call and errors propagate.
     *
     * @evidence contracts/development/common.md#meaningful-documentation States twelve-scalar layout and offset, metre origins, dimensionless axes, synchronous borrowed output and propagated errors.
     */
    writeFrame: (
      frame: IAutoMovieSweepFrame,
      out: Float64Array,
      at: number,
    ) => void;
  };
}
