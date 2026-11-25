/** Face-local opening-void hull dimensions used by drawings and schedules. */
export namespace IAutoMovieOpeningExtent {
  /**
   * The width and height of an opening's void, in its host face's metres, on
   * the drawing grid.
   *
   * Taken from the engine's own bounding hull of the outline rather than a
   * second arithmetic: `builtBoundaryWallCut` hands that hull to the mesh
   * kernel as the rectangle it cuts, and validation holds the void inside its
   * face by the same hull, so the schedule prints the size of the hole the
   * building has. The hull is tight for an arc on a chord parallel to a face
   * axis, such as an arched head or a round oculus written as two half turns,
   * and larger than the arc for a tilted chord.
   *
   * AutoMovieOpeningExtent returns a fresh mutable pair, rounded to six decimal
   * places with negative zero normalized. It relies on an admitted opening
   * profile, as supplied by validated drawing/schedule derivation; it does not
   * validate profile shape, finite intermediate values or a usable physical
   * opening itself.
   */
  export type IResult = {
    /**
     * Difference between maximum and minimum hull x in host-face metres,
     * rounded to six decimals.
     */
    width: number;

    /**
     * Difference between maximum and minimum hull y in host-face metres,
     * rounded to six decimals.
     */
    height: number;
  };
}
