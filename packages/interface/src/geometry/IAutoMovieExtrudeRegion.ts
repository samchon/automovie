import type { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";

/**
 * Data and callback contracts shared by the ExtrudeRegion operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Local XY metre rings and metre depth define a region extruded symmetrically along Z. Absent holes mean a solid section; ring validity and positive depth are checked by the engine, not encoded by number arrays.
 * @evidence contracts/development/design.md#principled-representation Local XY metre rings and metre depth define a region extruded symmetrically along Z.
 * @evidence contracts/development/design.md#minimal-and-owned-surface extrudeAutoMovieRegion consumes the outer ring, optional holes and depth through the shared triangulator.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Absent holes mean a solid section; ring validity and positive depth are checked by the engine, not encoded by number arrays.
 */
export namespace IAutoMovieExtrudeRegion {
  /**
   * Extrude a free-form planar region, holes and all, into a closed prism along
   * local Z spanning `-depth / 2` to `+depth / 2`.
   *
   * `extrudeAutoMovieProfile` hulls its profile, so an L-shaped section, a
   * channel, a frame section and a hollow tube are all refused there. This
   * operation takes any region `triangulateAutoMovieRegion` accepts, which also
   * makes it the kernel's arbitrary-shape opening: a wall whose outer ring is the
   * panel and whose holes are an arch, an oculus or any authored outline is one
   * extrusion with real holes, where `buildAutoMovieWall` cuts only rectangles.
   *
   * Every triangle owns its corners, so the crease where a cap meets a side stays
   * sharp. The atlas is metric: a cap carries its own profile XY, mirrored in V
   * on the bottom cap so it reads the right way round from below, and a side
   * carries the distance travelled along its ring as U against Z as V. Each ring
   * is developed from its canonical first point, from zero to its full
   * perimeter, so the side's texture phases meet at that point only when the
   * declared repeat divides the perimeter. That developed frame differs from
   * `buildAutoMoviePolyhedron`'s projected one because a side following an arc is
   * metric only when measured along the arc; both are metres, so one declared
   * scale reads the same on both.
   *
   * The result is a closed 2-manifold whose volume is the region's area times the
   * depth. Inputs are only read; every output buffer is new. A nonpositive depth
   * and an invalid region throw, the latter with the triangulator's diagnostic
   * labelled `polygon`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Local XY metre rings and metre depth define a region extruded symmetrically along Z. Absent holes mean a solid section; ring validity and positive depth are checked by the engine, not encoded by number arrays.
   * @evidence contracts/development/design.md#principled-representation Local XY metre rings and metre depth define a region extruded symmetrically along Z.
   * @evidence contracts/development/design.md#minimal-and-owned-surface extrudeAutoMovieRegion consumes the outer ring, optional holes and depth through the shared triangulator.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Absent holes mean a solid section; ring validity and positive depth are checked by the engine, not encoded by number arrays.
   */
  export type IProps = {
    /** Outer boundary in local XY metres. */
    outer: readonly IAutoMovieProfilePoint[];

    /** Voids through the whole depth. */
    holes?: ReadonlyArray<readonly IAutoMovieProfilePoint[]>;

    /** Positive extrusion depth along local Z, in metres. */
    depth: number;
  };
}
