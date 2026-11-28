import { AutoMovieEngineVector3 } from "@automovie/engine";

import { AutoMovieArchetype, AutoMovieArchetypeBand, AutoMovieArchetypeBuilder, AutoMovieArchetypeDrawSession, AutoMovieArchetypeFrame, type IAutoMovieArchetypeBand } from "../core/index";
import { AutoMovieArchetypeHatchData } from "./internal/AutoMovieArchetypeHatchData";

/**
 * Constructs a steel roof hatch with a hinged cover, underside push site and fixed opening.
 */
export namespace AutoMovieArchetypeHatch {
/**
 * Build a steel roof hatch with its curb at model Y zero.
 *
 * The `hinge` runs along the `-Z` curb and turns the cover through
 * 70 degrees around `-X`, raising the `+Z` edge. The underside `push`
 * travels with the cover. The opening stays on the fixed curb plane.
 *
 * @param params Optional scene ID and finite mass within the band.
 *   The default ID is `hatch`.
 * @param seed Numeric seed for omitted mass. Omission uses 66.5 kilograms.
 * @returns The hatch with a fixed 0.762 by 0.9144 metre roof opening.
 * @throws {AutoMovieArchetypeRefusal} If a fixed mass is inadmissible.
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
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
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

  /** Cover `hinge`, its moving underside `push`, and fixed roof `opening`. */
  export type Affordance = "hinge" | "push" | "opening";

  /** The hatch's authorable whole mass in kilograms. */
  export type Dimension = "mass";

  /** Kilograms for the hatch's mass. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    mass: "kg",
  };

  /** Optional scene ID and finite mass in the hatch band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene object ID, defaulting to `hatch`. */
    id?: string;
  }

  /** The admitted 50 to 83 kilogram range for the fixed roof hatch. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    mass: AutoMovieArchetypeBand.of("kg", 50, 83, AutoMovieArchetypeHatchData.BILCO),
  };
}
