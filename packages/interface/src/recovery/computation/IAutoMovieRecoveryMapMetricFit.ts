import type {
  IAutoMovieRecoveryMapMetric,
  IAutoMovieRecoveryMapMetricScales,
} from "../../index";

/** Original-rank-qualified raw arrowhead metric without an LS answer. */
export interface IAutoMovieRecoveryMapMetricFit extends IAutoMovieRecoveryMapMetricScales {
  /** Current raw damped metric with original physical global column scales. */
  metric: IAutoMovieRecoveryMapMetric;

  /** Independently qualified original reduced-camera singular ratio. */
  cameraDesignRatio: number;

  /** Minimum original point-design singular ratio. */
  minimumPointDesignRatio: number;
}
