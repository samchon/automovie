/** Evaluate every compiled wall boundary against the upper exterior-band rule. */

export interface BoundaryUpperRow {
  id: string;
  sampled: number;
  tested: number;
  exposed: number;
  maxBand: number;
  maxAt: { u: number; hostTop: number; firstCap: number; secondCap: number } | null;
}

