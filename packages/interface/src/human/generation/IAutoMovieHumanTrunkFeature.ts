import type { IAutoMovieHumanTrunkFeatureFrame } from "./IAutoMovieHumanTrunkFeatureFrame";

/**
 * A trunk feature built in its own frame: the breast, the gluteal mass, the
 * umbilicus or the spinal furrow as a height over its footprint, ready to be
 * merged with the trunk by a relief window (`AutoMovieHumanTrunkReliefNet`).
 *
 * The height is measured along the frame's outward axis from the plane the
 * frame's origin and in-plane axes span; it is 0 outside the footprint, with
 * its slope and curvature (C2 contact with the wall).
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
   */
  height: (u: number, v: number) => number;

  /**
   * The footprint's extents in the frame's plane: `u` from the first to the
   * second, `v` likewise, mm.
   */
  reach: {
    /**
     * Lower and upper lateral footprint coordinates in the feature's frame,
     * millimetres.
     */
    u: [number, number];
    /**
     * Lower and upper vertical footprint coordinates in the feature's frame,
     * millimetres.
     */
    v: [number, number];
  };

  /**
   * The footprint's centre of height: the place the height reaches its extreme,
   * `[u, v]`, mm.
   */
  apex: [number, number];
}
