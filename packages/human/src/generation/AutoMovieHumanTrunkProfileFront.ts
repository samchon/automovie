import { AutoMovieHumanNaturalSpline } from "../lofting/AutoMovieHumanNaturalSpline";
import type { IAutoMovieHumanTrunkKey } from "./IAutoMovieHumanTrunkKey";

/**
 * The trunk's front median profile alone: the forward place of the front
 * midline as a function of height, from the pubis through omphalion, the
 * xiphoid and the sternum to the suprasternal notch. It is a piece of its
 * own, the abdominal wall's side curve, so the sections' front places read
 * one curve with its own jets instead of each section inventing its own.
 *
 * It is the natural cubic spline through the keys' front places (C2 along the
 * height). The abdominal wall's own centre is the umbilical axis, ahead of
 * the lumbar spine's; this curve belongs to the wall, the back profile to the
 * spine.
 */
export namespace AutoMovieHumanTrunkProfileFront {
  /** The profile. */
  export interface IProfile {
    /** The forward place of the front midline at a height, mm. */
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
    const spline: AutoMovieHumanNaturalSpline.ISpline = AutoMovieHumanNaturalSpline.create(
      keys.map((k: IAutoMovieHumanTrunkKey): number => k.y),
      keys.map((k: IAutoMovieHumanTrunkKey): number => k.front),
    );

    return {
      at: (y: number): number => AutoMovieHumanNaturalSpline.evaluate(spline, y),
      marks: keys.map((k: IAutoMovieHumanTrunkKey): [number, number] => [k.y, k.front]),
    };
  }
}
