import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetype } from "../core";
import { StickBuild } from "./StickBuild";
import type { createStick } from "./createStick";

/** Points in the local model frame, in metres. */
const v: typeof Vector3.create = Vector3.create;

/** The retained ice hockey blade thickness, metres. A shape estimate. */
const BLADE: number = 0.015;

/**
 * An ice hockey stick with a blade face and a two-hand shaft grip.
 *
 * The blade extends along +X from the heel at the model origin. Its striking
 * face points +Z.
 *
 * @param params The optional identifier and dimensions fixed within their
 *   recorded bands.
 * @param seed The seed for free dimensions. The band midpoints apply without a
 *   seed.
 * @returns The model with its named contacts in its local frame.
 * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
 *   cannot be realized.
 */
export function createIceHockeyStick(
  params: createIceHockeyStick.IParams = {},
  seed?: number,
): AutoMovieArchetype<
  createIceHockeyStick.Affordance,
  createIceHockeyStick.Dimension
> {
  const {
    builder,
    d,
  }: ReturnType<typeof StickBuild.draw<createIceHockeyStick.Affordance>> =
    StickBuild.draw("iceHockey", params, seed);
  const length: number = d.length!;
  const head: number = d.head!;
  const width: number = d.width!;
  const depth: number = d.depth!;

  builder.box("blade", v(d.reach!, head, BLADE), v(d.reach! / 2, head / 2, 0), {
    color: "#1d1d1d",
  });
  builder.box(
    "shaft",
    v(width, length - head, depth),
    v(0, (length + head) / 2, 0),
    {
      color: "#d8d8d8",
    },
  );
  const face: IAutoMovieVector3 = v(d.reach! / 2, head / 2, BLADE / 2);
  const faceWidth: number = d.reach!;
  StickBuild.contacts(builder, length, head, face, faceWidth, "half", depth);
  return builder.build(d.mass!);
}

/** The authored parameters and contact names for {@link createIceHockeyStick}. */
export namespace createIceHockeyStick {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension =
    | "depth"
    | "head"
    | "length"
    | "mass"
    | "reach"
    | "width";

  /** The named contacts on this stick or bat. */
  export type Affordance = "blade" | "grip";

  /** The identifier and overrides available within this profile. */
  export type IParams = Pick<
    createStick.IParams,
    "id" | "length" | "head" | "width" | "depth" | "reach" | "mass"
  >;
}
