import { type Archetype, ArchetypeCourse, ArchetypeRide } from "../core";
import type { createCar } from "./createCar";

/**
 * A car driven along a course: its root on the path, its steering wheel turned as the path's curvature asks with its front road wheels steering with it, and its road wheels rolling with the distance.
 *
 * The steering wheel's angle is the road wheels' angle times the car's steering ratio, and the road wheels' angle is the one that turns the car on the path's radius: the angle whose tangent is the wheelbase over the radius of the rear axle's path (the Ackermann relation of a car's low-speed turn). The car's root is the middle of its wheelbase, so the rear axle's radius is the root's shortened by half a wheelbase. A left turn turns the wheel to the left, a positive travel; reversing, the same bend of the path needs the wheel turned the other way, because the car then turns about its rear axle backward. The front road wheels follow the steering wheel (`createCar.ackermann`). Every road wheel rolls without slipping: its spin is 360 degrees per wheel circumference of the signed distance, forward less reversed, taken modulo a turn. The wheel is at its angle for the whole of a turn and straight between turns.
 *
 * @param car The car.
 * @param course The course its root follows, or its plan, such as a timed course's.
 * @returns The ride, with the course's instants.
 * @throws {ArchetypeRefusal} When the path bends tighter than the car's steering lock allows, giving the least radius at the leg or, on a timed course, the sample, or the course is malformed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the steering relation, which point follows the path, the signs forward and reversing, the road wheels, and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Low-speed Ackermann geometry: the road wheel angle is the arctangent of the wheelbase over the rear axle's path radius, and the hand wheel turns by the overall ratio times it. Reversing, the heading's rate is the speed over the wheelbase times the tangent of the angle with the speed's sign flipped, so a path bending the same way needs the opposite angle. Tyre slip at speed is left out, which holds for the walking-to-town speeds a staged scene uses.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Plan unless planned, admit every bend at the lock, then one pose function from curvature to the wheel's travel.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The wheel steps to its angle at a turn's start because the course's curvature steps there; easing it in is a spiral leg the course does not have, stated here rather than hidden.
 * @evidence contracts/development/implementation.md#efficient-algorithms One arctangent per sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The ride's plan is shared by every sample.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the car and the plan for as long as the caller keeps the ride.
 */
export function driveCar(
  car: Archetype<createCar.Affordance, createCar.Dimension>,
  course: ArchetypeCourse.ICourse | ArchetypeCourse.IPlan,
): ArchetypeRide.IRide<createCar.Affordance, createCar.Dimension> {
  const wheelbase: number = car.dimensions.wheelbase!;
  const ratio: number = car.dimensions.steeringRatio!;
  const lock: number = car.dimensions.lockTurns! * 180;
  const diameter: number = car.dimensions.wheelDiameter!;

  /** The steering wheel's angle on a path of a signed curvature, degrees, going forward. */
  const steer = (curvature: number): number => {
    if (curvature === 0) return 0;
    const radius: number = 1 / Math.abs(curvature);
    const axle: number = Math.sqrt(
      Math.max(0, radius * radius - (wheelbase * wheelbase) / 4),
    );
    return (
      Math.sign(curvature) *
      ratio *
      ((Math.atan2(wheelbase, axle) * 180) / Math.PI)
    );
  };

  // The tightest turn the lock allows: the road wheels at lock over ratio.
  const plan: ArchetypeCourse.IPlan =
    "legs" in course ? ArchetypeCourse.plan("car", course) : course;
  const most: number = (lock / ratio) * (Math.PI / 180);
  const least: number = Math.hypot(wheelbase / Math.tan(most), wheelbase / 2);
  ArchetypeCourse.admitRadius(
    "car",
    plan,
    least,
    "needs more steering than the car's lock gives",
  );
  return ArchetypeRide.along(
    car,
    plan,
    (
      state: ArchetypeCourse.IState,
    ): ArchetypeRide.IPose<createCar.Affordance, createCar.Dimension> => {
      // Each road wheel rolls its circumference per turn, forward or back with the signed distance.
      const turns: number = state.progress / (Math.PI * diameter);
      const spin: number = (((turns * 360) % 360) + 360) % 360;
      return {
        archetype: car.articulate({
          wheel: state.reverse
            ? -steer(state.curvature)
            : steer(state.curvature),
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