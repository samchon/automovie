import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/**
 * Original trunk wall chart, world point, anatomical AP direction and apex
 * distance. Runtime construction and admission remain with
 * AutoMovieHumanTrunkMassPlacement in Human.
 */
export namespace IAutoMovieHumanTrunkMassPlacement {
  /**
   * The original wall point, AP direction and distance to the declared apex.
   *
   * Its synchronous caller owns the returned tuples.
   */
  export interface IPlacement {
    /** Original trunk chart station and polar phase, mm and radians. */
    centre: [number, number];
    /** Original wall point at the target's Y/Z, calibration mm. */
    origin: AutoMovieVector3Tuple;
    /** Anatomical anterior or posterior unit direction. */
    normal: AutoMovieVector3Tuple;
    /** Positive AP distance from wall to apex, mm. */
    amplitude: number;
  }
}
