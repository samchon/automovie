import { IAutoMovieLightBase } from "./IAutoMovieLightBase";

/**
 * A rectangular emissive panel: a softbox, a window, a light strip, a luminous ceiling coffer.
 *
 * The light kind with extent. A punctual source has a position and no size, so its terminator is hard however far away it stands; a built interior is mostly lit by surfaces, and the soft wrap those surfaces give is a function of the panel's width and height, not of an intensity an author could tune to imitate it.
 *
 * The panel occupies its transform's local XY plane and emits from the face its local −Z points at, which is the same convention every aimed light here uses, so one `direction` reads identically on a spot and on a window. It has no distance falloff parameter: the inverse-square term follows from the panel's own area, so a `range` would be a second, contradictory falloff.
 *
 * Maps onto `three.js` `RectAreaLight`, which lights only physically-based materials and casts no shadow map (see {@link IAutoMovieLightBase.castShadow}). It has no glTF `KHR_lights_punctual` counterpart, which is exactly why it is modeled here rather than borrowed.
 *
 * @evidence contracts/common.md#principled-implementation A finite positive local-XY rectangle with linear color and luminance maps to the viewer's rectangular area-light implementation; its aimed transform and dimensions determine the source rather than a punctual falloff range.
 * @evidence contracts/common.md#clear-and-simple-design Extends shared light identity and placement with only area discriminator and panel dimensions, leaving supported material response and renderer implementation at the light consumer.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Area lights support physically based materials and no shadow map, so cast-shadow and punctual range semantics cannot be used to imitate another light kind.
 * @evidence contracts/common.md#meaningful-documentation Defines emitting plane and direction, meter extents, area-source intensity and material/shadow limitations.
 * @author Samchon
 */
export interface IAutoMovieAreaLight extends IAutoMovieLightBase {
  /** Discriminator. */
  type: "area";

  /** Panel width in meters along its local X axis, finite and `> 0`. */
  width: number;

  /** Panel height in meters along its local Y axis, finite and `> 0`. */
  height: number;
}
