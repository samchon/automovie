import {
  type AutoMovieSurfaceTier,
  type IAutoMovieSubdivisionSurface,
  type IAutoMovieSurfaceCage,
  type IAutoMovieSurfaceLocation,
  type IAutoMovieSurfaceNetwork,
  locateAutoMovieSurfaceVertices,
  sampleAutoMovieSurfaceNetwork,
  subdivideAutoMovieSurface,
} from "@automovie/engine";

/**
 * The limit perimeter of a network's whole-turn row at patch coordinate `t`,
 * measured on the subdivided surface: the closed polyline through the limit
 * positions of the row's vertices at two and three levels, extrapolated by
 * Richardson's rule `(4 L3 - L2) / 3`, since a polyline's shortfall shrinks
 * with the square of its spacing. It reads only subdivided limit positions,
 * so it is independent of how a sampler measures the row.
 *
 * @param network The network; its first patch must be a sweep patch spanning a whole turn.
 * @param tier The tier to sample.
 * @param rows The rows' patch coordinates along the spine, each a row at the tier.
 * @returns Each row's perimeter, metres.
 */
export function sweepRowPerimeter(
  network: IAutoMovieSurfaceNetwork,
  tier: AutoMovieSurfaceTier,
  rows: readonly number[],
): number[] {
  const cage: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
    network,
    tier,
  });
  function at(levels: number): number[] {
    const surface: IAutoMovieSubdivisionSurface = subdivideAutoMovieSurface({
      cage: { positions: cage.cage.positions, faces: cage.cage.faces },
      levels,
    });
    const locations: IAutoMovieSurfaceLocation[] =
      locateAutoMovieSurfaceVertices({
        network,
        cage,
        parameters: surface.parameters,
      });
    return rows.map((t: number): number => {
      const row: Array<[number, number]> = [];
      const seen: Set<number> = new Set();
      locations.forEach((l: IAutoMovieSurfaceLocation, v: number): void => {
        const s: number = l.coordinate.s % 1;
        if (
          l.coordinate.patch !== 0 ||
          Math.abs(l.coordinate.t - t) > 1e-12 ||
          seen.has(s)
        )
          return;
        seen.add(s);
        row.push([s, v]);
      });
      row.sort(
        (a: [number, number], b: [number, number]): number => a[0] - b[0],
      );
      const p: number[] = surface.limitPositions;
      let length: number = 0;
      row.forEach(([, a]: [number, number], k: number): void => {
        const b: number = row[(k + 1) % row.length]![1];
        length += Math.hypot(
          p[3 * b]! - p[3 * a]!,
          p[3 * b + 1]! - p[3 * a + 1]!,
          p[3 * b + 2]! - p[3 * a + 2]!,
        );
      });
      return length;
    });
  }
  const fine: number[] = at(3);
  const coarse: number[] = at(2);
  return fine.map((l: number, k: number): number => (4 * l - coarse[k]!) / 3);
}
