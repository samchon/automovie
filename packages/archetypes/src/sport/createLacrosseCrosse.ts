import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { type Archetype, ArchetypeFrame } from "../core";
import { StickBuild } from "./StickBuild";
import type { createStick } from "./createStick";

/** Points in the local model frame, in metres. */
const v: typeof Vector3.create = Vector3.create;

/**
 * A lacrosse crosse with a mesh pocket, scoop and shaft grip.
 *
 * The head lies at the bottom, its face toward +Z. The pocket rests behind the head and the scoop marks its front edge.
 * @param params The optional identifier and dimensions fixed within their recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {ArchetypeRefusal} When a supplied dimension or choice cannot be realized.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the local frame, input defaults and the contacts consumed by motion.
 * @evidence contracts/development/implementation.md#principled-implementation Build the crosse from recorded Sixes dimensions and twelve rim segments around the recessed pocket.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the profile and build its parts and contacts at the same dimensions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Locate the pocket and scoop separately from the blade's front plane.
 * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The profile has a fixed number of parts and contacts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Saved recipes call this producer with the original seed namespace and geometry.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Each call returns an independent model and retains no inputs.
 */
export function createLacrosseCrosse(
  params: createLacrosseCrosse.IParams = {},
  seed?: number | string,
): Archetype<createLacrosseCrosse.Affordance, createLacrosseCrosse.Dimension> {
  const {
    builder,
    d,
  }: ReturnType<typeof StickBuild.draw<createLacrosseCrosse.Affordance>> =
    StickBuild.draw("lacrosse", params, seed);
  const length: number = d.length!;
  const head: number = d.head!;
  const width: number = d.width!;
  const depth: number = d.depth!;

  const section: number = 0.007;
  const pocketDepth: number = 0.045;
  const net: IAutoMovieVector3 = v(0, head / 2, -pocketDepth);
  const rim = (step: number): IAutoMovieVector3 => {
    const angle: number = (2 * Math.PI * step) / 12;
    return v(
      (width / 2 + section) * Math.sin(angle),
      section + ((head - section) * (1 + Math.cos(angle))) / 2,
      0,
    );
  };
  builder.rod("shaft", depth / 2, v(0, head, 0), v(0, length, 0), {
    color: "#28323d",
  });
  for (let step: number = 0; step < 12; ++step) {
    builder.rod(`rim-${step}`, section, rim(step), rim(step + 1), {
      color: "#d2d2cb",
    });
    if (step % 2 === 0)
      builder.rod(`mesh-${step}`, 0.0015, rim(step), net, {
        color: "#aeb2b0",
      });
  }
  // A nominal Sixes ball has about a 32 mm radius and an origin at
  // its bottom. Its centre sits inside the pocket behind the face.
  builder.affordance({
    id: "pocket",
    kind: "surface",
    frame: ArchetypeFrame.upright(v(0, head / 2 - 0.032, -0.018)),
    extent: null,
  });
  builder.affordance({
    id: "scoop",
    kind: "surface",
    direction: "normal",
    frame: ArchetypeFrame.facing(
      v(0, section, section),
      v(0, 0, 1),
      v(1, 0, 0),
    ),
    extent: null,
    width,
    depth: section * 2,
  });
  const face: IAutoMovieVector3 = v(0, head / 2, 0);
  const faceWidth: number = width;
  StickBuild.contacts(builder, length, head, face, faceWidth, "round", depth);
  return builder.build(d.mass!);
}

/**
 * The authored parameters and contact names for {@link createLacrosseCrosse}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the profile's dimensions, authoring choices and contacts.
 * @evidence contracts/development/design.md#principled-representation The contact union covers playing and grasp surfaces realized by this shape. Dimensions use metres and mass uses kilograms. The draw checks the retained bands and measured choices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The inputs name only controls this producer accepts, and contacts are those built for motion.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The contact identifiers are tied to the geometry this producer constructs.
 */
export namespace createLacrosseCrosse {
  /** The dimensions this producer draws or derives, in metres unless the draw records kilograms. */
  export type Dimension = "depth" | "head" | "length" | "mass" | "width";

  /** The named contacts on this stick or bat. */
  export type Affordance = "blade" | "grip" | "pocket" | "scoop";

  /** The identifier and overrides available within this profile. */
  export type IParams = Pick<
    createStick.IParams,
    "id" | "length" | "head" | "width" | "depth" | "mass"
  >;
}
