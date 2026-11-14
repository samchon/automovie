import { Vector3 } from "@automovie/engine";

import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
  type IArchetypeBand,
} from "../core";
import { OBSTACLE_BANDS } from "./OBSTACLE_BANDS";

/**
 * A low obstacle or a barrier on the ground: a railway crosstie, a filled sandbag, a portable concrete barrier, a steel crowd barrier, or two stanchions with a rope between them.
 *
 * Each stands centred on `X` with its back at the origin's `Z` and its front toward `+Z`, the side it is approached from, as `createKerb` stands. A crosstie, a sandbag and a concrete barrier declare `top`, the top face, and `edge`, the top's front edge along `+X` with `+Y` up and `+Z` out of the face below: the near side and depth a stepping-over act reads (`stepOver`), so a crosstie and a sandbag are stepped over and a concrete barrier, 0.81 m high, is refused as cover too high to step. A sandbag also declares `leftEnd` and `rightEnd`, handles on its two ends' tops where it is lifted. A crowd barrier declares `rail`, its top rail, a bar a body leans on or grips. The stanchions declare `rope`, the rope between their tops, and `leftPost` and `rightPost`, the posts gripped to move them, each a bar.
 *
 * @param params The kind and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The obstacle.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or one only another kind has.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how each kind stands, which side is approached, its contacts and which ones a stepping act crosses or refuses.
 * @evidence contracts/development/implementation.md#principled-implementation A crosstie and a sandbag are one box each at their cited section; the concrete barrier is its FHWA profile in three stacked boxes, the lower band as wide as the profile at its mid-height and the upper as wide as the top, the faces' runs worked from their cited angles; the crowd barrier is its end posts, rails, pickets at the cited spacing and two feet; the stanchions are two posts on round bases with a straight rope between their tops.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, then one builder function per kind.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The barrier's sloped faces are stepped, a sandbag is square, a rope does not sag; the crowd barrier's feet and bottom rail and a stanchion's base thickness are named construction estimates (`createObstacle.ESTIMATES`), none placing a contact.
 * @evidence contracts/development/implementation.md#efficient-algorithms One part per piece; a crowd barrier's pickets are its length over their spacing, about twenty.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createObstacle(
  params: createObstacle.IParams,
  seed?: number | string,
): Archetype<createObstacle.Affordance, createObstacle.Dimension> {
  const kind: createObstacle.Kind = ArchetypeDraw.choice(
    "obstacle",
    "kind",
    params.kind,
    createObstacle.KINDS,
  );
  const d: Partial<Record<createObstacle.Dimension, number>> =
    ArchetypeDraw.dimensions(
      "obstacle",
      createObstacle.BANDS[kind],
      seed,
      params,
      createObstacle.BANDS,
    );
  const builder: Builder = new ArchetypeBuilder({
    archetype: "obstacle",
    id: params.id,
    name: NAMES[kind],
    dimensions: d,
  });
  if (kind === "crosstie" || kind === "sandbag") {
    block(builder, d, kind);
    return builder.build(d.mass!);
  }
  if (kind === "jerseyBarrier") {
    jersey(builder, d);
    return builder.build(d.massPerMetre! * d.length!);
  }
  if (kind === "crowdBarrier") crowd(builder, d);
  else stanchions(builder, d);
  return builder.build(d.mass!);
}

/**
 * Companion types, constants and bands of {@link createObstacle}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each kind, affordance, dimension and estimate states what it is; each band its source.
 * @evidence contracts/development/design.md#principled-representation Closed unions and one cited band per dimension per kind; a concrete barrier's mass is a cited mass per metre times its drawn length.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The edge, height and depth `stepOver` reads, the rails leaned on and the ends a bag is lifted by (#3468 F3: it replaces the 0.3 m box the step-over stage builds by hand).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts `top` and `edge` keep `createKerb`'s meaning, so one stepping act reads every low obstacle the same way.
 */
export namespace createObstacle {
  /** The kinds of obstacle. */
  export type Kind =
    | "crosstie"
    | "sandbag"
    | "jerseyBarrier"
    | "crowdBarrier"
    | "ropeAndPosts";

  /** Every kind, for a caller that reads one at run time. */
  export const KINDS: readonly Kind[] = [
    "crosstie",
    "sandbag",
    "jerseyBarrier",
    "crowdBarrier",
    "ropeAndPosts",
  ];

  /**
   * The affordance ids, by kind:
   *
   * - crosstie, sandbag, jerseyBarrier: `top` (surface), `edge` (ledge, the top's front edge);
   * - sandbag: also `leftEnd`, `rightEnd` (handles on its ends' tops, at `+X` and `-X`);
   * - crowdBarrier: `rail` (bar, the top rail);
   * - ropeAndPosts: `rope` (bar), `leftPost`, `rightPost` (bars, the posts at `+X` and `-X`, each along `+Y`).
   */
  export type Affordance =
    | "top"
    | "edge"
    | "leftEnd"
    | "rightEnd"
    | "rail"
    | "rope"
    | "leftPost"
    | "rightPost";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `length`: along `X`; for the stanchions, the rope's.
   * - `height`: the top above the ground; for the stanchions, a post's.
   * - `width`: along `Z`, a crosstie's face or a sandbag's laid width; a concrete barrier's base.
   * - `top`, `curb`, `lowerFace`: a concrete barrier's top width, its vertical curb and the height of its lower sloped face.
   * - `tube`, `spacing`: a crowd barrier's tube and its pickets' spacing.
   * - `post`, `base`, `ropeDiameter`: a stanchion's post and base diameters and the rope's.
   * - `mass`: kilograms; `massPerMetre`: a concrete barrier's, kilograms per metre of length.
   */
  export type Dimension =
    | "length"
    | "height"
    | "width"
    | "top"
    | "curb"
    | "lowerFace"
    | "tube"
    | "spacing"
    | "post"
    | "base"
    | "ropeDiameter"
    | "mass"
    | "massPerMetre";

  /** The parameters: the kind, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Which obstacle. */
    kind: Kind;

    /** The model's id, unique in a scene; `obstacle` when absent. */
    id?: string;
  }

  /** The angle of a concrete barrier's lower face from the ground, degrees, as FHWA-RD-89-036 Figure 1 gives it. */
  export const LOWER_FACE: number = 55;

  /**
   * The construction sizes no source read gives, metres, each an estimate no act reads and no band declares:
   *
   * - `foot`: a crowd barrier's foot, front to back; `bottomRail`: its bottom rail's height; `picket`: a picket's diameter.
   * - `plate`: a stanchion base's thickness.
   */
  export const ESTIMATES: Readonly<{
    foot: number;
    bottomRail: number;
    picket: number;
    plate: number;
  }> = {
    foot: 0.6,
    bottomRail: 0.15,
    picket: 0.016,
    plate: 0.03,
  };

  /** The band of each free dimension, by kind. */
  export const BANDS: Readonly<
    Record<Kind, Readonly<Partial<Record<Dimension, IArchetypeBand>>>>
  > = OBSTACLE_BANDS;
}

/** The builder every kind's function fills. */
type Builder = ArchetypeBuilder<
  createObstacle.Affordance,
  createObstacle.Dimension
>;

/** The drawn dimensions of one kind. */
type Drawn = Partial<Record<createObstacle.Dimension, number>>;

/** Each kind's readable name. */
const NAMES: Readonly<Record<createObstacle.Kind, string>> = {
  crosstie: "railway crosstie",
  sandbag: "sandbag",
  jerseyBarrier: "concrete barrier",
  crowdBarrier: "crowd barrier",
  ropeAndPosts: "rope and posts",
};

/** The shorthand every builder below uses. */
const v: typeof Vector3.create = Vector3.create;

/** The estimates, shortened. */
const E: typeof createObstacle.ESTIMATES = createObstacle.ESTIMATES;

/**
 * The top face and its front edge of an obstacle `height` high whose top runs `length` along `X` and `depth` along `Z`, centred on `centre`.
 *
 * @param builder The builder.
 * @param height The top's height, metres.
 * @param length The top along `X`, metres.
 * @param depth The top along `Z`, metres.
 * @param centre The top's middle along `Z`, metres.
 */
function crossing(
  builder: Builder,
  height: number,
  length: number,
  depth: number,
  centre: number,
): void {
  builder.affordance({
    id: "top",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, height, centre)),
    extent: null,
    width: length,
    depth,
  });
  builder.affordance({
    id: "edge",
    kind: "ledge",
    frame: ArchetypeFrame.facing(v(0, height, centre + depth / 2), v(0, 1, 0), v(1, 0, 0)),
    extent: null,
    length,
  });
}

/**
 * A crosstie or a sandbag: one box lying along `X`, and a sandbag's two end handles.
 *
 * @param builder The builder.
 * @param d The drawn dimensions.
 * @param kind Which of the two.
 */
function block(builder: Builder, d: Drawn, kind: "crosstie" | "sandbag"): void {
  const length: number = d.length!;
  const height: number = d.height!;
  const width: number = d.width!;
  builder.box(kind, v(length, height, width), v(0, height / 2, width / 2), {
    color: kind === "crosstie" ? "#5b4636" : "#b8a47a",
  });
  crossing(builder, height, length, width, width / 2);
  if (kind === "crosstie") return;

  // A bag is lifted by its two ends, a hand on each end's top edge; the grasp reads the bag's own collider for the width.
  for (const [id, sign] of [
    ["leftEnd", 1],
    ["rightEnd", -1],
  ] as const)
    builder.affordance({
      id,
      kind: "handle",
      symmetry: "none",
      frame: ArchetypeFrame.facing(
        v((sign * length) / 2, height, width / 2),
        v(0, 1, 0),
        v(0, 0, 1),
      ),
      extent: null,
      grip: "power",
      length: width,
    });
}

/**
 * A New Jersey portable concrete barrier: its curb, its lower sloped band as wide as the profile at that band's mid-height, and its upper band as wide as its top, so the top and its front edge lie on the drawn top face; the upper faces' batter, 84 degrees from the ground, is not drawn.
 *
 * The profile's width where the faces meet is the base less the lower face's run on both sides, the run being the lower face's height over the tangent of its angle: 254 mm at the cited 610 mm base, 10 in, which the upper face's batter narrows to the 6 in top.
 *
 * @param builder The builder.
 * @param d The drawn dimensions.
 */
function jersey(builder: Builder, d: Drawn): void {
  const length: number = d.length!;
  const base: number = d.width!;
  const curb: number = d.curb!;
  const lower: number = d.lowerFace!;
  const upper: number = d.height! - curb - lower;
  const top: number = d.top!;
  const middle: number =
    base - (2 * lower) / Math.tan((createObstacle.LOWER_FACE * Math.PI) / 180);
  const centre: number = base / 2;
  builder.box("curb", v(length, curb, base), v(0, curb / 2, centre), {
    color: "#b5b2aa",
  });
  builder.box("lower", v(length, lower, (base + middle) / 2), v(0, curb + lower / 2, centre), {
    color: "#b5b2aa",
  });
  builder.box("upper", v(length, upper, top), v(0, curb + lower + upper / 2, centre), {
    color: "#b5b2aa",
  });
  crossing(builder, d.height!, length, top, centre);
}

/**
 * A steel crowd barrier: two end posts on feet running front to back, a top and a bottom rail between them and pickets at the cited spacing.
 *
 * @param builder The builder.
 * @param d The drawn dimensions.
 */
function crowd(builder: Builder, d: Drawn): void {
  const length: number = d.length!;
  const height: number = d.height!;
  const r: number = d.tube! / 2;
  const z: number = E.foot / 2;
  const rail: number = height - r;
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    const x: number = (sign * (length / 2 - r));
    builder.rod(`foot-${side}`, r, v(x, r, 0), v(x, r, E.foot), { color: "#a7abb0" });
    builder.rod(`post-${side}`, r, v(x, 2 * r, z), v(x, rail, z), { color: "#a7abb0" });
  }
  builder.rod("rail-top", r, v(-length / 2 + r, rail, z), v(length / 2 - r, rail, z), {
    color: "#a7abb0",
  });
  builder.rod(
    "rail-bottom",
    r,
    v(-length / 2 + r, E.bottomRail, z),
    v(length / 2 - r, E.bottomRail, z),
    { color: "#a7abb0" },
  );
  const span: number = length - 2 * d.tube!;
  const count: number = Math.floor(span / d.spacing!) - 1;
  for (let k: number = 1; k <= count; k++) {
    const x: number = -span / 2 + (span * k) / (count + 1);
    builder.rod(`picket-${k}`, E.picket / 2, v(x, E.bottomRail, z), v(x, rail, z), {
      color: "#a7abb0",
    });
  }
  builder.affordance({
    id: "rail",
    kind: "bar",
    symmetry: "round",
    frame: ArchetypeFrame.facing(v(0, rail, z), v(0, 1, 0), v(1, 0, 0)),
    extent: null,
    grip: "power",
    aperture: d.tube!,
    length: length - 2 * d.tube!,
  });
}

/**
 * Two stanchions a rope's length apart, each a post on a round base, and the rope straight between them at their tops, where its hooks hang.
 *
 * @param builder The builder.
 * @param d The drawn dimensions.
 */
function stanchions(builder: Builder, d: Drawn): void {
  const length: number = d.length!;
  const height: number = d.height!;
  const r: number = d.post! / 2;
  const z: number = d.base! / 2;
  const hang: number = height - d.ropeDiameter! / 2;
  for (const [id, sign] of [
    ["leftPost", 1],
    ["rightPost", -1],
  ] as const) {
    const x: number = (sign * length) / 2;
    builder.rod(`${id}-base`, d.base! / 2, v(x, 0, z), v(x, E.plate, z), {
      color: "#55595f",
    });
    builder.rod(`${id}-post`, r, v(x, E.plate, z), v(x, height, z), {
      color: "#c9a845",
    });
    builder.affordance({
      id,
      kind: "bar",
      symmetry: "round",
      frame: ArchetypeFrame.facing(v(x, height / 2, z), v(0, 0, 1), v(0, 1, 0)),
      extent: null,
      grip: "power",
      aperture: d.post!,
      length: height,
    });
  }
  builder.rod("rope", d.ropeDiameter! / 2, v(-length / 2 + r, hang, z), v(length / 2 - r, hang, z), {
    color: "#8a1c2b",
  });
  builder.affordance({
    id: "rope",
    kind: "bar",
    symmetry: "round",
    frame: ArchetypeFrame.facing(v(0, hang, z), v(0, 1, 0), v(1, 0, 0)),
    extent: null,
    grip: "power",
    aperture: d.ropeDiameter!,
    length: length - d.post!,
  });
}
