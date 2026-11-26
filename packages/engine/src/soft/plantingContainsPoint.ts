import {
  IAutoMoviePruningEnvelope,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Test a recipe-local point against the authored none, closed box or closed
 * sphere pruning envelope.
 */
export function plantingContainsPoint(
  envelope: IAutoMoviePruningEnvelope,
  point: IAutoMovieVector3,
): boolean {
  if (envelope.kind === "none") return true;
  if (envelope.kind === "box")
    return (
      point.x >= envelope.min.x &&
      point.x <= envelope.max.x &&
      point.y >= envelope.min.y &&
      point.y <= envelope.max.y &&
      point.z >= envelope.min.z &&
      point.z <= envelope.max.z
    );
  const dx: number = point.x - envelope.center.x;
  const dy: number = point.y - envelope.center.y;
  const dz: number = point.z - envelope.center.z;
  return dx * dx + dy * dy + dz * dz <= envelope.radius * envelope.radius;
}
