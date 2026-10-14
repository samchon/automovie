import { Quaternion, type importedNodeClipToAutoMovieMotion } from "@automovie/engine";
import type { IAutoMovieClip, IAutoMovieQuaternion, IAutoMovieSkeleton } from "@automovie/interface";

import { importedNodeMotionTestClip as clip } from "./importedNodeMotionTestClip";
import { importedNodeMotionTestRotation as rotation } from "./importedNodeMotionTestRotation";
import { importedNodeMotionTestSkeleton as skeleton } from "./importedNodeMotionTestSkeleton";

/**
 * Preserve the existing nonidentity-rest input for the final lowering scenario.
 *
 * @evidence contracts/testing.md#behavioral-verification Builds the same thirty-degree spine rest rotation and two matching absolute rotation keys, leaving actual lowering and assertions in the consumer.
 * @evidence contracts/testing.md#independent-expectations The authored rest/absolute keys are inputs; the consumer independently requires zero relative root/joint angles rather than using a computed expected motion.
 * @evidence contracts/testing.md#distinguishing-cases Moves only the existing fourth scenario's input group, retaining skeleton/rotation/clip construction order and both repeated key tuples.
 * @evidence contracts/testing.md#execution-ownership Returns fresh clip/skeleton records and borrows the original mapping array unchanged; no file, native importer, renderer, browser or GPU is opened and no foreign method is replaced.
 */
export function importedNodeMotionTestRestRelativeInput(
  mapping: Parameters<typeof importedNodeClipToAutoMovieMotion>[0]["mapping"],
): Parameters<typeof importedNodeClipToAutoMovieMotion>[0] {
  const sourceSkeleton: IAutoMovieSkeleton = skeleton();
  const restRotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 30);
  sourceSkeleton.bones[1]!.rest.rotation = restRotation;
  const neutralClip: IAutoMovieClip = clip();
  neutralClip.tracks[2] = rotation("spine-node", [0, 1], [
    restRotation.x, restRotation.y, restRotation.z, restRotation.w,
    restRotation.x, restRotation.y, restRotation.z, restRotation.w,
  ]);
  return { clip: neutralClip, sourceSkeleton, mapping, motionId: "rest-relative" };
}
