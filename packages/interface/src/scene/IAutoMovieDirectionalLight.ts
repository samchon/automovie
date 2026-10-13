import { IAutoMovieLightBase } from "./IAutoMovieLightBase";

/** Infinitely-distant parallel light (sun). No distance falloff. */
export interface IAutoMovieDirectionalLight extends IAutoMovieLightBase {
  /** Discriminator. */
  type: "directional";
}
