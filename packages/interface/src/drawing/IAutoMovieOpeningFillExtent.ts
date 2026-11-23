/** World-axis nominal dimensions of a placed fill or room bound. */
export namespace IAutoMovieOpeningFillExtent {
  /**
   * The nominal width and height a set of world corners stands for, on the
   * drawing grid, reading world `+Y` as up.
   *
   * Openings and rooms stand up: the world Y extent is the height, and the
   * wider of the X and Z extents is the width. A leaf lying on its side
   * therefore reads as a wide, thin opening, which is what its bounding extents
   * say, and is why every report of a fill's size labels it as the leaf's and
   * not the hole's. An empty corner set yields width and height of negative
   * infinity, so callers pass at least one finite corner. A single corner
   * yields zero spans.
   *
   * The producer returns a fresh mutable pair rounded to six decimals with
   * negative zero normalized. It performs no admission: finite world geometry
   * and representable spans are caller premises, and NaN coordinates are
   * skipped by each axis's range fold rather than rejected.
   */
  export type IResult = {
    /**
     * Larger of the world X and Z spans in metres, rounded to six decimals; not
     * the fill's local width.
     */
    width: number;

    /**
     * World Y span in metres, rounded to six decimals; not the fill's local
     * height after arbitrary rotation.
     */
    height: number;
  };
}
