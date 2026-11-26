/** Actual accepted F1 periodic rail control values, mm; shared by declaration and full-domain native protection. */
export namespace AutoMovieHumanF1RootRails {
  /** Actual periodic arm rail control values, in millimetres. */
  export const arm: number[] = [
    10, 10, 10, 10, 8, 3, 1.5, 1.5, 1.5, 3, 8, 10, 10, 10, 10, 10, 10, 10, 10,
    10, 10, 10, 10, 10,
  ];

  /** Original stored/twin phase map, shared by construction and root calibration. */
  export function forArm(side: 1 | -1): number[] {
    return side > 0
      ? arm
      : arm.map(
          (_: number, j: number): number => arm[(arm.length - j) % arm.length]!,
        );
  }

  /** Actual accepted nose rail control values, in millimetres. */
  export const nose: number[] = [
    10, 9.5, 8, 7, 6, 5, 3.5, 2.5, 2, 2, 1.5, 1.5, 3, 5.5, 8, 8.5, 9, 8.5, 8,
    5.5, 3, 1.5, 1.5, 2, 2, 2.5, 3.5, 5, 6, 7, 8, 9.5,
  ];

  /** Named landing contract for the authored root stations, in millimetres. */
  export interface ILanding {
    arm: number;
    leg: number;
    breast: number;
    nose: number;
  }

  /**
   * Where each child's band lands on it, mm past the child's first knot: the single owner of the native root caliper sites
   * (`AutoMovieHumanF1NativeCalibration.RAIL`) and, once integrated, of `AutoMovieHumanF1.RAIL_MM`. The arm's is its periodic rail's
   * farthest landing and the nose's its nearest, read from the two rail tables above; the leg's 6 mm and the breast's 1 mm are the single
   * landing stations of the leg's split band and the mammary port, f1's authored values (`AutoMovieHumanF1.RAIL_MM`, which documents
   * them). Leaf data with no import, so the calibration and the figure share it without a module cycle.
   */
  export const landing: ILanding = {
    get arm(): number {
      return Math.max(...arm);
    },
    leg: 6,
    breast: 1,
    get nose(): number {
      return Math.min(...nose);
    },
  };
}
