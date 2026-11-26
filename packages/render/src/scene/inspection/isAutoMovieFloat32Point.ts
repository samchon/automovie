import type * as THREE from "three";

import { AUTOMOVIE_FLOAT32_MAX } from "../internal/AUTOMOVIE_FLOAT32_MAX.js";

/**
 * Whether every coordinate of a computed point survives the GPU's float32
 * storage: a coordinate is stored when its magnitude is at most the float32
 * maximum, `(2 - 2^-23) * 2^127`, and rounds to an infinity beyond it.
 *
 * @param point A world or local point a transform or skin produced.
 * @returns Whether the GPU can store it.
 */
export function isAutoMovieFloat32Point(point: THREE.Vector3): boolean {
  return [point.x, point.y, point.z].every(
    (value: number): boolean => Math.abs(value) <= AUTOMOVIE_FLOAT32_MAX,
  );
}
