import { AutoMovieHumanLoftChain as Loft } from "../lofting/AutoMovieHumanLoftChain";
import type { IAutoMovieHumanLoftChain } from "../lofting/IAutoMovieHumanLoftChain";
import type { AutoMovieHumanFootSurface as Foot } from "./AutoMovieHumanFootSurface";
import { AutoMovieHumanFootGeometry as G } from "./foot/AutoMovieHumanFootGeometry";

/**
 * Copy one canonical source course into registered metres without projecting
 * its points. Extents follow its actual section axes; cyclic polygon arclength
 * supplies display coordinates without changing material phases or geometry.
 */
export function AutoMovieHumanFootSurfaceCourse(
  chain: IAutoMovieHumanLoftChain,
  station: number,
  phases: number[],
  scale: number,
): Foot.ICourse {
  const points: Foot.Vector[] = Loft.ring(chain, station, phases).map(
    (point: Foot.Vector): Foot.Vector => G.scale(point, scale),
  );
  const centre: Foot.Vector = G.scale(Loft.axis(chain, station), scale);
  const frame: ReturnType<typeof Loft.frame> = Loft.frame(chain, station);
  const u: number[] = points.map(
    (point: Foot.Vector): number => G.dot(G.sub(point, centre), frame.u),
  );
  const v: number[] = points.map(
    (point: Foot.Vector): number => G.dot(G.sub(point, centre), frame.v),
  );
  const lengths: number[] = points.map(
    (point: Foot.Vector, index: number): number =>
      Math.hypot(...G.sub(points[(index + 1) % points.length]!, point)),
  );
  const total: number = lengths.reduce(
    (sum: number, length: number): number => sum + length,
    0,
  );
  if (!(total > 0) || !points.every((point: Foot.Vector): boolean => point.every(Number.isFinite)))
    throw new Error("Foot source course is collapsed or nonfinite");

  let travelled: number = 0;
  const coordinates: number[] = lengths.map((length: number): number => {
    const value: number = (2 * Math.PI * travelled) / total;
    travelled += length;
    return value;
  });
  return {
    chain: chain.name as Foot.Chain,
    stationMm: station,
    centre,
    depth: Math.max(...u) - Math.min(...u),
    breadth: Math.max(...v) - Math.min(...v),
    points,
    sourcePhases: [...phases],
    displayCoordinates: coordinates,
  };
}
