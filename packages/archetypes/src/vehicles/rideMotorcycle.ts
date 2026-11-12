import { type Archetype, ArchetypeCourse, ArchetypeRide } from "../core";
import type { createMotorcycle } from "./createMotorcycle";

/**
 * A motorcycle or a scooter ridden along a course: its root on the path, leaned into each turn by the balance of its speed and the turn's radius.
 *
 * @param machine The machine.
 * @param course The course its root follows.
 * @returns The ride, with the course's instants.
 * @throws {ArchetypeRefusal} When a turn at the course's cruising speed needs more than `rideMotorcycle.LEAN` degrees of lean, giving the least radius at that speed, or the course is malformed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what moves and the refusal.
 * @evidence contracts/development/implementation.md#principled-implementation The steady-turn lean of `ArchetypeCourse.lean`; `ArchetypeCourse.admitLean` checks the limit at the cruising speed, the fastest the course lets a turn be taken.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Check every turn against the limit, then one pose function.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A turn beyond the limit is refused, never flattened.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The ride's plan is shared by every sample, and the lean check is the one the bicycle's ride uses.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the machine and the plan for as long as the caller keeps the ride.
 */
export function rideMotorcycle(
  machine: Archetype<createMotorcycle.Affordance, createMotorcycle.Dimension>,
  course: ArchetypeCourse.ICourse,
): ArchetypeRide.IRide<
  createMotorcycle.Affordance,
  createMotorcycle.Dimension
> {
  ArchetypeCourse.admitLean("motorcycle", course, rideMotorcycle.LEAN);
  return ArchetypeRide.along(
    machine,
    course,
    (
      state: ArchetypeCourse.IState,
    ): ArchetypeRide.IPose<
      createMotorcycle.Affordance,
      createMotorcycle.Dimension
    > => ({
      archetype: machine,
      placement: ArchetypeCourse.banked(state, ArchetypeCourse.lean(state)),
    }),
  );
}

/**
 * Companion constant of {@link rideMotorcycle}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the limit and its source.
 * @evidence contracts/development/design.md#principled-representation One named angle in degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one limit the ride checks.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A cited constant, not a number inside the check.
 */
export namespace rideMotorcycle {
  /** The greatest lean, degrees: about 50 for a rider on the road (Pirelli, https://www.pirelli.com/global/en-ww/road/motorcycles/tyres/passion-for-the-two-wheels-big-challenge-high-performance-tires-49601/). */
  export const LEAN: number = 50;
}
