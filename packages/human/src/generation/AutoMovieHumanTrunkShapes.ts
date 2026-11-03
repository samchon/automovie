import type { IAutoMovieHumanTrunkKey } from "./IAutoMovieHumanTrunkKey";

/**
 * The trunk's section shapes at its landmark stations: depth over breadth,
 * the front's share of the depth, the forward place of the widest point and
 * the squareness of both quadrants, one set per station, shared by every
 * person. A tape's half width is solved on the section at its site, so the
 * shape here holds only proportions.
 *
 * Source and grade. Depth over breadth at the waist and the buttock is ANSUR
 * II's pooled waist depth over breadth (0.709 women, 0.727 men, mean 0.718)
 * and buttock depth over hip breadth (0.658, 0.710, mean 0.684); measured
 * (`docs/sources/ansur-ii.md`). Every other value is the median of the four
 * reference bodies' closed horizontal loops at the station's share of their
 * crotch-to-cervicale span, read by `packages/human/.shots/claude-trunk/scratch/measure.ts` (a local, untracked reading of the ignored reference curve packs); each is fitted, flagged, with its spread in
 * `docs/anatomy/trunk.md`. At the bust and the axilla the women's front
 * quadrant carries the breasts, so the chest wall takes the men's values and
 * the breasts are their own relief.
 */
export namespace AutoMovieHumanTrunkShapes {
  /** The shape at one station. */
  export interface IShape {
    /** Depth over breadth: front plus back depth over twice the half width. */
    depthRatio: number;

    /** The front depth's share of the whole depth. */
    frontShare: number;

    /** Forward place of the widest point, a share of stature. */
    middle: number;

    /** Squareness of the front quadrant. */
    squareFront: number;

    /** Squareness of the back quadrant. */
    squareBack: number;
  }

  /** At the crotch ring, before its fold: read at 0.073 of the span; the squareness of the buttock's. */
  export const CROTCH: IShape = { depthRatio: 0.53, frontShare: 0.428, middle: 0.0226, squareFront: 2.25, squareBack: 3.42 };

  /** Half width at the crotch over the buttock's: median 1.066, held out 1.040 to 1.097. Fitted, flagged. */
  export const CROTCH_WIDTH: number = 1.066;

  /** At the buttock point; the buttock relief adds what the depth ratio's 0.684 needs over the base's. */
  export const BUTTOCK: IShape = { depthRatio: 0.684, frontShare: 0.392, middle: 0.0281, squareFront: 2.25, squareBack: 3.42 };

  /** At the high hip, read at 0.250 of the span. */
  export const HIGH_HIP: IShape = { depthRatio: 0.7065, frontShare: 0.4875, middle: 0.0193, squareFront: 1.975, squareBack: 2.7 };

  /** At the natural waist, read at 0.381; the depth ratio ANSUR II's. */
  export const WAIST: IShape = { depthRatio: 0.718, frontShare: 0.5575, middle: 0.0173, squareFront: 2.15, squareBack: 3.13 };

  /** At the inframammary fold, read at 0.550. */
  export const FOLD: IShape = { depthRatio: 0.7185, frontShare: 0.6325, middle: 0.0042, squareFront: 2.095, squareBack: 4.485 };

  /** At the bust point: the chest wall, the men's, read at 0.649. */
  export const BUST: IShape = { depthRatio: 0.6865, frontShare: 0.6915, middle: -0.0137, squareFront: 2.185, squareBack: 4.41 };

  /** At the axilla, the trunk's top, read at 0.700. */
  export const AXILLA: IShape = { depthRatio: 0.6255, frontShare: 0.759, middle: -0.0259, squareFront: 3.34, squareBack: 4.8 };

  /** Half width at the axilla over the bust's: median 1.042, held out 1.039 to 1.061. Fitted, flagged. */
  export const AXILLA_WIDTH: number = 1.042;

  /**
   * At the shoulder point: the front and back midlines' places and the widest
   * point's as shares of stature, and the squareness, read at 0.894 of the
   * span (m1 and m2; the women's loops there are open). Fitted, flagged.
   */
  export const SHOULDER: { front: number; back: number; middle: number; squareFront: number; squareBack: number } = {
    front: 0.0359,
    back: -0.0486,
    middle: -0.0069,
    squareFront: 2,
    squareBack: 3,
  };

  /**
   * A key from a shape.
   *
   * @param y Height of the station, mm.
   * @param width Half width at the station, mm.
   * @param shape The station's shape.
   * @param stature Stature in calibration millimetres.
   * @param anterior Lateral share of the anterior axillary guide.
   * @returns The key.
   */
  export function key(
    y: number,
    width: number,
    shape: IShape,
    stature: number,
    anterior: number,
  ): IAutoMovieHumanTrunkKey {
    const depth: number = shape.depthRatio * 2 * width;
    const middle: number = shape.middle * stature;

    return {
      y,
      width,
      middle,
      front: middle + shape.frontShare * depth,
      back: middle - (1 - shape.frontShare) * depth,
      squareFront: shape.squareFront,
      squareBack: shape.squareBack,
      anterior,
    };
  }
}
