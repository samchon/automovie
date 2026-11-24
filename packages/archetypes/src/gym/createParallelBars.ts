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

/** The norm that sizes gymnastics' parallel bars. */
const FIG: string =
  "Fédération Internationale de Gymnastique, Apparatus Norms, the parallel bars: the rails 2.0 m above the floor, 3.5 m long and 42 to 52 cm apart";

/**
 * Two level bars side by side to bear on with the hands: gymnastics' parallel
 * bars or a gym's dip station.
 *
 * They stand on the floor with the middle of their footprint at the origin, the
 * bars along `Z`, one on each side of `X`. `barLeft` (on `+X`) and `barRight`
 * are the bars' middles, on their axes, with `+Y` up.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The bars.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function createParallelBars(
  params: createParallelBars.IParams,
  seed?: number | string,
): AutoMovieArchetype<
  createParallelBars.Affordance,
  createParallelBars.Dimension
> {
  const draw: AutoMovieArchetypeDrawSession<createParallelBars.Dimension> =
    new AutoMovieArchetypeDrawSession<createParallelBars.Dimension>(
      "parallelBars",
      createParallelBars.UNITS,
      seed,
      params,
    );
  const kind: createParallelBars.Kind = ArchetypeDraw.choice(
    "parallelBars",
    "kind",
    params.kind,
    createParallelBars.KINDS,
  );
  const d: Partial<Record<createParallelBars.Dimension, number>> =
    draw.dimensions(createParallelBars.BANDS[kind], createParallelBars.BANDS);
  const half: number = d.length! / 2;
  const height: number = d.height!;
  const slim: number = d.diameter! / 2;
  const builder: AutoMovieArchetypeBuilder<
    createParallelBars.Affordance,
    createParallelBars.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: kind === "dipStation" ? "dip station" : "parallel bars",
    draw,
  });
  for (const side of [1, -1] as const) {
    const name: string = side === 1 ? "left" : "right";
    const x: number = (side * d.spacing!) / 2;
    builder.rod(
      `bar-${name}`,
      slim,
      Vector3.create(x, height, -half),
      Vector3.create(x, height, half),
      { color: "#c9a36b" },
    );
    for (const end of [1, -1] as const)
      builder.rod(
        `upright-${name}-${end === 1 ? "front" : "back"}`,
        createParallelBars.UPRIGHT,
        Vector3.create(x, 0, end * half * createParallelBars.SET),
        Vector3.create(x, height - slim, end * half * createParallelBars.SET),
        { color: "#5a5f66" },
      );
    builder.affordance({
      id: side === 1 ? "barLeft" : "barRight",
      kind: "bar",
      symmetry: "round",
      frame: AutoMovieArchetypeFrame.facing(
        Vector3.create(x, height, 0),
        Vector3.create(0, 1, 0),
        Vector3.create(0, 0, 1),
      ),
      extent: null,
      length: d.length!,
      aperture: d.diameter!,
    });
  }
  return builder.build(d.mass!);
}

/** Companion types and bands of {@link createParallelBars}. */
export namespace createParallelBars {
  /** The kinds of bars. */
  export type Kind = "dipStation" | "parallelBars";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["dipStation", "parallelBars"];

  /** An upright's radius, metres. An estimate, not read at a source. */
  export const UPRIGHT: number = 0.025;

  /**
   * Where the uprights stand along each bar, as a share of its half length from
   * the middle. An estimate, not read at a source.
   */
  export const SET: number = 0.65;

  /**
   * The affordance ids:
   *
   * - `barLeft`: the bar on `+X`, its middle on its axis, `+Y` up.
   * - `barRight`: the bar on `-X`.
   */
  export type Affordance = "barLeft" | "barRight";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the bars' axes above the floor.
   * - `length`: each bar's.
   * - `spacing`: between the two bars' axes.
   * - `diameter`: a bar's thickness.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "length" | "spacing" | "diameter" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    length: "m",
    spacing: "m",
    diameter: "m",
    mass: "kg",
  };

  /**
   * The parameters: the kind, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which bars. */
    kind: Kind;

    /** The model's id, unique in a scene; `parallelBars` when absent. */
    id?: string;
  }

  /**
   * A rail's thickness: the norm's oval rail is about 4 cm wide and 5 cm high,
   * read from descriptions of the apparatus and not from the norm's text.
   */
  const RAIL: IAutoMovieArchetypeBand = AutoMovieArchetypeBand.metres(
    0.04,
    0.05,
    "the rail's oval section, about 4 cm by 5 cm, as the apparatus is commonly described; the norm's text was not read for it",
    true,
  );

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IAutoMovieArchetypeBand>>>>
  > = {
    dipStation: {
      height: AutoMovieArchetypeBand.metres(
        1.2,
        1.4,
        "an estimate: above the hips of a standing adult, so bent knees clear the floor; no maker's sheet was read",
        true,
      ),
      length: AutoMovieArchetypeBand.metres(
        0.5,
        0.7,
        "an estimate; no maker's sheet was read",
        true,
      ),
      spacing: AutoMovieArchetypeBand.metres(
        0.5,
        0.6,
        "an estimate: a little wider than the shoulders; no maker's sheet was read",
        true,
      ),
      diameter: AutoMovieArchetypeBand.metres(
        0.035,
        0.045,
        "an estimate; no maker's sheet was read",
        true,
      ),
      mass: AutoMovieArchetypeBand.of(
        "kg",
        15,
        40,
        "an estimate; no maker's sheet was read",
        true,
      ),
    },
    parallelBars: {
      height: AutoMovieArchetypeBand.metres(2.0, 2.0, FIG),
      length: AutoMovieArchetypeBand.metres(3.5, 3.5, FIG),
      spacing: AutoMovieArchetypeBand.metres(0.42, 0.52, FIG),
      diameter: RAIL,
      mass: AutoMovieArchetypeBand.of(
        "kg",
        100,
        200,
        "an estimate; the norm states no mass",
        true,
      ),
    },
  };
}
