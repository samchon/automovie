/**
 * Face-local opening-void hull dimensions used by drawings and schedules.
 *
 * @evidence contracts/development/design.md#principled-representation IResult reports face-local hull spans in metres, whose numerical validity depends on admitted profile geometry.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Nominal opening sizing reuses this result for profile-based marks and schedule dimensions; world fill measurements have a distinct frame.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The hull convention remains explicit for tilted arcs instead of claiming exact arc spans or usable clearance.
 * @evidence contracts/development/common.md#meaningful-documentation IResult identifies face axes, grid rounding, hull scope and ownership.
 */
export namespace IAutoMovieOpeningExtent {
  /**
   * The width and height of an opening's void, in its host face's metres, on
   * the drawing grid.
   *
   * Taken from the engine's own bounding hull of the outline rather than a
   * second arithmetic: `builtBoundaryWallCut` hands that hull to the mesh kernel
   * as the rectangle it cuts, and validation holds the void inside its face by
   * the same hull, so the schedule prints the size of the hole the building
   * has. The hull is tight for an arc on a chord parallel to a face axis, such
   * as an arched head or a round oculus written as two half turns, and larger
   * than the arc for a tilted chord.
   *
   * autoMovieOpeningExtent returns a fresh mutable pair, rounded to six decimal places with negative zero normalized. It relies on an admitted opening profile, as supplied by validated drawing/schedule derivation; it does not validate profile shape, finite intermediate values or a usable physical opening itself.
   *
   * @evidence contracts/development/design.md#principled-representation Width and height measure the profile hull's face-local x/y spans in metres. Nonnegative finite values depend on valid nonempty geometry and representable arithmetic, which this number pair cannot enforce.
   * @evidence contracts/development/design.md#minimal-and-owned-surface autoMovieOpeningNominalExtent adds measurement basis to this same pair for both opening marks and schedule rows; no page projection or world orientation is encoded here.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The reported hull matches the wall-cut bound even when a tilted arc has a smaller exact span; the dimensions are not a collision or traversal clearance certificate.
   * @evidence contracts/development/common.md#meaningful-documentation States face-local axes, metres, rounding, hull approximation, validation premises and result ownership.
   */
  export type IResult = {
    /** Difference between maximum and minimum hull x in host-face metres, rounded to six decimals. */
    width: number;

    /** Difference between maximum and minimum hull y in host-face metres, rounded to six decimals. */
    height: number;
  };
}
