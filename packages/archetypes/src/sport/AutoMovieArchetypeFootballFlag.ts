import { AutoMovieEngineVector3 } from "@automovie/engine";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeUnits,
} from "../core/index";

/** Constructs the football flag archetype from its recipe. */
export namespace AutoMovieArchetypeFootballFlag {
/**
 * One flag of a flag football belt at the IFAF Flag Football Rules' dimensions:
 * a strip 15 to 16 inches long from its socket (the middle, 15.5 in), 1.8 to
 * 2.0 inches wide (1.9 in) and 0.02 to 0.10 inches thick (0.06 in), hanging
 * down along -Y from its socket at the origin. A player wears one at each hip;
 * a defender's hand that grips it pulls it off.
 *
 * `socket` is where it clips to the belt, worn on the hips; `tip` its free end,
 * `grip` the middle a pulling hand closes on.
 *
 * @param params The model's id.
 * @param seed The seed; the flag has no drawn dimension.
 * @returns The flag.
 */
export function create(
  params: AutoMovieArchetypeFootballFlag.IParams = {},
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeFootballFlag.Affordance, never> {
  const draw: AutoMovieArchetypeDrawSession<never> =
    new AutoMovieArchetypeDrawSession("footballFlag", {}, seed, {});
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeFootballFlag.Affordance,
    never
  > = new AutoMovieArchetypeBuilder({
    material: "fabric",
    id: params.id,
    name: "football flag",
    draw,
  });
  const { LENGTH, WIDTH, THICKNESS } = AutoMovieArchetypeFootballFlag;
  builder.box(
    "strip",
    AutoMovieEngineVector3.create(WIDTH, LENGTH, THICKNESS),
    AutoMovieEngineVector3.create(0, -LENGTH / 2, 0),
    { color: "#e8452c" },
  );
  for (const [id, y] of [
    ["socket", 0],
    ["grip", -LENGTH / 2],
    ["tip", -LENGTH],
  ] as const)
    builder.affordance({
      id,
      kind: id === "grip" ? "handle" : "socket",
      frame: AutoMovieArchetypeFrame.upright(AutoMovieEngineVector3.create(0, y, 0)),
      extent: null,
    });

  // A flag's nominal mass, kilograms; provisional.
  return builder.build(0.02);
}

  /* Companion types and constants of {@link AutoMovieArchetypeFootballFlag.create}. */
  /**
   * `socket`, where it clips to the belt; `grip`, its middle; `tip`, its free
   * end.
   */
  export type Affordance = "socket" | "grip" | "tip";

  /** The parameters. */
  export interface IParams {
    /** The model's id, unique in a scene; `footballFlag` when absent. */
    id?: string;
  }

  /** The flag's length from its socket, metres: IFAF, 15 to 16 in. */
  export const LENGTH: number = 15.5 * AutoMovieArchetypeUnits.INCH;

  /** The flag's width, metres: IFAF, 1.8 to 2.0 in. */
  export const WIDTH: number = 1.9 * AutoMovieArchetypeUnits.INCH;

  /** The flag's thickness, metres: IFAF, 0.02 to 0.10 in. */
  export const THICKNESS: number = 0.06 * AutoMovieArchetypeUnits.INCH;
}
