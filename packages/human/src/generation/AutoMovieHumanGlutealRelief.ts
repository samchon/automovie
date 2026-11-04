import type { IAutoMovieLoftRelief } from "@automovie/engine";
import { AutoMovieHumanTrunkReliefNet } from "./AutoMovieHumanTrunkReliefNet";
import type { IAutoMovieHumanTrunkFeature } from "./IAutoMovieHumanTrunkFeature";

/**
 * The buttocks merged into the trunk: the left gluteal mass sampled as a
 * relief window over the trunk's chart on the posterior sectors, moving the
 * base along the gluteal axis, and the right window its reflection (rule J6).
 * The window starts at the crotch ring and vanishes there with its slope and
 * curvature (J7), so the ring the legs share is untouched.
 */
export namespace AutoMovieHumanGlutealRelief {
  /** What the merge reads. */
  export interface IInput {
    /** The gluteal mass. */
    dome: IAutoMovieHumanTrunkFeature;

    /** The trunk's base surface: the body point at a height and a phase. */
    base: AutoMovieHumanTrunkReliefNet.Base;

    /** The base's phase at a lateral place on the back at the buttock point's height. */
    phaseOf: (z: number) => number;
  }

  /**
   * Both buttocks' windows.
   *
   * @param input The dome, the base and the phase map.
   * @returns The left and the right window; none when the dome has no height.
   */
  export function create(input: IInput): IAutoMovieLoftRelief[] {
    const dome: IAutoMovieHumanTrunkFeature = input.dome;
    if (!(dome.height(dome.apex[0], dome.apex[1]) > 0)) return [];
    const o: [number, number, number] = dome.frame.origin;
    const stations: [number, number] = [o[1] + dome.reach.v[0], o[1] + dome.reach.v[1]];

    // On the back the phase falls as the lateral place rises, so the window's
    // phases run from the lateral edge (smaller z, larger phase is the midline).
    const lateralOf = (u: number): number => o[2] + u * dome.frame.lateral[2];
    const edges: number[] = [input.phaseOf(lateralOf(dome.reach.u[0])), input.phaseOf(lateralOf(dome.reach.u[1]))];
    const phases: [number, number] = [Math.min(...edges), Math.max(...edges)];
    const apex: [number, number] = [
      (o[1] - stations[0]) / (stations[1] - stations[0]),
      (input.phaseOf(lateralOf(dome.apex[0])) - phases[0]) / (phases[1] - phases[0]),
    ];
    const left: IAutoMovieLoftRelief = AutoMovieHumanTrunkReliefNet.fromFeature(
      "trunk.buttock.left",
      dome,
      { stations, phases, apex },
      input.base,
    );

    return [left, AutoMovieHumanTrunkReliefNet.mirror(left, "trunk.buttock.right")];
  }
}
