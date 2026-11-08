import { IAutoMovieClip, IAutoMovieLight } from "@automovie/interface";

/**
 * What {@link resolveShotLighting} evaluates: the staged lights and the clips
 * changing them.
 *
 *
 * @evidence contracts/development/design.md#principled-representation Provide staged lights, shot light-motion clips and shot-local seconds; resolveShotLighting samples pointer channels and reconstructs only touched lights.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The input keeps lighting evaluation independent of node world composition and renderer object allocation.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Omitted animation is represented by an empty clip list, retaining staged light identities; unknown light ids/properties are errors, not discarded tracks.
 * @evidence contracts/development/common.md#meaningful-documentation Members identify borrowed staging order, shot light-motion population and seconds rather than host clock time.
 */
export interface IAutoMovieShotLightingInput {
  /** The scene's staged lights, in staging order. */
  lights: readonly IAutoMovieLight[];

  /** The shot's light-motion clips (`IAutoMovieShot.lightMotions`). */
  clips: readonly IAutoMovieClip[];

  /** The instant to evaluate, in shot-local seconds. */
  seconds: number;
}
