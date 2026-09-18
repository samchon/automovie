import { IAutoMovieServiceNetwork, IAutoMovieServiceSegment, IAutoMovieServiceSystem } from "@automovie/interface";

/**
 * Squared distance from a point to a run's centre line, in square metres.
 *
 * Squared because every caller compares it against a squared radius, and taking
 * the root first would only add a rounding step to a comparison that does not
 * need one.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-routing `routeDistanceSquared` measures how closely a sleeve or other routed point lies to the service centre line without losing precision to a square root.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `routeDistanceSquared` returns the minimum clamped point-to-segment squared distance over every adjacent route-point pair.
 */
export const routeDistanceSquared = (
  segment: IAutoMovieServiceSegment,
  point: { x: number; y: number; z: number },
): number => {
  let best = Number.POSITIVE_INFINITY;
  for (let index = 0; index + 1 < segment.route.length; ++index) {
    const one = segment.route[index]!;
    const next = segment.route[index + 1]!;
    const dx = next.x - one.x;
    const dy = next.y - one.y;
    const dz = next.z - one.z;
    const lengthSquared = dx * dx + dy * dy + dz * dz;
    const t =
      lengthSquared === 0
        ? 0
        : Math.min(
            1,
            Math.max(
              0,
              ((point.x - one.x) * dx +
                (point.y - one.y) * dy +
                (point.z - one.z) * dz) /
                lengthSquared,
            ),
          );
    const ex = one.x + dx * t - point.x;
    const ey = one.y + dy * t - point.y;
    const ez = one.z + dz * t - point.z;
    best = Math.min(best, ex * ex + ey * ey + ez * ez);
  }
  return best;
};

const requireSystem = (
  network: IAutoMovieServiceNetwork,
  id: string,
): IAutoMovieServiceSystem => {
  const system = network.systems.find((candidate) => candidate.id === id);
  if (system === undefined)
    throw new Error(`service network "${network.id}" has no system "${id}"`);
  return system;
};

const push = (map: Map<string, string[]>, key: string, value: string): void => {
  const bucket = map.get(key);
  if (bucket === undefined) map.set(key, [value]);
  else bucket.push(value);
};
