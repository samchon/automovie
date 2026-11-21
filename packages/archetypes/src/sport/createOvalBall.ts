import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeDraw } from "../core";
import { BallBuild } from "./BallBuild";
import type { createBall } from "./createBall";

/**
 * A rugby or American football with a longitudinal axis and centre grip.
 *
 * The ball rests with its long axis along X, its bottom at ground and its highest point at top.
 * @param params The sport profile, identifier and dimensions fixed within their bands. Omission selects rugby.
 * @param seed The seed for free dimensions. The band midpoints apply without a seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {ArchetypeRefusal} When a supplied dimension or choice cannot be realized.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the local frame, input defaults and the contacts consumed by motion.
 * @evidence contracts/development/implementation.md#principled-implementation Use a capsule with the selected rulebook length and short diameter. The same diameter determines the grip aperture and height.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the profile and build its parts and contacts at the same dimensions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The retained models approximate the oval body with a spherical end at each end of a straight middle section.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The profile has a fixed number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved recipes call this producer with the original seed namespace and geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call returns an independent model and retains no inputs.
 */
export function createOvalBall(
  params: createOvalBall.IParams = {},
  seed?: number | string,
): Archetype<createOvalBall.Affordance, createOvalBall.Dimension> {
  const kind: createOvalBall.Kind = ArchetypeDraw.choice(
    "ball",
    "kind",
    params.kind === undefined ? "rugby" : params.kind,
    createOvalBall.KINDS,
  );

  const {
    builder,
    d,
  }: ReturnType<typeof BallBuild.draw<createOvalBall.Affordance>> =
    BallBuild.draw(kind, params, seed, "composite");
  const diameter: number = d.diameter!;

  const radius: number = diameter / 2;
  const half: number = d.length! / 2 - radius;
  builder.rod(
    "ball",
    radius,
    Vector3.create(-half, radius, 0),
    Vector3.create(half, radius, 0),
    { color: BallBuild.COLORS[kind], round: true },
  );
  BallBuild.contacts(builder, diameter, diameter);
  return builder.build(d.mass!);
}

/**
 * The authored parameters and contact names for {@link createOvalBall}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the profile's dimensions, authoring choices and contacts.
 * @evidence contracts/development/design.md#principled-representation Each contact names a distinct surface or the grasp of this shape. Dimensions use metres and mass uses kilograms. The draw checks the retained bands and measured choices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs name only controls this producer accepts, and contacts are those built for motion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact identifiers are tied to the geometry this producer constructs.
 */
export namespace createOvalBall {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "diameter" | "length" | "mass";

  /** The contacts used by floor, grip and strike motions. */
  export type Affordance = "grip" | "top";

  /** The sport profiles sharing this shape and its contacts. */
  export const KINDS: readonly Kind[] = ["rugby", "americanFootball"];

  /** The applicable sport profile. */
  export type Kind = "rugby" | "americanFootball";

  /** The identifier, dimensions and choices of this shape. */
  export interface IParams extends Pick<
    createBall.IParams,
    "id" | "diameter" | "length" | "mass"
  > {
    /** The sport profile. Omission selects rugby. */
    kind?: Kind;
  }
}
