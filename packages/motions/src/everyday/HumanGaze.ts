import {
  DEFAULT_HUMANOID_ROM,
  Quaternion,
  Vector3,
  gazeChainJoints,
  minimumJerk,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointConstraint,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGaze,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { blendGazeJoint } from "./blendGazeJoint";
import { readHumanGazeBones } from "./readHumanGazeBones";

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
    recruit: IAutoMovieMotionHumanGaze.Recruit = "auto",
  ): IAutoMovieMotionHumanGaze.ISplit {
    if (recruit === "eyes")
      return { eyes: { yaw, pitch }, head: { yaw: 0, pitch: 0 }, trunk: 0 };
    const [eyeYaw, headYaw]: [number, number] = splitShare(yaw, EYES, HEAD.yaw, HEAD.yaw);
    const headPitch: number = splitShare(pitch, EYES, HEAD.down, HEAD.up)[1];
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
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses one genuine immutable body/name-demand reader and forwards only an explicit parent's exact FK workspace; every current authored joint/root, target subtraction and returned angle is evaluated for this call.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains no map, target or borrowed workspace; the caller owns the angle record and the parent releases its reader with the evaluation.
   */
  export function direction(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    point: IAutoMovieVector3,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
  ): IAutoMovieMotionHumanGaze.IDirectionResult {
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      readHumanGazeBones(body, posture, "direction", undefined, resolution);
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
   * @evidence contracts/development/common.md#meaningful-documentation States recruitment, the weights' range, the unchanged limb goals and the borrowed workspace's lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation The direction is split by `split`; the trunk's twist is added, the cervical aim is read in the frame the head has at zero angles and split over the neck and head by the engine's range-aware `gazeChainJoints`, and the head and neck blend toward it by their weight (toward zero for eyes-only recruitment). Each eye is then solved against the head it rides and clamped to its range in `DEFAULT_HUMANOID_ROM`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Direction, zeroed-head correction and eye solving run in that order for every mode, sharing one FK workspace and the joint writers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The eye limits are the range table's; a supplied direction must come from the same body, posture and point, and weights in [0, 1] are the caller's premise.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two trunk readings demanding the zeroed head and the head and eyes, plus one for the direction unless the caller supplies it; the cervical split binds the rig's neck and head once per call, two bone searches.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Owns or borrows one FK workspace for the call and may take the caller's direction for the same inputs; changed trunk or head angles change the frames read.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The workspace and maps end with the call, and the returned posture holds no loan; nothing is retained.
   */
  export function aim(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    point: IAutoMovieVector3,
    recruit: IAutoMovieMotionHumanGaze.Recruit,
    weights: IAutoMovieMotionHumanGaze.IAimWeights,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    towards?: { yaw: number; pitch: number },
  ): IAutoMovieMotionHumanPosture {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const facingTarget: { yaw: number; pitch: number } =
      towards ?? direction(body, posture, point, read);
    const parts: IAutoMovieMotionHumanGaze.ISplit = split(facingTarget.yaw, facingTarget.pitch, recruit);
    const joints: IAutoMovieMotionHumanPosture["joints"] = { ...posture.joints };

    // Trunk: twist added to whatever the action holds, chest 60 %, spine 40 %.
    addGazeTwist(joints, "chest", 0.6 * parts.trunk * weights.trunk);
    addGazeTwist(joints, "spine", 0.4 * parts.trunk * weights.trunk);

    // Head and neck: the engine's range-aware split of one aim. The split
    // turns the head from where the neck and the head hold it at zero
    // angles, and a body's head at zero need not face where its pelvis
    // does (a carried head is pitched at rest and its standing posture
    // levels it). So the aim is given less what the head faces at zero, and
    // the head ends on its share of the target whatever the body's rest.
    const zeroed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      readHumanGazeBones(
        body,
        posture,
        "head",
        {
          ...joints,
          neck: [0, 0, 0],
          head: [0, 0, 0],
        },
        read,
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
    const chain: IAutoMovieJointPose[] = gazeChainJoints.prepare(body.skeleton)(
      (Math.atan2(-facing.y, Math.hypot(facing.x, facing.z)) * 180) / Math.PI,
      (Math.atan2(facing.x, facing.z) * 180) / Math.PI,
    );
    let neck: IAutoMovieJointPose | undefined;
    let head: IAutoMovieJointPose | undefined;
    for (const joint of chain) {
      if (joint.bone === "neck" && neck === undefined) neck = joint;
      if (joint.bone === "head" && head === undefined) head = joint;
    }
    blendGazeJoint(joints, "neck", neck?.flexion ?? 0, 0, neck?.twist ?? 0, weights.head);
    blendGazeJoint(joints, "head", head!.flexion ?? 0, 0, head!.twist ?? 0, weights.head);

    // Eyes: each solved exactly in its head's frame, clamped to its range in
    // the range table (`DEFAULT_HUMANOID_ROM`: its twist is the yaw, its
    // flexion the pitch).
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      readHumanGazeBones(body, posture, "eyes", joints, read);
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
      const range: IAutoMovieJointConstraint = DEFAULT_HUMANOID_ROM[eye]!;
      const yaw: number = Math.max(
        range.twist!.min,
        Math.min(range.twist!.max, (Math.atan2(d.x, d.z) * 180) / Math.PI),
      );
      const pitch: number = Math.max(
        range.flexion!.min,
        Math.min(
          range.flexion!.max,
          (Math.asin(Math.max(-1, Math.min(1, -d.y))) * 180) / Math.PI,
        ),
      );
      blendGazeJoint(joints, eye, pitch, 0, yaw, weights.eyes);
    }
    return { ...posture, joints };
  }

  /**
   * A gaze layer: from `from` the eyes, head and trunk turn toward the
   * target on their own timings and track it; from `to` they return. A
   * request that begins while an earlier one still holds the gaze turns the
   * parts on from where that one has them, so the gaze moves from target to
   * target without passing through rest.
   *
   * @param requests The gazes, in time order; each one's `from` after the previous one's `from`.
   * @param name The layer's name; `gaze` when absent.
   * @returns The layer.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States request order, onset, return, the hand-over between requests and the returned layer; the layer holds the requests.
   * @evidence contracts/development/implementation.md#principled-implementation The latest request that has begun is aimed over every earlier one still showing, each part's weight its own onset and return times the later requests' remaining share of that part, so at a request's start the posture is the earlier gaze's and it then turns on the saccade's and the head and trunk turns' timings; a request whose return is over shows nothing.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Construction declares channels; each apply selects the showing requests, reads each target and its timings once, and aims them in order through `aim`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `LONGEST` bounds every part's turn from the documented timing laws and shares, so the requests it drops show nothing; no target or posture is reused across instants.
   * @evidence contracts/development/implementation.md#efficient-algorithms Construction scans the R requests for channels; each apply finds the latest begun request in O(log R) and aims it, three trunk readings, plus one more aim per earlier request during the `LONGEST` after a later one begins; a finished request costs nothing.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The first stage's direction, read once for its timings, is lent to its aim; each stage borrows one local or host-supplied FK workspace.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The layer holds its requests, name and channels only; each apply's workspace and stages end with it.
   */
  export function layer(
    requests: readonly IAutoMovieMotionHumanGaze.ILayer[],
    name: string = "gaze",
  ): IAutoMovieMotionHumanLayer {
    return {
      name,

      // The eyes, the neck and the head, and the chest and lumbar spine
      // unless every gaze keeps the trunk out of the turn.
      channels: requests.every(
        (request: IAutoMovieMotionHumanGaze.ILayer): boolean =>
          request.with === "eyes" || request.with === "head",
      )
        ? ["head"]
        : ["head", "trunk"],
      apply: (
        posture: IAutoMovieMotionHumanPosture,
        seconds: number,
        context: IAutoMovieMotionHumanLayer.IContext,
      ): IAutoMovieMotionHumanPosture => {
        let low: number = 0;
        let high: number = requests.length;
        while (low < high) {
          const middle: number = (low + high) >>> 1;
          if (requests[middle]!.from <= seconds) low = middle + 1;
          else high = middle;
        }
        const last: number = low - 1;
        if (last < 0) return posture;

        // The requests still showing: the latest, and each earlier one while
        // the one after it may not yet have finished turning onto its own
        // target, so a new gaze starts from where the last one has the eyes,
        // head and trunk instead of from rest. A request whose return is
        // over shows nothing.
        let first: number = last;
        while (first > 0 && seconds - requests[first]!.from < LONGEST) first--;
        const resolution: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution(context.resolution);
        const stages: IStage[] = [];
        for (let k: number = first; k <= last; k++) {
          const request: IAutoMovieMotionHumanGaze.ILayer = requests[k]!;
          if (request.to !== undefined && seconds - request.to >= LONGEST) continue;
          const point: IAutoMovieVector3 = context.aim(request.target, seconds).point;
          const towards: { yaw: number; pitch: number } = direction(
            context.body,
            posture,
            point,
            resolution,
          );
          const amplitude: number = Math.hypot(towards.yaw, towards.pitch);
          const parts: IAutoMovieMotionHumanGaze.ISplit = split(
            towards.yaw,
            towards.pitch,
            request.with ?? "auto",
          );
          const durations: Record<GazePart, number> = {
            eyes: saccade(Math.min(amplitude, SACCADE_MOST)),
            head: turn(Math.hypot(parts.head.yaw, parts.head.pitch)),
            trunk: turn(parts.trunk),
          };
          stages.push({ request, point, towards, durations });
        }
        if (stages.length === 0) return posture;

        // Each stage is aimed over the one before, its weights faded by every
        // later stage's onset, so the later gaze takes over part by part on
        // its own timing.
        let out: IAutoMovieMotionHumanPosture = posture;
        stages.forEach((stage: IStage, index: number): void => {
          const weight: (part: GazePart) => number = (part: GazePart): number => {
            let w: number = gazeWeight(seconds, stage.request, stage.durations[part]);
            for (const later of stages.slice(index + 1))
              w *= 1 - minimumJerk.share((seconds - later.request.from) / later.durations[part]);
            return w;
          };
          out = aim(
            context.body,
            out,
            stage.point,
            stage.request.with ?? "auto",
            { eyes: weight("eyes"), head: weight("head"), trunk: weight("trunk") },
            resolution,
            index === 0 ? stage.towards : undefined,
          );
        });
        return out;
      },
    };
  }
}

/** One gaze axis split: the first part's share up to `first` either way, then the next part's up to its limit on that side. */
function splitShare(
  total: number,
  first: number,
  limitPositive: number,
  limitNegative: number,
): [number, number] {
  const lead: number = Math.sign(total) * Math.min(Math.abs(total), first);
  const rest: number = total - lead;
  const next: number = rest >= 0 ? Math.min(rest, limitPositive) : Math.max(rest, -limitNegative);
  return [lead, next];
}

/** Add an axial twist to one joint, keeping its other two angles. */
function addGazeTwist(joints: IAutoMovieMotionHumanPosture["joints"], bone: AutoMovieHumanoidBone, twist: number): void {
  const base: readonly [number, number, number] = joints[bone] ?? ZERO;
  joints[bone] = [base[0], base[1], base[2] + twist];
}

/** A request's weight for one part at a second: its minimum-jerk onset over the part's duration from `from`, less its return over the same duration from `to`. */
function gazeWeight(seconds: number, active: IAutoMovieMotionHumanGaze.ILayer, duration: number): number {
  const on: number = minimumJerk.share((seconds - active.from) / duration);
  const off: number = active.to === undefined ? 0 : minimumJerk.share((seconds - active.to) / duration);
  return on * (1 - off);
}

/** The angles of a bone the record holds none for. */
const ZERO: readonly [number, number, number] = [0, 0, 0];

/** A part of the body a gaze recruits on its own timing. */
type GazePart = "eyes" | "head" | "trunk";

/** One request showing at an instant: the request, its target's point, its direction from the posture under the layer and its parts' turn durations, seconds. */
interface IStage {
  /** The request. */
  request: IAutoMovieMotionHumanGaze.ILayer;

  /** Where its target is at the instant, world metres. */
  point: IAutoMovieVector3;

  /** The target's direction from the eyes on the posture under the layer, degrees. */
  towards: { yaw: number; pitch: number };

  /** Each part's onset and return duration, seconds. */
  durations: Record<GazePart, number>;
}

/** The largest eye movement a gaze shift times as a saccade, degrees: twice the eyes' own share, `EYES`, since in large head-free gaze shifts the eye's own saccade saturates near 30 degrees while the head carries the rest (Freedman and Sparks 1997, J Neurophysiol 77:2328; Freedman 2008). */
const SACCADE_MOST: number = 2 * HumanGaze.EYES;

/** The longest any part takes to turn onto a target or back, seconds: the saccade of `SACCADE_MOST`, the head's turn over its whole share `HEAD` and the trunk's over `TRUNK`, so a request this long past its start or its return has finished turning. */
const LONGEST: number = Math.max(
  HumanGaze.saccade(SACCADE_MOST),
  HumanGaze.turn(Math.hypot(HumanGaze.HEAD.yaw, Math.max(HumanGaze.HEAD.down, HumanGaze.HEAD.up))),
  HumanGaze.turn(HumanGaze.TRUNK),
);

