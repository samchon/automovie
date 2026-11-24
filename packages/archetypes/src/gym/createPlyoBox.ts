import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";

/** What a plyometric box commonly measures. */
const BOX: string =
  "the common three-height plyometric box, 20 by 24 by 30 in, as gym equipment makers list it; no single maker's sheet was read, so the bands are marked provisional";

/**
 * A plyometric box: a closed wooden box stepped or jumped onto.
 *
 * It stands on the floor with the middle of its footprint at the origin.
 * `surface` is its top.
 *
 * The wooden box rests on its wooden base: wood on concrete
 * (`AutoMovieArchetypeFriction`).
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The box.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createPlyoBox(
  params: createPlyoBox.IParams,
  seed?: number | string,
): AutoMovieArchetype<createPlyoBox.Affordance, createPlyoBox.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createPlyoBox.Dimension> =
    new AutoMovieArchetypeDrawSession<createPlyoBox.Dimension>(
      "plyoBox",
      createPlyoBox.UNITS,
      seed,
      params,
    );
  const kind: createPlyoBox.Kind = ArchetypeDraw.choice(
    "plyoBox",
    "kind",
    params.kind ?? "wood",
    createPlyoBox.KINDS,
  );
  const d: Partial<Record<createPlyoBox.Dimension, number>> = draw.dimensions(
    createPlyoBox.BANDS[kind],
    createPlyoBox.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    createPlyoBox.Affordance,
    createPlyoBox.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "wood",
    id: params.id,
    name: "plyometric box",
    draw,
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
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, d.height!, 0)),
    extent: null,
    width: d.width!,
    depth: d.depth!,
  });
  return builder.build(d.mass!, { rests: "wood" });
}

/** Companion types and bands of {@link createPlyoBox}. */
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

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    width: "m",
    depth: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which box; `wood` when absent. */
    kind?: Kind;

    /** The model's id, unique in a scene; `plyoBox` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    wood: {
      height: AutoMovieArchetypeBand.metres(
        20 * AutoMovieArchetypeUnits.INCH,
        30 * AutoMovieArchetypeUnits.INCH,
        BOX,
        true,
      ),
      width: AutoMovieArchetypeBand.metres(
        20 * AutoMovieArchetypeUnits.INCH,
        30 * AutoMovieArchetypeUnits.INCH,
        BOX,
        true,
      ),
      depth: AutoMovieArchetypeBand.metres(
        20 * AutoMovieArchetypeUnits.INCH,
        30 * AutoMovieArchetypeUnits.INCH,
        BOX,
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        15,
        25,
        "an estimate of a plywood box of that size; no maker's sheet was read",
        true,
      ),
    },
  };
}
