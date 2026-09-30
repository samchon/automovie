import type { Point } from "./structures/Point";

/**
 * Construct one point in the shared millimetre coordinate frame.
 *
 * @author Samchon
 */
export const millimetrePoint = (x: number, y: number, z: number): Point => ({
  x,
  y,
  z,
});
