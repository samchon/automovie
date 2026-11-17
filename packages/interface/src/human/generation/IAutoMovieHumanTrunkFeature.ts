import type { IAutoMovieHumanTrunkFeatureFrame } from "./IAutoMovieHumanTrunkFeatureFrame";

/**
 * A trunk feature built in its own frame: the breast, the gluteal mass, the
 * umbilicus or the spinal furrow as a height over its footprint, ready to be
 * merged with the trunk by a relief window (`AutoMovieHumanTrunkReliefNet`).
 *
 * The height is measured along the frame's outward axis from the plane the
 * frame's origin and in-plane axes span; it is 0 outside the footprint, with
 * its slope and curvature (C2 contact with the wall).
 *
 *
 * @evidence contracts/development/common.md#meaningful-documentation A trunk feature built in its own frame: the breast, the gluteal mass, the umbilicus or the spinal furrow as a height over its footprint, ready to be merged with the trunk by a relief window (`AutoMovieHumanTrunkReliefNet`).
 * @evidence contracts/development/design.md#principled-representation `frame`: The feature's own frame. `height`: The height at a point of the frame's plane. `reach`: The footprint's extents in the frame's plane: `u` from the first to the second, `v` likewise, mm.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanBreastDome.create, AutoMovieHumanGlutealDome.create, AutoMovieHumanScapularMass.feature. Read by AutoMovieHumanBreastDome.surface, AutoMovieHumanTrunkReliefNet.fromFeature. Also types AutoMovieHumanBreastRelief.dome, AutoMovieHumanGlutealRelief.dome.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `frame`, `height`, `reach`, `apex`; callers supply the complete record.
 */
export interface IAutoMovieHumanTrunkFeature {
  /** The feature's own frame. */
  frame: IAutoMovieHumanTrunkFeatureFrame.IFrame;

  /**
   * The height at a point of the frame's plane.
   *
   * @param u Along the frame's lateral axis, mm.
   * @param v Along the frame's up axis, mm.
   * @returns The height along the axis, mm; negative for a pit or a furrow.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The height at a point of the frame's plane.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation This height signature specifies the documented callback contract without an implementation body; Human's breast, gluteal and furrow feature constructors and its supplied callbacks own the numerical method and its premises.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure The callable member exposes height at the containing contract boundary; decomposition of its implementation remains with Human's breast, gluteal and furrow feature constructors.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No constants, branches or fallback computation occur in this signature; the actual height provider is responsible for satisfying the documented semantics.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms This signature chooses no algorithm or allocation strategy; the runtime callback used or returned by Human's breast, gluteal and furrow feature constructors determines the work per height call.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The type itself coordinates no calls or caches; Human's breast, gluteal and furrow feature constructors's runtime provider owns reuse and must preserve the documented source identity and effects.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources This declaration acquires no state or resources; the height provider and the caller retaining its containing record own the callback and its captured dependencies.
   */
  height: (u: number, v: number) => number;

  /** The footprint's extents in the frame's plane: `u` from the first to the second, `v` likewise, mm. */
  reach: {
    /** Lower and upper lateral footprint coordinates in the feature's frame, millimetres. */
    u: [number, number];
    /** Lower and upper vertical footprint coordinates in the feature's frame, millimetres. */
    v: [number, number];
  };

  /** The footprint's centre of height: the place the height reaches its extreme, `[u, v]`, mm. */
  apex: [number, number];
}
