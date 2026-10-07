/**
 * The skin at one seat: where it is and which way it faces.
 *
 * `normal` is the smooth outward unit normal, interpolated over the triangle
 * from the host's welded vertex normals, so it turns continuously across
 * triangle edges. `face` is the unit normal of the seat's own triangle, which
 * is what an exact clearance against that triangle needs.
 *
 * @evidence contracts/common.md#principled-implementation Two normals answer two different questions: a continuous field for directions that must not jump between neighbouring seats, and the exact plane of the supporting triangle for clearance.
 * @evidence contracts/common.md#clear-and-simple-design One record per seat; a consumer builds whatever tangent basis it needs from the normal and its own reference direction.
 * @evidence contracts/common.md#meaningful-documentation States which normal is continuous and which is exact.
 * @evidence contracts/modeling.md#spatial-conventions Head frame (Y up, +Z anterior, +X anatomical left), metres for the point, unit vectors for both normals.
 *
 * @author Samchon
 */
export interface IHumanFaceSkinFrame {
  /** Current position of the seat, head-frame metres. */
  point: number[];

  /** Smooth outward unit normal at the seat. */
  normal: number[];

  /** Outward unit normal of the seat's triangle. */
  face: number[];
}
