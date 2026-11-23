import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetype } from "../core";
import { StickBuild } from "./StickBuild";
import type { createStick } from "./createStick";

/** Points in the local model frame, in metres. */
const v: typeof Vector3.create = Vector3.create;

/** The retained field hockey toe length along X, metres. A shape estimate. */
const TOE: number = 0.1;

/**
 * A field hockey stick with a flat head face and round shaft grip.
 *
 * The head sits on the ground at the origin. The shaft points up and the playing face points +Z.
 * @param params The optional identifier and dimensions fixed within their recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice cannot be realized.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the local frame, input defaults and the contacts consumed by motion.
 * @evidence contracts/development/implementation.md#principled-implementation Fit the head and round shaft to the recorded FIH limits and put the contact on the flat playing face.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the profile and build its parts and contacts at the same dimensions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Boxes and rods approximate the toe outline and retain the flat playing contact.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The profile has a fixed number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved recipes call this producer with the original seed namespace and geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call returns an independent model and retains no inputs.
 */
export function createFieldHockeyStick(
  params: createFieldHockeyStick.IParams = {},
  seed?: number | string,
): AutoMovieArchetype<
  createFieldHockeyStick.Affordance,
  createFieldHockeyStick.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<typeof StickBuild.draw<createFieldHockeyStick.Affordance>> =
    StickBuild.draw("fieldHockey", params, seed);
  const length: number = d.length!;
  const head: number = d.head!;
  const width: number = d.width!;

  const color: string = "#2b5797";
  const toeDepth: number = width / 2;
  builder.box("head", v(TOE, toeDepth, width), v(TOE / 4, toeDepth / 2, 0), {
    color,
  });
  builder.box(
    "toe",
    v(toeDepth, head / 2, width),
    v((3 * TOE) / 4 - toeDepth / 2, head / 4, 0),
    {
      color,
    },
  );
  builder.rod("heel", width / 2, v(0, toeDepth, 0), v(0, head, 0), {
    color,
  });
  builder.rod("shaft", width / 2, v(0, head, 0), v(0, length, 0), {
    color,
  });
  const face: IAutoMovieVector3 = v(TOE / 4, toeDepth / 2, width / 2);
  const faceWidth: number = TOE;
  StickBuild.contacts(builder, length, head, face, faceWidth, "round", width);
  return builder.build(d.mass!);
}

/**
 * The authored parameters and contact names for {@link createFieldHockeyStick}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the profile's dimensions, authoring choices and contacts.
 * @evidence contracts/development/design.md#principled-representation The contact union covers playing and grasp surfaces realized by this shape. Dimensions use metres and mass uses kilograms. The draw checks the retained bands and measured choices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs name only controls this producer accepts, and contacts are those built for motion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact identifiers are tied to the geometry this producer constructs.
 */
export namespace createFieldHockeyStick {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "head" | "length" | "mass" | "width";

  /** The named contacts on this stick or bat. */
  export type Affordance = "blade" | "grip";

  /** The identifier and overrides available within this profile. */
  export type IParams = Pick<
    createStick.IParams,
    "id" | "length" | "head" | "width" | "mass"
  >;
}
