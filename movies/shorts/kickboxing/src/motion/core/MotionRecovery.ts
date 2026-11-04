import { Quaternion } from "@automovie/engine";
import {
  AutoMovieHumanRigControls,
  type AutoMovieHumanSkeleton,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import type { IAutoMovieQuaternion } from "@automovie/interface";

import { ActionClock } from "./ActionClock";
import { MotionAction } from "./MotionAction";

/**
 * Continuous requested return from the actual stopped configuration.
 *
 * @evidence contracts/common.md#implementation-and-ownership Public Human pose blending retains the constrained start. Declared internal points follow that same clinical FK; independent external tasks keep their Cartesian path. Same-centre frame rotation uses public Engine Quaternion.slerp, with legacy same-pivot yaw compatibility. No support solver, actor state or postsolve target feedback participates.
 * @evidence contracts/common.md#authoring-interface Times share one local clock and explicit release permits dwell. Effectors match stable semantic identities, not array positions. Internal shape authority is declared before evaluation; literal external tasks and retained world support anchors remain independent. Callers own subsequent compatible replant and actual full-chain inspection.
 */
export namespace MotionRecovery {
  /**
   * Internal shape points declared when the return path is authored.
   *
   * @evidence contracts/common.md#implementation-and-ownership Exact bone/local-point/role/priority/radius identities select internal witnesses from the same public Human pose evaluator. Array order cannot select a different external task. A selection never uses the achieved solver output to replace a failed raw target.
   * @evidence contracts/common.md#authoring-interface The evaluator belongs to the same fixed body as both endpoints. Selected targets must already agree with endpoint FK within1e-8m arithmetic agreement; intermediate targets follow that single clinical pose. Unselected external tasks retain their explicit Cartesian path, and support world anchors remain independent.
   */
  export interface Kinematics {
    /** Borrowed public same-body FK; a selected-bone projection is used when available. */
    evaluatePose: AutoMovieHumanSkeleton.PoseEvaluator;
    /** Stable identities, declared before fitting; target values are deliberately absent. */
    effectors: readonly Readonly<
      Pick<
        MotionAction.Effector,
        "bone" | "localPoint" | "role" | "constraint" | "radius"
      >
    >[];
  }

  /**
   * Blend a constrained contact sample into its caller-supplied return endpoint.
   *
   * @evidence contracts/common.md#implementation-and-ownership Validates the originating event/sample clock once, then delegates to the same local return used by receivers. It never modifies the event, constrained sample, internal-point declaration or independent external task. Exact endpoints and same-pose rigid internal witnesses come from local.
   * @evidence contracts/common.md#authoring-interface Event and sample timestamps must agree. Duration is positive seconds and release cannot precede contact. Optional internal identities are declared at authoring and must match actual endpoint FK; omission keeps explicit Cartesian task paths. Actual support, technique feasibility and following replant remain independent consumer checks.
   */
  export function sample(
    state: MotionAction.ContactState,
    goal: MotionAction.Sample,
    elapsed: number,
    retractionSeconds: number,
    releaseTime: number = state.event.time,
    kinematics?: Kinematics,
  ): MotionAction.Sample {
    if (
      !Number.isFinite(state.event.time) ||
      state.sample.elapsed !== state.event.time
    )
      throw new Error(
        "Constrained sample and contact must share one local timestamp",
      );
    return local(
      state.sample,
      goal,
      elapsed,
      retractionSeconds,
      releaseTime,
      kinematics,
    );
  }

  /**
   * Return a stopped configuration in its own clock, without rewriting an incoming event.
   *
   * @evidence contracts/common.md#implementation-and-ownership The same implementation serves outgoing contact and receiver-local recovery. Endpoint effectors match stable identities, clinical pose/root/load interpolate once, and explicitly selected internal points use same-pose public FK. Exact retained support anchors and authored locks remain independent. Work is linear in points/channels plus at most three selected-bone FK evaluations, without retained state.
   * @evidence contracts/common.md#authoring-interface Start elapsed, release and elapsed are seconds in one host-mapped clock; duration is positive. This limb-return boundary supports feet and one fixed root orientation only; mixed-contact, airborne and changing rigid-root transitions require their own authored owner and refuse here. A receiver keeps its original foreign event untouched. Internal endpoint/FK disagreement, missing or duplicate identities, changed locks and replaced support anchors refuse. Exact endpoint snapshots remain owned; subsequent compatible replant belongs to the technique.
   */
  export function local(
    start: MotionAction.Sample,
    goal: MotionAction.Sample,
    elapsed: number,
    retractionSeconds: number,
    releaseTime: number,
    kinematics?: Kinematics,
  ): MotionAction.Sample {
    if (
      ![elapsed, retractionSeconds, releaseTime, start.elapsed].every(
        Number.isFinite,
      ) ||
      retractionSeconds <= 0 ||
      releaseTime < start.elapsed ||
      elapsed < start.elapsed
    )
      throw new Error(
        "Retraction requires finite local seconds and a release after the stopped sample",
      );
    if (
      (start.support.kind !== undefined && start.support.kind !== "feet") ||
      (goal.support.kind !== undefined && goal.support.kind !== "feet")
    )
      throw new Error(
        "Limb recovery requires foot support; whole-body contact transitions need their authored owner",
      );
    MotionAction.validateRootRotation(start.rootRotation);
    MotionAction.validateRootRotation(goal.rootRotation);
    const startRotation: AutoMovieHumanRigControls.Rotation =
      start.rootRotation ?? [0, 0, 0, 1];
    const goalRotation: AutoMovieHumanRigControls.Rotation =
      goal.rootRotation ?? [0, 0, 0, 1];
    const sameSign: boolean = startRotation.every(
      (value: number, index: number): boolean =>
        Math.abs(value - goalRotation[index]!) <= 1e-12,
    );
    const oppositeSign: boolean = startRotation.every(
      (value: number, index: number): boolean =>
        Math.abs(value + goalRotation[index]!) <= 1e-12,
    );
    if (!sameSign && !oppositeSign)
      throw new Error(
        "Limb recovery requires the same rigid root orientation at both endpoints",
      );
    const goals: Map<string, MotionAction.Effector> = new Map(
      goal.effectors.map(
        (effector: MotionAction.Effector): [string, MotionAction.Effector] => [
          identity(effector),
          effector,
        ],
      ),
    );
    if (
      start.effectors.length !== goals.size ||
      goal.effectors.length !== goals.size ||
      new Set(start.effectors.map(identity)).size !== start.effectors.length ||
      start.effectors.some(
        (effector: MotionAction.Effector): boolean =>
          !goals.has(identity(effector)),
      )
    )
      throw new Error(
        "Retraction endpoints must share unique exact bone-bound effector identities",
      );
    const selected: Set<string> = new Set(
      kinematics?.effectors.map(identity) ?? [],
    );
    if (
      selected.size !== (kinematics?.effectors.length ?? 0) ||
      [...selected].some((key: string): boolean => !goals.has(key))
    )
      throw new Error(
        "Internal return points require unique existing effector identities",
      );
    const evaluate: AutoMovieHumanSkeleton.ProjectionEvaluator | undefined =
      kinematics && selected.size
        ? (kinematics.evaluatePose.project?.([
            ...new Set(
              kinematics.effectors.map(
                (effector: Kinematics["effectors"][number]): string =>
                  effector.bone,
              ),
            ),
          ]) ?? kinematics.evaluatePose)
        : undefined;
    if (evaluate)
      for (const endpoint of [start, goal]) {
        const points: Map<string, AutoMovieHumanSkeleton.IPlacement> = new Map(
          evaluate(endpoint.pose).posed.map(
            (
              placement: AutoMovieHumanSkeleton.IPlacement,
            ): [string, AutoMovieHumanSkeleton.IPlacement] => [
              placement.bone,
              placement,
            ],
          ),
        );
        for (const effector of endpoint.effectors)
          if (selected.has(identity(effector))) {
            const point: MotionAction.Vec3 = posePoint(points, effector);
            if (
              Math.hypot(
                ...point.map(
                  (value: number, axis: number): number =>
                    value - effector.target[axis]!,
                ),
              ) > 1e-8
            )
              throw new Error(
                `Internal return endpoint disagrees with authored FK: ${identity(effector)}`,
              );
          }
      }
    const preserved: readonly string[] = start.preservedChannels ?? [];
    const goalPreserved: readonly string[] = goal.preservedChannels ?? [];
    if (
      [...preserved, ...goalPreserved].some(
        (channel: string): boolean =>
          !AutoMovieHumanRigControls.isChannel(channel),
      ) ||
      new Set(preserved).size !== preserved.length ||
      new Set(goalPreserved).size !== goalPreserved.length ||
      preserved.length !== goalPreserved.length ||
      preserved.some(
        (channel: string): boolean => !goalPreserved.includes(channel),
      )
    )
      throw new Error(
        "Retraction must preserve the same authored channel selection through its endpoint",
      );
    const startPatches: MotionAction.SupportPatch[] =
      start.support.patches ?? [];
    const goalPatches: MotionAction.SupportPatch[] = goal.support.patches ?? [];
    for (const patch of [...startPatches, ...goalPatches])
      MotionAction.validateSupportFrame(patch);
    if (
      startPatches.length !== goalPatches.length ||
      startPatches.some(
        (patch: MotionAction.SupportPatch, index: number): boolean => {
          const other: MotionAction.SupportPatch = goalPatches[index]!;
          return (
            patch.side !== other.side ||
            patch.bone !== other.bone ||
            patch.mode !== other.mode ||
            MotionAction.supportConstraint(patch) !==
              MotionAction.supportConstraint(other) ||
            (patch.frameRotation === undefined) !==
              (other.frameRotation === undefined) ||
            (patch.initialWorld === undefined) !==
              (other.initialWorld === undefined) ||
            (patch.initialWorld !== undefined &&
              patch.initialWorld.some(
                (value: number, axis: number): boolean =>
                  value !== other.initialWorld![axis],
              )) ||
            patch.localPoint.some(
              (value: number, axis: number): boolean =>
                value !== other.localPoint[axis],
            ) ||
            patch.world.some(
              (value: number, axis: number): boolean =>
                value !== other.world[axis],
            )
          );
        },
      )
    )
      throw new Error(
        "Retraction must retain the same actual support anchors through its endpoint",
      );
    const progress: number = Math.max(
      0,
      Math.min(1, (elapsed - releaseTime) / retractionSeconds),
    );
    if (progress === 0)
      return {
        ...structuredClone(start),
        elapsed,
        phase: elapsed < releaseTime ? "contact" : "retraction",
        progress: 0,
      };
    if (progress === 1)
      return {
        ...structuredClone(goal),
        elapsed,
        phase: "complete",
        progress: 1,
      };
    const weight: number = ActionClock.ease(progress);
    const pose: IAutoMovieHumanPose = AutoMovieHumanRigControls.blend(
      start.pose,
      goal.pose,
      weight,
    );
    const points: Map<string, AutoMovieHumanSkeleton.IPlacement> | undefined =
      evaluate
        ? new Map(
            evaluate(pose).posed.map(
              (
                placement: AutoMovieHumanSkeleton.IPlacement,
              ): [string, AutoMovieHumanSkeleton.IPlacement] => [
                placement.bone,
                placement,
              ],
            ),
          )
        : undefined;
    const lerp: (
      from: MotionAction.Vec3,
      to: MotionAction.Vec3,
    ) => MotionAction.Vec3 = (
      from: MotionAction.Vec3,
      to: MotionAction.Vec3,
    ): MotionAction.Vec3 => [
      from[0] + (to[0] - from[0]) * weight,
      from[1] + (to[1] - from[1]) * weight,
      from[2] + (to[2] - from[2]) * weight,
    ];
    return {
      pose,
      ...(start.preservedChannels
        ? { preservedChannels: [...start.preservedChannels] }
        : {}),
      rootOffset: lerp(start.rootOffset, goal.rootOffset),
      ...(start.rootRotation
        ? {
            rootRotation: [
              ...start.rootRotation,
            ] as AutoMovieHumanRigControls.Rotation,
          }
        : {}),
      support: {
        ...(start.support.kind ? { kind: "feet" as const } : {}),
        left:
          start.support.left +
          (goal.support.left - start.support.left) * weight,
        right:
          start.support.right +
          (goal.support.right - start.support.right) * weight,
        ...(start.support.patches
          ? {
              patches: startPatches.map(
                (
                  patch: MotionAction.SupportPatch,
                  index: number,
                ): MotionAction.SupportPatch => {
                  const result: MotionAction.SupportPatch =
                    structuredClone(patch);
                  if (patch.frameRotation) {
                    const from: [number, number, number, number] =
                      patch.frameRotation;
                    const to: [number, number, number, number] =
                      goalPatches[index]!.frameRotation!;
                    const rotation: IAutoMovieQuaternion = Quaternion.slerp(
                      { x: from[0], y: from[1], z: from[2], w: from[3] },
                      { x: to[0], y: to[1], z: to[2], w: to[3] },
                      weight,
                    );
                    result.frameRotation = [
                      rotation.x,
                      rotation.y,
                      rotation.z,
                      rotation.w,
                    ];
                  } else if (patch.mode === "pivot")
                    result.yawDegrees =
                      (patch.yawDegrees ?? 0) +
                      ((goalPatches[index]!.yawDegrees ?? 0) -
                        (patch.yawDegrees ?? 0)) *
                        weight;
                  return result;
                },
              ),
            }
          : {}),
      },
      effectors: start.effectors.map(
        (effector: MotionAction.Effector): MotionAction.Effector => ({
          ...structuredClone(effector),
          target: selected.has(identity(effector))
            ? posePoint(points!, effector)
            : lerp(effector.target, goals.get(identity(effector))!.target),
        }),
      ),
      phase: "retraction",
      elapsed,
      progress,
    };
  }
}

/** Match semantic point identity rather than the caller's current array order. */
function identity(
  effector: Readonly<
    Pick<
      MotionAction.Effector,
      "bone" | "localPoint" | "role" | "constraint" | "radius"
    >
  >,
): string {
  return JSON.stringify([
    effector.bone,
    effector.localPoint ?? null,
    effector.role,
    effector.constraint ?? "hard",
    effector.radius,
  ]);
}

/** Read one internal witness from the same clinical pose in requested-root local metres. */
function posePoint(
  points: Map<string, AutoMovieHumanSkeleton.IPlacement>,
  effector: MotionAction.Effector,
): MotionAction.Vec3 {
  const placement: AutoMovieHumanSkeleton.IPlacement | undefined = points.get(
    effector.bone,
  );
  if (!placement)
    throw new Error(`Internal return FK has no bone ${effector.bone}`);
  const local: MotionAction.Vec3 = effector.localPoint ?? [0, 0, 0];
  const rotation: [number, number, number, number] = placement.rotation;
  const rotated: ReturnType<typeof Quaternion.rotateVector> =
    Quaternion.rotateVector(
      { x: rotation[0], y: rotation[1], z: rotation[2], w: rotation[3] },
      { x: local[0], y: local[1], z: local[2] },
    );
  return [
    placement.position[0] + rotated.x,
    placement.position[1] + rotated.y,
    placement.position[2] + rotated.z,
  ];
}
