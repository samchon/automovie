import { AutoMovieNaturalSpline } from "@automovie/engine";
import type {
  IAutoMovieHumanTrunkColumn,
  IAutoMovieHumanTrunkKey,
  IAutoMovieHumanTrunkSection,
  IAutoMovieNaturalCubicSpline,
} from "@automovie/interface";

import { AutoMovieHumanMonotoneCubic } from "../lofting/AutoMovieHumanMonotoneCubic";
import { AutoMovieHumanTrunkGuides } from "./AutoMovieHumanTrunkGuides";
import { AutoMovieHumanTrunkProfileBack } from "./AutoMovieHumanTrunkProfileBack";
import { AutoMovieHumanTrunkProfileFront } from "./AutoMovieHumanTrunkProfileFront";

/**
 * The trunk's column: the section at any height between its landmark keys.
 *
 * Every channel runs between the keys by the natural spline through them (C2
 * along the height), except the half width, which runs by a monotone cubic
 * (Fritsch and Carlson 1980) so no row between two keys narrows or widens past
 * them: each tape's extreme then stays at its site, the natural waist being the
 * least girth because no row between its neighbours is narrower. The base keeps
 * regular ellipse sections at the crotch for the adjacent thigh and gluteal
 * shapes to connect to.
 */
export namespace AutoMovieHumanTrunkColumn {
  /**
   * The column through its keys.
   *
   * @param keys Landmark stations by strictly rising height.
   * @returns The column.
   */
  export function create(
    keys: IAutoMovieHumanTrunkKey[],
  ): IAutoMovieHumanTrunkColumn.IColumn {
    const spline = (
      pick: (k: IAutoMovieHumanTrunkKey) => number | null,
    ): ((y: number) => number) => {
      const used: IAutoMovieHumanTrunkKey[] = keys.filter(
        (k: IAutoMovieHumanTrunkKey): boolean => pick(k) !== null,
      );
      const s: IAutoMovieNaturalCubicSpline = AutoMovieNaturalSpline.create(
        used.map((k: IAutoMovieHumanTrunkKey): number => k.y),
        used.map((k: IAutoMovieHumanTrunkKey): number => pick(k)!),
      );

      return (y: number): number => AutoMovieNaturalSpline.evaluate(s, y);
    };
    const widthKnots: [number, number][] = keys.map(
      (k: IAutoMovieHumanTrunkKey): [number, number] => [k.y, k.width],
    );
    const width = (y: number): number =>
      AutoMovieHumanMonotoneCubic.interpolate(widthKnots, y);
    const middle: (y: number) => number = spline(
      (k: IAutoMovieHumanTrunkKey): number => k.middle,
    );
    const front: (y: number) => number =
      AutoMovieHumanTrunkProfileFront.create(keys).at;
    const back: (y: number) => number =
      AutoMovieHumanTrunkProfileBack.create(keys).at;
    const squareFront: (y: number) => number = spline(
      (k: IAutoMovieHumanTrunkKey): number => k.squareFront,
    );
    const squareBack: (y: number) => number = spline(
      (k: IAutoMovieHumanTrunkKey): number => k.squareBack,
    );
    const anterior: (y: number) => number = spline(
      (k: IAutoMovieHumanTrunkKey): number => k.anterior,
    );
    const lo: number = keys[0]!.y;
    const hi: number = keys[keys.length - 1]!.y;

    return {
      keys,
      at: (raw: number): IAutoMovieHumanTrunkSection => {
        const y: number = Math.min(hi, Math.max(lo, raw));
        const w: number = width(y);
        const m: number = middle(y);
        const f: number = Math.max(m + 1, front(y));
        const b: number = Math.min(m - 1, back(y));

        // The anterior guide stays clear of the bust line and of the widest point.
        const a: number = Math.min(
          0.97,
          Math.max(
            AutoMovieHumanTrunkGuides.SHARE.bustLine + 0.05,
            anterior(y),
          ),
        );
        return {
          y: raw,
          width: w,
          middle: m,
          front: f,
          back: b,
          squareFront: Math.max(1.2, squareFront(y)),
          squareBack: Math.max(1.2, squareBack(y)),
          anterior: a,
          foldFront: flat,
          foldBack: flat,
        };
      },
    };
  }
}

/** Zero displacement and derivatives on the regular section. */
function flat(): [number, number, number] {
  return [0, 0, 0];
}
