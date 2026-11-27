/** A rectangular keep-clear area in the furnished room's XZ frame. */
export interface IAutoMovieFurnishingRectangle {
  /** Lower corner coordinate along positive X, in metres. */
  readonly x: number;

  /** Lower corner coordinate along positive Z, in metres. */
  readonly z: number;

  /** Positive extent along X, in metres. */
  readonly width: number;

  /** Positive extent along Z, in metres. */
  readonly depth: number;
}
