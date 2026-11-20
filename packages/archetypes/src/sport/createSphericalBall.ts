import { Vector3 } from "@automovie/engine";

import { type Archetype, ArchetypeDraw } from "../core";
import { BallBuild } from "./BallBuild";
import type { createBall } from "./createBall";

/**
 * A spherical ball with a centre grip and upper surface.
 *
 * The model rests on the floor at the origin with its centre one radius above it. Select a sport for size, mass and finish.
 * @param params The sport profile, identifier and dimensions fixed within their bands. Omission selects football.
 * @param seed The seed for free dimensions. The band midpoints apply without a seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {ArchetypeRefusal} When a supplied dimension or choice cannot be realized.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the local frame, input defaults and the contacts consumed by motion.
 * @evidence contracts/development/implementation.md#principled-implementation Build one sphere with the sport's recorded diameter and centre it one radius above the floor.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the profile and build its parts and contacts at the same dimensions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The models retain a smooth surface. The basketball's rigid floor rebound uses the recorded FIBA drop reference.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The profile has a fixed number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved recipes call this producer with the original seed namespace and geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call returns an independent model and retains no inputs.
 */
export function createSphericalBall(
  params: createSphericalBall.IParams = {},
  seed?: number | string,
): Archetype<createSphericalBall.Affordance, createBall.Dimension> {
  const kind: createSphericalBall.Kind = ArchetypeDraw.choice(
    "ball",
    "kind",
    params.kind === undefined ? "football" : params.kind,
    createSphericalBall.KINDS,
  );

  const {
    builder,
    d,
  }: ReturnType<typeof BallBuild.draw<createSphericalBall.Affordance>> =
    BallBuild.draw(kind, params, seed, "composite");
  const diameter: number = d.diameter!;

  builder.ball("ball", diameter / 2, Vector3.create(0, diameter / 2, 0), {
    color: BallBuild.COLORS[kind],
  });
  BallBuild.contacts(builder, diameter, diameter);
  // FIBA 2.4 drop and rebound midpoints for the retained rigid floor fixture.
  return builder.build(
    d.mass!,
    kind === "basketball" ? { restitution: Math.sqrt(1.06 / 1.8) } : undefined,
  );
}

/**
 * The authored parameters and contact names for {@link createSphericalBall}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the profile's dimensions, authoring choices and contacts.
 * @evidence contracts/development/design.md#principled-representation Each contact names a distinct surface or the grasp of this shape. Dimensions use metres and mass uses kilograms. The draw checks the retained bands and measured choices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs name only controls this producer accepts, and contacts are those built for motion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact identifiers are tied to the geometry this producer constructs.
 */
export namespace createSphericalBall {
  /** The contacts used by floor, grip and strike motions. */
  export type Affordance = "grip" | "top";

  /** The sport profiles sharing this shape and its contacts. */
  export const KINDS: readonly Kind[] = BallBuild.KINDS.filter(
    (kind): kind is Kind =>
      kind !== "rugby" && kind !== "americanFootball" && kind !== "puck",
  );

  /** The applicable sport profile. */
  export type Kind = Exclude<
    createBall.Kind,
    "rugby" | "americanFootball" | "puck"
  >;

  /** The identifier, dimensions and choices of this shape. */
  export type IParams = Pick<createBall.IParams, "id" | "diameter" | "mass"> & {
    /** The sport profile. Omission selects football. */
    kind?: Kind;
  };
}
