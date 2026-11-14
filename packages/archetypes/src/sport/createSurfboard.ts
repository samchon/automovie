import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** Metres in an inch. */
const INCH: number = 0.0254;

/** The surfboards read. */
const LOST: string =
  "Lost Driver 2.0 size chart: 5'10 x 18.75 x 2.36 in, 6'0 x 19.18 x 2.40 in, 6'2 x 19.50 x 2.50 in (https://lostsurfboards.com/surfboards/driver/)";

/** One board read: its length, width and thickness, metres. */
interface IModel {
  length: number;
  width: number;
  thickness: number;
}

/** The smallest and largest boards read. */
const MODELS: readonly [IModel, IModel] = [
  { length: 70 * INCH, width: 18.75 * INCH, thickness: 2.36 * INCH },
  { length: 74 * INCH, width: 19.5 * INCH, thickness: 2.5 * INCH },
];

/**
 * A shortboard lying flat on the ground, its length along `Z` and its nose toward `-Z`.
 *
 * Its size lies between the smallest and largest of the maker's boards read, by the drawn `size`, so every draw is one coherent board. `deck` is its top, the surface the feet stand on and the chest lies on; `rail` its `+X` edge at its middle and half its thickness, where a hand carries it under the arm. Riding it is balance on a moving support, which no motion law covers yet (#3468 N11), so it is built for static use and carrying.
 *
 * No source read names what it rests on, so its body's friction is the builder's 0.5 placeholder (`ArchetypeFriction`).
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The board.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the board lies, how its size is drawn, its contacts and its static use with the missing law.
 * @evidence contracts/development/implementation.md#principled-implementation Length, width and thickness interpolated between the maker's two ends by one drawn share; the deck on top and the rail at the board's widest point.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the share, one part, two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The board is a box: no outline, rocker or fins.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One part.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createSurfboard(
  params: createSurfboard.IParams = {},
  seed?: number | string,
): Archetype<createSurfboard.Affordance, createSurfboard.Dimension> {
  const d: Record<createSurfboard.Dimension, number> = ArchetypeDraw.dimensions(
    "surfboard",
    createSurfboard.BANDS,
    seed,
    params,
  );
  const [small, large]: readonly [IModel, IModel] = MODELS;
  const at = (key: keyof IModel): number =>
    small[key] + (large[key] - small[key]) * d.size;
  const builder: ArchetypeBuilder<
    createSurfboard.Affordance,
    createSurfboard.Dimension
  > = new ArchetypeBuilder({
    archetype: "surfboard",
    id: params.id,
    name: "surfboard",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const length: number = at("length");
  const width: number = at("width");
  const thickness: number = at("thickness");
  builder.box("board", v(width, thickness, length), v(0, thickness / 2, 0), {
    color: "#f4f1e8",
    density: 0.15,
  });
  builder.affordance({
    id: "deck",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, thickness, 0)),
    extent: null,
    width,
    depth: length,
  });
  builder.affordance({
    id: "rail",
    kind: "handle",
    symmetry: "none",
    frame: ArchetypeFrame.facing(
      v(width / 2, thickness / 2, 0),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
    grip: "power",
    aperture: thickness,
  });
  return builder.build(d.mass);
}

/**
 * Companion types and bands of {@link createSurfboard}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation One drawn share between two read boards, so the outline stays one board's.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The deck the body meets and the rail a hand carries it by (#3468 N11).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The mass, which the chart does not give, is provisional.
 */
export namespace createSurfboard {
  /**
   * The affordance ids:
   *
   * - `deck`: the top, the surface the feet and the chest meet.
   * - `rail`: the `+X` edge at the board's middle and half its thickness, a handle whose `+X` runs along the edge and whose aperture is the thickness.
   */
  export type Affordance = "deck" | "rail";

  /**
   * The free dimensions:
   *
   * - `size`: where the board lies between the two read, 0 the 5'10 and 1 the 6'2.
   * - `mass`: kilograms.
   */
  export type Dimension = "size" | "mass";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `surfboard` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IArchetypeBand>> = {
    size: ArchetypeBand.of("", 0, 1, LOST),
    mass: ArchetypeBand.of("kg", 2.5, 3.5, ArchetypeBand.TYPICAL_MASS, true),
  };
}
