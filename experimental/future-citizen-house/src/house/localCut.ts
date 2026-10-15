import type { IAutoMovieWallOpening } from "@automovie/engine";
import { Frame } from "./Frame";
import { uSign } from "./uSign";

/** Measure from the wall's local origin directly. Going through its centre
 * can turn an exactly shared end into a negative coordinate after rounding.
 * Both ends use the same origin; out-of-wall input remains out of bounds. */
export function localCut(f: Frame, id: string, a: number, b: number, sill: number, head: number): IAutoMovieWallOpening {
  const forward = uSign(f) === 1;
  const x = forward ? a - f.a : f.b - b;
  const right = forward ? b - f.a : f.b - a;
  const y = sill - f.floor;
  return { id, x, y, width: right - x, height: (head - f.floor) - y };
}
