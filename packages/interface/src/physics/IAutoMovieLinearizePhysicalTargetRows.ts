import type { IAutoMoviePoses } from "../geometry/IAutoMoviePoses";

/** Data and callback contracts shared by the LinearizePhysicalTargetRows operations. */
export namespace IAutoMovieLinearizePhysicalTargetRows {
  /** One residual group and its call-local witness model. */
    export interface IRows {
      /** All candidate bones read by this group. External bodies remain actual. */ bones: ReadonlySet<string>;
      /** True only for intrinsic same-body separation, invariant under a common rigid motion. */ rigidInvariant?: boolean;
      /** Exact nonlinear residuals used for acceptance. */ measure: (
        poses: IAutoMoviePoses,
      ) => number[];
      /** Frozen local model at an accepted configuration. */ linearize: (
        poses: IAutoMoviePoses,
      ) => (probe: IAutoMoviePoses) => number[];
    }
}
