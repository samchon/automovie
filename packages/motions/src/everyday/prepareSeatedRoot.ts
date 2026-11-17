import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { seated } from "./seated";

/**
 * Prepare a fixed body's seat socket under an unchanged rigid heading.
 * The first actual point acquires its rotated rest offset; every point
 * still yields the original fresh root that puts the socket there.
 *
 * @param body The unchanged body/rest/socket geometry of this action.
 * @param heading Unchanged yaw, pitch and roll in degrees for this reader.
 * @returns A current world-metre socket-point reader yielding its world rig root.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States fixed body/heading provenance, degree/world-metre units, first-use geometry acquisition and fresh current root ownership.
 * @evidence contracts/development/implementation.md#principled-implementation Uses seated.root's same canonical heading quaternion, native seated.offset and rotated socket subtraction. Only the unchanged rigid offset prepares; each actual desired point still runs the original Vector3.subtract.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One lazy fixed rotated offset precedes one fresh root subtraction; the raw root method remains the standalone numeric path and the rise's fixed-heading entry reads consume this producer.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the original heading/offset arithmetic and fresh subtraction even at repeated or endpoint points. No joint, limb goal, contact, articulation, tolerance or cached achieved root is introduced.
 * @evidence contracts/development/implementation.md#efficient-algorithms Across Q points, canonical heading construction, body socket lookup and quaternion-vector offset rotation run once; every current point retains its three original subtractions and output vector. Runtime speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The owning action establishes unchanged body/rest/socket and heading values. A changed heading or geometry requires another reader; desired points and returned roots are never retained or keyed.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The owning action retains its fixed body/heading and at most one private rotated offset until release. Every result is a fresh vector containing no reader, input point, posed map, FK/ROM source or query history.
 */
export function prepareSeatedRoot(
  body: IAutoMovieMotionHumanBody,
  heading: Pick<IAutoMovieMotionHumanPosture, "yaw" | "pitch" | "roll">,
): (at: IAutoMovieVector3) => IAutoMovieVector3 {
  let offset: IAutoMovieVector3 | undefined;
  return (at: IAutoMovieVector3): IAutoMovieVector3 => {
    offset ??= Quaternion.rotateVector(
      resolveHumanPosture.heading(heading),
      seated.offset(body),
    );
    return Vector3.subtract(at, offset);
  };
}
