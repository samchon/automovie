import { bowlingPinfall as bowlingPinfallLaw } from "../sport/bowlingPinfall";
import { bowlingSlide as bowlingSlideLaw } from "../sport/bowlingSlide";
import { HUMAN_BOWLING_DELIVERY } from "./presets/HUMAN_BOWLING_DELIVERY";

/**
 * Ten-pin bowling: the final slide of the approach and the credit of the pins a
 * baked delivery knocks down. The delivery itself is the throw with the bowling
 * style (`AutoMovieMotionHumanBowling.DELIVERY`, a preset of
 * `IAutoMovieMotionHumanThrowCatch.IStylePreset`), so the behaviour adds no
 * throw method. `slide` appends an action and returns the chain; `readPinfall`
 * is a reader, so it returns its named result and not the chain.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `slide`: Carry the body on the sliding foot opposite the delivery hand.
 * - `readPinfall`: Credit the pinfall of a baked bowling delivery: the pins down
 *   at the end of its cache, in rack order.
 *
 * Presets, named parameter values spread into a law's parameters beside the
 * hold; a preset adds no method:
 *
 * - `DELIVERY`: The low delivery of a one-handed ten-pin bowling approach: the
 *   bowling style, release 1 degree below the horizontal after a 0.58 s windup,
 *   along the lane.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanBowling} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanBowling {
  /**
   * Carry the body on the sliding foot opposite the delivery hand.
   *
   * Seiferheld et al. (2023), section 1 and Figure 2, place the final slide
   * after the dominant foot's push and the ball release after its braking. The
   * authored interval controls that glide. A throw can overlay the base without
   * changing the foot clock. The trailing leg sweeps behind as the body glides
   * and lowers over it, nearly straight, its toe dragging on the approach (a
   * declared bearing contact) and the foot pitched with the leg's lean so its
   * ankle keeps the angle it stood with, then steps up clear of the floor in
   * the recovery and comes down flat over its landing place. The lowering,
   * short trailing step and clip-length reach bound are provisional animation
   * parameters.
   */
  export const slide: typeof bowlingSlideLaw = bowlingSlideLaw;

  /**
   * The low delivery of a one-handed ten-pin bowling approach: the bowling
   * style, release 1 degree below the horizontal after a 0.58 s windup, along
   * the lane. Spread into `throwObject`'s parameters with the target.
   */
  export const DELIVERY: typeof HUMAN_BOWLING_DELIVERY = HUMAN_BOWLING_DELIVERY;

  /**
   * Credit the pinfall of a baked bowling delivery: the pins down at the end of
   * its cache, in rack order.
   *
   * USBC counts a pin knocked down or off the deck; a pin moved but standing
   * does not count. A pin is down when its axis leans past its tip-over angle,
   * atan(r / h), where its centre of mass passes over the rim of its base: r is
   * the largest horizontal reach of the hull vertices on the base plane and h
   * the centre-of-mass height above it. Taking the vertex circumradius rather
   * than the footprint's inradius makes the angle slightly larger, so a
   * borderline lean is credited as standing.
   *
   * @param params The placed `pins`, each upright on its base with +Y along its
   *   axis, and the baked `result` deck whose cache holds them.
   * @returns The ids of the pins down at the cache end.
   * @throws {RangeError} When a pin has no hull base below its centre of mass,
   *   or is missing from the cache.
   */
  export const readPinfall: typeof bowlingPinfallLaw = bowlingPinfallLaw;
}
