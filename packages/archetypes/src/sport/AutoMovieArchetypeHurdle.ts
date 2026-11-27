import { Vector3 } from "@automovie/engine";

import {
  ArchetypeDraw,
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core/index";

/** The World Athletics rule as read. */
const RULE: string =
  "World Athletics Competition and Technical Rules, 2020 edition (https://athletics.lv/file/download/61151), Technical Rule 22.3 and 22.4, the hurdles";

/** Constructs the hurdle archetype from its recipe. */
export namespace AutoMovieArchetypeHurdle {
/**
 * A track hurdle of a sprint or a 400 m hurdles race.
 *
 * It stands across the lane, its top bar along `X` centred over the origin with
 * its face toward `-Z`, the way the runner comes, and its two feet running back
 * along `+Z` from the uprights. `top` is the top bar's upper edge, the edge a
 * hurdler's lead leg clears, along `+X` with `+Y` up and `+Z` out of its face
 * toward the runner; `bar` the top bar itself, a rod a hand may take.
 *
 * @param params The race and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band;
 *   absent, each takes the middle of its band.
 * @returns The hurdle.
 * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
 */
export function create(
  params: AutoMovieArchetypeHurdle.IParams,
  seed?: number,
): AutoMovieArchetype<AutoMovieArchetypeHurdle.Affordance, AutoMovieArchetypeHurdle.Dimension> {
  const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeHurdle.Dimension> =
    new AutoMovieArchetypeDrawSession<AutoMovieArchetypeHurdle.Dimension>(
      "hurdle",
      AutoMovieArchetypeHurdle.UNITS,
      seed,
      params,
    );
  const kind: AutoMovieArchetypeHurdle.Kind = ArchetypeDraw.choice(
    "hurdle",
    "kind",
    params.kind,
    AutoMovieArchetypeHurdle.KINDS,
  );
  const d: Record<AutoMovieArchetypeHurdle.Dimension, number> = draw.dimensions(
    AutoMovieArchetypeHurdle.BANDS[kind],
    AutoMovieArchetypeHurdle.BANDS,
  );
  const builder: AutoMovieArchetypeBuilder<
    AutoMovieArchetypeHurdle.Affordance,
    AutoMovieArchetypeHurdle.Dimension
  > = new AutoMovieArchetypeBuilder({
    material: "composite",
    id: params.id,
    name: "hurdle",
    draw,
  });
  const v: typeof Vector3.create = Vector3.create;
  const bar: number = AutoMovieArchetypeHurdle.BAR;
  const foot: number = AutoMovieArchetypeHurdle.FOOT;
  const post: number = AutoMovieArchetypeHurdle.POST;
  for (const side of [-1, 1] as const) {
    const x: number = (side * (d.width - post)) / 2;
    builder.box(
      side < 0 ? "leftFoot" : "rightFoot",
      v(post, post, foot),
      v(x, post / 2, foot / 2),
      { color: "#2c2f33" },
    );
    builder.rod(
      side < 0 ? "leftUpright" : "rightUpright",
      post / 2,
      v(x, post, 0),
      v(x, d.height - bar, 0),
      { color: "#8a8d91" },
    );
  }
  builder.box(
    "bar",
    v(d.width, bar, AutoMovieArchetypeHurdle.BAR_DEPTH),
    v(0, d.height - bar / 2, 0),
    { color: "#f2f2f2", density: 0.3 },
  );
  builder.affordance({
    id: "top",
    kind: "ledge",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, d.height, -AutoMovieArchetypeHurdle.BAR_DEPTH / 2),
      v(0, 1, 0),
      v(-1, 0, 0),
    ),
    extent: null,
    length: d.width,
  });
  builder.affordance({
    id: "bar",
    kind: "bar",
    symmetry: "half",
    frame: AutoMovieArchetypeFrame.facing(
      v(0, d.height - bar / 2, 0),
      v(0, 0, -1),
      v(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: AutoMovieArchetypeHurdle.BAR_DEPTH,
    length: d.width,
  });
  return builder.build(d.mass);
}
}

/** Companion types, constants and bands of {@link createHurdle}. */
export namespace AutoMovieArchetypeHurdle {
  /**
   * The races: the men's 110 m and the women's 100 m sprint hurdles, and the
   * men's and the women's 400 m hurdles.
   */
  export type Kind = "men110" | "women100" | "men400" | "women400";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "men110",
    "women100",
    "men400",
    "women400",
  ];

  /** The top bar's height, metres: the rule's 70 mm. */
  export const BAR: number = 0.07;

  /**
   * The top bar's depth front to back, metres: inside the rule's 10 to 25 mm,
   * an estimate.
   */
  export const BAR_DEPTH: number = 0.02;

  /**
   * The feet's length back from the uprights, metres: under the rule's 0.70 m,
   * an estimate.
   */
  export const FOOT: number = 0.6;

  /** The uprights' and feet's thickness, metres: an estimate. */
  export const POST: number = 0.03;

  /**
   * The affordance ids:
   *
   * - `top`: the top bar's upper front edge along `+X`, `+Y` up, `+Z` toward the
   *   runner.
   * - `bar`: the top bar, taken from the runner's side.
   */
  export type Affordance = "top" | "bar";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `height`: the top bar's top above the track.
   * - `width`: across the lane, the uprights' outsides.
   * - `mass`: kilograms.
   */
  export type Dimension = "height" | "width" | "mass";

  /** Each dimension's unit, which its band and any model's figure for it share. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    height: "m",
    width: "m",
    mass: "kg",
  };

  /**
   * The parameters: the race, and any free dimension fixed to a value inside
   * its band.
   */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which race. */
    kind: Kind;

    /** The model's id, unique in a scene; `hurdle` when absent. */
    id?: string;
  }

  /** A height band: the rule's height to 3 mm either way. */
  const height = (metres: number, race: string): IAutoMovieArchetypeBand =>
    AutoMovieArchetypeBand.metres(
      metres - 0.003,
      metres + 0.003,
      `${RULE}: the ${race} ${metres.toFixed(3)} m, with a 3 mm tolerance above and below`,
    );

  /** The height band of each race. */
  export const HEIGHTS: Readonly<Record<Kind, IAutoMovieArchetypeBand>> = {
    men110: height(1.067, "men's 110 m"),
    women100: height(0.838, "women's 100 m"),
    men400: height(0.914, "men's 400 m"),
    women400: height(0.762, "women's 400 m"),
  };

  /** The bands every race shares. */
  export const SHARED: Readonly<
    Record<"width" | "mass", IAutoMovieArchetypeBand>
  > = {
    width: AutoMovieArchetypeBand.metres(
      1.18,
      1.2,
      `${RULE}: 1.18 to 1.20 m wide`,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      10,
      12,
      `${RULE}: not less than 10 kg; the rule sets no upper end, and no maker's weight was read`,
      true,
    ),
  };

  /**
   * Each race's bands, its height with the shared width and mass, the table
   * every producer draws from and the gallery lists.
   */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Record<Dimension, IAutoMovieArchetypeBand>>>
  > = {
    men110: { ...SHARED, height: HEIGHTS.men110 },
    women100: { ...SHARED, height: HEIGHTS.women100 },
    men400: { ...SHARED, height: HEIGHTS.men400 },
    women400: { ...SHARED, height: HEIGHTS.women400 },
  };
}
