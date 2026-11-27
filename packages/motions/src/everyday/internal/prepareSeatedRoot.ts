import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { seated } from "./seated";

/** The alternatives of `PrepareSeatedRootHeading`'s site. */
type PrepareSeatedRootHeading = "yaw" | "pitch" | "roll";

/**
 * Prepare a fixed body's seat socket under an unchanged rigid heading: its rest
 * offset is turned by the heading here, so every point yields the root that
 * puts the socket there with one subtraction.
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
  const offset: IAutoMovieVector3 = Quaternion.rotateVector(
    humanPostureHeading(heading),
    seated.offset(body),
  );
  return (at: IAutoMovieVector3): IAutoMovieVector3 =>
    Vector3.subtract(at, offset);
}
