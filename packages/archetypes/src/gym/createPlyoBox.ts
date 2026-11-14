import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** What a plyometric box commonly measures. */
const BOX: string =
  "the common three-height plyometric box, 20 by 24 by 30 in (0.508, 0.61 and 0.762 m), as gym equipment makers list it; no single maker's sheet was read, so the bands are marked provisional";

/**
 * A plyometric box: a closed wooden box stepped or jumped onto.
 *
 * It stands on the floor with the middle of its footprint at the origin.
 * `surface` is its top.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The box.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how it stands and the contact.
 * @evidence contracts/development/implementation.md#principled-implementation One box of the drawn height, width and depth, its top the contact.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, one box, one contact.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A solid box stands for the hollow one; its mass is the hollow box's, an estimate.
 * @evidence contracts/development/implementation.md#efficient-algorithms One shape.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createPlyoBox(
  params: createPlyoBox.IParams,
  seed?: number | string,
): Archetype<createPlyoBox.Affordance, createPlyoBox.Dimension> {
  const kind: createPlyoBox.Kind = ArchetypeDraw.choice(
    "plyoBox",
    "kind",
    params.kind ?? "wood",
    createPlyoBox.KINDS,
  );
  const d: Partial<Record<createPlyoBox.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "plyoBox",
      createPlyoBox.BANDS[kind],
      seed,
      params,
      createPlyoBox.BANDS,
    );
  const builder: ArchetypeBuilder<
    createPlyoBox.Affordance,
    createPlyoBox.Dimension
  > = new ArchetypeBuilder({
    archetype: "plyoBox",
    id: params.id,
    name: "plyometric box",
    dimensions: d,
  });
  builder.box(
    "box",
    Vector3.create(d.width!, d.height!, d.depth!),
    Vector3.create(0, d.height! / 2, 0),
    { color: "#c9a36b" },
  );
  builder.affordance({
    id: "surface",
    kind: "surface",
    frame: ArchetypeFrame.upright(Vector3.create(0, d.height!, 0)),
    extent: null,
    width: d.width!,
    depth: d.depth!,
  });
  return builder.build(d.mass!);
}

/**
 * Companion types and bands of {@link createPlyoBox}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is and how sure its source is.
 * @evidence contracts/development/design.md#principled-representation A closed union and one band per dimension, each marked provisional.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The top's height and size a step or a jump reads, and the one contact.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No balance point or inertia is declared.
 */
export namespace createPlyoBox {
  /** The kinds of box. */
  export type Kind = "wood";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["wood"];

  /** The affordance ids: `surface`, the top. */
  export type Affordance = "surface";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the top above the floor.
   * - `width`: along `X`.
   * - `depth`: along `Z`.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "width" | "depth" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which box; `wood` when absent. */
    kind?: Kind;

    /** The model's id, unique in a scene; `plyoBox` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = {
    wood: {
      height: ArchetypeBand.metres(0.508, 0.762, BOX, true),
      width: ArchetypeBand.metres(0.508, 0.762, BOX, true),
      depth: ArchetypeBand.metres(0.508, 0.762, BOX, true),
      mass: ArchetypeBand.of(
        "kg",
        15,
        25,
        "an estimate of a plywood box of that size; no maker's sheet was read",
        true,
      ),
    },
  };
}
