import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanSurface,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Measure a displayed glide in the equipment's midpoint heading and the
 * surface's plane. A straight glide or a circular glide with tangent equipment
 * can advance while leaving transverse displacement near zero. An intended skid
 * can use the same reading with a different expected transverse displacement.
 * The stationary plant audit keeps its original world-position check.
 *
 * @param before The first displayed equipment contact, from a pose or prop.
 * @param after The next displayed contact of the same equipment.
 * @param surface The plane both samples are staged against.
 * @returns The longitudinal and transverse displacements and last normal gap.
 * @throws {RangeError} If the plane has no normal or a usable gliding direction
 *   cannot be recovered from the two samples.
 */
export function measureSurfaceGlide(
  before: IAutoMovieMotionHumanSurface.IGlideSample,
  after: IAutoMovieMotionHumanSurface.IGlideSample,
  surface: IAutoMovieMotionHumanSurface.IGlidePlane,
): IAutoMovieMotionHumanSurface.IGlideMeasure {
  const normalLength: number = Vector3.length(surface.normal);
  if (normalLength === 0)
    throw new RangeError("a glide measurement requires a surface normal");
  const normal: IAutoMovieVector3 = Vector3.scale(
    surface.normal,
    1 / normalLength,
  );
  const tangent = (forward: IAutoMovieVector3): IAutoMovieVector3 => {
    const projected: IAutoMovieVector3 = Vector3.subtract(
      forward,
      Vector3.scale(normal, Vector3.dot(forward, normal)),
    );
    const length: number = Vector3.length(projected);
    if (!(length > 1e-9))
      throw new RangeError("the equipment must point along the glide plane");
    return Vector3.scale(projected, 1 / length);
  };
  const bisector: IAutoMovieVector3 = Vector3.add(
    tangent(before.forward),
    tangent(after.forward),
  );
  const bisectorLength: number = Vector3.length(bisector);
  if (bisectorLength <= 1e-9)
    throw new RangeError("glide samples must be closer than half a turn");
  const forward: IAutoMovieVector3 = Vector3.scale(
    bisector,
    1 / bisectorLength,
  );
  const right: IAutoMovieVector3 = Vector3.cross(normal, forward);
  const displacement: IAutoMovieVector3 = Vector3.subtract(
    after.point,
    before.point,
  );
  return {
    along: Vector3.dot(displacement, forward),
    across: Vector3.dot(displacement, right),
    gap: Vector3.dot(Vector3.subtract(after.point, surface.point), normal),
  };
}
