import type { IAutoMovieHumanRelief } from "../network/IAutoMovieHumanRelief";
import { AutoMovieHumanTrunkReliefNet } from "./AutoMovieHumanTrunkReliefNet";
import type { IAutoMovieHumanTrunkFeature } from "./IAutoMovieHumanTrunkFeature";

/**
 * The breasts merged into the trunk: the left breast's dome sampled as a
 * relief window over the trunk's chart, moving the base along the breast's own
 * axis, and the right window its reflection (rule J6). The window's lower edge
 * is the inframammary fold; its phases span the footprint's lateral reach. At
 * the window's edge the height, slope and curvature vanish (J7), so the seam
 * with the thorax is C2 by construction.
 */
export namespace AutoMovieHumanBreastRelief {
  /** What the merge reads. */
  export interface IInput {
    /** The breast's dome. */
    dome: IAutoMovieHumanTrunkFeature;

    /** The trunk's base surface: the body point at a height and a phase. */
    base: AutoMovieHumanTrunkReliefNet.Base;

    /** The base's phase at a lateral place on the front at the bust point's height. */
    phaseOf: (z: number) => number;

    /** Height of the trunk's top the window must stay under, mm: the axilla. */
    ceiling: number;
  }

  /**
   * Both breasts' windows.
   *
   * @param input The dome, the base and the phase map.
   * @returns The left and the right window.
   */
  export function create(input: IInput): IAutoMovieHumanRelief[] {
    const dome: IAutoMovieHumanTrunkFeature = input.dome;
    const o: [number, number, number] = dome.frame.origin;
    const stations: [number, number] = [o[1] + dome.reach.v[0], Math.min(input.ceiling - 1, o[1] + dome.reach.v[1])];

    // The lateral reach in phases on the base: the front's phase rises with z.
    const phases: [number, number] = [input.phaseOf(o[2] + dome.reach.u[0]), input.phaseOf(o[2] + dome.reach.u[1])];
    const apex: [number, number] = [
      (o[1] - stations[0]) / (stations[1] - stations[0]),
      (input.phaseOf(o[2]) - phases[0]) / (phases[1] - phases[0]),
    ];
    const left: IAutoMovieHumanRelief = AutoMovieHumanTrunkReliefNet.fromFeature(
      "trunk.breast.left",
      dome,
      { stations, phases, apex },
      input.base,
    );

    return [left, AutoMovieHumanTrunkReliefNet.mirror(left, "trunk.breast.right")];
  }
}
