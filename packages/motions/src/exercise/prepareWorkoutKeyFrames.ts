import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { ExerciseKey } from "./ExerciseKey";

/**
 * Own actual key-to-frame observations within one synchronous workout
 * geometry search. A key's posed representation has no limb/digit/rotation
 * goals, but arbitrary key producers may change clinical joints at every
 * trial, so every actual key retains ordinary complete canonical admission.
 *
 * @param body The unchanged canonical body of this pitch or roll search.
 * @param requested Fixed output bone demand; omission preserves the complete map.
 * @returns A current authored-key reader yielding a fresh raw view with borrowed key joint tuples and a fresh actual bone map; release the reader when this search returns or throws.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the synchronous search boundary, goal-free posed-key representation, changing clinical inputs, complete current admission and fresh raw/map ownership.
 * @evidence contracts/development/implementation.md#principled-implementation ExerciseKey.posed owns the same root-zero/yaw-zero raw representation as the original trunk search. Every actual candidate follows ordinary seeded admission and current range projection; callback-produced clinical data are never certified from JSON equality or replaced by an earlier shape.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One search owns bounded FK/ROM metadata and an optional fixed-name reader. Each key constructs its actual raw view, resolves normally and performs current requested FK before returning the observations used by real height/bounds consumers.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No caller-provided pose, resolved flag, altered joint, guessed target or sampled table bypasses admission. All original callbacks/candidates, current Eulers, range values, fits, FK and scalar observations remain, including changing or unsupported key context.
 * @evidence contracts/development/implementation.md#efficient-algorithms Fixed name indexing and genuine ROM/exact FK prerequisites prepare once across Q trials. Every trial retains complete current nonlinear projection and actual demanded FK; no ineffective source snapshot, JSON comparison or private-proof copying is built for arbitrary changing keys, and speedup is unmeasured.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Only unchanged body/rig/profile demand and native static projection/dependency metadata share. Current clinical keys always resolve normally; no earlier joint projection, angle, height, floor verdict or FK answer is substituted.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous search owns bounded FK/name/ROM metadata and its body until return or throw. No source pose, candidate history, output or reader enters the returned action/key; current raw views and fresh maps retain no workspace.
 */
export function prepareWorkoutKeyFrames(
  body: IHumanBody,
  requested?: ReadonlySet<AutoMovieHumanoidBone>,
): (key: ExerciseKey.IKey) => {
  posture: IHumanPosture;
  bones: ReturnType<typeof poseBones>;
} {
  const resolution: ReturnType<typeof prepareHumanPoseResolution> =
    prepareHumanPoseResolution();
  const projection: ReturnType<typeof prepareHumanPostureProjection> =
    prepareHumanPostureProjection(body);
  const frames: ReturnType<typeof poseBones.prepare> | undefined =
    requested === undefined ? undefined : poseBones.prepare(body, requested);
  return (
    key: ExerciseKey.IKey,
  ): { posture: IHumanPosture; bones: ReturnType<typeof poseBones> } => {
    const posture: IHumanPosture = ExerciseKey.posed(key, 0);
    const pose: IAutoMoviePose = resolveHumanPosture.seeded(
      body,
      posture,
      undefined,
      undefined,
      resolution,
      undefined,
      projection,
    ).pose;
    return {
      posture,
      bones:
        frames === undefined
          ? poseBones(body, pose, resolution())
          : frames(pose, resolution()),
    };
  };
}
