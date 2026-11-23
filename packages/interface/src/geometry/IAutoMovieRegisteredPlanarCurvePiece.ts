import type {
  AutoMovieVector2Tuple,
  IAutoMovieRegisteredConicArc,
} from "../index";

/**
 * Source-registered polynomial or bitangent conic coefficient record.
 * Polynomial u=(t-a)/(b-a); a conic's u is its own rational parameter.
 */
export type IAutoMovieRegisteredPlanarCurvePiece =
  | {
      /** Selects polynomial Bernstein evaluation and linear source registration. */
      kind: "polynomial";

      /** Actual polynomial degree; there are degree plus one planar controls. */
      degree: 3 | 4 | 5;

      /** Ordered original source interval, in the callback's parameter unit. */
      domain: readonly [number, number];

      /** Bernstein controls in the source's planar millimetre coordinate frame. */
      controls: readonly Readonly<AutoMovieVector2Tuple>[];

      /**
       * Largest observed fitting/held-out correspondence discrepancy,
       * millimetres.
       */
      maximumSampleErrorMm: number;
    }
  | (IAutoMovieRegisteredConicArc & {
      /** Selects rational quadratic evaluation with independent local speed. */
      kind: "conic";
    });
