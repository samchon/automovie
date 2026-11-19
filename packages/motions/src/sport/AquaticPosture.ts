import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanAquatic,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
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
  export type Context =
    IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanAquatic.IParams>;

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
    const joints: ReturnType<typeof prepareHumanShapeBlend> =
      prepareHumanShapeBlend(from.joints, to.joints);
    return (share: number): IAutoMovieMotionHumanPosture => {
      const u: number = minimumJerk.share(Math.min(1, Math.max(0, share)));
      return {
        ...to,
        root: Vector3.lerp(from.root, to.root, u),
        yaw: from.yaw + (to.yaw - from.yaw) * u,
        pitch: from.pitch + (to.pitch - from.pitch) * u,
        roll: from.roll + (to.roll - from.roll) * u,
        joints: joints(u),
        rotation:
          from.rotation === undefined && to.rotation === undefined
            ? undefined
            : {
                about: Vector3.lerp(
                  from.rotation?.about ?? from.root,
                  to.rotation?.about ?? to.root,
                  u,
                ),
                turn: Quaternion.slerp(
                  from.rotation?.turn ?? Quaternion.identity(),
                  to.rotation?.turn ?? Quaternion.identity(),
                  u,
                ),
              },
      };
    };
  }

  /**
   * Prepare one observation of a fixed set of canonical bones for changing
   * poses. The result contains the requested displayed centres in world metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the fixed demand and the displayed result.
   * @evidence contracts/development/implementation.md#principled-implementation Demands the same canonical joint constraints and limb fits used by the displayed pose.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Builds one set and one prepared FK reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The limb solver retains its documented prerequisites for requested bones.
   * @evidence contracts/development/implementation.md#efficient-algorithms Each observation projects only the requested FK paths and shares one canonical posture resolution across them.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The fixed body and bone demand are prepared once per producer.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only the prepared demand and its body. Each result belongs to the caller.
   */
  export function markers(
    body: Context["body"],
    bones: readonly AutoMovieHumanoidBone[],
  ): (
    posture: IAutoMovieMotionHumanPosture,
  ) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> {
    const requested: ReadonlySet<AutoMovieHumanoidBone> = new Set(bones);
    const read: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
      body,
      requested,
    );
    return (
      posture: IAutoMovieMotionHumanPosture,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      read(
        resolveHumanPosture.seeded(
          body,
          posture,
          undefined,
          {},
          undefined,
          requested,
        ).pose,
      );
  }

  /** Place the root at a world point and carry any world-space rotation pivot with it. */
  export function translate(
    posture: IAutoMovieMotionHumanPosture,
    root: IAutoMovieVector3,
  ): IAutoMovieMotionHumanPosture {
    return {
      ...posture,
      root,
      rotation:
        posture.rotation === undefined
          ? undefined
          : {
              ...posture.rotation,
              about: Vector3.add(
                posture.rotation.about,
                Vector3.subtract(root, posture.root),
              ),
            },
    };
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
