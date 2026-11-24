import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * The guide's path: the bicycle's sampled course, its stops and the athlete's
 * steps along it.
 */
export namespace HumanBikeGuidePath {
  /**
   * Step length over stature at a normal walk (Murray, Drought and Kory 1964;
   * Grieve and Gear 1966).
   */
  export const STEP: number = 0.41;

  /**
   * Running cadence, steps per second: about 170 steps a minute at a
   * recreational run (Heiderscheit et al. 2011, Med Sci Sports Exerc 43:296).
   */
  export const CADENCE: number = 2.8;

  /**
   * Swing time of one foot, seconds: provisional, about 40 % of a one-second
   * stride.
   */
  export const SWING: number = 0.4;

  /**
   * One step: the path distance its print stands at and when it lands, action
   * seconds.
   */
  export interface IStep {
    /** Path distance of the print, metres. */
    at: number;

    /** Landing second. */
    land: number;
  }

  /** The athlete's path beside the bicycle, sampled once at planning. */
  export interface IPath {
    /** Action seconds of each sample. */
    times: number[];

    /** Root path distance at each sample, metres, nondecreasing. */
    distances: number[];

    /** World root path point at each sample, metres. */
    points: IAutoMovieVector3[];

    /** Bicycle heading change since the start at each sample, degrees. */
    turns: number[];
  }

  /**
   * The path distances at which the athlete comes to a stop: the start of each
   * pause of at least the swing time, and the path's end.
   */
  export function stops(path: IPath): number[] {
    const ends: number[] = [];
    let still: number | undefined;
    for (let i: number = 1; i < path.distances.length; ++i) {
      const moving: boolean =
        path.distances[i]! - path.distances[i - 1]! > 1e-5;
      if (moving) {
        if (
          still !== undefined &&
          path.times[i - 1]! - path.times[still]! >= SWING &&
          path.distances[still]! > (ends.at(-1) ?? 0) + 1e-3
        )
          ends.push(path.distances[still]!);
        still = undefined;
      } else still ??= i - 1;
    }
    ends.push(path.distances.at(-1)!);
    return ends;
  }

  /**
   * The steps of one run from a stop to the next: the walking step, longer
   * where the bicycle runs faster than that step at a running cadence carries
   * the athlete, read at the speed where each step starts, with a remainder
   * shorter than a quarter step joined to the last; each lands as the root
   * comes half a step short of its print. A closing step then brings the other
   * foot alongside, landing halfway through the last step's second half.
   */
  export function run(
    path: IPath,
    from: number,
    to: number,
    stature: number,
  ): IStep[] {
    const walking: number = STEP * stature;
    const steps: IStep[] = [];
    let reached: number = from;
    while (to - reached > 1e-3) {
      const i: number = Math.max(1, indexAt(path, reached));
      const speed: number =
        (path.distances[i]! - path.distances[i - 1]!) /
        (path.times[i]! - path.times[i - 1]!);
      const length: number = Math.max(walking, speed / CADENCE);
      const at: number = to - reached <= 1.25 * length ? to : reached + length;
      steps.push({ at, land: timeAt(path, at - (at - reached) / 2) });
      if (at === to)
        steps.push({ at, land: timeAt(path, to - (at - reached) / 4) });
      reached = at;
    }
    return steps;
  }

  /** The first sample index at which the path has covered a distance. */
  export function indexAt(path: IPath, distance: number): number {
    let low: number = 0;
    let high: number = path.distances.length - 1;
    while (low < high) {
      const mid: number = (low + high) >> 1;
      if (path.distances[mid]! >= distance) high = mid;
      else low = mid + 1;
    }
    return low;
  }

  /**
   * The action second at which the path first covers a distance, interpolated
   * between samples.
   */
  function timeAt(path: IPath, distance: number): number {
    const index: number = indexAt(path, Math.max(0, distance));
    if (index === 0) return 0;
    const d0: number = path.distances[index - 1]!;
    const d1: number = path.distances[index]!;
    const share: number = d1 > d0 ? (distance - d0) / (d1 - d0) : 1;
    return (
      path.times[index - 1]! +
      Math.min(1, Math.max(0, share)) *
        (path.times[index]! - path.times[index - 1]!)
    );
  }
}
