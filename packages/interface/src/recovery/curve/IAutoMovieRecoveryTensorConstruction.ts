import type { IAutoMovieConstructionPolyline } from "../../render/IAutoMovieConstructionPolyline";

/**
 * Tensor control-net construction generated from the retained recipe.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Optional normalized generating phases aligned with construction points.
 * @evidence contracts/development/design.md#principled-representation Optional normalized generating phases aligned with construction points.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieRecoveryReconstruction, IAutoMovieRecoveryTensorRealization share IAutoMovieRecoveryTensorConstruction's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export interface IAutoMovieRecoveryTensorConstruction
  extends IAutoMovieConstructionPolyline.IMutable {
  /** Optional normalized generating phases aligned with construction points. */
  phases?: number[];
}
