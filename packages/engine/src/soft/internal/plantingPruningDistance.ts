import {
  IAutoMoviePruningEnvelope,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * Find the forward distance where an inside-base unit-axis segment leaves an
 * authored box or sphere, or null when the exit is not before the segment end.
 */
export function plantingPruningDistance(
  envelope: IAutoMoviePruningEnvelope,
  base: IAutoMovieVector3,
  axis: IAutoMovieVector3,
  length: number,
): number | null {
  if (envelope.kind === "none") return null;
  if (envelope.kind === "box") {
    let exit: number = Infinity;
    const low: number[] = [envelope.min.x, envelope.min.y, envelope.min.z];
    const high: number[] = [envelope.max.x, envelope.max.y, envelope.max.z];
    const from: number[] = [base.x, base.y, base.z];
    const direction: number[] = [axis.x, axis.y, axis.z];
    for (let at: number = 0; at < 3; ++at) {
      if (direction[at] === 0) continue;
      const bound: number = direction[at] > 0 ? high[at] : low[at];
      const distance: number = (bound - from[at]) / direction[at];
      if (distance < exit) exit = distance;
    }
    return exit < length ? exit : null;
  }
  const ox: number = base.x - envelope.center.x;
  const oy: number = base.y - envelope.center.y;
  const oz: number = base.z - envelope.center.z;
  const b: number = ox * axis.x + oy * axis.y + oz * axis.z;
  const c: number =
    ox * ox + oy * oy + oz * oz - envelope.radius * envelope.radius;
  const exit: number = -b + Math.sqrt(b * b - c);
  return exit < length ? exit : null;
}
