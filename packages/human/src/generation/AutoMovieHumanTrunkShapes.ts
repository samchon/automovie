import type { IAutoMovieHumanTrunkKey } from "@automovie/interface";

/** Centred elliptical templates for the trunk's tape-closure solve. */
export namespace AutoMovieHumanTrunkShapes {
  /** Pooled ANSUR II buttock depth over hip breadth (0.658 women and 0.710 men). */
  export const BUTTOCK_DEPTH: number = 0.684;

  /** Pooled ANSUR II waist depth over breadth (0.709 women and 0.727 men). */
  export const WAIST_DEPTH: number = 0.718;

  /** A section key from the proposed tape width, aspect ratio and median back. */
  export function key(
    y: number,
    width: number,
    depthRatio: number,
    back: number,
    anterior: number,
  ): IAutoMovieHumanTrunkKey {
    const halfDepth: number = depthRatio * width;
    return {
      y,
      width,
      middle: back + halfDepth,
      front: back + 2 * halfDepth,
      back,
      squareFront: 2,
      squareBack: 2,
      anterior,
    };
  }
}
