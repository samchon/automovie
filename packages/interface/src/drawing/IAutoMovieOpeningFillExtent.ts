/**
 * World-axis nominal dimensions of a placed fill or room bound.
 *
 * @evidence contracts/development/design.md#principled-representation IResult distinguishes world Y height from the wider horizontal axis span, both in metres with finite nonempty-input premises.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Opening fill fallback and room schedule boxes share this world-axis reading, while profile-local dimensions remain separate.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Rotation-induced bound changes remain observable and are not corrected into presumed manufactured dimensions.
 * @evidence contracts/development/common.md#meaningful-documentation IResult explains orientation, empty geometry, rounding and caller responsibility for numeric inputs.
 */
export namespace IAutoMovieOpeningFillExtent {
  /**
   * The nominal width and height a set of world corners stands for, on the
   * drawing grid, reading world `+Y` as up.
   *
   * Openings and rooms stand up: the world Y extent is the height, and the wider
   * of the X and Z extents is the width. A leaf lying on its side therefore
   * reads as a wide, thin opening, which is what its bounding extents say, and
   * is why every report of a fill's size labels it as the leaf's and not the
   * hole's. An empty corner set yields width and height of negative infinity,
   * so callers pass at least one finite corner. A single corner yields zero spans.
   *
   * The producer returns a fresh mutable pair rounded to six decimals with negative zero normalized. It performs no admission: finite world geometry and representable spans are caller premises, and NaN coordinates are skipped by each axis's range fold rather than rejected.
   *
   * @evidence contracts/development/design.md#principled-representation Height is the world Y span and width is max(X span, Z span), both metres; orientation-independent local dimensions are not represented. A finite nonempty input is needed for usable nonnegative spans.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Opening-fill fallback and room schedule bounds use this shared world-axis reading; profile-local hole dimensions remain a separate contract because their frame differs.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Rotated/lying leaves retain their measured world bounds and callers label fill-based measurements, rather than claiming manufactured leaf dimensions or hole clearance.
   * @evidence contracts/development/common.md#meaningful-documentation States axes, metres, orientation limitation, empty/single-point cases, numerical premises and output ownership.
   */
  export type IResult = {
    /** Larger of the world X and Z spans in metres, rounded to six decimals; not the fill's local width. */
    width: number;

    /** World Y span in metres, rounded to six decimals; not the fill's local height after arbitrary rotation. */
    height: number;
  };
}
