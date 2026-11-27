import type {
  AutoMovieVector2Tuple,
  IAutoMovieConicApproximation,
  IAutoMoviePlanarCurveSource,
} from "@automovie/interface";

/** Analytic planar sources and the budget the conic approximation tests share. */
export namespace RecoveryConicSources {
  /** A 1e-5 mm tolerance within 128 arcs and depth 20. */
  export function options(): IAutoMovieConicApproximation.IOptions {
    return { toleranceMm: 1e-5, maximumArcs: 128, maximumDepth: 20 };
  }

  /** The line y = 2t + 3 on [0, 2]. */
  export const line: IAutoMoviePlanarCurveSource = {
    domain: { start: 0, end: 2 },
    breaks: [],
    closed: false,
    evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => [t, 2 * t + 3],
    derivative: (
      _t: number,
      order: 1 | 2 | 3 | 4 | 5,
    ): Readonly<AutoMovieVector2Tuple> => (order === 1 ? [1, 2] : [0, 0]),
  };

  /** The cubic y = t³ on [-1, 1], its inflection at 0 supplied as a break. */
  export const cubic: IAutoMoviePlanarCurveSource = {
    domain: { start: -1, end: 1 },
    breaks: [0],
    closed: false,
    evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => [t, t ** 3],
    derivative: (
      t: number,
      order: 1 | 2 | 3 | 4 | 5,
    ): Readonly<AutoMovieVector2Tuple> =>
      order === 1
        ? [1, 3 * t * t]
        : order === 2
          ? [0, 6 * t]
          : order === 3
            ? [0, 6]
            : [0, 0],
  };

  /** The convex nonconic y = t² + 0.1·t³ on [0, 1]. */
  export const convex: IAutoMoviePlanarCurveSource = {
    domain: { start: 0, end: 1 },
    breaks: [],
    closed: false,
    evaluate: (t: number): Readonly<AutoMovieVector2Tuple> => [
      t,
      t * t + 0.1 * t ** 3,
    ],
    derivative: (
      t: number,
      order: 1 | 2 | 3 | 4 | 5,
    ): Readonly<AutoMovieVector2Tuple> =>
      order === 1
        ? [1, 2 * t + 0.3 * t * t]
        : order === 2
          ? [0, 2 + 0.6 * t]
          : order === 3
            ? [0, 0.6]
            : [0, 0],
  };
}
