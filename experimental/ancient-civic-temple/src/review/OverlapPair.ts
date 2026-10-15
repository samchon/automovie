
/** Overlap between two solid groups found by the envelope scan. */
export interface OverlapPair {
  /** First group, in sorted order. */
  a: string;
  /** Second group, in sorted order. */
  b: string;
  /** Grid samples where the two groups overlap by more than the tolerance. */
  samples: number;
  /** Largest vertical overlap depth in metres. */
  maxDepth: number;
  /** Sample of the deepest overlap with its overlapping height interval. */
  at: { x: number; z: number; low: number; high: number; };
  /** Plan extent of the overlapping samples. */
  bounds: { west: number; east: number; north: number; south: number; };
}
