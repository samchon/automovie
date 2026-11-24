import type * as THREE from "three";

/**
 * Whether every coordinate of a computed point survives the GPU's float32
 * storage: rounding to single precision overflows to an infinity exactly when
 * the double lies beyond float32's range, so the overflow is read from the
 * rounding itself.
 *
 * @param point A world or local point a transform or skin produced.
 * @returns Whether the GPU can store it.
 */
export function isAutoMovieFloat32Point(point: THREE.Vector3): boolean {
  return [point.x, point.y, point.z].every((value: number): boolean => {
    const stored: number = Math.fround(value);
    return stored !== Infinity && stored !== -Infinity;
  });
}
