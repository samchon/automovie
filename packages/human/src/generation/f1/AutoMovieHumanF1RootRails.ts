/** Actual accepted F1 periodic rail control values, mm; shared by declaration and full-domain native protection. */
export const AutoMovieHumanF1RootRails: {
  arm: number[];
  nose: number[];
  forArm: (side: 1 | -1) => number[];
  landing: Record<"arm" | "leg" | "breast" | "nose", number>;
} = {
  arm: [
    10, 10, 10, 10, 8, 3, 1.5, 1.5, 1.5, 3, 8, 10, 10, 10, 10, 10, 10, 10, 10,
    10, 10, 10, 10, 10,
  ],
  /** Original stored/twin phase map, shared by construction and root calibration. */
  forArm: (side: 1 | -1): number[] =>
    side > 0
      ? AutoMovieHumanF1RootRails.arm
      : AutoMovieHumanF1RootRails.arm.map(
          (_: number, j: number): number =>
            AutoMovieHumanF1RootRails.arm[
              (AutoMovieHumanF1RootRails.arm.length - j) %
                AutoMovieHumanF1RootRails.arm.length
            ]!,
        ),
  nose: [
    10, 9.5, 8, 7, 6, 5, 3.5, 2.5, 2, 2, 1.5, 1.5, 3, 5.5, 8, 8.5, 9, 8.5, 8,
    5.5, 3, 1.5, 1.5, 2, 2, 2.5, 3.5, 5, 6, 7, 8, 9.5,
  ],
  /**
   * Where each child's band lands on it, mm past the child's first knot: the single owner of the native root caliper sites
   * (`AutoMovieHumanF1NativeCalibration.RAIL`) and, once integrated, of `AutoMovieHumanF1.RAIL_MM`. The arm's is its periodic rail's
   * farthest landing and the nose's its nearest, read from the two rail tables above; the leg's 6 mm and the breast's 1 mm are the single
   * landing stations of the leg's split band and the mammary port, f1's authored values (`AutoMovieHumanF1.RAIL_MM`, which documents
   * them). Leaf data with no import, so the calibration and the figure share it without a module cycle.
   */
  landing: {
    get arm(): number {
      return Math.max(...AutoMovieHumanF1RootRails.arm);
    },
    leg: 6,
    breast: 1,
    get nose(): number {
      return Math.min(...AutoMovieHumanF1RootRails.nose);
    },
  },
};
