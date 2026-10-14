import { retargetHumanoidMotion } from "@automovie/engine";
import type { IAutoMovieMotion, IAutoMovieSkeleton, IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import {
  validationHasNoWarnings,
  validationHasWarning,
  validationHasWarningCount,
  vclose,
} from "../internal/predicates";
import {
  keyframeWorld,
  mapped,
  proportionedRig,
  rootShiftClip,
} from "../internal/retargetRigs";

/** Distance between a resolved effector and the contact it should hold. */
const missBy: (a: IAutoMovieVector3, b: IAutoMovieVector3) => number = (
  a: IAutoMovieVector3,
  b: IAutoMovieVector3,
): number => Math.hypot(a.x - b.x, a.y - b.y, a.z - b.z);

/**
 * Observe advisory residuals under the synthetic target's shipped ROM, including strict improvement over disabled correction and a warning-free wider-budget twin. The bounded fitting search and sampled FK do not prove physical impossibility or a globally minimal residual.
 *
 * The rig uses the same 1.5 leg/0.9 torso proportions as the wide-hip tracking case, with shipped humanoid ROM instead of the explicit override. The test observes the retained correction and advisory shortfall; no harness acceptance decision or exhaustive feasibility search runs here.
 *
 * Scenarios:
 *
 * 1. The retarget succeeds (`validation.success` is true and `motion` is non-null)
 *    while carrying one `physics` warning per foot, located on the keyframe and
 *    effector that missed by the most.
 * 2. The residual it warns about is real: the pinned foot still misses its mapped
 *    contact by more than the 0.02 * rootScale contact budget.
 * 3. The clamped correction is still an improvement, not damage: the pinned foot
 *    ends closer to the mapped contact than the verbatim angle copy does.
 * 4. Widening contacts.tolerance yields a warning-free result; residual identity between the two runs is not separately asserted.
 *
 * @evidence contracts/testing.md#behavioral-verification Retargets with default ROM and requires two located physics warnings plus non-null motion/characterization, measures the left residual beyond its budget and below the disabled-copy residual, and observes the existing wider-tolerance result without warnings.
 * @evidence contracts/testing.md#independent-expectations Authored proportion/ROM fixtures define the bounded fitting problem, Math.hypot measures the source-mapped coordinate miss independently of warning text, and the explicit 0.02*scale budget must be exceeded. Warning count and paths are literal expectations; shared FK and rootScale characterization remain product consumers. The wider twin does not independently assert identical residual coordinates.
 * @evidence contracts/testing.md#distinguishing-cases Preserves default limited hips versus disabled correction, two effector warnings at key 0, left-foot quantitative improvement and >0.5 disabled miss, plus tolerance 0.5 versus default 0.02. Exact achievable contacts and degenerate chains belong to separate units.
 * @evidence contracts/testing.md#execution-ownership This named synchronous unit owns three retarget calls and resolved-effector observations with the unchanged synthetic rig fixtures. The local distance reader registers no extra case and starts no viewer, process or native artifact.
 */
export function test_motion_retarget_contact_unreachable(): void {
  const source: IAutoMovieSkeleton = proportionedRig("unreachable-source");
  const target: IAutoMovieSkeleton = proportionedRig("unreachable-target", {
    leg: 1.5,
    torso: 0.9,
  });
  const motion: IAutoMovieMotion = rootShiftClip(source.id, { x: 0, y: 0, z: 0.25 });

  // 1. a warning per foot, not a failure.
  const pinned: ReturnType<typeof retargetHumanoidMotion> = retargetHumanoidMotion({ motion, source, target });
  TestValidator.predicate(
    "one plausibility warning per pinned foot",
    validationHasWarningCount(
      "unreachable foot contacts",
      pinned.validation,
      2,
    ),
  );
  if (pinned.motion === null || pinned.characterization === null)
    throw new Error("an unreachable contact must not fail the retarget");
  for (const slot of ["leftFoot", "rightFoot"] as const)
    TestValidator.predicate(
      `${slot} reports its residual on the keyframe that missed most`,
      validationHasWarning(
        `${slot} unreachable contact`,
        pinned.validation,
        "physics",
        `$input.motion.keyframes[0].pose.joints["${slot}"]`,
      ),
    );

  // 2. the residual is beyond the contact budget it names.
  const scale: number = pinned.characterization.rootScale;
  const contact: IAutoMovieVector3 = mapped(keyframeWorld(source, motion, 0, "leftFoot"), scale);
  const residual: number = missBy(
    keyframeWorld(target, pinned.motion, 0, "leftFoot"),
    contact,
  );
  TestValidator.predicate(
    "the reported residual exceeds the contact budget",
    residual > 0.02 * scale,
  );

  // 3. the clamped correction still beats carrying the angles verbatim.
  const carried: ReturnType<typeof retargetHumanoidMotion> = retargetHumanoidMotion({
    motion,
    source,
    target,
    contacts: { enabled: false },
  });
  if (carried.motion === null) throw new Error("carried retarget failed");
  TestValidator.predicate(
    "a ROM-bound correction still closes part of the gap",
    residual <
      missBy(keyframeWorld(target, carried.motion, 0, "leftFoot"), contact),
  );
  TestValidator.predicate(
    "the verbatim copy is the one that misses by more than half a unit",
    vclose(
      keyframeWorld(target, carried.motion, 0, "leftFoot"),
      contact,
      0.5,
    ) === false,
  );

  // 4. a wider contact tolerance widens the budget the residual is judged by.
  const tolerant: ReturnType<typeof retargetHumanoidMotion> = retargetHumanoidMotion({
    motion,
    source,
    target,
    contacts: { tolerance: 0.5 },
  });
  TestValidator.predicate(
    "a wider contact budget stops reporting the same residual",
    validationHasNoWarnings("tolerant retarget contact", tolerant.validation),
  );
  if (tolerant.motion === null) throw new Error("tolerant retarget failed");
}
