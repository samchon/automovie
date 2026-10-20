import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieRecoveryTensorConstruction } from "../curve/IAutoMovieRecoveryTensorConstruction";
import type { IAutoMovieRecoveryTensorReport } from "./IAutoMovieRecoveryTensorReport";

/**
 * Generated ordinary tensor families and their saved ownership replacements.
 *
 * @evidence contracts/common.md#principled-implementation Named fields retain the existing producer's quantities, units and independent qualifications.
 * @evidence contracts/common.md#clear-and-simple-design This shared structural contract names the actual operation result without deriving it from a function signature.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This declaration supplies no inferred observation, geometry or fallback.
 * @evidence contracts/common.md#meaningful-documentation Members document quantity, ownership, optional-state and qualification meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms An erased interface performs no arithmetic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This type owns no runtime cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The caller owns returned records and arrays; the type acquires no resources.
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
