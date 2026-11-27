import type {
  IAutoMovieHumanGlutealRelief,
  IAutoMovieHumanTrunkFeature,
  IAutoMovieLoftRelief,
} from "@automovie/interface";

import { AutoMovieHumanTrunkReliefNet } from "./AutoMovieHumanTrunkReliefNet";

/**
 * The buttocks merged into the trunk: the left gluteal mass sampled as a
 * relief window over the trunk's chart on the posterior sectors, moving the
 * base along the gluteal axis, and the right window its reflection (rule J6).
 * The window starts at the crotch ring and vanishes there with its slope and
 * curvature (J7), so the ring the legs share is untouched.
 */
export namespace AutoMovieHumanGlutealRelief {
  /**
   * Both buttocks' windows.
   *
   * @param input The dome, the base and the phase map.
   * @returns The left and the right window; none when the dome has no height.
   */
  export function create(
    input: IAutoMovieHumanGlutealRelief.IInput,
  ): IAutoMovieLoftRelief[] {
    const dome: IAutoMovieHumanTrunkFeature = input.dome;
    if (!(dome.height(dome.apex[0], dome.apex[1]) > 0)) return [];
    const o: [number, number, number] = dome.frame.origin;
    const stations = {
      start: o[1] + dome.reach.v[0],
      end: o[1] + dome.reach.v[1],
    };

    // On the back the phase falls as the lateral place rises, so the window's
    // phases run from the lateral edge (smaller z, larger phase is the midline).
    const lateralOf = (u: number): number => o[2] + u * dome.frame.lateral[2];
    const edges: number[] = [
      input.phaseOf(lateralOf(dome.reach.u[0])),
      input.phaseOf(lateralOf(dome.reach.u[1])),
    ];
    const phases = { start: Math.min(...edges), end: Math.max(...edges) };
    const apex = {
      station: (o[1] - stations.start) / (stations.end - stations.start),
      phase: (input.phaseOf(lateralOf(dome.apex[0])) - phases.start) /
        (phases.end - phases.start),
    };
    const left: IAutoMovieLoftRelief = AutoMovieHumanTrunkReliefNet.fromFeature(
      "trunk.buttock.left",
      dome,
      { stations, phases, apex },
      input.base,
    );

    return [
      left,
      AutoMovieHumanTrunkReliefNet.mirror(left, "trunk.buttock.right"),
    ];
  }
}
