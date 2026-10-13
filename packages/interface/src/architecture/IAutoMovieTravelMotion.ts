import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The single degree of freedom one moving member travels on.
 *
 * Door leaves and lift cars share this record because their arithmetic is the
 * same: the value a named operating state gives is a displacement from the
 * element's own rest pose, and the engine composes it after that pose so it
 * rides down the element hierarchy. Rest is the value `0`, so every range
 * contains it.
 *
 * @evidence contracts/common.md#principled-implementation Models one joint as a closed union on `kind`: a revolute value is an angle about the normalized axis through the pivot, applied as a right-handed quaternion turn plus the translation that keeps the pivot fixed, and a prismatic value is a translation along the normalized axis; `validateBuiltEnvironment` requires a finite axis longer than its epsilon, a finite pivot, `min <= 0 <= max` with `min < max`, and at most one full turn of revolute travel.
 * @evidence contracts/common.md#clear-and-simple-design Panels and carriages both reference this one record, and each variant carries only the fields its joint needs, so a slide has no pivot and neither variant repeats the per-state values that `IAutoMovieCarriageValue` and the opening states own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No joint is special-cased by element kind; the axis length is ignored by normalization rather than reinterpreted as a gain, and a degenerate axis or empty range is refused by the validator instead of being clamped.
 * @evidence contracts/common.md#meaningful-documentation States that values are displacements from the rest pose at `0`, the local frame of axis and pivot, radians for revolute and metres for prismatic travel, the sign bounds on `min` and `max`, and the full-turn limit.
 * @author Samchon
 */
export type IAutoMovieTravelMotion =
  | IAutoMovieTravelMotion.IRevolute
  | IAutoMovieTravelMotion.IPrismatic;
export namespace IAutoMovieTravelMotion {
  /**
   * A hinge: the member turns about an axis through a pivot.
   *
   * A positive value turns counter-clockwise when viewed from the tip of the
   * axis looking back at the pivot, the right-hand rule.
   *
   * @evidence contracts/common.md#principled-implementation A value becomes the unit quaternion of that angle about the normalized axis, composed with the translation `pivot - rotate(pivot)` so the pivot stays fixed; the premise is a non-degenerate axis, which the validator enforces before any displacement is built.
   * @evidence contracts/common.md#clear-and-simple-design Axis, pivot and the two range ends are the whole hinge; the angle for each named state lives on the state, so the joint stores only what every state shares.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The full-turn limit carries a `1e-6` radian slack that validation shares with the swept-envelope solver, whose critical-angle walk that cap bounds, so the two cannot disagree; no hinge orientation or member kind gets a different rule.
   * @evidence contracts/common.md#meaningful-documentation States the rotation sense, the local frame of axis and pivot, radian units, that `min` is at most rest and `max` at least rest, and that the range spans at most one turn.
   * @author Samchon
   */
  export interface IRevolute {
    /** Selects the hinge joint. */
    kind: "revolute";

    /**
     * Finite non-zero turn axis in the moving element's own local frame; only
     * its direction matters, because the engine normalizes it.
     */
    axis: IAutoMovieVector3;

    /** Finite point on that axis, in the same local frame, that stays fixed. */
    pivot: IAutoMovieVector3;

    /** Lowest travel in radians; finite and at most `0`, the rest value. */
    min: number;

    /**
     * Highest travel in radians; finite, at least `0`, strictly greater than
     * `min`, and at most one full turn (`2 * Math.PI`) above `min`.
     */
    max: number;
  }

  /**
   * A slide: the member travels along an axis without turning.
   *
   * @evidence contracts/common.md#principled-implementation A value becomes a pure translation of that many metres along the normalized axis, with identity rotation and unit scale, so the member's orientation is unchanged at every state.
   * @evidence contracts/common.md#clear-and-simple-design Axis and the two range ends are the whole slide; it has no pivot because a translation has no fixed point to name.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The slide has no turn limit and no special case for vertical travel, so a lift car and a sliding door take the same rule.
   * @evidence contracts/common.md#meaningful-documentation States the local frame of the axis, that only its direction matters, metre units along the unit axis, and the sign bounds on `min` and `max`.
   * @author Samchon
   */
  export interface IPrismatic {
    /** Selects the slide joint. */
    kind: "prismatic";

    /**
     * Finite non-zero travel axis in the moving element's own local frame; only
     * its direction matters, because the engine normalizes it.
     */
    axis: IAutoMovieVector3;

    /** Lowest travel in metres along the unit axis; finite and at most `0`. */
    min: number;

    /**
     * Highest travel in metres along the unit axis; finite, at least `0`, and
     * strictly greater than `min`.
     */
    max: number;
  }
}
