import { AutoMovieGravity } from "@automovie/engine";

import type { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedGait } from "./QuadrupedGait";
import type { createQuadruped } from "./createQuadruped";

/**
 * Where a quadruped changes gait with its speed: each gait is changed into from the one below at a change point its species' `Rule` gives, worked from the animal's own dimensions, and past each point by the species' gap that keeps the gait from flickering.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a change point is, where it comes from and the gap.
 * @evidence contracts/development/design.md#principled-representation A speed in metres per second per pair of neighbouring gaits, by one of three rules a species states with its source.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The change points `rideQuadruped` reads when the speed chooses the gait.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No species branch: a species states its rules as data, each with its source or as provisional.
 */
export namespace QuadrupedChange {
  /**
   * How a gait is changed into from the one below: froude on hip height, mass through a measured scaling law, overlap at the middle of common measured ranges, or speed at a declared reference-height speed. A declared speed may be an authored table boundary; its producer must distinguish that from a measured biological transition.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each rule and its members' units.
   * @evidence contracts/development/design.md#principled-representation A closed union of the change rules the sources give, with their own variables.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; a gait's `QuadrupedGait.IGait.change`.
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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `QuadrupedGait.range`; the hip's height is the caller's, read off the animal.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function point(
    species: createQuadruped.ISpecies,
    low: QuadrupedGait.Gait,
    high: QuadrupedGait.Gait,
    dimensions: Readonly<Partial<Record<QuadrupedBody.Dimension, number>>>,
    hip: number,
  ): number {
    // Every gait but the slowest states how it is changed into.
    const rule: Rule = QuadrupedGait.of(species, high).change!;
    if (rule.kind === "froude")
      return Math.sqrt(rule.froude * AutoMovieGravity.STANDARD * hip);
    if (rule.kind === "mass")
      return rule.speed * (dimensions.mass! / rule.mass) ** rule.exponent;
    if (rule.kind === "speed")
      return rule.speed * QuadrupedGait.scale(species, dimensions.withersHeight!);
    const a: { minimum: number; maximum: number } = QuadrupedGait.range(
      species,
      low,
      dimensions.withersHeight!,
    );
    const b: { minimum: number; maximum: number } = QuadrupedGait.range(
      species,
      high,
      dimensions.withersHeight!,
    );
    return (
      (Math.max(a.minimum, b.minimum) + Math.min(a.maximum, b.maximum)) / 2
    );
  }

  /**
   * The gait a speed calls for, from the gait the animal is in: up past each change point above it by the species' hysteresis, down below it by as much.
   *
   * @param species The species.
   * @param speed The speed, metres per second.
   * @param from The gait the animal is in.
   * @param dimensions The animal's dimensions.
   * @param hip The animal's hip joint's height at rest, metres.
   * @returns The gait.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the rule.
   * @evidence contracts/development/implementation.md#principled-implementation Step up through the species' gaits while the speed passes the next change point by the gap, then down while it falls short of the one below by the gap; the gap scales with the gait's speeds by `QuadrupedGait.scale`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two loops over the species' gaits.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to special-case.
   * @evidence contracts/development/implementation.md#efficient-algorithms At most one step each way per gait.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `point`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function called(
    species: createQuadruped.ISpecies,
    speed: number,
    from: QuadrupedGait.Gait,
    dimensions: Readonly<Partial<Record<QuadrupedBody.Dimension, number>>>,
    hip: number,
  ): QuadrupedGait.Gait {
    const order: readonly QuadrupedGait.Gait[] = species.table.order;
    const gap: number =
      species.table.hysteresis *
      QuadrupedGait.scale(species, dimensions.withersHeight!);
    let k: number = order.indexOf(from);
    while (
      k < order.length - 1 &&
      speed > point(species, order[k]!, order[k + 1]!, dimensions, hip) + gap
    )
      k++;
    while (
      k > 0 &&
      speed < point(species, order[k - 1]!, order[k]!, dimensions, hip) - gap
    )
      k--;
    return order[k]!;
  }
}
