import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** The maker's torch, read. */
const MAGLITE: string =
  "Maglite 2-Cell D LED: 10 in (254 mm) long, a 1 9/16 in (39.67 mm) barrel, a 2.25 in (57 mm) head, 23 oz (674 g) with batteries (https://maglite.com/pages/specifications-maglite-2-cell-d-led-flashlight), the 23 oz given as 652 g by a retailer (https://www.adorama.com/mlst2d015.html)";

/**
 * A handheld electric torch (a flashlight): a barrel with a wider head and a switch on the barrel.
 *
 * It stands on its tail at the origin, its head up along `+Y`. `grip` is the barrel a hand closes on, taken from `-Z`; `lens` the head's front, its `+Y` along the beam, the working point an aim carries; `switch` the push button on the barrel's `+Z` side under the thumb, pressed along its `-Y`.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The torch.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the torch stands and its three contacts.
 * @evidence contracts/development/implementation.md#principled-implementation A barrel rod of the drawn length and diameter and a head rod of the maker's head diameter at its top, the switch a point on the barrel's side below the head.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, two parts, three contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The switch is a contact on the barrel, not a part; the head's size and the switch's travel are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Two parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createTorch(
  params: createTorch.IParams = {},
  seed?: number | string,
): Archetype<createTorch.Affordance, createTorch.Dimension> {
  const d: Record<createTorch.Dimension, number> = ArchetypeDraw.dimensions(
    "torch",
    createTorch.BANDS,
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createTorch.Affordance,
    createTorch.Dimension
  > = new ArchetypeBuilder({
    archetype: "torch",
    id: params.id,
    name: "torch",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const head: number = createTorch.HEAD;
  const barrel: number = d.length - head;
  const r: number = d.diameter / 2;
  builder.rod("barrel", r, v(0, 0, 0), v(0, barrel, 0), { color: "#2c2f33" });
  builder.rod("head", createTorch.HEAD_DIAMETER / 2, v(0, barrel, 0), v(0, d.length, 0), {
    color: "#3a3d42",
  });
  builder.affordance({
    id: "grip",
    kind: "handle",
    frame: ArchetypeFrame.facing(v(0, barrel / 2, 0), v(0, 0, -1), v(0, 1, 0)),
    extent: null,
    grip: "power",
    aperture: d.diameter,
    length: barrel,
  });
  builder.affordance({
    id: "lens",
    kind: "surface",
    direction: "along",
    frame: ArchetypeFrame.facing(v(0, d.length, 0), v(0, 1, 0), v(1, 0, 0)),
    extent: null,
  });
  builder.affordance({
    id: "switch",
    kind: "button",
    frame: ArchetypeFrame.facing(
      v(0, barrel - 0.02, r),
      v(0, 0, 1),
      v(0, 1, 0),
    ),
    extent: null,
    travel: createTorch.PRESS,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createTorch}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation One band per dimension a maker varies.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The barrel a hand takes, the lens an aim reads and the switch a thumb presses.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The length, the barrel's diameter and the mass are the maker's as read; the head's length and the switch's travel are named estimates.
 */
export namespace createTorch {
  /** The head's diameter, metres: the Maglite 2-Cell D's 57 mm. */
  export const HEAD_DIAMETER: number = 0.057;

  /** The head's length, metres: an estimate; the maker's page read does not give it. */
  export const HEAD: number = 0.04;

  /** The switch's press, metres: an estimate. */
  export const PRESS: number = 0.002;

  /**
   * The affordance ids:
   *
   * - `grip`: the barrel, taken from `-Z`.
   * - `lens`: the head's front, `+Y` along the beam.
   * - `switch`: the push button on the barrel's `+Z` side.
   */
  export type Affordance = "grip" | "lens" | "switch";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: tail to lens.
   * - `diameter`: the barrel's.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "diameter" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `torch` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    length: ArchetypeBand.metres(0.254, 0.254, MAGLITE),
    diameter: ArchetypeBand.metres(0.03967, 0.03967, MAGLITE),
    mass: ArchetypeBand.of("kg", 0.652, 0.674, MAGLITE),
  };
}
