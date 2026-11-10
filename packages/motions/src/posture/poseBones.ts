import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";

/**
 * Every bone of a canonical pose placed in the world, by name: forward
 * kinematics with the canonical joint axes and rest frames, the reading the
 * performance and the capture use, so a law that reads a pose it resolved
 * itself (where a hand hangs, where a thigh lies) sees what is displayed.
 *
 * @param body The body.
 * @param pose The pose.
 * @returns Resolved bones by rig bone.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the reading used and why it matches the display.
 * @evidence contracts/development/implementation.md#principled-implementation The engine's forward kinematics with the canonical humanoid axes and rest frames.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure The single owner of pose-to-bone forward kinematics in motions: one engine call keyed into a map, used by the performance, the posture code and every law instead of a local copy.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No cast, assertion or tolerance; the axes and rest frames are the engine's canonical tables.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the rig's bone count, once per call.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its input.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function poseBones(
  body: IHumanBody,
  pose: IAutoMoviePose,
): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
  return new Map(
    resolvePose(
      pose,
      body.skeleton,
      HUMANOID_JOINT_AXES,
      HUMANOID_REST_FRAME,
    ).map(
      (
        r: IAutoMovieResolvedBone,
      ): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [r.bone, r],
    ),
  );
}
