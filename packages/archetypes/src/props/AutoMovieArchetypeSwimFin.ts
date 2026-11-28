import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { AutoMovieArchetypeSwimFinData } from "./internal/AutoMovieArchetypeSwimFinData";

/** Constructs the swim fin archetype from its recipe. */
export namespace AutoMovieArchetypeSwimFin {
  /**
   * Build one rubber full-foot swimming fin.
   *
   * The local origin is the pocket's heel, `+Y` points up, and `+Z` points
   * towards the toe and blade. Mount the foot using the `wear` socket at the
   * ankle. The `blade` surface exposes its width across the foot and depth
   * along the foot in metres. Fin-swimming motion uses their product as the
   * area of one blade.
   *
   * @param params Optional subject ID and fixed dimensions.
   * @param seed Draws omitted dimensions within their bands. Omit it to use
   *   0.375 m blade length, 0.20 m blade width, and 0.80 kg mass.
   * @returns The fin with the foot socket and the upper blade face.
   * @throws {AutoMovieArchetypeRefusal} For a fixed value outside its band.
   */
export function create(
  params: AutoMovieArchetypeSwimFin.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSwimFin.Affordance, AutoMovieArchetypeSwimFin.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeSwimFin.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "swimFin",
      AutoMovieArchetypeSwimFin.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeSwimFin.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeSwimFin.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeSwimFin.Affordance,
    AutoMovieArchetypeSwimFin.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: "swim fin",
    material: "rubber",
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  builder.box("pocket", v(0.11, 0.08, 0.28), v(0, 0.04, 0.12), {
    color: "#1f2a36",
  });
  builder.box(
    "blade",
    v(d.width, 0.006, d.length),
    v(0, 0.01, 0.26 + d.length / 2),
    {
      color: "#2b7fd0",
    },
  );
  builder.affordance({
    id: "blade",
    kind: "surface",
    frame: AutoMovieArchetypeFrame.upright(v(0, 0.013, 0.26 + d.length / 2)),
    extent: null,
    width: d.width,
    depth: d.length,
  });
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, 0.07, 0.04),
      v(0, 1, 0),
      v(0, 0, 1),
    ),
    extent: null,
  });
  return builder.build(d.mass);
}

  /* Dimensions and the socket of {@link createSwimFin}. */
  /**
   * `wear` mounts the pocket at the ankle. `blade` is the upper blade face.
   */
  export type Affordance = "wear" | "blade";

  /**
   * Blade length and width in metres and the mass of one fin in kilograms.
   */
  export type Dimension = "length" | "width" | "mass";

  /**
   * Optional scene ID and fixed values within the fin's dimension bands.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /**
     * Scene subject ID. Defaults to `swimFin`.
     */
    id?: string;
  }

  /**
   * Units used for the blade's two lengths and the mass of one fin.
   */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    width: "m",
    mass: "kg",
  };

  /**
   * Staging bands for one fin's blade lengths and mass.
   */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(0.3, 0.45, AutoMovieArchetypeSwimFinData.STAGED, true),
    width: AutoMovieArchetypeBand.metres(0.18, 0.22, AutoMovieArchetypeSwimFinData.STAGED, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.6, 1, AutoMovieArchetypeSwimFinData.STAGED, true),
  };
}
