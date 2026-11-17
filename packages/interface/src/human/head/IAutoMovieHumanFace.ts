import type { IAutoMovieHumanPair } from "../IAutoMovieHumanPair";
import type { IAutoMovieHumanEye } from "./IAutoMovieHumanEye";
import type { IAutoMovieHumanMouth } from "./IAutoMovieHumanMouth";
import type { IAutoMovieHumanNose } from "./IAutoMovieHumanNose";

/** Resting eye, nose and mouth measurements between the Farkas landmarks.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Resting eye, nose and mouth measurements between the Farkas landmarks.
 * @evidence contracts/development/design.md#principled-representation `eyePair`: Eye openings; equal values retain a shared bilateral measurement. `intercanthalWidth`: Euclidean three-dimensional distance between the two endocanthia, millimetres. `nose`: Nose dimensions.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanFace is the canonical exchange used by IAutoMovieHumanFaceSchema, IAutoMovieHumanHeadIdentity.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `eyePair`, `intercanthalWidth`, `nose`, `mouth`; callers supply the complete record.
 */
export interface IAutoMovieHumanFace {
  /** Eye openings; equal values retain a shared bilateral measurement. */
  eyePair: IAutoMovieHumanPair<IAutoMovieHumanEye>;

  /** Euclidean three-dimensional distance between the two endocanthia, millimetres. Schema constraints: Minimum: 10; Maximum: 60; retained by Human's schema refinement. */
  intercanthalWidth: number;

  /** Nose dimensions. */
  nose: IAutoMovieHumanNose;

  /** Closed-mouth dimensions. */
  mouth: IAutoMovieHumanMouth;
}
