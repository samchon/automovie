

/**
 * Opening size with its profile-or-fill measurement provenance.
 *
 * @evidence contracts/development/design.md#principled-representation IResult carries a basis for two distinct metre-valued frames or null for unmeasurable geometry; dimension absence is not encoded as zero.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Drawing opening marks and schedule rows consume the same precedence and provenance result from autoMovieOpeningNominalExtent.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A fill substitute remains labelled as such, so a leaf's extent cannot silently become a hole measurement.
 * @evidence contracts/development/common.md#meaningful-documentation IResult documents profile precedence, null causes, basis-specific axes and rounding.
 */
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
   * A non-null result is a fresh mutable value rounded to six decimals with negative zero normalized. The supplied design index must match a validated environment; lookup/geometry and numerical premises are not certified by a non-null result.
   *
   * @evidence contracts/development/design.md#principled-representation The basis discriminant distinguishes face-local void hull spans from world-axis fill extents, both in metres. Null records absent measurable geometry instead of mixing absent and numeric dimensions.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Opening marks and schedule occurrences share this result so profile precedence and fill substitution are consistent; geometry sizing remains in the two specific extent producers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The fallback is explicitly labelled fill and never called hole geometry; a null result becomes the consumer's none/unmeasured basis rather than zero size.
   * @evidence contracts/development/common.md#meaningful-documentation Defines basis-specific frames, metre units, precedence, all absence cases, rounding and result ownership.
   */
  export type IResult = {
    /** profile uses the opening's own face-local void hull; fill uses placed filling-element triangles only when no profile exists. */
    basis: "profile" | "fill";

    /** Six-decimal metres: face-local x span for profile, or max(world X span, world Z span) for fill. */
    width: number;

    /** Six-decimal metres: face-local y span for profile, or world Y span for fill. */
    height: number;
  } | null;
}
