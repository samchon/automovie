import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  AutoMovieArchetypeUnits,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { AutoMovieArchetypeBoxData } from "./internal/AutoMovieArchetypeBoxData";

/** Constructs the box archetype from its recipe. */
export namespace AutoMovieArchetypeBox {
/**
 * Build a cardboard carton with two side contacts and a stacking face.
 *
 * The box's width is along +X and its bottom is at y = 0. With
 * `sideHandles: true`, two round bars run along the depth at half height,
 * with mounts that join them to the carton. The `left` and `right` affordances
 * sit at the bar centres. The default places those affordances on the carton
 * walls and uses a single box collider.
 *
 * @param params Load, fixed dimensions, and whether to add round side handles.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The box.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band,
 *   or a load above 25 kg.
 */
export function create(
  params: AutoMovieArchetypeBox.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeBox.Affordance, AutoMovieArchetypeBox.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeBox.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeBox.Dimension>(
      "box",
      AutoMovieArchetypeBox.UNITS,
      seed,
      params,
    );
  const load: number = params.load ?? 0;
  if (!(load >= 0 && load <= AutoMovieArchetypeBox.LOAD))
    throw new AutoMovieArchetypeRefusal({
      kind: "parameter",
      archetype: "box",
      axis: "load",
      value: load,
      feasible: {
        kind: "range",
        minimum: 0,
        maximum: AutoMovieArchetypeBox.LOAD,
        unit: "kg",
      },
      reason: `${load} kg is more than a person lifts close to the body`,
      fix: "give a load of at most 25 kg, or split it over several boxes",
    });
  const d: Record<AutoMovieArchetypeBox.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeBox.BANDS,
  );
  const width: number = d.width;
  const height: number = d.height;
  const depth: number = d.depth;
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeBox.Affordance,
    AutoMovieArchetypeBox.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "paper",
    id: params.id,
    name: "cardboard box",
    draw,
  });
  builder.box(
    "box",
    AutoMovieEngineVector3.create(width, height, depth),
    AutoMovieEngineVector3.create(0, height / 2, 0),
    { color: "#b98d5b" },
  );
  for (const [id, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    const wall = (sign * width) / 2;
    const y = height / 2;
    if (params.sideHandles !== true) {
      builder.affordance({
        id,
        kind: "handle",
        symmetry: "none",
        frame: AutoMovieArchetypeFrame.facing(
          AutoMovieEngineVector3.create(wall, y, 0),
          AutoMovieEngineVector3.create(sign, 0, 0),
          AutoMovieEngineVector3.create(0, 0, 1),
        ),
        extent: null,
        grip: "two-hand",
        length: depth,
      });
      continue;
    }
    const center = wall + sign * 0.065;
    const radius = 0.018;
    const halfLength = 0.11;
    const point = (x: number, z: number) => AutoMovieEngineVector3.create(x, y, z);
    builder.rod(
      id + "-handle",
      radius,
      point(center, -halfLength),
      point(center, halfLength),
      { round: true, color: "#8e633c" },
    );
    for (const end of [-1, 1] as const) {
      const z = end * halfLength;
      builder.rod(
        id + "-handle-mount-" + end,
        0.012,
        point(wall, z),
        point(center, z),
        { color: "#8e633c" },
      );
    }
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        point(center, 0),
        AutoMovieEngineVector3.create(sign, 0, 0),
        AutoMovieEngineVector3.create(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      aperture: radius * 2,
      length: halfLength * 2,
    });
  }
  builder.affordance({
    id: "top",
    kind: "stack-top",
    frame: AutoMovieArchetypeFrame.upright(AutoMovieEngineVector3.create(0, height, 0)),
    extent: [
      AutoMovieEngineVector3.create(-width / 2, 0, -depth / 2),
      AutoMovieEngineVector3.create(width / 2, 0, -depth / 2),
      AutoMovieEngineVector3.create(width / 2, 0, depth / 2),
      AutoMovieEngineVector3.create(-width / 2, 0, depth / 2),
    ],
  });
  builder.affordance({
    id: "front",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(0, height / 2, depth / 2),
      AutoMovieEngineVector3.create(0, 0, 1),
      AutoMovieEngineVector3.create(1, 0, 0),
    ),
    extent: null,
    width,
    depth: height,
  });
  return builder.build(d.mass + load);
}

  /**
   * The greatest load, kilograms: HSE INDG143 Figure 1, a man's lift close to
   * the body between knuckle and elbow height
   * (https://www.hse.gov.uk/pubns/indg143.pdf).
   */
  export const LOAD: number = 25;

  /**
   * The affordance ids:
   *
   * - `left`, `right`: the +X and -X side walls or the centres of the
   *   optional round handles, at half height.
   * - `top`: the upper face, on which another object rests.
   * - `front`: the `+Z` face, pushed or leaned on.
   */
  export type Affordance = "left" | "right" | "top" | "front";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`, `height`, `depth`: along `+X`, `+Y` and `+Z`.
   * - `mass`: the empty carton, kilograms.
   */
  export type Dimension = "width" | "height" | "depth" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    height: "m",
    depth: "m",
    mass: "kg",
  };

  /** Box dimensions, load and the optional supported side handles. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene model id. Uses `box` when omitted. */
    id?: string;

    /** Added contents, from zero to 25 kilograms. The default is zero. */
    load?: number;

    /**
     * Add a round 36 mm-diameter handle supported by two mounts on each
     * side. The grip is centred along 220 mm of the bar. The default is false
     * and preserves the side-wall contacts.
     */
    sideHandles?: boolean;
  }

  /** The band of each free dimension. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    width: AutoMovieArchetypeBand.of(
      "m",
      (16 + 3 / 8) * AutoMovieArchetypeUnits.INCH,
      18 * AutoMovieArchetypeUnits.INCH,
      AutoMovieArchetypeBoxData.CARTON,
      true,
    ),
    height: AutoMovieArchetypeBand.of(
      "m",
      (12 + 5 / 8) * AutoMovieArchetypeUnits.INCH,
      24 * AutoMovieArchetypeUnits.INCH,
      AutoMovieArchetypeBoxData.CARTON,
      true,
    ),
    depth: AutoMovieArchetypeBand.of(
      "m",
      (12 + 5 / 8) * AutoMovieArchetypeUnits.INCH,
      18 * AutoMovieArchetypeUnits.INCH,
      AutoMovieArchetypeBoxData.CARTON,
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      0.4,
      0.9,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}
