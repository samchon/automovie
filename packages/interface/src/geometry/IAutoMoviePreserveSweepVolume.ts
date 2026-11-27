import type { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";
import type { IAutoMovieSweepOrientation } from "./IAutoMovieSweepOrientation";
import type { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";

/** Shared pose frames and scale slots for volume compensation at joint stations. */
export namespace IAutoMoviePreserveSweepVolume {
  /**
   * Compile the volume-settled joint-scale update of a sealed sweep rig.
   *
   * Section moments and the authored sweep's rest-volume target are computed
   * once. Each pose updates the shared orientation first, then this writer
   * settles the joint factor and writes every registered scale slot. The
   * network's separate girth multipliers apply after that settlement, matching
   * the rig's existing ordering; the target is the authored sweep's volume
   * before girth correction.
   */
  export type IProps = {
    /**
     * Immutable authored rest sweep in model metres. Compilation integrates its
     * unscaled section moments and scaled rest frames to establish a
     * cubic-metre target before girth correction.
     */
    surface: IAutoMovieSweepSurface;

    /**
     * Shared current-pose section orientation. The caller updates it before
     * each returned writer invocation; its frames supply the posed flux
     * integral. Retained throughout the writer's lifetime.
     */
    orientation: IAutoMovieSweepOrientation;

    /**
     * One flag per authored station: true marks a two-bone joint whose scale
     * receives the common settlement factor. Read during compilation; the
     * owning sweep rig calls this helper only when some joint is present.
     */
    joints: readonly boolean[];

    /**
     * Sealed normalized-u scale registrations in slot order, retained and read
     * on every pose. Length and slot identities must remain unchanged after
     * compilation.
     */
    scaleU: readonly number[];

    /**
     * Live positive dimensionless radial factors, one per scaleU slot, borrowed
     * from the owning rig. Applied after volume settlement, so girth correction
     * can change the final volume.
     */
    girth: Float64Array;

    /**
     * Shared writable dimensionless scale output, one per scaleU slot. A pose
     * stages and checks every positive finite product before publishing with
     * set; failures leave this buffer unchanged.
     */
    scales: Float64Array;

    /**
     * Synchronous serializer used only during compilation: write twelve scalars
     * at scalar offset at, ordered origin XYZ then x, y and normal axes.
     * Origins use model metres, axes are dimensionless; the destination is
     * borrowed for the call and errors propagate.
     */
    writeFrame: (
      frame: IAutoMovieSweepFrame,
      out: Float64Array,
      at: number,
    ) => void;
  };
}
