import { AutoMovieEngineQuaternion, AutoMovieEngineVector3, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMoviePhysicalShapeNearest,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { HumanArmTrajectorySweep } from "./HumanArmTrajectorySweep";

/*
 * Differentiate the least signed hull distance along a penetrating arm chord.
 * For an interior minimizer between two active face planes, its longitudinal
 * stationarity determines their multipliers. The resulting covector is not
 * generally unit length. Unique or unresolved face readings keep the native
 * distance query's normal.
 * Parameter shape: The waypoint obstacle with its placed physical solid.
 * Parameter nearest: The native segment witness and signed distance.
 * Parameter span: The relative endpoint displacement in world metres.
 * Parameter u: The nearest point's position along the segment.
 * Returns: The world covector used for endpoint gradients.
 */
export function HumanArmSweepGradient(
  shape: Placement,
  nearest: IAutoMoviePhysicalShapeNearest.IResult,
  span: IAutoMovieVector3,
  u: number,
): IAutoMovieVector3 {
  const solid = shape.shape;
  if (solid.kind !== "hull" || nearest.distance >= 0 || u <= 0 || u >= 1)
    return nearest.normal;
  const slopeError: number = ROUNDING * AutoMovieEngineVector3.length(span);
  if (Math.abs(AutoMovieEngineVector3.dot(nearest.normal, span)) <= slopeError)
    return nearest.normal;
  const centre = AutoMovieEngineVector3.add(
    shape.pose.position,
    AutoMovieEngineQuaternion.rotateVector(shape.pose.rotation, solid.transform.position),
  );
  const rotation = AutoMovieEngineQuaternion.multiply(
    shape.pose.rotation,
    solid.transform.rotation,
  );
  const inverse = AutoMovieEngineQuaternion.inverse(rotation);
  const point = AutoMovieEngineQuaternion.rotateVector(
    inverse,
    AutoMovieEngineVector3.subtract(nearest.at, centre),
  );
  const direction = AutoMovieEngineQuaternion.rotateVector(inverse, span);
  const error: number =
    ROUNDING *
    (AutoMovieEngineVector3.length(nearest.at) +
      AutoMovieEngineVector3.length(centre) +
      AutoMovieEngineVector3.length(point) +
      Math.abs(nearest.distance));
  let negative: IAutoMovieVector3 | undefined;
  let positive: IAutoMovieVector3 | undefined;
  let low: number = 0;
  let high: number = 0;
  for (const face of AutoMovieEnginePhysics.physicalShapeHull(solid).faces) {
    const distance: number = AutoMovieEngineVector3.dot(face.normal, point) - face.offset;
    if (Math.abs(distance - nearest.distance) > error) continue;
    const slope: number = AutoMovieEngineVector3.dot(face.normal, direction);
    if (slope < -slopeError && negative === undefined) {
      negative = face.normal;
      low = slope;
    } else if (slope > slopeError && positive === undefined) {
      positive = face.normal;
      high = slope;
    } else return nearest.normal;
  }
  if (negative === undefined || positive === undefined) return nearest.normal;
  return AutoMovieEngineQuaternion.rotateVector(
    rotation,
    AutoMovieEngineVector3.lerp(negative, positive, -low / (high - low)),
  );
}

/*
 * The swept distance's gradient in the coordinates of its two endpoints.
 */
export namespace HumanArmSweepGradient {
  /*
   * Distribute the closest chord point's gradient by its two affine weights
   * (Schulman et al. 2014, §4.2 equations 17–20), then carry each covector
   * from the obstacle's encounter frame back to the endpoint's frame.
   * Parameter shape: The placed obstacle in its encounter frame.
   * Parameter sweep: The probe chord and nearest signed-distance witness.
   * Returns: The covectors in the start and end frames, in that order.
   * ://doi.org/10.1177/0278364914528132
   * @see https://doi.org/10.1177/0278364914528132
   */
  export function ends(
    shape: Placement,
    sweep: Witness,
  ): [IAutoMovieVector3, IAutoMovieVector3] {
    const span: IAutoMovieVector3 = AutoMovieEngineVector3.subtract(sweep.to, sweep.start);
    const squared: number = AutoMovieEngineVector3.dot(span, span);
    const u: number =
      squared > 0
        ? Math.min(
            1,
            Math.max(
              0,
              AutoMovieEngineVector3.dot(AutoMovieEngineVector3.subtract(sweep.near.at, sweep.start), span) /
                squared,
            ),
          )
        : 0;
    const g: IAutoMovieVector3 = HumanArmSweepGradient(
      shape,
      sweep.near,
      span,
      u,
    );
    return [
      AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.inverse(sweep.first),
        AutoMovieEngineVector3.scale(g, 1 - u),
      ),
      AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.inverse(sweep.turn),
        AutoMovieEngineVector3.scale(g, u),
      ),
    ];
  }
}

/*
 * Forward rounding bound for the two rigid transforms, plane dot and
 * subtraction (fewer than 64 serial rounded operations).
 */
const ROUNDING: number = (64 * Number.EPSILON) / (1 - 64 * Number.EPSILON);

/*
 * The placed shape parts needed by the signed-distance gradient.
 */
type Placement = Pick<IAutoMovieMotionHumanArmGeometry.IShape, "pose" | "shape">;

/*
 * The chord, its nearest witness and the endpoint frames.
 */
type Witness = Pick<
  HumanArmTrajectorySweep.ISwept,
  "start" | "to" | "near" | "first" | "turn"
>;
