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

/**
 * The fits and physical gates of a free-leg curve (`prepareHumanFreeCurve`):
 * the ordinary cold solve, the independent observation of a native output with
 * its fixed-epoch ROM admission, and the correction of an actual target from a
 * prior anchor under the original branch, swivel and rotation gates, read from
 * the curve's body, authoring, angular resolution and ROM scorers.
 *
 * @param scope What the curve builds the fits from.
 * @returns The fits.
 */
export function HumanFreeCurveFit(
  scope: HumanFreeCurveFit.IScope,
): HumanFreeCurveFit.IFits {
  const {
    body,
    at,
    tolerance,
    radians,
    legality,
    checked,
    observations,
  }: HumanFreeCurveFit.IScope = scope;
  /**
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

  /**
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

    // The observed bones depend only on which sides' goals the posture
    // holds, in their order: read once per curve for each such sequence.
    let code: number = 0;
    for (const [limb] of limbs) code = 3 * code + (limb === "leftLeg" ? 1 : 2);
    let observed: IObserved | undefined = observations.get(code);
    if (observed === undefined) {
      const names: Set<AutoMovieHumanoidBone> = new Set();
      for (const [limb] of limbs) {
        const side: AutoMovieHumanSide = limb === "leftLeg" ? "left" : "right";
        names.add(`${side}UpperLeg`);
        names.add(`${side}LowerLeg`);
        names.add(`${side}Foot`);
      }
      observed = { names, read: poseBones.prepare(body, names) };
      observations.set(code, observed);
    }
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

  /**
   * Pure fixed-epoch ROM admission reuses only exactly equal actual nullable
   * coordinates.
   */
  function legal(
    bone: AutoMovieHumanoidBone,
    flexion: number | null,
    abduction: number | null,
    twist: number | null,
  ): boolean {
    const previous:
      | readonly [number | null, number | null, number | null]
      | undefined = checked.get(bone);
    if (
      previous !== undefined &&
      Object.is(previous[0], flexion) &&
      Object.is(previous[1], abduction) &&
      Object.is(previous[2], twist)
    )
      return true;
    if (
      !(
        (legality.get(bone)?.({ bone, flexion, abduction, twist }) ??
          Infinity) <= ROM_TOLERANCE
      )
    )
      return false;
    checked.set(bone, [flexion, abduction, twist]);
    return true;
  }

  /**
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

/** What the fits of a free-leg curve read and what they are. */
export namespace HumanFreeCurveFit {
  /** What a free-leg curve builds its fits from. */
  export interface IScope {
    /** The curve's canonical body. */
    body: IAutoMovieMotionHumanBody;

    /**
     * The curve's authoring at a phase in [0,1].
     *
     * @param share The phase.
     * @returns The authored posture.
     */
    at: (share: number) => IAutoMovieMotionHumanPosture;

    /** The velocity-continuation angular resolution, degrees. */
    tolerance: number;

    /** The ROM tolerance, radians. */
    radians: number;

    /** Each bone's prepared ROM overshoot scorer. */
    legality: Map<
      AutoMovieHumanoidBone,
      (joint: IAutoMovieJointPose) => number
    >;

    /** Each bone's last admitted coordinates. */
    checked: Map<
      AutoMovieHumanoidBone,
      readonly [number | null, number | null, number | null]
    >;

    /** The observed bones of each sequence of leg goals. */
    observations: Map<number, IObserved>;
  }

  /** The fits. */
  export interface IFits {
    /**
     * The ordinary current admission and solve.
     *
     * @param share The phase.
     * @param resolution The borrowed forward-kinematics source, if any.
     * @param projection The borrowed range-of-motion projector, if any.
     * @param raw The authored posture at the phase; read when absent.
     * @returns The current preparation.
     */
    cold: (
      share: number,
      resolution: Parameters<typeof prepareHumanPoseResolution>[0],
      projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
      raw?: IAutoMovieMotionHumanPosture,
    ) => HumanPosturePreparation.IPrepared;

    /**
     * The native output observed independently.
     *
     * @param prepared The current preparation.
     * @param raw The authored posture.
     * @param resolution The borrowed forward-kinematics source, if any.
     * @param knownSeeds The preparation's seeds, when already read.
     * @returns The anchor, or undefined when a gate fails.
     */
    observe: (
      prepared: HumanPosturePreparation.IPrepared,
      raw: IAutoMovieMotionHumanPosture,
      resolution: Parameters<typeof prepareHumanPoseResolution>[0],
      knownSeeds?: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"],
    ) => IAnchor | undefined;

    /**
     * The actual target fitted from a prior anchor under the original gates.
     *
     * @param share The phase.
     * @param prior The prior anchor.
     * @param resolution The borrowed forward-kinematics source, if any.
     * @param projection The borrowed range-of-motion projector, if any.
     * @param raw The authored posture at the phase; read when absent.
     * @returns The correction.
     */
    correct: (
      share: number,
      prior: IAnchor,
      resolution: Parameters<typeof prepareHumanPoseResolution>[0],
      projection: ReturnType<typeof prepareHumanPostureProjection> | undefined,
      raw?: IAutoMovieMotionHumanPosture,
    ) => ICorrection;
  }
  /**
   * The bones a curve observes for one sequence of leg goals, and the rig's bound
   * demand of them.
   */
  export interface IObserved {
    /** The legs' hip, knee and ankle bones, in the goals' order. */
    names: ReadonlySet<AutoMovieHumanoidBone>;

    /** Those bones of a pose, read through the bound demand. */
    read: ReturnType<typeof poseBones.prepare>;
  }

  /** Only primitive fit seeds and native quaternion observations survive a query. */
  export interface IAnchor {
    /** Actual branch and degree swivel of the validated canonical predecessor. */
    seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"];
    /** Actual postclamp chain world rotations, in supported goal insertion order. */
    rotations: readonly IAutoMovieQuaternion[];
  }

  /**
   * Only a validated correction carries a current preparation and numerical
   * anchor.
   */
  export type ICorrection = ICorrection2 | ICorrection3;
}

/** A curve's observed bones (`HumanFreeCurveFit.IObserved`). */
type IObserved = HumanFreeCurveFit.IObserved;

/** A curve's numeric anchor (`HumanFreeCurveFit.IAnchor`). */
type IAnchor = HumanFreeCurveFit.IAnchor;

/** A curve's correction (`HumanFreeCurveFit.ICorrection`). */
type ICorrection = HumanFreeCurveFit.ICorrection;
/** The record of `ICorrection3`'s site. */
type ICorrection3 = { kind: CorrectionKind };

/** The alternatives of `CorrectionKind`'s site. */
type CorrectionKind = "refine" | "unusable";

/** The record of `ICorrection2`'s site. */
type ICorrection2 = {
  kind: "accepted";
  prepared: HumanPosturePreparation.IPrepared;
  anchor: IAnchor;
};
