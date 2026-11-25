import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import { stretch } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";

/**
 * A plan is a pure function of its inputs: the same law planned twice from the
 * same context in one process, its arm placed through the trajectory optimiser
 * both times, reads the same posture at every second, so nothing a plan
 * computes carries over to the next or depends on the order it ran in.
 *
 * Scenarios, the average man at the origin facing +Z, a cross-body shoulder
 * stretch held 2 s:
 *
 * 1. The two plans' durations, events and contacts are equal.
 * 2. Their postures are equal at every tenth of a second.
 */
export async function test_unit_motions_compose_plan_determinism(): Promise<void> {
  // Whole body: the stretch places an arm over the full rig.
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const plan = (): IAutoMovieMotionHumanActionPlan =>
    stretch.plan(
      motionActionContext(body, { kind: "crossBody", side: "right", hold: 2 }),
    );
  const a: IAutoMovieMotionHumanActionPlan = plan();
  const b: IAutoMovieMotionHumanActionPlan = plan();
  TestValidator.equals(
    "the same clock and contacts",
    [a.duration, a.events, a.contacts],
    [b.duration, b.events, b.contacts],
  );
  const seconds: number[] = Array.from(
    { length: Math.floor(a.duration * 10) + 1 },
    (_: unknown, i: number): number => i / 10,
  );
  TestValidator.equals(
    "the same postures",
    seconds.map((t: number): string => JSON.stringify(a.posture(t))),
    seconds.map((t: number): string => JSON.stringify(b.posture(t))),
  );
}
