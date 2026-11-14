import {
  type Archetype,
  type ArchetypeCourse,
  ArchetypeRide,
} from "../core";
import type { createWheelchair } from "./createWheelchair";

/**
 * A wheelchair moved along a course: its root on the path and its rear wheels, with a self-propelled chair's handrims riding them, rolling with the distance.
 *
 * The chair is pushed by an attendant at its handles or wheeled by its sitter; either way the wheels roll without slipping, 360 degrees per wheel circumference of the signed distance, forward less reversed. A sitter's own stroke on the rims is no motion law yet, as `createWheelchair` states, so the rims turn and a hand held on one goes round with it.
 *
 * @param chair The wheelchair.
 * @param course The course its root follows, or its plan.
 * @returns The ride, with the course's instants.
 * @throws {ArchetypeRefusal} As `ArchetypeRide.along` does for a malformed course.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what moves, the rolling relation and the missing stroke.
 * @evidence contracts/development/implementation.md#principled-implementation Rolling without slipping: the spin is the signed distance over the circumference, in degrees, taken modulo a turn so it stays in the knob's range.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pose function over `ArchetypeRide.along`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both wheels turn alike, so a turn's outer wheel does not run faster; the casters do not swivel. Both are stated, not hidden.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The ride's plan is shared by every sample.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the chair and the plan for as long as the caller keeps the ride.
 */
export function rideWheelchair(
  chair: Archetype<createWheelchair.Affordance, createWheelchair.Dimension>,
  course: ArchetypeCourse.ICourse | ArchetypeCourse.IPlan,
): ArchetypeRide.IRide<createWheelchair.Affordance, createWheelchair.Dimension> {
  const circumference: number = Math.PI * chair.dimensions.wheelDiameter!;
  return ArchetypeRide.along(
    chair,
    course,
    (
      state: ArchetypeCourse.IState,
    ): ArchetypeRide.IPose<
      createWheelchair.Affordance,
      createWheelchair.Dimension
    > => {
      const spin: number =
        ((((state.progress / circumference) * 360) % 360) + 360) % 360;
      return {
        archetype: chair.articulate({ leftSpin: spin, rightSpin: spin }),
        placement: state.placement,
      };
    },
  );
}
