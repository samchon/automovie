import type { IAutoMovieDrawingPoint } from "./IAutoMovieDrawingPoint";

/** Page-space section polygon and finite-working-window status of a convex cell. */
export namespace IAutoMovieDrawingCellSection {
  /**
   * Cross-section of one convex cell on the cut plane, as an unrounded page
   * polygon.
   *
   * Each world half-space `normal . p <= offset` becomes the page half-plane `a
   * x + b y <= c` through the frame's origin, right and up axes, and the
   * section is what survives clipping a square of half-extent 10,000 metres by
   * all of them. Reaching this working square, within the drawing epsilon,
   * makes `bounded` false. A large but mathematically bounded section can
   * therefore also fail this test; it is not a proof of global unboundedness.
   *
   * An empty `polygon` with `bounded: true` means the plane misses the cell. A
   * half-space parallel to the page keeps or removes the whole section by which
   * side of it the plane lies on.
   *
   * The polygon and result are fresh mutable values owned by the caller.
   * sectionAutoMovieDrawingSpaces discards false-bounded sections and sections
   * with fewer than three points, then rounds the remaining polygons. Input
   * plane validity and a finite orthonormal frame belong to the caller's
   * validated design/view; the section helper does not validate them.
   */
  export type IResult = {
    /**
     * Unrounded page-metre corners of the clipped working square. Empty means
     * no section; one/two-point or other degenerate results are not drawable
     * regions.
     */
    polygon: IAutoMovieDrawingPoint[];

    /**
     * True when every surviving coordinate is strictly within 10,000 metres
     * minus the drawing epsilon, or the intersection is empty; false makes the
     * section consumer omit this polygon.
     */
    bounded: boolean;
  };
}
