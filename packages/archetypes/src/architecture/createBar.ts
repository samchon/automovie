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

/** The gymnastics apparatus norms. */
const FIG: string =
  "FIG Apparatus Norms (March 2021), MAG 6 section 2.1 (https://www.gymnasticsontario.ca/download/523/fig-technical-documents-resources/49077/fig-apparatus-norms-en-march-2021.pdf)";

/** The accessibility standard's grab bar and handrail clauses. */
const ADA: string = "2010 ADA Standards (https://www.access-board.gov/ada/)";

/**
 * A horizontal bar a person holds or hangs from: a high bar on two posts, a
 * grab bar on a wall, or a level rail on posts.
 *
 * The bar runs along `+X`, centred above the origin on the floor, and is
 * gripped from above. A grab bar stands off a wall behind it by the clearance
 * the standard fixes; the wall is not part of the model.
 *
 * @param params The kind, a grab bar's wall and any dimension the author fixes.
 * @param seed The seed that draws a grab bar's wall when it is not given and
 *   every dimension left free inside its band; absent, the rear wall and the
 *   middle of each band.
 * @returns The bar.
 * @throws {AutoMovieArchetypeRefusal} For a wall named for a bar that has none,
 *   or a fixed dimension outside its band.
 */
export function createBar(
  params: createBar.IParams,
  seed?: number,
): AutoMovieArchetype<createBar.Affordance, createBar.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<createBar.Dimension> =
    new AutoMovieArchetypeDrawSession<createBar.Dimension>(
      "bar",
      createBar.UNITS,
      seed,
      params,
    );
  const kind: createBar.Kind = ArchetypeDraw.choice(
    "bar",
    "kind",
    params.kind,
    createBar.KINDS,
  );
  const wall: Readonly<Partial<Record<createBar.Dimension, number>>> =
    draw.model<createBar.Wall>(
      "wall",
      params.wall,
      createBar.WALLS[kind],
    ).figures;
  const d: Partial<Record<createBar.Dimension, number>> = {
    ...draw.dimensions(createBar.BANDS[kind], createBar.BANDS),
    ...wall,
  };
  const radius: number = d.diameter! / 2;

  // A high bar's height is its upper edge by the norm; the others' is the top of the gripping surface.
  const y: number = d.height! - radius;
  const builder: AutoMovieArchetypeBuilder<
    createBar.Affordance,
    createBar.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "steel",
    id: params.id,
    name: kind === "high" ? "high bar" : kind === "grab" ? "grab bar" : "rail",
    draw,
  });
  builder.rod(
    "bar",
    radius,
    Vector3.create(-d.length! / 2, y, 0),
    Vector3.create(d.length! / 2, y, 0),
    { color: "#8a8d91" },
  );
  for (const side of [1, -1] as const) {
    const x: number = (side * d.length!) / 2;
    builder.rod(
      side === 1 ? "support-left" : "support-right",
      kind === "grab" ? radius : 0.025,
      Vector3.create(x, y, 0),
      kind === "grab"
        ? Vector3.create(x, y, -createBar.GAP - radius)
        : Vector3.create(x, 0, 0),
      { color: "#55595f" },
    );
  }
  builder.affordance({
    id: "bar",
    kind: "bar",
    symmetry: "round",
    frame: AutoMovieArchetypeFrame.upright(Vector3.create(0, y, 0)),
    extent: null,
    grip: "power",
    aperture: d.diameter!,
    length: d.length!,
  });
  return builder.build(d.mass!);
}

/** Companion types and bands of {@link createBar}. */
export namespace createBar {
  /** The kinds of bar: a gymnastics high bar, a wall grab bar, a level handrail. */
  export type Kind = "high" | "grab" | "rail";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["high", "grab", "rail"];

  /**
   * A grab bar's gap to the wall behind it, metres: the 1-1/2 in (38 mm) of
   * 2010 ADA Standards 609.3.
   */
  export const GAP: number = 0.038;

  /**
   * The affordance id: `bar`, the whole bar, gripped from above at any site
   * along it.
   */
  export type Affordance = "bar";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the top of the bar above the floor.
   * - `diameter`: the bar's round section.
   * - `length`: along `+X`.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "diameter" | "length" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    diameter: "m",
    length: "m",
    mass: "kg",
  };

  /** The walls a grab bar is on: the rear wall and the side wall. */
  export type Wall = "rear" | "side";

  /**
   * Each kind's walls with the least length each takes, metres, the default
   * first: 2010 ADA Standards 604.5, the rear wall bar "at least 36 in (915
   * mm)" and the side wall bar "at least 42 in (1065 mm)" long; the other bars
   * have none.
   */
  export const WALLS: Readonly<
    Partial<
      Record<
        Kind,
        Readonly<Record<Wall, Readonly<Partial<Record<Dimension, number>>>>>
      >
    >
  > = {
    grab: { rear: { length: 0.915 }, side: { length: 1.065 } },
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which bar. */
    kind: Kind;

    /**
     * The wall a grab bar is on, whose least length it takes; drawn from the
     * seed when absent. Other bars have none.
     */
    wall?: Wall;

    /** The model's id, unique in a scene; `bar` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    high: {
      height: AutoMovieArchetypeBand.metres(
        2.8,
        2.9,
        `${FIG}: upper edge 280 cm from the floor, adjustable to 290 cm`,
      ),
      diameter: AutoMovieArchetypeBand.metres(
        0.028,
        0.028,
        `${FIG}: diameter 2.8 cm`,
      ),
      length: AutoMovieArchetypeBand.metres(
        2.4,
        2.4,
        `${FIG}: 240 cm between the attachments`,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        40,
        80,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    grab: {
      height: AutoMovieArchetypeBand.metres(
        0.84,
        0.915,
        `${ADA} 609.4, top of the gripping surface 33 to 36 in (840 to 915 mm) above the floor`,
      ),
      diameter: AutoMovieArchetypeBand.metres(
        0.032,
        0.051,
        `${ADA} 609.2.1, circular section 1-1/4 to 2 in (32 to 51 mm)`,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        1.5,
        4,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
    rail: {
      height: AutoMovieArchetypeBand.metres(
        0.865,
        0.965,
        `${ADA} 505.4, top of the gripping surface 34 to 38 in (865 to 965 mm) above the walking surface`,
      ),
      diameter: AutoMovieArchetypeBand.metres(
        0.032,
        0.051,
        `${ADA} 505.7.1, circular section 1-1/4 to 2 in (32 to 51 mm)`,
      ),
      length: AutoMovieArchetypeBand.metres(
        1.2,
        3,
        "a run of level rail, not read at a source",
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        8,
        25,
        AutoMovieArchetypeBand.TYPICAL_MASS,
        true,
      ),
    },
  };
}
