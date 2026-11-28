import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";
import { AutoMovieArchetypeSnorkelData } from "./internal/AutoMovieArchetypeSnorkelData";

/** Constructs the snorkel archetype from its recipe. */
export namespace AutoMovieArchetypeSnorkel {
  /**
   * Build a snorkel with a mouthpiece and a vertical tube beside the head.
   *
   * Mount it by the `wear` socket at the local origin, with `+Z` facing out
   * of the mouth. The barrel rises along local `+Y`. The `top` socket marks
   * its open end. When staging breathing through the mounted snorkel, keep
   * the posed `top` above the world water plane.
   *
   * @param params Optional subject ID and fixed dimensions.
   * @param seed Draws omitted dimensions within their bands. Omit it to use
   *   a 0.36 m barrel and 0.15 kg mass.
   * @returns The snorkel with its mounting and open-end sockets.
   * @throws {AutoMovieArchetypeRefusal} For a fixed value outside its band.
   */
export function create(
  params: AutoMovieArchetypeSnorkel.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeSnorkel.Affordance, AutoMovieArchetypeSnorkel.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeSnorkel.Dimension> =
    new AutoMovieArchetypeDrawSession(
      "snorkel",
      AutoMovieArchetypeSnorkel.UNITS,
      seed,
      params,
    );
  const d: Record<AutoMovieArchetypeSnorkel.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeSnorkel.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeSnorkel.Affordance,
    AutoMovieArchetypeSnorkel.Dimension
  > = new AutoMovieArchetypeBuilder({
    id: params.id,
    name: "a snorkel",
    material: "rubber",
    draw,
  });
  const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;
  builder.rod("barrel", 0.011, v(0.04, 0, -0.03), v(0.04, d.length, -0.03), {
    color: "#f2c230",
  });
  builder.rod("mouthpiece", 0.011, v(0, 0, 0), v(0.04, 0, -0.03), {
    color: "#1f2a36",
  });
  builder.affordance({
    id: "wear",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.facing(v(0, 0, 0), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
  });
  builder.affordance({
    id: "top",
    kind: "socket",
    frame: AutoMovieArchetypeFrame.upright(v(0.04, d.length, -0.03)),
    extent: null,
  });
  return builder.build(d.mass);
}

  /* Dimensions and the socket of {@link createSnorkel}. */
  /**
   * `wear` is the mouthpiece socket. `top` marks the barrel's open end.
   */
  export type Affordance = "wear" | "top";

  /**
   * Barrel rise in metres and snorkel mass in kilograms.
   */
  export type Dimension = "length" | "mass";

  /**
   * Optional scene ID and fixed values within the snorkel's dimension bands.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /**
     * Scene subject ID. Defaults to `snorkel`.
     */
    id?: string;
  }

  /**
   * Units for the tube's vertical rise and mass.
   */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    length: "m",
    mass: "kg",
  };

  /**
   * Staging bands for the rise and mass of one snorkel.
   */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    length: AutoMovieArchetypeBand.metres(0.32, 0.4, AutoMovieArchetypeSnorkelData.STAGED, true),
    mass: AutoMovieArchetypeBand.of("kg", 0.1, 0.2, AutoMovieArchetypeSnorkelData.STAGED, true),
  };
}
