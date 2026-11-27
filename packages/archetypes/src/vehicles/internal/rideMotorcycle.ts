import {
  type AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeRide,
} from "../../core";
import type { AutoMovieArchetypeMotorcycle } from "../AutoMovieArchetypeMotorcycle";

/*
 * A motorcycle or a scooter ridden along a course: its root on the path, leaned
 * into each turn by the balance of its speed and the turn's radius.
 * Parameter machine: The machine.
 * Parameter course: The course its root follows, or its plan, such as a timed
 * course's.
 * Parameter maximumLean: Greatest lean in degrees admitted for this ride.
 * Returns: The ride, with the course's instants.
 * When a bend at the fastest the course
 * lets it be taken needs more than `maximumLean` degrees of lean, as
 * `AutoMovieArchetypeCourse.admitLean` refuses, or the course is malformed.
 */
export function rideMotorcycle(
  machine: AutoMovieArchetype<
    AutoMovieArchetypeMotorcycle.Affordance,
    AutoMovieArchetypeMotorcycle.Dimension
  >,
  course: AutoMovieArchetypeCourse.ICourse | AutoMovieArchetypeCourse.IPlan,
  maximumLean: number,
): AutoMovieArchetypeRide.IRide<
  AutoMovieArchetypeMotorcycle.Affordance,
  AutoMovieArchetypeMotorcycle.Dimension
> {
  const plan: AutoMovieArchetypeCourse.IPlan =
    course.kind === "plan"
      ? course
      : AutoMovieArchetypeCourse.plan("motorcycle", course);
  AutoMovieArchetypeCourse.admitLean("motorcycle", plan, maximumLean);
  return AutoMovieArchetypeRide.along(
    machine,
    plan,
    (
      state: AutoMovieArchetypeCourse.IState,
    ): AutoMovieArchetypeRide.IPose<
      AutoMovieArchetypeMotorcycle.Affordance,
      AutoMovieArchetypeMotorcycle.Dimension
    > => ({
      archetype: machine,
      placement: AutoMovieArchetypeCourse.banked(
        state,
        AutoMovieArchetypeCourse.lean(state),
      ),
    }),
  );
}
