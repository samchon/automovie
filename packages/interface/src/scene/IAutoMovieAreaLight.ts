import { IAutoMovieLightBase } from "./IAutoMovieLightBase";

/**
 * A rectangular emissive panel: a softbox, a window, a light strip, a luminous ceiling coffer.
 *
 * This kind has finite width and height and maps to the viewer's native rectangular-area lighting approximation. Dimensions describe the emitting source separately from its intensity; they do not themselves establish observed softness, material response or shadowing.
 *
 * The panel occupies its transform's local XY plane and emits toward local −Z, matching the other aimed lights. The contract supplies width and height rather than a punctual cutoff range; native rectangular-area evaluation owns the resulting distance and angular response.
 *
 * Maps onto `three.js` `RectAreaLight`, which lights only physically-based materials and casts no shadow map (see {@link IAutoMovieLightBase.castShadow}). It has no glTF `KHR_lights_punctual` counterpart, which is exactly why it is modeled here rather than borrowed.
 *
 * @evidence contracts/common.md#principled-implementation A finite positive local-XY rectangle with linear color and luminance maps to the viewer's rectangular area-light implementation; its aimed transform and dimensions determine the source rather than a punctual falloff range.
 * @evidence contracts/common.md#clear-and-simple-design Extends shared light identity and placement with only area discriminator and panel dimensions, leaving supported material response and renderer implementation at the light consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Area lights support physically based materials and no shadow map, so cast-shadow and punctual range semantics cannot be used to imitate another light kind.
 * @evidence contracts/common.md#meaningful-documentation Defines emitting plane and direction, meter extents, area-source intensity and material/shadow limitations.
 */
export interface IAutoMovieAreaLight extends IAutoMovieLightBase {
  /** Discriminator. */
  type: "area";

  /** Panel width in meters along its local X axis, finite and `> 0`. */
  width: number;

  /** Panel height in meters along its local Y axis, finite and `> 0`. */
  height: number;
}
