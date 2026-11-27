import { Vector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMoviePhysicalShapeNearest,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";

/*
 * Read a contact's height above the outward side of its authored surface.
 * On the usual side, the nearest supporting normal certifies that the
 * outward ray's distance is nondecreasing. A point on the far side can have
 * positive point clearance too, though its ray passes through the collider.
 * There, the ray's least signed distance and the enclosing sphere bracket
 * the first admitted point on the authored side. The returned deficit is
 * how far to move in the site's normal to reach it.
 * Parameter at: The located site and its touched convex shape.
 * Parameter contact: The hand's current contact point in world metres.
 * Returns: The clearance and linearisation direction, when there is a surface.
 * , Luo, Tai and Yang (2021), Theorem 3.1, signed-distance convexity. https://arxiv.org/abs/2003.09600
 * @see Li, Luo, Tai and Yang (2021), Theorem 3.1, signed-distance convexity. https://arxiv.org/abs/2003.09600
 */
export function HumanArmSurfaceLift(
  at: P.ILocated,
  contact: IAutoMovieVector3,
): HumanArmSurfaceLift.IReading | undefined {
  const { normal, shape }: P.ILocated = at;
  if (normal === undefined || shape === undefined) return undefined;
  const height: number = at.height ?? at.gap(at.point);
  const nearest: IAutoMoviePhysicalShapeNearest.IResult = AutoMovieEnginePhysics.physicalShapeNearest(
    shape.pose,
    shape.shape,
    contact,
    contact,
  );
  const local = (): HumanArmSurfaceLift.IReading => ({
    metres: nearest.distance - height,
    normal: at.normalAt(contact),
  });
  // A supporting normal is a subgradient of the convex signed distance.
  if (Vector3.dot(normal, nearest.normal) >= 0) return local();
  const resolution: number = T.TOLERANCE / 1000;
  let high: number =
    Vector3.dot(Vector3.subtract(shape.centre, contact), normal) +
    shape.radius +
    Math.max(0, height) +
    resolution;
  if (high <= 0) return local();
  const point = (distance: number): IAutoMovieVector3 =>
    Vector3.add(contact, Vector3.scale(normal, distance));
  const deepest: IAutoMoviePhysicalShapeNearest.IResult = AutoMovieEnginePhysics.physicalShapeNearest(
    shape.pose,
    shape.shape,
    contact,
    point(high),
  );
  if (deepest.distance >= height) return local();
  let low: number = Vector3.dot(Vector3.subtract(deepest.at, contact), normal);
  const gap: ReturnType<typeof AutoMovieEnginePhysics.preparePhysicalShapeSegmentDistance> =
    AutoMovieEnginePhysics.preparePhysicalShapeSegmentDistance(shape.pose, shape.shape);
  // The signed distance is nondecreasing after the ray's minimum. Keep the
  // outward bracket so its reported correction reaches the admitted side.
  while (high - low > resolution) {
    const mid: number = (low + high) / 2;
    const trial: IAutoMovieVector3 = point(mid);
    if (gap(trial, trial) < height) low = mid;
    else high = mid;
  }
  return { metres: -high, normal };
}

/*
 * A surface height shared by admission and its convex subproblem.
 */
export namespace HumanArmSurfaceLift {
  /*
   * The height and the direction in which it increases.
   */
  export interface IReading {
    /*
     * Signed clearance, metres.
     */
    metres: number;

    /*
     * The direction of positive change in world coordinates.
     */
    normal: IAutoMovieVector3;
  }
}
