import {
  AutoMovieHumanSkeleton,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { HumanPeople } from "../internal/HumanPeople";
import { nclose } from "../internal/nclose";

/**
 * Prepared FK retains independent complete snapshots across changing branches.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the real public body evaluator across neutral, articulated, mutated-input, conditional-clamp and changed-ancestor poses. It compares every transform with a separately prepared cold evaluator and verifies prior outputs survive later evaluation/caller mutation.
 * @evidence contracts/testing.md#independent-expectations Rigid parent-child segment lengths remain invariant under articulation; changing only the left elbow must move its hand while the right hand stays fixed. Canonical extended-knee tibial rotation is zero and bent-knee rotation is capped at35 degrees. Cold/warm equality checks reuse invariance, not anatomical accuracy by itself.
 * @evidence contracts/testing.md#distinguishing-cases Includes omitted versus explicit neutral, fingers, jaw translation, shoulder rhythm, forearm twist, a mutable input object, both independent limbs and a shared pelvis ancestor; full geometry and rendered motion are separate obligations.
 * @evidence contracts/testing.md#execution-ownership One synchronous root unit reuses the immutable HumanPeople calibration and prepares CPU evaluators only; no browser, image, server or GPU is started.
 */
export function test_human_prepared_fk_snapshots(): void {
  const person: HumanPeople.IPerson = HumanPeople.person("m1");
  const evaluate: AutoMovieHumanSkeleton.PoseEvaluator =
    AutoMovieHumanSkeleton.prepare(person.params, { calibration: person.body });
  const neutral: AutoMovieHumanSkeleton.IOutput = evaluate({});
  const saved: string = JSON.stringify(neutral);
  const pose: IAutoMovieHumanPose = {
    arms: {
      left: {
        shoulder: { flexion: 65, abduction: 110 },
        elbow: { flexion: 80 },
        forearm: { pronation: 40 },
        hand: { index: { mcpFlexion: 35 } },
      },
      right: {},
    },
    legs: { left: {}, right: { knee: { flexion: 120, rotation: 70 } } },
    head: { jaw: { lateralExcursion: 2 } },
  };
  const made: AutoMovieHumanSkeleton.IOutput = evaluate(pose);
  const cold: AutoMovieHumanSkeleton.IOutput = AutoMovieHumanSkeleton.prepare(
    person.params,
    { calibration: person.body },
  )(pose);
  same("warm/cold full transform", made, cold);
  TestValidator.equals(
    "old complete snapshot is stable",
    JSON.stringify(neutral),
    saved,
  );
  TestValidator.predicate(
    "bent tibial rotation keeps canonical35 cap",
    made.clamped.some(
      (row: AutoMovieHumanSkeleton.IClamp): boolean =>
        row.path === "legs.right.knee.rotation" && row.applied === 35,
    ),
  );

  const oldHand: [number, number, number] = [
    ...joint(made, "leftHand").position,
  ];
  const other: [number, number, number] = [
    ...joint(made, "rightHand").position,
  ];
  pose.arms!.left.elbow!.flexion = 110;
  const moved: AutoMovieHumanSkeleton.IOutput = evaluate(pose);
  TestValidator.predicate(
    "mutated input moves left effector",
    Math.hypot(
      ...joint(moved, "leftHand").position.map(
        (value: number, index: number): number => value - oldHand[index]!,
      ),
    ) > 0.05,
  );
  joint(moved, "rightHand").position.forEach(
    (value: number, index: number): void =>
      TestValidator.predicate(
        "unaffected opposite branch",
        nclose(value, other[index]!, 1e-12),
      ),
  );
  TestValidator.equals(
    "older articulated output remains independent",
    JSON.stringify(made),
    JSON.stringify(cold),
  );

  made.posed[0]!.position[0] = 999;
  made.bones[0]!.position[0] = 999;
  const repeated: AutoMovieHumanSkeleton.IOutput = evaluate(pose);
  same("caller mutation cannot poison cache", repeated, moved);
  const ancestor: AutoMovieHumanSkeleton.IOutput = evaluate({
    ...pose,
    pelvis: { rotation: 30 },
  });
  for (const pair of [
    ["leftUpperArm", "leftLowerArm"],
    ["rightLowerLeg", "rightFoot"],
  ]) {
    const first: number = Math.hypot(
      ...joint(moved, pair[0]!).position.map(
        (value: number, index: number): number =>
          value - joint(moved, pair[1]!).position[index]!,
      ),
    );
    const second: number = Math.hypot(
      ...joint(ancestor, pair[0]!).position.map(
        (value: number, index: number): number =>
          value - joint(ancestor, pair[1]!).position[index]!,
      ),
    );
    TestValidator.predicate(
      "changed ancestor preserves measured segment",
      nclose(first, second, 1e-12),
    );
  }
  const straight: AutoMovieHumanSkeleton.IOutput = evaluate({
    legs: { left: {}, right: { knee: { flexion: 0, rotation: 35 } } },
  });
  TestValidator.predicate(
    "conditional clamp invalidates cached bent rotation",
    straight.clamped.some(
      (row: AutoMovieHumanSkeleton.IClamp): boolean =>
        row.path === "legs.right.knee.rotation" && row.applied === 0,
    ),
  );
  const free: AutoMovieHumanSkeleton.IOutput = evaluate(pose, false);
  same(
    "unclamped debug evaluation",
    free,
    AutoMovieHumanSkeleton.prepare(person.params, { calibration: person.body })(
      pose,
      false,
    ),
  );
  TestValidator.equals(
    "unclamped mode remains available",
    free.clamped.length,
    0,
  );
  same("neutral restoration", evaluate({}), neutral);
}

/** Resolve the exact full public effector placement; missing bones fail the case. */
function joint(
  output: AutoMovieHumanSkeleton.IOutput,
  bone: string,
): AutoMovieHumanSkeleton.IPlacement {
  const row: AutoMovieHumanSkeleton.IPlacement | undefined = output.posed.find(
    (value: AutoMovieHumanSkeleton.IPlacement): boolean => value.bone === bone,
  );
  if (!row) throw new Error(`Missing test effector ${bone}`);
  return row;
}
/** Compare every public placement coordinate and rotation, not selected pose fields. */
function same(
  label: string,
  actual: AutoMovieHumanSkeleton.IOutput,
  expected: AutoMovieHumanSkeleton.IOutput,
): void {
  TestValidator.equals(`${label}:bones`, actual.bones, expected.bones);
  TestValidator.equals(`${label}:clamps`, actual.clamped, expected.clamped);
  TestValidator.equals(
    `${label}:count`,
    actual.posed.length,
    expected.posed.length,
  );
  actual.posed.forEach(
    (row: AutoMovieHumanSkeleton.IPlacement, index: number): void => {
      TestValidator.equals(
        `${label}:identity`,
        row.bone,
        expected.posed[index]!.bone,
      );
      [...row.position, ...row.rotation].forEach(
        (value: number, coordinate: number): void =>
          TestValidator.predicate(
            label,
            nclose(
              value,
              [
                ...expected.posed[index]!.position,
                ...expected.posed[index]!.rotation,
              ][coordinate]!,
              1e-12,
            ),
          ),
      );
    },
  );
}
