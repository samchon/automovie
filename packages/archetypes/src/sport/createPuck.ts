import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { BallBuild } from "./BallBuild";
import type { createBall } from "./createBall";

/**
 * An ice hockey puck with a radial playing rim and upper surface.
 *
 * The puck lies flat at the origin. Its length measures thickness along +Y, with the rim contact facing +Z.
 * @param params The optional identifier and dimensions fixed within their recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice cannot be realized.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the local frame, input defaults and the contacts consumed by motion.
 * @evidence contracts/development/implementation.md#principled-implementation Build a disc with the rulebook diameter and thickness. Place the grip and rim midway up its side.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the profile and build its parts and contacts at the same dimensions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The rim is public, so a stick can address the edge separately from the puck's top. Its ground resistance is the cited puck-on-ice sliding friction; it declares no rebound.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The profile has a fixed number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved recipes call this producer with the original seed namespace and geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call returns an independent model and retains no inputs.
 */
export function createPuck(
  params: createPuck.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<createPuck.Affordance, createPuck.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof BallBuild.draw<createPuck.Affordance>> = BallBuild.draw(
    "puck",
    params,
    seed,
    "rubber",
  );
  const diameter: number = d.diameter!;

  const high: number = d.length!;
  const radius: number = diameter / 2;
  builder.rod(
    "ball",
    radius,
    Vector3.create(0, 0, 0),
    Vector3.create(0, high, 0),
    { color: BallBuild.COLORS.puck },
  );
  BallBuild.contacts(builder, diameter, high);
  builder.affordance({
    id: "rim",
    kind: "surface",
    direction: "normal",
    frame: AutoMovieArchetypeFrame.facing(
      Vector3.create(0, high / 2, radius),
      Vector3.create(0, 0, 1),
      Vector3.create(1, 0, 0),
    ),
    extent: null,
    width: diameter,
    depth: high,
  });
  // A puck slides flat on the ice: its ground resistance is its sliding
  // friction on ice, about 0.05 (A. Hache, The Physics of Hockey, 2002).
  return builder.build(d.mass!, { outcome: { rolling: 0.05 } });
}

/**
 * The authored parameters and contact names for {@link createPuck}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the profile's dimensions, authoring choices and contacts.
 * @evidence contracts/development/design.md#principled-representation Each contact names a distinct surface or the grasp of this shape. Dimensions use metres and mass uses kilograms. The draw checks the retained bands and measured choices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs name only controls this producer accepts, and contacts are those built for motion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact identifiers are tied to the geometry this producer constructs.
 */
export namespace createPuck {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "diameter" | "length" | "mass";

  /** The contacts used by floor, grip and strike motions. */
  export type Affordance = "grip" | "rim" | "top";

  /** The identifier, dimensions and choices of this shape. */
  export type IParams = Pick<
    createBall.IParams,
    "id" | "diameter" | "length" | "mass"
  >;
}
