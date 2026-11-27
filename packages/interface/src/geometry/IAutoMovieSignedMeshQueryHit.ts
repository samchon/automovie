/**
 * Owned nearest-feature reading from one compiled oriented surface, returned by
 * the query `createSignedMeshQuery` compiles.
 *
 * Vectors use the mesh-local metre frame. The query owns its compiled snapshot;
 * changing these returned vectors cannot alter later readings. A boundary
 * feature on an open sheet has no qualified interior-side classification.
 */
export interface IAutoMovieSignedMeshQueryHit {
  /** Nearest surface point, XYZ in mesh-local metres, owned by the caller. */
  point: number[];

  /**
   * Unit oriented pseudonormal of the nearest feature, XYZ in the mesh-local
   * frame: the face normal, the normalized sum of an edge's incident face
   * normals, or the angle-weighted vertex normal. A rim edge uses its single
   * face's normal.
   */
  normal: number[];

  /** Nonnegative Euclidean separation from the query point, in metres. */
  distance: number;

  /**
   * `distance` signed by the side of `normal` the query point lies on: positive
   * on the oriented exterior, negative inside, and zero when the point is on
   * the feature's tangent plane through `point`.
   */
  signedDistance: number;

  /**
   * Triangle ordinal in the original input index buffer; among equally near
   * features the lowest ordinal wins.
   */
  triangle: number;

  /**
   * Support of the nearest point: `face` for a projection strictly inside the
   * triangle, `edge` for the interior of a closed edge segment, and `vertex`
   * when the projection clamps to a corner.
   */
  feature: "face" | "edge" | "vertex";

  /**
   * True when the nearest support is an open sheet's rim edge or rim vertex,
   * whose reported side is not a side of the sheet's interior; always false for
   * a closed surface.
   */
  boundary: boolean;
}
