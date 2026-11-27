import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetype } from "../core";
import { StickBuild } from "./internal/StickBuild";
import type { AutoMovieArchetypeStick } from "./AutoMovieArchetypeStick";

/** Canonical producer and authoring contract for FieldHockeyStick. */
export namespace AutoMovieArchetypeFieldHockeyStick {
  /**
   * A field hockey stick with a flat head face and round shaft grip.
   *
   * The head sits on the ground at the origin. The shaft points up and the
   * playing face points +Z.
   *
   * @param params The optional identifier and dimensions fixed within their
   *   recorded bands.
   * @param seed The seed for free dimensions. The band midpoints apply without a
   *   seed.
   * @returns The model with its named contacts in its local frame.
   * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
   *   cannot be realized.
   */
  export function create(
    params: AutoMovieArchetypeFieldHockeyStick.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<
    AutoMovieArchetypeFieldHockeyStick.Affordance,
    AutoMovieArchetypeFieldHockeyStick.Dimension
  > {
    const {
      builder,
      d,
    }: ReturnType<typeof StickBuild.draw<AutoMovieArchetypeFieldHockeyStick.Affordance>> =
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
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "head" | "length" | "mass" | "width";

  /** The named contacts on this stick or bat. */
  export type Affordance = "blade" | "grip";

  /** The identifier and overrides available within this profile. */
  export type IParams = Pick<
    AutoMovieArchetypeStick.IParams,
    "id" | "length" | "head" | "width" | "mass"
  >;
}

/*
 * Points in the local model frame, in metres.
 */
const v: typeof Vector3.create = Vector3.create;

/*
 * The retained field hockey toe length along X, metres. A shape estimate.
 */
const TOE: number = 0.1;
