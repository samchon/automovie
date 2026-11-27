import type {
  IAutoMovieModel,
  IAutoMovieRecoveryTensorConstruction,
  IAutoMovieRecoveryTensorReport,
} from "..";

/** Generated ordinary tensor families and their saved ownership replacements. */

export interface IAutoMovieRecoveryTensorRealization {
  /** Generated model parts owning retained mesh arrays. */
  parts: IAutoMovieModel["parts"];

  /** Actual retained control-net lines in model metres. */
  construction: IAutoMovieRecoveryTensorConstruction[];

  /** Closed interval:group keys mapped to their generating family identity. */
  replacements: Map<string, string>;

  /** Same-order actual family completion and numerical reports. */
  reports: IAutoMovieRecoveryTensorReport[];
}
