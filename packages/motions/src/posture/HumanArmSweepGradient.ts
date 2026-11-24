import { Quaternion, Vector3, physicalShapeHull } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMoviePhysicalShapeNearest,
  IAutoMovieVector3,
} from "@automovie/interface";

/**
 * Differentiate the least signed hull distance along a penetrating arm chord.
 * For an interior minimizer between two active face planes, its longitudinal
 * stationarity determines their multipliers. The resulting covector is not
 * generally unit length. Unique or unresolved face readings keep the native
 * distance query's normal.
 *
 * @param shape The waypoint obstacle with its placed physical solid.
 * @param nearest The native segment witness and signed distance.
 * @param span The relative endpoint displacement in world metres.
 * @param u The nearest point's position along the segment.
 * @returns The world covector used for endpoint gradients.
 */
export function HumanArmSweepGradient(
  shape: IAutoMovieMotionHumanArmGeometry.IShape,
  nearest: IAutoMoviePhysicalShapeNearest.IResult,
  span: IAutoMovieVector3,
  u: number,
): IAutoMovieVector3 {
  const solid = shape.shape;
  if (solid.kind !== "hull" || nearest.distance >= 0 || u <= 0 || u >= 1)
    return nearest.normal;
  const slopeError: number = ROUNDING * Vector3.length(span);
  if (Math.abs(Vector3.dot(nearest.normal, span)) <= slopeError)
    return nearest.normal;
  const centre = Vector3.add(
    shape.pose.position,
    Quaternion.rotateVector(shape.pose.rotation, solid.transform.position),
  );
  const rotation = Quaternion.multiply(
    shape.pose.rotation,
    solid.transform.rotation,
  );
  const inverse = Quaternion.inverse(rotation);
  const point = Quaternion.rotateVector(
    inverse,
    Vector3.subtract(nearest.at, centre),
  );
  const direction = Quaternion.rotateVector(inverse, span);
  const error: number =
    ROUNDING *
    (Vector3.length(nearest.at) +
      Vector3.length(centre) +
      Vector3.length(point) +
      Math.abs(nearest.distance));
  let negative: IAutoMovieVector3 | undefined;
  let positive: IAutoMovieVector3 | undefined;
  let low: number = 0;
  let high: number = 0;
  for (const face of physicalShapeHull(solid).faces) {
    const distance: number = Vector3.dot(face.normal, point) - face.offset;
    if (Math.abs(distance - nearest.distance) > error) continue;
    const slope: number = Vector3.dot(face.normal, direction);
    if (slope < -slopeError && negative === undefined) {
      negative = face.normal;
      low = slope;
    } else if (slope > slopeError && positive === undefined) {
      positive = face.normal;
      high = slope;
    } else return nearest.normal;
  }
  if (negative === undefined || positive === undefined) return nearest.normal;
  return Quaternion.rotateVector(
    rotation,
    Vector3.lerp(negative, positive, -low / (high - low)),
  );
}

/**
 * Forward rounding bound for the two rigid transforms, plane dot and
 * subtraction (fewer than 64 serial rounded operations).
 */
const ROUNDING: number = (64 * Number.EPSILON) / (1 - 64 * Number.EPSILON);
