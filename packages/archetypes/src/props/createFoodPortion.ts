import { Vector3 } from "@automovie/engine";

import {
  type Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeDrawSession,
  ArchetypeFrame,
} from "../core";

/**
 * Each portion's size, metres and kilograms. No source is read: every
 * figure is a provisional construction estimate of a plated portion, a
 * bite-sized piece cut from it, and a morsel taken with chopsticks.
 */
const SIZES: Readonly<Record<createFoodPortion.Kind, createFoodPortion.ISize>> =
  {
    steak: { width: 0.12, height: 0.02, depth: 0.08, mass: 0.2 },
    piece: { width: 0.025, height: 0.02, depth: 0.025, mass: 0.012 },
    morsel: { width: 0.025, height: 0.02, depth: 0.025, mass: 0.01 },
  };

/**
 * A plated portion of food: a steak cut at the table, a bite-sized piece
 * of it, or a morsel taken with chopsticks or a serving spoon.
 *
 * The portion is a slab standing on its underside at the origin, its
 * width along `X`. `top` is its upper face, the surface a knife saws and a
 * fork's tines pin, facing `+Y`; `base` is the underside, the socket set on
 * a plate; `pick` is the centre of its upper face, where a fork's tines or
 * chopstick tips take it.
 *
 * @param params The kind and the optional scene id.
 * @returns The portion and its contacts, metres.
 * @throws {ArchetypeRefusal} For a kind outside the set.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the kinds, the frame and each contact.
 * @evidence contracts/development/implementation.md#principled-implementation One slab with its upper face, its underside and its pick point.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Check the kind, record the dimensions, lay the slab, then the contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A portion is a rigid slab; a cut does not reshape it, the piece being its own portion. Every size is a named provisional estimate.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One part and three contacts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Keeps no inputs.
 */
export function createFoodPortion(
  params: createFoodPortion.IParams,
): Archetype<createFoodPortion.Affordance, createFoodPortion.Dimension> {
  const kind: createFoodPortion.Kind = ArchetypeDraw.choice(
    "foodPortion",
    "kind",
    params.kind,
    createFoodPortion.KINDS,
  );
  const size: createFoodPortion.ISize = SIZES[kind];
  const v: typeof Vector3.create = Vector3.create;
  const draw: ArchetypeDrawSession<createFoodPortion.Dimension> =
    new ArchetypeDrawSession(
      "foodPortion",
      { width: "m", height: "m", mass: "kg" },
      undefined,
    );
  draw.derive("width", size.width);
  draw.derive("height", size.height);
  draw.derive("mass", size.mass);
  const builder: ArchetypeBuilder<
    createFoodPortion.Affordance,
    createFoodPortion.Dimension
  > = new ArchetypeBuilder({
    id: params.id ?? kind,
    name: kind,
    material: "foam",
    draw,
  });
  builder.box(
    "portion",
    v(size.width, size.height, size.depth),
    v(0, size.height / 2, 0),
    { color: kind === "morsel" ? "#e8d9b0" : "#7a3b2a" },
  );
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, size.height, 0)),
    extent: null,
    width: size.width,
    depth: size.depth,
  });
  builder.affordance({
    id: "base",
    kind: "socket",
    frame: ArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
  });
  builder.affordance({
    id: "pick",
    kind: "socket",
    frame: ArchetypeFrame.upright(v(0, size.height, 0)),
    extent: null,
  });
  return builder.build(size.mass);
}

/**
 * The inputs, contacts and sizes of {@link createFoodPortion}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the kinds, the contacts, the dimensions and the size.
 * @evidence contracts/development/design.md#principled-representation A closed kind union; metres and kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The face, the base and the pick point an act reads.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The kind fixes the size.
 */
export namespace createFoodPortion {
  /** A steak, a piece cut from it, or a morsel. */
  export type Kind = "steak" | "piece" | "morsel";

  /** Every kind. */
  export const KINDS: readonly Kind[] = ["steak", "piece", "morsel"];

  /** The upper face, the underside and the pick point. */
  export type Affordance = "top" | "base" | "pick";

  /** The width, the height and the mass. */
  export type Dimension = "width" | "height" | "mass";

  /** The kind and the scene id. */
  export interface IParams {
    /** Which portion. */
    kind: Kind;

    /** The model's id, unique in a scene; the kind when absent. */
    id?: string;
  }

  /** A portion's size, metres and kilograms. */
  export interface ISize {
    /** Along `X`. */
    width: number;

    /** Along `Y`. */
    height: number;

    /** Along `Z`. */
    depth: number;

    /** The mass. */
    mass: number;
  }
}
