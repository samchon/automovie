import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { AutoMovieArchetypeRampData } from "./internal/AutoMovieArchetypeRampData";

/** Creates a straight incline with a level top landing. */
export namespace AutoMovieArchetypeRamp {
/**
 * Creates a straight ramp that rises along `+Z` from nominal floor level.
 *
 * The `slope` contact spans the full staging plane to `top`, with its
 * normal inclined. The slab begins above the nominal toe to keep its
 * thickness above the floor.
 * `landing` covers the level platform beyond `top`.
 *
 * @param params Scene ID and any fixed rise, slope, width or total mass.
 * @param seed Draws omitted dimensions. Without a seed they take their band
 *   midpoints, giving a rise of 0.455 m and a slope of 1:15.
 * @returns The composite ramp, its support and its top landing.
 * @throws {AutoMovieArchetypeRefusal} If a fixed dimension is nonfinite or
 *   outside its band.
 */
export function create(
  params: AutoMovieArchetypeRamp.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeRamp.Affordance, AutoMovieArchetypeRamp.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeRamp.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeRamp.Dimension>(
      "ramp",
      AutoMovieArchetypeRamp.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeRamp.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeRamp.BANDS,
  );
  const run: number = d.rise / d.slope;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeRamp.Affordance,
    AutoMovieArchetypeRamp.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "ramp",
    draw,
  });

  // The incline: a thin slab whose upper face lies in the slope, which runs from the floor at z = 0 to the rise at z = run.
  const length: number = Math.hypot(run, d.rise);
  const normal: { y: number; z: number } = {
    y: run / length,
    z: -d.rise / length,
  };
  const middle: { y: number; z: number } = { y: d.rise / 2, z: run / 2 };

  // The slab's thickness is picture only. A slab of any thickness laid from the very foot would dip under the floor, so it starts where its lower edge meets the floor, a millimetre clear: the toe it leaves out is lower than the slab is thick.
  const slab: number = 0.01;
  const toe: number = slab / d.slope + 0.001;
  const centre: number = (toe + length) / 2;
  builder.box(
    "incline",
    AutoMovieEngineVector3.create(d.width, slab, length - toe),
    AutoMovieEngineVector3.create(
      0,
      (centre * d.rise) / length - (normal.y * slab) / 2,
      (centre * run) / length - (normal.z * slab) / 2,
    ),
    {
      color: "#b9b4a8",
      rotation: AutoMovieArchetypeFrame.facing(
        AutoMovieEngineVector3.create(0, 0, 0),
        AutoMovieEngineVector3.create(0, normal.y, normal.z),
        AutoMovieEngineVector3.create(1, 0, 0),
      ).rotation,
    },
  );

  // What carries the slab between its foot and the landing: a block under its upper half, whose front edge meets the slab's lower face at the middle of the incline.
  builder.box(
    "support",
    AutoMovieEngineVector3.create(d.width, d.rise / 2 - slab, run / 2),
    AutoMovieEngineVector3.create(0, d.rise / 4 - slab / 2, (run * 3) / 4),
    { color: "#b9b4a8" },
  );
  builder.box(
    "landing",
    AutoMovieEngineVector3.create(d.width, d.rise, AutoMovieArchetypeRamp.LANDING),
    AutoMovieEngineVector3.create(0, d.rise / 2, run + AutoMovieArchetypeRamp.LANDING / 2),
    { color: "#b9b4a8" },
  );
  builder.affordance({
    id: "slope",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(0, middle.y, middle.z),
      AutoMovieEngineVector3.create(0, normal.y, normal.z),
      AutoMovieEngineVector3.create(1, 0, 0),
    ),
    extent: null,
    width: d.width,
    depth: length,
  });
  builder.affordance({
    id: "top",
    kind: "ledge",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(0, d.rise, run),
      AutoMovieEngineVector3.create(0, 1, 0),
      AutoMovieEngineVector3.create(-1, 0, 0),
    ),
    extent: null,
    length: d.width,
  });
  builder.affordance({
    id: "landing",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(
      AutoMovieEngineVector3.create(0, d.rise, run + AutoMovieArchetypeRamp.LANDING / 2),
    ),
    extent: null,
    width: d.width,
    depth: AutoMovieArchetypeRamp.LANDING,
  });
  return builder.build(d.mass);
}

  /** Fixed depth of the top landing along `+Z`, 1.525 m. */
  export const LANDING: number = 1.525;

  /**
   * Names three contacts for staging travel up the ramp.
   *
   * `slope` is the full nominal inclined surface, `top` its uphill edge
   * facing `-Z`, and `landing` the level surface beyond that edge.
   */
  export type Affordance = "slope" | "top" | "landing";

  /**
   * Measurements of the flight and the full ramp body.
   *
   * `slope` is rise divided by horizontal run. `rise` is the landing height
   * in metres, `width` the width across the run in metres, and `mass` the
   * whole model's kilograms.
   */
  export type Dimension = "slope" | "rise" | "width" | "mass";

  /**
   * A ratio for `slope`, metres for `rise` and `width`, and kilograms for `mass`.
   */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    slope: "",
    rise: "m",
    width: "m",
    mass: "kg",
  };

  /**
   * Sets optional fixed ramp dimensions and the scene ID.
   *
   * Supply finite values in `BANDS`. Omitted values use the seed draw or band
   * midpoint. Landing depth comes from `LANDING`.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene-unique model ID. Defaults to `ramp`. */
    id?: string;
  }

  /**
   * Accepts slope 1:20?1:12, rise 0.15?0.76 m, width 0.915?1.2 m and mass
   * 200?600 kg, including both ends.
   */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    slope: AutoMovieArchetypeBand.of(
      "",
      1 / 20,
      1 / 12,
      `${AutoMovieArchetypeRampData.ADA} 405.2, a ramp run no steeper than 1:12; a surface no steeper than 1:20 is a walk, not a ramp (106.5, the definition of a ramp, not re-read)`,
    ),
    rise: AutoMovieArchetypeBand.of(
      "m",
      0.15,
      0.76,
      `${AutoMovieArchetypeRampData.ADA} 405.6, a run rises at most 30 in (760 mm); 405.8 requires handrails above 6 in (150 mm), taken as the least rise worth a ramp`,
    ),
    width: AutoMovieArchetypeBand.of(
      "m",
      0.915,
      1.2,
      `${AutoMovieArchetypeRampData.ADA} 405.5, clear width at least 36 in (915 mm); the upper end is an estimate`,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      200,
      600,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}
