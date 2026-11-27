import { Vector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
} from "../core";

/** Constructs the adult cricket wicket from its recipe. */
export namespace AutoMovieArchetypeCricketWicket {
  /**
   * An adult cricket wicket at the origin, with three separately named stumps and
   * two separately named bails across X.
   *
   * @param params Optional scene id.
   * @param seed Seed for stump diameter.
   * @returns The standing wicket with stumps and bails named as targets.
   */
  export function create(
    params: AutoMovieArchetypeCricketWicket.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypeCricketWicket.Affordance, "diameter"> {
    const draw: AutoMovieArchetypeDrawSession<"diameter"> =
      new AutoMovieArchetypeDrawSession(
        "cricketWicket",
        { diameter: "m" },
        seed,
        {},
      );
    const { diameter }: Record<"diameter", number> = draw.dimensions({
      diameter: AutoMovieArchetypeBand.metres(
        0.035,
        0.0381,
        "MCC Laws of Cricket 2026, Law 8.2",
      ),
    });
    const builder: AutoMovieArchetypeBuilder<
      AutoMovieArchetypeCricketWicket.Affordance,
      "diameter"
    > = new AutoMovieArchetypeBuilder({
      material: "wood",
      id: params.id,
      name: "cricket wicket",
      draw,
    });
    const v: typeof Vector3.create = Vector3.create;
    const height: number = 0.7112;
    const offset: number = (0.2286 - diameter) / 2;
    for (const [id, x] of [
      ["leftStump", -offset],
      ["middleStump", 0],
      ["rightStump", offset],
    ] as const) {
      builder.rod(id, diameter / 2, v(x, 0, 0), v(x, height, 0), {
        color: "#ead5ad",
      });
      builder.affordance({
        id,
        kind: "socket",
        frame: AutoMovieArchetypeFrame.upright(v(x, height / 2, 0)),
        extent: null,
      });
    }
    for (const [id, sign] of [
      ["leftBail", -1],
      ["rightBail", 1],
    ] as const) {
      const x: number = (sign * offset) / 2;
      const y: number = height + 0.003;
      const barrel: number = 0.054 / 2;
      builder.rod(id, 0.009, v(x - barrel, y, 0), v(x + barrel, y, 0), {
        color: "#ead5ad",
      });
      builder.rod(
        `${id}Spigot`,
        0.004,
        v(x - sign * (barrel + 0.0206), y, 0),
        v(x + sign * (barrel + 0.035), y, 0),
        { color: "#ead5ad" },
      );
      builder.affordance({
        id,
        kind: "socket",
        frame: AutoMovieArchetypeFrame.upright(v(x, y, 0)),
        extent: null,
      });
    }
    // Assembly mass is provisional for staging because Law 8 gives no weight.
    return builder.build(1.5);
  }

  /*
   * Authorable settings and named aiming and inspection points for an adult wicket. The three stump
   * centers and two bail barrel centers have frames in model metres.
   */
  /** Three stump centers and two bail barrel centers. */
  export type Affordance =
    | "leftStump"
    | "middleStump"
    | "rightStump"
    | "leftBail"
    | "rightBail";

  /** Parameters accepted by this producer. */
  export interface IParams {
    /** Optional scene id; `cricketWicket` when absent. */
    id?: string;
  }
}
