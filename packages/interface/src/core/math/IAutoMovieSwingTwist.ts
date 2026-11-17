import type { IAutoMovieQuaternion } from "../../geometry/IAutoMovieQuaternion";

/**
 * Quaternion factors used by distal-twist distribution and hinged-chain orientation error.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Quaternion factors used by distal-twist distribution and hinged-chain orientation error. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation The result uses two dimensionless quaternions in the input rotation frame with swing-times-twist order.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Joint twist and hinged-chain error consumers share the engine's decomposition output.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Near-degenerate projection uses an explicit convention rather than claiming unique twist recovery.
 */
export namespace IAutoMovieSwingTwist {
  /**
   * Fresh mutable factors with input rotation = swing * twist under the unit-rotation and usable-axis premises. The twist axis is expressed in the same frame as the input and normalized internally; inputs are not changed. No finite/unit input gate runs here.
   *
   * Projection length hypot(dot(rotation.xyz, normalizedAxis), rotation.w) below 1e-12 chooses identity twist and copies the whole input into swing. This is a numerical near-degeneracy convention, not only an exact half-turn test.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Gives factor order, shared frame, ownership, caller premises and the actual threshold convention.
   * @evidence contracts/development/design.md#principled-representation Two dimensionless canonical quaternions separate axial twist from residual swing; valid unit input and axis geometry are caller responsibilities.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The engine swingTwist producer shares these factors between joint twist distribution and hinged-chain effector-error consumers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Degenerate projection has an explicit identity-twist convention; the result carries no validation status or physiological joint limit claim.
   */
  export type IResult = {
    /** Residual orientation after removing twist on the right; near degeneracy copies the input rotation. */
    swing: IAutoMovieQuaternion;

    /** Rotation about the supplied axis; identity when projected quaternion length is below 1e-12. */
    twist: IAutoMovieQuaternion;
  };
}
