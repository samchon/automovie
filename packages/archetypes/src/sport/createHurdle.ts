import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBand,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";

/** World Athletics' hurdle rule as recalled, not read here. */
const RULE: string = "World Athletics Technical Rules, the hurdles";

/**
 * A track hurdle of a sprint or a 400 m hurdles race.
 *
 * It stands across the lane, its top bar along `X` centred over the origin with its face toward `-Z`, the way the runner comes, and its two feet running back along `+Z` from the uprights. `top` is the top bar's upper edge, the edge a hurdler's lead leg clears, along `+X` with `+Y` up and `+Z` out of its face toward the runner; `bar` the top bar itself, a rod a hand may take.
 *
 * @param params The race and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The hurdle.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the hurdle stands, which side the runner comes from and its two contacts.
 * @evidence contracts/development/implementation.md#principled-implementation Two upright rods at the drawn width's ends, a foot box under each running back from it, and a top bar box of the rule's depth whose top is the drawn height.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, feet, uprights and bar, then the two contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No counterweights or toppling force; the feet's and uprights' sizes are named estimates.
 * @evidence contracts/development/implementation.md#efficient-algorithms Five parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createHurdle(
  params: createHurdle.IParams,
  seed?: number | string,
): Archetype<createHurdle.Affordance, createHurdle.Dimension> {
  const kind: createHurdle.Kind = ArchetypeDraw.choice(
    "hurdle",
    "kind",
    params.kind,
    createHurdle.KINDS,
  );
  const d: Record<createHurdle.Dimension, number> = ArchetypeDraw.dimensions(
    "hurdle",
    { ...createHurdle.SHARED, height: createHurdle.HEIGHTS[kind] },
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createHurdle.Affordance,
    createHurdle.Dimension
  > = new ArchetypeBuilder({
    archetype: "hurdle",
    id: params.id,
    name: "hurdle",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const bar: number = createHurdle.BAR;
  const foot: number = createHurdle.FOOT;
  const post: number = createHurdle.POST;
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
    v(d.width, bar, createHurdle.BAR_DEPTH),
    v(0, d.height - bar / 2, 0),
    { color: "#f2f2f2", density: 0.3 },
  );
  builder.affordance({
    id: "top",
    kind: "ledge",
    frame: ArchetypeFrame.facing(
      v(0, d.height, -createHurdle.BAR_DEPTH / 2),
      v(0, 1, 0),
      v(-1, 0, 0),
    ),
    extent: null,
    length: d.width,
  });
  builder.affordance({
    id: "bar",
    kind: "bar",
    frame: ArchetypeFrame.facing(
      v(0, d.height - bar / 2, 0),
      v(0, 0, -1),
      v(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: createHurdle.BAR_DEPTH,
    length: d.width,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, constants and bands of {@link createHurdle}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and constant states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation A closed union of the senior races, each its rule's height to 3 mm; the width and the mass shared.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The edge a hurdler clears and the bar a hand takes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The rule was recalled and not read here, so every band is provisional; the feet's and uprights' sizes are named estimates.
 */
export namespace createHurdle {
  /** The races: the men's 110 m and the women's 100 m sprint hurdles, and the men's and the women's 400 m hurdles. */
  export type Kind = "men110" | "women100" | "men400" | "women400";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = ["men110", "women100", "men400", "women400"];

  /** The top bar's height, metres: the rule's 70 mm. */
  export const BAR: number = 0.07;

  /** The top bar's depth front to back, metres: inside the rule's 10 to 25 mm, an estimate. */
  export const BAR_DEPTH: number = 0.02;

  /** The feet's length back from the uprights, metres: under the rule's 0.70 m, an estimate. */
  export const FOOT: number = 0.6;

  /** The uprights' and feet's thickness, metres: an estimate. */
  export const POST: number = 0.03;

  /**
   * The affordance ids:
   *
   * - `top`: the top bar's upper front edge along `+X`, `+Y` up, `+Z` toward the runner.
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

  /** The parameters: the race, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which race. */
    kind: Kind;

    /** The model's id, unique in a scene; `hurdle` when absent. */
    id?: string;
  }

  /** A height band: the rule's height to 3 mm either way. */
  const height = (metres: number, race: string): IArchetypeBand =>
    ArchetypeBand.metres(
      metres - 0.003,
      metres + 0.003,
      `${RULE}: the ${race} ${metres.toFixed(3)} m, to 3 mm`,
      true,
    );

  /** The height band of each race. */
  export const HEIGHTS: Readonly<Record<Kind, IArchetypeBand>> = {
    men110: height(1.067, "men's 110 m"),
    women100: height(0.838, "women's 100 m"),
    men400: height(0.914, "men's 400 m"),
    women400: height(0.762, "women's 400 m"),
  };

  /** The bands every race shares. */
  export const SHARED: Readonly<Record<"width" | "mass", IArchetypeBand>> = {
    width: ArchetypeBand.metres(1.18, 1.2, `${RULE}: 1.18 to 1.20 m wide`, true),
    mass: ArchetypeBand.of(
      "kg",
      10,
      12,
      `${RULE}: at least 10 kg; the upper end is a maker's`,
      true,
    ),
  };
}
