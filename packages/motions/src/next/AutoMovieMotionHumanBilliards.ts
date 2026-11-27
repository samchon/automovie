import { bakePrecisionDeck as bakePrecisionDeckLaw } from "../sport/internal/bakePrecisionDeck";
import { pocketedBalls as pocketedBallsLaw } from "../sport/internal/pocketedBalls";

/**
 * Cue sports and putting greens: the credit of the balls a baked precision shot
 * drops into a pocket or a cup. The shot is baked by
 * `AutoMovieMotionHumanBilliards.bakePrecisionDeck`; `readPocketed` is a reader
 * of that bake, so it returns its named result and no chain.
 *
 * Laws and helpers, each the shipped function under the family name:
 *
 * - `bakePrecisionDeck`: Bake a released ball on its playing surface and its
 *   effect on loose targets: a bowling ball on the lane and its pins, a cue
 *   ball on the table and its object balls, a putt on the green.
 * - `readPocketed`: Credit the balls a baked precision shot drops into a pocket
 *   or a cup, in the order they drop.
 *
 * A member here is the shipped law, preset or row itself, bound to its owner by
 * `typeof` and never wrapped, so its parameters, units, frames and refusals are
 * those its own comment states. The family's shared model and each law's
 * parameters are declared by {@link IAutoMovieMotionHumanBilliards} in
 * `@automovie/interface`.
 */
export namespace AutoMovieMotionHumanBilliards {
  /**
   * Bake a released ball on its playing surface and its effect on loose
   * targets: a bowling ball on the lane and its pins, a cue ball on the table
   * and its object balls, a putt on the green.
   *
   * Read the ball and target frames from the shared native cache with its film
   * clock offset. A delivery that touches no target has no target impact.
   * Contact order and target motion follow the supplied profiles and
   * materials.
   *
   * @param input The world release state, fixed surface, placed targets and
   *   simulation extent.
   * @returns A fixed-step replay of the actual ball and target transforms and
   *   the first target contact, if any.
   * @throws {RangeError} For invalid duration, release time or a non-rigid
   *   input. Engine admission owns profiles, coordinates and solver bounds.
   */
  export const bakePrecisionDeck: typeof bakePrecisionDeckLaw =
    bakePrecisionDeckLaw;

  /**
   * Credit the balls a baked precision shot drops into a pocket or a cup, in
   * the order they drop.
   *
   * The bed, a cue table's or a green's, has open mouths at its pockets or cup,
   * so a pocketed ball leaves the bed plane. A ball is credited at the first
   * cache frame where its centre is more than one radius below the bed plane,
   * so the whole ball has passed the bed, to the mouth whose plan reach holds
   * it at that frame. A ball that falls below the bed outside every reach left
   * the table over a rail and is never credited.
   *
   * @param params The `balls` to credit, each one rigid sphere whose centre of
   *   mass is its centre, the table's `pockets` at bed height and the baked
   *   `result` shot.
   * @returns The pocketed balls in drop order; empty when none drops.
   * @throws {RangeError} When a ball has no sphere shape, there is no pocket,
   *   or a ball is missing from the cache.
   */
  export const readPocketed: typeof pocketedBallsLaw = pocketedBallsLaw;
}
