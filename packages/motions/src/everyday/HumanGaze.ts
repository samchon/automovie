import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  gazeChainJoints,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanLayer } from "../law/IHumanLayer";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { HumanTrunk } from "./HumanTrunk";

/**
 * Gaze as a goal: the eyes' lines brought onto a target, with the eyes, the
 * head and neck and the trunk recruited in that order as the target lies
 * farther from where the body faces.
 *
 * Gaze shifts recruit the eyes first and the head only beyond a threshold:
 * Freedman (2008, Exp Brain Res 190:369) reviews head-unrestrained gaze
 * shifts in which the head contributes little below about 15 to 20 degrees
 * and an increasing share beyond; Hollands, Ziavra and Bronstein (2004, Exp
 * Brain Res 154:261) find that large turns recruit the eyes, head, trunk and
 * feet in that order. The split here keeps the final eye-in-head eccentricity
 * at most `EYES` (15 degrees) on each axis, gives the head and neck the
 * remainder up to `HEAD` (provisional comfortable cervical share: 60 degrees
 * of yaw, 40 down and 30 up, inside `DEFAULT_HUMANOID_ROM`), and, when the
 * trunk may join, gives the chest and lumbar spine the yaw beyond that up to
 * `TRUNK` (40 degrees, provisional, inside their combined twist range), 60 %
 * to the chest and 40 % to the spine. What none of these can hold stays on
 * the eyes, clamped to their range, so a gaze too far behind the body is
 * visibly short; turning the feet is the `look` action's step-turn.
 *
 * The head and neck angles come from the engine's `gazeChainJoints`, which
 * splits one aim over the neck and the head inside their ranges; the eyes are
 * then solved exactly: each eye's direction to the target is read in its
 * head's frame by forward kinematics of the trunk and head, and turned into
 * the eye's twist (yaw) and flexion (pitch), which compose as twist then
 * flexion in the default joint basis (`jointToQuaternion`), so the eye's
 * forward meets the target exactly within the eye's range.
 *
 * Timing: the eyes move on the saccadic main sequence, duration `2.2 A + 21`
 * milliseconds for an amplitude of `A` degrees (Bahill, Clark and Stark 1975,
 * Math Biosci 24:191; Carpenter 1988), and the head and trunk on a
 * minimum-jerk profile of `0.15 + 0.004 A` seconds (provisional: head
 * movements are slower than saccades and lengthen with amplitude, Zangemeister
 * and Stark 1981; the coefficients are unmeasured). Because the eyes are
 * re-solved against the moving head on every frame, they hold the target
 * while the head catches up, as the vestibulo-ocular reflex does, and a moving
 * target is pursued.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the law, its sources, its units and frames, and which values are provisional.
 * @evidence contracts/development/design.md#principled-representation Pure functions and constants over the interface's vectors and the engine's streams.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The functions and constants the everyday laws and their tests read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses engine and interface types; no consumer is special-cased.
 * @evidence contracts/development/implementation.md#principled-implementation Closed-form evaluation of the cited law.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One small function per quantity.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Out-of-range inputs throw; provisional constants are named and marked.
 * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per call, or linear in the requests a call builds.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Pure functions of their inputs.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace HumanGaze {
  /** Which segments a gaze may recruit. */
  export type Recruit = "auto" | "eyes" | "head" | "trunk";

  /** Final eye-in-head eccentricity before the head joins, degrees (Freedman 2008). */
  export const EYES: number = 15;

  /** The head and neck's comfortable share, degrees (provisional). */
  export const HEAD: Readonly<{ yaw: number; down: number; up: number }> = {
    yaw: 60,
    down: 40,
    up: 30,
  };

  /** The trunk's share of yaw, degrees (provisional). */
  export const TRUNK: number = 40;

  /** A split of one gaze direction, degrees: yaw positive toward the performer's left, pitch positive down. */
  export interface ISplit {
    /** Eye-in-head direction at the end of the shift. */
    eyes: { yaw: number; pitch: number };

    /** Head and neck. */
    head: { yaw: number; pitch: number };

    /** Trunk yaw. */
    trunk: number;
  }

  /**
   * Split a gaze direction over the eyes, the head and the trunk.
   *
   * @param yaw Direction from the trunk's facing, degrees, positive to the performer's left.
   * @param pitch Direction from level, degrees, positive down.
   * @param recruit Which segments may join; `auto` is `trunk`.
   * @returns The split.
   */
  export function split(
    yaw: number,
    pitch: number,
    recruit: Recruit = "auto",
  ): ISplit {
    const share = (
      total: number,
      first: number,
      limitPositive: number,
      limitNegative: number,
    ): [number, number] => {
      const lead: number = Math.sign(total) * Math.min(Math.abs(total), first);
      const rest: number = total - lead;
      const next: number =
        rest >= 0
          ? Math.min(rest, limitPositive)
          : Math.max(rest, -limitNegative);
      return [lead, next];
    };
    if (recruit === "eyes")
      return { eyes: { yaw, pitch }, head: { yaw: 0, pitch: 0 }, trunk: 0 };
    const [eyeYaw, headYaw] = share(yaw, EYES, HEAD.yaw, HEAD.yaw);
    const headPitch: number = share(pitch, EYES, HEAD.down, HEAD.up)[1];
    const beyond: number = yaw - eyeYaw - headYaw;
    const trunk: number =
      recruit === "head"
        ? 0
        : Math.sign(beyond) * Math.min(Math.abs(beyond), TRUNK);
    return {
      eyes: { yaw: yaw - headYaw - trunk, pitch: pitch - headPitch },
      head: { yaw: headYaw, pitch: headPitch },
      trunk,
    };
  }

  /**
   * Seconds of a saccade of an amplitude (the main sequence, Bahill et al. 1975).
   *
   * @param amplitude Degrees.
   * @returns Seconds.
   */
  export function saccade(amplitude: number): number {
    return (2.2 * Math.abs(amplitude) + 21) / 1000;
  }

  /**
   * Seconds of a head or trunk turn of an amplitude (provisional).
   *
   * @param amplitude Degrees.
   * @returns Seconds.
   */
  export function turn(amplitude: number): number {
    return 0.15 + 0.004 * Math.abs(amplitude);
  }

  /**
   * The direction of a world point from the eyes' midpoint, as yaw and
   * pitch about the posture's hips frame.
   *
   * @param body The body.
   * @param posture The posture, without gaze.
   * @param point The world point.
   * @returns Yaw (positive left) and pitch (positive down), degrees.
   */
  export function direction(
    body: IHumanBody,
    posture: IHumanPosture,
    point: IAutoMovieVector3,
  ): { yaw: number; pitch: number } {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(body, posture);
    const eyes: IAutoMovieVector3 = Vector3.scale(
      Vector3.add(
        bones.get("leftEye")!.worldPosition,
        bones.get("rightEye")!.worldPosition,
      ),
      0.5,
    );
    const hips: IAutoMovieQuaternion = bones.get("hips")!.worldRotation;
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(hips),
      Vector3.subtract(point, eyes),
    );
    return {
      yaw: (Math.atan2(local.x, local.z) * 180) / Math.PI,
      pitch:
        (Math.atan2(-local.y, Math.hypot(local.x, local.z)) * 180) / Math.PI,
    };
  }

  /**
   * The posture with its gaze on a point: trunk and head blended toward
   * their shares by `weights`, then each eye solved exactly against the head
   * it rides and blended by its own weight.
   *
   * @param body The body.
   * @param posture The posture without gaze.
   * @param point The world point.
   * @param recruit Which segments may join.
   * @param weights How far each part has moved toward its share, each in [0, 1].
   * @returns The posture with the trunk, neck, head and eyes set; limb goals unchanged.
   */
  export function aim(
    body: IHumanBody,
    posture: IHumanPosture,
    point: IAutoMovieVector3,
    recruit: Recruit,
    weights: { eyes: number; head: number; trunk: number },
  ): IHumanPosture {
    const towards: { yaw: number; pitch: number } = direction(
      body,
      posture,
      point,
    );
    const parts: ISplit = split(towards.yaw, towards.pitch, recruit);
    const joints: IHumanPosture["joints"] = { ...posture.joints };
    const blend = (
      bone: AutoMovieHumanoidBone,
      target: readonly [number, number, number],
      w: number,
    ): void => {
      const base: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
      joints[bone] = [
        base[0] + (target[0] - base[0]) * w,
        base[1] + (target[1] - base[1]) * w,
        base[2] + (target[2] - base[2]) * w,
      ];
    };
    const add = (bone: AutoMovieHumanoidBone, twist: number): void => {
      const base: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
      joints[bone] = [base[0], base[1], base[2] + twist];
    };

    // Trunk: twist added to whatever the action holds, chest 60 %, spine 40 %.
    add("chest", 0.6 * parts.trunk * weights.trunk);
    add("spine", 0.4 * parts.trunk * weights.trunk);

    // Head and neck: the engine's range-aware split of one aim. The split
    // turns the head from where the neck and the head hold it at zero
    // angles, and a body's head at zero need not face where its pelvis
    // does (a carried head is pitched at rest and its standing posture
    // levels it). So the aim is given less what the head faces at zero, and
    // the head ends on its share of the target whatever the body's rest.
    const zeroed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(body, posture, {
        ...joints,
        neck: [0, 0, 0],
        head: [0, 0, 0],
      });
    const radians = (degrees: number): number => (degrees * Math.PI) / 180;

    // The head's share as a direction in the pelvis' frame, then read in
    // the frame the head has at zero angles, where the split turns it from.
    const facing: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(
        Quaternion.multiply(
          Quaternion.inverse(zeroed.get("hips")!.worldRotation),
          zeroed.get("head")!.worldRotation,
        ),
      ),
      {
        x: Math.cos(radians(parts.head.pitch)) * Math.sin(radians(parts.head.yaw)),
        y: -Math.sin(radians(parts.head.pitch)),
        z: Math.cos(radians(parts.head.pitch)) * Math.cos(radians(parts.head.yaw)),
      },
    );
    const chain: IAutoMovieJointPose[] = gazeChainJoints({
      rig: body.skeleton,
      flexionDeg:
        (Math.atan2(-facing.y, Math.hypot(facing.x, facing.z)) * 180) / Math.PI,
      twistDeg: (Math.atan2(facing.x, facing.z) * 180) / Math.PI,
    });
    const neck: IAutoMovieJointPose | undefined = chain.find(
      (j: IAutoMovieJointPose): boolean => j.bone === "neck",
    );
    const head: IAutoMovieJointPose = chain.find(
      (j: IAutoMovieJointPose): boolean => j.bone === "head",
    )!;

    // Eyes that look alone leave the neck and the head as the posture has
    // them: nothing of the head is the gaze's to write then.
    if (recruit !== "eyes") {
      blend("neck", [neck?.flexion ?? 0, 0, neck?.twist ?? 0], weights.head);
      blend("head", [head.flexion ?? 0, 0, head.twist ?? 0], weights.head);
    }

    // Eyes: each solved exactly in its head's frame, clamped to its range.
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(body, posture, joints);
    const headRotation: IAutoMovieQuaternion = Quaternion.inverse(
      bones.get("head")!.worldRotation,
    );
    for (const eye of ["leftEye", "rightEye"] as const) {
      const d: IAutoMovieVector3 = Vector3.normalize(
        Quaternion.rotateVector(
          headRotation,
          Vector3.subtract(point, bones.get(eye)!.worldPosition),
        ),
      );
      const yaw: number = Math.max(
        -45,
        Math.min(45, (Math.atan2(d.x, d.z) * 180) / Math.PI),
      );
      const pitch: number = Math.max(
        -30,
        Math.min(
          30,
          (Math.asin(Math.max(-1, Math.min(1, -d.y))) * 180) / Math.PI,
        ),
      );
      blend(eye, [pitch, 0, yaw], weights.eyes);
    }
    return { ...posture, joints };
  }

  /** A gaze layer's request. */
  export interface ILayer {
    /** What to look at. */
    target: AutoMovieMotionTarget;

    /** Film second the gaze shift starts. */
    from: number;

    /** Film second the gaze returns to the body's own direction; never when absent. */
    to?: number;

    /** Which segments may join; `auto` when absent. */
    with?: Recruit;
  }

  /**
   * A gaze layer: from `from` the eyes, head and trunk turn toward the
   * target on their own timings and track it; from `to` they return.
   *
   * @param requests The gazes, in time order; each one's `from` after the previous one's `from`.
   * @param name The layer's name; `gaze` when absent.
   * @returns The layer.
   */
  export function layer(
    requests: readonly ILayer[],
    name: string = "gaze",
  ): IHumanLayer {
    return {
      name,

      // The eyes, the neck and the head, and the chest and lumbar spine
      // unless every gaze keeps the trunk out of the turn.
      channels: requests.every(
        (request: ILayer): boolean =>
          request.with === "eyes" || request.with === "head",
      )
        ? ["head"]
        : ["head", "trunk"],
      apply: (
        posture: IHumanPosture,
        seconds: number,
        context: IHumanLayer.IContext,
      ): IHumanPosture => {
        let active: ILayer | undefined;
        for (const r of requests) if (r.from <= seconds) active = r;
        if (active === undefined) return posture;
        const point: IAutoMovieVector3 = context.aim(
          active.target,
          seconds,
        ).point;
        const towards: { yaw: number; pitch: number } = direction(
          context.body,
          posture,
          point,
        );
        const amplitude: number = Math.hypot(towards.yaw, towards.pitch);
        const parts: ISplit = split(
          towards.yaw,
          towards.pitch,
          active.with ?? "auto",
        );
        const going = (duration: number): number => {
          const on: number = minimumJerk((seconds - active!.from) / duration).s;
          const off: number =
            active!.to === undefined
              ? 0
              : minimumJerk((seconds - active!.to) / duration).s;
          return on * (1 - off);
        };
        return aim(context.body, posture, point, active.with ?? "auto", {
          eyes: going(saccade(Math.min(amplitude, 2 * EYES))),
          head: going(turn(Math.hypot(parts.head.yaw, parts.head.pitch))),
          trunk: going(turn(parts.trunk)),
        });
      },
    };
  }
}
