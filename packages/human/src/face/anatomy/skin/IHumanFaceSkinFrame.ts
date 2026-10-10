/**
 * The skin at one seat: where it is and which way it faces.
 *
 * `normal` is the smooth outward unit normal, interpolated over the triangle
 * from the host's welded vertex normals, so it turns continuously across
 * triangle edges. `face` is the unit normal of the seat's own triangle, which
 * is what an exact clearance against that triangle needs.
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
