import { Vector3 } from "@automovie/engine";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../core";
import { BallBuild } from "./internal/BallBuild";
import type { AutoMovieArchetypeBall } from "./AutoMovieArchetypeBall";

/** Canonical producer and authoring contract for Puck. */
export namespace AutoMovieArchetypePuck {
  /**
   * The dimensions this producer draws or derives, in metres unless the draw
   * records kilograms.
   */
  export type Dimension = "diameter" | "length" | "mass";

  /** The contacts used by floor, grip and strike motions. */
  export type Affordance = "grip" | "rim" | "top";

  /** The identifier, dimensions and choices of this shape. */
  export type IParams = Pick<
    AutoMovieArchetypeBall.IParams,
    "id" | "diameter" | "length" | "mass"
  >;

  /**
   * An ice hockey puck with a radial playing rim and upper surface.
   *
   * The puck lies flat at the origin. Its length measures thickness along +Y,
   * with the rim contact facing +Z.
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
    params: AutoMovieArchetypePuck.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<AutoMovieArchetypePuck.Affordance, AutoMovieArchetypePuck.Dimension> {
    const {
      builder,
      d,
    }: ReturnType<typeof BallBuild.draw<AutoMovieArchetypePuck.Affordance>> = BallBuild.draw(
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
}
