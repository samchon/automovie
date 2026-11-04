import {
  AutoMovieHumanRigControls as Controls,
  AutoMovieHumanGrounding as Grounding,
  type IAutoMovieHumanPose,
  type AutoMovieHumanSkeleton as Skeleton,
} from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * Tibial bounds move with knee flexion inside the same local constrained step.
 * @evidence contracts/testing.md#behavioral-verification Uses actual public canonical knee bounds in an arithmetic FK and calls public Grounding for one update. The final rotation must follow the moving lower bound, rather than fitting a frozen rotation box then changing that result during evaluator normalization.
 * @evidence contracts/testing.md#independent-expectations Captured flexion14.6369055128 changing by-.5238402752 moves its actual lower tibial bound from-4.0658070869 to-3.9202958993, requiring+.1455111876 degrees. For the two-coordinate endpoint error and r=a*f, a=-25/90, the constrained least-squares optimum is f=(fTarget+a*rTarget)/(1+a²), r=a*f. These equations independently determine the expected one-step result.
 * @evidence contracts/testing.md#distinguishing-cases Starts on the exact canonical flexion-dependent lower bound with an inward flexion goal, fixed root and a redundant floor witness. The target remains honestly unreachable at.25mm, all actual selected clamps disappear after normalization, and the original one-update cap remains unchanged. Global nonlinear Human convergence remains a separate consumer test.
 * @evidence contracts/testing.md#execution-ownership One synchronous root unit uses public bounds, Grounding and arithmetic FK without Human construction, renderer, process or native experiment harness.
 */
export function test_human_grounding_conditional_bounds(): void {
  const flexion: number = 14.636905512822606;
  const requested: number = flexion - 0.5238402752445472;
  const rotation: number = -4.065807086895169;
  const wanted: IAutoMovieHumanPose = {
    legs: { left: { knee: { flexion: requested, rotation } }, right: {} },
  };
  const interval: ReturnType<typeof Controls.bounds> = Controls.bounds(
    "legs.left.knee.rotation",
    wanted,
  );
  TestValidator.predicate(
    "actual captured bound moves",
    nclose(interval.minimum - rotation, 0.14551118756793002, 1e-12),
  );
  const solve: Grounding.IPrepared = Grounding.prepare(geometry, [
    { bone: "leftFoot", localPoint: [0, -1, 0] },
  ]);
  const result: Grounding.IResult = solve(
    { legs: { left: { knee: { flexion, rotation } }, right: {} } },
    { translation: [0, 0, 0], rotation: [0, 0, 0, 1] },
    {
      channels: ["legs.left.knee.flexion", "legs.left.knee.rotation"],
      targets: [
        { bone: "leftFoot", position: [0.01 * requested, 1, 0.01 * rotation] },
      ],
      rootAxes: [],
      iterations: 1,
    },
  );
  const slope: number = -25 / 90;
  const expectedFlexion: number =
    (requested + slope * rotation) / (1 + slope * slope);
  const expectedRotation: number = slope * expectedFlexion;
  TestValidator.predicate(
    "coupled one-step optimum",
    nclose(result.pose.legs!.left.knee!.flexion!, expectedFlexion, 0.001) &&
      nclose(result.pose.legs!.left.knee!.rotation!, expectedRotation, 0.001),
  );
  TestValidator.predicate(
    "canonical bound remains literal",
    nclose(
      result.pose.legs!.left.knee!.rotation!,
      Controls.bounds("legs.left.knee.rotation", result.pose).minimum,
      0.001,
    ),
  );
  TestValidator.equals("original one-update cap", result.iterations, 1);
  TestValidator.equals(
    "unreachable target stays unresolved",
    result.status,
    "unresolved",
  );
  TestValidator.equals(
    "actual selected clamp rows are empty",
    result.output.clamped.length,
    0,
  );
}

/** Canonical tibial normalization is applied before exposing the two endpoint coordinates. */
function geometry(pose: IAutoMovieHumanPose = {}): Skeleton.IOutput {
  const flexion: number = pose.legs?.left.knee?.flexion ?? 0;
  const requested: number = pose.legs?.left.knee?.rotation ?? 0;
  const interval: ReturnType<typeof Controls.bounds> = Controls.bounds(
    "legs.left.knee.rotation",
    pose,
  );
  const rotation: number = Math.max(
    interval.minimum,
    Math.min(interval.maximum, requested),
  );
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
        position: [0.01 * flexion, 1, 0.01 * rotation],
        rotation: [0, 0, 0, 1],
      },
    ],
    clamped:
      rotation === requested
        ? []
        : [{ path: "legs.left.knee.rotation", requested, applied: rotation }],
  };
}
