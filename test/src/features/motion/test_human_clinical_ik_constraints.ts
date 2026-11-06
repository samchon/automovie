import {
  type IAutoMovieHumanPose,
  AutoMovieHumanClinicalIk as Ik,
  type AutoMovieHumanSkeleton as Skeleton,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * Generic intervals participate in fitting the literal endpoint, including an
 * initially satisfied endpoint whose moving-line constraint is unsatisfied.
 *
 * Scenarios:
 * 1. Plain and prepared FK restore a local point's line offset without replacing the target.
 * 2. Selected-channel bounds intersect ROM; infeasible geometry retains its actual residuals.
 * 3. Sparse channels/descriptors and malformed constraints refuse before any FK capability runs.
 * 4. Moving/rotated lines, descriptor ownership and degenerate lines have independent checks.
 * 5. Positive and negative blocked channel goals preserve the strict applied twelve-degree cap.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls public ClinicalIk with channel and line-offset constraints, checking literal endpoint distance, independent FK plane values, final receipts, ownership and prepared selection. Both signs of an unreachable single-step channel goal must retain the strict actual pose-difference cap. A post-hoc shape test with an unconstrained fit cannot pass the initially satisfied endpoint case.
 * @evidence contracts/testing.md#independent-expectations The fixture's line is parallel to X, its translated origin depends on elbow degrees, and the local point's signed Y offset equals shoulder degrees divided by100. Consequently offset at least .05 and endpoint X1.2 can coexist with shoulder at least5 and elbow (20-shoulder)/1.1; a ninety-degree fixture rotation gives the same scalar in X with normal [-1,0,0]. Neither goal40 nor goal-40 is within twelve degrees of seed4.6, so one update retains an unresolved interval while the actual applied difference remains at most12 without an epsilon allowance.
 * @evidence contracts/testing.md#distinguishing-cases Covers lower/upper/channel intervals, moving origins, local offsets, plain/prepared parity, target-already-met restoration, impossible line bounds, zero-length lines, missing constraint bones, sparse populations, nonunit normals, unselected channels and disjoint ROM. Existing anatomical units retain actual clinical axes and conditional ROM coverage.
 * @evidence contracts/testing.md#execution-ownership One synchronous root unit uses arithmetic FK, the existing Engine QP kernel and portable assertions. It launches no process, browser, renderer, model generation or installation; the complete canonical root invocation owns compilation and execution evidence.
 */
export function test_human_clinical_ik_constraints(): void {
  let full: number = 0;
  let trial: number = 0;
  let selections: number = 0;
  let chosen: readonly string[] = [];
  const plain: Skeleton.PoseEvaluator = (
    pose: IAutoMovieHumanPose = {},
  ): Skeleton.IOutput => geometry(pose);
  const prepared: Skeleton.PoseEvaluator = Object.assign(
    (pose: IAutoMovieHumanPose = {}): Skeleton.IOutput => {
      full++;
      return geometry(pose);
    },
    {
      project: (bones: readonly string[]): Skeleton.ProjectionEvaluator => {
        selections++;
        chosen = [...bones];
        return (pose: IAutoMovieHumanPose = {}): Skeleton.IProjection => {
          trial++;
          return geometry(pose);
        };
      },
    },
  );
  const seed: IAutoMovieHumanPose = {
    arms: {
      left: {
        shoulder: { flexion: 4.6 },
        elbow: { flexion: 14 },
        wrist: { flexion: 7 },
      },
      right: {},
    },
  };
  const plane: Ik.IConstraint = {
    kind: "line-offset",
    point: { bone: "leftLowerArm", localPoint: [0, 0.01, 0] },
    line: { origin: { bone: "leftShoulder" }, end: { bone: "leftHand" } },
    normal: [0, 1, 0],
    minimum: 0.05,
  };
  const request: Ik.IRequest = {
    channels: ["arms.left.shoulder.flexion", "arms.left.elbow.flexion"],
    targets: [{ bone: "leftHand", position: [1.2, 0.3, 0] }],
    constraints: [
      plane,
      {
        kind: "channel",
        channel: "arms.left.elbow.flexion",
        minimum: 8,
        maximum: 16,
      },
    ],
    iterations: 16,
    tolerance: 0.00001,
  };
  const snapshot: string = JSON.stringify({ seed, request });
  TestValidator.predicate(
    "seed already meets the literal target but violates the plane",
    Math.abs(geometry(seed).posed[2]!.position[0] - 1.2) < 1e-12 &&
      seed.arms!.left.shoulder!.flexion! / 100 < 0.05,
  );
  const a: Ik.IResult = Ik.solve(plain, seed, request);
  const b: Ik.IResult = Ik.solve(prepared, seed, request);
  for (const result of [a, b]) {
    const shoulder: number = result.pose.arms!.left.shoulder!.flexion!;
    const elbow: number = result.pose.arms!.left.elbow!.flexion!;
    TestValidator.predicate(
      "literal endpoint and actual offset coexist",
      result.error <= request.tolerance! &&
        shoulder / 100 >= 0.05 &&
        elbow >= 8 &&
        elbow <= 16,
    );
    TestValidator.predicate(
      "independent endpoint equation",
      Math.abs(shoulder / 100 + elbow * 0.011 - 0.2) <= request.tolerance!,
    );
    TestValidator.predicate(
      "honest final constraint receipts",
      result.constraintsSatisfied &&
        result.constraintValues.every(
          (item: { value: number; violation: number }): boolean =>
            item.violation === 0,
        ) &&
        nclose(result.constraintValues[0]!.value, shoulder / 100, 1e-12),
    );
    TestValidator.equals(
      "unselected wrist retained",
      result.pose.arms!.left.wrist!.flexion,
      7,
    );
    TestValidator.predicate("original outer budget", result.iterations <= 16);
  }
  TestValidator.predicate(
    "plain/prepared endpoint parity",
    Math.abs(a.error - b.error) < 1e-12,
  );
  TestValidator.equals("one prepared selection", selections, 1);
  TestValidator.equals("one complete final materialization", full, 1);
  TestValidator.predicate(
    "constraint-only bones selected",
    trial > 0 &&
      chosen.includes("leftLowerArm") &&
      chosen.includes("leftShoulder") &&
      chosen.includes("leftHand"),
  );
  TestValidator.equals(
    "seed and descriptors owned",
    JSON.stringify({ seed, request }),
    snapshot,
  );

  const rotated: Ik.IResult = Ik.solve(
    (pose: IAutoMovieHumanPose = {}): Skeleton.IOutput => geometry(pose, true),
    seed,
    {
      ...request,
      targets: [{ bone: "leftHand", position: [-0.3, 1.2, 0] }],
      constraints: [{ ...plane, normal: [-1, 0, 0] }],
    },
  );
  TestValidator.predicate(
    "same-FK rotated line",
    rotated.constraintsSatisfied &&
      rotated.error <= request.tolerance! &&
      rotated.pose.arms!.left.shoulder!.flexion! >= 5,
  );
  const upper: Ik.IResult = Ik.solve(plain, seed, {
    ...request,
    constraints: [{ ...plane, minimum: undefined, maximum: -0.05 }],
  });
  TestValidator.predicate(
    "upper line bound",
    upper.constraintsSatisfied &&
      upper.error <= request.tolerance! &&
      upper.pose.arms!.left.shoulder!.flexion! <= -5,
  );
  const diagonal: Skeleton.PoseEvaluator = (
    pose: IAutoMovieHumanPose = {},
  ): Skeleton.IOutput => {
    const output: Skeleton.IOutput = geometry(pose);
    output.posed[0]!.position = [1, 0.2, 0];
    output.posed[1]!.position = [1.5, 0.2, 0];
    output.posed[2]!.position = [2, 1.2, 0];
    return output;
  };
  const angled: Ik.IResult = Ik.solve(diagonal, seed, {
    ...request,
    targets: [{ bone: "leftHand", position: [2, 1.2, 0] }],
    constraints: [{ ...plane, minimum: -0.25, maximum: -0.24 }],
  });
  TestValidator.predicate(
    "actual moving endpoint defines the line direction",
    angled.constraintsSatisfied &&
      angled.iterations === 0 &&
      nclose(angled.constraintValues[0]!.value, -0.245, 1e-12),
  );

  const impossible: Ik.IResult = Ik.solve(plain, seed, {
    ...request,
    constraints: [{ ...plane, minimum: 3 }],
  });
  TestValidator.predicate(
    "unresolved interval remains visible",
    !impossible.constraintsSatisfied &&
      impossible.constraintValues[0]!.violation > 0 &&
      impossible.iterations <= 16,
  );
  for (const goal of [40, -40]) {
  const blocked: Ik.IResult = Ik.solve(plain, seed, {
    ...request,
    constraints: [
      {
        kind: "channel",
        channel: "arms.left.shoulder.flexion",
        minimum: goal,
        maximum: goal,
      },
    ],
    iterations: 1,
  });
  TestValidator.predicate(
    "channel interval cannot bypass the original step cap",
    !blocked.constraintsSatisfied &&
      Math.abs(blocked.pose.arms!.left.shoulder!.flexion! -
        seed.arms!.left.shoulder!.flexion!) <=
        12 &&
      blocked.error > request.tolerance!,
  );
  }

  let calls: number = 0;
  const forbidden: Skeleton.PoseEvaluator = Object.assign(
    (pose: IAutoMovieHumanPose = {}): Skeleton.IOutput => {
      calls++;
      return geometry(pose);
    },
    {
      project: (_bones: readonly string[]): Skeleton.ProjectionEvaluator => {
        calls++;
        return plain;
      },
    },
  );
  const holes: unknown[] = new Array(1);
  const coordinateHole: unknown[] = new Array(3);
  coordinateHole[0] = 0;
  coordinateHole[2] = 0;
  for (const channels of [
    holes,
    [undefined],
    null,
    "arms.left.shoulder.flexion",
  ])
    TestValidator.predicate(
      "malformed channels refuse before FK",
      throwsError(
        (): unknown =>
          Ik.solve(forbidden, seed, {
            ...request,
            channels,
          } as unknown as Ik.IRequest),
        "Clinical IK",
      ),
    );
  const malformed: unknown[] = [
    holes,
    [null],
    [undefined],
    [{}],
    [{ ...plane, minimum: undefined }],
    [{ ...plane, minimum: NaN }],
    [{ ...plane, minimum: 0.1, maximum: 0 }],
    [{ ...plane, normal: [0, 2, 0] }],
    [{ ...plane, normal: coordinateHole }],
    [{ ...plane, point: { bone: "leftLowerArm", localPoint: coordinateHole } }],
    [{ ...plane, line: null }],
    [{ kind: "unknown", minimum: 0 }],
    [{ kind: "channel", channel: "arms.right.elbow.flexion", minimum: 0 }],
    [{ kind: "channel", channel: "arms.left.elbow.flexion", minimum: 200 }],
  ];
  for (const constraints of malformed)
    TestValidator.predicate(
      "malformed constraints refuse before FK",
      throwsError(
        (): unknown =>
          Ik.solve(forbidden, seed, {
            ...request,
            constraints,
          } as unknown as Ik.IRequest),
        "Clinical IK",
      ),
    );
  TestValidator.equals(
    "static refusal invokes no evaluator capability",
    calls,
    0,
  );
  const coincident: Ik.IConstraint = {
    ...plane,
    line: { origin: { bone: "leftShoulder" }, end: { bone: "leftShoulder" } },
  };
  TestValidator.predicate(
    "degenerate actual line refuses",
    throwsError(
      (): unknown =>
        Ik.solve(plain, seed, { ...request, constraints: [coincident] }),
      "Clinical IK",
    ),
  );
  TestValidator.predicate(
    "missing constraint bone refuses",
    throwsError(
      (): unknown =>
        Ik.solve(
          (pose: IAutoMovieHumanPose = {}): Skeleton.IOutput => {
            const output: Skeleton.IOutput = geometry(pose);
            output.posed = output.posed.filter(
              (item: Skeleton.IPlacement): boolean =>
                item.bone !== "leftLowerArm",
            );
            return output;
          },
          seed,
          request,
        ),
      "Clinical IK",
    ),
  );
  TestValidator.equals(
    "failed admissions retain caller state",
    JSON.stringify({ seed, request }),
    snapshot,
  );
}

/** Explicit translated X line; local point Y offset is shoulder degrees /100. */
function geometry(
  pose: IAutoMovieHumanPose,
  rotated: boolean = false,
): Skeleton.IOutput {
  const shoulder: number = pose.arms?.left.shoulder?.flexion ?? 0;
  const elbow: number = pose.arms?.left.elbow?.flexion ?? 0;
  const origin: number = 1 + elbow / 1000;
  const placements: Skeleton.IPlacement[] = [
    {
      bone: "leftShoulder",
      position: [origin, 0.3, 0],
      rotation: [0, 0, 0, 1],
    },
    {
      bone: "leftLowerArm",
      position: [origin + 0.5, 0.29 + shoulder / 100, 0],
      rotation: [0, 0, 0, 1],
    },
    {
      bone: "leftHand",
      position: [origin + (shoulder + elbow) / 100, 0.3, 0],
      rotation: [0, 0, 0, 1],
    },
  ];
  if (rotated)
    for (const item of placements) {
      item.position = [-item.position[1], item.position[0], item.position[2]];
      item.rotation = [0, 0, Math.SQRT1_2, Math.SQRT1_2];
    }
  return {
    bones: placements.map(
      (item: Skeleton.IPlacement): Skeleton.IBone => ({
        bone: item.bone,
        parent: null,
        position: [0, 0, 0],
        tip: null,
        radius: 0.01,
      }),
    ),
    posed: placements,
    clamped: [],
  };
}
