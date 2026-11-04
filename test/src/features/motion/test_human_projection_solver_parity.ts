import {
  AutoMovieHumanGrounding as Grounding,
  type IAutoMovieHumanPose,
  AutoMovieHumanClinicalIk as Ik,
  AutoMovieHumanSkeleton as Skeleton,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { HumanPeople } from "../internal/HumanPeople";
import { nclose } from "../internal/predicates";

/**
 * Numerical trials use projections while final solver results retain complete FK.
 *
 * Scenarios:
 * 1. Real Human IK reaches a flexed-hip endpoint with projected or plain FK.
 * 2. Grounding retains identical applied pose, floor and best unresolved state.
 * 3. A plain arithmetic evaluator still solves an independently specified task.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls both public solvers through a real prepared capability and an owned wrapper exposing only the legacy callable. It checks matching final pose, residual, clamps and every full transform, and observes one full materialization after multiple internal trials without mutating the wrapped evaluator.
 * @evidence contracts/testing.md#independent-expectations A separate linear fixture places its foot at X=kneeDegrees/100,Y=1; targetX.2 therefore requires20 degrees and its localY=-1 sole requires rootY0. Real-body targets are FK parity fixtures rather than anatomy or reach oracles; the independent hinge/rigid-length unit and operator geometry comparison own those claims.
 * @evidence contracts/testing.md#distinguishing-cases Covers actual nonneutral articulation, untouched opposite-side conditional clamps, plain-function fallback, full final rest/neck output, repeated results, inspect, empty hard targets, complete supplied floor population including a non-target toe, finite unresolved requests and caller snapshot ownership.
 * @evidence contracts/testing.md#execution-ownership One synchronous discoverable root unit reuses HumanPeople calibration, in-memory source points and arithmetic fixtures; it launches no host, process, browser or renderer.
 */
export function test_human_projection_solver_parity(): void {
  const person: HumanPeople.IPerson = HumanPeople.person("m1");
  const original: Skeleton.PoseEvaluator = Skeleton.prepare(person.params, {
    calibration: person.body,
    neckSurface: true,
  });
  if (!original.project)
    throw new Error("Prepared Human FK must expose projections");
  const calls: { full: number; trial: number } = { full: 0, trial: 0 };
  const prepared: Skeleton.PoseEvaluator = (
    pose: IAutoMovieHumanPose = {},
    clamp: boolean = true,
  ): Skeleton.IOutput => {
    calls.full++;
    return original(pose, clamp);
  };
  prepared.project = (
    bones: readonly string[],
  ): Skeleton.ProjectionEvaluator => {
    const query: Skeleton.ProjectionEvaluator = original.project!(bones);
    return (
      pose: IAutoMovieHumanPose = {},
      clamp: boolean = true,
    ): Skeleton.IProjection => {
      calls.trial++;
      return query(pose, clamp);
    };
  };
  const fallback: Skeleton.PoseEvaluator = (
    pose: IAutoMovieHumanPose = {},
    clamp: boolean = true,
  ): Skeleton.IOutput => original(pose, clamp);
  const seed: IAutoMovieHumanPose = {
    legs: {
      left: { hip: { flexion: 5 } },
      right: { knee: { flexion: 0, rotation: 20 } },
    },
  };
  const seedSaved: string = JSON.stringify(seed);
  const destination: Skeleton.IOutput = original({
    legs: { left: { hip: { flexion: 20 } }, right: {} },
  });
  const endpoint: Skeleton.IPlacement = joint(destination, "leftLowerLeg");
  const request: Ik.IRequest = {
    channels: ["legs.left.hip.flexion"],
    targets: [{ bone: "leftLowerLeg", position: [...endpoint.position] }],
    iterations: 12,
    tolerance: 0.00001,
  };
  const projected: Ik.IResult = Ik.solve(prepared, seed, request);
  const plain: Ik.IResult = Ik.solve(fallback, seed, request);
  TestValidator.equals(
    "IK materializes one complete final output",
    calls.full,
    1,
  );
  TestValidator.predicate(
    "IK uses numerical projected trials",
    calls.trial > 1,
  );
  samePose(projected.pose, plain.pose);
  TestValidator.predicate(
    "IK actual error parity",
    nclose(projected.error, plain.error, 1e-12),
  );
  same(projected.output, plain.output);
  TestValidator.predicate(
    "unselected conditional clamp survives IK",
    projected.output.clamped.some(
      (row: Skeleton.IClamp): boolean =>
        row.path === "legs.right.knee.rotation" && row.applied === 0,
    ),
  );
  TestValidator.equals("IK preserves seed", JSON.stringify(seed), seedSaved);
  TestValidator.predicate(
    "IK full output includes original rest and neck",
    projected.output.bones.length > 50 &&
      projected.output.neckSurface !== undefined,
  );
  const saved: string = JSON.stringify(projected.output);
  Ik.solve(prepared, projected.pose, request);
  TestValidator.equals(
    "later solve preserves earlier output",
    JSON.stringify(projected.output),
    saved,
  );

  const vertices: {
    bone: "leftFoot" | "rightHalluxDistal";
    localPoint: [number, number, number];
  }[] = [
    { bone: "leftFoot", localPoint: [0, -0.03, 0] },
    { bone: "leftFoot", localPoint: [0.08, -0.02, 0.02] },
    { bone: "rightHalluxDistal", localPoint: [0, -0.08, 0] },
  ];
  const solve: Grounding.IPrepared = Grounding.prepare(prepared, vertices);
  const oldSolve: Grounding.IPrepared = Grounding.prepare(fallback, vertices);
  const root: Grounding.IRoot = {
    translation: [0, 0, 0],
    rotation: [0, 0, 0, 1],
  };
  const task: Grounding.IRequest = {
    channels: ["legs.left.hip.flexion"],
    targets: [{ bone: "leftFoot", position: [10, 0, 0] }],
    softTargets: [{ bone: "head", position: [0, 1.5, 0] }],
    rootAxes: ["y"],
    iterations: 2,
  };
  calls.full = 0;
  calls.trial = 0;
  const result: Grounding.IResult = solve(seed, root, task);
  const legacy: Grounding.IResult = oldSolve(seed, root, task);
  TestValidator.equals(
    "Grounding materializes one complete final output",
    calls.full,
    1,
  );
  TestValidator.predicate(
    "Grounding uses projected numerical trials",
    calls.trial > 1,
  );
  TestValidator.equals(
    "unreachable target remains unresolved",
    result.status,
    "unresolved",
  );
  sameGrounding(result, legacy);
  const expectedMinimum: number = Math.min(
    ...vertices.map(
      (point: {
        bone: "leftFoot" | "rightHalluxDistal";
        localPoint: [number, number, number];
      }): number =>
        worldY(joint(result.output, point.bone), point.localPoint) +
        result.root.translation[1],
    ),
  );
  TestValidator.predicate(
    "non-target toe remains in exact whole population",
    nclose(result.floorMinimum, expectedMinimum, 1e-12),
  );
  sameGrounding(
    solve.inspect(seed, root, task),
    oldSolve.inspect(seed, root, task),
  );
  sameGrounding(
    solve(seed, root, { ...task, targets: [], softTargets: [] }),
    oldSolve(seed, root, { ...task, targets: [], softTargets: [] }),
  );

  const independent: Ik.IResult = Ik.solve(
    linear,
    {},
    {
      channels: ["legs.left.knee.flexion"],
      targets: [{ bone: "leftFoot", position: [0.2, 1, 0] }],
      iterations: 8,
      tolerance: 0.00001,
    },
  );
  TestValidator.predicate(
    "plain custom IK retains independent twenty-degree solution",
    nclose(independent.pose.legs!.left.knee!.flexion!, 20, 0.002),
  );
  const linearGrounding: Grounding.IResult = Grounding.prepare(linear, [
    { bone: "leftFoot", localPoint: [0, -1, 0] },
  ])(
    {},
    { translation: [0, -0.03, 0], rotation: [0, 0, 0, 1] },
    {
      channels: ["legs.left.knee.flexion"],
      targets: [
        { bone: "leftFoot", localPoint: [0, -1, 0], position: [0.2, 0, 0] },
      ],
      iterations: 8,
    },
  );
  TestValidator.equals(
    "plain custom Grounding remains admitted",
    linearGrounding.status,
    "admitted",
  );
  TestValidator.predicate(
    "independent root height",
    nclose(linearGrounding.root.translation[1], 0, 1e-12),
  );
}

/** Independent linear metre endpoint with a canonical bounded knee coordinate. */
function linear(pose: IAutoMovieHumanPose = {}): Skeleton.IOutput {
  const requested: number = pose.legs?.left.knee?.flexion ?? 0;
  const applied: number = Math.max(-1.3, Math.min(139.8, requested));
  return {
    bones: [
      {
        bone: "leftFoot",
        parent: null,
        position: [0, 1, 0],
        tip: null,
        radius: 0.02,
      },
    ],
    posed: [
      {
        bone: "leftFoot",
        position: [applied / 100, 1, 0],
        rotation: [0, 0, 0, 1],
      },
    ],
    clamped:
      requested === applied
        ? []
        : [{ path: "legs.left.knee.flexion", requested, applied }],
  };
}

/** Exact public placement lookup; absent source bones fail instead of being ignored. */
function joint(
  output: Skeleton.IProjection,
  bone: string,
): Skeleton.IPlacement {
  const placement: Skeleton.IPlacement | undefined = output.posed.find(
    (row: Skeleton.IPlacement): boolean => row.bone === bone,
  );
  if (!placement) throw new Error(`Missing solver parity joint ${bone}`);
  return placement;
}

/** Compare every final public transform, clamp identity and unchanged rest structure. */
function same(actual: Skeleton.IOutput, expected: Skeleton.IOutput): void {
  TestValidator.equals(
    "complete bone identities",
    actual.bones.map((bone: Skeleton.IBone): string => bone.bone),
    expected.bones.map((bone: Skeleton.IBone): string => bone.bone),
  );
  TestValidator.equals(
    "complete clamp paths",
    actual.clamped.map((row: Skeleton.IClamp): string => row.path),
    expected.clamped.map((row: Skeleton.IClamp): string => row.path),
  );
  actual.posed.forEach((row: Skeleton.IPlacement, index: number): void => {
    TestValidator.equals(
      "full output bone ordering",
      row.bone,
      expected.posed[index]!.bone,
    );
    [...row.position, ...row.rotation].forEach(
      (value: number, coordinate: number): void =>
        TestValidator.predicate(
          "full final placement parity",
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
  });
}

/** Compare solver decisions as well as the exact full geometry-driving result. */
function sameGrounding(
  actual: Grounding.IResult,
  expected: Grounding.IResult,
): void {
  samePose(actual.pose, expected.pose);
  TestValidator.equals("Grounding status", actual.status, expected.status);
  TestValidator.equals(
    "Grounding finite reason",
    actual.reason,
    expected.reason,
  );
  TestValidator.equals(
    "Grounding update count",
    actual.iterations,
    expected.iterations,
  );
  [
    actual.error,
    actual.floorMinimum,
    actual.supportError,
    actual.softError,
    ...actual.root.translation,
  ].forEach((value: number, index: number): void =>
    TestValidator.predicate(
      "Grounding physical parity",
      nclose(
        value,
        [
          expected.error,
          expected.floorMinimum,
          expected.supportError,
          expected.softError,
          ...expected.root.translation,
        ][index]!,
        1e-12,
      ),
    ),
  );
  same(actual.output, expected.output);
}

/** Independent quaternion rotation-matrix Y row for the unchanged supplied cloud. */
function worldY(
  bone: Skeleton.IPlacement,
  point: [number, number, number],
): number {
  const [x, y, z, w]: [number, number, number, number] = bone.rotation;
  return (
    bone.position[1] +
    2 * (x * y + z * w) * point[0] +
    (1 - 2 * (x * x + z * z)) * point[1] +
    2 * (y * z - x * w) * point[2]
  );
}

/** Compare the complete public pose tree without deep-equality assertions on floats. */
function samePose(actual: unknown, expected: unknown): void {
  if (typeof actual === "number" && typeof expected === "number") {
    TestValidator.predicate(
      "applied clinical scalar parity",
      nclose(actual, expected, 1e-12),
    );
    return;
  }
  if (
    actual === null ||
    expected === null ||
    typeof actual !== "object" ||
    typeof expected !== "object"
  )
    throw new Error("Solver pose structure differs");
  TestValidator.equals(
    "owned clinical branch keys",
    Object.keys(actual),
    Object.keys(expected),
  );
  for (const key of Object.keys(actual))
    samePose(Reflect.get(actual, key), Reflect.get(expected, key));
}
