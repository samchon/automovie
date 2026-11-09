import { IAutoMovieAreaLight } from "./IAutoMovieAreaLight";
import { IAutoMovieDirectionalLight } from "./IAutoMovieDirectionalLight";
import { IAutoMoviePointLight } from "./IAutoMoviePointLight";
import { IAutoMovieSpotLight } from "./IAutoMovieSpotLight";

/**
 * A scene light. Discriminated on `type` so each light kind carries exactly the parameters it needs and no others: directional light has no position-derived falloff, point/spot do.
 *
 * Maps onto glTF `KHR_lights_punctual` / `three.js` light types.
 *
 * These are rest values. Shot lightMotions animates them on the shot clock; Production currently samples production story tracks for the inherited opening state only.
 *
 * @evidence contracts/development/design.md#principled-representation Kind discrimination selects directional, point, spot or rectangular-area rest parameters. Pointer channels apply shot-local motion; Production additionally inherits pinned story-clock opening state before viewer construction, without wiring those production tracks through the whole shot.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Four specialized light shapes share common identity, linear color and transform while keeping range, cone and area dimensions with their owning kinds.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Area has no punctual glTF counterpart or supported shadow map; union membership does not permit another kind's unused range or cone fields.
 * @evidence contracts/development/common.md#meaningful-documentation Defines rest state, kind distinction, runtime mapping, shot-local motion and the current opening-only story inheritance boundary.
 */
export type IAutoMovieLight =
  | IAutoMovieDirectionalLight
  | IAutoMoviePointLight
  | IAutoMovieSpotLight
  | IAutoMovieAreaLight;
