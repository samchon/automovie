import type { AutoMovieArchetype, AutoMovieArchetypeRide } from "../core";
import type { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import type { createHorse } from "./createHorse";
import { rideQuadruped } from "./rideQuadruped";

/**
 * A horse going along a course: `rideQuadruped` on the horse's species, its timing `AutoMovieArchetypeEquineGait`'s measured table, its gait changing at the horse's change points, and its bridle nodding with its head in harness.
 *
 * @param horse The horse.
 * @param course The course its root follows; a leg may name the `gait` and the `lead` it is ridden at.
 * @param gait The gait of every stride whose leg names none; absent, the speed chooses it.
 * @returns The ride.
 * @throws {AutoMovieArchetypeRefusal} As `rideQuadruped` refuses.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States that the horse is ridden as every quadruped is, from its own data.
 * @evidence contracts/development/implementation.md#principled-implementation The shared quadruped ride, whose every number for a horse is `AutoMovieArchetypeEquineGait`'s and `createHorse.BODY`'s.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No horse branch in the ride; the horse differs only by its data.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The ride's own.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `rideQuadruped`.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The ride's own.
 */
export function rideHorse(
  horse: AutoMovieArchetype<createHorse.Affordance, createHorse.Dimension>,
  course: rideQuadruped.ICourse,
  gait?: AutoMovieArchetypeQuadrupedGait.Gait,
): AutoMovieArchetypeRide.IRide<createHorse.Affordance, createHorse.Dimension> {
  return rideQuadruped(horse, course, gait);
}
