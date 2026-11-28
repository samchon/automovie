import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { AutoMovieArchetypeMedalData } from "./internal/AutoMovieArchetypeMedalData";

/**
 * Constructs a hanging ribbon medal with a ribbon pinch and rear disc socket.
 */
export namespace AutoMovieArchetypeMedal {
/**
 * Build a medal hanging along `-Y` from the ribbon top at the origin.
 *
 * The disc faces `+Z`. The `hold` pinches the ribbon 0.02 metres
 * above the disc. The `wear` socket faces `-Z` from the disc back.
 *
 * @param params Optional scene ID and finite ribbon length, disc
 *   diameter or mass in their bands. The ID defaults to `medal`.
 * @param seed Numeric seed for omitted values. Seedless dimensions
 *   are a 0.45 metre ribbon and a 0.0775 metre disc diameter.
 * @returns The ribbon and disc with the handling and wearing frames.
 * @throws {AutoMovieArchetypeRefusal} If a fixed value is inadmissible.
 */
export function create(
  params: AutoMovieArchetypeMedal.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeMedal.Affordance, AutoMovieArchetypeMedal.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeMedal.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeMedal.Dimension>(
      "medal",
      AutoMovieArchetypeMedal.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeMedal.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeMedal.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeMedal.Affordance,
    AutoMovieArchetypeMedal.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: "medal",
    draw,
  });
  const thick: number = 0.008;
  builder.box(
    "ribbon",
    AutoMovieEngineVector3.create(0.035, d.ribbon, 0.002),
    AutoMovieEngineVector3.create(0, -d.ribbon / 2, 0),
    {
      color: "#1f4fa3",
    },
  );
  builder.rod(
    "disc",
    d.diameter / 2,
    AutoMovieEngineVector3.create(0, -d.ribbon - d.diameter / 2, -thick / 2),
    AutoMovieEngineVector3.create(0, -d.ribbon - d.diameter / 2, thick / 2),
    { color: "#c9a227" },
  );
  builder.affordance({
    id: "hold",
    kind: "handle",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(0, 0.02 - d.ribbon, 0),
      AutoMovieEngineVector3.create(0, 0, 1),
      AutoMovieEngineVector3.create(0, 1, 0),
    ),
    extent: null,
    grip: "lateral",
    aperture: 0.002,
  });
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      AutoMovieEngineVector3.create(0, -d.ribbon - d.diameter / 2, -thick / 2),
      AutoMovieEngineVector3.create(0, 0, -1),
      AutoMovieEngineVector3.create(0, 1, 0),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

  /** Pinch `hold` on the ribbon above the disc and rear disc `wear` socket. */
  export type Affordance = "hold" | "wear";

  /**
   * Ribbon length and disc diameter in metres, and assembled mass in kilograms.
   */
  export type Dimension = "diameter" | "ribbon" | "mass";

  /** Units of the two metric dimensions and the whole medal's mass. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    diameter: "m",
    ribbon: "m",
    mass: "kg",
  };

  /**
   * Optional scene ID and finite diameter, ribbon length or mass in their bands.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene object ID, defaulting to `medal`. */
    id?: string;
  }

  /**
   * Admitted ribbon lengths and disc sizes in metres and whole masses in kilograms.
   */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    diameter: AutoMovieArchetypeBand.metres(0.07, 0.085, AutoMovieArchetypeMedalData.MEDAL),
    ribbon: AutoMovieArchetypeBand.metres(0.4, 0.5, AutoMovieArchetypeMedalData.RIBBON),
    mass: AutoMovieArchetypeBand.of("kg", 0.45, 0.556, AutoMovieArchetypeMedalData.MEDAL),
  };
}
