import { IAutoMovieAreaLight } from "./IAutoMovieAreaLight";
import { IAutoMovieDirectionalLight } from "./IAutoMovieDirectionalLight";
import { IAutoMoviePointLight } from "./IAutoMoviePointLight";
import { IAutoMovieSpotLight } from "./IAutoMovieSpotLight";

/**
 * A scene light. Discriminated on `type` so each light kind carries exactly the parameters it needs and no others: directional light has no position-derived falloff, point/spot do.
 *
 * Maps onto glTF `KHR_lights_punctual` / `three.js` light types.
 *
 * These are the light's values at REST; a shot changes them over its own clock through `IAutoMovieShot.lightMotions`, and a production changes them over the whole story clock through {@link IAutoMovieProductionLighting}.
 *
 * @evidence contracts/common.md#principled-implementation Kind discrimination selects directional, point, spot or rectangular-area parameters at rest; validated pointer channels apply shot-local or pinned story-clock state before viewer light construction.
 * @evidence contracts/common.md#clear-and-simple-design Four specialized light shapes share common identity, linear color and transform while keeping range, cone and area dimensions with their owning kinds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Area has no punctual glTF counterpart or supported shadow map; union membership does not permit another kind's unused range or cone fields.
 * @evidence contracts/common.md#meaningful-documentation Defines rest state, type distinction, supported runtime mapping and independent shot/story clock motion.
 * @author Samchon
 */
export type IAutoMovieLight =
  | IAutoMovieDirectionalLight
  | IAutoMoviePointLight
  | IAutoMovieSpotLight
  | IAutoMovieAreaLight;
