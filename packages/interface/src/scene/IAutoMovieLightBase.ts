import { IAutoMovieColor } from "../color/IAutoMovieColor";
import { IAutoMovieTransform } from "../geometry/IAutoMovieTransform";
import { IAutoMovieLightShadow } from "./IAutoMovieLightShadow";

/**
 * Shared light identity, world placement, linear emission and explicitly admitted shadow state.
 *
 * @evidence contracts/common.md#principled-implementation Kind-specific intensity units and transform state feed the viewer light adapter; validated position/rotation and emission pointer channels animate them while the scene's shadow master switch controls actual map work.
 * @evidence contracts/common.md#clear-and-simple-design Common fields avoid duplicating identity and color across light kinds, with shadow tuning linked explicitly to castShadow rather than implicit host presets.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Area shadow flags refuse, shadow controls are required exactly for casting punctual sources, and authored light flags do not override a disabled scene shadow policy.
 * @evidence contracts/common.md#meaningful-documentation Defines transform and channel ownership, linear color, lux/candela/nit units and requested versus actually rendered shadow state.
 */
export interface IAutoMovieLightBase {
  /** Stable id. */
  id: string;

  /**
   * World placement. For directional light only the orientation matters.
   *
   * Light motion supports position for point/spot/area and rotation for directional/spot/area, through `/lights/<id>/position` and `/lights/<id>/rotation`. Other supported axes are intensity, RGB colour, point/spot range and spot cone angle. Scale, identity, shadow settings and area dimensions have no light pointer channel; the viewer still applies the authored TRS to its native light object.
   */
  transform: IAutoMovieTransform;

  /** Light color (linear). */
  color: IAutoMovieColor;

  /**
   * Finite nonnegative photometric magnitude: illuminance in lux for directional, luminous intensity in candela for point/spot and luminance in nits (candela per square metre) for an area panel. Three's rectangular-area power convention is luminous flux in lumens equal to intensity times width times height times PI.
   */
  intensity: number;

  /**
   * Whether this source casts a shadow map. Omitted preserves legacy output.
   *
   * What this light would cast, not what the frame renders: a scene's `environment.shadows.enabled` is the master switch and turning it off renders no shadow map for any light, which is also how the render budget prices it. A scene declaring no environment leaves the decision to the host renderer, exactly as it did before environments existed.
   *
   * Only the three punctual kinds can cast one. A rectangular area source is analytically integrated rather than rasterized from a light-space camera, so `three.js` renders no shadow map for it and the engine refuses `castShadow` on an {@link IAutoMovieAreaLight} instead of accepting a flag no frame would honor.
   */
  castShadow?: boolean;

  /**
   * Deterministic shadow-camera tuning, required exactly when `castShadow` is true.
   */
  shadow?: IAutoMovieLightShadow;
}
