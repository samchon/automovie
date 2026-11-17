/** Euclidean three-dimensional distances between the Farkas landmarks, in millimetres, following the [FaceBase inter-landmark protocol](https://www.facebase.org/resources/human/facial_norms/notes/).
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Euclidean three-dimensional distances between the Farkas landmarks, in millimetres, following the [FaceBase inter-landmark protocol](https://www.facebase.org/resources/human/facial_norms/notes/).
 * @evidence contracts/development/design.md#principled-representation `width`: Alare to alare. `height`: Nasion to subnasale. `protrusion`: Subnasale to pronasale.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanNose is the canonical exchange used by IAutoMovieHumanNoseSchema, IAutoMovieHumanFace.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `width`, `height`, `protrusion`; callers supply the complete record.
 */
export interface IAutoMovieHumanNose {
  /** Alare to alare. Schema constraints: Minimum: 10; Maximum: 70; retained by Human's schema refinement. */
  width: number;

  /** Nasion to subnasale. Schema constraints: Minimum: 15; Maximum: 90; retained by Human's schema refinement. */
  height: number;

  /** Subnasale to pronasale. Schema constraints: Minimum: 4; Maximum: 45; retained by Human's schema refinement. */
  protrusion: number;
}
