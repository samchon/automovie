import {
  IAutoMovieLight,
  type IAutoMovieLightShadow,
  IAutoMovieStageLight,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { Vector3 } from "../../../math/Vector3";
import { AutoMovieEngineText } from "../../../text/AutoMovieEngineText";
import { describeInvalidValue } from "../../../validation/internal/describeInvalidValue";
import { validateColor } from "../../../validation/internal/validateColor";
import { lightTypeOf } from "./lightTypeOf";

/*
 * The staging light contract, per kind: each placement takes exactly the
 * parameters its `type` can act on, so `stageScene` can lower it to the scene
 * light that kind names without guessing.
 *
 * - Every light has nonnegative intensity.
 * - An aimed light (`directional`, `spot`, `area`) needs a finite non-zero
 *   `direction`, and a `point` light must not carry one, since it radiates
 *   every way.
 * - A positioned light (`point`, `spot`, `area`) needs a finite `position`, and a
 *   `directional` light must not carry one, since it is infinitely distant.
 * - `range` belongs to the two punctual falloff kinds and must be finite and at
 *   least zero; `coneAngle` belongs to `spot` alone, within `(0, 90]`; `width`
 *   and `height` belong to `area` alone and must be positive, and both are
 *   reported when both are wrong.
 * - `color`, when given, follows validateColor's canonical linear RGBA rule,
 *   including nullable alpha and an optional matching sRGB hex label.
 * - `castShadow` is refused on an `area` light, which renders no shadow map, and
 *   when `true` requires `shadow`; `shadow` requires `castShadow: true` and
 *   carries a positive safe-integer `mapSize`, a positive `near` and a `far`
 *   beyond it.
 *
 * A parameter that cannot act is refused rather than ignored, because silently
 * dropping a `coneAngle` on a point light stages a light that is not the one
 * authored.
 */
export function validateLightPlacementShape(
  light: IAutoMovieStageLight,
  path: string,
  out: IAutoMovieViolationCollector,
): void {
  if (light.intensity < 0)
    out.push(
      "range",
      `${path}.intensity`,
      `intensity must be a finite number >= 0, but was ${describeInvalidValue(light.intensity)}`,
      light.intensity,
    );
  const type: IAutoMovieLight["type"] = lightTypeOf(light);
  const aimed: boolean = type !== "point";
  const positioned: boolean = type !== "directional";
  // Distance falloff is narrower than "has a position": an area panel stands
  // somewhere and still takes no range, because its falloff follows from the
  // panel's own extent.
  const falloff: boolean = type === "point" || type === "spot";

  if (light.direction === undefined) {
    if (aimed)
      out.push(
        "type",
        `${path}.direction`,
        `${AutoMovieEngineText.withArticle(type)} light is aimed and needs a direction`,
        light.direction,
      );
  } else if (!aimed)
    out.push(
      "type",
      `${path}.direction`,
      `a point light radiates in every direction and takes no direction`,
      light.direction,
    );
  else if (Vector3.length(light.direction) === 0)
    out.push(
      "range",
      `${path}.direction`,
      `direction must be a non-zero vector`,
      light.direction,
    );

  if (light.position === undefined) {
    if (positioned)
      out.push(
        "type",
        `${path}.position`,
        `${AutoMovieEngineText.withArticle(type)} light stands somewhere in the world and needs a position`,
        light.position,
      );
  } else if (!positioned)
    out.push(
      "type",
      `${path}.position`,
      `a directional light is infinitely distant and takes no position`,
      light.position,
    );

  if (light.range !== undefined) {
    if (!falloff)
      out.push(
        "type",
        `${path}.range`,
        `${AutoMovieEngineText.withArticle(type)} light has no distance falloff and takes no range`,
        light.range,
      );
    else if (light.range < 0)
      out.push(
        "range",
        `${path}.range`,
        `light range must be a finite number >= 0 (0 = infinite), but was ${describeInvalidValue(light.range)}`,
        light.range,
      );
  }

  if (light.coneAngle !== undefined) {
    if (type !== "spot")
      out.push(
        "type",
        `${path}.coneAngle`,
        `only a spot light has a cone; ${AutoMovieEngineText.withArticle(type)} light takes no coneAngle`,
        light.coneAngle,
      );
    else if (light.coneAngle <= 0 || light.coneAngle > 90)
      out.push(
        "range",
        `${path}.coneAngle`,
        `spot coneAngle must be a finite number within (0, 90], but was ${describeInvalidValue(light.coneAngle)}`,
        light.coneAngle,
      );
  }

  validateLightExtent(light, type, path, out);
  if (light.color !== undefined)
    validateColor(light.color, `${path}.color`, out);
  validateLightShadow(light, type, path, out);
}

/*
 * The panel's extent: required exactly on an `area` light, refused elsewhere.
 *
 * Both axes are checked, not just the first missing one, so an author who typed
 * neither is told both rather than being walked through the same placement one
 * recompile at a time.
 */
const validateLightExtent: (
  light: IAutoMovieStageLight,
  type: IAutoMovieLight["type"],
  path: string,
  out: IAutoMovieViolationCollector,
) => void = (
  light: IAutoMovieStageLight,
  type: IAutoMovieLight["type"],
  path: string,
  out: IAutoMovieViolationCollector,
): void => {
  const axes: readonly ("width" | "height")[] = ["width", "height"];
  for (const axis of axes) {
    const value: number | undefined = light[axis];
    if (value === undefined) {
      if (type === "area")
        out.push(
          "type",
          `${path}.${axis}`,
          `an area light is a rectangular panel and needs a ${axis}`,
          value,
        );
    } else if (type !== "area")
      out.push(
        "type",
        `${path}.${axis}`,
        `only an area light has extent; a ${type} light takes no ${axis}`,
        value,
      );
    else if (value <= 0)
      out.push(
        "range",
        `${path}.${axis}`,
        `area ${axis} must be greater than zero, but was ${describeInvalidValue(value)}`,
        value,
      );
  }
};

/*
 * `castShadow` and `shadow`: a flag refused on an area light, and settings
 * present exactly when the flag is `true`, with a positive `near` and `far`
 * beyond it.
 */
const validateLightShadow: (
  light: IAutoMovieStageLight,
  type: IAutoMovieLight["type"],
  path: string,
  out: IAutoMovieViolationCollector,
) => void = (
  light: IAutoMovieStageLight,
  type: IAutoMovieLight["type"],
  path: string,
  out: IAutoMovieViolationCollector,
): void => {
  // A rectangular area source is integrated analytically, so `three.js` renders
  // no shadow map for it. Accepting the flag would stage a light that says it
  // occludes and never does; the correction is a spot or directional key
  // beside the panel. The refusal replaces the shadow-settings demand rather
  // than joining it: asking an author to tune a map that will never be
  // rendered is worse advice than none.
  if (light.castShadow !== undefined && type === "area") {
    out.push(
      "type",
      `${path}.castShadow`,
      "an area light is analytically integrated and casts no shadow map; use a punctual key light for occlusion",
      light.castShadow,
    );
    return;
  }
  if (light.shadow === undefined) {
    if (light.castShadow === true)
      out.push(
        "type",
        `${path}.shadow`,
        "a shadow-casting light requires deterministic shadow settings",
        light.shadow,
      );
    return;
  }
  if (light.castShadow !== true)
    out.push(
      "type",
      `${path}.shadow`,
      "shadow settings require castShadow to be true",
      light.shadow,
    );
  const shadow: IAutoMovieLightShadow = light.shadow;
  const mapSize: number = shadow.mapSize;
  if (mapSize <= 0)
    out.push(
      "range",
      `${path}.shadow.mapSize`,
      "shadow mapSize must be a positive safe integer",
      mapSize,
    );
  const near: number = shadow.near;
  const far: number = shadow.far;
  if (near <= 0)
    out.push(
      "range",
      `${path}.shadow.near`,
      "shadow near must be greater than zero",
      near,
    );
  if (far <= near)
    out.push(
      "range",
      `${path}.shadow.far`,
      "shadow far must be greater than near",
      far,
    );
};
