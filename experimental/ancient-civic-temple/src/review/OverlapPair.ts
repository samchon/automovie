
export interface OverlapPair {
  a: string;
  b: string;
  samples: number;
  maxDepth: number;
  at: { x: number; z: number; low: number; high: number; };
  bounds: { west: number; east: number; north: number; south: number; };
}
