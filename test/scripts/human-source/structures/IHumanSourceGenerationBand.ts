/**
 * The neck band of the one skin and its blend weights: where the source rig
 * spreads neck motion, so channels crossing the cut fade over the same support
 * the skinning blends over.
 *
 * `loopSamples` are the 184 cut-sample skin ids ordered by azimuth about the
 * vertical axis through their neutral centroid `axis` ([x, z], metres); a
 * vertex's loop parameter is its azimuth about that axis. The head band is the
 * head-partition vertices (cut samples excluded) whose head weight is below
 * one; the body band the body-partition vertices (cut samples excluded) with
 * any neck or head weight. `headHeights[b]` / `bodyDepths[b]` are the largest
 * height above / depth below the loop among band vertices in azimuth bin `b`
 * of `azimuthBins` equal bins, interpolated linearly between bin centres. With
 * `t` that height ratio clamped to [0, 1], a band vertex's weight is
 * `1 - (6t^5 - 15t^4 + 10t^3)`: exactly one on the cut, zero at the band end
 * and beyond, C2 and monotone. Everything is computed from the neutral
 * geometry and the one weight map; no value is authored.
 *
 * @author Samchon
 */
export interface IHumanSourceGenerationBand {
  method: string;
  carryLandmark: string;
  loopSamples: number[];
  axis: number[];
  azimuthBins: number;
  headHeights: number[];
  bodyDepths: number[];
  headBand: number[];
  headWeights: number[];
  bodyBand: number[];
  bodyWeights: number[];
}
