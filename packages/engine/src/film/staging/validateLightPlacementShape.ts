import { IAutoMovieLight, IAutoMovieStageLight } from "@automovie/interface";
import { Vector3 } from "../../math/Vector3";
import { AUTO_MOVIE_LIGHT_TYPES } from "../../resolve/constants/AUTO_MOVIE_LIGHT_TYPES";
import { withArticle } from "../../text/withArticle";
import { ViolationCollector } from "../../validation/ViolationCollector";
import { isRecord } from "../../validation/isRecord";
import { isFiniteStageVector3 } from "./isFiniteStageVector3";
import { lightTypeOf } from "./lightTypeOf";
import { validateStageUnitColorComponent } from "./validateStageUnitColorComponent";

/**
 * The rectangular panel's extent as a placement may carry it.
 *
 * Read through one accessor rather than off the placement type for the same
 * reason {@link lightTypeOf} reads `type` that way: the gate must be able to
 * doubt a value an author supplied, and a field asserted before it is checked
 * is a field that stopped being checked. Both axes are `unknown` here and
 * become numbers only once {@link validateLightExtent} has said so.
 * @author Samchon
 */
interface IAutoMovieStageLightExtent {
  /** Declared panel width, unchecked. */
  width?: unknown;
  /** Declared panel height, unchecked. */
  height?: unknown;
}

/** A placement's declared panel extent, before any of it is believed. */
const lightExtentOf = (
  light: IAutoMovieStageLight,
): IAutoMovieStageLightExtent => light as IAutoMovieStageLightExtent;

/**
 * The staging light contract, per kind (#1341).
 *
 * `stage` used to accept `{node, role, direction, intensity}` and lower every
 * entry to a white directional light, so a candle, a sunset, a neon sign, and a
 * window shaft were all the same frame, and an author who wanted a warm lamp
 * had to hand-patch `scene.lights` after `stage` and lose the referential
 * integrity `stage` exists to give. The placement now spans every kind
 * {@link IAutoMovieLight} models, which makes each kind's parameter set exact
 * rather than advisory:
 *
 * - An aimed light (`directional`, `spot`, `area`) needs a finite non-zero
 *   `direction` and a `point` light must not carry one, since it radiates every
 *   way;
 * - A positioned light (`point`, `spot`, `area`) needs a finite `position` and a
 *   `directional` light must not carry one, since it is infinitely distant;
 * - `range` belongs to the two punctual falloff kinds, `coneAngle` to `spot`
 *   alone, and `width`/`height` to `area` alone.
 *
 * A parameter that cannot act is refused rather than ignored: silently dropping
 * a `coneAngle` on a point light is the same false green the campaign is
 * closing elsewhere. Colors are range-checked here too, because `stage` is the
 * only rung between the model and the scene.
 *
 * @evidence requirements/lighting/sources-and-photometry.md#lighting-source-refusal Checks each supported staged light kind, its permitted geometry and color, and its explicit shadow-map settings before any light is lowered.
 * @evidence specifications/camera-light-and-visibility/light-source-photometry-and-environment.md#clv-source-sampling-refusal Checks each supported staged light kind, its permitted geometry and color, and its explicit shadow-map settings before any light is lowered.
 */
export const validateLightPlacementShape = (
  light: IAutoMovieStageLight,
  path: string,
  out: ViolationCollector,
): void => {
  const type = lightTypeOf(light);
  if (type === null) {
    out.push(
      "type",
      `${path}.type`,
      `light type must be one of ${[...AUTO_MOVIE_LIGHT_TYPES].join(", ")}`,
      (light as unknown as { type?: unknown }).type,
    );
    return;
  }
  const aimed = type !== "point";
  const positioned = type !== "directional";
  // Distance falloff is narrower than "has a position": an area panel stands
  // somewhere and still takes no range, because its falloff follows from the
  // panel's own extent.
  const falloff = type === "point" || type === "spot";

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
        `light range must be a finite number >= 0 (0 = infinite), but was ${light.range}`,
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
        `spot coneAngle must be a finite number within (0, 90], but was ${light.coneAngle}`,
        light.coneAngle,
      );
  }

  validateLightExtent(light, type, path, out);
  if (light.color !== undefined) validateLightColor(light.color, path, out);
  validateLightShadow(light, type, path, out);
};

/**
 * The panel's extent: required exactly on an `area` light, refused elsewhere.
 *
 * Both axes are checked, not just the first missing one, so an author who typed
 * neither is told both rather than being walked through the same placement one
 * recompile at a time.
 */
const validateLightExtent = (
  light: IAutoMovieStageLight,
  type: IAutoMovieLight["type"],
  path: string,
  out: ViolationCollector,
): void => {
  const extent = lightExtentOf(light);
  for (const axis of ["width", "height"] as const) {
    const value = extent[axis];
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
        `area ${axis} must be a finite number greater than zero, but was ${String(value)}`,
        value,
      );
  }
};

const validateLightShadow = (
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
  // occludes and never does, which is exactly the false green this campaign is
  // closing; the correction is a spot or directional key beside the panel. The
  // refusal replaces the shadow-settings demand rather than joining it: asking
  // an author to tune a map that will never be rendered is worse advice than
  // none.
  else if (light.castShadow === true && type === "area") {
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
  if (!isRecord(light.shadow)) {
    out.push(
      "type",
      `${path}.shadow`,
      "shadow must be a JSON object",
      light.shadow,
    );
    return;
  }
  const shadow = light.shadow;
  if (!Number.isSafeInteger(shadow.mapSize) || (shadow.mapSize as number) <= 0)
    out.push(
      "range",
      `${path}.shadow.mapSize`,
      "shadow mapSize must be a positive safe integer",
      shadow.mapSize,
    );
  for (const key of ["bias", "normalBias"] as const)
    if (typeof shadow[key] !== "number" || !Number.isFinite(shadow[key]))
      out.push(
        "range",
        `${path}.shadow.${key}`,
        `shadow ${key} must be finite`,
        shadow[key],
      );
  if (
    typeof shadow.near !== "number" ||
    !Number.isFinite(shadow.near) ||
    shadow.near <= 0
  )
    out.push(
      "range",
      `${path}.shadow.near`,
      "shadow near must be finite and greater than zero",
      shadow.near,
    );
  if (
    typeof shadow.far !== "number" ||
    !Number.isFinite(shadow.far) ||
    typeof shadow.near !== "number" ||
    shadow.far <= shadow.near
  )
    out.push(
      "range",
      `${path}.shadow.far`,
      "shadow far must be finite and greater than near",
      shadow.far,
    );
};

/**
 * A staged light's color, checked to the same rule the scene artifact validator
 * applies downstream.
 *
 * Both halves matter. The object check keeps this validator TOTAL: `stage` is
 * reachable in-process with an untyped payload (the transport's structural gate
 * is not the engine's), and a `null` color would otherwise dereference into a
 * TypeError instead of a located violation. The alpha check keeps the two rungs
 * agreeing: `validateColorArtifact` range-checks a non-null `a`, so leaving it
 * to `commitScene` would let a bad alpha compose a scene here and be refused
 * one stage later, which is the wrong-stage failure this cycle closes
 * elsewhere.
 */
const validateLightColor = (
  color: unknown,
  path: string,
  out: ViolationCollector,
): void => {
  if (!isRecord(color)) {
    out.push(
      "type",
      `${path}.color`,
      "light color must be a JSON object",
      color,
    );
    return;
  }
  for (const key of ["r", "g", "b"] as const)
    validateStageUnitColorComponent(
      color[key],
      `${path}.color.${key}`,
      `light color ${key}`,
      out,
    );
  // `a` is nullable by contract: a light slot is opacity-irrelevant, so `null`
  // is the documented value there, distinct from an out-of-range number.
  if (color.a !== null)
    validateStageUnitColorComponent(color.a, `${path}.color.a`, "light color a", out);
};
