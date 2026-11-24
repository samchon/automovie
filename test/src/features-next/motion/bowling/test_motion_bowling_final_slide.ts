import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanThrowCatch,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";
import { vclose } from "../../../features/internal/vclose";

/** The slide events a fixture cuts at: one inside the glide, one at recovery. */
type SlideCut = "slideStarted" | "recoveryPlant";

/**
 * A bowling approach travels on the foot opposite the delivery hand, then
 * settles on the new plant from which the following pose can continue.
 *
 * Scenarios:
 * 1. Mirror the same authored glide for left- and right-hand deliveries.
 * 2. Measure the lead ankle at the stated distance and height while the
 *    trailing ankle lifts. Verify the final lead plant and cue order.
 * 3. Refuse a distance outside the one-step envelope.
 * 4. Resume standing through the recovery plant and refuse a cut during
 *    the glide.
 *
 * Seiferheld et al. (2023), section 1 and Figure 2, describe sliding on the
 * non-dominant foot and braking before the ball leaves. This fixture gives
 * a 0.22 m glide. The support-contact acceptance tolerance is 5 mm.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the hand-to-foot relation, authored displacement, phase order, rejection and display tolerance.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the registered law in HumanPerformance and reads the displayed actual foot and pelvis locations before, during and after the glide, plus the placed action's events.
 * @evidence contracts/development/testing.md#independent-expectations Uses the authored distance and timing, horizontal support and the published contra-lateral foot as the references.
 * @evidence contracts/development/testing.md#distinguishing-cases A lead foot sliding at constant height must differ from both a fixed plant and a swing step. Mirrored handedness changes the lead foot rather than the world travel direction.
 * @evidence contracts/development/testing.md#execution-ownership Portable in-memory Human SDK test on one body with mirrored deliveries, an authored continuation and two refusals.
 */
export function test_motion_bowling_final_slide(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const metres: number = 0.22;
  const from: number = 0.65;
  const to: number = 1.12;
  const seconds: number = 2;
  const tolerance: number = 0.005;
  const take = (
    hand: AutoMovieHumanSide,
    distance: number,
    cut?: SlideCut,
  ): HumanPerformance => {
    const chain = HumanChain.subject("bowler").registered("bowlingSlide", {
      hand,
      distance,
      from,
      to,
      duration: seconds,
    });
    return new HumanPerformance({
      seed: "bowling-glide",
      laws: [AutoMovieMotionHumanThrowCatch.HumanSportThrow.bowlingSlide],
      performers: [
        {
          subject: "bowler",
          body,
          at: { x: 0, y: 0, z: -1 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: (cut === undefined
        ? chain
        : chain.until({ event: cut }).stand({ hold: 0.3, sway: 0 })
      ).node,
    });
  };

  for (const hand of ["right", "left"] as const) {
    const stage: HumanPerformance = take(hand, metres);
    const bowler: IAutoMovieMotionHumanSegment = stage.segments("bowler")[0]!;
    const leading: AutoMovieHumanSide = hand === "right" ? "left" : "right";
    const trailing: AutoMovieHumanSide = leading === "left" ? "right" : "left";
    const foot = (side: AutoMovieHumanSide, time: number): IAutoMovieVector3 =>
      stage.bones("bowler", time).get(`${side}Foot`)!.worldPosition;
    const before: IAutoMovieVector3 = foot(leading, from);
    const middle: IAutoMovieVector3 = foot(leading, (from + to) / 2);
    const after: IAutoMovieVector3 = foot(leading, to);
    TestValidator.predicate(
      `${hand} delivery has a supported, moving lead foot and a lifted trailing foot`,
      middle.z > before.z + tolerance &&
        middle.z < after.z - tolerance &&
        nclose(middle.y, before.y, tolerance) &&
        vclose(after, { ...before, z: before.z + metres }, tolerance) &&
        foot(trailing, to).y > foot(trailing, from).y + tolerance,
    );
    TestValidator.predicate(
      `${hand} keeps the new plant through recovery and resumes without a backward slide`,
      vclose(foot(leading, seconds), after, tolerance) &&
        Vector3.distance(
          stage.bones("bowler", from).get("hips")!.worldPosition,
          stage.bones("bowler", to).get("hips")!.worldPosition,
        ) > tolerance,
    );
    const events: readonly [string, number][] = bowler.plan.events.map(
      (event): [string, number] => [
        event.name,
        bowler.start + event.share * bowler.plan.duration,
      ],
    );
    TestValidator.predicate(
      "slide boundaries and recovery stay on the placed action's clock",
      events[0]?.[0] === "slideStarted" &&
        nclose(events[0][1], from) &&
        events[1]?.[0] === "slideStopped" &&
        nclose(events[1][1], to) &&
        events[2]?.[0] === "recoveryPlant" &&
        events[2][1] > to &&
        events[2][1] < seconds,
    );
  }

  const resumed: HumanPerformance = take("right", metres, "recoveryPlant");
  const standing: IAutoMovieMotionHumanSegment = resumed.segments("bowler")[1]!;
  const left = (second: number): IAutoMovieVector3 =>
    resumed.bones("bowler", second).get("leftFoot")!.worldPosition;
  TestValidator.predicate(
    "standing can start at recovery without a discontinuity at the planted foot",
    standing.law.name === "stand" &&
      nclose(standing.start, (seconds + to) / 2) &&
      vclose(
        left(standing.start - 1e-4),
        left(standing.start + 1e-4),
        tolerance,
      ),
  );
  for (const [name, attempt, kind] of [
    [
      "an unreachable glide refuses on distance",
      () => take("right", body.measure.thigh + body.measure.shank),
      "reach",
    ],
    [
      "a cut that would interrupt the travelling support is refused",
      () => take("right", metres, "slideStarted"),
      "cut",
    ],
  ] as const) {
    let refusal: unknown;
    try {
      attempt();
    } catch (error: unknown) {
      refusal = error;
    }
    TestValidator.predicate(
      name,
      refusal instanceof HumanRefusal &&
        refusal.kind === kind &&
        (kind !== "reach" || refusal.axis === "distance"),
    );
  }
}
