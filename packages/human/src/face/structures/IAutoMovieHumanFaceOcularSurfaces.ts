import type { IAutoMovieHumanFaceOcularSurfaceShape } from "./IAutoMovieHumanFaceOcularSurfaceShape";

/** Independent authored visible caruncle/plica and wet-margin shape; no clinical tissue measurement.
 *
 * @author Samchon
 */
export interface IAutoMovieHumanFaceOcularSurfaces {
  /** Anatomical left medial relief and independently authored wet-margin dimensions. */
  left?: IAutoMovieHumanFaceOcularSurfaceShape;
  /** Anatomical right surface dimensions, independent of the left request. */
  right?: IAutoMovieHumanFaceOcularSurfaceShape;
}
