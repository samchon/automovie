import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanWalkSteps,
} from "@automovie/interface";
import { HumanFoot, walkSteps } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";

/** Rounding of a footfall's place along a 10 m path, metres. */
const ROUNDING: number = 1e-9;

/**
 * `walkSteps.plan` lays a straight, externally paced walk's footprints: in
 * double support (swing at or under one period) each footprint lands half a
 * step ahead of the pelvis, and with a flight (swing over one period) the
 * pressure path's middle, between the heel and the ball, lands under the
 * pelvis at midstance.
 *
 * On the average man walking 10 m at 1 m/s and a 1 s period, the travel
 * linear in time, the ankle a third of the contact after the third left heel
 * strike is read.
 *
 * It reads the rest joints, the measure and the sole sockets through
 * HumanFoot, whose sole points take the whole body record, so the test
 * builds the stored body (humanFixtureBody).
 *
 * Scenarios:
 *
 * 1. With swing 0.999 and 1 the ankle stands half a step ahead of where the
 *    pelvis was at the landing.
 * 2. With swing 1.001 it stands half the contact ahead, less the heel-to-ball
 *    middle's offset over the step.
 */
export async function test_unit_motions_actions_walk_steps_plan(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const entry: IAutoMovieMotionHumanEntryState = motionActionContext(body, {}).entry;
  const start: number = (entry.feet.left.ankle.z + entry.feet.right.ankle.z) / 2;
  const distance: number = 10;
  const offset: number =
    (HumanFoot.offset(body, "left", "heel").z + HumanFoot.offset(body, "left", "mtp").z) / 2;
  for (const swing of [0.999, 1, 1.001]) {
    const plan: IAutoMovieMotionHumanWalkSteps.IPlan = walkSteps.plan({
      body,
      entry,
      to: {
        x: (entry.feet.left.ankle.x + entry.feet.right.ankle.x) / 2,
        y: 0,
        z: start + distance,
      },
      speed: 1,
      longest: 1,
      swing,
      period: (): number => 1,
      travel: (seconds: number): number => Math.max(0, Math.min(1, seconds / distance)),
    });
    const strikes = plan.events.filter((event): boolean => event.name.includes("HeelStrike"));
    const landing: number = strikes.find((event): boolean => event.name === "leftHeelStrike3")!
      .seconds;
    const step: number = distance / (strikes.length - 1);
    const contact: number = 2 - swing;
    const lead: number = swing <= 1 ? 0.5 : contact / 2 - offset / step;
    TestValidator.predicate(
      `the footprint with swing ${swing}`,
      nclose(
        plan.foot("left", landing + contact / 3).placement.ankle.z,
        start + landing + lead,
        ROUNDING,
      ),
    );
  }
}
