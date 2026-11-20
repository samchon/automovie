import { Vector3 } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import { type Archetype, type ArchetypeBuilder, ArchetypeFrame } from "../core";
import { GoalBuild } from "./GoalBuild";
import { buildTennisNet } from "./buildTennisNet";
import type { createGoal } from "./createGoal";

/** The builder for this field or court apparatus. */
type Builder = ArchetypeBuilder<
  createTennisNet.Affordance,
  createGoal.Dimension
>;

/** The saved goal dimensions in their local units. */
type Drawn = Partial<Record<createGoal.Dimension, number>>;

/** Local points in metres. */
const v: typeof Vector3.create = Vector3.create;

/** How far a tennis post may stand above the net cord, metres: ITF Rule 1, 2.5 cm, the limit the model takes. */
const POST_ABOVE: number = 0.025;

/** The tennis net cord's diameter, metres: ITF Rule 1, at most 0.8 cm, the limit the model takes. */
const CORD: number = 0.008;

/** The width of the tennis net's centre strap, metres: ITF Rule 1, at most 5 cm, the limit the model takes. */
const STRAP: number = 0.05;

/** Thickness in metres of the retained collision panels. */
const NET_THICKNESS: number = 0.005;
/**
 * A tennis net with centre strap, sagging cord and post grips.
 *
 * The net spans the XY plane, with the top ledge at the centre strap and the square posts outside the doubles court.
 * @param params The optional identifier and dimensions fixed within their recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {ArchetypeRefusal} When a supplied dimension or choice cannot be realized.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the local frame, input defaults and the contacts consumed by motion.
 * @evidence contracts/development/implementation.md#principled-implementation Use the retained court span, cord heights and post section to make the supports, visible lattice and separate collision panels.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the profile and build its parts and contacts at the same dimensions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keep the visual lattice and tape separate from the solid panels used for collision and mass.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The profile has a fixed number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved recipes call this producer with the original seed namespace and geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call returns an independent model and retains no inputs.
 */
export function createTennisNet(
  params: createTennisNet.IParams = {},
  seed?: number | string,
): Archetype<createTennisNet.Affordance, createGoal.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof GoalBuild.draw<createTennisNet.Affordance>> =
    GoalBuild.draw("tennisNet", params, seed);
  tennis(builder, d);
  return builder.build(d.mass!);
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
  const post: number = d.post!;
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
      v(sign * x, post, 0),
      v(0, centre, 0),
      { color: "#f7f7f7" },
    );
    // These original solid panels retain ball collision and mass behind the open lattice.
    builder.box(
      `net-${id === "post-left" ? "left" : "right"}`,
      v(x, centre, NET_THICKNESS),
      v((sign * x) / 2, centre / 2, 0),
      { color: "#1d1d1d", density: 0.05, opacity: 0 },
    );
  }
  const net: { twine: IAutoMovieMesh; tape: IAutoMovieMesh } = buildTennisNet(
    x,
    centre,
    post,
    CORD,
    STRAP,
  );
  const origin: ReturnType<typeof v> = v(0, 0, 0);
  builder.visualMesh("net-twine", net.twine, origin, { color: "#1d1d1d" });
  builder.visualMesh("net-tape", net.tape, origin, { color: "#f7f7f7" });
  builder.affordance({
    id: "top",
    kind: "ledge",
    frame: ArchetypeFrame.facing(v(0, centre, 0), v(0, 1, 0), v(1, 0, 0)),
    extent: null,
    length: STRAP,
  });
  GoalBuild.posts(builder, x, tall, bar);
}

/**
 * The authored parameters and contact names for {@link createTennisNet}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the profile's dimensions, authoring choices and contacts.
 * @evidence contracts/development/design.md#principled-representation Each affordance belongs to the constructed goal or net. Dimensions use metres and mass uses kilograms. The draw checks the retained bands and measured choices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs name only controls this producer accepts, and contacts are those built for motion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact identifiers are tied to the geometry this producer constructs.
 */
export namespace createTennisNet {
  /** The contact identifiers for the apparatus. */
  export type Affordance = "top" | "leftPost" | "rightPost";

  /** The identifier and overrides that apply to this profile. */
  export type IParams = Pick<
    createGoal.IParams,
    "id" | "width" | "height" | "post" | "offset" | "bar" | "mass"
  >;
}
