import {
  AutoMovieHumanSkeleton,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { HumanPeople } from "../internal/HumanPeople";
import { nclose, throwsError } from "../internal/predicates";

/**
 * Fixed-bone FK retains clinical dependencies, complete clamps and owned snapshots.
 *
 * Scenarios:
 * 1. Every single bone agrees under nonneutral girdle, hand, jaw and leg controls.
 * 2. Sparse queries survive changed ancestors, mutation and unselected knee clamps.
 * 3. A ninety-degree hip hinge obeys an independent rigid-segment expectation.
 * 4. Public rest/neck snapshots stay independent and invalid selections refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Uses the real public prepared evaluator and its fixed-bone capability for every bone, overlapping selections and repeated mutable poses. It catches omitted ancestor/girdle/forearm dependencies, lost unselected clamps and shared mutable output buffers.
 * @evidence contracts/testing.md#independent-expectations A neutral downward thigh rotated ninety degrees about its clinical Z flexion axis must point forward with unchanged length; every other rigid parent-child segment keeps its neutral length except the explicitly translating jaw. Full/projection agreement proves transport and reuse equivalence, not independent anatomical accuracy; the operator separately compares retained geometry/rest data.
 * @evidence contracts/testing.md#distinguishing-cases Covers singleton and all-bone selections, duplicate names, missing/empty refusals, changed pelvis/arm/hand branches, caller mutation of pose/name/output objects, unselected conditional knee clamps, unclamped mode, shared frozen foot data and separately copied neck/rest outputs.
 * @evidence contracts/testing.md#execution-ownership One discoverable synchronous root unit reuses HumanPeople calibration and CPU FK only, with no process, browser, renderer or GPU.
 */
export function test_human_prepared_projection(): void {
  const person: HumanPeople.IPerson = HumanPeople.person("m1");
  const evaluate: AutoMovieHumanSkeleton.PoseEvaluator =
    AutoMovieHumanSkeleton.prepare(person.params, {
      calibration: person.body,
      neckSurface: true,
      footSurface: true,
    });
  if (!evaluate.project)
    throw new Error("Prepared Human FK must expose projections");
  const neutral: AutoMovieHumanSkeleton.IOutput = evaluate({});
  const neutralSaved: string = JSON.stringify(neutral);
  const pose: IAutoMovieHumanPose = {
    pelvis: { rotation: 23 },
    arms: {
      left: {
        shoulder: { flexion: 65, abduction: 110 },
        elbow: { flexion: 80 },
        forearm: { pronation: 40 },
        hand: { index: { mcpFlexion: 35 } },
      },
      right: { shoulder: { abduction: 85 }, elbow: { flexion: 25 } },
    },
    legs: {
      left: { hip: { flexion: 35 }, knee: { flexion: 45, rotation: 70 } },
      right: { knee: { flexion: 0, rotation: 20 } },
    },
    head: { jaw: { lateralExcursion: 2 } },
  };
  const complete: AutoMovieHumanSkeleton.IOutput = evaluate(pose);
  const completeSaved: string = JSON.stringify(complete);
  for (const placement of complete.posed) {
    const one: AutoMovieHumanSkeleton.IProjection = evaluate.project([
      placement.bone,
    ])(pose);
    TestValidator.equals(
      "singleton identity",
      one.posed.map(
        (row: AutoMovieHumanSkeleton.IPlacement): string => row.bone,
      ),
      [placement.bone],
    );
    same("every nonneutral singleton", one.posed[0]!, placement);
    TestValidator.equals(
      "singleton retains all clamp identities",
      one.clamped.map((row: AutoMovieHumanSkeleton.IClamp): string => row.path),
      complete.clamped.map(
        (row: AutoMovieHumanSkeleton.IClamp): string => row.path,
      ),
    );
  }
  const all: AutoMovieHumanSkeleton.IProjection = evaluate.project(
    complete.posed.map(
      (row: AutoMovieHumanSkeleton.IPlacement): string => row.bone,
    ),
  )(pose);
  all.posed.forEach(
    (row: AutoMovieHumanSkeleton.IPlacement, index: number): void =>
      same("complete projection", row, complete.posed[index]!),
  );

  const names: string[] = [
    "leftHand",
    "leftScapula",
    "leftIndexIntermediate",
    "leftHalluxDistal",
    "leftHand",
  ];
  const sparse: AutoMovieHumanSkeleton.ProjectionEvaluator =
    evaluate.project(names);
  names[0] = "not-a-bone";
  const first: AutoMovieHumanSkeleton.IProjection = sparse(pose);
  const firstSaved: string = JSON.stringify(first);
  pose.arms!.left.forearm!.pronation = -30;
  pose.arms!.left.shoulder!.abduction = 20;
  pose.pelvis!.rotation = -17;
  const changed: AutoMovieHumanSkeleton.IProjection = sparse(pose);
  const changedFull: AutoMovieHumanSkeleton.IOutput = evaluate(pose);
  changed.posed.forEach((row: AutoMovieHumanSkeleton.IPlacement): void =>
    same("changed coupled branch", row, joint(changedFull, row.bone)),
  );
  TestValidator.predicate(
    "hand dependency changes orientation",
    joint(first, "leftHand").rotation.some(
      (value: number, index: number): boolean =>
        !nclose(value, joint(changed, "leftHand").rotation[index]!, 1e-8),
    ),
  );
  TestValidator.equals(
    "earlier projection remains owned",
    JSON.stringify(first),
    firstSaved,
  );
  first.posed[0]!.position[0] = 999;
  first.posed[0]!.rotation[0] = 999;
  first.clamped[0]!.applied = 999;
  sparse(pose).posed.forEach((row: AutoMovieHumanSkeleton.IPlacement): void =>
    same(
      "projection mutation cannot poison kernel",
      row,
      joint(changedFull, row.bone),
    ),
  );
  TestValidator.predicate(
    "nonselected extended knee is still clamped",
    sparse(pose).clamped.some(
      (row: AutoMovieHumanSkeleton.IClamp): boolean =>
        row.path === "legs.right.knee.rotation" && row.applied === 0,
    ),
  );
  TestValidator.equals(
    "unclamped projection stays unclamped",
    sparse(pose, false).clamped.length,
    0,
  );
  const free: AutoMovieHumanSkeleton.IOutput = evaluate(pose, false);
  sparse(pose, false).posed.forEach(
    (row: AutoMovieHumanSkeleton.IPlacement): void =>
      same("unclamped projection values", row, joint(free, row.bone)),
  );

  // The canonical half-share forearm law carries thirty degrees at the elbow
  // and the full sixty at the wrist, regardless of the hand's bind orientation.
  const twist: AutoMovieHumanSkeleton.ProjectionEvaluator = evaluate.project([
    "leftLowerArm",
    "leftHand",
  ]);
  const untwisted: AutoMovieHumanSkeleton.IProjection = twist({});
  const twisted: AutoMovieHumanSkeleton.IProjection = twist({
    arms: { left: { forearm: { pronation: 60 } }, right: {} },
  });
  TestValidator.predicate(
    "forearm carries half the clinical twist",
    nclose(
      angle(joint(untwisted, "leftLowerArm"), joint(twisted, "leftLowerArm")),
      30,
      1e-9,
    ),
  );
  TestValidator.predicate(
    "hand receives its parent's remaining twist",
    nclose(
      angle(joint(untwisted, "leftHand"), joint(twisted, "leftHand")),
      60,
      1e-9,
    ),
  );

  for (const bone of neutral.bones) {
    if (bone.parent === null || bone.bone === "jaw") continue;
    const before: number = distance(
      joint(neutral, bone.bone),
      joint(neutral, bone.parent),
    );
    const after: number = distance(
      joint(complete, bone.bone),
      joint(complete, bone.parent),
    );
    TestValidator.predicate(
      "rigid anatomical segment length",
      nclose(before, after, 1e-12),
    );
  }
  const hinge: AutoMovieHumanSkeleton.IProjection = evaluate.project([
    "leftUpperLeg",
    "leftLowerLeg",
  ])({ legs: { left: { hip: { flexion: 90 } }, right: {} } });
  const thigh: number = distance(
    joint(neutral, "leftUpperLeg"),
    joint(neutral, "leftLowerLeg"),
  );
  const hip: AutoMovieHumanSkeleton.IPlacement = joint(hinge, "leftUpperLeg");
  const knee: AutoMovieHumanSkeleton.IPlacement = joint(hinge, "leftLowerLeg");
  TestValidator.predicate(
    "clinical ninety-degree flexion points forward",
    nclose(knee.position[0] - hip.position[0], thigh, 1e-12),
  );
  TestValidator.predicate(
    "clinical ninety-degree flexion is horizontal",
    nclose(knee.position[1], hip.position[1], 1e-12),
  );

  TestValidator.equals(
    "earlier full snapshot survives projected trials",
    JSON.stringify(complete),
    completeSaved,
  );
  TestValidator.equals(
    "neutral snapshot survives all evaluations",
    JSON.stringify(neutral),
    neutralSaved,
  );
  complete.bones[0]!.position[0] = 999;
  complete.posed[0]!.rotation[0] = 999;
  complete.neckSurface!.sections[0]!.points[0]![0] = 999;
  const restored: AutoMovieHumanSkeleton.IOutput = evaluate({});
  TestValidator.equals(
    "rest and neck remain independently copied",
    JSON.stringify(restored),
    neutralSaved,
  );
  TestValidator.predicate(
    "canonical foot descriptor retains immutable sharing",
    restored.footSurface === neutral.footSurface &&
      Object.isFrozen(restored.footSurface),
  );
  TestValidator.predicate(
    "missing projection bone refuses",
    throwsError((): void => {
      evaluate.project!(["missing"]);
    }),
  );
  TestValidator.predicate(
    "empty projection refuses",
    throwsError((): void => {
      evaluate.project!([]);
    }),
  );
}

/** Find an exact requested joint without treating missing output as neutral. */
function joint(
  output: AutoMovieHumanSkeleton.IProjection,
  bone: string,
): AutoMovieHumanSkeleton.IPlacement {
  const row: AutoMovieHumanSkeleton.IPlacement | undefined = output.posed.find(
    (value: AutoMovieHumanSkeleton.IPlacement): boolean => value.bone === bone,
  );
  if (!row) throw new Error(`Missing projection test joint ${bone}`);
  return row;
}

/** Compare all observable transform components at a tight arithmetic tolerance. */
function same(
  label: string,
  actual: AutoMovieHumanSkeleton.IPlacement,
  expected: AutoMovieHumanSkeleton.IPlacement,
): void {
  TestValidator.equals(`${label}: identity`, actual.bone, expected.bone);
  [...actual.position, ...actual.rotation].forEach(
    (value: number, index: number): void =>
      TestValidator.predicate(
        label,
        nclose(
          value,
          [...expected.position, ...expected.rotation][index]!,
          1e-12,
        ),
      ),
  );
}

/** Independent Euclidean segment length in the public metre frame. */
function distance(
  a: AutoMovieHumanSkeleton.IPlacement,
  b: AutoMovieHumanSkeleton.IPlacement,
): number {
  return Math.hypot(
    a.position[0] - b.position[0],
    a.position[1] - b.position[1],
    a.position[2] - b.position[2],
  );
}

/** Independent relative angle of unit rotations, invariant under a fixed bind turn. */
function angle(
  a: AutoMovieHumanSkeleton.IPlacement,
  b: AutoMovieHumanSkeleton.IPlacement,
): number {
  const dot: number = a.rotation.reduce(
    (sum: number, value: number, index: number): number =>
      sum + value * b.rotation[index]!,
    0,
  );
  return (2 * Math.acos(Math.min(1, Math.abs(dot))) * 180) / Math.PI;
}
