import type { IAutoMovieLightBase } from "./IAutoMovieLightBase";

/**
 * Infinitely distant parallel source whose transform orientation defines
 * direction and whose intensity has no distance falloff.
 */
export interface IAutoMovieDirectionalLight extends IAutoMovieLightBase {
  /** Discriminator. */
  type: "directional";
}
