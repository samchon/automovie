import { Quaternion, Vector3, physicalHullFaces } from "@automovie/engine";
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
 * @evidence contracts/development/common.md#meaningful-documentation Defines the reading, exceptional feature and returned derivative.
 * @evidence contracts/development/implementation.md#principled-implementation Interior minimization of the maximum of two affine plane distances has nonnegative KKT face multipliers summing to one and zero weighted slope along the segment.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The two active planes must bracket zero slope; a third, absent or flat face leaves the original reading.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Neither clearance nor the admitted waypoint threshold changes.
 * @evidence contracts/development/implementation.md#efficient-algorithms Only a penetrating hull with an interior witness and nonstationary reported face needs the face walk.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses the physical hull's own face representation, the same transforms and the native minimizer.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only two transient face references are retained during the walk.
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
  for (const face of physicalHullFaces(solid.points).faces) {
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

/** Forward rounding bound for the two rigid transforms, plane dot and subtraction (fewer than 64 serial rounded operations). */
const ROUNDING: number = (64 * Number.EPSILON) / (1 - 64 * Number.EPSILON);
