import type { IAutoMovieCompiledEffect } from "../production/IAutoMovieCompiledEffect";

/**
 * The cue identity and shot-local time window needed for film interval
 * projection.
 *
 * Start is inclusive and end exclusive in shot-local seconds; id and zone
 * retain their compiled cue and world-zone identities. Projection checks finite
 * nonnegative start, end greater than start and representable frame boundaries;
 * id and zone resolution remain compilation responsibilities.
 */
export type IAutoMovieShotEffect = Pick<
  IAutoMovieCompiledEffect,
  "id" | "zone" | "start" | "end"
>;
