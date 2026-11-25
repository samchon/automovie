import {
  type AutoMovieArchetype,
  AutoMovieArchetypeCourse,
  AutoMovieArchetypeRide,
  AutoMovieArchetypeUnits,
} from "../core";
import { CarSteering } from "./CarSteering";
import type { createCar } from "./createCar";

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
 * front road wheels follow the steering wheel (`createCar.ackermann`). Every
 * road wheel rolls without slipping: its spin is 360 degrees per wheel
 * circumference of the signed distance, forward less reversed, taken modulo a
 * turn. The wheel is at its angle for the whole of a turn and straight between
 * turns.
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
  car: AutoMovieArchetype<createCar.Affordance, createCar.Dimension>,
  course: AutoMovieArchetypeCourse.ICourse | AutoMovieArchetypeCourse.IPlan,
): AutoMovieArchetypeRide.IRide<createCar.Affordance, createCar.Dimension> {
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
  return AutoMovieArchetypeRide.along(
    car,
    plan,
    (
      state: AutoMovieArchetypeCourse.IState,
    ): AutoMovieArchetypeRide.IPose<
      createCar.Affordance,
      createCar.Dimension
    > => {
      // Each road wheel rolls its circumference per turn, forward or back with the signed distance.
      const turns: number = state.progress / (Math.PI * diameter);
      const spin: number = (((turns * 360) % 360) + 360) % 360;
      const steering: number = CarSteering(wheelbase, ratio, state.curvature);
      return {
        archetype: car.articulate({
          wheel: state.reverse ? -steering : steering,
          frontLeftSpin: spin,
          frontRightSpin: spin,
          rearLeftSpin: spin,
          rearRightSpin: spin,
        }),
        placement: state.placement,
      };
    },
  );
}
