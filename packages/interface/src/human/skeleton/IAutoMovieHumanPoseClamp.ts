/** A requested pose value replaced by its range limit.
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A requested pose value replaced by its range limit.
 * @evidence contracts/development/design.md#principled-representation `path`: Field path with the side resolved, such as `legs.left.knee.flexion`. `requested`: Requested clinical channel value: degrees for angular channels, millimetres for jaw opening, protrusion and lateral excursion. `applied`: Value applied after the channel range clamp, in the same units as requested.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by AutoMovieHumanRigControls.readApplied. Also types AutoMovieHumanPreparedKinematics.clamped.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `path`, `requested`, `applied`; callers supply the complete record.
 */
export interface IAutoMovieHumanPoseClamp {
  /** Field path with the side resolved, such as `legs.left.knee.flexion`. */
  path: string;

  /** Requested clinical channel value: degrees for angular channels, millimetres for jaw opening, protrusion and lateral excursion. */
  requested: number;

  /** Value applied after the channel range clamp, in the same units as requested. */
  applied: number;
}
