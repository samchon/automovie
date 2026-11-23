import type {
  IAutoMovieContourLoft64,
  IAutoMovieModel,
  IAutoMovieRecoveryAnalyticReport,
  IAutoMovieRecoveryTensorConstruction,
  IAutoMovieRecoveryTensorReport,
} from "../../index";

/** Combined source-free contour, tensor and analytic reconstruction output. */

export interface IAutoMovieRecoveryReconstruction {
  /** Generated model containing each retained operator's parts. */
  model: IAutoMovieModel;

  /** Actual generated construction in model metres; tensor phases are optional. */
  construction: IAutoMovieRecoveryTensorConstruction[];

  /** Combined saved observation and engine diagnostics. */
  diagnostics: string[];

  /** Actual undelegated contour incidence that remains unresolved. */
  unresolved: IAutoMovieContourLoft64.IResult["unresolved"];

  /** Numerical and topology observations on generated contour strips. */
  stripObservations: NonNullable<
    IAutoMovieContourLoft64.IResult["stripObservations"]
  >;

  /** Retained contour triangles and generating interval/group addresses. */
  primitiveRanges: NonNullable<
    IAutoMovieContourLoft64.IResult["primitiveRanges"]
  >;

  /** Observed interactions among retained contour strips. */
  interactionObservations: NonNullable<
    IAutoMovieContourLoft64.IResult["interactionObservations"]
  >;

  /** Actual tensor-family ownership and numerical results. */
  tensorReports: IAutoMovieRecoveryTensorReport[];

  /** Actual analytic ownership, observation and numerical results. */
  analyticReports: IAutoMovieRecoveryAnalyticReport[];
}
