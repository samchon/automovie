import type { IAutoMovieVector3 } from "@automovie/interface";

/**
 * A caller-owned differential mask sample at one resident mesh vertex.
 *
 * Samples follow the mesh's vertex order. The deformer uses both the mask and
 * its local spatial derivative before checking the composed surface's
 * orientation; a weight alone cannot describe the resulting normal transport.
 * Admission checks finite values and bounded weights, while the caller owns
 * the sampled field's provenance and interpolation between vertices.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Carries the scalar mask and derivative needed to compose an attachment influence with a mesh deformation.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Supplies the differential of the final masked map so deformation orientation checks apply to the composed output.
 * @author Samchon
 */
export interface IAutoMovieMeshDeformationInfluence {
  /**
   * Dimensionless mask in [0, 1]; zero retains the resident position.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Weights the summed deformation at this resident vertex.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Participates in the composed map whose output retains the original triangle population.
   */
  weight: number;

  /**
   * Spatial derivative of the mask in inverse metres in the mesh's local frame.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Preserves the derivative needed when composing the mask and displacement field.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Supplies the outer-product term used to transport normals and check the final masked orientation.
   */
  gradient: IAutoMovieVector3;
}
