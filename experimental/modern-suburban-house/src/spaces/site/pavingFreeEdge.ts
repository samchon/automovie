
import type {
  IAutoMovieVector3,
} from "@automovie/interface";

const edgeAt = (a: number, b: number, value: number): boolean =>
  Math.abs(a - value) < 1e-8 && Math.abs(b - value) < 1e-8;

/** Keep only the outside sides of a paving rectangle; omit a caller-owned joined edge.
 */
export const pavingFreeEdge = (
  x: readonly [number, number],
  z: readonly [number, number],
  joined: (a: IAutoMovieVector3, b: IAutoMovieVector3) => boolean = () => false,
): ((a: IAutoMovieVector3, b: IAutoMovieVector3) => boolean) =>
  (a, b) => (
    edgeAt(a.x, b.x, x[0]) || edgeAt(a.x, b.x, x[1]) ||
    edgeAt(a.z, b.z, z[0]) || edgeAt(a.z, b.z, z[1])
  ) && !joined(a, b);

