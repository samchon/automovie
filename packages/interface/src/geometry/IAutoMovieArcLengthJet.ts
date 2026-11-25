/**
 * A curve point and its first two derivatives with respect to arc length.
 *
 * All arrays have the same dimension and share the publishing curve's frame.
 * Human seams use two-dimensional section charts or three-dimensional world
 * coordinates. Physical coordinates are millimetres; for a regular curve the
 * tangent has unit length and the curvature vector is perpendicular to it, in
 * inverse millimetres. The chosen increasing arc-length direction determines
 * tangent sign. A receiving chart must explicitly preserve or reverse that
 * direction.
 *
 * Arrays are mutable published data. A consumer that borrows them without
 * mutation uses readonly array views of each member; `Readonly` on the record
 * alone does not freeze arrays. Human seam publication computes this jet from
 * parameter derivatives. Its current arithmetic, also used by chord-arc
 * publication, replaces zero speed by one: a zero first derivative therefore
 * produces a zero tangent and retains the second derivative as the numerical
 * curvature field. That degenerate result does not certify an arc-length frame
 * or curvature. Consumers needing geometric continuity must establish
 * regularity and consistent dimensions; this type performs no admission.
 */
export interface IAutoMovieArcLengthJet {
  /** Curve position in millimetres, in the publisher's coordinate frame. */
  point: number[];

  /**
   * Unit derivative along increasing arc length when regular; zero under the
   * publisher's zero-speed convention.
   */
  tangent: number[];

  /**
   * Regular second arc-length derivative in inverse millimetres; at zero speed
   * the publisher retains its source second derivative without a
   * geometric-curvature guarantee.
   */
  curvature: number[];
}
