import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

/*
 * A held tool's working pose turned about a fixed world axis through a pivot
 * (`useTool`): a hammer's head raised about the grip, a screwdriver turned
 * about its own line through the work point.
 * Parameter pose: The working pose: the grip's world point, metres, and the hand's
 * world rotation.
 * Parameter axis: The world axis the pose turns about; need not be unit length.
 * Parameter about: The world point the axis passes through, metres.
 * Returns: For a turn in degrees (right-handed about `axis`), the turned grip
 * and hand rotation, fresh records.
 */
export function HumanToolTurn(
  pose: IHumanToolTurnPose,
  axis: IAutoMovieVector3,
  about: IAutoMovieVector3,
): (degrees: number) => IHumanToolTurnResult {
  const turning: ReturnType<typeof Quaternion.prepareAxisAngle> =
    Quaternion.prepareAxisAngle(axis);
  return (degrees: number): IHumanToolTurnResult2 => {
    const turn: IAutoMovieQuaternion = turning(degrees);
    const orbit: IAutoMovieVector3 = Vector3.subtract(pose.grip, about);
    return {
      grip: Vector3.add(about, Quaternion.rotateVector(turn, orbit)),
      rotation: Quaternion.multiply(turn, pose.rotation),
    };
  };
}

/*
 * The record of `IHumanToolTurnResult2`'s site.
 */
type IHumanToolTurnResult2 = {
  grip: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
};

/*
 * The record of `IHumanToolTurnResult`'s site.
 */
type IHumanToolTurnResult = {
  grip: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
};

/*
 * The record of `IHumanToolTurnPose`'s site.
 */
type IHumanToolTurnPose = {
  grip: IAutoMovieVector3;
  rotation: IAutoMovieQuaternion;
};
