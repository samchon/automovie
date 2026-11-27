import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { seated } from "./seated";

/*
 * Prepare a fixed body's seat socket under an unchanged rigid heading: its rest
 * offset is turned by the heading here, so every point yields the root that
 * puts the socket there with one subtraction.
 * Parameter body: The unchanged body/rest/socket geometry of this action.
 * Parameter heading: Unchanged yaw, pitch and roll in degrees for this reader.
 * Returns: A current world-metre socket-point reader yielding its world rig
 * root.
 */
export function prepareSeatedRoot(
  body: IAutoMovieMotionHumanBody,
  heading: Pick<IAutoMovieMotionHumanPosture, PrepareSeatedRootHeading>,
): (at: IAutoMovieVector3) => IAutoMovieVector3 {
  const offset: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    humanPostureHeading(heading),
    seated.offset(body),
  );
  return (at: IAutoMovieVector3): IAutoMovieVector3 =>
    AutoMovieEngineVector3.subtract(at, offset);
}

/*
 * The alternatives of `PrepareSeatedRootHeading`'s site.
 */
type PrepareSeatedRootHeading = "yaw" | "pitch" | "roll";
