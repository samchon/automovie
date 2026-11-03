import type { IAutoMovieHumanRelief } from "../network/IAutoMovieHumanRelief";
import { AutoMovieHumanSternalNotchFrame } from "./AutoMovieHumanSternalNotchFrame";
import { AutoMovieHumanSternalNotchProfile } from "./AutoMovieHumanSternalNotchProfile";
import type { AutoMovieHumanTrunkFeatureFrame } from "./AutoMovieHumanTrunkFeatureFrame";
import { AutoMovieHumanTrunkReliefNet } from "./AutoMovieHumanTrunkReliefNet";
import type { IAutoMovieHumanTrunkFeature } from "./IAutoMovieHumanTrunkFeature";

/**
 * The sternal notch carved into the shoulders: the hollow as a relief window
 * centred on the front midline under the neck's bottom ring, moving the skin
 * back along the frame's axis, so its depth is at most zero everywhere (the
 * carve's sign, `AutoMovieHumanSeamCarve.dent`). Its own mirror: the window
 * is symmetric about the midline, so the two sides agree. The edge vanishes
 * with slope and curvature (J7) a clearance under the shoulders' top layer,
 * the neck's copied ring, so the seam with the neck keeps the neck's jets.
 */
export namespace AutoMovieHumanSternalNotch {
  /** Gap between the window's top and the neck's bottom ring, mm: the window ends inside the shoulders' chain. */
  export const CLEARANCE: number = 1;

  /**
   * The notch's frame under a neck ring.
   *
   * @param neck Height of the neck's bottom ring, mm.
   * @param front The front midline's forward place at the notch, as a function of height, mm.
   * @returns The frame.
   */
  export function frame(neck: number, front: (y: number) => number): AutoMovieHumanTrunkFeatureFrame.IFrame {
    const y: number = neck - CLEARANCE - AutoMovieHumanSternalNotchProfile.UPPER;

    return AutoMovieHumanSternalNotchFrame.create(y, front(y));
  }

  /**
   * The hollow as a feature.
   *
   * @param at The notch's frame.
   * @returns The hollow as a height field.
   */
  export function feature(at: AutoMovieHumanTrunkFeatureFrame.IFrame): IAutoMovieHumanTrunkFeature {
    const P: typeof AutoMovieHumanSternalNotchProfile = AutoMovieHumanSternalNotchProfile;

    return {
      frame: at,
      height: (u: number, v: number): number => P.height(u, v),
      reach: { u: [-P.HALF, P.HALF], v: [-P.LOWER, P.UPPER] },
      apex: [0, 0],
    };
  }

  /**
   * The window.
   *
   * @param at The notch's frame.
   * @param base The trunk's base surface.
   * @param halfPhase The phase half width that spans the notch's half width on the front, radians.
   * @returns The relief.
   */
  export function create(
    at: AutoMovieHumanTrunkFeatureFrame.IFrame,
    base: AutoMovieHumanTrunkReliefNet.Base,
    halfPhase: number,
  ): IAutoMovieHumanRelief {
    const P: typeof AutoMovieHumanSternalNotchProfile = AutoMovieHumanSternalNotchProfile;
    const y: number = at.origin[1];

    return AutoMovieHumanTrunkReliefNet.fromFeature(
      "trunk.sternalNotch",
      feature(at),
      {
        stations: [y - P.LOWER, y + P.UPPER],
        phases: [2 * Math.PI - halfPhase, 2 * Math.PI + halfPhase],
        apex: [P.LOWER / (P.LOWER + P.UPPER), 0.5],
      },
      base,
    );
  }
}
