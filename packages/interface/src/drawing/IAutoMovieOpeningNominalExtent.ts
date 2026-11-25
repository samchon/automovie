/** Opening size with its profile-or-fill measurement provenance. */
export namespace IAutoMovieOpeningNominalExtent {
  /**
   * The nominal width and height of one opening, and what they were measured
   * from, or `null` when nothing in the design sizes it.
   *
   * The opening's own void wins: it is the only record that describes the hole,
   * and its size is the hull the wall kernel cuts (`basis: "profile"`). Without
   * one, the filling element's world extent stands in (`basis: "fill"`), which
   * is the leaf and not the hole, so every caller labels it. An opening with
   * neither, or whose fill has no environment-owned model or no triangles, is
   * `null`. The drawing and the schedule both read this, so a sheet and a
   * schedule cannot size one opening two ways.
   *
   * A non-null result is a fresh mutable value rounded to six decimals with
   * negative zero normalized. The supplied design index must match a validated
   * environment; lookup/geometry and numerical premises are not certified by a
   * non-null result.
   */
  export type IResult = {
    /**
     * Profile uses the opening's own face-local void hull; fill uses placed
     * filling-element triangles only when no profile exists.
     */
    basis: "profile" | "fill";

    /**
     * Six-decimal metres: face-local x span for profile, or max(world X span,
     * world Z span) for fill.
     */
    width: number;

    /**
     * Six-decimal metres: face-local y span for profile, or world Y span for
     * fill.
     */
    height: number;
  } | null;
}
