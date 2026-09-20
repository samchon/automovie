/**
 * An affine contact condition at one clipped overlap vertex. Barycentric weights
 * belong to the original front triangle, including small negative roundoff;
 * clipping or renormalizing them would change the measured plane. Advancing its
 * three vertices by d changes this signed gap by weights dot d. Arrays are
 * independent of the resident mesh and may be retained by the visitor.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Supplies exact projected-overlap conditions for a shared displacement solve rather than sampling only mesh corners.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Associates each affine depth witness with both triangle ordinals and the original front vertex identities.
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
