import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The rule that leaves the pole's size free. */
const RULE: string =
  "World Athletics Competition Rules, Book C2.1, Rule 28.8 (pole vault): the pole may be of any material or combination of materials and of any length or diameter, the basic surface smooth (https://worldathletics.org/about-iaaf/documents/book-of-rules)";

/** A maker's range of vaulting poles, read. */
const POLES: string =
  "UCS Spirit vaulting poles, from 7 ft 8 in (the 235 series) to 17 ft 1 in (the 520 series) (https://ucsspirit.com/products/ucs-spirit-vaulting-poles)";

/**
 * A vaulting pole: a long, smooth tube a vaulter runs with, plants in the box and swings on (#3529).
 *
 * The pole stands on its plant end at the origin, its length along `+Y`. `tip` is the plant end, its `+Y` pointing out of the end along the pole, so a planting act puts it on the floor or in the box. The two hands hold it in two bands near the top: `topGrip`, the upper hand's, and `lowerGrip`, the lower hand's below it, each a `handle` along the pole whose sites name a hand's place; `shaft` is the whole tube as one two-hand bar, for a carry or a pick-up anywhere along it.
 *
 * The pole is rigid here: its bend under the vaulter is the vaulting act's to model, and its stiffness is not drawn.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The pole.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band; every band fits both grips on the shortest pole, so no other refusal is needed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the pole stands, each contact and what is not modelled.
 * @evidence contracts/development/implementation.md#principled-implementation One rod of the drawn length and diameter; the grip bands are measured down from the top by the drawn hold and spacing, each a handle along the rod with the rod's diameter as its aperture.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, one rod, then the plant end, the two grips and the shaft.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The pole does not bend; the bend is the act's. The grip bands' places are a vaulter's habit, marked provisional.
 * @evidence contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createVaultingPole(
  params: createVaultingPole.IParams = {},
  seed?: number | string,
): Archetype<createVaultingPole.Affordance, createVaultingPole.Dimension> {
  const d: Record<createVaultingPole.Dimension, number> =
    ArchetypeDraw.dimensions(
      "vaultingPole",
      createVaultingPole.BANDS,
      seed,
      params,
    );
  const builder: ArchetypeBuilder<
    createVaultingPole.Affordance,
    createVaultingPole.Dimension
  > = new ArchetypeBuilder({
    archetype: "vaultingPole",
    id: params.id,
    name: "vaulting pole",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const length: number = d.length;
  const radius: number = d.diameter / 2;
  builder.rod("pole", radius, v(0, 0, 0), v(0, length, 0), {
    color: "#d8c23a",
  });

  // The plant end, facing out of the pole's bottom.
  builder.affordance({
    id: "tip",
    kind: "surface",
    direction: "along",
    frame: ArchetypeFrame.facing(v(0, 0, 0), v(0, -1, 0), v(1, 0, 0)),
    extent: null,
  });

  // The two hands' bands near the top, each a handle along the pole taken from -Z.
  const band = (
    id: "topGrip" | "lowerGrip" | "shaft",
    middle: number,
    run: number,
  ): void => {
    builder.affordance({
      id,
      kind: id === "shaft" ? "bar" : "handle",
      frame: ArchetypeFrame.facing(v(0, middle, 0), v(0, 0, -1), v(0, 1, 0)),
      extent: null,
      grip: id === "shaft" ? "two-hand" : "power",
      aperture: d.diameter,
      length: run,
    });
  };
  const top: number = length - d.hold;
  band("topGrip", top - createVaultingPole.HAND / 2, createVaultingPole.HAND);
  band(
    "lowerGrip",
    top - d.spacing - createVaultingPole.HAND / 2,
    createVaultingPole.HAND,
  );
  band("shaft", length / 2, length);
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createVaultingPole}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, dimension and constant states what it is and how sure its source is.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one band per dimension; the size is free under the rules, so the bands are the commercial range, marked provisional.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The plant end and the hands' bands a vault reads (#3529), and the length that sets the swing's radius.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No stiffness is declared: the pole is rigid in this model.
 */
export namespace createVaultingPole {
  /** A hand's breadth along the pole, metres: the run of one grip band. An estimate, not read at a source. */
  export const HAND: number = 0.1;

  /**
   * The affordance ids:
   *
   * - `tip`: the plant end at the bottom, facing down along the pole.
   * - `topGrip`: the upper hand's band near the top, taken from `-Z`.
   * - `lowerGrip`: the lower hand's band, `spacing` below the upper.
   * - `shaft`: the whole pole as one two-hand bar.
   */
  export type Affordance = "tip" | "topGrip" | "lowerGrip" | "shaft";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: from the plant end to the top.
   * - `diameter`: the tube's.
   * - `hold`: the upper hand's top edge below the pole's top.
   * - `spacing`: the lower hand below the upper.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "diameter" | "hold" | "spacing" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `vaultingPole` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    length: ArchetypeBand.metres(2.337, 5.207, `${RULE}; ${POLES}`),
    diameter: ArchetypeBand.metres(
      0.03,
      0.045,
      `${RULE}; an estimate of a fibreglass pole's outer diameter; the UCS Spirit pages read give no diameter`,
      true,
    ),
    hold: ArchetypeBand.metres(
      0.1,
      0.3,
      "the upper hand held a little below the top, a vaulter's habit; an estimate, not read at a source",
      true,
    ),
    spacing: ArchetypeBand.metres(
      0.45,
      0.65,
      "the hands about shoulder width apart along the pole, a vaulter's habit; an estimate, not read at a source",
      true,
    ),
    mass: ArchetypeBand.of(
      "kg",
      1.5,
      3,
      "an estimate of a fibreglass pole of these lengths; the UCS Spirit pages read give no mass",
      true,
    ),
  };
}
