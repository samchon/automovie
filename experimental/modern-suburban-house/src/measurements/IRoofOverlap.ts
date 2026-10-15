
/** Positive overlap between two roof solids found by the grid scan. */
export interface IRoofOverlap {
  /** First solid. */
  first: string;
  /** Second solid. */
  second: string;
  /** Grid cells where the solids overlap. */
  sampledCells: number;
  /** Largest vertical overlap in metres. */
  maximumDepth: number;
  /** Plan position of the largest overlap. */
  at: { x: number; z: number; };
}
