import {
  type AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeRide,
} from "../core";
import type { createMotorcycle } from "./createMotorcycle";

/**
 * A motorcycle or a scooter ridden along a course: its root on the path, leaned
 * into each turn by the balance of its speed and the turn's radius.
 *
 * @param machine The machine.
 * @param course The course its root follows, or its plan, such as a timed
 *   course's.
 * @returns The ride, with the course's instants.
 * @throws {AutoMovieArchetypeRefusal} When a bend at the fastest the course
 *   lets it be taken needs more than `rideMotorcycle.LEAN` degrees of lean, as
 *   `AutoMovieArchetypeCourse.admitLean` refuses, or the course is malformed.
 */
export function rideMotorcycle(
  machine: AutoMovieArchetype<
    createMotorcycle.Affordance,
    createMotorcycle.Dimension
  >,
  course: AutoMovieArchetypeCourse.ICourse | AutoMovieArchetypeCourse.IPlan,
): AutoMovieArchetypeRide.IRide<
  createMotorcycle.Affordance,
  createMotorcycle.Dimension
> {
  const plan: AutoMovieArchetypeCourse.IPlan =
    course.kind === "plan"
      ? course
      : AutoMovieArchetypeCourse.plan("motorcycle", course);
  AutoMovieArchetypeCourse.admitLean("motorcycle", plan, rideMotorcycle.LEAN);
  return AutoMovieArchetypeRide.along(
    machine,
    plan,
    (
      state: AutoMovieArchetypeCourse.IState,
    ): AutoMovieArchetypeRide.IPose<
      createMotorcycle.Affordance,
      createMotorcycle.Dimension
    > => ({
      archetype: machine,
      placement: AutoMovieArchetypeCourse.banked(
        state,
        AutoMovieArchetypeCourse.lean(state),
      ),
    }),
  );
}

/** Companion constant of {@link rideMotorcycle}. */
export namespace rideMotorcycle {
  /**
   * The greatest lean, degrees: about 50 for a rider on the road (Pirelli,
   * https://www.pirelli.com/global/en-ww/road/motorcycles/tyres/passion-for-the-two-wheels-big-challenge-high-performance-tires-49601/).
   */
  export const LEAN: number = 50;
}
