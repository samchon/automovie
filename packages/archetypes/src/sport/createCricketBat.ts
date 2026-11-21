import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { Archetype } from "../core";
import { StickBuild } from "./StickBuild";
import type { createStick } from "./createStick";

/** Points in the local model frame, in metres. */
const v: typeof Vector3.create = Vector3.create;

/** The retained cricket handle diameter, metres. A shape estimate. */
const HANDLE: number = 0.035;

/**
 * A cricket bat with a flat blade and two-hand handle grip.
 *
 * The bat stands on its toe with the handle along +Y and the blade face toward +Z.
 * @param params The optional identifier and dimensions fixed within their recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {ArchetypeRefusal} When a supplied dimension or choice cannot be realized.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the local frame, input defaults and the contacts consumed by motion.
 * @evidence contracts/development/implementation.md#principled-implementation Form the blade section and handle length from the recorded MCC limits and put the playing contact on the blade face.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the profile and build its parts and contacts at the same dimensions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The handle diameter retains its named coarse estimate.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The profile has a fixed number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved recipes call this producer with the original seed namespace and geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call returns an independent model and retains no inputs.
 */
export function createCricketBat(
  params: createCricketBat.IParams = {},
  seed?: number | string,
): Archetype<createCricketBat.Affordance, createCricketBat.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof StickBuild.draw<createCricketBat.Affordance>> =
    StickBuild.draw("cricketBat", params, seed);
  const length: number = d.length!;
  const head: number = d.head!;
  const width: number = d.width!;
  const depth: number = d.depth!;

  builder.box("blade", v(width, head, depth), v(0, head / 2, 0), {
    color: "#e8d3a1",
  });
  builder.rod("handle", HANDLE / 2, v(0, head, 0), v(0, length, 0), {
    color: "#1d1d1d",
  });
  const face: IAutoMovieVector3 = v(0, head / 2, depth / 2);
  const faceWidth: number = width;
  StickBuild.contacts(builder, length, head, face, faceWidth, "round");
  return builder.build(d.mass!);
}

/**
 * The authored parameters and contact names for {@link createCricketBat}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the profile's dimensions, authoring choices and contacts.
 * @evidence contracts/development/design.md#principled-representation The contact union covers playing and grasp surfaces realized by this shape. Dimensions use metres and mass uses kilograms. The draw checks the retained bands and measured choices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs name only controls this producer accepts, and contacts are those built for motion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact identifiers are tied to the geometry this producer constructs.
 */
export namespace createCricketBat {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "depth" | "head" | "length" | "mass" | "width";

  /** The named contacts on this stick or bat. */
  export type Affordance = "blade" | "grip";

  /** The identifier and overrides available within this profile. */
  export type IParams = Pick<
    createStick.IParams,
    "id" | "length" | "head" | "width" | "depth" | "mass"
  >;
}
