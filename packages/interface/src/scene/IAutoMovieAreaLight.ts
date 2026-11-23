import type { IAutoMovieLightBase } from "./IAutoMovieLightBase";

/**
 * A rectangular emissive panel: a softbox, a window, a light strip, a luminous
 * ceiling coffer.
 *
 * This kind has finite width and height and maps to the viewer's native
 * rectangular-area lighting approximation. Dimensions describe the emitting
 * source separately from its intensity; they do not themselves establish
 * observed softness, material response or shadowing.
 *
 * The panel occupies its transform's local XY plane and emits toward local −Z,
 * matching the other aimed lights. The contract supplies width and height
 * rather than a punctual cutoff range; native rectangular-area evaluation owns
 * the resulting distance and angular response.
 *
 * Maps onto `three.js` `RectAreaLight`, which lights only physically-based
 * materials and casts no shadow map (see
 * {@link IAutoMovieLightBase.castShadow}). It has no glTF `KHR_lights_punctual`
 * counterpart, which is exactly why it is modeled here rather than borrowed.
 */
export interface IAutoMovieAreaLight extends IAutoMovieLightBase {
  /** Discriminator. */
  type: "area";

  /** Panel width in meters along its local X axis, finite and `> 0`. */
  width: number;

  /** Panel height in meters along its local Y axis, finite and `> 0`. */
  height: number;
}
