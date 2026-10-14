import { IAutoMovieProfilePoint } from "../../../../packages/engine/src/geometry/IAutoMovieProfilePoint";

/**
 * Emit four XY corners from the supplied origin, width and height in the fixture's units, ordered counter-clockwise for positive dimensions. Callers own positive-dimension admission; zero/negative/nonfinite values are neither changed nor refused here.
 *
 * Constant arithmetic allocates a fresh four-point list for arch piers and slabs, with no shared mutable corners or persistent resource. This constructs test input rather than deriving expected product output.
 */
export const rectangle: (x: number, y: number, width: number, height: number) => IAutoMovieProfilePoint[] = (
  x: number,
  y: number,
  width: number,
  height: number,
): IAutoMovieProfilePoint[] => [
  { x, y },
  { x: x + width, y },
  { x: x + width, y: y + height },
  { x, y: y + height },
];
