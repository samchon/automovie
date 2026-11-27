import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  AutoMovieArchetype,
  AutoMovieArchetypeBand,
  AutoMovieArchetypeBuilder,
  AutoMovieArchetypeDrawSession,
  AutoMovieArchetypeFrame,
  type IAutoMovieArchetypeBand,
} from "../core";
import * as AutoMovieArchetypeBellFrameData from "./internal/AutoMovieArchetypeBellFrameData";

/** Creates a deterministic bell frame fixture and exposes its construction parameters. */
export namespace AutoMovieArchetypeBellFrame {
  /**
   * A fixed civic bell in an open timber frame on a low plinth.
   *
   * The floor origin is centred under the bell, with the open front along `+Z`.
   * The `step` contact marks the part of the plinth ahead of the front posts.
   *
   * @param params Dimensions the author fixes, and an optional scene id.
   * @param seed Seed for dimensions left free, or the band midpoints when absent.
   * @returns The scenery, including its front step contact.
   * @throws {AutoMovieArchetypeRefusal} For a fixed dimension outside its band.
   */
  export function create(
    params: AutoMovieArchetypeBellFrame.IParams = {},
    seed?: number,
  ): AutoMovieArchetype<"step", AutoMovieArchetypeBellFrame.Dimension> {
    const draw: AutoMovieArchetypeDrawSession<AutoMovieArchetypeBellFrame.Dimension> =
      new AutoMovieArchetypeDrawSession(
        "bell frame",
        AutoMovieArchetypeBellFrame.UNITS,
        seed,
        params,
      );
    const d: Record<AutoMovieArchetypeBellFrame.Dimension, number> =
      draw.dimensions(AutoMovieArchetypeBellFrame.BANDS);
    const builder: AutoMovieArchetypeBuilder<
      "step",
      AutoMovieArchetypeBellFrame.Dimension
    > = new AutoMovieArchetypeBuilder({
      id: params.id,
      name: "bell frame",
      material: "composite",
      draw,
    });
    const wood: string = "#674d3a";
    const bronze: string = "#7c6546";
    const lip: string = "#4f4636";
    const post: number = d.width * 0.09;
    const halfWidth: number = d.width / 2;
    const halfDepth: number = d.depth / 2;
    const plinthHeight: number = 0.22;
    const stepDepth: number = 0.38;
    const eave: number = d.height - d.width * 0.26;

    builder.box(
      "plinth",
      Vector3.create(d.width, plinthHeight, d.depth + stepDepth),
      Vector3.create(0, plinthHeight / 2, stepDepth / 2),
      { color: "#8a8170" },
    );
    builder.affordance({
      id: "step",
      kind: "surface",
      frame: AutoMovieArchetypeFrame.upright(
        Vector3.create(0, plinthHeight, halfDepth + stepDepth / 2),
      ),
      extent: null,
      width: d.width,
      depth: stepDepth,
    });

    const postHeight: number = eave - plinthHeight;
    for (const side of [-1, 1]) {
      for (const end of [-1, 1])
        builder.box(
          `post-${side}-${end}`,
          Vector3.create(post, postHeight, post),
          Vector3.create(
            side * (halfWidth - post / 2),
            plinthHeight + postHeight / 2,
            end * (halfDepth - post / 2),
          ),
          { color: wood },
        );
      builder.box(
        `side-beam-${side}`,
        Vector3.create(post, post, d.depth - 2 * post),
        Vector3.create(side * (halfWidth - post / 2), eave - post / 2, 0),
        { color: wood },
      );
    }
    builder.box(
      "crossbeam",
      Vector3.create(d.width - 2 * post, post, post),
      Vector3.create(0, eave - post / 2, 0),
      { color: wood },
    );

    // A gable rises from the eaves to one ridge running along Z.
    const canopy: IAutoMovieVector3[] = [];
    for (const z of [-halfDepth - post, halfDepth + post])
      canopy.push(
        Vector3.create(-halfWidth - post, eave, z),
        Vector3.create(halfWidth + post, eave, z),
        Vector3.create(0, d.height, z),
      );
    builder.convex("canopy", canopy, undefined, { color: "#4a4338" });

    const radius: number = Math.min(d.width - 2 * post, d.depth) * 0.32;
    const crown: number = eave - post;
    const mouth: number = crown - radius * 1.6;
    const waist: number = mouth + radius * 0.65;

    // Two tapered sections share the waist ring, leaving the flare visible.
    const ring = (y: number, r: number): IAutoMovieVector3[] =>
      Array.from({ length: 12 }, (_: unknown, i: number): IAutoMovieVector3 => {
        const angle: number = (2 * Math.PI * i) / 12;
        return Vector3.create(r * Math.cos(angle), y, r * Math.sin(angle));
      });
    const waistRing: IAutoMovieVector3[] = ring(waist, radius * 0.62);
    builder.convex(
      "bell-shoulder",
      [...waistRing, ...ring(crown, radius * 0.37)],
      undefined,
      {
        color: bronze,
      },
    );
    builder.convex(
      "bell-flare",
      [...ring(mouth, radius), ...waistRing],
      undefined,
      {
        color: bronze,
      },
    );
    builder.rod(
      "bell-lip",
      radius * 1.03,
      Vector3.create(0, mouth - radius * 0.09, 0),
      Vector3.create(0, mouth, 0),
      { color: lip },
    );
    builder.ball(
      "clapper",
      radius * 0.12,
      Vector3.create(0, mouth - radius * 0.13, 0),
      {
        color: lip,
      },
    );
    return builder.build(d.mass);
  }

  /* Dimensions of {@link AutoMovieArchetypeBellFrame}. */
  /**
   * Width between outer post faces, depth between outer post faces, roof ridge
   * height and scenic mass.
   */
  export type Dimension = "width" | "depth" | "height" | "mass";

  /** Author-fixed dimensions within the scene bands and an optional model id. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** Scene-unique model id, defaulting to the producer's name. */
    id?: string;
  }

  /** Model lengths are metres and mass is kilograms. */
  export const UNITS: Readonly<
    Record<Dimension, AutoMovieArchetypeDrawSession.Unit>
  > = {
    width: "m",
    depth: "m",
    height: "m",
    mass: "kg",
  };

  /** Scene blockout bands for fictional freestanding scenery. */
  export const BANDS: Readonly<Record<Dimension, IAutoMovieArchetypeBand>> = {
    width: AutoMovieArchetypeBand.of(
      "m",
      1.3,
      1.8,
      `Fictional frame width. Bell outline reference: ${AutoMovieArchetypeBellFrameData.BELL}`,
      true,
    ),
    depth: AutoMovieArchetypeBand.of(
      "m",
      1.1,
      1.5,
      "Fictional frame depth",
      true,
    ),
    height: AutoMovieArchetypeBand.of(
      "m",
      2.45,
      3.1,
      "Fictional ridge height",
      true,
    ),
    mass: AutoMovieArchetypeBand.of(
      "kg",
      120,
      190,
      AutoMovieArchetypeBand.TYPICAL_MASS,
      true,
    ),
  };
}
