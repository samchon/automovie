import { Vector3 } from "@automovie/engine";

import { AutoMovieArchetype, AutoMovieArchetypeBand, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame, type IAutoMovieArchetypeBand } from "../core/index";
import * as AutoMovieArchetypeHatchData from "./internal/AutoMovieArchetypeHatchData";

/** Constructs the hatch archetype from its recipe. */
export namespace AutoMovieArchetypeHatch {
/**
 * A ladder access roof hatch: a curb round an opening in the roof, under a
 * cover hinged on its far side from the ladder.
 *
 * The roof deck is the `XZ` plane, the opening centred on the origin, its
 * length along `X` and its width along `Z`, the ladder rising at its `+Z` side
 * and the hinge along its `-Z` side. The curb's four walls stand on the deck
 * round the opening; the cover lies on them. `hinge` is the cover's hinge, a
 * positive travel lifting the cover's `+Z` edge to the maker's 70 degrees;
 * `push` is the cover's underside, where a climber's hand pushes it open,
 * riding the hinge; `opening` is the clear opening over the curb, passed
 * through upward, its frame on the ladder's edge with its height running across
 * the opening to the hinge.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The hatch.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeHatch.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeHatch.Affordance, AutoMovieArchetypeHatch.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeHatch.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeHatch.Dimension>(
      "hatch",
      AutoMovieArchetypeHatch.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeHatch.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeHatch.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeHatch.Affordance,
    AutoMovieArchetypeHatch.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: "roof hatch",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const { width, length, curb, wall, cover } = AutoMovieArchetypeHatchData.HATCH;
  const red: string = "#8c3b22";
  const outerX: number = length + 2 * wall;
  for (const [id, z] of [
    ["curb-ladder", width / 2 + wall / 2],
    ["curb-hinge", -(width / 2 + wall / 2)],
  ] as const)
    builder.box(id, v(outerX, curb, wall), v(0, curb / 2, z), { color: red });
  for (const [id, x] of [
    ["curb-left", length / 2 + wall / 2],
    ["curb-right", -(length / 2 + wall / 2)],
  ] as const)
    builder.box(id, v(wall, curb, width), v(x, curb / 2, 0), { color: red });
  builder.box(
    "cover",
    v(outerX, cover, width + 2 * wall),
    v(0, curb + cover / 2, 0),
    { color: red },
  );
  builder.affordance({
    id: "hinge",
    kind: "hinge",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, curb, -(width / 2 + wall)),
      v(-1, 0, 0),
      v(0, 0, 1),
    ),
    extent: null,
    travel: AutoMovieArchetypeHatchData.HATCH.swing,
    parts: ["cover"],
  });
  builder.affordance({
    id: "push",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, curb, 0),
      v(0, -1, 0),
      v(1, 0, 0),
    ),
    extent: null,
    width: length,
    depth: width,
    rides: "hinge",
  });
  builder.affordance({
    id: "opening",
    kind: "aperture",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, curb, width / 2),
      v(0, 0, -1),
      v(1, 0, 0),
    ),
    extent: null,
    width: length,
    height: width,
  });
  return builder.build(d.mass);
}

  /**
   * The affordance ids:
   *
   * - `hinge`: the cover's hinge along the `-Z` side; its travel lifts the
   *   cover's `+Z` edge.
   * - `push`: the cover's underside over the opening, facing down, riding the
   *   hinge.
   * - `opening`: the clear opening over the curb, passed through along `+Y`.
   */
  export type Affordance = "hinge" | "push" | "opening";

  /** The free dimension: `mass`, kilograms. */
  export type Dimension = "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `hatch` when absent. */
    id?: string;
  }

  /**
   * The band of each free dimension: the aluminium hatch's mass to the steel
   * one's.
   */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    mass: AutoMovieArchetypeBand.of("kg", 50, 83, AutoMovieArchetypeHatchData.BILCO),
  };
}
