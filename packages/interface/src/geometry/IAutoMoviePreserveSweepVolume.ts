import type { IAutoMovieSweepFrame } from "./IAutoMovieSweepFrame";
import type { IAutoMovieSweepOrientation } from "./IAutoMovieSweepOrientation";
import type { IAutoMovieSweepSurface } from "./IAutoMovieSweepSurface";

/** Rest target and current pose inputs for joint scale compensation. */
export namespace IAutoMoviePreserveSweepVolume {
  /**
   * Rest surface, pose orientation and shared scale buffers for joint-scale
   * volume settlement.
   *
   * A shared joint multiplier is fitted to the original rest volume. Separate
   * girth correction applies after that fit, so the final published scales may
   * produce a different volume.
   */
  export type IProps = {
    /**
     * Compiled authored rest surface in model metres. Section moments and rest
     * frames supply the volume target before girth factors.
     */
    surface: IAutoMovieSweepSurface;

    /**
     * Live section orientation queried for pose frames. Update it before
     * invoking the returned writer.
     */
    orientation: IAutoMovieSweepOrientation;

    /**
     * One boolean per authored station. True selects stations for the common
     * settlement factor.
     */
    joints: readonly boolean[];

    /**
     * Sealed normalized spine coordinates ordered by output scale slot. Keep
     * length and slot identities stable after compiling.
     */
    scaleU: readonly number[];

    /**
     * Borrowed positive dimensionless post-settlement multiplier per scale
     * slot. These factors can adjust the volume after settlement.
     */
    girth: Float64Array;

    /**
     * Caller-owned output array with one dimensionless scale per registered
     * slot. It is updated only after all products pass positive finite
     * admission.
     */
    scales: Float64Array;

    /**
     * Synchronous serializer for the rest frames used to compile the target. It
     * writes metre origin XYZ then three unit XYZ axes at the supplied scalar
     * offset.
     */
    writeFrame: (
      frame: IAutoMovieSweepFrame,
      out: Float64Array,
      at: number,
    ) => void;
  };
}
