import {
  type AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeRide,
} from "../../core";
import { CourseWheelTravel } from "../CourseWheelTravel";
import type { AutoMovieArchetypeWheelchair } from "../AutoMovieArchetypeWheelchair";

/**
 * A wheelchair moved along a course: its root on the path and its rear wheels,
 * with a self-propelled chair's handrims riding them, rolling with the
 * distance.
 *
 * The chair is pushed by an attendant at its handles or wheeled by its sitter.
 * The two rear wheels roll their signed centre travel plus or minus the track's
 * half-width times the heading change in radians. For a staged sitter's stroke,
 * pass the ride through `AutoMovieArchetypeWheelchair.handrimFrame` and register
 * `HumanHandrimStroke`.
 *
 * @param chair The wheelchair.
 * @param course The course its root follows, or its plan.
 * @returns The ride, with the course's instants.
 * @throws {AutoMovieArchetypeRefusal} As `AutoMovieArchetypeRide.along` does
 *   for a malformed course.
 */
export function rideWheelchair(
  chair: AutoMovieArchetype<
    AutoMovieArchetypeWheelchair.Affordance,
    AutoMovieArchetypeWheelchair.Dimension
  >,
  course: AutoMovieArchetypeCourse.ICourse | AutoMovieArchetypeCourse.IPlan,
): AutoMovieArchetypeRide.IRide<
  AutoMovieArchetypeWheelchair.Affordance,
  AutoMovieArchetypeWheelchair.Dimension
> {
  const circumference: number = Math.PI * chair.dimensions.wheelDiameter!;
  const halfTrack: number =
    (chair.affordance("leftSpin").frame.translation.x -
      chair.affordance("rightSpin").frame.translation.x) /
    2;
  const plan: AutoMovieArchetypeCourse.IPlan =
    course.kind === "plan"
      ? course
      : AutoMovieArchetypeCourse.plan("wheelchair", course);
  const heading: CourseWheelTravel.Reader =
    plan.course.kind === "timed"
      ? CourseWheelTravel.heading({ ...plan, course: plan.course })
      : CourseWheelTravel.legs(
          plan.legSpans,
          plan.course.legs.map(
            (leg: AutoMovieArchetypeCourse.Leg): number[] => [
              leg.kind === "turn" ? (leg.angle * Math.PI) / 180 : 0,
            ],
          ),
        );

  /** Signed tyre travel into the wheel's nonnegative knob range. */
  const spin = (travel: number): number =>
    ((((travel / circumference) * 360) % 360) + 360) % 360;
  return AutoMovieArchetypeRide.articulated(
    chair,
    plan,
    (
      state: AutoMovieArchetypeCourse.IState,
      seconds: number,
      id?: AutoMovieArchetypeWheelchair.Affordance,
    ): Partial<Record<AutoMovieArchetypeWheelchair.Affordance, number>> => {
      const left: boolean =
        id === undefined || id === "leftRim" || id === "leftSpin";
      const right: boolean =
        id === undefined || id === "rightRim" || id === "rightSpin";
      if (!left && !right) return {};
      const outside: number = halfTrack * heading(state, seconds)[0]!;
      return {
        ...(left ? { leftSpin: spin(state.progress - outside) } : {}),
        ...(right ? { rightSpin: spin(state.progress + outside) } : {}),
      };
    },
  );
}
