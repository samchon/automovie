import {
  AutoMovieHumanClinicalIk,
  AutoMovieHumanGrounding,
  type AutoMovieHumanSkeleton,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/predicates";

/**
 * The returned clinical pose agrees with applied conditional joint limits.
 *
 * Scenarios:
 * 1. A satisfied extended knee consumes its zero tibial-rotation allowance.
 * 2. A flexed knee retains an admitted rotation and the input stays independent.
 * 3. Both solvers retreat inward from either conditional tibial endpoint to a reachable target.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls public ClinicalIk with a conditional evaluator and observes returned selected scalar, matching endpoint, clamp rows and unchanged seed. Returning an unapplied requested scalar, or hiding the endpoint residual, fails.
 * @evidence contracts/testing.md#independent-expectations The fixture explicitly scales the canonical -25/35-degree tibial bounds by knee flexion divided by90; full extension permits exactly zero rotation. Metre endpoint X is that applied rotation divided by1000, independent of the solver's path writer and final normalization.
 * @evidence contracts/testing.md#distinguishing-cases Covers zero-update satisfied conditional clamp, admitted input, selected normalization, inward retreat from both flexion-conditioned endpoints in ClinicalIk/Grounding and input ownership. Broader units own unreachable and malformed requests; arithmetic endpoint fixtures do not establish actual production stance reach.
 * @evidence contracts/testing.md#execution-ownership A synchronous discoverable root unit invokes only the portable public solver and an arithmetic FK fixture; no body preparation, process, browser or rendering occurs.
 */
export function test_human_clinical_ik_conditioned_pose(): void {
  const seed: IAutoMovieHumanPose = {
    legs: { left: { knee: { flexion: 0, rotation: 12 } }, right: {} },
  };
  const result: AutoMovieHumanClinicalIk.IResult =
    AutoMovieHumanClinicalIk.solve(conditioned, seed, {
      channels: ["legs.left.knee.rotation"],
      targets: [{ bone: "leftFoot", position: [0, 0, 0] }],
      iterations: 1,
    });
  TestValidator.predicate(
    "applied scalar is returned",
    nclose(result.pose.legs!.left.knee!.rotation!, 0),
  );
  TestValidator.predicate(
    "matching endpoint",
    nclose(result.output.posed[0]!.position[0], 0),
  );
  TestValidator.predicate("actual residual", nclose(result.error, 0));
  TestValidator.equals(
    "normalization clears selected clamp",
    result.output.clamped.length,
    0,
  );
  TestValidator.equals(
    "already satisfied target needs no update",
    result.iterations,
    0,
  );
  TestValidator.predicate(
    "seed stays authored",
    nclose(seed.legs!.left.knee!.rotation!, 12),
  );
  const bent: AutoMovieHumanClinicalIk.IResult = AutoMovieHumanClinicalIk.solve(
    conditioned,
    { legs: { left: { knee: { flexion: 90, rotation: 12 } }, right: {} } },
    {
      channels: ["legs.left.knee.rotation"],
      targets: [{ bone: "leftFoot", position: [0.012, 0, 0] }],
      iterations: 1,
    },
  );
  TestValidator.predicate(
    "admitted flexed knee stays unchanged",
    nclose(bent.pose.legs!.left.knee!.rotation!, 12),
  );
  const empty: AutoMovieHumanClinicalIk.IResult =
    AutoMovieHumanClinicalIk.solve(
      conditioned,
      {},
      {
        channels: ["legs.left.knee.rotation"],
        targets: [{ bone: "leftFoot", position: [0, 0, 0] }],
        iterations: 1,
      },
    );
  TestValidator.predicate(
    "one selected side creates a complete public pair",
    empty.pose.legs !== undefined &&
      empty.pose.legs.left !== undefined &&
      empty.pose.legs.right !== undefined,
  );
  for (const endpoint of [-12.5, 17.5]) {
    const boundary: IAutoMovieHumanPose = {
      legs: { left: { knee: { flexion: 45, rotation: endpoint } }, right: {} },
    };
    const saved: string = JSON.stringify(boundary);
    const inward: AutoMovieHumanClinicalIk.IResult =
      AutoMovieHumanClinicalIk.solve(conditioned, boundary, {
        channels: ["legs.left.knee.rotation"],
        targets: [{ bone: "leftFoot", position: [0, 0, 0] }],
        iterations: 16,
        tolerance: 0.0001,
      });
    TestValidator.predicate(
      `clinical endpoint ${endpoint} retreats inward`,
      Math.abs(inward.output.posed[0]!.position[0]) <= 0.0001,
    );
    const solve: ReturnType<typeof AutoMovieHumanGrounding.prepare> =
      AutoMovieHumanGrounding.prepare(conditioned, [
        { bone: "leftFoot", localPoint: [0, 0, 0] },
      ]);
    const grounded: AutoMovieHumanGrounding.IResult = solve(
      boundary,
      { translation: [0, 0, 0], rotation: [0, 0, 0, 1] },
      {
        channels: ["legs.left.knee.rotation"],
        targets: [{ bone: "leftFoot", position: [0, 0, 0] }],
        rootAxes: [],
        iterations: 16,
        tolerance: 0.0001,
      },
    );
    TestValidator.equals(
      `grounding endpoint ${endpoint} admits reachable target`,
      grounded.status,
      "admitted",
    );
    TestValidator.predicate(
      `grounding endpoint ${endpoint} independent achieved point`,
      Math.abs(conditioned(grounded.pose).posed[0]!.position[0]) <= 0.0001,
    );
    TestValidator.equals(
      `endpoint ${endpoint} seed remains independent`,
      JSON.stringify(boundary),
      saved,
    );
  }
}

/** A one-point fixture applies the canonical flexion-dependent tibial allowance. */
function conditioned(
  pose: IAutoMovieHumanPose = {},
): AutoMovieHumanSkeleton.IOutput {
  const flexion: number = pose.legs?.left.knee?.flexion ?? 0;
  const requested: number = pose.legs?.left.knee?.rotation ?? 0;
  const fraction: number = Math.max(0, Math.min(1, flexion / 90));
  const applied: number = Math.max(
    -25 * fraction,
    Math.min(35 * fraction, requested),
  );
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
    posed: [
      {
        bone: "leftFoot",
        position: [applied / 1000, 0, 0],
        rotation: [0, 0, 0, 1],
      },
    ],
    clamped:
      applied === requested
        ? []
        : [{ path: "legs.left.knee.rotation", requested, applied }],
  };
}
