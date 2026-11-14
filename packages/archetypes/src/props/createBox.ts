import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  ArchetypeRefusal,
  type IArchetypeBand,
} from "../core";

/** Moving carton sizes from a supplier's guide seen in search results. */
const CARTON: string =
  "U-Haul moving cartons, small 16-3/8 x 12-5/8 x 12-5/8 in to large 18 x 18 x 24 in, packing guide seen only in search results";

/**
 * A cardboard box carried in two hands.
 *
 * The box stands on the floor at the origin, its width along `+X`. A hand takes each side at half height, so the two grips are the box's width apart; its top is a face another box rests on.
 *
 * @param params The load and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The box.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or a load above 25 kg.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the box stands and where it is held.
 * @evidence contracts/development/implementation.md#principled-implementation One dimensioned box; the load adds to the carton's own mass and is bounded by the 25 kg HSE gives for a man's lift close to the body between knuckle and elbow height (INDG143, Figure 1, https://www.hse.gov.uk/pubns/indg143.pdf), the most a lifting act should be asked to carry.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit the load, draw the dimensions, one part and its four contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The load sits at the box's centre: an uneven load is the author's to state on the model's body.
 * @evidence contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createBox(
  params: createBox.IParams = {},
  seed?: number | string,
): Archetype<createBox.Affordance, createBox.Dimension> {
  const load: number = params.load ?? 0;
  if (!(load >= 0 && load <= createBox.LOAD))
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype: "box",
      axis: "load",
      value: load,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: createBox.LOAD,
        unit: "kg",
      },
      reason: `${load} kg is more than a person lifts close to the body`,
      fix: "give a load of at most 25 kg, or split it over several boxes",
    });
  const d: Record<createBox.Dimension, number> =
    ArchetypeDraw.dimensions<createBox.Dimension>(
      "box",
      createBox.BANDS,
      seed,
      params,
    );
  const width: number = d.width;
  const height: number = d.height;
  const depth: number = d.depth;
  const builder: ArchetypeBuilder<createBox.Affordance, createBox.Dimension> =
    new ArchetypeBuilder({
      archetype: "box",
      id: params.id,
      name: "cardboard box",
      dimensions: d,
    });
  builder.box(
    "box",
    Vector3.create(width, height, depth),
    Vector3.create(0, height / 2, 0),
    { color: "#b98d5b" },
  );
  for (const [id, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "none",
      frame: ArchetypeFrame.facing(
        Vector3.create((sign * width) / 2, height / 2, 0),
        Vector3.create(sign, 0, 0),
        Vector3.create(0, 0, 1),
      ),
      extent: null,
      grip: "two-hand",
      length: depth,
    });
  builder.affordance({
    id: "top",
    kind: "stack-top",
    frame: ArchetypeFrame.upright(Vector3.create(0, height, 0)),
    extent: [
      Vector3.create(-width / 2, 0, -depth / 2),
      Vector3.create(width / 2, 0, -depth / 2),
      Vector3.create(width / 2, 0, depth / 2),
      Vector3.create(-width / 2, 0, depth / 2),
    ],
  });
  builder.affordance({
    id: "front",
    kind: "surface",
    frame: ArchetypeFrame.facing(
      Vector3.create(0, height / 2, depth / 2),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    width,
    depth: height,
  });
  return builder.build(d.mass + load);
}

/**
 * Companion types and bands of {@link createBox}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension, in metres and kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The size the arms span, the mass the body balances (#3369) and the face a push meets (#3351).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The load limit is a named constant with its source, not a number inside the check.
 */
export namespace createBox {
  /** The greatest load, kilograms: HSE INDG143 Figure 1, a man's lift close to the body between knuckle and elbow height (https://www.hse.gov.uk/pubns/indg143.pdf). */
  export const LOAD: number = 25;

  /**
   * The affordance ids:
   *
   * - `left`, `right`: the side faces at half height, on `+X` and `-X`, where the two hands hold the box.
   * - `top`: the upper face, on which another object rests.
   * - `front`: the `+Z` face, pushed or leaned on.
   */
  export type Affordance = "left" | "right" | "top" | "front";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `height`, `depth`: along `+X`, `+Y` and `+Z`.
   * - `mass`: the empty carton, kilograms.
   */
  export type Dimension = "width" | "height" | "depth" | "mass";

  /** The parameters: the load, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `box` when absent. */
    id?: string;

    /** The mass of what the box holds, kilograms, at most 25; empty when absent. */
    load?: number;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    width: ArchetypeBand.of("m", 0.416, 0.46, CARTON, true),
    height: ArchetypeBand.of("m", 0.321, 0.61, CARTON, true),
    depth: ArchetypeBand.of("m", 0.321, 0.457, CARTON, true),
    mass: ArchetypeBand.of("kg", 0.4, 0.9, ArchetypeBand.TYPICAL_MASS, true),
  };
}
