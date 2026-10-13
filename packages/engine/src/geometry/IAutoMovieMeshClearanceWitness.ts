/**
 * An affine contact condition at one clipped overlap vertex. Barycentric weights
 * belong to the original front triangle, including small negative roundoff;
 * clipping or renormalizing them would change the measured plane. Advancing its
 * three vertices by d changes this signed gap by weights dot d. Arrays are
 * independent of the resident mesh and may be retained by the visitor.
 *
 * @author Samchon
 */
export interface IAutoMovieMeshClearanceWitness {
  /** Front triangle ordinal, before any spatial indexing. */
  triangle: number;
  /** Back triangle ordinal, before any spatial indexing. */
  backTriangle: number;
  /** The front triangle's three original vertex ordinals. */
  vertices: number[];
  /** Affine coefficients in the same order as vertices. */
  weights: number[];
  /** Front-minus-back depth at the overlap vertex, in mesh-local metres. */
  gap: number;
}
