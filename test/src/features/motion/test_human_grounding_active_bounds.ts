import { AutoMovieHumanGrounding as Grounding, type AutoMovieHumanSkeleton as Skeleton, type IAutoMovieHumanPose } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * An active clinical bound is part of the coupled solve before a step is chosen.
 *
 * Scenarios:
 * 1. A two-control linear FK has an outward unconstrained step at its subtalar bound.
 * 2. Clipping that step would increase error at every allowed backtracking fraction.
 * 3. The remaining hip coordinate must take the independently known constrained descent.
 * 4. The unattainable target still reports unresolved, and the floor/input remain unchanged.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls public Grounding with real canonical channels and an arithmetic coupled FK. At its lower subtalar bound the solver must improve through the available hip direction within one update, retaining the honest residual and exact bound. A clipped unconstrained step stalls and fails this assertion.
 * @evidence contracts/testing.md#independent-expectations Write u=subtalar+5 and v=hipDegrees. The target residual is [.01u+.02v+.1,.01v-.1,0]. The unconstrained solution u=-30,v=10 is forbidden; clipping only u makes every positive v fraction uphill. On u=0 the constrained least-squares minimizer is v=-2 with norm sqrt(.018), independently derived by differentiating the scalar quadratic.
 * @evidence contracts/testing.md#distinguishing-cases Covers an active lower bound, coupled interior descent, an unreachable honest negative result, fixed root axes, complete independent floor population, one-update budget and caller ownership. Actual full-foot nonlinear/floor-branch convergence belongs to geometry units and the production consumer.
 * @evidence contracts/testing.md#execution-ownership One synchronous portable root unit uses public solver, arithmetic FK and in-memory source geometry without model construction, process, host or renderer.
 */
export function test_human_grounding_active_bounds(): void {
  const pose: IAutoMovieHumanPose = { legs: { left: { hip: { flexion: 0 }, foot: { subtalarInversion: -5 } }, right: {} } };
  const root: Grounding.IRoot = { translation: [0, 0, 0], rotation: [0, 0, 0, 1] };
  const original: string = JSON.stringify({ pose, root });
  const solve: Grounding.IPrepared = Grounding.prepare(geometry, [{ bone: "leftFoot", localPoint: [0, 1, 0] }]);
  const result: Grounding.IResult = solve(pose, root, { channels: ["legs.left.foot.subtalarInversion", "legs.left.hip.flexion"], targets: [{ bone: "leftFoot", position: [0, 0, 0] }], rootAxes: [], floor: -1, iterations: 1, tolerance: .00025 });
  TestValidator.predicate("feasible coupled coordinate descends", result.pose.legs!.left.hip!.flexion! < -1.99 && result.error < Math.hypot(.1, .1));
  TestValidator.predicate("independent constrained minimum", nclose(result.error, Math.sqrt(.018), .000001));
  TestValidator.predicate("clinical lower bound remains literal", nclose(result.pose.legs!.left.foot!.subtalarInversion!, -5, 1e-12));
  TestValidator.equals("unattainable target stays unresolved", result.status, "unresolved");
  TestValidator.equals("original update cap stays one", result.iterations, 1);
  TestValidator.predicate("complete source floor still passes", result.floorMinimum >= -1);
  TestValidator.equals("input ownership", JSON.stringify({ pose, root }), original);
}

/** The public carrier exposes a two-variable quadratic whose constrained optimum is analytic. */
function geometry(pose: IAutoMovieHumanPose = {}): Skeleton.IOutput {
  const u: number = (pose.legs?.left.foot?.subtalarInversion ?? 0) + 5;
  const v: number = pose.legs?.left.hip?.flexion ?? 0;
  return { bones: [{ bone: "leftFoot", parent: null, position: [0, 0, 0], tip: null, radius: .01 }], posed: [{ bone: "leftFoot", position: [.01 * u + .02 * v + .1, .01 * v - .1, 0], rotation: [0, 0, 0, 1] }], clamped: [] };
}
