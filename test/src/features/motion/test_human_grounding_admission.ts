import {
  AutoMovieHumanGrounding as Grounding,
  type IAutoMovieHumanPose,
  type AutoMovieHumanSkeleton as Skeleton,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../internal/throwsError";

/**
 * Grounding rejects occupied-coordinate and population defects before any FK.
 * @evidence contracts/testing.md#behavioral-verification Calls public prepare/inspect with counters for full evaluation and projection selection. Missing X or Z cannot be hidden by a floor-only query with no targets or channels; sparse rotation, target, source-point, channel and root-axis populations must also refuse before either capability runs.
 * @evidence contracts/testing.md#independent-expectations The arithmetic carrier is fixed at the origin and its sole witness is exactly on Y0. A dense identity root and empty target/channel populations therefore admit with zero support error and floor0 after exactly one full evaluation, independently of any numerical solver.
 * @evidence contracts/testing.md#distinguishing-cases Covers holes at root axes ignored by vertical floor measurements, a quaternion hole, point/target holes, wrong tuple lengths and nonfinite coordinates. Adjacent valid floor-only inspection preserves the public empty-channel inspect contract. No numerical iteration, clinical limit or physical tolerance is changed.
 * @evidence contracts/testing.md#execution-ownership One synchronous root unit uses arithmetic FK and in-memory geometry; it starts no process, renderer, browser or model generator.
 */
export function test_human_grounding_admission(): void {
  let evaluations: number = 0;
  let projections: number = 0;
  const evaluate: Skeleton.PoseEvaluator = Object.assign(
    (_pose: IAutoMovieHumanPose = {}): Skeleton.IOutput => {
      evaluations++;
      return geometry();
    },
    {
      project: (_bones: readonly string[]): Skeleton.ProjectionEvaluator => {
        projections++;
        return (): Skeleton.IOutput => {
          evaluations++;
          return geometry();
        };
      },
    },
  );
  const solve: Grounding.IPrepared = Grounding.prepare(evaluate, [
    { bone: "leftFoot", localPoint: [0, 0, 0] },
  ]);
  const root: Grounding.IRoot = {
    translation: [0, 0, 0],
    rotation: [0, 0, 0, 1],
  };
  const request: Grounding.IRequest = { channels: [], targets: [] };
  for (const missing of [0, 2]) {
    const sparse: Grounding.IRoot = {
      ...root,
      translation: hole(3, missing) as Grounding.IRoot["translation"],
    };
    TestValidator.predicate(
      "sparse horizontal root refuses",
      throwsError(
        (): unknown => solve.inspect({}, sparse, request),
        "Grounding",
      ),
    );
  }
  const malformedRoots: Grounding.IRoot[] = [
    { ...root, rotation: hole(4, 2) as Grounding.IRoot["rotation"] },
    { ...root, translation: [0, Infinity, 0] },
    {
      ...root,
      translation: [0, 0] as unknown as Grounding.IRoot["translation"],
    },
  ];
  for (const malformed of malformedRoots)
    TestValidator.predicate(
      "malformed root refuses",
      throwsError(
        (): unknown => solve.inspect({}, malformed, request),
        "Grounding",
      ),
    );
  const sparsePoint: [number, number, number] = hole(3, 1) as [
    number,
    number,
    number,
  ];
  const malformedRequests: Grounding.IRequest[] = [
    { ...request, targets: new Array(1) },
    { ...request, channels: new Array(1) },
    { ...request, rootAxes: new Array(1) },
    { ...request, targets: [{ bone: "leftFoot", position: sparsePoint }] },
    {
      ...request,
      targets: [
        { bone: "leftFoot", position: [0, 0, 0], localPoint: sparsePoint },
      ],
    },
  ];
  for (const malformed of malformedRequests)
    TestValidator.predicate(
      "sparse request refuses",
      throwsError(
        (): unknown => solve.inspect({}, root, malformed),
        "Grounding",
      ),
    );
  TestValidator.predicate(
    "sparse source geometry refuses",
    throwsError(
      (): unknown =>
        Grounding.prepare(evaluate, [
          { bone: "leftFoot", localPoint: sparsePoint },
        ]),
      "Grounding",
    ),
  );
  TestValidator.predicate(
    "sparse source population refuses",
    throwsError(
      (): unknown => Grounding.prepare(evaluate, new Array(1)),
      "Grounding",
    ),
  );
  TestValidator.equals("invalid inputs acquire no FK", evaluations, 0);
  TestValidator.equals("invalid inputs acquire no projection", projections, 0);
  const valid: Grounding.IResult = solve.inspect({}, root, request);
  TestValidator.equals(
    "dense floor-only inspect remains admitted",
    valid.status,
    "admitted",
  );
  TestValidator.equals("independent exact floor", valid.floorMinimum, 0);
  TestValidator.equals("one full inspection", evaluations, 1);
  TestValidator.equals("inspection never selects a projection", projections, 0);
}

/** Construct a resident hole without forbidden array deletion. */
function hole(size: number, missing: number): number[] {
  const result: number[] = new Array(size);
  for (let index: number = 0; index < size; index++)
    if (index !== missing) result[index] = size === 4 && index === 3 ? 1 : 0;
  return result;
}

/** A fixed floor carrier makes valid inspection independent of solver implementation. */
function geometry(): Skeleton.IOutput {
  return {
    bones: [
      {
        bone: "leftFoot",
        parent: null,
        position: [0, 0, 0],
        tip: null,
        radius: 0.01,
      },
    ],
    posed: [{ bone: "leftFoot", position: [0, 0, 0], rotation: [0, 0, 0, 1] }],
    clamped: [],
  };
}
