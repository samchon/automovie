/**
 * One axis-aligned rectangular void in a wall's local XY face, in metres from
 * the wall's lower-left corner, as `buildAutoMovieWall` cuts it.
 *
 * The wall builder refuses a blank or repeated `id`, a non-finite corner, a
 * nonpositive size, an opening reaching past the wall, two openings that
 * overlap, two that meet only at a corner and pinch the wall to a line, and a
 * set that removes the whole wall. `builtBoundaryWallCut` derives one per
 * built opening from the bounding box of its profile's hull.
 *
 * @evidence contracts/common.md#principled-implementation An origin corner plus a positive size gives the cut lines the wall builder partitions at, and its exact sums are the same doubles adjacent cells share, so cells around an opening weld without rounding gaps.
 * @evidence contracts/common.md#clear-and-simple-design Five fields, an identity for diagnostics and one rectangle, because the lattice wall can cut only rectangles; arbitrary outlines belong to region extrusion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Overlapping or corner-meeting openings are refused rather than merged or nudged apart, so the wall never emits a pinched or double-cut solid.
 * @evidence contracts/common.md#meaningful-documentation States the frame, unit and origin corner, every refusal the builder applies, and the producer that maps built openings onto it.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record; overlap checks and the cut lattice are answered on `buildAutoMovieWall`.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Supplied per wall build; nothing derived from an opening is cached across builds.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources An identity string and four numbers, caller-owned and never retained by the built mesh.
 */
export interface IAutoMovieWallOpening {
  /** Opening identity, non-blank and unique per wall, named in diagnostics. */
  id: string;

  /** Left edge in metres from the wall's left edge, at least zero. */
  x: number;

  /** Bottom edge in metres from the wall's bottom edge, at least zero. */
  y: number;

  /** Positive width in metres; `x + width` may not exceed the wall width. */
  width: number;

  /** Positive height in metres; `y + height` may not exceed the wall height. */
  height: number;
}
