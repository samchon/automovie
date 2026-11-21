import { Vector3 } from "@automovie/engine";

import { type Archetype, type ArchetypeBuilder, ArchetypeFrame } from "../core";
import { GoalBuild } from "./GoalBuild";
import type { createGoal } from "./createGoal";

/** The builder for this field or court apparatus. */
type Builder = ArchetypeBuilder<
  createVolleyballNet.Affordance,
  createGoal.Dimension
>;

/** The saved goal dimensions in their local units. */
type Drawn = Partial<Record<createGoal.Dimension, number>>;

/** Local points in metres. */
const v: typeof Vector3.create = Vector3.create;

/** The half side line spacing of a volleyball court, metres: the net's side bands 9 m apart (FIVB 2.2, its 9.50 m less two 25 cm). */
const VOLLEYBALL_SIDE: number = 4.5;

/** How far a volleyball antenna stands above the net, metres: FIVB 2.4, its top 80 cm; it reaches the net's lower edge below. */
const ANTENNA_ABOVE: number = 0.8;

/** The construction sizes no source read gives, metres, each an estimate no act reads and no band declares: `post`, a volleyball post's diameter; `mesh`, a net's thickness; `antenna`, half of FIVB's 10 mm antenna. */
const ESTIMATES: Readonly<{ post: number; mesh: number; antenna: number }> = {
  post: 0.1,
  mesh: 0.005,
  antenna: 0.005,
};

/**
 * A volleyball net with class-specific height, side antennas and post grips.
 *
 * The net extends along X. Top marks its upper edge and its two posts stand on the floor.
 * @param params The identifier, net class and optional dimensions. The class supplies the top height.
 * @param seed The seed draws the class and free dimensions. Without a seed, the men's class and band midpoints apply.
 * @returns The model with its named contacts in its local frame.
 * @throws {ArchetypeRefusal} When a supplied dimension or choice cannot be realized.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the local frame, input defaults and the contacts consumed by motion.
 * @evidence contracts/development/implementation.md#principled-implementation Use the chosen FIVB class height and the drawn net width and post offsets to place the net, posts and antennas.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the profile and build its parts and contacts at the same dimensions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The top height comes from the class. The coarse net and post cross sections retain the named estimates.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The profile has a fixed number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved recipes call this producer with the original seed namespace and geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call returns an independent model and retains no inputs.
 */
export function createVolleyballNet(
  params: createVolleyballNet.IParams = {},
  seed?: number | string,
): Archetype<createVolleyballNet.Affordance, createVolleyballNet.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof GoalBuild.draw<createVolleyballNet.Affordance>> =
    GoalBuild.draw("volleyballNet", params, seed);
  volleyball(builder, d);
  return builder.build(d.mass!);
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
    builder.rod(
      id,
      ESTIMATES.post / 2,
      v(sign * x, 0, 0),
      v(sign * x, d.post!, 0),
      {
        color: "#d0d4d8",
      },
    );
  builder.box(
    "net",
    v(d.width!, depth, ESTIMATES.mesh),
    v(0, top - depth / 2, 0),
    {
      color: "#1d1d1d",
      density: 0.05,
    },
  );
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
  GoalBuild.posts(builder, x, d.post!);
}

/**
 * The authored parameters and contact names for {@link createVolleyballNet}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the profile's dimensions, authoring choices and contacts.
 * @evidence contracts/development/design.md#principled-representation Each affordance belongs to the constructed goal or net. Dimensions use metres and mass uses kilograms. The draw checks the retained bands and measured choices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs name only controls this producer accepts, and contacts are those built for motion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact identifiers are tied to the geometry this producer constructs.
 */
export namespace createVolleyballNet {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension =
    | "board"
    | "height"
    | "mass"
    | "offset"
    | "post"
    | "width";

  /** The contact identifiers for the apparatus. */
  export type Affordance = "leftPost" | "rightPost" | "top";

  /** The identifier and overrides that apply to this profile. */
  export type IParams = Pick<
    createGoal.IParams,
    "id" | "width" | "board" | "offset" | "post" | "mass" | "net"
  >;
}
