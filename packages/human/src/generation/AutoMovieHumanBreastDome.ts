import type { AutoMovieHumanBreastFootprint } from "./AutoMovieHumanBreastFootprint";
import { AutoMovieHumanBreastProfile } from "./AutoMovieHumanBreastProfile";
import { AutoMovieHumanTrunkFeatureFrame } from "./AutoMovieHumanTrunkFeatureFrame";
import type { IAutoMovieHumanTrunkFeature } from "./IAutoMovieHumanTrunkFeature";

/**
 * The breast's dome: the profile swept over the footprint in the breast's own
 * frame, a height field about the bust point along the breast's axis. No
 * nipple is modelled (construction.md).
 */
export namespace AutoMovieHumanBreastDome {
  /** What the dome reads. */
  export interface IInput {
    /** The breast's frame. */
    frame: AutoMovieHumanTrunkFeatureFrame.IFrame;

    /** The footprint. */
    footprint: AutoMovieHumanBreastFootprint.IFootprint;

    /** The bust point's projection, mm. */
    projection: number;
  }

  /**
   * The dome as a feature.
   *
   * @param input The frame, footprint and projection.
   * @returns The breast as a height field.
   */
  export function create(input: IInput): IAutoMovieHumanTrunkFeature {
    const f: AutoMovieHumanBreastFootprint.IFootprint = input.footprint;

    return {
      frame: input.frame,
      height: (u: number, v: number): number => AutoMovieHumanBreastProfile.height(f.rho(u, v), input.projection),
      reach: { u: [-f.half, f.half], v: [-f.lower, f.upper] },
      apex: [0, 0],
    };
  }

  /**
   * The dome's surface as a grid of body points, rows along the up axis and
   * columns along the lateral axis, for drawing the piece alone.
   *
   * @param feature The dome.
   * @param rows Samples along up, at least 2.
   * @param columns Samples along lateral, at least 2.
   * @returns Body points, mm.
   */
  export function surface(feature: IAutoMovieHumanTrunkFeature, rows: number, columns: number): [number, number, number][][] {
    return Array.from({ length: rows }, (_: unknown, i: number): [number, number, number][] =>
      Array.from({ length: columns }, (__: unknown, j: number): [number, number, number] => {
        const u: number = feature.reach.u[0] + ((feature.reach.u[1] - feature.reach.u[0]) * j) / (columns - 1);
        const v: number = feature.reach.v[0] + ((feature.reach.v[1] - feature.reach.v[0]) * i) / (rows - 1);

        return AutoMovieHumanTrunkFeatureFrame.body(feature.frame, u, v, feature.height(u, v));
      }),
    );
  }
}
