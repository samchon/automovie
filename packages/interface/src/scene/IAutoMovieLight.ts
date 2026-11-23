import type { IAutoMovieAreaLight } from "./IAutoMovieAreaLight";
import type { IAutoMovieDirectionalLight } from "./IAutoMovieDirectionalLight";
import type { IAutoMoviePointLight } from "./IAutoMoviePointLight";
import type { IAutoMovieSpotLight } from "./IAutoMovieSpotLight";

/**
 * A scene light. Discriminated on `type` so each light kind carries exactly the
 * parameters it needs and no others: directional light has no position-derived
 * falloff, point/spot do.
 *
 * Maps onto glTF `KHR_lights_punctual` / `three.js` light types.
 *
 * These are rest values. Shot lightMotions animates them on the shot clock;
 * Production currently samples production story tracks for the inherited
 * opening state only.
 */
export type IAutoMovieLight =
  | IAutoMovieDirectionalLight
  | IAutoMoviePointLight
  | IAutoMovieSpotLight
  | IAutoMovieAreaLight;
