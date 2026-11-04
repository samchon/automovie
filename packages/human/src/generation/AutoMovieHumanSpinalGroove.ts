import type { IAutoMovieLoftRelief } from "@automovie/engine";
import type { AutoMovieHumanTrunkFeatureFrame } from "./AutoMovieHumanTrunkFeatureFrame";
import { AutoMovieHumanSpinalProfile } from "./AutoMovieHumanSpinalProfile";
import { AutoMovieHumanTrunkReliefNet } from "./AutoMovieHumanTrunkReliefNet";
import type { IAutoMovieHumanTrunkFeature } from "./IAutoMovieHumanTrunkFeature";

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
  export function feature(frame: AutoMovieHumanTrunkFeatureFrame.IFrame, half: number): IAutoMovieHumanTrunkFeature {
    const R: number = AutoMovieHumanSpinalProfile.RADIUS;

    return {
      frame,
      height: (u: number, v: number): number => AutoMovieHumanSpinalProfile.height(u, v, half),
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
    frame: AutoMovieHumanTrunkFeatureFrame.IFrame,
    half: number,
    base: AutoMovieHumanTrunkReliefNet.Base,
    halfPhase: number,
  ): IAutoMovieLoftRelief {
    return AutoMovieHumanTrunkReliefNet.fromFeature(
      "trunk.spinalGroove",
      feature(frame, half),
      {
        stations: [frame.origin[1] - half, frame.origin[1] + half],
        phases: [Math.PI - halfPhase, Math.PI + halfPhase],
        apex: [0.5, 0.5],
      },
      base,
    );
  }
}
