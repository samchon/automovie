import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/**
 * A pell: the upright post a swordsman strikes in solo drill.
 *
 * The post stands on the ground at the origin. `target` is its `+Z` side, the face a drill's cuts and thrusts are aimed at, as wide as the post and as high; a site on it names a height, so a cut to the head and a cut to the leg are two sites of one contact. `top` is the post's upper end.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The pell.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States where the post stands, what the target is and how a height on it is named.
 * @evidence contracts/development/implementation.md#principled-implementation One wooden cylinder of the drawn height and thickness under the drawn mass.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, one part, two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The post is not set in the ground: a strike's reaction is the striking act's to stage, and the model carries the post's own mass only.
 * @evidence contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createPell(
  params: createPell.IParams = {},
  seed?: number | string,
): Archetype<createPell.Affordance, createPell.Dimension> {
  const d: Record<createPell.Dimension, number> = ArchetypeDraw.dimensions(
    "pell",
    createPell.BANDS,
    seed,
    params,
  );
  const builder: ArchetypeBuilder<createPell.Affordance, createPell.Dimension> =
    new ArchetypeBuilder({
      archetype: "pell",
      id: params.id,
      name: "pell",
      dimensions: d,
    });
  const v: typeof Vector3.create = Vector3.create;
  builder.rod("post", d.diameter / 2, v(0, 0, 0), v(0, d.height, 0), {
    color: "#a9825a",
  });
  builder.affordance({
    id: "target",
    kind: "surface",
    frame: ArchetypeFrame.facing(
      v(0, d.height / 2, d.diameter / 2),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width: d.diameter,
    depth: d.height,
  });
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, d.height, 0)),
    extent: null,
  });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createPell}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance and dimension states what it is; each band its source or that it is an estimate.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one band per dimension, in metres and kilograms.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The face a drill aims at and the post's size (#3202's pell as a strike target).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every band is provisional and says which reading it lacks.
 */
export namespace createPell {
  /**
   * The affordance ids:
   *
   * - `target`: the post's `+Z` side, facing the striker; its width is the post's thickness and its depth the post's height.
   * - `top`: the upper end, facing up.
   */
  export type Affordance = "target" | "top";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the post above the ground.
   * - `diameter`: the post's thickness.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "diameter" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `pell` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    height: ArchetypeBand.metres(
      1.83,
      1.83,
      "a post standing six feet above the ground, Vegetius, De Re Militari I.11, recalled and not read at a source",
      true,
    ),
    diameter: ArchetypeBand.metres(
      0.15,
      0.25,
      "a post about as thick as a man's trunk is wide, not read at a source",
      true,
    ),
    mass: ArchetypeBand.of(
      "kg",
      23,
      63,
      "an oak post of these sizes at about 700 kg per cubic metre, not read at a source",
      true,
    ),
  };
}
