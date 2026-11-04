import {
  AutoMovieHumanGrounding as Grounding,
  type IAutoMovieHumanPose,
  type AutoMovieHumanSkeleton as Skeleton,
  type AutoMovieHumanSupportFrame as Support,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * Static inspection measures the exact supplied state with no optimization controls.
 *
 * Scenarios:
 * 1. A translated quarter-turn root retains exact WORLD targets and a lower non-target foot point.
 * 2. Independent target and full-population floor violations preserve their native failure reason.
 * 3. Empty hard targets still inspect all geometry, while pose and root stay unchanged.
 * 4. Empty channels remain invalid for fitting, and inspection retains normal input guards.
 * 5. Clamp receipts remain visible even when no channels are selected for bound inspection.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls public Grounding.prepare().inspect with zero controls and independently specified rigid geometry. Checks actual WORLD residuals, complete-cloud floor, zero iterations, one FK evaluation per inspection, immutable inputs and native admission or refusal. The callable fitting API must still reject zero controls.
 * @evidence contracts/testing.md#independent-expectations The fixture places its left foot at X=kneeDegrees/100, Y=1 and its right foot at X=1, Y=1. A quarter-turn yaw maps local X to negative WORLD Z. Root [2,.025,-3] puts the left sole at [2,.025,-3.25] and the separate right sole at [2,0,-4]. A2mm target offset and4mm root drop produce independent measured failures without fitting.
 * @evidence contracts/testing.md#distinguishing-cases Covers empty and singleton channel sets, empty targets, nonidentity root rotation, a lower unselected source bone, soft-goal separation, selected clamp refusal, unselected clamp receipt visibility, malformed targets, duplicate channels, invalid work budgets and source/result alias isolation. Existing full-foot geometry tests and the production host own actual polygon construction and whole-pose clamp admission.
 * @evidence contracts/testing.md#execution-ownership One synchronous portable root unit invokes the public Human API with an arithmetic FK fixture and in-memory source points. It starts no process, browser, GPU or native build and changes no foreign method.
 */
export function test_human_grounding_static_inspection(): void {
  let evaluations: number = 0;
  const evaluate: Skeleton.PoseEvaluator = (
    pose: IAutoMovieHumanPose = {},
  ): Skeleton.IOutput => {
    ++evaluations;
    return geometry(pose);
  };
  const feet: Support.IPoint[] = [
    { bone: "leftFoot", localPoint: [0, -1, 0] },
    { bone: "leftFoot", localPoint: [0.2, -0.9, 0] },
    { bone: "rightFoot", localPoint: [0, -1.025, 0] },
  ];
  const inspect: Grounding.IPrepared = Grounding.prepare(evaluate, feet);
  const pose: IAutoMovieHumanPose = {
    legs: { left: { knee: { flexion: 25 } }, right: {} },
  };
  const root: Grounding.IRoot = {
    translation: [2, 0.025, -3],
    rotation: [0, Math.SQRT1_2, 0, Math.SQRT1_2],
  };
  const request: Grounding.IRequest = {
    channels: [],
    targets: [
      { bone: "leftFoot", localPoint: [0, -1, 0], position: [2, 0.025, -3.25] },
    ],
    softTargets: [
      { bone: "rightFoot", localPoint: [0, -1.025, 0], position: [2.5, 0, -4] },
    ],
  };
  const original: string = JSON.stringify({ pose, root, request, feet });
  const admitted: Grounding.IResult = inspect.inspect(pose, root, request);
  TestValidator.equals(
    "fixed state admits without control selection",
    admitted.status,
    "admitted",
  );
  TestValidator.equals(
    "native successful inspection reason",
    admitted.reason,
    "converged",
  );
  TestValidator.predicate(
    "WORLD target and full-cloud minimum are exact",
    nclose(admitted.supportError, 0, 1e-12) &&
      nclose(admitted.floorMinimum, 0, 1e-12),
  );
  TestValidator.predicate(
    "unreachable soft goal stays separately measured",
    nclose(admitted.softError, 0.5, 1e-12),
  );
  TestValidator.equals("one FK, no optimization", evaluations, 1);
  TestValidator.equals("inspection iteration count", admitted.iterations, 0);
  TestValidator.equals(
    "pose is retained exactly",
    JSON.stringify(admitted.pose),
    JSON.stringify(pose),
  );
  TestValidator.equals(
    "root is retained exactly despite default vertical solver axis",
    JSON.stringify(admitted.root),
    JSON.stringify(root),
  );

  const missed: Grounding.IResult = inspect.inspect(pose, root, {
    ...request,
    targets: [
      {
        bone: "leftFoot",
        localPoint: [0, -1, 0],
        position: [2.002, 0.025, -3.25],
      },
    ],
  });
  TestValidator.equals(
    "fixed WORLD target failure is not fitted away",
    missed.status,
    "unresolved",
  );
  TestValidator.equals(
    "target failure preserves native reason",
    missed.reason,
    "constraints-violated",
  );
  TestValidator.predicate(
    "independent target residual",
    nclose(missed.supportError, 0.002, 1e-12) &&
      nclose(missed.floorMinimum, 0, 1e-12),
  );
  TestValidator.equals(
    "failed target inspection has no iterations",
    missed.iterations,
    0,
  );

  const lowered: Grounding.IRoot = {
    translation: [2, 0.021, -3],
    rotation: [...root.rotation],
  };
  const penetrated: Grounding.IResult = inspect.inspect(pose, lowered, {
    ...request,
    targets: [
      { bone: "leftFoot", localPoint: [0, -1, 0], position: [2, 0.021, -3.25] },
    ],
  });
  TestValidator.equals(
    "non-target source bone still constrains the floor",
    penetrated.status,
    "unresolved",
  );
  TestValidator.equals(
    "floor failure preserves native reason",
    penetrated.reason,
    "constraints-violated",
  );
  TestValidator.predicate(
    "target remains satisfied while whole cloud penetrates",
    nclose(penetrated.supportError, 0, 1e-12) &&
      nclose(penetrated.floorMinimum, -0.004, 1e-12) &&
      nclose(penetrated.error, 0.004, 1e-12),
  );
  TestValidator.equals(
    "floor failure has no iterations",
    penetrated.iterations,
    0,
  );
  const floorOnly: Grounding.IResult = inspect.inspect(pose, lowered, {
    channels: [],
    targets: [],
  });
  TestValidator.equals(
    "empty targets do not skip the floor population",
    floorOnly.status,
    "unresolved",
  );
  TestValidator.predicate(
    "empty-target inspection measures the same lower vertex",
    nclose(floorOnly.floorMinimum, -0.004, 1e-12),
  );

  const clampedPose: IAutoMovieHumanPose = {
    legs: { left: { knee: { flexion: 25, rotation: 99 } }, right: {} },
  };
  const unselected: Grounding.IResult = inspect.inspect(
    clampedPose,
    root,
    request,
  );
  TestValidator.equals(
    "unselected clinical clamp receipt remains visible",
    unselected.output.clamped.length,
    1,
  );
  TestValidator.predicate(
    "unselected clamp is not silently normalized",
    nclose(unselected.pose.legs!.left.knee!.rotation!, 99, 0),
  );
  const selected: Grounding.IResult = inspect.inspect(clampedPose, root, {
    ...request,
    channels: ["legs.left.knee.rotation"],
  });
  TestValidator.equals(
    "existing selected clamp admission is unchanged",
    selected.status,
    "unresolved",
  );
  TestValidator.equals(
    "selected clamp preserves inspection reason",
    selected.reason,
    "constraints-violated",
  );
  TestValidator.equals(
    "all six inspections evaluate once each",
    evaluations,
    6,
  );

  TestValidator.predicate(
    "fit still requires at least one clinical control",
    throwsError(
      (): unknown => inspect(pose, root, request),
      "Grounding controls",
    ),
  );
  const invalid: Grounding.IRequest[] = [
    { ...request, iterations: 0 },
    { ...request, iterations: 17 },
    { ...request, tolerance: 0 },
    { ...request, floorTolerance: -1 },
    {
      ...request,
      channels: ["legs.left.knee.flexion", "legs.left.knee.flexion"],
    },
    { ...request, targets: [{ bone: "leftFoot", position: [NaN, 0, 0] }] },
  ];
  for (const candidate of invalid)
    TestValidator.predicate(
      "static inspection retains common input guards",
      throwsError(
        (): unknown => inspect.inspect(pose, root, candidate),
        "Grounding controls",
      ),
    );
  TestValidator.equals(
    "rejected requests do not evaluate or fit",
    evaluations,
    6,
  );
  TestValidator.equals(
    "pose, root, targets and source geometry are unchanged",
    JSON.stringify({ pose, root, request, feet }),
    original,
  );

  admitted.pose.legs!.left.knee!.flexion = 90;
  admitted.root.translation[1] = 100;
  TestValidator.equals(
    "returned pose and root cannot mutate caller state",
    JSON.stringify({ pose, root, request, feet }),
    original,
  );
}

/** Analytic rigid FK retains a visible selected-clamp receipt without changing fixture geometry. */
function geometry(pose: IAutoMovieHumanPose): Skeleton.IOutput {
  const rotation: number = pose.legs?.left.knee?.rotation ?? 0;
  return {
    bones: [
      {
        bone: "leftFoot",
        parent: null,
        position: [0, 1, 0],
        tip: null,
        radius: 0.01,
      },
      {
        bone: "rightFoot",
        parent: null,
        position: [1, 1, 0],
        tip: null,
        radius: 0.01,
      },
    ],
    posed: [
      {
        bone: "leftFoot",
        position: [(pose.legs?.left.knee?.flexion ?? 0) / 100, 1, 0],
        rotation: [0, 0, 0, 1],
      },
      { bone: "rightFoot", position: [1, 1, 0], rotation: [0, 0, 0, 1] },
    ],
    clamped:
      rotation === 99
        ? [{ path: "legs.left.knee.rotation", requested: 99, applied: 0 }]
        : [],
  };
}
