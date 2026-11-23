import type { IAutoMoviePoses } from "../geometry/IAutoMoviePoses";

/** One residual group and its call-local witness model. */
export namespace IAutoMovieLinearizePhysicalTargetRows {
  /** One residual group and its call-local witness model. */
  export interface IRows {
    /** All candidate bones read by this group. External bodies remain actual. */ bones: ReadonlySet<string>;
    /**
     * True only for intrinsic same-body separation, invariant under a common
     * rigid motion.
     */ rigidInvariant?: boolean;
    /**
     * Exact nonlinear residuals used for acceptance.
     *
     * Synchronous metre residuals in stable row order for borrowed world poses.
     * Keep dimensions invariant and do not mutate poses; exceptions abort
     * fitting. The row retains its fit inputs only for its owning fit's
     * lifetime.
     */ measure: (poses: IAutoMoviePoses) => number[];
    /**
     * Frozen local model at an accepted configuration.
     *
     * Build a synchronous probe model at one accepted world pose, freezing its
     * local witnesses. Its metre residual dimension/order must match measure;
     * trial poses are borrowed and must stay unchanged. The owning fit releases
     * this closure after use.
     */ linearize: (
      poses: IAutoMoviePoses,
    ) => (probe: IAutoMoviePoses) => number[];
  }
}
