import type { AutoMovieVector3Tuple, IAutoMoviePlaneFrame } from "../index";

/**
 * Builds an orthonormal cutting frame whose v follows the projected reference and u cross v = n.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Builds an orthonormal cutting frame whose v follows the projected reference and u cross v = n.
 * @evidence contracts/development/design.md#principled-representation Builds an orthonormal cutting frame whose v follows the projected reference and u cross v = n.
 * @evidence contracts/development/design.md#minimal-and-owned-surface bindRecoveryOrderedFits, extractRecoveryMeshSections, planeFrame share IAutoMoviePlaneFrameConstruction's canonical records; the referenced quantities retain one declaration owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
 */

export namespace IAutoMoviePlaneFrameConstruction {
  /**
   * Builds an orthonormal cutting frame whose v follows the projected reference and u cross v = n.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Builds an orthonormal cutting frame whose v follows the projected reference and u cross v = n.
   * @evidence contracts/development/design.md#principled-representation Builds an orthonormal cutting frame whose v follows the projected reference and u cross v = n.
   * @evidence contracts/development/design.md#minimal-and-owned-surface bindRecoveryOrderedFits, extractRecoveryMeshSections, planeFrame share IAutoMoviePlaneFrameConstruction's canonical records; the referenced quantities retain one declaration owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The declared observation and coefficient identities remain separate from source coverage and numerical qualification.
   */

  export type Operation = (
    origin: AutoMovieVector3Tuple,
    normal: AutoMovieVector3Tuple,
    reference: AutoMovieVector3Tuple,
  ) => IAutoMoviePlaneFrame;
}
