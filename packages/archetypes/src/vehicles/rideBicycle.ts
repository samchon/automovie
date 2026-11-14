import {
  type Archetype,
  ArchetypeCourse,
  ArchetypeRefusal,
  ArchetypeRide,
} from "../core";
import type { createBicycle } from "./createBicycle";

/**
 * A bicycle ridden along a course: its root on the path, leaned into each turn, and its crank turned by the distance covered.
 *
 * One turn of the crank carries the bicycle the wheel's circumference times the gear ratio (the development), so the crank's travel in degrees is 360 times the distance over the development: the crank's angle integrates the path's speed by the gear. The ride adds the instants `leftTopDeadCentre` and `rightTopDeadCentre`, each time a crank arm passes straight up.
 *
 * @param bicycle The bicycle.
 * @param course The course its root follows, or its plan, such as a timed course's.
 * @param gear Teeth of the chainring and of the sprocket in use; 34 and 17 when absent, a ratio of 2 from the compact road chainsets and 11 to 28 tooth cassettes Wikipedia's Bicycle gearing article lists (https://en.wikipedia.org/wiki/Bicycle_gearing).
 * @returns The ride.
 * @throws {ArchetypeRefusal} When a tooth count is not a positive whole number, a leg is reversed (a bicycle freewheels backward, so its crank would run back by the distance, which no rider does), a bend at the fastest the course lets it be taken needs more than `rideBicycle.LEAN` degrees of lean (as `ArchetypeCourse.admitLean` refuses), or the course is malformed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the gear relation, the instants added and the default gear with its source.
 * @evidence contracts/development/implementation.md#principled-implementation The development of a chain drive: wheel circumference times chainring teeth over sprocket teeth per crank turn. The crank's travel is taken modulo a full turn, which leaves the pose unchanged and keeps the number small. The lean is the steady-turn balance of `ArchetypeCourse.lean`.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the gear, plan the course unless planned, admit its direction and its bends' lean, list the dead-centre instants from its distance, then one pose function.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The rider never coasts: the crank turns whenever the bicycle moves, a stated simplification an act may override by articulating the crank itself.
 * @evidence contracts/development/implementation.md#efficient-algorithms One instant per half turn of the crank over the course; constant work per sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The course is planned once, for the dead-centre instants and for the ride that samples it; the lean check is the one the motorcycle's ride uses.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the bicycle and the plan for as long as the caller keeps the ride.
 */
export function rideBicycle(
  bicycle: Archetype<createBicycle.Affordance, createBicycle.Dimension>,
  course: ArchetypeCourse.ICourse | ArchetypeCourse.IPlan,
  gear: { chainring: number; sprocket: number } = {
    chainring: 34,
    sprocket: 17,
  },
): ArchetypeRide.IRide<createBicycle.Affordance, createBicycle.Dimension> {
  for (const [name, teeth] of [
    ["chainring", gear.chainring],
    ["sprocket", gear.sprocket],
  ] as const)
    if (!(Number.isInteger(teeth) && teeth > 0))
      throw new ArchetypeRefusal({
        kind: "parameter",
        archetype: "bicycle",
        axis: `gear.${name}`,
        value: teeth,
        feasible: { kind: "range", minimum: 1, maximum: null, unit: "" },
        reason: `a ${name} has a whole number of teeth, not ${teeth}`,
        fix: "give the tooth counts of the chainring and the sprocket",
      });
  const development: number =
    (Math.PI * bicycle.dimensions.wheelDiameter! * gear.chainring) /
    gear.sprocket;

  // The crank turns with the distance, which runs one way only.
  const plan: ArchetypeCourse.IPlan =
    "legs" in course ? ArchetypeCourse.plan("bicycle", course) : course;
  if ("legs" in plan.course)
    plan.course.legs.forEach((leg: ArchetypeCourse.Leg, index: number): void => {
      if (leg.reverse === true)
        throw new ArchetypeRefusal({
          kind: "parameter",
          archetype: "bicycle",
          axis: `course.legs[${index}].reverse`,
          value: true,
          feasible: null,
          reason:
            "a bicycle freewheels backward, so its crank does not turn with a reversed leg",
          fix: "ride the leg forward, or wheel the bicycle by hand",
        });
    });
  ArchetypeCourse.admitLean("bicycle", plan, rideBicycle.LEAN);

  // A crank arm is straight up every half turn: the left at whole turns, the right between them.
  const instants: { seconds: number; label: string }[] = [];
  for (let k: number = 1; (k * development) / 2 <= plan.length; k++)
    instants.push({
      seconds: plan.when((k * development) / 2),
      label: k % 2 === 0 ? "leftTopDeadCentre" : "rightTopDeadCentre",
    });
  return ArchetypeRide.along(
    bicycle,
    plan,
    (
      state: ArchetypeCourse.IState,
    ): ArchetypeRide.IPose<
      createBicycle.Affordance,
      createBicycle.Dimension
    > => ({
      archetype: bicycle.articulate({
        crank: ((state.distance / development) * 360) % 360,
      }),
      placement: ArchetypeCourse.banked(state, ArchetypeCourse.lean(state)),
    }),
    instants,
  );
}

/**
 * Companion constant of {@link rideBicycle}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the limit, that no bicycle figure was read and what stands in for it.
 * @evidence contracts/development/design.md#principled-representation One named angle in degrees.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The one limit the ride checks.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A named, marked constant, not a number inside the check.
 */
export namespace rideBicycle {
  /** The greatest lean, degrees: provisional. No figure for a bicycle was read at a source; the road motorcycle's limit of `rideMotorcycle.LEAN` is taken as the bound a narrower tyre does not exceed. */
  export const LEAN: number = 50;
}
