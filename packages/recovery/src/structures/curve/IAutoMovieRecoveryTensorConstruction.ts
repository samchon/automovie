import type { IAutoMovieRecoveryConstructionLine } from "./IAutoMovieRecoveryConstructionLine";

/**
 * Tensor control-net construction generated from the retained recipe.
 *
 * @evidence contracts/development/design.md#principled-representation Named fields retain the existing producer's quantities, units and independent qualifications.
 * @evidence contracts/development/design.md#minimal-and-owned-surface This shared structural contract names the actual operation result without deriving it from a function signature.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts This declaration supplies no inferred observation, geometry or fallback.
 * @evidence contracts/development/common.md#meaningful-documentation Members document quantity, ownership, optional-state and qualification meaning.
 */
export interface IAutoMovieRecoveryTensorConstruction extends IAutoMovieRecoveryConstructionLine {
  /** Optional normalized generating phases aligned with construction points. */
  phases?: number[];
}
