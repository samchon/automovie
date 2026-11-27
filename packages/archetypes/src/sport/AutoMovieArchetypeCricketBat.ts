import { AutoMovieEngineVector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { AutoMovieArchetype } from "../core";
import { StickBuild } from "./internal/StickBuild";
import type { AutoMovieArchetypeStick } from "./AutoMovieArchetypeStick";

/** Canonical producer and authoring contract for CricketBat. */
export namespace AutoMovieArchetypeCricketBat {
  /**
   * A cricket bat with a flat blade and two-hand handle grip.
   *
   * The bat stands on its toe with the handle along +Y and the blade face toward
   * +Z.
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
    params: AutoMovieArchetypeCricketBat.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypeCricketBat.Affordance, AutoMovieArchetypeCricketBat.Dimension> {
    const {
      builder,
      d,
    }: ReturnType<typeof StickBuild.draw<AutoMovieArchetypeCricketBat.Affordance>> =
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
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "depth" | "head" | "length" | "mass" | "width";

  /** The named contacts on this stick or bat. */
  export type Affordance = "blade" | "grip";

  /** The identifier and overrides available within this profile. */
  export type IParams = Pick<
    AutoMovieArchetypeStick.IParams,
    "id" | "length" | "head" | "width" | "depth" | "mass"
  >;
}

/*
 * Points in the local model frame, in metres.
 */
const v: typeof AutoMovieEngineVector3.create = AutoMovieEngineVector3.create;

/*
 * The retained cricket handle diameter, metres. A shape estimate.
 */
const HANDLE: number = 0.035;
