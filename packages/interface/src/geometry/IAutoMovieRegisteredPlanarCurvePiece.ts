import type {
  AutoMovieVector2Tuple,
  IAutoMovieRegisteredConicArc,
} from "../index";

/** Source-registered polynomial or bitangent conic coefficient record.
 * Polynomial u=(t-a)/(b-a); a conic's u is its own rational parameter.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes source registration from rational speed and identifies sampled error and millimetre controls.
 * @evidence contracts/development/design.md#principled-representation The closed union requires exactly the fields for polynomial or normalized rational evaluation.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Polynomial pieces retain their degree-specific fields while the conic arm reuses the actual record forwarded from conic fitting; the union serves coefficient evaluation and storage comparison.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No source evaluator or dense sample table is retained in output.
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

      /** Largest observed fitting/held-out correspondence discrepancy, millimetres. */
      maximumSampleErrorMm: number;
    }
  | (IAutoMovieRegisteredConicArc & {
      /** Selects rational quadratic evaluation with independent local speed. */
      kind: "conic";
    });
