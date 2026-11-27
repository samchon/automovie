import type {
  IAutoMovieRecoveryOpenCurveGroup,
  IAutoMovieRecoveryOpenCurvePair,
} from "..";

/** Open-curve incidence between two adjacent published section reports. */
export interface IAutoMovieRecoveryOpenContinuationInterval {
  /** Preceding section ordinal in the saved publication. */
  beforeSection: number;

  /** Following adjacent section ordinal in the saved publication. */
  afterSection: number;

  /** Qualified ordinary open-curve pairs using local curve ordinals. */
  pairs: IAutoMovieRecoveryOpenCurvePair[];

  /** Unsupported or unrepresented curve components. */
  unresolved: IAutoMovieRecoveryOpenCurveGroup[];
}
