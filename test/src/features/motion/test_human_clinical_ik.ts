import {
  AutoMovieHumanClinicalIk,
  type AutoMovieHumanSkeleton,
  AutoMovieHumanSupportFrame,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose, throwsError, vclose } from "../internal/predicates";

/**
 * Clinical fitting reaches an independent spherical-chain endpoint while
 * preserving unselected controls, input ownership and finite solver budgets.
 *
 * Scenarios:
 * 1. Two admitted angular channels recover a known nonzero reachable point.
 * 2. An unreachable point reports its physical residual within a small budget.
 * 3. Large coupled requests never worsen endpoint error at a one-step budget.
 * 4. Already satisfied requests use no updates; invalid paths/budgets refuse.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public clinical solver and checks endpoint distance, fitted angles, untouched controls, unchanged seed and update counts. A solver returning its seed or hiding unreachable errors fails.
 * @evidence contracts/testing.md#independent-expectations A radius-0.7 spherical FK fixture and elementary sine/cosine at authored 30/20-degree angles define reachable coordinates independently of the fitting implementation; the radius gives the unreachable lower bound.
 * @evidence contracts/testing.md#distinguishing-cases Exercises active and already-satisfied targets, finite unreachable geometry, two-update budget, registered/unregistered channels, empty channels, nonfinite targets and an invalid maximum iteration count. Production consumer inspection owns actual Human skeleton axes, support and skin contacts.
 * @evidence contracts/testing.md#execution-ownership The discoverable synchronous root-harness unit uses only arithmetic FK, Human solver and portable assertions; it starts no model generation, process, host, browser or renderer.
 */
export function test_human_clinical_ik(): void {
  const seed: IAutoMovieHumanPose = {
    legs: {
      left: { hip: { flexion: 8, abduction: 4 } },
      right: { hip: { flexion: 18 } },
    },
    neck: { cervical: { rotation: 7 } },
  };
  const original: string = JSON.stringify(seed);
  const radians: number = Math.PI / 180;
  const target: [number, number, number] = [
    0.7 * Math.sin(30 * radians) * Math.cos(20 * radians),
    0.7 * Math.cos(30 * radians) * Math.cos(20 * radians),
    0.7 * Math.sin(20 * radians),
  ];
  const request: AutoMovieHumanClinicalIk.IRequest = {
    channels: ["legs.left.hip.flexion", "legs.left.hip.abduction"],
    targets: [{ bone: "leftFoot", position: target }],
    iterations: 12,
    tolerance: 0.0001,
  };
  const result: AutoMovieHumanClinicalIk.IResult =
    AutoMovieHumanClinicalIk.solve(spherical, seed, request);
  const endpoint: [number, number, number] = result.output.posed[0]!.position;
  TestValidator.predicate(
    "known endpoint",
    vclose(
      { x: endpoint[0], y: endpoint[1], z: endpoint[2] },
      { x: target[0], y: target[1], z: target[2] },
      0.0001,
    ),
  );
  TestValidator.predicate(
    "known flexion",
    nclose(result.pose.legs!.left.hip!.flexion!, 30, 0.02),
  );
  TestValidator.predicate(
    "known abduction",
    nclose(result.pose.legs!.left.hip!.abduction!, 20, 0.02),
  );
  TestValidator.predicate(
    "unselected right hip",
    nclose(result.pose.legs!.right.hip!.flexion!, 18),
  );
  TestValidator.predicate(
    "unselected neck",
    nclose(result.pose.neck!.cervical!.rotation!, 7),
  );
  TestValidator.equals("seed ownership", JSON.stringify(seed), original);
  TestValidator.predicate("reachable residual", result.error < 0.0001);

  const settled: AutoMovieHumanClinicalIk.IResult =
    AutoMovieHumanClinicalIk.solve(spherical, result.pose, request);
  TestValidator.equals(
    "satisfied target has zero updates",
    settled.iterations,
    0,
  );

  // A joint-centre-only implementation sees no error here. Two independent
  // surface points must rotate about an immobile joint to reach this frame.
  const frame: AutoMovieHumanClinicalIk.IResult =
    AutoMovieHumanClinicalIk.solve(rotating, seed, {
      channels: ["legs.left.hip.flexion"],
      targets: [
        { bone: "leftFoot", localPoint: [0.2, 0, 0], position: [0, 0.2, 0] },
        { bone: "leftFoot", localPoint: [0, 0.1, 0], position: [-0.1, 0, 0] },
        { bone: "leftFoot", localPoint: [0, 0, 0.15], position: [0, 0, 0.15] },
      ],
      iterations: 16,
      tolerance: 0.00001,
    });
  TestValidator.predicate(
    "geometry frame orientation",
    nclose(frame.pose.legs!.left.hip!.flexion!, 90, 0.01),
  );
  TestValidator.predicate("geometry frame residual", frame.error < 0.00001);
  TestValidator.predicate(
    "fixed joint origin",
    frame.output.posed[0]!.position.every((v: number): boolean => v === 0),
  );

  const vertices: [
    AutoMovieHumanSupportFrame.IPoint,
    AutoMovieHumanSupportFrame.IPoint,
    AutoMovieHumanSupportFrame.IPoint,
  ] = [
    { bone: "leftFoot", localPoint: [0, 0, 0] },
    { bone: "leftFoot", localPoint: [0.2, 0, 0] },
    { bone: "leftFoot", localPoint: [0, 0, 0.1] },
  ];
  const support: (
    destination: AutoMovieHumanSupportFrame.IFrame,
  ) => AutoMovieHumanClinicalIk.ITarget[] = AutoMovieHumanSupportFrame.prepare(
    rotating({ legs: { left: { hip: { flexion: 20 } }, right: {} } }),
    vertices,
  );
  vertices[0].localPoint[0] = 9;
  const targets: AutoMovieHumanClinicalIk.ITarget[] = support({
    origin: [1, 0, 2],
    forward: [1, 0, 0],
    normal: [0, 1, 0],
  });
  TestValidator.predicate(
    "support uses bone rotation before preparing frame",
    nclose(targets[1]!.position[0] - targets[0]!.position[0], 0.2, 1e-12),
  );
  TestValidator.predicate(
    "support plane targets actual points",
    targets.every(
      (point: AutoMovieHumanClinicalIk.ITarget): boolean =>
        Math.abs(point.position[1]) < 1e-12,
    ),
  );
  TestValidator.predicate(
    "support centroid",
    nclose(
      targets.reduce(
        (sum: number, point: AutoMovieHumanClinicalIk.ITarget): number =>
          sum + point.position[0],
        0,
      ) / 3,
      1,
      1e-12,
    ),
  );
  TestValidator.predicate(
    "support copied local descriptors",
    targets[0]!.localPoint![0] === 0,
  );

  const unreachable: AutoMovieHumanClinicalIk.IResult =
    AutoMovieHumanClinicalIk.solve(spherical, seed, {
      ...request,
      targets: [{ bone: "leftFoot", position: [0, 4, 0] }],
      iterations: 2,
    });
  TestValidator.equals("unreachable update budget", unreachable.iterations, 2);
  TestValidator.predicate(
    "physical residual remains visible",
    unreachable.error >= 3.3 - 1e-10,
  );
  TestValidator.predicate(
    "bounded flexion",
    unreachable.pose.legs!.left.hip!.flexion! >= -17.75 &&
      unreachable.pose.legs!.left.hip!.flexion! <= 132.1,
  );
  TestValidator.predicate(
    "bounded abduction",
    unreachable.pose.legs!.left.hip!.abduction! >= -20 &&
      unreachable.pose.legs!.left.hip!.abduction! <= 40,
  );

  // A bounded update may stop short, but its accepted endpoint cannot be worse
  // than the supplied seed even when coupled channels approach their limits.
  for (const [flexion, abduction] of [
    [130, 39],
    [-17, -19],
    [100, -18],
  ]) {
    const coupled: IAutoMovieHumanPose = {
      legs: { left: { hip: { flexion, abduction } }, right: {} },
    };
    const before: [number, number, number] =
      spherical(coupled).posed[0]!.position;
    const initialError: number = Math.hypot(
      ...before.map((v: number, i: number): number => v - target[i]!),
    );
    const bounded: AutoMovieHumanClinicalIk.IResult =
      AutoMovieHumanClinicalIk.solve(spherical, coupled, {
        ...request,
        iterations: 1,
      });
    TestValidator.predicate(
      "coupled step decreases residual",
      bounded.error <= initialError + 1e-12,
    );
  }

  for (const invalid of [
    { ...request, channels: [] },
    {
      ...request,
      channels: ["legs.left.hip.flexion", "legs.left.hip.flexion"],
    },
    { ...request, channels: ["legs.left.noSuchJoint"] },
    { ...request, iterations: 17 },
    { ...request, tolerance: Infinity },
    {
      ...request,
      targets: [
        { bone: "leftFoot", position: [NaN, 0, 0] as [number, number, number] },
      ],
    },
    {
      ...request,
      targets: [
        {
          bone: "leftFoot",
          position: target,
          localPoint: [0, Infinity, 0] as [number, number, number],
        },
      ],
    },
  ]) {
    TestValidator.predicate(
      "invalid request refused",
      throwsError((): void => {
        AutoMovieHumanClinicalIk.solve(
          spherical,
          seed,
          invalid as unknown as AutoMovieHumanClinicalIk.IRequest,
        );
      }),
    );
  }
  const malformed: AutoMovieHumanClinicalIk.ITarget = {
    bone: "leftFoot",
    position: [0, 0, 0],
  };
  malformed.position.pop();
  TestValidator.predicate(
    "short coordinate target refused",
    throwsError((): void => {
      AutoMovieHumanClinicalIk.solve(spherical, seed, {
        ...request,
        targets: [malformed],
      });
    }),
  );
  TestValidator.equals(
    "failed requests preserve seed",
    JSON.stringify(seed),
    original,
  );
}

/** Independent radius-0.7 two-angle FK, with the clinical shape of public FK. */
function spherical(
  pose: IAutoMovieHumanPose = {},
): AutoMovieHumanSkeleton.IOutput {
  const theta: number = ((pose.legs?.left.hip?.flexion ?? 0) * Math.PI) / 180;
  const phi: number = ((pose.legs?.left.hip?.abduction ?? 0) * Math.PI) / 180;
  const position: [number, number, number] = [
    0.7 * Math.sin(theta) * Math.cos(phi),
    0.7 * Math.cos(theta) * Math.cos(phi),
    0.7 * Math.sin(phi),
  ];
  return {
    bones: [
      {
        bone: "leftFoot",
        parent: null,
        position: [0, 0, 0],
        tip: null,
        radius: 0.02,
      },
    ],
    posed: [{ bone: "leftFoot", position, rotation: [0, 0, 0, 1] }],
    clamped: [],
  };
}

/** Independent fixed joint with a clinical Z rotation; no IK helper computes its expected frame. */
function rotating(
  pose: IAutoMovieHumanPose = {},
): AutoMovieHumanSkeleton.IOutput {
  const output: AutoMovieHumanSkeleton.IOutput = spherical({});
  const half: number = ((pose.legs?.left.hip?.flexion ?? 0) * Math.PI) / 360;
  output.posed[0]!.position = [0, 0, 0];
  output.posed[0]!.rotation = [0, 0, Math.sin(half), Math.cos(half)];
  return output;
}
