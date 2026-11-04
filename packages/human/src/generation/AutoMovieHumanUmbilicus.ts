import type { IAutoMovieHumanRelief } from "../network/IAutoMovieHumanRelief";
import { AutoMovieHumanTrunkFeatureProfile } from "./AutoMovieHumanTrunkFeatureProfile";
import type { AutoMovieHumanTrunkFeatureFrame } from "./AutoMovieHumanTrunkFeatureFrame";
import { AutoMovieHumanTrunkReliefNet } from "./AutoMovieHumanTrunkReliefNet";
import { AutoMovieHumanUmbilicalProfile } from "./AutoMovieHumanUmbilicalProfile";
import type { IAutoMovieHumanTrunkFeature } from "./IAutoMovieHumanTrunkFeature";

/**
 * The umbilicus merged into the trunk: the pit as a relief window centred on
 * the front midline at omphalion, moving the skin back along the frame's axis.
 * Its own mirror: the window is symmetric about the midline, so the two sides
 * agree. The edge vanishes with slope and curvature (J7).
 */
export namespace AutoMovieHumanUmbilicus {
  /**
   * The pit as a feature.
   *
   * @param frame The umbilical frame.
   * @returns The pit as a height field.
   */
  export function feature(frame: AutoMovieHumanTrunkFeatureFrame.IFrame): IAutoMovieHumanTrunkFeature {
    const R: number = AutoMovieHumanUmbilicalProfile.RADIUS;

    return {
      frame,
      height: (u: number, v: number): number =>
        AutoMovieHumanUmbilicalProfile.height(AutoMovieHumanTrunkFeatureProfile.rho(u, v, R, R, R)),
      reach: { u: [-R, R], v: [-R, R] },
      apex: [0, 0],
    };
  }

  /**
   * The window.
   *
   * @param frame The umbilical frame.
   * @param base The trunk's base surface.
   * @param halfPhase The phase half width that spans the pit's radius on the front, radians.
   * @returns The relief.
   */
  export function create(
    frame: AutoMovieHumanTrunkFeatureFrame.IFrame,
    base: AutoMovieHumanTrunkReliefNet.Base,
    halfPhase: number,
  ): IAutoMovieHumanRelief {
    const R: number = AutoMovieHumanUmbilicalProfile.RADIUS;

    return AutoMovieHumanTrunkReliefNet.fromFeature(
      "trunk.umbilicus",
      feature(frame),
      {
        stations: [frame.origin[1] - R, frame.origin[1] + R],
        phases: [2 * Math.PI - halfPhase, 2 * Math.PI + halfPhase],
        apex: [0.5, 0.5],
      },
      base,
    );
  }
}
