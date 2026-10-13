import { IAutoMovieCompiledFormationLod } from "@automovie/interface";

/** Inputs to the deterministic automatic formation LOD selector. */
export interface IAutoMovieFormationLodInput {
  /** Ordered compiled anonymous representations. */
  lod: readonly IAutoMovieCompiledFormationLod[];
  /** Camera-to-chunk-centroid distance in meters. */
  distance: number;
  /** Projected representative-member diameter in physical pixels. */
  projectedPixels: number;
  /** Tier retained from the previous frame, or null on first selection. */
  previous: IAutoMovieCompiledFormationLod["tier"] | null;
  /** Fractional boundary deadband; 0.1 by default. */
  hysteresis?: number;
}
