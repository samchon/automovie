import { AutoMovieGravity } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieVector3,
} from "@automovie/interface";
import { StrikingStance, step } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";

/**
 * `step`, fighting-stance footwork: what it hands its primitives, the feet's
 * plant windows, the events and the root's travel, read off its plan without
 * any posture solve.
 *
 * The average man stands at the origin facing +Z, his feet level, so the left
 * leads and the stance line is turned 30 degrees from the heading.
 *
 * Scenarios:
 *
 * 1. Two steps forward last `2 PERIOD sqrt(hip / g)`, with `step1` at a half and
 *    `step2` at the end. The lead (left) foot swings first in each step's first
 *    half, the rear in `[0.45, 0.95]` of it, so the plant windows by share are
 *    left `[0, 0]`, `[0.25, 0.5]`, `[0.75, 1]` and right `[0, 0.225]`, `[0.475,
 *    0.725]`, `[0.975, 1]`; the root ends two half-stance lengths along the
 *    line (`sin 30, 0, cos 30`).
 * 2. Exchanging the lead in place moves the old rear foot first: the right foot
 *    leaves at 0 and lands at 0.45, the left leaves at 0.5 and lands at 0.95.
 * 3. A 15 degree turn in place pivots the lead (left) shoe on its ball over `[0,
 *    0.95]` and plants it after, while the rear swings over the same beat and
 *    plants at 0.95.
 * 4. A turn of more than 90 degrees a step is refused.
 */
export async function test_unit_motions_striking_step(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const forward: IAutoMovieMotionHumanActionPlan = step.plan(
    motionActionContext(body, { direction: "forward", steps: 2 }),
  );
  const stride: number =
    step.PERIOD * Math.sqrt(body.measure.hipHeight / AutoMovieGravity.STANDARD);
  const windows = (
    plan: IAutoMovieMotionHumanActionPlan,
    part: string,
  ): number[][] =>
    (plan.contacts ?? [])
      .filter(
        (c: IAutoMovieMotionHumanContactWindow): boolean => c.part === part,
      )
      .map((c: IAutoMovieMotionHumanContactWindow): number[] => [c.from, c.to]);
  const same = (got: number[][], want: number[][]): boolean =>
    got.length === want.length &&
    got.every(
      (w: number[], i: number): boolean =>
        nclose(w[0]!, want[i]![0]!, 1e-12) &&
        nclose(w[1]!, want[i]![1]!, 1e-12),
    );
  TestValidator.predicate(
    "two steps' time and events",
    nclose(forward.duration, 2 * stride, 1e-12) &&
      forward.events.length === 2 &&
      forward.events[0]!.name === "step1" &&
      forward.events[0]!.share === 0.5 &&
      forward.events[1]!.name === "step2" &&
      forward.events[1]!.share === 1,
  );
  TestValidator.predicate(
    "the plant windows",
    same(windows(forward, "leftFoot"), [
      [0, 0],
      [0.25, 0.5],
      [0.75, 1],
    ]) &&
      same(windows(forward, "rightFoot"), [
        [0, 0.225],
        [0.475, 0.725],
        [0.975, 1],
      ]),
  );
  const travel: number = 2 * 0.5 * StrikingStance.length(body);
  const end: IAutoMovieVector3 = forward.posture(forward.duration).root;
  const begin: IAutoMovieVector3 = forward.posture(0).root;
  TestValidator.predicate(
    "the root travels along the line",
    nclose(end.x - begin.x, travel * Math.sin(Math.PI / 6), 1e-9) &&
      nclose(end.z - begin.z, travel * Math.cos(Math.PI / 6), 1e-9),
  );

  const exchange: IAutoMovieMotionHumanActionPlan = step.plan(
    motionActionContext(body, { direction: "forward", lead: "right" }),
  );
  TestValidator.predicate(
    "the old rear foot moves first",
    same(windows(exchange, "rightFoot"), [[0.45, 1]]) &&
      same(windows(exchange, "leftFoot"), [
        [0, 0.5],
        [0.95, 1],
      ]),
  );

  const pivot: IAutoMovieMotionHumanActionPlan = step.plan(
    motionActionContext(body, { direction: "forward", turn: 15 }),
  );
  TestValidator.predicate(
    "the lead pivots on its ball",
    same(windows(pivot, "leftFoot"), [
      [0, 0.95],
      [0.95, 1],
    ]) &&
      (pivot.contacts ?? []).some(
        (c: IAutoMovieMotionHumanContactWindow): boolean =>
          c.part === "leftFoot" && c.kind === "pivot",
      ) &&
      same(windows(pivot, "rightFoot"), [[0.95, 1]]),
  );

  TestValidator.error("a turn past 90 degrees a step", () =>
    step.plan(
      motionActionContext(body, { direction: "forward", steps: 1, turn: 120 }),
    ),
  );
}
