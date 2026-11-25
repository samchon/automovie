import type { AutoMovieArchetype, AutoMovieArchetypeRide } from "../core";
import { type AutoMovieArchetypeEquine } from "./AutoMovieArchetypeEquine";
import type { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import { rideQuadruped } from "./rideQuadruped";

/**
 * A horse going along a course: `rideQuadruped` on the horse's species, its
 * timing `AutoMovieArchetypeEquineGait`'s measured table, its gait changing at
 * the horse's change points, and its bridle nodding with its head in harness.
 *
 * @param horse The horse.
 * @param course The course its root follows; a leg may name the `gait` and the
 *   `lead` it is ridden at.
 * @param gait The gait of every stride whose leg names none; absent, the speed
 *   chooses it.
 * @returns The ride.
 * @throws {AutoMovieArchetypeRefusal} As `rideQuadruped` refuses.
 */
export function rideHorse(
  horse: AutoMovieArchetype<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  >,
  course: rideQuadruped.ICourse,
  gait?: AutoMovieArchetypeQuadrupedGait.Gait,
): AutoMovieArchetypeRide.IRide<
  AutoMovieArchetypeEquine.Affordance,
  AutoMovieArchetypeEquine.Dimension
> {
  return rideQuadruped(horse, course, gait);
}
