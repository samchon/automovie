import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** The maker's pram, read. */
const BUGABOO: string =
  "Bugaboo Fox 5: 36.6 x 23.6 x 41.3 in open, 22.9 to 27.8 lb by configuration, 8.5 in front and 12 in rear wheels (https://www.modernnursery.com/collections/all/products/bugaboo-fox-5-stroller, https://www.bugaboo.com/fr-en/refurbished/refurbished-parts/refurbished-bugaboo-fox-5-base-graphitegrey-melange-PP100052022.html, https://snugglebugz.ca/learning_centre/bugaboo-fox-5-stroller-review)";

/** Constructs the pram archetype from its recipe. */
export namespace AutoMovieArchetypePram {
/**
 * A pram (a baby carriage): a bassinet on a four-wheeled chassis, pushed by a
 * bar at its back.
 *
 * It stands on the floor with its front toward `+Z` and the person pushing it
 * behind at `-Z`, as `createCart`'s trolley does. `handle` is the push bar
 * across its back, taken from above along `+X`; `bassinet` the bassinet's
 * floor, where a baby lies.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The pram.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypePram.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypePram.Affordance, AutoMovieArchetypePram.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypePram.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypePram.Dimension>(
      "pram",
      AutoMovieArchetypePram.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypePram.Dimension, number> = draw.dimensions(
    AutoMovieArchetypePram.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypePram.Affordance,
    AutoMovieArchetypePram.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "pram",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const wheel: number = AutoMovieArchetypePram.WHEEL.rear;
  const hx: number = d.width / 2;
  const hz: number = (d.length - AutoMovieArchetypePram.REACH) / 2;
  for (const [id, x, z, radius] of [
    ["frontLeftWheel", hx, hz, AutoMovieArchetypePram.WHEEL.front],
    ["frontRightWheel", -hx, hz, AutoMovieArchetypePram.WHEEL.front],
    ["backLeftWheel", hx, -hz, AutoMovieArchetypePram.WHEEL.rear],
    ["backRightWheel", -hx, -hz, AutoMovieArchetypePram.WHEEL.rear],
  ] as const)
    builder.rod(id, radius, v(x - 0.015, radius, z), v(x + 0.015, radius, z), {
      color: "#1d1f22",
    });
  const floor: number = 2 * wheel + AutoMovieArchetypePram.CLEARANCE;
  const deep: number = AutoMovieArchetypePram.DEPTH;
  builder.box(
    "bassinet",
    v(d.width - 0.06, deep, 2 * hz),
    v(0, floor + deep / 2, 0),
    {
      color: "#3a4a6b",
    },
  );
  // The push rods from the bassinet's back up and back to the bar.
  const back: number = -hz - AutoMovieArchetypePram.REACH;
  const grip: number = AutoMovieArchetypePram.GRIP;
  for (const [id, x] of [
    ["leftPushRod", hx - 0.05],
    ["rightPushRod", -hx + 0.05],
  ] as const)
    builder.rod(
      id,
      grip / 2,
      v(x, floor + deep, -hz),
      v(x, d.handleHeight, back),
      {
        color: "#8a8d91",
      },
    );
  builder.rod(
    "bar",
    grip / 2,
    v(-hx + 0.05, d.handleHeight, back),
    v(hx - 0.05, d.handleHeight, back),
    {
      color: "#2c2f33",
    },
  );
  builder.affordance({
    id: "handle",
    kind: "bar",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.upright(v(0, d.handleHeight, back)),
    extent: null,
    grip: "power",
    aperture: grip,
    length: d.width - 0.1,
  });
  builder.affordance({
    id: "bassinet",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, floor + AutoMovieArchetypePram.FLOOR, 0)),
    extent: null,
    width: d.width - 0.1,
    depth: 2 * hz - 0.04,
  });
  return builder.build(d.mass);
}

  /**
   * The wheels' radii, metres: the Bugaboo Fox 5's 8.5 in front and 12 in rear
   * wheels.
   */
  export const WHEEL: Readonly<{ front: number; rear: number }> = {
    front: (8.5 * AutoMovieArchetypeUnits.INCH) / 2,
    rear: (12 * AutoMovieArchetypeUnits.INCH) / 2,
  };

  /** The bassinet's underside above the wheels' tops, metres: an estimate. */
  export const CLEARANCE: number = 0.15;

  /** The bassinet's depth, metres: an estimate. */
  export const DEPTH: number = 0.25;

  /** The bassinet's floor above its underside, metres: an estimate. */
  export const FLOOR: number = 0.03;

  /** The push bar behind the bassinet's back, metres: an estimate. */
  export const REACH: number = 0.3;

  /** The push bar's and rods' diameter, metres: an estimate. */
  export const GRIP: number = 0.03;

  /**
   * The affordance ids:
   *
   * - `handle`: the push bar across the back, taken from above along `+X`.
   * - `bassinet`: the bassinet's floor, facing up.
   */
  export type Affordance = "handle" | "bassinet";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: from the push bar to the front wheels, the whole pram.
   * - `width`: the chassis', wheel to wheel.
   * - `handleHeight`: the push bar's axis above the floor.
   * - `mass`: kilograms.
   */
  export type Dimension = "length" | "width" | "handleHeight" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    width: "m",
    handleHeight: "m",
    mass: "kg",
  };

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `pram` when absent. */
    id?: string;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(
      36.6 * AutoMovieArchetypeUnits.INCH,
      36.6 * AutoMovieArchetypeUnits.INCH,
      BUGABOO,
    ),
    width: AutoMovieArchetypeBand.metres(
      23.6 * AutoMovieArchetypeUnits.INCH,
      23.6 * AutoMovieArchetypeUnits.INCH,
      BUGABOO,
    ),
    handleHeight: AutoMovieArchetypeBand.metres(
      41.3 * AutoMovieArchetypeUnits.INCH,
      41.3 * AutoMovieArchetypeUnits.INCH,
      `${BUGABOO}: its height open, the push bar's`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      22.9 * AutoMovieArchetypeUnits.POUND,
      27.8 * AutoMovieArchetypeUnits.POUND,
      BUGABOO,
    ),
  };
}
