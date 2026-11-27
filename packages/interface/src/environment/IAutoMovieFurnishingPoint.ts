/** A position in the furnished room's XZ frame, in metres. */
export interface IAutoMovieFurnishingPoint {
  /** Coordinate along positive X from the room-frame origin. */
  readonly x: number;

  /** Coordinate along positive Z from the room-frame origin. */
  readonly z: number;
}
