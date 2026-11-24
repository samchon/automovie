import { Quaternion, Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core";

/** The lectern read. */
const SAFCO: string =
  "Safco 8915 lectern specification sheet: 23 x 15 3/4 x 46 in high, the reading surface 23 in wide and 15 3/4 in deep sloping at 15 degrees (https://argo.webstaurantstore.com/documents/specsheets/328saf8915mh_specs.pdf)";

/**
 * The construction sizes no source read gives, metres, each an estimate no act
 * reads and no band declares: `slab`, the reading surface's thickness.
 */
const ESTIMATES: Readonly<{ slab: number }> = { slab: 0.02 };

/**
 * A floor lectern: a cabinet under a reading surface that slopes down toward
 * the speaker.
 *
 * The lectern stands on the floor at the origin, the speaker on its `+Z` side
 * facing `-Z`. Its reading surface's back edge is the maker's height and its
 * front edge lower by the surface's depth at the maker's slope. `top` is the
 * reading surface, its `+Y` the tilted normal; `front` its lower front edge, a
 * ledge the hands rest on and a book stops against.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The lectern.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createLectern(
  params: createLectern.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createLectern.Affordance, createLectern.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createLectern.Dimension> =
    new AutoMovieArchetypeDrawSession<createLectern.Dimension>(
      "lectern",
      createLectern.UNITS,
      seed,
      params,
    );
  const d: Record<createLectern.Dimension, number> = draw.dimensions(
    createLectern.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    createLectern.Affordance,
    createLectern.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "wood",
    id: params.id,
    name: "lectern",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const slope: number = d.slope * AutoMovieArchetypeUnits.DEGREE;
  const run: number = d.depth * Math.cos(slope);
  const front: number = d.height - d.depth * Math.sin(slope);
  builder.box("cabinet", v(d.width, front, run), v(0, front / 2, 0), {
    color: "#6b4a2f",
  });
  // The surface's middle, its slab hung below the surface's plane.
  const middle: { y: number; z: number } = {
    y: (d.height + front) / 2 - (ESTIMATES.slab / 2) * Math.cos(slope),
    z: -(ESTIMATES.slab / 2) * Math.sin(slope),
  };
  builder.box(
    "surface",
    v(d.width, ESTIMATES.slab, d.depth),
    v(0, middle.y, middle.z),
    {
      color: "#7d5a3c",
      rotation: Quaternion.fromAxisAngle(v(1, 0, 0), d.slope),
    },
  );
  const normal: ReturnType<typeof v> = v(0, Math.cos(slope), Math.sin(slope));
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, (d.height + front) / 2, 0),
      normal,
      v(1, 0, 0),
    ),
    extent: null,
    width: d.width,
    depth: d.depth,
  });
  builder.affordance({
    id: "front",
    kind: "ledge",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, front, run / 2),
      normal,
      v(1, 0, 0),
    ),
    extent: null,
    length: d.width,
  });
  return builder.build(d.mass);
}

/** Companion types and bands of {@link createLectern}. */
export namespace createLectern {
  /**
   * The affordance ids:
   *
   * - `top`: the sloping reading surface.
   * - `front`: its lower front edge, a ledge along `X`.
   */
  export type Affordance = "top" | "front";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `depth`: the reading surface across and up its slope.
   * - `height`: the surface's back edge above the floor.
   * - `slope`: the surface's fall toward the speaker, degrees.
   * - `mass`: kilograms.
   */
  export type Dimension = "width" | "depth" | "height" | "slope" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    depth: "m",
    height: "m",
    slope: "degrees",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `lectern` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    width: AutoMovieArchetypeBand.metres(
      23 * AutoMovieArchetypeUnits.INCH,
      23 * AutoMovieArchetypeUnits.INCH,
      SAFCO,
    ),
    depth: AutoMovieArchetypeBand.metres(
      15.75 * AutoMovieArchetypeUnits.INCH,
      15.75 * AutoMovieArchetypeUnits.INCH,
      SAFCO,
    ),
    height: AutoMovieArchetypeBand.metres(
      46 * AutoMovieArchetypeUnits.INCH,
      46 * AutoMovieArchetypeUnits.INCH,
      SAFCO,
    ),
    slope: AutoMovieArchetypeBand.of("degrees", 15, 15, SAFCO),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      15,
      30,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}
