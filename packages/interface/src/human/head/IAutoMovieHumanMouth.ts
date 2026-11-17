/** Euclidean three-dimensional distances on the resting mouth with closed lips, in millimetres, following the [FaceBase inter-landmark protocol](https://www.facebase.org/resources/human/facial_norms/notes/).
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Euclidean three-dimensional distances on the resting mouth with closed lips, in millimetres, following the [FaceBase inter-landmark protocol](https://www.facebase.org/resources/human/facial_norms/notes/).
 * @evidence contracts/development/design.md#principled-representation `width`: Cheilion to cheilion. `upperVermilionHeight`: Labiale superius to stomion. `lowerVermilionHeight`: Stomion to labiale inferius.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanMouth is the canonical exchange used by IAutoMovieHumanMouthSchema, IAutoMovieHumanFace.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `width`, `upperVermilionHeight`, `lowerVermilionHeight`; callers supply the complete record.
 */
export interface IAutoMovieHumanMouth {
  /** Cheilion to cheilion. Schema constraints: Minimum: 15; Maximum: 90; retained by Human's schema refinement. */
  width: number;

  /** Labiale superius to stomion. Schema constraints: Minimum: 1; Maximum: 25; retained by Human's schema refinement. */
  upperVermilionHeight: number;

  /** Stomion to labiale inferius. Schema constraints: Minimum: 1; Maximum: 25; retained by Human's schema refinement. */
  lowerVermilionHeight: number;
}
