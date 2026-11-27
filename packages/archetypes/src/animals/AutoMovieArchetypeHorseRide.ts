import type { AutoMovieArchetype, AutoMovieArchetypeRefusal, AutoMovieArchetypeRide } from "../core";
import { type AutoMovieArchetypeEquine } from "./AutoMovieArchetypeEquine";
import type { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import { AutoMovieArchetypeQuadruped } from "./AutoMovieArchetypeQuadruped";

/** A ride operation owned by the horse family. */
export namespace AutoMovieArchetypeHorseRide {
  /**
   * A horse going along a course: `AutoMovieArchetypeQuadruped.ride` on the horse's species, its
   * timing `AutoMovieArchetypeEquineGait`'s measured table, its gait changing at
   * the horse's change points, and its bridle nodding with its head in harness.
   *
   * @param horse The horse.
   * @param course The course its root follows; a leg may name the `gait` and the
   *   `lead` it is ridden at.
   * @param gait The gait of every stride whose leg names none; absent, the speed
   *   chooses it.
   * @returns The ride.
   * @throws {AutoMovieArchetypeRefusal} As `AutoMovieArchetypeQuadruped.ride` refuses.
   */
  export function ride(
    horse: AutoMovieArchetype<
      AutoMovieArchetypeEquine.Affordance,
      AutoMovieArchetypeEquine.Dimension
    >,
    course: AutoMovieArchetypeQuadruped.IRideCourse,
    gait?: AutoMovieArchetypeQuadrupedGait.Gait,
  ): AutoMovieArchetypeRide.IRide<
    AutoMovieArchetypeEquine.Affordance,
    AutoMovieArchetypeEquine.Dimension
  > {
    return AutoMovieArchetypeQuadruped.ride(horse, course, gait);
  }
}