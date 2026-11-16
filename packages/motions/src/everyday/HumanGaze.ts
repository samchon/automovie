import {
  type IAutoMovieResolvedBone,
  Quaternion,
  Vector3,
  gazeChainJoints,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanLayer } from "../law/IHumanLayer";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import type { HumanGazeTypes } from "./HumanGazeTypes";
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
 * @evidence contracts/development/design.md#principled-representation Authored targets/times and clinical-degree shares remain separate from world-target evaluation, using the existing body/posture records and engine FK.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The split, timing, direction, aim and layer operations serve look, bend and gaze composition; existing public interfaces inherit their shared field owner.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses existing body, posture, target and bone types without another rig or pose representation; operation-local FK sharing changes no gaze recruitment or timing policy.
 */
export namespace HumanGaze {
  /**
   * Which segments a gaze may recruit.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the existing recruitment choice and its shared type owner.
   * @evidence contracts/development/design.md#principled-representation Preserves the same closed anatomical choice through HumanGazeTypes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Existing law and layer consumers keep the same HumanGaze.Recruit name.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An alias adds no alternative, validation or representation.
   */
  export type Recruit = HumanGazeTypes.Recruit;

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

  /**
   * Clinical-degree shares of one gaze direction.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the shares whose fields and signs are documented by HumanGazeTypes.
   * @evidence contracts/development/design.md#principled-representation Preserves the existing eye/head/trunk share record.
   * @evidence contracts/development/design.md#minimal-and-owned-surface split, aim and layer retain their same augmentable public ISplit interface.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No extra data, proxy or alternate unit convention is added.
   */
  export interface ISplit extends HumanGazeTypes.ISplit {}

  /**
   * Split a gaze direction over the eyes, the head and the trunk.
   *
   * @param yaw Direction from the trunk's facing, degrees, positive to the performer's left.
   * @param pitch Direction from level, degrees, positive down.
   * @param recruit Which segments may join; `auto` is `trunk`.
   * @returns The split.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States yaw/pitch degree signs, recruitment and the returned anatomical shares.
   * @evidence contracts/development/implementation.md#principled-implementation The existing ordered eye/cervical/trunk allocation limits each recruited share, leaving the remaining direction to the eyes.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar share rule is applied to yaw and pitch, followed by optional trunk yaw.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Keeps the documented provisional HEAD/TRUNK limits and auto policy; finite directions remain caller inputs, with no new clamp or validation.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed scalar work creates one share record and its two angular pairs.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This single-direction calculation coordinates no work across calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh shares and retains no input or handle.
   */
  export function split(
    yaw: number,
    pitch: number,
    recruit: Recruit = "auto",
  ): ISplit {
    const share: (
      total: number,
      first: number,
      positive: number,
      negative: number,
    ) => [number, number] = (
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
    const [eyeYaw, headYaw]: [number, number] = share(yaw, EYES, HEAD.yaw, HEAD.yaw);
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States amplitude degrees, returned seconds and the existing main-sequence source.
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates the documented amplitude-duration formula in milliseconds and converts it to seconds.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One absolute amplitude and affine expression own this duration.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves the named formula and its sign symmetry, without new fitted coefficients or finite-input repair.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fixed arithmetic with no traversal or algorithm choice.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One stateless quantity, with no related calls to coordinate.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a scalar and retains nothing.
   */
  export function saccade(amplitude: number): number {
    return (2.2 * Math.abs(amplitude) + 21) / 1000;
  }

  /**
   * Seconds of a head or trunk turn of an amplitude (provisional).
   *
   * @param amplitude Degrees.
   * @returns Seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States amplitude degrees, returned seconds and the provisional duration policy.
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates the existing affine duration on absolute turn amplitude.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scalar expression owns head/trunk timing.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The provisional coefficients remain unchanged and no input repair or new physiological claim is made.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Fixed scalar arithmetic.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work No shared preparation is needed for one quantity.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a scalar and retains no state.
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
   * @param resolution Optional exact FK reader or lazy supplier borrowed from this synchronous evaluation.
   * @returns Yaw (positive left) and pitch (positive down), degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States world target, hips-relative signed angles and optional synchronous borrowed FK workspace.
   * @evidence contracts/development/implementation.md#principled-implementation Reads the actual eyes' midpoint and inverse hips frame, then the unchanged atan2 direction angles.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One trunk FK feeds one eye midpoint and world-to-hips direction.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every authored joint receives the same FK admission; only the hips and eyes and their required ancestors are transformed, without a target proxy, cached pose or changed angle convention.
   * @evidence contracts/development/implementation.md#efficient-algorithms Ordered joint admission and hips/eye ancestor FK precede fixed vector/angle work; unrelated limbs are not transformed and a supplied reader shares exactly unchanged math with fresh output ownership. Speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Forwards only an explicit parent's exact FK workspace through HumanTrunk; target subtraction and returned angles are computed for this call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no map, target or borrowed workspace; the caller owns the angle record and the parent releases its reader with the evaluation.
   */
  export function direction(
    body: IHumanBody,
    posture: IHumanPosture,
    point: IAutoMovieVector3,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): { yaw: number; pitch: number } {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(body, posture, undefined, resolution, DIRECTION);
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
   * @param resolution Optional exact workspace borrowed only within this synchronous gaze evaluation.
   * @param towards Direction already computed from these exact body, posture and point inputs; computed here when absent.
   * @returns The posture with the trunk, neck, head and eyes set; limb goals unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States recruitment, weight premises, unchanged limb goals and synchronous reader lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Recruited head/trunk motion keeps its direction shares, zero-head correction and range-aware cervical split; eyes-only motion leaves those joints unchanged. Every eye still uses its actual current-head direction and unchanged clinical limits.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Cervical recruitment owns direction and zeroed-head preparation; all recruitment modes share the final actual-head eye solve and one lazy exact FK reader.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every necessary FK still admits all authored joints and every recruited segment keeps its original numerical solve and limit. Eyes-only avoids the unused cervical solve rather than changing an eye target; supplied directions require identical inputs and weights in [0,1] remain a caller premise.
   * @evidence contracts/development/implementation.md#efficient-algorithms Eyes-only needs one demanded head/eye FK; cervical recruitment adds a zeroed-head FK and either a supplied parent direction or one hips/eye FK. Ordered joint admission, recruited cervical solving and eye solving remain, while unused transforms and an unused cervical solve are avoided; speedup is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Owns or borrows one exact reader within this invocation and may consume the parent's already-computed direction for identical inputs; changed trunk/head scalars invalidate their frames. Head-angle radians and pitch cosine are shared across components, without retaining a target, weight, posture result or time sample.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The local getter/reader and temporary maps end with return or throw. The caller owns the new posture/joints; no reader enters returned fields, body memory or a retained layer.
   */
  export function aim(
    body: IHumanBody,
    posture: IHumanPosture,
    point: IAutoMovieVector3,
    recruit: Recruit,
    weights: { eyes: number; head: number; trunk: number },
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    towards?: { yaw: number; pitch: number },
  ): IHumanPosture {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const facingTarget: { yaw: number; pitch: number } | undefined =
      recruit === "eyes" ? undefined : (towards ?? direction(body, posture, point, read));
    const parts: ISplit | undefined = facingTarget === undefined
      ? undefined : split(facingTarget.yaw, facingTarget.pitch, recruit);
    const joints: IHumanPosture["joints"] = { ...posture.joints };
    const blend: (
      bone: AutoMovieHumanoidBone,
      target: readonly [number, number, number],
      weight: number,
    ) => void = (
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
    const add: (bone: AutoMovieHumanoidBone, twist: number) => void = (
      bone: AutoMovieHumanoidBone,
      twist: number,
    ): void => {
      const base: readonly [number, number, number] = joints[bone] ?? [0, 0, 0];
      joints[bone] = [base[0], base[1], base[2] + twist];
    };

    // Trunk: twist added to whatever the action holds, chest 60 %, spine 40 %.
    add("chest", 0.6 * (parts?.trunk ?? 0) * weights.trunk);
    add("spine", 0.4 * (parts?.trunk ?? 0) * weights.trunk);

    // Head and neck: the engine's range-aware split of one aim. The split
    // turns the head from where the neck and the head hold it at zero
    // angles, and a body's head at zero need not face where its pelvis
    // does (a carried head is pitched at rest and its standing posture
    // levels it). So the aim is given less what the head faces at zero, and
    // the head ends on its share of the target whatever the body's rest.
    if (parts !== undefined) {
      const zeroed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
        HumanTrunk.resolve(
          body,
          posture,
          {
            ...joints,
            neck: [0, 0, 0],
            head: [0, 0, 0],
          },
          read,
          HEAD_FRAME,
        );

      // Read the cervical share in the frame the head has at zero angles.
      const headFrame: IAutoMovieQuaternion = Quaternion.inverse(
        Quaternion.multiply(
          Quaternion.inverse(zeroed.get("hips")!.worldRotation),
          zeroed.get("head")!.worldRotation,
        ),
      );
      const headPitch: number = (parts.head.pitch * Math.PI) / 180;
      const headYaw: number = (parts.head.yaw * Math.PI) / 180;
      const cosine: number = Math.cos(headPitch);
      const facing: IAutoMovieVector3 = Quaternion.rotateVector(
        headFrame,
        {
          x: cosine * Math.sin(headYaw),
          y: -Math.sin(headPitch),
          z: cosine * Math.cos(headYaw),
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
      blend("neck", [neck?.flexion ?? 0, 0, neck?.twist ?? 0], weights.head);
      blend("head", [head.flexion ?? 0, 0, head.twist ?? 0], weights.head);
    }

    // Eyes: each solved exactly in its head's frame, clamped to its range.
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      HumanTrunk.resolve(body, posture, joints, read, EYE_FRAME);
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

  /**
   * An authored gaze-layer request.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the existing target/time/recruitment record and its omission policies.
   * @evidence contracts/development/design.md#principled-representation Preserves the same authored-intention record through HumanGazeTypes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The existing layer API and law callers retain HumanGaze.ILayer.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The inheriting interface preserves declaration merging and adds no validation, timing field, cached pose or target representation.
   */
  export interface ILayer extends HumanGazeTypes.ILayer {}

  /**
   * A gaze layer: from `from` the eyes, head and trunk turn toward the
   * target on their own timings and track it; from `to` they return.
   *
   * @param requests The gazes, in time order; each one's `from` after the previous one's `from`.
   * @param name The layer's name; `gaze` when absent.
   * @returns The layer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States request order, onset/return tracking and returned layer; requests remain borrowed by that layer.
   * @evidence contracts/development/implementation.md#principled-implementation Selects the last eligible request in declared order, resolves its current target, and evaluates the same independent saccade/head/trunk timing before actual gaze aiming.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Layer construction declares channels; each apply owns binary request selection, one target call, scalar timings and one synchronous gaze workspace.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Preserves request order, context.aim calls, weights and timing coefficients, without reusing an earlier target or posed face across changed stages or instants.
   * @evidence contracts/development/implementation.md#efficient-algorithms Construction scans R ordered requests for channels; each apply selects the last eligible request in O(log R), then performs two demanded trunk readings for eyes-only or three with cervical recruitment. Every target, timing and recruited numerical aim still executes, with no measured speedup claim.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work This apply computes its actual direction once and lends it and its exact FK workspace to aim with identical body/posture/point inputs; target callback, timing and changed clinical frames still execute normally.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned layer retains its existing request array/name and channels. Its reader/getter is created only inside an active apply and ends with that call; no sampled target, FK map or workspace is retained across time.
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
        let low: number = 0;
        let high: number = requests.length;
        while (low < high) {
          const middle: number = (low + high) >>> 1;
          if (requests[middle]!.from <= seconds) low = middle + 1;
          else high = middle;
        }
        const active: ILayer | undefined = requests[low - 1];
        if (active === undefined) return posture;
        const point: IAutoMovieVector3 = context.aim(
          active.target,
          seconds,
        ).point;
        const resolution: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution();
        const towards: { yaw: number; pitch: number } = direction(
          context.body,
          posture,
          point,
          resolution,
        );
        const amplitude: number = Math.hypot(towards.yaw, towards.pitch);
        const parts: ISplit = split(
          towards.yaw,
          towards.pitch,
          active.with ?? "auto",
        );
        const going: (duration: number) => number = (duration: number): number => {
          const on: number = minimumJerk.share((seconds - active!.from) / duration);
          const off: number =
            active!.to === undefined
              ? 0
              : minimumJerk.share((seconds - active!.to) / duration);
          return on * (1 - off);
        };
        return aim(
          context.body,
          posture,
          point,
          active.with ?? "auto",
          {
            eyes: going(saccade(Math.min(amplitude, 2 * EYES))),
            head: going(turn(Math.hypot(parts.head.yaw, parts.head.pitch))),
            trunk: going(turn(parts.trunk)),
          },
          resolution,
          towards,
        );
      },
    };
  }
}

/** Eye-midpoint direction needs the hips frame and both eye positions. */
const DIRECTION: ReadonlySet<AutoMovieHumanoidBone> = new Set(["hips", "leftEye", "rightEye"]);

/** Cervical rest correction reads only the hips and head world frames. */
const HEAD_FRAME: ReadonlySet<AutoMovieHumanoidBone> = new Set(["hips", "head"]);

/** Eye aiming reads the head frame and the two eye positions it carries. */
const EYE_FRAME: ReadonlySet<AutoMovieHumanoidBone> = new Set(["head", "leftEye", "rightEye"]);
