import { IAutoMovieLight, IAutoMovieStageLight } from "@automovie/interface";

import { Vector3 } from "../../math/Vector3";
import { AUTO_MOVIE_LIGHT_TYPES } from "../../resolve/constants/AUTO_MOVIE_LIGHT_TYPES";
import { withArticle } from "../../text/withArticle";
import { ViolationCollector } from "../../validation/ViolationCollector";
import { describeInvalidValue } from "../../validation/describeInvalidValue";
import { isRecord } from "../../validation/isRecord";
import { validateColor } from "../../validation/validateColor";
import { isFiniteStageVector3 } from "./isFiniteStageVector3";
import { lightTypeOf } from "./lightTypeOf";

/**
 * The staging light contract, per kind: each placement takes exactly the parameters its `type` can act on, so `stageScene` can lower it to the scene light that kind names without guessing.
 *
 * - An aimed light (`directional`, `spot`, `area`) needs a finite non-zero `direction`, and a `point` light must not carry one, since it radiates every way.
 * - A positioned light (`point`, `spot`, `area`) needs a finite `position`, and a `directional` light must not carry one, since it is infinitely distant.
 * - `range` belongs to the two punctual falloff kinds and must be finite and at least zero; `coneAngle` belongs to `spot` alone, within `(0, 90]`; `width` and `height` belong to `area` alone and must be finite and positive, and both are reported when both are wrong.
 * - `color`, when given, follows validateColor's canonical linear RGBA rule, including nullable alpha and an optional matching sRGB hex label.
 * - `castShadow` is a boolean, is refused on an `area` light, which renders no shadow map, and when `true` requires `shadow`; `shadow` requires `castShadow: true` and carries a positive safe-integer `mapSize`, finite biases, a positive `near` and a finite `far` beyond it.
 *
 * A parameter that cannot act is refused rather than ignored, because silently dropping a `coneAngle` on a point light stages a light that is not the one authored. An unknown `type` is reported once and nothing else is judged, since no rule set applies. The caller supplies a light record; malformed ordinary JSON fields, including null vectors, colors and shadows, produce located findings. A failed string conversion uses `an uninspectable value` only in text and retains the authored value. Throwing property accessors and nonterminating conversion hooks are outside that guarantee.
 *
 * @evidence contracts/common.md#principled-implementation Derives the kind once through `lightTypeOf` and then requires or forbids each field by the kind's physical meaning, aim for every kind but point, position for every kind but directional, falloff range only for point and spot, and reads every authored value as `unknown` until a shape and finiteness test admits it.
 * @evidence contracts/common.md#clear-and-simple-design Owns light aim, position, range and cone with private extent and shadow helpers; the full color record delegates to validateColor so staged lights, materials and backgrounds share shape, channel and display-label rules.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No value is defaulted or clamped to pass, the area-shadow refusal is a stated rendering fact rather than a fixture exception, and no node or role is special-cased.
 * @evidence contracts/common.md#meaningful-documentation States per-kind ranges, color and shadow rules, inapplicable-parameter refusal, unknown-type handling, the caller's record premise and ordinary-field conversion fallback with its limits.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Checks a fixed field population per placement; refusal adds conversion/output-sized text with no time bound on user-defined hooks, and stageScene invokes the gate once per light.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Judges one placement per call and coordinates no work across placements or calls.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Retains nothing; it appends at most one violation per checked field to the caller's collector, which owns them.
 */
export const validateLightPlacementShape: (light: IAutoMovieStageLight, path: string, out: ViolationCollector) => void = (
  light: IAutoMovieStageLight,
  path: string,
  out: ViolationCollector,
): void => {
  const type: IAutoMovieLight["type"] | null = lightTypeOf(light);
  if (type === null) {
    const declared: unknown = light.type;
    out.push(
      "type",
      `${path}.type`,
      `light type must be one of ${[...AUTO_MOVIE_LIGHT_TYPES].join(", ")}`,
      declared,
    );
    return;
  }
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
        `${withArticle(type)} light is aimed and needs a direction`,
        light.direction,
      );
  } else if (!aimed)
    out.push(
      "type",
      `${path}.direction`,
      `a point light radiates in every direction and takes no direction`,
      light.direction,
    );
  else if (
    !isFiniteStageVector3(light.direction) ||
    Vector3.length(light.direction) === 0
  )
    out.push(
      "range",
      `${path}.direction`,
      `direction must be a finite non-zero vector`,
      light.direction,
    );

  if (light.position === undefined) {
    if (positioned)
      out.push(
        "type",
        `${path}.position`,
        `${withArticle(type)} light stands somewhere in the world and needs a position`,
        light.position,
      );
  } else if (!positioned)
    out.push(
      "type",
      `${path}.position`,
      `a directional light is infinitely distant and takes no position`,
      light.position,
    );
  else if (!isFiniteStageVector3(light.position))
    out.push(
      "range",
      `${path}.position`,
      `position must be a finite vector`,
      light.position,
    );

  if (light.range !== undefined) {
    if (!falloff)
      out.push(
        "type",
        `${path}.range`,
        `${withArticle(type)} light has no distance falloff and takes no range`,
        light.range,
      );
    else if (!Number.isFinite(light.range) || light.range < 0)
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
        `only a spot light has a cone; ${withArticle(type)} light takes no coneAngle`,
        light.coneAngle,
      );
    else if (
      !Number.isFinite(light.coneAngle) ||
      light.coneAngle <= 0 ||
      light.coneAngle > 90
    )
      out.push(
        "range",
        `${path}.coneAngle`,
        `spot coneAngle must be a finite number within (0, 90], but was ${describeInvalidValue(light.coneAngle)}`,
        light.coneAngle,
      );
  }

  validateLightExtent(light, type, path, out);
  if (light.color !== undefined) validateColor(light.color, `${path}.color`, out);
  validateLightShadow(light, type, path, out);
};

/**
 * The panel's extent: required exactly on an `area` light, refused elsewhere.
 *
 * Both axes are checked, not just the first missing one, so an author who typed neither is told both rather than being walked through the same placement one recompile at a time. Each axis is read as `unknown`, because an untyped payload may carry anything there.
 */
const validateLightExtent: (light: IAutoMovieStageLight, type: IAutoMovieLight["type"], path: string, out: ViolationCollector) => void = (
  light: IAutoMovieStageLight,
  type: IAutoMovieLight["type"],
  path: string,
  out: ViolationCollector,
): void => {
  for (const axis of ["width", "height"] as const) {
    const value: unknown = light[axis];
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
    else if (typeof value !== "number" || !Number.isFinite(value) || value <= 0)
      out.push(
        "range",
        `${path}.${axis}`,
        `area ${axis} must be a finite number greater than zero, but was ${describeInvalidValue(value)}`,
        value,
      );
  }
};

/**
 * `castShadow` and `shadow`: a boolean flag, refused on an area light, and settings present exactly when the flag is `true`, each field finite and `far` beyond `near`.
 */
const validateLightShadow: (light: IAutoMovieStageLight, type: IAutoMovieLight["type"], path: string, out: ViolationCollector) => void = (
  light: IAutoMovieStageLight,
  type: IAutoMovieLight["type"],
  path: string,
  out: ViolationCollector,
): void => {
  if (light.castShadow !== undefined && typeof light.castShadow !== "boolean")
    out.push(
      "type",
      `${path}.castShadow`,
      "castShadow must be boolean",
      light.castShadow,
    );
  // A rectangular area source is integrated analytically, so `three.js` renders
  // no shadow map for it. Accepting the flag would stage a light that says it
  // occludes and never does; the correction is a spot or directional key
  // beside the panel. The refusal replaces the shadow-settings demand rather
  // than joining it: asking an author to tune a map that will never be
  // rendered is worse advice than none.
  else if (light.castShadow !== undefined && type === "area") {
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
  const shadow: unknown = light.shadow;
  if (!isRecord(shadow)) {
    out.push("type", `${path}.shadow`, "shadow must be a JSON object", shadow);
    return;
  }
  const mapSize: unknown = shadow.mapSize;
  if (
    typeof mapSize !== "number" ||
    !Number.isSafeInteger(mapSize) ||
    mapSize <= 0
  )
    out.push(
      "range",
      `${path}.shadow.mapSize`,
      "shadow mapSize must be a positive safe integer",
      mapSize,
    );
  for (const key of ["bias", "normalBias"] as const)
    if (typeof shadow[key] !== "number" || !Number.isFinite(shadow[key]))
      out.push(
        "range",
        `${path}.shadow.${key}`,
        `shadow ${key} must be finite`,
        shadow[key],
      );
  const near: unknown = shadow.near;
  const far: unknown = shadow.far;
  if (typeof near !== "number" || !Number.isFinite(near) || near <= 0)
    out.push(
      "range",
      `${path}.shadow.near`,
      "shadow near must be finite and greater than zero",
      near,
    );
  if (
    typeof far !== "number" ||
    !Number.isFinite(far) ||
    typeof near !== "number" ||
    far <= near
  )
    out.push(
      "range",
      `${path}.shadow.far`,
      "shadow far must be finite and greater than near",
      far,
    );
};
