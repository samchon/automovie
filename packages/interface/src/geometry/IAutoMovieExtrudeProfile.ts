import type { IAutoMovieProfilePoint } from "./IAutoMovieProfilePoint";

/**
 * Data and callback contracts shared by the ExtrudeProfile operations.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A local XY metre profile and positive metre depth describe a convex prism centred on Z. The structural arrays permit concave, repeated and collinear points; the engine rejects them rather than silently changing the profile.
 * @evidence contracts/development/design.md#principled-representation A local XY metre profile and positive metre depth describe a convex prism centred on Z.
 * @evidence contracts/development/design.md#minimal-and-owned-surface extrudeAutoMovieProfile owns hull admission and mesh creation from this input.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The structural arrays permit concave, repeated and collinear points; the engine rejects them rather than silently changing the profile.
 */
export namespace IAutoMovieExtrudeProfile {
  /**
   * Extrude a convex XY profile along local Z into a closed triangle mesh
   * spanning `-depth / 2` to `+depth / 2`.
   *
   * The profile must be strictly convex: every point must be a hull corner, so
   * a concave, collinear, repeated or interior point is refused, as are fewer
   * than three non-collinear points, a non-finite point and a nonpositive depth.
   * The corners are re-ordered counter-clockwise from the hull's lowest-X corner.
   * Coordinates are metres; the input profile is only read.
   *
   * The result carries area-weighted vertex normals from `meshOf` and no texture
   * coordinates. Its side ring is one strip of shared vertices closed with a
   * modular index, so the vertex that starts the ring also ends it and no single
   * U could be both zero and the perimeter. `extrudeAutoMovieRegion` takes the
   * same kind of profile, keeps concave outlines and holes, and lays a metric
   * atlas over the result; use it whenever the prism carries a finish.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A local XY metre profile and positive metre depth describe a convex prism centred on Z. The structural arrays permit concave, repeated and collinear points; the engine rejects them rather than silently changing the profile.
   * @evidence contracts/development/design.md#principled-representation A local XY metre profile and positive metre depth describe a convex prism centred on Z.
   * @evidence contracts/development/design.md#minimal-and-owned-surface extrudeAutoMovieProfile owns hull admission and mesh creation from this input.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The structural arrays permit concave, repeated and collinear points; the engine rejects them rather than silently changing the profile.
   */
  export type IProps = {
    /** Strictly convex outline in local XY metres. */
    profile: readonly IAutoMovieProfilePoint[];

    /** Positive extrusion depth along local Z, in metres. */
    depth: number;
  };
}
