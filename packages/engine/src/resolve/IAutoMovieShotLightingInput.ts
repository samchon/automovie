import { IAutoMovieClip, IAutoMovieLight } from "@automovie/interface";

/**
 * What {@link resolveShotLighting} evaluates: the staged lights and the clips
 * changing them.
 *
 *
 * @evidence contracts/common.md#principled-implementation Provide staged lights, shot light-motion clips and shot-local seconds; resolveShotLighting samples pointer channels and reconstructs only touched lights.
 * @evidence contracts/common.md#clear-and-simple-design The input keeps lighting evaluation independent of node world composition and renderer object allocation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Omitted animation is represented by an empty clip list, retaining staged light identities; unknown light ids/properties are errors, not discarded tracks.
 * @evidence contracts/common.md#meaningful-documentation Members identify borrowed staging order, shot light-motion population and seconds rather than host clock time.
 * @evidence contracts/performance.md#efficient-algorithms The wrapper borrows L lights and C clips; per-clip key/value validation and sampling, then per-light lookup/reconstruction, own the actual work and output populations.
 * @evidence contracts/performance.md#reuse-equivalent-work Unchanged lights pass through by identity; changed samples rebuild touched lights while retaining unanimated nested fields.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns lights/clips and returned light array; this declaration acquires no renderer light, timer or background task.
 */
export interface IAutoMovieShotLightingInput {
  /** The scene's staged lights, in staging order. */
  lights: readonly IAutoMovieLight[];

  /** The shot's light-motion clips (`IAutoMovieShot.lightMotions`). */
  clips: readonly IAutoMovieClip[];

  /** The instant to evaluate, in shot-local seconds. */
  seconds: number;
}
