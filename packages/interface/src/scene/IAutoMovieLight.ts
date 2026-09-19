import { IAutoMovieAreaLight } from "./IAutoMovieAreaLight";
import { IAutoMovieDirectionalLight } from "./IAutoMovieDirectionalLight";
import { IAutoMoviePointLight } from "./IAutoMoviePointLight";
import { IAutoMovieSpotLight } from "./IAutoMovieSpotLight";

/**
 * A scene light. Discriminated on `type` so each light kind carries exactly the
 * parameters it needs and no others: directional light has no position-derived
 * falloff, point/spot do.
 *
 * Maps onto glTF `KHR_lights_punctual` / `three.js` light types.
 *
 * These are the light's values at REST; a shot changes them over its own clock
 * through `IAutoMovieShot.lightMotions`, and a production changes them over the
 * whole story clock through {@link IAutoMovieProductionLighting}.
 *
 * @evidence requirements/lighting/shape-filters-and-linking.md#lighting-link-resolution Exposes `IAutoMovieLight` as the portable data boundary for the lighting link resolution requirement.
 * @evidence specifications/camera-light-and-visibility/practical-shaping-and-linking.md#clv-light-link-resolution Types `IAutoMovieLight` for the clv light link resolution system contract.
 * @author Samchon
 */
export type IAutoMovieLight =
  | IAutoMovieDirectionalLight
  | IAutoMoviePointLight
  | IAutoMovieSpotLight
  | IAutoMovieAreaLight;
