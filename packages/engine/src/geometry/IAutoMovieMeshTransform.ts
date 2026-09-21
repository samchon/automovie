import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

/**
 * A rigid translate / unit-quaternion rotate / per-axis scale placement.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Places a mesh as one operand in a composed assembly.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Defines the transform input applied before mesh composition.
 */
export interface IAutoMovieMeshTransform {
  /**
   * Metres added after rotation and scale; omitted means the origin.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Keeps mesh placement in real metric coordinates.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Supplies the metric translation component of placement.
   */
  translation?: IAutoMovieVector3;
  /**
   * Unit quaternion applied after scale; omitted means identity.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Declares the rotation used while composing a mesh operand.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Supplies the orientation applied without changing member topology.
   */
  rotation?: IAutoMovieQuaternion;
  /**
   * Per-axis scale applied first; omitted means unit scale.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-dimensions Applies the declared dimensional scale to a mesh operand.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Supplies the per-axis dimensional transform.
   */
  scale?: IAutoMovieVector3;
}
