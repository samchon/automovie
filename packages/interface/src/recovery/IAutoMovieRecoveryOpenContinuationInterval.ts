import type {
  IAutoMovieRecoveryOpenCurveGroup,
  IAutoMovieRecoveryOpenCurvePair,
} from "..";

/**
 * Saved open-arc transport and unresolved incidence for one adjacent station
 * pair.
 */
export interface IAutoMovieRecoveryOpenContinuationInterval {
  /** Index of the earlier saved section and aligned report. */
  beforeSection: number;

  /** Index of the later saved section and aligned report. */
  afterSection: number;

  /** Ordinary one-to-one saved open-arc endpoints with admitted direction. */
  pairs: IAutoMovieRecoveryOpenCurvePair[];

  /** Retained unsupported arc incidences and their diagnoses. */
  unresolved: IAutoMovieRecoveryOpenCurveGroup[];
}
