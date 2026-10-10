/**
 * Regenerated witness of one nonzero source endpoint on one eye component.
 *
 * Only movements the producer actually regenerated are enrolled. A relevant
 * nonzero target without a witness is refused; zero-effect endpoints are
 * checked directly instead.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOpticalSupportTarget {
  /** Existing endpoint identity from the basis target domain. */
  id: string;

  /** Exact native sparse (vertex, dx, dy, dz) rows for this component. */
  surfaceRows: number[];

  /** Exact sparse landmark rows for the named eye's rigid centre landmark. */
  pivotRows: number[];
}
