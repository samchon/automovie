import { AutoMovieNaturalSpline } from "@automovie/engine";
import type { IAutoMovieHumanTrunkKey } from "./IAutoMovieHumanTrunkKey";

/**
 * The trunk's back median profile alone: the forward place of the back
 * midline as a function of height, from the sacrum through the lumbar
 * lordosis and the thoracic kyphosis to cervicale. It is a piece of its own,
 * the lumbar spine's side curve, with its own centre behind the abdominal
 * wall's.
 *
 * It is the natural cubic spline through the keys' back places, skipping a
 * key that has none (the buttock point, where the gluteal mass stands and
 * the base's back runs through its neighbours), so it is C2 along the height.
 * Gray 1918 makes the lumbar curve convex forward and the thoracic concave
 * forward; the trunk observer reads both sagittae on the emitted skin, and
 * `apexes` publishes where this curve puts them.
 */
export namespace AutoMovieHumanTrunkProfileBack {
  /** The profile. */
  export interface IProfile {
    /** The forward place of the back midline at a height, mm. */
    at: (y: number) => number;

    /** The landmark stations the profile runs through, `[height, forward place]`, mm. */
    marks: [number, number][];
  }

  /**
   * The profile through the keys.
   *
   * @param keys The column's keys by rising height.
   * @returns The profile.
   */
  export function create(keys: readonly IAutoMovieHumanTrunkKey[]): IProfile {
    const used: IAutoMovieHumanTrunkKey[] = keys.filter((k: IAutoMovieHumanTrunkKey): boolean => k.back !== null);
    const spline: AutoMovieNaturalSpline.ISpline = AutoMovieNaturalSpline.create(
      used.map((k: IAutoMovieHumanTrunkKey): number => k.y),
      used.map((k: IAutoMovieHumanTrunkKey): number => k.back!),
    );

    return {
      at: (y: number): number => AutoMovieNaturalSpline.evaluate(spline, y),
      marks: used.map((k: IAutoMovieHumanTrunkKey): [number, number] => [k.y, k.back!]),
    };
  }

  /**
   * The heights of the lordosis' and the kyphosis' apexes on a profile: the
   * most anterior and the most posterior point of the back's midline between
   * two heights, scanned every 2 mm.
   *
   * @param profile The profile.
   * @param lumbar Lower and upper height of the lumbar span, mm.
   * @param thoracic Lower and upper height of the thoracic span, mm.
   * @returns The lumbar apex's and the thoracic apex's heights, mm.
   */
  export function apexes(
    profile: IProfile,
    lumbar: readonly [number, number],
    thoracic: readonly [number, number],
  ): [number, number] {
    const scan = (from: number, to: number, sign: 1 | -1): number => {
      let best: number = from;
      let value: number = -Infinity;

      for (let y: number = from; y <= to; y += 2) {
        const v: number = sign * profile.at(y);
        if (v > value) {
          value = v;
          best = y;
        }
      }
      return best;
    };

    return [scan(lumbar[0], lumbar[1], 1), scan(thoracic[0], thoracic[1], -1)];
  }
}
