import { IAutoMovieMeshPhysicalSource } from "./IAutoMovieMeshPhysicalSource";

/**
 * Physical source correspondence of a mesh, aligned with its render vertices.
 *
 * A numeric entry in `vertices` references `sources`; `null` retains current
 * position welding. The table survives composition, and indices into it have
 * no physical meaning. A producer owns incidence and must rebind newly
 * created vertices. This correspondence supplies topology, not
 * geometry-validity exemptions.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Carries explicit source-point aliases beside position-derived vertices.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types the source domain/ID table and the nullable per-vertex reference into it.
 * @author Samchon
 */
export interface IAutoMovieMeshPhysicalVertices {
  /**
   * Source points referenced by `vertices`.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Exposes `sources` as the table of actual source points.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `sources` for the source lineage geometry input.
   */
  sources: IAutoMovieMeshPhysicalSource[];

  /**
   * Per render vertex, an index into `sources` or `null` for position welding.
   *
   * @evidence requirements/asset-authoring/geometry.md#asset-geometry-topology Exposes `vertices` as the per-vertex alias reference.
   * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-inputs Types `vertices` for the nullable per-vertex correspondence.
   */
  vertices: (number | null)[];
}
