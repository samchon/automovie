import { IAutoMovieLightBase } from "./IAutoMovieLightBase";

/**
 * Infinitely distant parallel source whose transform orientation defines direction and whose intensity has no distance falloff.
 *
 * @evidence contracts/common.md#principled-implementation The directional discriminator selects parallel lighting with orientation and lux intensity inherited from the shared light contract; viewer placement does not use a finite range.
 * @evidence contracts/common.md#clear-and-simple-design Adds only the discriminator because shared identity, color, orientation and explicit shadow tuning already supply its required state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts World translation is not a source-distance measurement and no guessed range imitates a point light.
 * @evidence contracts/common.md#meaningful-documentation Defines parallel direction, absent falloff and shared light/shadow ownership.
 */
export interface IAutoMovieDirectionalLight extends IAutoMovieLightBase {
  /** Discriminator. */
  type: "directional";
}
