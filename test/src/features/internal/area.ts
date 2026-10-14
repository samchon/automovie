import { IAutoMovieProfilePoint } from "../../../../packages/engine/src/geometry/IAutoMovieProfilePoint";

/**
 * Sum the cyclic shoelace cross-products and return unsigned area of the caller's simple planar ring, in squared coordinate units. The arch fixture supplies its authored quad/pier coordinates, so this is independent of production mesh-volume accumulation but cannot catch a common ring-construction error; no polygon admission occurs here and an empty ring returns zero.
 *
 * One O(N) fold uses constant extra storage and ordinary binary64 arithmetic, with no coordinate repair, retained ring or cached measurement.
 */
export const area: (ring: readonly IAutoMovieProfilePoint[]) => number = (
  ring: readonly IAutoMovieProfilePoint[],
): number =>
  Math.abs(
    ring.reduce(
      (sum: number, point: IAutoMovieProfilePoint, index: number): number => {
        const next: IAutoMovieProfilePoint = ring[(index + 1) % ring.length]!;
        return sum + point.x * next.y - next.x * point.y;
      },
      0,
    ) / 2,
  );
