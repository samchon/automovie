/**
 * Non-negative half-extents of a planting cluster's world-XZ placement rectangle.
 *
 * @evidence contracts/common.md#principled-implementation Candidate sampling offsets the anchor independently within plus/minus each finite half-extent, with zero allowing a line or point placement domain.
 * @evidence contracts/common.md#clear-and-simple-design Two planar dimensions define placement support independently from grown plant height and per-member scale.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Extents are center-origin half-sizes, not full widths or inferred occupied foliage bounds; minimum spacing may still reject a degenerate domain.
 * @evidence contracts/common.md#meaningful-documentation Defines world axes, meter units and non-negative half-extent meaning.
 */
export interface IAutoMoviePlantingExtent {
  /** Half-extent along world `x` in metres; `>= 0`. */
  x: number;

  /** Half-extent along world `z` in metres; `>= 0`. */
  z: number;
}
