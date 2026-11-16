import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  type IAutoMovieResolvedBone,
  type IAutoMovieRestFrame,
  preparePoseResolution,
  resolvePose,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMoviePose,
} from "@automovie/interface";
import { type IHumanBody } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { qclose } from "../internal/qclose";
import { qunit } from "../internal/qunit";

/**
 * A warmed exact FK reader still admits a newly supplied clinical frame.
 *
 * Absence means an identity angle map. A supplied empty or null entry is
 * malformed when its clinical coordinate is nonnull, even though optional
 * sign/neutral reads would yield the same undefined scalars as absence.
 * Each case warms only the custom-frame prepared resolvePose path. Calling
 * canonical poseBones between the warm read and the malformed one would
 * replace the last frame tuple and could hide this exact collision.
 *
 * Scenarios:
 * 1. On the actual average Human rig, each of the wrist's F/A/T mappings
 *    can be absent with finite nonzero clinical coordinates. Its prepared
 *    FK remains a finite unit rotation matching public unprepared FK.
 * 2. Replacing that same absent property with an empty object or null must
 *    throw the same first error as unprepared FK. Reflection modifies only
 *    the test's copied frame map to express these malformed runtime inputs.
 * 3. Removing each malformed entry restores valid FK on the same reader;
 *    failure must not be retained as a valid composition or poison recovery.
 *
 * Cold FK is an admission/equivalence control, not an independent geometric
 * oracle. The canonical body, axes, topology, pose and clinical angles remain
 * unchanged. This deferred unit makes no work-count or speed claim.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States absent-versus-supplied frame semantics, nonnull clinical degrees, the last-tuple warm precondition, actual Human provenance, malformed input ownership, recovery and cold-control limits.
 * @evidence contracts/development/testing.md#behavioral-verification Calls public unprepared/prepared resolvePose on the actual canonical rig, warms absent axis frames, observes both malformed forms' actual first errors, then requires valid recovery and positive six-case coverage.
 * @evidence contracts/development/testing.md#independent-expectations The public clinical contract preserves a degree under an absent map and rejects a supplied mapping without valid sign/neutral. Cold FK supplies the exact error class/message for ordered admission; no prepared metadata or stored successful answer supplies that expectation.
 * @evidence contracts/development/testing.md#distinguishing-cases All three nonnull wrist coordinates, absence versus empty/null properties, a directly warmed identical pose without an intervening canonical read, and same-reader recovery distinguish presence-aware admission from scalar-only successful reuse.
 * @evidence contracts/development/testing.md#execution-ownership One deferred CPU unit reads a real polygon Human and owns only copied frames and its pose. It changes no shared rig, global or foreign method, and starts no runner, compiler, renderer or host.
 */
export function test_human_motion_core_pose_resolution_admission(): void {
  const findings: string[] = [];
  const body: IHumanBody = motionHumanBody("m-average");
  const frames: Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>> =
    structuredClone(HUMANOID_REST_FRAME);
  const frame: IAutoMovieRestFrame | undefined = frames.leftHand;
  if (frame === undefined)
    throw new Error("The canonical wrist has no clinical frame fixture");
  const pose: IAutoMoviePose = {
    skeleton: body.skeleton.id,
    root: null,
    joints: [{ bone: "leftHand", flexion: 13, abduction: -4, twist: 9 }],
  };
  const prepared: ReturnType<typeof preparePoseResolution> =
    preparePoseResolution();
  let observed: number = 0;

  /** Capture an actual public FK error without accepting normal completion. */
  function errorOf(task: () => unknown): unknown {
    try {
      task();
    } catch (error) {
      return error;
    }
    return undefined;
  }

  /** Warm this custom frame directly; no canonical consumer overwrites it. */
  function warm(label: string): void {
    const expected: IAutoMovieResolvedBone[] = resolvePose(
      pose,
      body.skeleton,
      HUMANOID_JOINT_AXES,
      frames,
    );
    const actual: IAutoMovieResolvedBone[] = resolvePose(
      pose,
      body.skeleton,
      HUMANOID_JOINT_AXES,
      frames,
      body.topology,
      prepared,
    );
    const wanted: IAutoMovieResolvedBone | undefined = expected.find(
      (bone: IAutoMovieResolvedBone): boolean => bone.bone === "leftHand",
    );
    const shown: IAutoMovieResolvedBone | undefined = actual.find(
      (bone: IAutoMovieResolvedBone): boolean => bone.bone === "leftHand",
    );
    if (
      !(
        actual.length === body.skeleton.bones.length &&
        wanted !== undefined &&
        shown !== undefined &&
        qunit(wanted.worldRotation) &&
        qunit(shown.worldRotation) &&
        qclose(shown.worldRotation, wanted.worldRotation)
      )
    )
      findings.push(`${label}: valid custom-frame FK was not observed`);
  }

  for (const axis of ["flexion", "abduction", "twist"] as const) {
    const original: IAutoMovieRestFrame[typeof axis] = frame[axis];
    try {
      for (const malformed of [{}, null]) {
        const form: string = malformed === null ? "null" : "empty";
        Reflect.deleteProperty(frame, axis);
        warm(`${axis} absent before ${form}`);
        Reflect.set(frame, axis, malformed);
        const expected: unknown = errorOf((): IAutoMovieResolvedBone[] =>
          resolvePose(pose, body.skeleton, HUMANOID_JOINT_AXES, frames),
        );
        const actual: unknown = errorOf((): IAutoMovieResolvedBone[] =>
          resolvePose(
            pose,
            body.skeleton,
            HUMANOID_JOINT_AXES,
            frames,
            body.topology,
            prepared,
          ),
        );
        if (
          !(
            expected instanceof Error &&
            actual instanceof Error &&
            expected.constructor === actual.constructor &&
            expected.message === actual.message
          )
        )
          findings.push(`${axis} ${form}: warmed FK hid ordered admission`);
        Reflect.deleteProperty(frame, axis);
        warm(`${axis} recovered after ${form}`);
        observed++;
      }
    } catch (error) {
      findings.push(`${axis}: ${String(error)}`);
    } finally {
      if (original === undefined) Reflect.deleteProperty(frame, axis);
      else Reflect.set(frame, axis, original);
    }
  }
  if (observed !== 6)
    findings.push(`only ${observed} of six frame-admission cases completed`);
  TestValidator.equals(
    "exact FK reuse preserves frame admission",
    findings,
    [],
  );
}
