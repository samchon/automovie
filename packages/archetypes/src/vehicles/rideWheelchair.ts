import { type Archetype, ArchetypeCourse, ArchetypeRide } from "../core";
import type { createWheelchair } from "./createWheelchair";

/**
 * A wheelchair moved along a course: its root on the path and its rear wheels, with a self-propelled chair's handrims riding them, rolling with the distance.
 *
 * The chair is pushed by an attendant at its handles or wheeled by its sitter. On a course of legs, the two rear wheels roll their signed centre travel plus or minus the track's half-width times the heading change in radians. For a staged sitter's stroke, pass the ride through `wheelchairHandrimFrame` and register `HumanHandrimStroke`.
 *
 * @param chair The wheelchair.
 * @param course The course its root follows, or its plan.
 * @returns The ride, with the course's instants.
 * @throws {ArchetypeRefusal} As `ArchetypeRide.along` does for a malformed course.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what moves, the rolling relation and how a performer can follow the rim.
 * @evidence contracts/development/implementation.md#principled-implementation A plan of legs gives the signed heading change, so the outer and inner axle ends travel different signed distances. Each spin is signed travel over circumference and wrapped to the knob range.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One pose function over `ArchetypeRide.along`.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The unwrapped heading accumulates exact authored arc fractions on courses of legs. Both wheels still turn alike on timed curves, which do not expose unwrapped heading. Casters do not swivel.
 * @evidence contracts/development/implementation.md#efficient-algorithms Prepares the turns once. Sampling sums each turn's clamped extent with no integration or previous sample.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The ride's plan is shared by every sample.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Holds the chair and the plan for as long as the caller keeps the ride.
 */
export function rideWheelchair(
  chair: Archetype<createWheelchair.Affordance, createWheelchair.Dimension>,
  course: ArchetypeCourse.ICourse | ArchetypeCourse.IPlan,
): ArchetypeRide.IRide<
  createWheelchair.Affordance,
  createWheelchair.Dimension
> {
  const circumference: number = Math.PI * chair.dimensions.wheelDiameter!;
  const halfTrack: number = (
    chair.affordance("leftSpin").frame.translation.x -
    chair.affordance("rightSpin").frame.translation.x
  ) / 2;
  const plan: ArchetypeCourse.IPlan =
    course.kind === "plan" ? course : ArchetypeCourse.plan("wheelchair", course);
  const turns: readonly { from: number; span: number; outer: number }[] =
    plan.course.kind === "timed"
      ? []
      : plan.course.legs.flatMap(
          (leg: ArchetypeCourse.Leg, index: number): { from: number; span: number; outer: number }[] => {
            if (leg.kind !== "turn") return [];
            const { from, span }: ArchetypeCourse.ILegSpan = plan.legSpans[index]!;
            return [{ from, span, outer: (halfTrack * leg.angle * Math.PI) / 180 }];
          },
        );

  /** Signed tyre travel into the wheel's nonnegative knob range. */
  const spin = (travel: number): number =>
    ((((travel / circumference) * 360) % 360) + 360) % 360;
  return ArchetypeRide.along(
    chair,
    plan,
    (
      state: ArchetypeCourse.IState,
    ): ArchetypeRide.IPose<
      createWheelchair.Affordance,
      createWheelchair.Dimension
    > => {
      const outside: number = turns.reduce(
        (distance: number, turn: (typeof turns)[number]): number =>
          distance + turn.outer * Math.min(1, Math.max(0, (state.distance - turn.from) / turn.span)),
        0,
      );
      return {
        archetype: chair.articulate({
          leftSpin: spin(state.progress - outside),
          rightSpin: spin(state.progress + outside),
        }),
        placement: state.placement,
      };
    },
  );
}
