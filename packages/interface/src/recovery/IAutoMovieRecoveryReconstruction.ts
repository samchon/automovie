import type {
  IAutoMovieContourLoft64,
  IAutoMovieModel,
  IAutoMovieRecoveryAnalyticReport,
  IAutoMovieRecoveryTensorConstruction,
  IAutoMovieRecoveryTensorReport,
} from "..";

/**
 * Source-independent generated model, construction and reports from saved
 * contour, tensor and analytic coefficients.
 */

export interface IAutoMovieRecoveryReconstruction {
  /**
   * Generated model with parts retained by the contour, tensor and analytic
   * owners.
   */
  model: IAutoMovieModel;

  /** Actual generated construction coordinates in model metres. */
  construction: IAutoMovieRecoveryTensorConstruction[];

  /** Ordered saved-observation and generation diagnostics. */
  diagnostics: string[];

  /** Contour incidences that remain unresolved after selecting delegated owners. */
  unresolved: IAutoMovieContourLoft64.IResult["unresolved"];

  /** Numerical and topology diagnostics for the realized contour strips. */
  stripObservations: NonNullable<
    IAutoMovieContourLoft64.IResult["stripObservations"]
  >;

  /**
   * Retained generated contour primitive ranges associated with their source
   * interval and group.
   */
  primitiveRanges: NonNullable<
    IAutoMovieContourLoft64.IResult["primitiveRanges"]
  >;

  /** Observed interactions between realized contour strips. */
  interactionObservations: NonNullable<
    IAutoMovieContourLoft64.IResult["interactionObservations"]
  >;

  /** Per-family tensor fit, ownership and realization reports. */
  tensorReports: IAutoMovieRecoveryTensorReport[];

  /** Per-domain analytic ownership, qualification and numerical reports. */
  analyticReports: IAutoMovieRecoveryAnalyticReport[];
}
