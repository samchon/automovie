import {
  AutoMovieHumanClinicalIk,
  AutoMovieHumanRigControls,
  type AutoMovieHumanSkeleton,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import * as THREE from "three";

import type { MotionAction } from "../core/MotionAction";
import { MotionSupportChannels } from "../core/MotionSupportChannels";

/**
 * Clinical shin fitting and same-configuration anatomical guide extraction.
 *
 * @evidence contracts/common.md#implementation-and-ownership Public bounded clinical IK fits the acting hip and knee on the actual prepared Human, adding ankle/subtalar/midfoot controls only for a jointly specified original plantar point. Pelvis/trunk/support intent stays authored. Knee and ankle come from that same FK. Each solve has a fixed sixteen-update budget; no native resources or historical poses are retained.
 * @evidence contracts/common.md#authoring-interface The borrowed evaluator and neutral must belong to the displayed actor. Raw target and bone-local shin witness are metres in the evaluator frame. An unresolved fit retains the raw target and its actual residual; this helper proves no support, mesh interception or visual quality.
 */
export namespace RoundhouseKinematics {
  /**
   * One actual clinical configuration and its independently measured target error.
   *
   * @evidence contracts/common.md#implementation-and-ownership Pose and guide points are read from one public IK result; requested endpoint and achieved shin remain separate values.
   * @evidence contracts/common.md#authoring-interface All points are actor-local metres. Error is Euclidean requested-to-achieved distance, not permission to change the target or a physical admission tolerance.
   */
  export interface Result {
    /** Fitted acting-leg channels with the other authored regions retained. */
    pose: IAutoMovieHumanPose;
    /** Current hip centre after all authored pelvis transformations. */
    hip: MotionAction.Vec3;
    /** Current actual knee centre. */
    knee: MotionAction.Vec3;
    /** Current actual ankle centre. */
    ankle: MotionAction.Vec3;
    /** Actual fitted shin witness, separate from the requested target. */
    shin: MotionAction.Vec3;
    /** Raw requested point, never shortened to fit anatomy. */
    target: MotionAction.Vec3;
    /** Actual remaining point residual, metres. */
    errorMetres: number;
  }

  /**
   * Fit the actual shin point while retaining the anatomical knee hinge and authored body.
   *
   * @evidence contracts/common.md#implementation-and-ownership The exact public clinical channels replace an independent sphere/minimal-quaternion knee construction. The prepared evaluator supplies current joint positions and rotation for the same requested pose; no bone length, target or canonical range is modified. The public solver reports unresolved local outcomes rather than certifying global infeasibility.
   * @evidence contracts/common.md#authoring-interface Requires evaluatePose and neutral explicitly. The target and localPoint use the same actor's evaluator/bone-local frames; optional landing adds a separate unchanged plantar objective. Calls are deterministic and return owned data; the caller must retain both raw objectives and inspect actual support plus complete limb surfaces.
   */
  export function fit(
    context: MotionAction.Context,
    seed: IAutoMovieHumanPose,
    side: MotionAction.Side,
    localPoint: MotionAction.Vec3,
    target: MotionAction.Vec3,
    landing?: Landing,
  ): Result {
    if (!context.evaluatePose || !context.neutral)
      throw new Error(
        "Roundhouse motion requires the actual prepared Human evaluator and neutral anatomy",
      );
    const channels: AutoMovieHumanRigControls.DegreeChannel[] = [
      `legs.${side}.hip.flexion`,
      `legs.${side}.hip.abduction`,
      `legs.${side}.hip.rotation`,
      `legs.${side}.knee.flexion`,
    ];
    const targets: AutoMovieHumanClinicalIk.ITarget[] = [
      {
        bone: AutoMovieHumanRigControls.joint(`${side}LowerLeg`),
        localPoint: [...localPoint],
        position: [...target],
      },
    ];
    if (landing) {
      if (!landing.bone.startsWith(side))
        throw new Error("Landing point must belong to the acting foot");
      channels.push(
        `legs.${side}.ankle.dorsiflexion`,
        `legs.${side}.foot.subtalarInversion`,
        `legs.${side}.foot.midfootSupination`,
      );
      targets.push({
        bone: landing.bone,
        localPoint: [...landing.localPoint],
        position: [...landing.target],
      });
    }
    const solved: AutoMovieHumanClinicalIk.IResult =
      AutoMovieHumanClinicalIk.solve(context.evaluatePose, seed, {
        channels,
        targets,
        iterations: 16,
        tolerance: 0.00025,
      });
    return measure(solved.output, solved.pose, side, localPoint, target);
  }

  /**
   * An actual plantar point jointly fitted with the independent shin objective.
   *
   * @evidence contracts/common.md#implementation-and-ownership The consumer's unchanged original vertex supplies the second target; ankle controls articulate the same chain rather than translating a detached foot. Both objectives remain explicit if the fixed bounded solve cannot satisfy them together.
   * @evidence contracts/common.md#authoring-interface Bone and localPoint identify the acting foot's actual plantar vertex; target uses requested-root FK metres. This supplies no tolerance exemption or support claim.
   */
  export interface Landing {
    /** Canonical acting foot or toe bone containing the real vertex. */
    bone: AutoMovieHumanRigControls.Joint;
    /** Original bone-local vertex coordinates. */
    localPoint: MotionAction.Vec3;
    /** Independent requested plantar position. */
    target: MotionAction.Vec3;
  }

  /**
   * Bounded clinical planning result, separate from whole-body physical admission.
   * @evidence contracts/common.md#implementation-and-ownership The public solver's error and update count remain observable alongside every unchanged original world-frame point and its achieved same-pose witness. No unresolved pose is labelled supported.
   * @evidence contracts/common.md#authoring-interface plannedStatus uses the existing .25mm planning criterion only. World targets and achieved world points are distinct owned tuples; the caller still checks complete-foot floor, load, final hard tasks and anatomical shape.
   */
  export interface PlantResult {
    /** Owned planned clinical pose; convergence alone is not support admission. */
    pose: IAutoMovieHumanPose;
    /** Same fixed planning criterion, independent of physical support status. */
    plannedStatus: "converged" | "unresolved";
    /** Raw public clinical solver residual in metres. */
    error: number;
    /** Raw bounded public clinical update count. */
    iterations: number;
    /** Exactly one bounded clinical call produced this report; cached endpoints report their calls separately. */
    calls: 1;
    /** Declared support authority, shared with the final consumer's channel selection. */
    policy: "planted" | "authored";
    /** Exact eligible planning channels; unrelated foot controls remain authored. */
    channels: readonly AutoMovieHumanRigControls.DegreeChannel[];
    /** Conditional public ranges and applied values, without inferring saturation from residual alone. */
    bounds: {
      channel: AutoMovieHumanRigControls.DegreeChannel;
      minimum: number;
      maximum: number;
      applied: number;
    }[];
    /** Raw same-pose Human normalization events. */
    clamped: AutoMovieHumanSkeleton.IOutput["clamped"];
    /** Original world-frame targets paired with actual same-pose world witnesses. */
    perPointResiduals: {
      target: AutoMovieHumanClinicalIk.ITarget;
      actual: MotionAction.Vec3;
      errorMetres: number;
    }[];
  }

  /**
   * Plan one loaded foot's rigid placement with its existing clinical leg chain.
   *
   * @evidence contracts/common.md#implementation-and-ownership The host's detached original frame supplies its unchanged world tasks. One shared support policy selects existing leg controls and functional Subtalar only for planted intent; midfoot/toes remain authored. Raw error, updates, ranges and each target remain observable when the bounded solve is unresolved.
   * @evidence contracts/common.md#authoring-interface Borrowed supportTargets returns immutable world-metre snapshots from fixed original geometry. Requested root and scene heading convert each goal once into evaluator metres. Returned convergence is planning only; original world tasks, complete-foot floor and final physical admission remain independent and may fail.
   */
  export function plant(
    context: MotionAction.Context,
    seed: IAutoMovieHumanPose,
    patch: MotionAction.SupportPatch,
    rootOffset: MotionAction.Vec3,
    policy: "planted" | "authored",
  ): PlantResult {
    if (
      !context.evaluatePose ||
      !context.frame ||
      !context.supportTargets ||
      !patch.frameRotation
    )
      throw new Error(
        "Planted roundhouse planning requires actual FK and original world frame targets",
      );
    if (!patch.bone.startsWith(patch.side))
      throw new Error(
        "Planted roundhouse frame must belong to its declared anatomical side",
      );
    const heading: THREE.Quaternion = new THREE.Quaternion().setFromAxisAngle(
      new THREE.Vector3(0, 1, 0),
      context.frame.yawRadians,
    );
    const worldTargets: AutoMovieHumanClinicalIk.ITarget[] = context
      .supportTargets(patch)
      .map(
        (
          target: MotionAction.Immutable<AutoMovieHumanClinicalIk.ITarget>,
        ): AutoMovieHumanClinicalIk.ITarget => ({
          bone: target.bone,
          ...(target.localPoint
            ? { localPoint: [...target.localPoint] as MotionAction.Vec3 }
            : {}),
          position: [...target.position],
        }),
      );
    const targets: AutoMovieHumanClinicalIk.ITarget[] = worldTargets.map(
      (
        target: AutoMovieHumanClinicalIk.ITarget,
      ): AutoMovieHumanClinicalIk.ITarget => ({
        ...target,
        position: new THREE.Vector3(...target.position)
          .sub(new THREE.Vector3(...context.frame!.origin))
          .applyQuaternion(heading.clone().invert())
          .sub(new THREE.Vector3(...rootOffset))
          .toArray(),
      }),
    );
    const side: MotionAction.Side = patch.side;
    const selected: ReturnType<typeof MotionSupportChannels.select> =
      MotionSupportChannels.select(side, policy);
    const solved: AutoMovieHumanClinicalIk.IResult =
      AutoMovieHumanClinicalIk.solve(context.evaluatePose, seed, {
        channels: selected.channels,
        targets,
        iterations: 16,
        tolerance: 0.00025,
      });
    const points: Map<string, AutoMovieHumanSkeleton.IPlacement> = new Map(
      solved.output.posed.map(
        (
          point: AutoMovieHumanSkeleton.IPlacement,
        ): [string, AutoMovieHumanSkeleton.IPlacement] => [point.bone, point],
      ),
    );
    const perPointResiduals: PlantResult["perPointResiduals"] =
      worldTargets.map(
        (
          target: AutoMovieHumanClinicalIk.ITarget,
        ): PlantResult["perPointResiduals"][number] => {
          const bone: AutoMovieHumanSkeleton.IPlacement = required(
            points,
            target.bone,
          );
          const actual: MotionAction.Vec3 = new THREE.Vector3()
            .fromArray(target.localPoint ?? [0, 0, 0])
            .applyQuaternion(new THREE.Quaternion(...bone.rotation))
            .add(new THREE.Vector3(...bone.position))
            .add(new THREE.Vector3(...rootOffset))
            .applyQuaternion(heading)
            .add(new THREE.Vector3(...context.frame!.origin))
            .toArray();
          return {
            target,
            actual,
            errorMetres: new THREE.Vector3(...actual).distanceTo(
              new THREE.Vector3(...target.position),
            ),
          };
        },
      );
    const bounds: PlantResult["bounds"] = selected.channels.map(
      (
        channel: AutoMovieHumanRigControls.DegreeChannel,
      ): PlantResult["bounds"][number] => {
        const value: unknown = channel
          .split(".")
          .reduce<unknown>(
            (row: unknown, key: string): unknown =>
              row && typeof row === "object"
                ? (row as Record<string, unknown>)[key]
                : undefined,
            solved.pose,
          );
        return {
          channel,
          ...AutoMovieHumanRigControls.bounds(channel, solved.pose),
          applied: typeof value === "number" ? value : 0,
        };
      },
    );
    return {
      pose: solved.pose,
      plannedStatus: solved.error <= 0.00025 ? "converged" : "unresolved",
      error: solved.error,
      iterations: solved.iterations,
      calls: 1,
      policy,
      channels: [...selected.channels],
      bounds,
      clamped: structuredClone(solved.output.clamped),
      perPointResiduals,
    };
  }

  /**
   * Read one original bone-bound point from an owned planned pose.
   *
   * @evidence contracts/common.md#implementation-and-ownership A fresh same-body public FK supplies the requested bone's actual position and rotation. The point is a planned anatomical witness, never an achieved post-Grounding substitute for an independent strike goal.
   * @evidence contracts/common.md#authoring-interface Returns evaluator-local metres for the supplied canonical bone and original local point. Missing actual anatomy refuses; callers own conversion into a requested actor/root frame.
   */
  export function point(
    context: MotionAction.Context,
    pose: IAutoMovieHumanPose,
    bone: AutoMovieHumanRigControls.Joint,
    localPoint: MotionAction.Vec3 = [0, 0, 0],
  ): MotionAction.Vec3 {
    if (!context.evaluatePose)
      throw new Error("Roundhouse point requires actual prepared FK");
    const row: AutoMovieHumanSkeleton.IPlacement = required(
      new Map(
        context
          .evaluatePose(pose)
          .posed.map(
            (
              placement: AutoMovieHumanSkeleton.IPlacement,
            ): [string, AutoMovieHumanSkeleton.IPlacement] => [
              placement.bone,
              placement,
            ],
          ),
      ),
      bone,
    );
    return new THREE.Vector3(...localPoint)
      .applyQuaternion(new THREE.Quaternion(...row.rotation))
      .add(new THREE.Vector3(...row.position))
      .toArray();
  }

  /**
   * Read the exact supplied clinical configuration without adding solver-owned channels.
   *
   * @evidence contracts/common.md#implementation-and-ownership A fresh public FK snapshot supplies all guide points and the raw-target error; no inverse solve or pose normalization changes the supplied endpoint. This preserves the caller's exact idle/complete guard record.
   * @evidence contracts/common.md#authoring-interface Requires the same actual evaluator and neutral as fit. Returns an independent pose and metre tuples; inspection establishes the represented chain only, not physical support or contact.
   */
  export function inspect(
    context: MotionAction.Context,
    pose: IAutoMovieHumanPose,
    side: MotionAction.Side,
    localPoint: MotionAction.Vec3,
    target: MotionAction.Vec3,
  ): Result {
    if (!context.evaluatePose || !context.neutral)
      throw new Error(
        "Roundhouse inspection requires the actual prepared Human evaluator and neutral anatomy",
      );
    return measure(
      context.evaluatePose(pose),
      structuredClone(pose),
      side,
      localPoint,
      target,
    );
  }
}

/** Extract all anatomical points from exactly the supplied public FK snapshot. */
function measure(
  output: AutoMovieHumanSkeleton.IOutput,
  pose: IAutoMovieHumanPose,
  side: MotionAction.Side,
  localPoint: MotionAction.Vec3,
  target: MotionAction.Vec3,
): RoundhouseKinematics.Result {
  const placements: Map<string, AutoMovieHumanSkeleton.IPlacement> = new Map(
    output.posed.map(
      (
        point: AutoMovieHumanSkeleton.IPlacement,
      ): [string, AutoMovieHumanSkeleton.IPlacement] => [point.bone, point],
    ),
  );
  const hip: AutoMovieHumanSkeleton.IPlacement = required(
    placements,
    `${side}UpperLeg`,
  );
  const knee: AutoMovieHumanSkeleton.IPlacement = required(
    placements,
    `${side}LowerLeg`,
  );
  const ankle: AutoMovieHumanSkeleton.IPlacement = required(
    placements,
    `${side}Foot`,
  );
  const point: MotionAction.Vec3 = new THREE.Vector3(...localPoint)
    .applyQuaternion(new THREE.Quaternion(...knee.rotation))
    .toArray();
  const shin: MotionAction.Vec3 = [
    knee.position[0] + point[0],
    knee.position[1] + point[1],
    knee.position[2] + point[2],
  ];
  return {
    pose,
    hip: [...hip.position],
    knee: [...knee.position],
    ankle: [...ankle.position],
    shin,
    target: [...target],
    errorMetres: Math.hypot(
      shin[0] - target[0],
      shin[1] - target[1],
      shin[2] - target[2],
    ),
  };
}

/** Refuse absent actual anatomy instead of synthesizing a nominal point. */
function required(
  placements: ReadonlyMap<string, AutoMovieHumanSkeleton.IPlacement>,
  bone: string,
): AutoMovieHumanSkeleton.IPlacement {
  const point: AutoMovieHumanSkeleton.IPlacement | undefined =
    placements.get(bone);
  if (!point) throw new Error(`Roundhouse evaluator omitted ${bone}`);
  return point;
}
