import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { humanPostureHeading } from "../posture/humanPostureHeading";
import { seated } from "./seated";

/** The alternatives of `PrepareSeatedRootHeading`'s site. */
type PrepareSeatedRootHeading = "yaw" | "pitch" | "roll";

/**
 * Prepare a fixed body's seat socket under an unchanged rigid heading. The
 * first actual point acquires its rotated rest offset; every point still yields
 * the original fresh root that puts the socket there.
 *
 * @param body The unchanged body/rest/socket geometry of this action.
 * @param heading Unchanged yaw, pitch and roll in degrees for this reader.
 * @returns A current world-metre socket-point reader yielding its world rig
 *   root.
 */
export function prepareSeatedRoot(
  body: IAutoMovieMotionHumanBody,
  heading: Pick<IAutoMovieMotionHumanPosture, PrepareSeatedRootHeading>,
): (at: IAutoMovieVector3) => IAutoMovieVector3 {
  let offset: IAutoMovieVector3 | undefined;
  return (at: IAutoMovieVector3): IAutoMovieVector3 => {
    offset ??= Quaternion.rotateVector(
      humanPostureHeading(heading),
      seated.offset(body),
    );
    return Vector3.subtract(at, offset);
  };
}
