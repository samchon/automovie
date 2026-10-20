import { IAutoMoviePlanarPoint } from "./IAutoMoviePlanarPoint";

/**
 * A closed outline in the host boundary's own frame, straight edges or arcs.
 *
 * Edge `i` runs from `outline[i]` to `outline[(i + 1) % outline.length]`. A rectangular door is four points without bulges; a round oculus uses two points and two half-turn bulges; a round-headed arch has jambs and one bulged head edge. The outline represents these shapes without an opening-type enum.
 *
 * Validation and extents read a conservative straight ring. Signed chord-ring winding and bulge sign identify inward arcs, which retain their chords; outward arcs expand to their chord-and-sagitta rectangles. Zero-area chord rings retain rectangle expansion, including two-arc circles. The resulting ring must enclose area, remain simple, fit inside the host face and avoid other opening rings. This admission does not separately prove that authored circular arcs have no intersections. Area uses the closed circular-segment formula in floating-point arithmetic, while drawings use fixed-step chords.
 *
 * @evidence contracts/common.md#principled-implementation outlineHull retains inward-arc chords and bounds outward half-turn-limited arcs by chord/sagitta rectangles, using signed chord-ring winding; zero-area rings keep rectangle expansion. autoMovieOpeningArea adds floating circular-segment area and rounds to the drawing grid. Simple-hull admission does not independently prove circular-arc simplicity, and conservative exact-real geometry does not make overflow-prone binary64 predicates a universal one-sided certificate.
 * @evidence contracts/common.md#clear-and-simple-design One outline with optional per-edge bulges covers rectangles, arches, and circles, and absent bulges mean straight edges, so no opening-type enum or second arc record exists.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Winding and bulge sign determine each arc's conservative ring treatment without shape-specific sampling; arcs past a half turn and zero-area bulge-free two-point outlines refuse, with no invented corner or separate arc-intersection proof.
 * @evidence contracts/common.md#meaningful-documentation States edge indexing, inward/outward and zero-winding policies, hull-versus-circular-simplicity limits, planar units, analytic area versus drawing chords, and the bulge's magnitude/sign/half-turn limit.
 */
export interface IAutoMovieOpeningProfile {
  /**
   * Closed outline in host-boundary-local XY metres, at least two points.
   *
   * Two is the floor because a circle can be two arcs. The resulting bounding ring must enclose area, so two points without bulges still refuse.
   */
  outline: IAutoMoviePlanarPoint[];

  /**
   * Per-edge circular bulge, one entry per edge when stated at all.
   *
   * The magnitude is the polyline bulge tan(theta / 4) for included angle theta: zero is straight and one is a half turn. Its sign is mirrored from AutoCAD/DXF: positive leans left of the directed chord and follows a clockwise arc, so imported DXF bulges are negated. Each value must be finite with magnitude at most one; longer arcs require multiple edges. Ring winding determines whether each signed bulge is inward or outward for conservative bounds.
   */
  bulges?: number[];
}
