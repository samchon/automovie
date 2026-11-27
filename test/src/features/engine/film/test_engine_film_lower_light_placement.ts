import {
  lowerLightPlacement
} from "../../../../../packages/engine/src/film/staging/internal/lowerLightPlacement";
import type {
  IAutoMovieLight,
  IAutoMovieStageLight,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../internal/qclose";

/**
 * The shortest quarter turn uses one trigonometric pair and unit-scale
 * products.
 */
const AIM_ROUNDING: number = 16 * Number.EPSILON;

/**
 * Light placement chooses a world transform, optical defaults and supplied
 * shadow settings for the exact authored light kind.
 *
 * Scenarios:
 *
 * 1. A spot aimed along +X rotates local −Z by −90° about +Y. Its default range
 *    and cone are 0 and 45°, without replacing the supplied shadow map.
 * 2. A point stays unrotated, with its authored world-position and range.
 */
export function test_engine_film_lower_light_placement(): void {
  const spot: IAutoMovieStageLight = {
    node: "spot",
    type: "spot",
    position: { x: 1, y: 2, z: 3 },
    direction: { x: 1, y: 0, z: 0 },
    intensity: 1,
    castShadow: true,
    shadow: { mapSize: 256, bias: 0, normalBias: 0, near: 0.25, far: 8 },
  };
  const lowered: IAutoMovieLight = lowerLightPlacement(spot);
  TestValidator.predicate(
    "the spot aims −Z at +X and takes the default optical bounds",
    lowered.type === "spot" &&
      lowered.range === 0 &&
      lowered.coneAngle === 45 &&
      lowered.castShadow === true &&
      lowered.shadow === spot.shadow &&
      qclose(
        lowered.transform.rotation,
        { x: 0, y: -Math.SQRT1_2, z: 0, w: Math.SQRT1_2 },
        AIM_ROUNDING,
      ),
  );
  const point: IAutoMovieLight = lowerLightPlacement({
    node: "point",
    type: "point",
    position: { x: 0, y: 1, z: 2 },
    range: 4,
    intensity: 1,
  });
  TestValidator.predicate(
    "the point has no aim and keeps its range",
    point.type === "point" && point.range === 4,
  );
  TestValidator.equals(
    "the point's world frame and neutral color",
    [point.transform, point.color],
    [
      {
        translation: { x: 0, y: 1, z: 2 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
        scale: { x: 1, y: 1, z: 1 },
      },
      { r: 1, g: 1, b: 1, a: null, hex: null },
    ],
  );
}
