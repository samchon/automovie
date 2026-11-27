import { Quaternion } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeRide,
  AutoMovieArchetypeUnits,
} from "../../core";
import type { AutoMovieArchetypeCar } from "../AutoMovieArchetypeCar";
import { CarSteering } from "./CarSteering";
import { CourseWheelTravel } from "./CourseWheelTravel";

/**
 * A car driven along a course: its root on the path, its steering wheel turned
 * as the path's curvature asks with its front road wheels steering with it, and
 * its road wheels rolling with the distance.
 *
 * The steering wheel's angle is the road wheels' angle times the car's steering
 * ratio, and the road wheels' angle is the one that turns the car on the path's
 * radius: the angle whose tangent is the wheelbase over the radius of the rear
 * axle's path (the Ackermann relation of a car's low-speed turn). The car's
 * root is the middle of its wheelbase, so the rear axle's radius is the root's
 * shortened by half a wheelbase. A left turn turns the wheel to the left, a
 * positive travel; reversing, the same bend of the path needs the wheel turned
 * the other way, because the car then turns about its rear axle backward. The
 * front road wheels follow the steering wheel
 * (`AutoMovieArchetypeCar.ackermann`). Every road wheel's phase follows the
 * length of its own Ackermann path. Signed distances accumulate through leg
 * boundaries before wrapping the spin travel into the articulated wheel's
 * range.
 *
 * @param car The car.
 * @param course The course its root follows, or its plan, such as a timed
 *   course's.
 * @returns The ride, with the course's instants.
 * @throws {AutoMovieArchetypeRefusal} When the path bends tighter than the
 *   car's steering lock allows, giving the least radius at the leg or, on a
 *   timed course, the sample, or the course is malformed.
 */
export function driveCar(
  car: AutoMovieArchetype<
    AutoMovieArchetypeCar.Affordance,
    AutoMovieArchetypeCar.Dimension
  >,
  course: AutoMovieArchetypeCourse.ICourse | AutoMovieArchetypeCourse.IPlan,
): AutoMovieArchetypeRide.IRide<
  AutoMovieArchetypeCar.Affordance,
  AutoMovieArchetypeCar.Dimension
> {
  const wheelbase: number = car.dimensions.wheelbase!;
  const ratio: number = car.dimensions.steeringRatio!;
  const lock: number = car.dimensions.lockTurns! * 180;
  const diameter: number = car.dimensions.wheelDiameter!;

  // The tightest turn the lock allows: the road wheels at lock over ratio.
  const plan: AutoMovieArchetypeCourse.IPlan =
    course.kind === "plan"
      ? course
      : AutoMovieArchetypeCourse.plan("car", course);
  const most: number = (lock / ratio) * AutoMovieArchetypeUnits.DEGREE;
  const least: number = Math.hypot(wheelbase / Math.tan(most), wheelbase / 2);
  AutoMovieArchetypeCourse.admitRadius(
    "car",
    plan,
    least,
    "needs more steering than the car's lock gives",
  );
  const wheelIds = [
    "frontLeftSpin",
    "frontRightSpin",
    "rearLeftSpin",
    "rearRightSpin",
  ] as const;
  const offsets: readonly number[] = wheelIds.map(
    (id): number => car.affordance(id).frame.translation.x,
  );
  const distances = (
    curvature: number,
    horizontal: number,
    vertical: number,
    reverse: boolean,
  ): number[] => {
    const turn: number = reverse ? -curvature : curvature;
    const half: number = (wheelbase / 2) * turn;
    const rear: number = Math.sqrt((1 - half) * (1 + half));
    return offsets.map((x: number, i: number): number => {
      const adjacent: number = rear - x * turn;
      const along: number =
        (i < 2 ? Math.hypot(adjacent, 2 * half) : adjacent) * horizontal;
      return Math.hypot(along, vertical) * (reverse ? -1 : 1);
    });
  };
  const travel: CourseWheelTravel.Reader =
    plan.course.kind === "timed"
      ? CourseWheelTravel.timed(
          { ...plan, course: plan.course },
          (state: AutoMovieArchetypeCourse.IState): number[] => {
            const forward: IAutoMovieVector3 = Quaternion.rotateVector(
              state.placement.rotation,
              { x: 0, y: 0, z: 1 },
            );
            return distances(
              state.curvature,
              state.speed * Math.hypot(forward.x, forward.z),
              state.speed * forward.y,
              state.reverse,
            );
          },
        )
      : CourseWheelTravel.legs(
          plan.legSpans,
          plan.course.legs.map((leg: AutoMovieArchetypeCourse.Leg): number[] =>
            distances(
              leg.kind === "turn" ? Math.sign(leg.angle) / leg.radius : 0,
              leg.kind === "turn"
                ? Math.abs(leg.angle) *
                    AutoMovieArchetypeUnits.DEGREE *
                    leg.radius
                : leg.length,
              leg.rise ?? 0,
              leg.reverse === true,
            ),
          ),
        );
  /** A signed material distance in the knob's travel range. */
  const spin = (distance: number): number => {
    const angle: number = (distance / (Math.PI * diameter)) * 360;
    return ((angle % 360) + 360) % 360;
  };
  return AutoMovieArchetypeRide.articulated(
    car,
    plan,
    (
      state: AutoMovieArchetypeCourse.IState,
      seconds: number,
      id?: AutoMovieArchetypeCar.Affordance,
    ): Partial<Record<AutoMovieArchetypeCar.Affordance, number>> => {
      const travels: Partial<Record<AutoMovieArchetypeCar.Affordance, number>> =
        {};
      if (
        id === undefined ||
        id === "wheel" ||
        id === "rightSteeringGrip" ||
        id === "frontLeftWheel" ||
        id === "frontRightWheel" ||
        id === "frontLeftSpin" ||
        id === "frontRightSpin"
      ) {
        const steering: number = CarSteering(wheelbase, ratio, state.curvature);
        travels.wheel = state.reverse ? -steering : steering;
      }
      const selected: number = wheelIds.findIndex(
        (wheel): boolean => wheel === id,
      );
      if (id === undefined || selected >= 0) {
        const distances: readonly number[] = travel(state, seconds);
        if (id === undefined)
          wheelIds.forEach((wheel, i: number): void => {
            travels[wheel] = spin(distances[i]!);
          });
        else travels[id] = spin(distances[selected]!);
      }
      return travels;
    },
  );
}
