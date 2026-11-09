import type { IAutoMovieContourLoft64 } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieRecoveryTensorConstruction } from "../curve/IAutoMovieRecoveryTensorConstruction";
import type { IAutoMovieRecoveryAnalyticReport } from "./IAutoMovieRecoveryAnalyticReport";
import type { IAutoMovieRecoveryTensorReport } from "./IAutoMovieRecoveryTensorReport";

/**
 * Combined source-free contour, tensor and analytic reconstruction output.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields retain the existing producer's quantities, units and independent qualifications.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This shared structural contract names the actual operation result without deriving it from a function signature.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration supplies no inferred observation, geometry or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members document quantity, ownership, optional-state and qualification meaning.
 */
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
