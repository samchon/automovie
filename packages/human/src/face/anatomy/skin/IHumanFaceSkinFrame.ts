/**
 * The skin at one seat: where it is and which way it faces.
 *
 * `normal` is the smooth outward unit normal, interpolated over the triangle
 * from the host's welded vertex normals, so it turns continuously across
 * triangle edges. `face` is the unit normal of the seat's own triangle, which
 * is what an exact clearance against that triangle needs.
 *
 * @evidence contracts/common.md#principled-implementation One barycentric seat yields a head-frame point, welded-area smooth normal and native facet normal; createHumanFaceSkinHost falls back to the facet when the interpolated normal vanishes or reverses.
 * @evidence contracts/common.md#clear-and-simple-design Smooth orientation and facet orientation have separate fields because attached shafts and exact facet clearance require different normals at the same point.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Frame values come from the current native host rather than a forward head-axis projection or consumer-specific replacement normal.
 * @evidence contracts/common.md#meaningful-documentation The comment states head-frame metres, outward unit directions and the different smooth versus facet uses; array shape admission remains with the producer.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This result interface executes no normal interpolation; the host reader owns that fixed-corner work.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This result type caches no frame; consumers read their immutable host state through its seat.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The result declaration acquires no resource; returned point and normal arrays are ordinary consumer-owned values.
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
