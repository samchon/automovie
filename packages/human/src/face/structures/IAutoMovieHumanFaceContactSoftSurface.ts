/**
 * One soft surface a face basis's oral contact holds outside the colliders.
 *
 * A soft vertex's floor is its clearance in the shape-only rest state, or the
 * collider cover where it rested farther out, or its rest depth where the
 * source authored it inside. A vertex pushed past that floor is moved back to
 * it along the nearest feature, and a push beyond `budgetMetres` refuses the
 * document.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceContactSoftSurface {
  /** ID of the soft surface. */
  surface: string;

  /** Metres a vertex may be pushed back before the document is refused. */
  budgetMetres: number;
}
