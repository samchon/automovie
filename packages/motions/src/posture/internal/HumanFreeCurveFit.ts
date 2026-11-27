import {
  Quaternion,
  ROM_TOLERANCE,
  Vector3,
  hingedArmSwivel,
} from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieSwivelNear,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPosturePreparation } from "./HumanPosturePreparation";
import { HumanPostureRaw } from "./HumanPostureRaw";
import { poseBones } from "./poseBones";
import type { prepareHumanPoseResolution } from "./prepareHumanPoseResolution";
import type { prepareHumanPostureProjection } from "./prepareHumanPostureProjection";

/*
 * The fits and physical gates of a free-leg curve (`prepareHumanFreeCurve`):
 * the ordinary cold solve, the independent observation of a native output with
 * its ROM admission, and the correction of an actual target from a prior anchor
 * under the original branch, swivel and rotation gates, read from the curve's
 * body, authoring, angular resolution and ROM scorers. The observed bones of
 * each set of leg goals are prepared once here; nothing is stored on a read.
 * Parameter scope: What the curve builds the fits from.
 * Returns: The fits.
 */
export function HumanFreeCurveFit(
  scope: HumanFreeCurveFit.IScope,
): HumanFreeCurveFit.IFits {
  const { body, at, tolerance, radians, legality }: HumanFreeCurveFit.IScope =
    scope;

  // The observed bones depend only on which legs' goals a posture holds, so
  // each of the three sets and its bound demand is prepared here.
  const sets: Record<ObservedSide, IObserved> = {
    left: observedOf(body, ["left"]),
    right: observedOf(body, ["right"]),
    both: observedOf(body, ["left", "right"]),
  };
  /*
   * Actual current admission/solve remains the ordinary owner in every
   * fallback.
   */
  function cold(
    share: number,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
    raw: IAutoMovieMotionHumanPosture = at(share),
  ): HumanPosturePreparation.IPrepared {
    return HumanPosturePreparation.continued(
      body,
      raw,
      {},
      resolution,
      projection,
    );
  }

  /*
   * Observe native output independently; no seed or fitted endpoint is a target
   * substitute.
   */
  function observe(
    prepared: HumanPosturePreparation.IPrepared,
    raw: IAutoMovieMotionHumanPosture,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    knownSeeds?: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"],
  ): IAnchor | undefined {
    if (raw.rotation !== undefined || !HumanPostureRaw.eligible(raw))
      return undefined;
    const limbs: [AutoMovieHumanLimb, IAutoMovieHumanLimbGoal][] =
      Object.entries(raw.limbs) as [
        AutoMovieHumanLimb,
        IAutoMovieHumanLimbGoal,
      ][];
    if (limbs.length === 0) return undefined;

    const left: boolean = raw.limbs.leftLeg !== undefined;
    const right: boolean = raw.limbs.rightLeg !== undefined;
    const observed: IObserved =
      sets[left && right ? "both" : left ? "left" : "right"];
    const names: ReadonlySet<AutoMovieHumanoidBone> = observed.names;
    const source: HumanPosturePreparation.IObservation | undefined =
      HumanPosturePreparation.source(prepared, names, resolution);
    let bones: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
    if (source === undefined) {
      const pose: HumanPosturePreparation.IPrepared["pose"] = prepared.pose;
      for (const joint of pose.joints)
        if (!legal(joint.bone, joint.flexion, joint.abduction, joint.twist))
          return undefined;
      bones = observed.read(pose);
    } else {
      for (let i: number = 0; i < source.names.length; ++i)
        if (
          !legal(
            source.names[i]!,
            source.values[3 * i]!,
            source.values[3 * i + 1]!,
            source.values[3 * i + 2]!,
          )
        )
          return undefined;
      bones = source.bones;
    }
    const rotations: IAutoMovieQuaternion[] = [];
    for (const [limb, goal] of limbs) {
      const side: AutoMovieHumanSide = limb === "leftLeg" ? "left" : "right";
      const hip: IAutoMovieResolvedBone = bones.get(`${side}UpperLeg`)!;
      const knee: IAutoMovieResolvedBone = bones.get(`${side}LowerLeg`)!;
      const foot: IAutoMovieResolvedBone = bones.get(`${side}Foot`)!;
      const length: number =
        Vector3.distance(hip.worldPosition, knee.worldPosition) +
        Vector3.distance(knee.worldPosition, foot.worldPosition);
      const precision: number = length * radians;
      if (
        !(precision > 0) ||
        Vector3.distance(foot.worldPosition, goal.point) > precision
      )
        return undefined;
      if (
        goal.rotation !== undefined &&
        (Quaternion.angleAfterNormalize(
          foot.worldRotation,
          Quaternion.normalize(goal.rotation),
        ) *
          180) /
          Math.PI >
          ROM_TOLERANCE
      )
        return undefined;
      const reach: IAutoMovieVector3 = Vector3.subtract(
        goal.point,
        hip.worldPosition,
      );
      const distance: number = Vector3.length(reach);
      if (!(distance > precision)) return undefined;
      const axis: IAutoMovieVector3 = Vector3.scale(reach, 1 / distance);
      const off: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
        point: IAutoMovieVector3,
      ): IAutoMovieVector3 => {
        const offset: IAutoMovieVector3 = Vector3.subtract(
          point,
          hip.worldPosition,
        );
        return Vector3.subtract(
          offset,
          Vector3.scale(axis, Vector3.dot(offset, axis)),
        );
      };
      const bent: IAutoMovieVector3 = off(knee.worldPosition);
      const asked: IAutoMovieVector3 = off(goal.bend);
      if (
        !(Vector3.length(bent) > precision) ||
        !(Vector3.length(asked) > precision) ||
        !(Vector3.dot(bent, asked) > 0)
      )
        return undefined;
      rotations.push(hip.worldRotation, knee.worldRotation, foot.worldRotation);
    }
    const seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"] =
      knownSeeds ?? HumanPosturePreparation.seeds(prepared);
    if (
      limbs.some(
        ([limb]: [AutoMovieHumanLimb, IAutoMovieHumanLimbGoal]): boolean =>
          seeds[limb] === null || seeds[limb] === undefined,
      )
    )
      return undefined;
    return { seeds, rotations };
  }

  /*
   * Whether a joint's coordinates lie within its range of motion.
   */
  function legal(
    bone: AutoMovieHumanoidBone,
    flexion: number | null,
    abduction: number | null,
    twist: number | null,
  ): boolean {
    return (
      (legality.get(bone)?.({ bone, flexion, abduction, twist }) ??
        Infinity) <= ROM_TOLERANCE
    );
  }

  /*
   * Fit this actual target and retain the original physical and local-basin
   * gates.
   */
  function correct(
    share: number,
    prior: IAnchor,
    resolution: Parameters<typeof prepareHumanPoseResolution>[0],
    projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
    raw: IAutoMovieMotionHumanPosture = at(share),
  ): ICorrection {
    const near: IAutoMovieMotionHumanResolveHumanPosture.INear =
      Object.fromEntries(
        Object.entries(prior.seeds).flatMap(
          ([limb, seed]: [
            string,
            IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"][AutoMovieHumanLimb],
          ]): [AutoMovieHumanLimb, IAutoMovieSwivelNear][] =>
            seed === null || seed === undefined
              ? []
              : [[limb as AutoMovieHumanLimb, { ...seed, tolerance }]],
        ),
      );
    const prepared: HumanPosturePreparation.IPrepared =
      HumanPosturePreparation.continued(
        body,
        raw,
        near,
        resolution,
        projection,
      );
    const seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"] =
      HumanPosturePreparation.seeds(prepared);
    const interior: boolean = Object.entries(seeds).every(
      ([limb, seed]: [
        string,
        IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"][AutoMovieHumanLimb],
      ]): boolean => {
        const before: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"][AutoMovieHumanLimb] =
          prior.seeds[limb as AutoMovieHumanLimb];
        return (
          seed !== null &&
          seed !== undefined &&
          before !== null &&
          before !== undefined &&
          seed.branch === before.branch &&
          Math.abs(seed.swivel - before.swivel) <
            hingedArmSwivel.STEP - tolerance
        );
      },
    );
    if (!interior) {
      return { kind: "refine" };
    }
    const value: IAnchor | undefined = observe(
      prepared,
      raw,
      resolution,
      seeds,
    );
    if (value === undefined) return { kind: "unusable" };
    const continuous: boolean =
      value.rotations.length === prior.rotations.length &&
      value.rotations.every(
        (rotation: IAutoMovieQuaternion, i: number): boolean =>
          (Quaternion.angleAfterNormalize(rotation, prior.rotations[i]!) *
            180) /
            Math.PI <=
          hingedArmSwivel.STEP,
      );
    if (!continuous) {
      return { kind: "refine" };
    }
    return { kind: "accepted", prepared, anchor: value };
  }
  return { cold, observe, correct };
}

/*
 * What the fits of a free-leg curve read and what they are.
 */
export namespace HumanFreeCurveFit {
  /*
   * What a free-leg curve builds its fits from.
   */
  export interface IScope {
    /*
     * The curve's canonical body.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The curve's authoring at a phase in [0,1].
     * Parameter share: The phase.
     * Returns: The authored posture.
     */
    at: (share: number) => IAutoMovieMotionHumanPosture;

    /*
     * The velocity-continuation angular resolution, degrees.
     */
    tolerance: number;

    /*
     * The ROM tolerance, radians.
     */
    radians: number;

    /*
     * Each bone's prepared ROM overshoot scorer.
     */
    legality: ReadonlyMap<
      AutoMovieHumanoidBone,
      (joint: IAutoMovieJointPose) => number
    >;
  }

  /*
   * The fits.
   */
  export interface IFits {
    /*
     * The ordinary current admission and solve.
     * Parameter share: The phase.
     * Parameter resolution: The borrowed forward-kinematics source, if any.
     * Parameter projection: The borrowed range-of-motion projector, if any.
     * Parameter raw: The authored posture at the phase; read when absent.
     * Returns: The current preparation.
     */
    cold: (
      share: number,
      resolution: Parameters<typeof prepareHumanPoseResolution>[0],
      projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
      raw?: IAutoMovieMotionHumanPosture,
    ) => HumanPosturePreparation.IPrepared;

    /*
     * The native output observed independently.
     * Parameter prepared: The current preparation.
     * Parameter raw: The authored posture.
     * Parameter resolution: The borrowed forward-kinematics source, if any.
     * Parameter knownSeeds: The preparation's seeds, when already read.
     * Returns: The anchor, or undefined when a gate fails.
     */
    observe: (
      prepared: HumanPosturePreparation.IPrepared,
      raw: IAutoMovieMotionHumanPosture,
      resolution: Parameters<typeof prepareHumanPoseResolution>[0],
      knownSeeds?: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"],
    ) => IAnchor | undefined;

    /*
     * The actual target fitted from a prior anchor under the original gates.
     * Parameter share: The phase.
     * Parameter prior: The prior anchor.
     * Parameter resolution: The borrowed forward-kinematics source, if any.
     * Parameter projection: The borrowed range-of-motion projector, if any.
     * Parameter raw: The authored posture at the phase; read when absent.
     * Returns: The correction.
     */
    correct: (
      share: number,
      prior: IAnchor,
      resolution: Parameters<typeof prepareHumanPoseResolution>[0],
      projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
      raw?: IAutoMovieMotionHumanPosture,
    ) => ICorrection;
  }
  /*
   * The bones a curve observes for one set of leg goals, and the rig's bound
   * demand of them.
   */
  export interface IObserved {
    /*
     * The legs' hip, knee and ankle bones.
     */
    names: ReadonlySet<AutoMovieHumanoidBone>;

    /*
     * Those bones of a pose, read through the bound demand.
     */
    read: ReturnType<typeof poseBones.prepare>;
  }

  /*
   * Only primitive fit seeds and native quaternion observations survive a query.
   */
  export interface IAnchor {
    /*
     * Actual branch and degree swivel of the validated canonical predecessor.
     */
    seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"];
    /*
     * Actual postclamp chain world rotations, in supported goal insertion order.
     */
    rotations: readonly IAutoMovieQuaternion[];
  }

  /*
   * Only a validated correction carries a current preparation and numerical
   * anchor.
   */
  export type ICorrection = ICorrection2 | ICorrection3;
}

/*
 * A curve's observed bones (`HumanFreeCurveFit.IObserved`).
 */
type IObserved = HumanFreeCurveFit.IObserved;

/*
 * A curve's numeric anchor (`HumanFreeCurveFit.IAnchor`).
 */
type IAnchor = HumanFreeCurveFit.IAnchor;

/*
 * A curve's correction (`HumanFreeCurveFit.ICorrection`).
 */
type ICorrection = HumanFreeCurveFit.ICorrection;
/*
 * The record of `ICorrection3`'s site.
 */
type ICorrection3 = { kind: CorrectionKind };

/*
 * The alternatives of `CorrectionKind`'s site.
 */
type CorrectionKind = "refine" | "unusable";

/*
 * Which legs' goals a posture holds.
 */
type ObservedSide = "left" | "right" | "both";

/*
 * The hip, knee and ankle bones of some legs, and their bound demand.
 */
function observedOf(
  body: IAutoMovieMotionHumanBody,
  sides: readonly AutoMovieHumanSide[],
): IObserved {
  const names: Set<AutoMovieHumanoidBone> = new Set();
  for (const side of sides) {
    names.add(`${side}UpperLeg`);
    names.add(`${side}LowerLeg`);
    names.add(`${side}Foot`);
  }
  return { names, read: poseBones.prepare(body, names) };
}

/*
 * The record of `ICorrection2`'s site.
 */
type ICorrection2 = {
  kind: "accepted";
  prepared: HumanPosturePreparation.IPrepared;
  anchor: IAnchor;
};
