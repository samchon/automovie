import {
  type Archetype,
  ArchetypeCourse,
  ArchetypeRefusal,
  ArchetypeRide,
} from "../core";
import type { createCar } from "./createCar";

/**
 * A car driven along a course: its root on the path, and its steering wheel turned as the path's curvature asks.
 *
 * The steering wheel's angle is the road wheels' angle times the car's steering ratio, and the road wheels' angle is the one that turns the car on the path's radius: the angle whose tangent is the wheelbase over the radius of the rear axle's path (the Ackermann relation of a car's low-speed turn). The car's root is the middle of its wheelbase, so the rear axle's radius is the root's shortened by half a wheelbase. A left turn turns the wheel to the left, a positive travel. The wheel is at its angle for the whole of a turn and straight between turns.
 *
 * @param car The car.
 * @param course The course its root follows.
 * @returns The ride, with the course's instants.
 * @throws {ArchetypeRefusal} When a turn is tighter than the car's steering lock allows, giving the least radius, or the course is malformed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the steering relation, which point follows the path, the sign and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Low-speed Ackermann geometry: the road wheel angle is the arctangent of the wheelbase over the rear axle's path radius, and the hand wheel turns by the overall ratio times it. Tyre slip at speed is left out, which holds for the walking-to-town speeds a staged scene uses.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Check every turn against the lock, then one pose function from curvature to the wheel's travel.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The wheel steps to its angle at a turn's start because the course's curvature steps there; easing it in is a spiral leg the course does not have, stated here rather than hidden.
 * @evidence contracts/development/implementation.md#efficient-algorithms One arctangent per sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The ride's plan is shared by every sample.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the car and the plan for as long as the caller keeps the ride.
 */
export function driveCar(
  car: Archetype<createCar.Affordance, createCar.Dimension>,
  course: ArchetypeCourse.ICourse,
): ArchetypeRide.IRide<createCar.Affordance, createCar.Dimension> {
  const wheelbase: number = car.dimensions.wheelbase!;
  const ratio: number = car.dimensions.steeringRatio!;
  const lock: number = car.dimensions.lockTurns! * 180;

  /** The steering wheel's angle on a path of a signed curvature, degrees. */
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
  const most: number = (lock / ratio) * (Math.PI / 180);
  const least: number = Math.hypot(wheelbase / Math.tan(most), wheelbase / 2);
  course.legs.forEach((leg: ArchetypeCourse.Leg, index: number): void => {
    if (leg.kind === "turn" && leg.radius < least)
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: "car",
        axis: `course.legs[${index}].radius`,
        value: leg.radius,
        feasible: { kind: "range", minimum: least, maximum: null, unit: "m" },
        reason: `a ${leg.radius} m turn needs more steering than the car's lock gives`,
        fix: "widen the turn to at least the car's least radius",
      });
  });
  return ArchetypeRide.along(
    car,
    course,
    (
      state: ArchetypeCourse.IState,
    ): ArchetypeRide.IPose<createCar.Affordance, createCar.Dimension> => ({
      archetype: car.articulate({ wheel: steer(state.curvature) }),
      placement: state.placement,
    }),
  );
}
