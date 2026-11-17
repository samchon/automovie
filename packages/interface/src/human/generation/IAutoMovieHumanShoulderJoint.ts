import type { AutoMovieVector3Tuple } from "../../geometry/AutoMovieVector3Tuple";

/**
 * Type contracts exchanged by AutoMovieHumanShoulderJoint; runtime evaluation remains in Human.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Identifies the AutoMovieHumanShoulderJoint exchange boundary; the member contracts document the individual inputs, outputs and their interpretation.
 * @evidence contracts/development/design.md#principled-representation A type-only namespace groups IPlacement. Units, frames and admissibility belong to those member contracts; the namespace creates no value or runtime validation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Interface owns these declarations used by Human's AutoMovieHumanShoulderJoint; Human retains the computation and source preparation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace only qualifies the IPlacement contracts and adds no alternate implementation, optional mode or runtime state.
 */
export namespace IAutoMovieHumanShoulderJoint {
  /** A right-handed canonical-right frame, reflected only after placement.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation A right-handed canonical-right frame, reflected only after placement.
   * @evidence contracts/development/design.md#principled-representation `centre`: Generated joint centre in the caller's sided calibration frame. `axes`: Canonical-right AP, superior and medial axes; not measured AcrCS. `projection`: Acromion-to-GH projection along the straight downward measuring axis.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanShoulderJoint.of.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `centre`, `axes`, `projection`; callers supply the complete record.
   */
  export interface IPlacement {
    /** Generated joint centre in the caller's sided calibration frame. */
    centre: AutoMovieVector3Tuple;
    /** Canonical-right AP, superior and medial axes; not measured AcrCS. */
    axes: [AutoMovieVector3Tuple, AutoMovieVector3Tuple, AutoMovieVector3Tuple];
    /** Acromion-to-GH projection along the straight downward measuring axis. */
    projection: number;
  }
}
