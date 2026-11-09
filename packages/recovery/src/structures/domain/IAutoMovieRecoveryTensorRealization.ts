import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieRecoveryTensorConstruction } from "../curve/IAutoMovieRecoveryTensorConstruction";
import type { IAutoMovieRecoveryTensorReport } from "./IAutoMovieRecoveryTensorReport";

/**
 * Generated ordinary tensor families and their saved ownership replacements.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields retain the existing producer's quantities, units and independent qualifications.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This shared structural contract names the actual operation result without deriving it from a function signature.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration supplies no inferred observation, geometry or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members document quantity, ownership, optional-state and qualification meaning.
 */
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
