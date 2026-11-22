import { AutoMovieGravity } from "@automovie/engine";

import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import type { createQuadruped } from "./createQuadruped";

/**
 * Where a quadruped changes gait with its speed: each gait is changed into from the one below at a change point its species' `Rule` gives, worked from the animal's own dimensions, and past each point by the species' gap that keeps the gait from flickering.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a change point is, where it comes from and the gap.
 * @evidence contracts/development/design.md#principled-representation A speed in metres per second per pair of neighbouring gaits, by one of four closed rules a species states with its source.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The change points `rideQuadruped` reads when the speed chooses the gait.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No species branch: a species states its rules as data, each with its source or as provisional.
 */
export namespace QuadrupedChange {
  /**
   * How a gait is changed into from the one below: froude on hip height, mass through a measured scaling law, overlap at the middle of common measured ranges, or speed at an inclusive declared reference-height boundary. A declared speed may be authored; its producer must distinguish that from a measured biological transition. Froude, mass and overlap keep their existing strict upward policy.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each rule and its members' units.
   * @evidence contracts/development/design.md#principled-representation A closed union of the change rules the sources give, with their own variables.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; a gait's `AutoMovieArchetypeQuadrupedGait.IGait.change`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Closed kinds, not free text.
   */
  export type Rule =
    | { kind: "froude"; froude: number }
    | { kind: "mass"; speed: number; mass: number; exponent: number }
    | { kind: "speed"; speed: number }
    | { kind: "overlap" };

  /**
   * The speed at which an animal changes between two neighbouring gaits.
   *
   * @param species The species.
   * @param low The slower gait.
   * @param high The faster gait, the next in the species' order.
   * @param dimensions The animal's dimensions: its withers height and mass are read.
   * @param hip The animal's hip joint's height above the ground at rest, metres, the leg's length a Froude number is taken on.
   * @returns The change point, metres per second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation By the declared rule: Froude scaling on hip height, a mass power law, a stated reference speed times the table's existing scale, or the midpoint of overlapping ranges. A producer labels authored speed thresholds instead of claiming measured transitions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per rule.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `AutoMovieArchetypeQuadrupedGait.range`; the hip's height is the caller's, read off the animal.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function point(
    species: createQuadruped.ISpecies,
    low: AutoMovieArchetypeQuadrupedGait.Gait,
    high: AutoMovieArchetypeQuadrupedGait.Gait,
    dimensions: Readonly<
      Partial<Record<AutoMovieArchetypeQuadrupedBody.Dimension, number>>
    >,
    hip: number,
  ): number {
    // Every gait but the slowest states how it is changed into.
    const rule: Rule = AutoMovieArchetypeQuadrupedGait.of(
      species,
      high,
    ).change!;
    if (rule.kind === "froude")
      return Math.sqrt(rule.froude * AutoMovieGravity.STANDARD * hip);
    if (rule.kind === "mass")
      return rule.speed * (dimensions.mass! / rule.mass) ** rule.exponent;
    if (rule.kind === "speed")
      return (
        rule.speed *
        AutoMovieArchetypeQuadrupedGait.scale(
          species,
          dimensions.withersHeight!,
        )
      );
    const a: { minimum: number; maximum: number } =
      AutoMovieArchetypeQuadrupedGait.range(
        species,
        low,
        dimensions.withersHeight!,
      );
    const b: { minimum: number; maximum: number } =
      AutoMovieArchetypeQuadrupedGait.range(
        species,
        high,
        dimensions.withersHeight!,
      );
    return (
      (Math.max(a.minimum, b.minimum) + Math.min(a.maximum, b.maximum)) / 2
    );
  }

  /**
   * The gait a speed calls for: up at a declared speed boundary plus hysteresis, strictly past other rule boundaries, and down strictly below a boundary minus hysteresis. With zero hysteresis the exact speed boundary belongs to the faster gait independently of the starting gait.
   *
   * @param species The species.
   * @param speed The speed, metres per second.
   * @param from The gait the animal is in.
   * @param dimensions The animal's dimensions.
   * @param hip The animal's hip joint's height at rest, metres.
   * @returns The gait.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule.
   * @evidence contracts/development/implementation.md#principled-implementation A declared speed rule includes its upper-gait boundary, admitting the first authored speed exactly; other rules retain strict upward comparison. All downward comparisons remain strict, and the hysteresis gap scales with the table's existing rule.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two loops over the species' gaits.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most one step each way per gait.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `point`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function called(
    species: createQuadruped.ISpecies,
    speed: number,
    from: AutoMovieArchetypeQuadrupedGait.Gait,
    dimensions: Readonly<
      Partial<Record<AutoMovieArchetypeQuadrupedBody.Dimension, number>>
    >,
    hip: number,
  ): AutoMovieArchetypeQuadrupedGait.Gait {
    const order: readonly AutoMovieArchetypeQuadrupedGait.Gait[] =
      species.table.order;
    const gap: number =
      species.table.hysteresis *
      AutoMovieArchetypeQuadrupedGait.scale(species, dimensions.withersHeight!);
    let k: number = order.indexOf(from);
    while (k < order.length - 1) {
      const higher: AutoMovieArchetypeQuadrupedGait.Gait = order[k + 1]!;
      const boundary: number =
        point(species, order[k]!, higher, dimensions, hip) + gap;
      const inclusive: boolean =
        AutoMovieArchetypeQuadrupedGait.of(species, higher).change!.kind ===
        "speed";
      if (!(inclusive ? speed >= boundary : speed > boundary)) break;
      k++;
    }
    while (
      k > 0 &&
      speed < point(species, order[k - 1]!, order[k]!, dimensions, hip) - gap
    )
      k--;
    return order[k]!;
  }
}
