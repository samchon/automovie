import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";
import { GOAL_BANDS } from "./GOAL_BANDS";

/** The builder every construction fills. */
type Builder = ArchetypeBuilder<createGoal.Affordance, createGoal.Dimension>;

/** The drawn dimensions. */
type Drawn = Partial<Record<createGoal.Dimension, number>>;

/** The shorthand every construction uses. */
const v: typeof Vector3.create = Vector3.create;

/** How far the backboard's bottom edge lies below the ring's top, metres: FIBA Basketball Equipment 1.1.5, the rectangle's base level with the ring's top and 150 mm above the backboard's bottom edge. */
const BOARD_BELOW_RING: number = 0.15;

/** The half side line spacing of a volleyball court, metres: the net's side bands 9 m apart (FIVB 2.2, its 9.50 m less two 25 cm). */
const VOLLEYBALL_SIDE: number = 4.5;

/** How far a volleyball antenna stands above the net, metres: FIVB 2.4, its top 80 cm; it reaches the net's lower edge below. */
const ANTENNA_ABOVE: number = 0.8;

/** How far a tennis post may stand above the net cord, metres: ITF Rule 1, 2.5 cm, the limit the model takes. */
const POST_ABOVE: number = 0.025;

/** The tennis net cord's diameter, metres: ITF Rule 1, at most 0.8 cm, the limit the model takes. */
const CORD: number = 0.008;

/** The width of the tennis net's centre strap, metres: ITF Rule 1, at most 5 cm, the limit the model takes. */
const STRAP: number = 0.05;

/** How many rods a basketball ring is drawn with. */
const RING_RODS: number = 16;

/** The construction sizes no source read gives, metres, each an estimate no act reads and no band declares: `post`, a volleyball post's diameter; `mesh`, a net's thickness; `antenna`, half of FIVB's 10 mm antenna. */
const ESTIMATES: Readonly<{ post: number; mesh: number; antenna: number }> = {
  post: 0.1,
  mesh: 0.005,
  antenna: 0.005,
};

/**
 * A goal or net of a game: a football goal, a basketball hoop, a volleyball net or a tennis net.
 *
 * Each stands in the `XY` plane through the origin on the ground, its span along `X` and the field toward `+Z`; a basketball hoop's backboard faces `+Z` from that plane with its ring out over the court, and is mounted by the production on a wall or a stand. Each kind's construction says what it declares.
 *
 * No source read names what it rests on, so its body's friction is the builder's 0.5 placeholder (`ArchetypeFriction`).
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The goal or net.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or one only another kind has.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the shared frame and where each kind is described.
 * @evidence contracts/development/implementation.md#principled-implementation Draws the kind's bands and builds its construction from them.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then one construction per kind.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No goal net, stand or padding; the constructions name their estimates.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms At most twenty parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createGoal(
  params: createGoal.IParams,
  seed?: number | string,
): Archetype<createGoal.Affordance, createGoal.Dimension> {
  const kind: createGoal.Kind = ArchetypeDraw.choice(
    "goal",
    "kind",
    params.kind,
    createGoal.KINDS,
  );
  const d: Drawn = ArchetypeDraw.dimensions(
    "goal",
    createGoal.BANDS[kind],
    seed,
    params,
    createGoal.BANDS,
  );
  const builder: Builder = new ArchetypeBuilder({
    archetype: "goal",
    id: params.id,
    name: createGoal.NAMES[kind],
    dimensions: d,
  });
  if (kind === "footballGoal") football(builder, d);
  else if (kind === "basketballHoop") hoop(builder, d);
  else if (kind === "volleyballNet") volleyball(builder, d);
  else tennis(builder, d);
  return builder.build(d.mass!);
}

/**
 * Declare an upright post as a bar on `+X` or `-X`.
 *
 * @param builder The builder to fill.
 * @param x The post's centre along `X`, metres.
 * @param height Its height, metres.
 * @param aperture Its section, metres, when a source gives it.
 */
function posts(
  builder: Builder,
  x: number,
  height: number,
  aperture?: number,
): void {
  for (const [id, sign] of [
    ["leftPost", 1],
    ["rightPost", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "bar",
      symmetry: aperture === undefined ? "round" : "half",
      frame: ArchetypeFrame.facing(
        v(sign * x, height / 2, 0),
        v(0, 0, 1),
        v(0, 1, 0),
      ),
      extent: null,
      grip: "power",
      ...(aperture === undefined ? {} : { aperture }),
      length: height,
    });
}

/**
 * Build a football goal: two square posts on the goal line and the crossbar on them, the mouth between; `crossbar` and the posts are bars, `mouth` the opening a ball passes.
 *
 * @param builder The builder to fill.
 * @param d The drawn dimensions.
 */
function football(builder: Builder, d: Drawn): void {
  const half: number = d.width! / 2;
  const height: number = d.height!;
  const bar: number = d.bar!;
  const x: number = half + bar / 2;
  for (const [id, sign] of [
    ["post-left", 1],
    ["post-right", -1],
  ] as const)
    builder.box(id, v(bar, height + bar, bar), v(sign * x, (height + bar) / 2, 0), {
      color: "#f7f7f7",
    });
  builder.box("crossbar", v(d.width! + 2 * bar, bar, bar), v(0, height + bar / 2, 0), {
    color: "#f7f7f7",
  });
  builder.affordance({
    id: "crossbar",
    kind: "bar",
    symmetry: "half",
    frame: ArchetypeFrame.facing(
      v(0, height + bar / 2, 0),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    grip: "power",
    aperture: bar,
    length: d.width! + 2 * bar,
  });
  posts(builder, x, height, bar);
  builder.affordance({
    id: "mouth",
    kind: "aperture",
    frame: ArchetypeFrame.upright(v(0, 0, 0)),
    extent: null,
    width: d.width!,
    height,
  });
}

/**
 * Build a basketball hoop: the backboard, the ring out from its face on a bracket, the ring's top at the rule's height; `rim` is the ring's front, a bar, and `board` the backboard's face.
 *
 * @param builder The builder to fill.
 * @param d The drawn dimensions.
 */
function hoop(builder: Builder, d: Drawn): void {
  const bottom: number = d.height! - BOARD_BELOW_RING;
  const metal: number = d.bar!;
  const y: number = d.height! - metal / 2;
  const radius: number = d.ring! / 2 + metal / 2;
  const centre: number = d.offset! + d.ring! / 2;
  builder.box(
    "backboard",
    v(d.width!, d.board!, d.thickness!),
    v(0, bottom + d.board! / 2, -d.thickness! / 2),
    { color: "#e8f1f5" },
  );
  builder.rod("bracket", metal / 2, v(0, y, 0), v(0, y, d.offset!), {
    color: "#d9531e",
  });
  // Each rod a tangent to the ring's circle at its middle, so the rods' middles lie on the circle.
  const step: number = (2 * Math.PI) / RING_RODS;
  const corner: number = radius / Math.cos(step / 2);
  const at = (angle: number): ReturnType<typeof Vector3.create> =>
    v(corner * Math.sin(angle), y, centre + corner * Math.cos(angle));
  for (let k: number = 0; k < RING_RODS; k++)
    builder.rod(`ring-${k + 1}`, metal / 2, at((k - 0.5) * step), at((k + 0.5) * step), {
      color: "#d9531e",
    });
  builder.affordance({
    id: "rim",
    kind: "bar",
    symmetry: "round",
    frame: ArchetypeFrame.facing(v(0, y, centre + radius), v(0, 0, 1), v(1, 0, 0)),
    extent: null,
    grip: "hook",
    aperture: metal,
    length: 2 * radius * Math.tan(step / 2),
  });
  builder.affordance({
    id: "board",
    kind: "surface",
    frame: ArchetypeFrame.facing(
      v(0, bottom + d.board! / 2, 0),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width: d.width!,
    depth: d.board!,
  });
}

/**
 * Build a volleyball net: the posts outside the side lines, the net hung from its top at the drawn height with its top band, and an antenna over each side line; `top` is the net's top, a ledge along `X`, and the posts are bars.
 *
 * @param builder The builder to fill.
 * @param d The drawn dimensions.
 */
function volleyball(builder: Builder, d: Drawn): void {
  const top: number = d.height!;
  const depth: number = d.board!;
  const x: number = VOLLEYBALL_SIDE + d.offset!;
  for (const [id, sign] of [
    ["post-left", 1],
    ["post-right", -1],
  ] as const)
    builder.rod(id, ESTIMATES.post / 2, v(sign * x, 0, 0), v(sign * x, d.post!, 0), {
      color: "#d0d4d8",
    });
  builder.box("net", v(d.width!, depth, ESTIMATES.mesh), v(0, top - depth / 2, 0), {
    color: "#1d1d1d",
    density: 0.05,
  });
  for (const [id, sign] of [
    ["antenna-left", 1],
    ["antenna-right", -1],
  ] as const)
    builder.rod(
      id,
      ESTIMATES.antenna,
      v(sign * VOLLEYBALL_SIDE, top - depth, 0),
      v(sign * VOLLEYBALL_SIDE, top + ANTENNA_ABOVE, 0),
      { color: "#e53935" },
    );
  builder.affordance({
    id: "top",
    kind: "ledge",
    frame: ArchetypeFrame.facing(v(0, top, 0), v(0, 1, 0), v(1, 0, 0)),
    extent: null,
    length: d.width!,
  });
  posts(builder, x, d.post!);
}

/**
 * Build a tennis net: square posts outside the doubles court, the cord sagging from the posts' height to the centre's, and the net under it; `top` is the net's lowest point at the centre strap, a ledge along `X`, and the posts are bars.
 *
 * @param builder The builder to fill.
 * @param d The drawn dimensions.
 */
function tennis(builder: Builder, d: Drawn): void {
  const x: number = d.width! / 2 + d.offset!;
  const bar: number = d.bar!;
  const tall: number = d.post! + POST_ABOVE;
  const centre: number = d.height!;
  for (const [id, sign] of [
    ["post-left", 1],
    ["post-right", -1],
  ] as const) {
    builder.box(id, v(bar, tall, bar), v(sign * x, tall / 2, 0), {
      color: "#2e5d3a",
    });
    builder.rod(
      `cord-${id === "post-left" ? "left" : "right"}`,
      CORD / 2,
      v(sign * x, d.post!, 0),
      v(0, centre, 0),
      { color: "#f7f7f7" },
    );
    builder.box(
      `net-${id === "post-left" ? "left" : "right"}`,
      v(x, centre, ESTIMATES.mesh),
      v((sign * x) / 2, centre / 2, 0),
      { color: "#1d1d1d", density: 0.05 },
    );
  }
  builder.affordance({
    id: "top",
    kind: "ledge",
    frame: ArchetypeFrame.facing(v(0, centre, 0), v(0, 1, 0), v(1, 0, 0)),
    extent: null,
    length: STRAP,
  });
  posts(builder, x, tall, bar);
}

/**
 * Companion types, names and bands of {@link createGoal}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance and dimension states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The bars a hand hangs from or grips, the opening a ball passes, the face it banks off and the net top a block reaches over (#3468 N11).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A rule's limit is drawn where it gives no other figure, and says so.
 */
export namespace createGoal {
  /** The kinds of goal. */
  export type Kind =
    | "footballGoal"
    | "basketballHoop"
    | "volleyballNet"
    | "tennisNet";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "footballGoal",
    "basketballHoop",
    "volleyballNet",
    "tennisNet",
  ];

  /** The readable name of each kind. */
  export const NAMES: Readonly<Record<Kind, string>> = {
    footballGoal: "football goal",
    basketballHoop: "basketball hoop",
    volleyballNet: "volleyball net",
    tennisNet: "tennis net",
  };

  /**
   * The affordance ids:
   *
   * - `crossbar`, `mouth`: a football goal's crossbar, a bar, and its opening, an aperture.
   * - `leftPost`, `rightPost`: the upright posts on `+X` and `-X` of a football goal, a volleyball or a tennis net, bars.
   * - `rim`, `board`: a basketball ring's front, a bar, and the backboard's face.
   * - `top`: a net's top as a ledge along `X`: a volleyball net's whole top, a tennis net's lowest point at its centre strap.
   */
  export type Affordance =
    | "crossbar"
    | "mouth"
    | "leftPost"
    | "rightPost"
    | "rim"
    | "board"
    | "top";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `width`: a football goal's mouth, a backboard's width, a volleyball net's length, a tennis court's doubles width.
   * - `height`: a football crossbar's lower edge, a basketball ring's top, a net's top at its centre.
   * - `bar`: a football goal's post and crossbar section, a basketball ring's metal, a tennis post's side.
   * - `board`: a backboard's height or a volleyball net's width; `thickness`: a backboard's.
   * - `ring`: a basketball ring's inside diameter.
   * - `offset`: a basketball ring's nearest point from the backboard, or a net post's distance outside the court.
   * - `post`: a volleyball post's height, or a tennis net's height at its posts.
   * - `mass`: kilograms.
   */
  export type Dimension =
    | "width"
    | "height"
    | "bar"
    | "board"
    | "thickness"
    | "ring"
    | "offset"
    | "post"
    | "mass";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which goal. */
    kind: Kind;

    /** The model's id, unique in a scene; `goal` when absent. */
    id?: string;
  }

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = GOAL_BANDS;
}
