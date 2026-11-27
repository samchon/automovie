import { Vector3 } from "@automovie/engine";

import {
  type AutoMovieArchetype,
} from "../core";
import {
  ArchetypeDraw,
} from "../core/internal/ArchetypeDraw";
import { BallBuild } from "./internal/BallBuild";
import type { AutoMovieArchetypeBall } from "./AutoMovieArchetypeBall";

/** Canonical producer and authoring contract for Oval Ball. */
export namespace AutoMovieArchetypeOvalBall {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "length" | "mass";

  /** The contacts used by floor, grip and strike motions. */
  export type Affordance = "grip" | "top";

  /** The sport profiles sharing this shape and its contacts. */
  export const KINDS: readonly Kind[] = ["rugby", "americanFootball"];

  /** The applicable sport profile. */
  export type Kind = "rugby" | "americanFootball";

  /** The identifier, dimensions and choices of this shape. */
  export interface IParams extends Pick<
    AutoMovieArchetypeBall.IParams,
    "id" | "diameter" | "length" | "mass"
  > {
    /** The sport profile. Omission selects rugby. */
    kind?: Kind;
  }

  /**
   * A rugby or American football with a longitudinal axis and centre grip.
   *
   * The ball rests with its long axis along X, its bottom at ground and its
   * highest point at top.
   *
   * @param params The sport profile, identifier and dimensions fixed within their
   *   bands. Omission selects rugby.
   * @param seed The seed for free dimensions. The band midpoints apply without a
   *   seed.
   * @returns The model with its named contacts in its local frame.
   * @throws {AutoMovieArchetypeRefusal} When a supplied dimension or choice
   *   cannot be realized.
   */
  export function create(
    params: AutoMovieArchetypeOvalBall.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypeOvalBall.Affordance, AutoMovieArchetypeOvalBall.Dimension> {
    const kind: AutoMovieArchetypeOvalBall.Kind = ArchetypeDraw.choice(
      "ball",
      "kind",
      params.kind === undefined ? "rugby" : params.kind,
      AutoMovieArchetypeOvalBall.KINDS,
    );

    const {
      builder,
      d,
    }: ReturnType<typeof BallBuild.draw<AutoMovieArchetypeOvalBall.Affordance>> =
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
}
