/**
 * Owned nearest-feature reading from one compiled oriented surface, returned by
 * the query `createSignedMeshQuery` compiles.
 *
 * The returned point and pseudonormal are caller-owned in the mesh-local frame.
 * Their orientation gives a local signed reading. On an open sheet, use the
 * boundary flag to identify rim readings excluded from the sheet's
 * interior-side interpretation.
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
   * Separation signed by the dot product of the pseudonormal with the query
   * offset from the nearest point. The sign is zero on the pseudonormal plane.
   * Interpreting negative as inside requires a qualified outward closed mesh.
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
   * True for an open sheet's rim edge or rim vertex. Use the sign only on the
   * admitted sheet interior. A closed surface reports false.
   */
  boundary: boolean;
}
