import { AutoMovieEngineExposure } from "@automovie/engine";
import type {
  IAutoMovieLight,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { aimedLight } from "../internal/aimedLight";

/**
 * Meter an area panel by Lambert's polygon formula, clipped to the measured
 * plane's upper half-space.
 *
 * Scenarios:
 *
 * 1. A 1 m × 1 m panel of 1000 nits centred 1 m above the point and facing it
 *    meters the closed form for a square, E = L × 4 × (a / √(1 + a²)) × atan(a
 *    / √(1 + a²)) with a = 0.5, 752.2 lux, within 0.1 %.
 * 2. The same panel facing away meters 0, since a panel emits toward its local -Z
 *    only.
 * 3. A 2 m × 1 m panel tilted 50 degrees and set beside a plane it straddles, so
 *    part of it lies below the plane, meters within 0.5 % of a direct
 *    quadrature of `L cos θr cos θe / r²` over the panel's area restricted to
 *    the plane's upper side.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the exported meter with an area light and compares its total with closed forms and an independent area quadrature; a missing clip, a wrong winding sign or a two-sided panel changes the value well beyond the tolerance.
 * @evidence contracts/development/testing.md#independent-expectations The square case is the issue's closed form for a centred square; the straddling case integrates the radiometric definition of irradiance from a Lambertian emitter over a 400 × 200 midpoint grid, which shares no code with the polygon formula; 0.5 % bounds that grid's discretisation error.
 * @evidence contracts/development/testing.md#distinguishing-cases A fully visible panel, a back-facing panel and a panel partly below the horizon. Punctual lights belong to test_engine_meter_illuminance.
 * @evidence contracts/development/testing.md#execution-ownership Portable CPU unit test discovered by its export name; no GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios with geometry and expected lux.
 */
export function test_engine_meter_area_panel(): void {
  const point: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const panel: (
    centre: IAutoMovieVector3,
    direction: IAutoMovieVector3,
    width: number,
    height: number,
  ) => IAutoMovieLight = (
    centre: IAutoMovieVector3,
    direction: IAutoMovieVector3,
    width: number,
    height: number,
  ): IAutoMovieLight =>
    aimedLight({
      id: "panel",
      intensity: 1000,
      position: centre,
      direction,
      kind: { type: "area", width, height },
    });
  const lux: (light: IAutoMovieLight, normal: IAutoMovieVector3) => number = (
    light: IAutoMovieLight,
    normal: IAutoMovieVector3,
  ): number =>
    AutoMovieEngineExposure.meterAutoMovieIlluminance({ lights: [light], point, normal }).lux;

  // 1. Centred square.
  const k: number = 0.5 / Math.sqrt(1 + 0.25);
  const square: number = 1000 * 4 * k * Math.atan(k);
  const facing: number = lux(
    panel({ x: 0, y: 1, z: 0 }, { x: 0, y: -1, z: 0 }, 1, 1),
    up,
  );
  TestValidator.predicate(
    "a centred square meters its closed form within 0.1 %",
    Math.abs(facing - square) <= 0.001 * square &&
      Math.abs(facing - 752.2) <= 0.001 * 752.2,
  );

  // 2. Facing away.
  TestValidator.equals(
    "a panel facing away meters nothing",
    lux(panel({ x: 0, y: 1, z: 0 }, { x: 0, y: 1, z: 0 }, 1, 1), up),
    0,
  );

  // 3. Straddling the plane, against a quadrature.
  const tilt: number = (50 * Math.PI) / 180;
  const direction: IAutoMovieVector3 = {
    x: -Math.sin(tilt),
    y: -Math.cos(tilt) * 0.3,
    z: Math.cos(tilt),
  };
  const centre: IAutoMovieVector3 = { x: 1.2, y: 0.2, z: -0.9 };
  const light: IAutoMovieLight = panel(centre, direction, 2, 1);
  const metered: number = lux(light, up);
  const reference: number = quadrature(light, point, up, 400, 200);
  TestValidator.predicate(
    "a panel partly below the plane meters its clipped integral",
    reference > 0 && Math.abs(metered - reference) <= 0.005 * reference,
  );
}

/**
 * Irradiance at `point` from a Lambertian panel of luminance `intensity`, by a
 * midpoint grid over the panel: `Σ L max(0, n·ω) max(0, f·(−ω)) / r² ΔA`, with
 * `ω` the unit direction from the point to the cell and `f` the panel's
 * emitting direction. Cells on the plane's lower side contribute nothing
 * through `max(0, n·ω)`.
 */
const quadrature: (
  light: IAutoMovieLight,
  point: IAutoMovieVector3,
  normal: IAutoMovieVector3,
  cellsU: number,
  cellsV: number,
) => number = (
  light: IAutoMovieLight,
  point: IAutoMovieVector3,
  normal: IAutoMovieVector3,
  cellsU: number,
  cellsV: number,
): number => {
  if (light.type !== "area") return 0;
  const q: IAutoMovieQuaternion = light.transform.rotation;
  const rotate: (v: IAutoMovieVector3) => IAutoMovieVector3 = (
    v: IAutoMovieVector3,
  ): IAutoMovieVector3 => {
    // v' = v + 2w (q × v) + 2 q × (q × v), for unit q.
    const t: IAutoMovieVector3 = {
      x: 2 * (q.y * v.z - q.z * v.y),
      y: 2 * (q.z * v.x - q.x * v.z),
      z: 2 * (q.x * v.y - q.y * v.x),
    };
    return {
      x: v.x + q.w * t.x + (q.y * t.z - q.z * t.y),
      y: v.y + q.w * t.y + (q.z * t.x - q.x * t.z),
      z: v.z + q.w * t.z + (q.x * t.y - q.y * t.x),
    };
  };
  const ax: IAutoMovieVector3 = rotate({ x: 1, y: 0, z: 0 });
  const ay: IAutoMovieVector3 = rotate({ x: 0, y: 1, z: 0 });
  const front: IAutoMovieVector3 = rotate({ x: 0, y: 0, z: -1 });
  const c: IAutoMovieVector3 = light.transform.translation;
  const area: number = (light.width * light.height) / (cellsU * cellsV);
  let sum: number = 0;
  for (let i: number = 0; i < cellsU; ++i)
    for (let j: number = 0; j < cellsV; ++j) {
      const u: number = ((i + 0.5) / cellsU - 0.5) * light.width;
      const v: number = ((j + 0.5) / cellsV - 0.5) * light.height;
      const d: IAutoMovieVector3 = {
        x: c.x + ax.x * u + ay.x * v - point.x,
        y: c.y + ax.y * u + ay.y * v - point.y,
        z: c.z + ax.z * u + ay.z * v - point.z,
      };
      const r2: number = d.x * d.x + d.y * d.y + d.z * d.z;
      const r: number = Math.sqrt(r2);
      const receive: number = Math.max(
        0,
        (normal.x * d.x + normal.y * d.y + normal.z * d.z) / r,
      );
      const emit: number = Math.max(
        0,
        -(front.x * d.x + front.y * d.y + front.z * d.z) / r,
      );
      sum += (receive * emit * area) / r2;
    }
  return light.intensity * sum;
};
