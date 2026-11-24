import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmCourse } from "../compose/AutoMovieMotionHumanArmCourse";
import { HumanArmTrajectoryTerms } from "../posture/HumanArmTrajectoryTerms";
import { prepareHumanAdaptiveKnots } from "../posture/prepareHumanAdaptiveKnots";
import type { prepareHumanKnotCourse } from "../posture/prepareHumanKnotCourse";
import { HumanPerformanceRead } from "./HumanPerformanceRead";

/**
 * A hand span's hand course: the holder's displayed grip socket frame over the
 * span, solved once the performance's actions are prepared, so a read of the
 * held prop (`HumanPerformanceHoldKit`) reads this course and never the
 * holder's live posture.
 *
 * The frame is carried as three points a hand length apart: the socket, and the
 * socket moved along the frame's `+X` and `+Z` by the holder's hand length.
 * Their nine coordinates are knotted by AutoKnots (Vitenti et al. 2024,
 * arXiv:2412.13423; `prepareHumanAdaptiveKnots`) to the arm solver's own
 * millimetre (`HumanArmTrajectoryTerms.TOLERANCE`), no finer than the frame
 * grid (`AutoMovieMotionHumanArmCourse.STEP`); a read takes the socket and the
 * frame the two axes span, orthonormalized (Gram-Schmidt).
 *
 * @param self The performance, its actions prepared.
 * @param grip The hand span.
 * @returns The hand frame at a film second of the span.
 */
export function prepareHumanGripHand(
  self: IAutoMovieMotionHumanPerformanceState,
  grip: IAutoMovieMotionHumanPerformanceState.IGrip,
): (seconds: number) => IAutoMovieRigidTransform {
  const from: number = grip.from;
  const to: number = Math.min(grip.to, self.duration);
  const length: number = self.people.get(grip.subject)!.performer.body.measure
    .hand;
  const read = (seconds: number): IAutoMovieRigidTransform =>
    HumanPerformanceRead.hand(self, grip.subject, grip.side, seconds);
  if (!(to > from)) return (): IAutoMovieRigidTransform => read(from);
  const course: prepareHumanKnotCourse.ICourse = prepareHumanAdaptiveKnots({
    from,
    to,
    evaluate: (seconds: number): readonly number[] => {
      const frame: IAutoMovieRigidTransform = read(seconds);
      const x: IAutoMovieVector3 = Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, { x: length, y: 0, z: 0 }),
      );
      const z: IAutoMovieVector3 = Vector3.add(
        frame.position,
        Quaternion.rotateVector(frame.rotation, { x: 0, y: 0, z: length }),
      );
      return [
        frame.position.x,
        frame.position.y,
        frame.position.z,
        x.x,
        x.y,
        x.z,
        z.x,
        z.y,
        z.z,
      ];
    },
    tolerance: {
      kind: "absolute",
      absolute: HumanArmTrajectoryTerms.TOLERANCE / 1000,
    },
    maxKnots: Math.ceil((to - from) / AutoMovieMotionHumanArmCourse.STEP) + 1,
  }).course;
  return (seconds: number): IAutoMovieRigidTransform => {
    const v: number[] = course.position(Math.min(to, Math.max(from, seconds)));
    const position: IAutoMovieVector3 = { x: v[0]!, y: v[1]!, z: v[2]! };
    const xAxis: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract({ x: v[3]!, y: v[4]!, z: v[5]! }, position),
    );
    const toward: IAutoMovieVector3 = Vector3.subtract(
      { x: v[6]!, y: v[7]!, z: v[8]! },
      position,
    );
    const zAxis: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(
        toward,
        Vector3.scale(xAxis, Vector3.dot(toward, xAxis)),
      ),
    );
    return {
      position,
      rotation: basis(xAxis, Vector3.cross(zAxis, xAxis), zAxis),
    };
  };
}

/**
 * The rotation whose columns are an orthonormal right-handed basis (Shepperd
 * 1978, J. Guidance Control 1(3):223, the larger-diagonal branch).
 */
function basis(
  x: IAutoMovieVector3,
  y: IAutoMovieVector3,
  z: IAutoMovieVector3,
): IAutoMovieQuaternion {
  const trace: number = x.x + y.y + z.z;
  if (trace > 0) {
    const s: number = 2 * Math.sqrt(1 + trace);
    return Quaternion.normalize({
      w: s / 4,
      x: (y.z - z.y) / s,
      y: (z.x - x.z) / s,
      z: (x.y - y.x) / s,
    });
  }
  if (x.x > y.y && x.x > z.z) {
    const s: number = 2 * Math.sqrt(1 + x.x - y.y - z.z);
    return Quaternion.normalize({
      w: (y.z - z.y) / s,
      x: s / 4,
      y: (y.x + x.y) / s,
      z: (z.x + x.z) / s,
    });
  }
  if (y.y > z.z) {
    const s: number = 2 * Math.sqrt(1 + y.y - x.x - z.z);
    return Quaternion.normalize({
      w: (z.x - x.z) / s,
      x: (y.x + x.y) / s,
      y: s / 4,
      z: (z.y + y.z) / s,
    });
  }
  const s: number = 2 * Math.sqrt(1 + z.z - x.x - y.y);
  return Quaternion.normalize({
    w: (x.y - y.x) / s,
    x: (z.x + x.z) / s,
    y: (z.y + y.z) / s,
    z: s / 4,
  });
}
