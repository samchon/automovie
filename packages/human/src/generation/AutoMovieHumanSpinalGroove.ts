import type {
  IAutoMovieHumanTrunkFeature,
  IAutoMovieHumanTrunkFeatureFrame,
  IAutoMovieHumanTrunkReliefNet,
  IAutoMovieLoftRelief,
} from "@automovie/interface";

import { AutoMovieHumanSpinalProfile } from "./AutoMovieHumanSpinalProfile";
import { AutoMovieHumanTrunkReliefNet } from "./AutoMovieHumanTrunkReliefNet";

/**
 * The spinal furrow merged into the trunk: a groove window centred on the
 * back midline from just above the buttock point to the trunk's top layer,
 * moving the skin forward (a negative height along the backward axis). Its own
 * mirror. A taut tape bridges the furrow, so no tape reads it.
 */
export namespace AutoMovieHumanSpinalGroove {
  /**
   * The furrow as a feature.
   *
   * @param frame The spinal frame, centred at the furrow's middle.
   * @param half Half length of the furrow along it, mm.
   * @returns The furrow as a height field.
   */
  export function feature(
    frame: IAutoMovieHumanTrunkFeatureFrame.IFrame,
    half: number,
  ): IAutoMovieHumanTrunkFeature {
    const R: number = AutoMovieHumanSpinalProfile.RADIUS;

    return {
      frame,
      height: (u: number, v: number): number =>
        AutoMovieHumanSpinalProfile.height(u, v, half),
      reach: { u: [-R, R], v: [-half, half] },
      apex: [0, 0],
    };
  }

  /**
   * The window.
   *
   * @param frame The spinal frame.
   * @param half Half length of the furrow, mm.
   * @param base The trunk's base surface.
   * @param halfPhase The phase half width that spans the furrow's radius on the back, radians.
   * @returns The relief.
   */
  export function create(
    frame: IAutoMovieHumanTrunkFeatureFrame.IFrame,
    half: number,
    base: IAutoMovieHumanTrunkReliefNet.Base,
    halfPhase: number,
  ): IAutoMovieLoftRelief {
    return AutoMovieHumanTrunkReliefNet.fromFeature(
      "trunk.spinalGroove",
      feature(frame, half),
      {
        stations: { start: frame.origin[1] - half, end: frame.origin[1] + half },
        phases: { start: Math.PI - halfPhase, end: Math.PI + halfPhase },
        apex: { station: 0.5, phase: 0.5 },
      },
      base,
    );
  }
}
