import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanAquatic,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { prepareHumanShapeBlend } from "../handling/prepareHumanShapeBlend";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Pool and boat sequences use the same clinical keys and prepared joint blends
 * as existing exercise motion, with a trajectory or support chosen by the law.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes the key shape and ownership of support placement.
 * @evidence contracts/development/design.md#principled-representation Separates posed shape, measured body marker and world trajectory.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Shares only posture operations used by multiple aquatic planners.
 */
export namespace AquaticPosture {
  /** Bound inputs of an aquatic law. */
  export type Context = IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanAquatic.IParams>;

  /** Nominal shape of a pose at an explicit world root. */
  export function key(
    entry: IAutoMovieMotionHumanPosture,
    target: IAutoMovieMotionHumanExerciseKey.IKey,
    root: IAutoMovieVector3 = entry.root,
  ): IAutoMovieMotionHumanPosture {
    return {
      ...entry,
      root,
      yaw: entry.yaw + target.yaw,
      pitch: target.pitch,
      roll: target.roll,
      joints: target.joints,
      limbs: {},
      rotation: undefined,
    };
  }

  /** Prepare a posed transition; the caller may replace its root with a support trajectory. */
  export function blend(
    from: IAutoMovieMotionHumanPosture,
    to: IAutoMovieMotionHumanPosture,
  ): (share: number) => IAutoMovieMotionHumanPosture {
    const joints: ReturnType<typeof prepareHumanShapeBlend> = prepareHumanShapeBlend(from.joints, to.joints);
    return (share: number): IAutoMovieMotionHumanPosture => {
      const u: number = minimumJerk.share(Math.min(1, Math.max(0, share)));
      return {
        ...to,
        root: Vector3.lerp(from.root, to.root, u),
        yaw: from.yaw + (to.yaw - from.yaw) * u,
        pitch: from.pitch + (to.pitch - from.pitch) * u,
        roll: from.roll + (to.roll - from.roll) * u,
        joints: joints(u),
        rotation: from.rotation === undefined && to.rotation === undefined ? undefined : {
          about: Vector3.lerp(from.rotation?.about ?? from.root, to.rotation?.about ?? to.root, u),
          turn: Quaternion.slerp(from.rotation?.turn ?? Quaternion.identity(), to.rotation?.turn ?? Quaternion.identity(), u),
        },
      };
    };
  }

  /** Resolve a canonical bone centre in world metres. */
  export function marker(
    body: Context["body"],
    posture: IAutoMovieMotionHumanPosture,
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieVector3 {
    return poseBones(body, resolveHumanPosture(body, posture)).get(bone)!.worldPosition;
  }

  /** Heading-relative offset from the entry, with an independently chosen world height. */
  export function along(
    entry: IAutoMovieMotionHumanPosture,
    distance: number,
    height: number,
  ): IAutoMovieVector3 {
    return HumanFrame.point(
      { origin: { ...entry.root, y: height }, yaw: entry.yaw },
      { x: 0, y: 0, z: distance },
    );
  }
}
