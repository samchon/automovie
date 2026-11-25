import type {
  IAutoMovieAreaLight,
  IAutoMovieLightBase,
  IAutoMoviePointLight,
  IAutoMovieSpotLight,
} from "@automovie/interface";
import { applyLightState } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import { PointLight, RectAreaLight, SpotLight } from "three";

import { nclose, vclose } from "../../internal/predicates";

/** Multiplication and division by 180 contribute at most two ulps near pi/6. */
const ANGLE_TOLERANCE: number = 2 * Number.EPSILON;

/** Linear colour and length samples are copied as exact binary fractions. */
const COPY_TOLERANCE: number = 0;

/**
 * Map a staged light's linear colour, local fields and type-specific dimensions
 * onto the native light.
 *
 * Scenarios:
 *
 * 1. A spotlight copies linear RGB and placement and expresses a 30-degree
 *    half-angle as pi/6 radians. Its range is copied in metres.
 * 2. A point light copies its zero (unlimited) range and a rectangular light
 *    copies its independent width and height.
 */
export function test_render_scene_apply_light_state(): void {
  const common: IAutoMovieLightBase = {
    id: "key",
    color: { r: 0.25, g: 0.5, b: 0.75, a: null, hex: null },
    transform: {
      translation: { x: 1, y: 2, z: -4 },
      rotation: { x: 0.5, y: -0.5, z: 0.5, w: 0.5 },
      scale: { x: 1, y: 1, z: 1 },
    },
    intensity: 8,
  };
  const authored: IAutoMovieSpotLight = {
    ...common,
    type: "spot",
    range: 12,
    coneAngle: 30,
  };
  const spot: SpotLight = new SpotLight();
  applyLightState(spot, authored);
  TestValidator.predicate(
    "spot placement and emission",
    () =>
      vclose(spot.position, authored.transform.translation, COPY_TOLERANCE) &&
      nclose(spot.quaternion.y, -0.5, COPY_TOLERANCE) &&
      nclose(spot.color.r, 0.25, COPY_TOLERANCE) &&
      nclose(spot.color.g, 0.5, COPY_TOLERANCE) &&
      nclose(spot.color.b, 0.75, COPY_TOLERANCE) &&
      nclose(spot.intensity, 8, COPY_TOLERANCE) &&
      nclose(spot.distance, 12, COPY_TOLERANCE) &&
      nclose(spot.angle, Math.PI / 6, ANGLE_TOLERANCE),
  );

  const point: PointLight = new PointLight();
  point.distance = 10;
  const punctual: IAutoMoviePointLight = { ...common, type: "point", range: 0 };
  applyLightState(point, punctual);
  TestValidator.predicate(
    "point range has no falloff cutoff",
    nclose(point.distance, 0, COPY_TOLERANCE),
  );

  const panel: RectAreaLight = new RectAreaLight();
  const area: IAutoMovieAreaLight = {
    ...common,
    type: "area",
    width: 2,
    height: 0.5,
  };
  applyLightState(panel, area);
  TestValidator.predicate(
    "unequal panel dimensions",
    () =>
      nclose(panel.width, 2, COPY_TOLERANCE) &&
      nclose(panel.height, 0.5, COPY_TOLERANCE),
  );
}
