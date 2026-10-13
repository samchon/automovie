import { IAutoMovieVector3 } from "../geometry/IAutoMovieVector3";

/**
 * The single degree of freedom one moving member travels on.
 *
 * A door leaf and a lift car are the same arithmetic under different names, so
 * they share one record rather than each growing a private one: the value a
 * named state gives is a displacement from the element's own rest pose, and the
 * engine composes it after that pose so it rides down the hierarchy.
 *
 * @evidence contracts/common.md#principled-implementation A discriminated union on `kind` encodes the two lower-pair joints; the engine's `travelDelta` turns a revolute value into a half-angle quaternion about the normalized `axis` re-centred on `pivot`, and a prismatic value into a translation along the normalized `axis`, multiplied after the element's rest matrix.
 * @evidence contracts/common.md#clear-and-simple-design Opening panels (`IAutoMovieMovablePanel`) and lift carriages (`IAutoMovieConnectorCarriage`) share this one record, but the engine decodes it through nine identical private `travelDelta` copies under `packages/engine/src/architecture`, so the composition rule has no single owner.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No member kind is special-cased; the constants are the rest value `0` every range must straddle and validation's `FULL_TURN_EPSILON` of 1e-6 rad on a revolute span, shared on purpose with the swept-envelope solver whose critical-angle walk it bounds.
 * @evidence contracts/common.md#meaningful-documentation States that a state value is a displacement from the element's own rest pose and that the engine composes it after that pose so children follow; units, frames and bounds are documented on each member interface.
 * @author Samchon
 */
export type IAutoMovieTravelMotion =
  | IAutoMovieTravelMotion.IRevolute
  | IAutoMovieTravelMotion.IPrismatic;
export namespace IAutoMovieTravelMotion {
  /**
   * A hinge: the member turns about an axis through a pivot.
   *
   * @evidence contracts/common.md#principled-implementation Models a hinge as an axis line through `pivot` with travel in radians; `validateTravelMotion` refuses a non-finite or near-zero axis, a non-finite pivot, `min > 0`, `max < 0`, `max <= min`, and a span wider than one full turn.
   * @evidence contracts/common.md#clear-and-simple-design Carries only the five fields a hinge needs, and the axis length is free because every consumer normalizes it, so authors need not supply a unit vector.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The one-turn cap allows 1e-6 rad of slack that the swept-envelope solver shares, a stated tolerance rather than an exception for any particular door or asset.
   * @evidence contracts/common.md#meaningful-documentation Documents the radian unit, the element-local frame of `axis` and `pivot`, the rest-at-zero bounds, the one-turn span limit, and that `max` must exceed `min`.
   */
  export interface IRevolute {
    /** Discriminator. */
    kind: "revolute";

    /** Non-zero turn axis in the moving element's own local frame. */
    axis: IAutoMovieVector3;

    /** A point on that axis in the same local frame. */
    pivot: IAutoMovieVector3;

    /** Lowest travel in radians; at most `0`, because rest is `0`. */
    min: number;

    /**
     * Highest travel in radians; at least `0`, strictly greater than `min`, and
     * within a turn of `min`.
     */
    max: number;
  }

  /**
   * A slide: the member travels along an axis without turning.
   *
   * @evidence contracts/common.md#principled-implementation Models a slide as a translation of the state value in metres along the normalized `axis` in the element's local frame; a translation has no centre, so the branch needs no pivot.
   * @evidence contracts/common.md#clear-and-simple-design Omits `pivot` instead of carrying an ignored one, so `validateTravelMotion` reads a pivot only on the revolute branch and a slide cannot declare a meaningless field.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Applies no turn cap and no prismatic-only limit; the same rest-straddling and `max > min` refusals govern it as govern the hinge branch.
   * @evidence contracts/common.md#meaningful-documentation States the metre unit measured along the unit axis, the element-local frame, `min <= 0 <= max`, and the strict `max > min` requirement validation enforces.
   */
  export interface IPrismatic {
    /** Discriminator. */
    kind: "prismatic";

    /** Non-zero travel axis in the moving element's own local frame. */
    axis: IAutoMovieVector3;

    /** Lowest travel in metres along the unit axis; at most `0`. */
    min: number;

    /**
     * Highest travel in metres along the unit axis; at least `0` and strictly
     * greater than `min`.
     */
    max: number;
  }
}
