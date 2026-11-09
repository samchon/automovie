/**
 * Owned nearest-feature reading from one compiled oriented surface, returned by
 * the query `createAutoMovieSignedMeshQuery` compiles.
 *
 * Vectors use the mesh-local metre frame. The query owns its compiled snapshot;
 * changing these returned vectors cannot alter later readings. A boundary
 * feature on an open sheet has no qualified interior-side classification.
 *
 * @evidence contracts/development/design.md#principled-representation The nearest point is the projection onto the nearest face interior or closed edge segment, and the sign comes from that feature's angle-weighted pseudonormal after Baerentzen and Aanaes, which classifies sides correctly for a closed, consistently wound, self-intersection-free surface.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Point, normal, both distances, face ordinal, feature kind and boundary flag in one record, because hair contact, brow contact, body layer ordering and skin voxelization need the contact point, its side and whether that side is trustworthy from a single traversal.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A point within rounding of the surface keeps its computed sign or zero instead of being snapped to a side by a fixed tolerance, and a rim feature is flagged rather than given an invented side.
 * @evidence contracts/development/common.md#meaningful-documentation States the producer, the frame and units, ownership of the vectors, each field's derivation, when the signed distance is zero, the tie rule, and when the boundary flag is set.
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
   * whose reported side is not a side of the sheet's interior; always false
   * for a closed surface.
   */
  boundary: boolean;
}
