import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { AutoMovieArchetypeLecternData } from "./internal/AutoMovieArchetypeLecternData";

/**
 * Constructs a floor lectern with a sloped reading plane and lower-edge contact.
 */
export namespace AutoMovieArchetypeLectern {
/**
 * Build a wooden lectern centred at the floor origin.
 *
 * The speaker stands on the `+Z` side. The 23 by 15.75 inch reading
 * surface slopes 15 degrees down toward that side. The surface's rear
 * edge is 46 inches above the floor.
 *
 * @param params Optional object ID and finite fixed values in the bands.
 *   The ID defaults to `lectern`.
 * @param seed Numeric seed for omitted settings. Without it, the mass
 *   defaults to 22.5 kilograms.
 * @returns A lectern with a sloped `top` frame and a `front` ledge contact
 *   at the lower edge of the reading surface.
 * @throws {AutoMovieArchetypeRefusal} If a fixed dimension is outside its band.
 */
export function create(
  params: AutoMovieArchetypeLectern.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeLectern.Affordance, AutoMovieArchetypeLectern.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeLectern.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeLectern.Dimension>(
      "lectern",
      AutoMovieArchetypeLectern.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeLectern.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeLectern.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeLectern.Affordance,
    AutoMovieArchetypeLectern.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "wood",
    id: params.id,
    name: "lectern",
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
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
      rotation: AutoMovieEngineQuaternion.fromAxisAngle(v(1, 0, 0), d.slope),
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

  /**
   * Names `top` on the reading plane and `front` along its lower X edge. Both share the reading plane's upward normal.
   */
  export type Affordance = "top" | "front";

  /**
   * Surface width across X and depth along the slope, in metres. `height`
   * gives the rear edge above the floor. `slope` is in degrees and `mass`
   * is in kilograms.
   */
  export type Dimension = "width" | "depth" | "height" | "slope" | "mass";

  /**
   * Uses metres for geometry, degrees for the reading slope and kilograms for body mass.
   */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    depth: "m",
    height: "m",
    slope: "degrees",
    mass: "kg",
  };

  /**
   * Optional scene object ID and fixed values from the Safco lectern's applicable bands.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene object ID, defaulting to `lectern`. */
    id?: string;
  }

  /**
   * Fixed reading width, depth, rear height and slope, with a provisional empty mass interval.
   */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    width: AutoMovieArchetypeBand.metres(
      23 * AutoMovieArchetypeUnits.INCH,
      23 * AutoMovieArchetypeUnits.INCH,
      AutoMovieArchetypeLecternData.SAFCO,
    ),
    depth: AutoMovieArchetypeBand.metres(
      15.75 * AutoMovieArchetypeUnits.INCH,
      15.75 * AutoMovieArchetypeUnits.INCH,
      AutoMovieArchetypeLecternData.SAFCO,
    ),
    height: AutoMovieArchetypeBand.metres(
      46 * AutoMovieArchetypeUnits.INCH,
      46 * AutoMovieArchetypeUnits.INCH,
      AutoMovieArchetypeLecternData.SAFCO,
    ),
    slope: AutoMovieArchetypeBand.of("degrees", 15, 15, AutoMovieArchetypeLecternData.SAFCO),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      15,
      30,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}

/*
 * The construction sizes no source read gives, metres, each an estimate no act
 * reads and no band declares: `slab`, the reading surface's thickness.
 */
const ESTIMATES: Readonly<{ slab: number }> = { slab: 0.02 };
