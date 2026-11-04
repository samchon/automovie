import { AutoMovieHumanGrounding as Grounding, type AutoMovieHumanSkeleton as Skeleton, type IAutoMovieHumanPose } from "@automovie/human";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../internal/nclose";

/**
 * The local floor problem retains both sides of a branch crossing and a tie.
 *
 * @evidence contracts/testing.md#behavioral-verification One public update fits an arithmetic carrier while every original floor witness remains constrained. The finite-difference angle crosses the other floor branch; a second input starts exactly on their tie. Both must reach the independently derived constrained optimum without extra updates or a floor waiver.
 * @evidence contracts/testing.md#independent-expectations Put t=.01*hipDegrees. Target residual is [t-.001,t+y,0], with y>=max(-t,t-.001). The constrained quadratic minimizes at t=.0006,y=-.0004, giving norm sqrt(.0004²+.0002²). Differentiating a separately re-minimized max at .15 degrees produces a different false linear model.
 * @evidence contracts/testing.md#distinguishing-cases Start hip0 before the floor crossing and hip.05 exactly at the two-witness tie. Both use an original three-point floor population including a redundant tied vertex, strict .25mm floor-independent support admission and a one-update budget. The analytic optimum remains honestly unresolved at the strict default support tolerance.
 * @evidence contracts/testing.md#execution-ownership One synchronous portable public-SDK unit uses linear arithmetic FK, canonical hip degrees and independent in-memory floor points; it constructs no Human skin, process or renderer.
 */
export function test_human_grounding_floor_branches(): void {
  const solve: Grounding.IPrepared = Grounding.prepare(geometry, [{ bone: "leftFoot", localPoint: [0, 0, 0] }, { bone: "rightFoot", localPoint: [0, 0, 0] }, { bone: "rightFoot", localPoint: [0, 0, .01] }]);
  for (const start of [0, .05]) {
    const result: Grounding.IResult = solve({ legs: { left: { hip: { flexion: start } }, right: {} } }, { translation: [0, 0, 0], rotation: [0, 0, 0, 1] }, { channels: ["legs.left.hip.flexion"], targets: [{ bone: "leftFoot", position: [.001, 0, 0] }], iterations: 1 });
    TestValidator.predicate("all floor branches share one constrained update", nclose(result.pose.legs!.left.hip!.flexion!, .06, .00001));
    TestValidator.predicate("independent piecewise minimum", nclose(result.error, Math.hypot(.0004, .0002), 1e-8));
    TestValidator.predicate("every original floor point remains nonpenetrating", result.floorMinimum >= -1e-12);
    TestValidator.equals("strict hard target remains honestly unresolved", result.status, "unresolved");
    TestValidator.equals("one original update", result.iterations, 1);
  }
}

/** Two independent carriers cross at hip.05 degrees; the local model is exactly linear. */
function geometry(pose: IAutoMovieHumanPose = {}): Skeleton.IOutput {
  const value: number = .01 * (pose.legs?.left.hip?.flexion ?? 0);
  return { bones: ["leftFoot", "rightFoot"].map((bone: string): Skeleton.IOutput["bones"][number] => ({ bone, parent: null, position: [0, 0, 0], tip: null, radius: .01 })), posed: [{ bone: "leftFoot", position: [value, value, 0], rotation: [0, 0, 0, 1] }, { bone: "rightFoot", position: [0, .001 - value, 0], rotation: [0, 0, 0, 1] }], clamped: [] };
}
