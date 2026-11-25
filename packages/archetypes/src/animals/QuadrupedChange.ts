import { AutoMovieGravity } from "@automovie/engine";

import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import type { createQuadruped } from "./createQuadruped";

/**
 * Where a quadruped changes gait with its speed: each gait is changed into from
 * the one below at a change point its species' `Rule` gives, worked from the
 * animal's own dimensions, and past each point by the species' gap that keeps
 * the gait from flickering.
 */
export namespace QuadrupedChange {
  /**
   * How a gait is changed into from the one below: froude on hip height, mass
   * through a measured scaling law, overlap at the middle of common measured
   * ranges, or speed at an inclusive declared reference-height boundary. A
   * declared speed may be authored; its producer must distinguish that from a
   * measured biological transition. Froude, mass and overlap keep their
   * existing strict upward policy.
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
   * @param dimensions The animal's dimensions: its withers height and mass are
   *   read.
   * @param hip The animal's hip joint's height above the ground at rest,
   *   metres, the leg's length a Froude number is taken on.
   * @returns The change point, metres per second.
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
   * The gait a speed calls for: up at a declared speed boundary plus
   * hysteresis, strictly past other rule boundaries, and down strictly below a
   * boundary minus hysteresis. With zero hysteresis the exact speed boundary
   * belongs to the faster gait independently of the starting gait.
   *
   * @param species The species.
   * @param speed The speed, metres per second.
   * @param from The gait the animal is in.
   * @param dimensions The animal's dimensions.
   * @param hip The animal's hip joint's height at rest, metres.
   * @returns The gait.
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
