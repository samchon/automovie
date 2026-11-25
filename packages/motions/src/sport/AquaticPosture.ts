import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanAquatic,
  IAutoMovieMotionHumanArmAngles,
  IAutoMovieMotionHumanExerciseKey,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArm } from "../compose/AutoMovieMotionHumanArm";
import { HumanFrame } from "../posture/HumanFrame";
import { poseBones } from "../posture/poseBones";
import { prepareHumanShapeBlend } from "../posture/prepareHumanShapeBlend";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

/**
 * Pool and boat sequences use the same clinical keys and prepared joint blends
 * as existing exercise motion, with a trajectory or support chosen by the law.
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

  /**
   * Prepare a posed transition; the caller may replace its root with a support
   * trajectory.
   */
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
   * poses. The result contains the requested displayed centres in world
   * metres.
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

  /**
   * The arm a posture shows from its own joints, without the arm goals it
   * writes: where a coursed arm (`courseArmGoal`) starts when the law's own key
   * holds it at the course's start.
   */
  export function rest(
    body: Context["body"],
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
  ): IAutoMovieMotionHumanArmAngles.IAngles {
    const limbs: IAutoMovieMotionHumanPosture["limbs"] = { ...posture.limbs };
    delete limbs.leftArm;
    delete limbs.rightArm;
    return AutoMovieMotionHumanArm.angles(
      resolveHumanPosture(body, { ...posture, limbs }),
      side,
    );
  }
  /**
   * Place the root at a world point and carry any world-space rotation pivot
   * with it.
   */
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

  /**
   * Heading-relative offset from the entry, with an independently chosen world
   * height.
   */
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
