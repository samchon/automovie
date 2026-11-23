import type { IAutoMovieCompiledFormationLod } from "./IAutoMovieCompiledFormationLod";

/**
 * One engine-compiled reusable prototype in a general instance set. Weight
 * participates in seeded per-slot selection; projectionRadius is an unscaled
 * source-radius estimate rather than a certified geometry bound.
 */
export interface IAutoMovieCompiledInstancePrototype {
  /** Stable source prototype id. */
  id: string;

  /** Model group id the source prototype names. */
  model: string;

  /** Positive deterministic selection weight. */
  weight: number;

  /** Ordered automatic LOD representations for this prototype. */
  lod: IAutoMovieCompiledFormationLod[];

  /**
   * Supplied or fallback source-radius estimate in metres before slot scaling;
   * model root offset and complete geometry coverage are separate producer
   * premises.
   */
  projectionRadius: number;
}
