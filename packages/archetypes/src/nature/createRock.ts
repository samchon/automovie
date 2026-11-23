import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";

/** The Udden-Wentworth size classes, read in a university textbook. */
const WENTWORTH: string =
  "Udden-Wentworth grain-size scale: cobble 64 to 256 mm, boulder 256 mm and up, its small to medium classes 256 to 1024 mm (Earle, Physical Geology 2nd ed., BCcampus, 6.1, https://opentextbc.ca/physicalgeology2ed/chapter/6-1-clastic-sedimentary-rocks/)";

/** Granite's bulk density, read. */
const GRANITE: string =
  "granite's dry bulk density, 2.66 g/cm3 with a standard deviation of 0.06 over 334 samples (Encyclopaedia Britannica, Rock: physical properties, https://www.britannica.com/science/rock-geology/Physical-properties)";

/**
 * A loose stone: a cobble a hand picks up, or a boulder a person sits on, hides behind or climbs.
 *
 * It rests on the ground on its lowest point at the origin, a ball of the drawn diameter. Its mass is its volume at the drawn specific gravity, so a bigger stone is heavier by the cube of its size. A cobble's `grip` closes one hand round it from `-X`; a boulder's `top` is its highest point, facing up, where a person sits or stands, and its `side` its `+Z` face at mid-height, facing out, where one leans or crouches behind it. Its surface is stone, granite's, and it rests on that stone, so its body's friction is stone's on concrete.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The stone.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createRock(
  params: createRock.IParams,
  seed?: number | string,
): AutoMovieArchetype<createRock.Affordance, createRock.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createRock.Dimension> =
    new AutoMovieArchetypeDrawSession<createRock.Dimension>(
      "rock",
      createRock.UNITS,
      seed,
      params,
    );
  const kind: createRock.Kind = ArchetypeDraw.choice(
    "rock",
    "kind",
    params.kind,
    createRock.KINDS,
  );
  const d: Record<createRock.Dimension, number> = draw.dimensions(
    createRock.BANDS[kind],
  );
  const builder: AutoMovieArchetypeBuilder<
    createRock.Affordance,
    createRock.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "stone",
    id: params.id,
    name: kind,
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const r: number = d.diameter / 2;
  builder.ball("stone", r, v(0, r, 0), { color: "#7d7a74", surface: "stone" });
  if (kind === "cobble")
    builder.affordance({
      id: "grip",
      kind: "handle",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        v(0, r, 0),
        v(-1, 0, 0),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      aperture: d.diameter,
    });
  else {
    builder.affordance({
      id: "top",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(v(0, d.diameter, 0)),
      extent: null,
    });
    builder.affordance({
      id: "side",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.facing(v(0, r, r), v(0, 0, 1), v(1, 0, 0)),
      extent: null,
    });
  }

  // Its mass: the sphere's volume times its specific gravity times water's 1000 kg per cubic metre.
  return builder.build((Math.PI / 6) * d.diameter ** 3 * d.gravity * 1000, {
    rests: "stone",
  });
}

/**
 * Companion types, constants and bands of {@link createRock}.
 */
export namespace createRock {
  /** The kinds: the Udden-Wentworth cobble and boulder classes. */
  export type Kind = "cobble" | "boulder";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["cobble", "boulder"];

  /**
   * The affordance ids:
   *
   * - `grip`: a cobble, closed round from `-X`.
   * - `top`: a boulder's highest point, facing up.
   * - `side`: a boulder's `+Z` face at mid-height, facing out.
   */
  export type Affordance = "grip" | "top" | "side";

  /**
   * The free dimensions:
   *
   * - `diameter`: across, metres.
   * - `gravity`: specific gravity, its density over water's.
   */
  export type Dimension = "diameter" | "gravity";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    diameter: "m",
    gravity: "",
  };

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which class. */
    kind: Kind;

    /** The model's id, unique in a scene; `rock` when absent. */
    id?: string;
  }

  /** Granite's specific gravity, its mean density plus and minus one standard deviation over water's 1 g/cm3. */
  const GRAVITY: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.of(
    "",
    2.6,
    2.72,
    GRANITE,
  );

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    cobble: {
      diameter: AutoMovieArchetypeBand.metres(0.064, 0.256, WENTWORTH),
      gravity: GRAVITY,
    },
    boulder: {
      diameter: AutoMovieArchetypeBand.metres(0.256, 1.024, WENTWORTH),
      gravity: GRAVITY,
    },
  };
}
