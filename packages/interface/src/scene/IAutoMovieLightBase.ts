import { IAutoMovieColor } from "../color/IAutoMovieColor";
import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { IAutoMovieLightShadow } from "./IAutoMovieLightShadow";

/**
 * Fields shared by every light kind.
 *
 * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-linking Exposes `IAutoMovieLightBase` as the portable data boundary for the lighting linking requirement.
 * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `IAutoMovieLightBase` for the clv light link resolution system contract.
 */
export interface IAutoMovieLightBase {
  /**
   * Stable id.
   *
   * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-linking Exposes `id` as the portable data boundary for the lighting linking requirement.
   * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `id` for the clv light link resolution system contract.
   */
  id: string;

  /**
   * World placement. For directional light only the orientation matters.
   *
   * Animatable, like every other field here: a shot's `lightMotions` reaches
   * the translation through `/lights/<id>/position` and the rotation through
   * `/lights/<id>/rotation`, so a light may travel and turn over time. `scale`
   * is the one component no channel writes — a punctual light has no extent for
   * a scale to describe.
   *
   * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-linking Exposes `transform` as the portable data boundary for the lighting linking requirement.
   * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `transform` for the clv light link resolution system contract.
   */
  transform: IAutoMovieTransform;

  /**
   * Light color (linear).
   *
   * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-linking Exposes `color` as the portable data boundary for the lighting linking requirement.
   * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `color` for the clv light link resolution system contract.
   */
  color: IAutoMovieColor;

  /**
   * Radiant intensity, `>= 0`: lux for directional, candela for point/spot, and
   * nits (candela per square metre) for an area panel, whose emitted power is
   * therefore its intensity times its own area.
   *
   * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-linking Exposes `intensity` as the portable data boundary for the lighting linking requirement.
   * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `intensity` for the clv light link resolution system contract.
   */
  intensity: number;

  /**
   * Whether this source casts a shadow map. Omitted preserves legacy output.
   *
   * What this light WOULD cast, not what the frame renders: a scene's
   * `environment.shadows.enabled` is the master switch and turning it off
   * renders no shadow map for any light, which is also how the render budget
   * prices it. A scene declaring no environment leaves the decision to the host
   * renderer, exactly as it did before environments existed.
   *
   * Only the three punctual kinds can cast one. A rectangular area source is
   * analytically integrated rather than rasterized from a light-space camera,
   * so `three.js` renders no shadow map for it and the engine refuses
   * `castShadow` on an {@link IAutoMovieAreaLight} instead of accepting a flag
   * no frame would honor.
   *
   * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-linking Exposes `castShadow` as the portable data boundary for the lighting linking requirement.
   * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `castShadow` for the clv light link resolution system contract.
   */
  castShadow?: boolean;

  /**
   * Deterministic shadow-camera tuning, required exactly when `castShadow` is
   * true.
   *
   * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-linking Exposes `shadow` as the portable data boundary for the lighting linking requirement.
   * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `shadow` for the clv light link resolution system contract.
   */
  shadow?: IAutoMovieLightShadow;
}
