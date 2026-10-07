/**
 * Owned nearest-feature reading from one compiled oriented surface.
 *
 * Vectors use the mesh-local metre frame. The query owns its compiled snapshot;
 * changing these returned vectors cannot alter later readings. A boundary
 * feature on an open sheet has no qualified interior-side classification.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Carries metric attachment readings and source triangle identity for subsequent general geometry operations.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Reports the nearest original triangle feature and open-rim qualification without changing source topology.
 * @author Samchon
 */
export interface IAutoMovieSignedMeshQueryHit {
  /** Nearest surface point, XYZ in mesh-local metres. */
  point: number[];

  /** Unit oriented feature pseudonormal, XYZ in the mesh-local frame. */
  normal: number[];

  /** Nonnegative Euclidean separation from the query point, in metres. */
  distance: number;

  /** Separation signed by the feature normal; positive is its exterior side. */
  signedDistance: number;

  /** Triangle ordinal in the original input index buffer. */
  triangle: number;

  /** Nearest point's geometric support, including edge and vertex projections. */
  feature: "face" | "edge" | "vertex";

  /** True when the nearest support is an open sheet's rim edge or rim vertex. */
  boundary: boolean;
}
