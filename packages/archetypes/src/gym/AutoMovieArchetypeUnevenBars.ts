import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** Competition uneven bars dimensions. */
const NORMS: string =
  "World Gymnastics Apparatus Norms, WAG 2 §2 (https://www.gymnastics.sport/publicdir/rules/files/en_Apparatus%20Norms.pdf)";

/** Constructs the uneven bars archetype from its recipe. */
export namespace AutoMovieArchetypeUnevenBars {
/**
 * Competition uneven bars at the chosen inner diagonal distance. The bars run
 * along X, with the higher bar toward +Z and the origin on the floor between
 * them. `lowBar` and `highBar` mark the centres of their respective grip axes.
 *
 * @param params Fixed dimensions inside the admitted bands and its model id.
 * @param seed Draws unspecified dimensions inside their bands; absent selects
 *   midpoints.
 * @returns The uneven bars with both round grip surfaces.
 * @throws {AutoMovieArchetypeRefusal} When a fixed dimension lies outside its
 *   band.
 */
export function create(
  params: AutoMovieArchetypeUnevenBars.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeUnevenBars.Affordance, AutoMovieArchetypeUnevenBars.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeUnevenBars.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "unevenBars",
      AutoMovieArchetypeUnevenBars.UNITS,
      seed,
      params,
    );
  const values: Record<AutoMovieArchetypeUnevenBars.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeUnevenBars.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeUnevenBars.Affordance,
    AutoMovieArchetypeUnevenBars.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "uneven bars",
    draw,
  });
  const point: typeof Vector3.create = Vector3.create;
  const radius: number = values.diameter / 2;
  const half: number = values.length / 2;
  const heightDifference: number = values.highHeight - values.lowHeight;
  const centreDistance: number = values.diagonal + values.diameter;
  const separation: number = Math.sqrt(
    centreDistance ** 2 - heightDifference ** 2,
  );
  const post: number = 0.035;
  const base: number = 0.07;
  const ends = [
    ["right", -1.06],
    ["left", 1.06],
  ] as const;
  for (const [end, x] of ends)
    builder.box(
      `foot-${end}`,
      point(0.14, base, separation + 0.55),
      point(x, base / 2, 0),
      {
        color: "#535969",
      },
    );
  for (const [id, top, z] of [
    ["lowBar", values.lowHeight, -separation / 2],
    ["highBar", values.highHeight, separation / 2],
  ] as const) {
    const axisHeight: number = top - radius;
    builder.rod(
      id,
      radius,
      point(-half, axisHeight, z),
      point(half, axisHeight, z),
      {
        color: "#b8905d",
      },
    );
    for (const [end, x] of ends)
      builder.rod(
        `${id}-post-${end}`,
        post,
        point(x, base, z),
        point(x, axisHeight, z),
        {
          color: "#8a9399",
        },
      );
    builder.affordance({
      id,
      kind: "bar",
      extent: null,
      frame: AutoMovieArchetypeFrame.upright(point(0, axisHeight, z)),
      length: values.length,
      aperture: values.diameter,
      symmetry: "round",
    });
  }
  return builder.build(values.mass);
}

  /* The competition uneven bars dimensions and named grips. */
  /** The central grip of the low and high rails. */
  export type Affordance = "lowBar" | "highBar";

  /**
   * Rail dimensions, upper edge heights, the inner diagonal separation, and
   * model mass.
   */
  export type Dimension =
    | "length"
    | "diameter"
    | "lowHeight"
    | "highHeight"
    | "diagonal"
    | "mass";

  /** Fixed dimension overrides and the scene model id. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Model id, defaulting to the producer id. */
    id?: string;
  }

  /** Metres for geometry and kilograms for model mass. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    diameter: "m",
    lowHeight: "m",
    highHeight: "m",
    diagonal: "m",
    mass: "kg",
  };

  /** The standard-height competition setup and a provisional model mass. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(2.39, 2.41, NORMS),
    diameter: AutoMovieArchetypeBand.metres(0.0392, 0.0404, NORMS),
    lowHeight: AutoMovieArchetypeBand.metres(1.74, 1.76, NORMS),
    highHeight: AutoMovieArchetypeBand.metres(2.54, 2.56, NORMS),
    diagonal: AutoMovieArchetypeBand.metres(1.3, 1.81, NORMS),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      100,
      120,
      "Provisional model mass. SPIETH Munich lists a 121 kg shipping weight (https://www.spieth-gymnastics.com/uneven-bars-munich/1383220).",
      true,
    ),
  };
}
