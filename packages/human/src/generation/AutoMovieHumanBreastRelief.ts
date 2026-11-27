import type {
  IAutoMovieHumanBreastRelief,
  IAutoMovieHumanTrunkFeature,
  IAutoMovieLoftRelief,
} from "@automovie/interface";

import { AutoMovieHumanTrunkReliefNet } from "./AutoMovieHumanTrunkReliefNet";

/**
 * The breasts merged into the trunk: the left breast's dome sampled as a
 * relief window over the trunk's chart, moving the base along the breast's own
 * axis, and the right window its reflection (rule J6). The window's lower edge
 * is the inframammary fold; its phases span the footprint's lateral reach. At
 * the window's edge the height, slope and curvature vanish (J7), so the seam
 * with the thorax is C2 by construction.
 */
export namespace AutoMovieHumanBreastRelief {
  /**
   * Both breasts' windows.
   *
   * @param input The dome, the base and the phase map.
   * @returns The left and the right window.
   */
  export function create(
    input: IAutoMovieHumanBreastRelief.IInput,
  ): IAutoMovieLoftRelief[] {
    const dome: IAutoMovieHumanTrunkFeature = input.dome;
    const o: [number, number, number] = dome.frame.origin;

    // The footprint's stations: the window over it runs on across the vault
    // onto the shoulders' chain, held under the neck by the base's bounds.
    const stations = {
      start: o[1] + dome.reach.v[0],
      end: o[1] + dome.reach.v[1],
    };

    // The lateral reach in phases on the base: the front's phase rises with z.
    const phases = {
      start: input.phaseOf(o[2] + dome.reach.u[0]),
      end: input.phaseOf(o[2] + dome.reach.u[1]),
    };
    const apex = {
      station: (o[1] - stations.start) / (stations.end - stations.start),
      phase:
        (input.phaseOf(o[2]) - phases.start) / (phases.end - phases.start),
    };
    const left: IAutoMovieLoftRelief = AutoMovieHumanTrunkReliefNet.fromFeature(
      "trunk.breast.left",
      dome,
      { stations, phases, apex },
      input.base,
    );

    return [
      left,
      AutoMovieHumanTrunkReliefNet.mirror(left, "trunk.breast.right"),
    ];
  }
}
