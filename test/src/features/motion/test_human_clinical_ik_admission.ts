import {
  type IAutoMovieHumanPose,
  AutoMovieHumanClinicalIk as Ik,
  type AutoMovieHumanSkeleton as Skeleton,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";
import { throwsError } from "../internal/throwsError";

/**
 * Sparse or malformed target populations refuse before any evaluator capability runs.
 *
 * Scenarios:
 * 1. Reject holes in the target population and either three-coordinate tuple.
 * 2. Reject null records, missing tuples, nonfinite coordinates and wrong tuple dimensions.
 * 3. A dense reachable point agrees through plain and prepared evaluator capabilities.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls public ClinicalIk with owned arithmetic evaluators and counts both full evaluation and projection selection. Every malformed request must throw with zero calls; a sparse target population cannot report a zero-error success.
 * @evidence contracts/testing.md#independent-expectations The fixture maps public hip degrees to X in centimetres, with its carrier fixed at Y1. A25-degree hip therefore reaches X.25 independently of either solver path; positive outputs must agree within the requested metre tolerance.
 * @evidence contracts/testing.md#distinguishing-cases Covers dense positive plain/prepared parity, target holes, coordinate holes, explicit undefined/null records, missing position, Infinity, NaN and dimensions two/four. Existing clinical tests own anatomical limits and unreachable residuals.
 * @evidence contracts/testing.md#execution-ownership One synchronous root unit uses arithmetic FK and portable assertions without model construction, process, browser, renderer or native artifact.
 */
export function test_human_clinical_ik_admission(): void {
  let evaluations: number = 0;
  let projections: number = 0;
  const plain: Skeleton.PoseEvaluator = (
    pose: IAutoMovieHumanPose = {},
  ): Skeleton.IOutput => {
    evaluations++;
    return geometry(pose);
  };
  const prepared: Skeleton.PoseEvaluator = Object.assign(
    (pose: IAutoMovieHumanPose = {}): Skeleton.IOutput => {
      evaluations++;
      return geometry(pose);
    },
    {
      project: (_bones: readonly string[]): Skeleton.ProjectionEvaluator => {
        projections++;
        return (pose: IAutoMovieHumanPose = {}): Skeleton.IOutput => {
          evaluations++;
          return geometry(pose);
        };
      },
    },
  );
  const request: Ik.IRequest = {
    channels: ["legs.left.hip.flexion"],
    targets: [{ bone: "leftFoot", position: [0.25, 1, 0] }],
    iterations: 12,
    tolerance: 0.00001,
  };
  const targetHole: unknown[] = new Array(1);
  const coordinateHole: unknown[] = new Array(3);
  coordinateHole[0] = 0;
  coordinateHole[2] = 0;
  const invalid: unknown[] = [
    targetHole,
    [undefined],
    [null],
    [{}],
    [{ bone: "leftFoot" }],
    [{ bone: "leftFoot", position: coordinateHole }],
    [{ bone: "leftFoot", position: [0, 1, 0], localPoint: coordinateHole }],
    [{ bone: "leftFoot", position: [0, Infinity, 0] }],
    [{ bone: "leftFoot", position: [NaN, 0, 0] }],
    [{ bone: "leftFoot", position: [0, 0] }],
    [{ bone: "leftFoot", position: [0, 0, 0, 0] }],
  ];
  for (const evaluate of [plain, prepared])
    for (const targets of invalid) {
      const malformed: Ik.IRequest = {
        ...request,
        targets: targets as Ik.ITarget[],
      };
      TestValidator.predicate(
        "malformed targets refuse",
        throwsError(
          (): unknown => Ik.solve(evaluate, {}, malformed),
          "Clinical IK",
        ),
      );
    }
  TestValidator.equals("rejections invoke no FK", evaluations, 0);
  TestValidator.equals(
    "rejections invoke no projection selection",
    projections,
    0,
  );
  const a: Ik.IResult = Ik.solve(plain, {}, request);
  const b: Ik.IResult = Ik.solve(prepared, {}, request);
  TestValidator.predicate(
    "dense plain target reaches independently known hip",
    nclose(a.pose.legs!.left.hip!.flexion!, 25, 0.001),
  );
  TestValidator.predicate(
    "dense prepared target reaches the same endpoint",
    a.error <= request.tolerance! &&
      b.error <= request.tolerance! &&
      nclose(
        a.output.posed[0]!.position[0],
        b.output.posed[0]!.position[0],
        request.tolerance!,
      ),
  );
  TestValidator.equals("positive prepared path selects once", projections, 1);
}

/** A caller-owned linear centimetre-per-degree carrier makes the endpoint oracle explicit. */
function geometry(pose: IAutoMovieHumanPose): Skeleton.IOutput {
  return {
    bones: [
      {
        bone: "leftFoot",
        parent: null,
        position: [0, 1, 0],
        tip: null,
        radius: 0.01,
      },
    ],
    posed: [
      {
        bone: "leftFoot",
        position: [(pose.legs?.left.hip?.flexion ?? 0) / 100, 1, 0],
        rotation: [0, 0, 0, 1],
      },
    ],
    clamped: [],
  };
}
