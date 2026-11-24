import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";

import { everydayTake } from "../../../../features/internal/everydayTake";
import { motionComplaints } from "../../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../../features/internal/motionHumanBody";
import { carriageScene } from "../../../internal/carriageScene";
import { motionActionUnit } from "../../../internal/motionActionUnit";
import { motionGraspUnit } from "../../../internal/motionGraspUnit";

/**
 * A suitcase taken by its drawn pull handle and pulled through a walk and a
 * turn, on its own: the pickUp and the two walks of the airport arrival of
 * `test_motion_mechanism_carriage`, on the average man and the small woman,
 * entered by the minimal chain stand > operate (the handle drawn out; the
 * backpack worn meanwhile is left out: it rides the chest, not the pulling
 * arm).
 *
 * Scenarios:
 *
 * 1. The pickUp closes the left hand on the drawn pull bar and the case rides it
 *    (`motionGraspUnit.pickUp`: the grasp and pickUp contracts).
 * 2. Through both walks the case's wheels stay on the floor, within the original's
 *    20 mm, read at 13 steps of each walk.
 * 3. Through both walks the case stays behind the walker, less than 100 mm ahead
 *    of the hips along their facing, as the original reads it.
 * 4. The pickUp and each walk keep the shipped bounds over their own spans.
 *
 * Decomposes the original's wheel and tracking checks, read here on a pull
 * entered by its own minimal chain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original, its steps and checks, the entry, the bodies and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs stand > operate > pickUp > walk > walk and reads the displayed hand, case and hips, with the verdict report over each action's span; a hand off the bar, a case lifted off its wheels or swung ahead of the walker or a finding in any action fails.
 * @evidence contracts/development/testing.md#independent-expectations The floor and tracking bounds are the original's; the grasp's place is the pickUp contract's on the archetype's `pull` handle.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies of opposite stature through a straight walk and a turn; drawing the handle is `test_motion_mechanism_carriage_draw_handle`'s.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_mechanism_carriage_pull_suitcase`.
 */
export function test_motion_mechanism_carriage_pull_suitcase(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const name of ["m-average", "f-small"] as const) {
    const label: string = `${name} pulls the suitcase`;
    try {
      pull(checks, label, motionHumanBody(name));
    } catch (error: unknown) {
      checks.check(`${label}: ${everydayTake.describe(error)}`, false);
    }
  }
  checks.assert("a suitcase is pulled on its wheels behind the walker");
}

/** One body's pull and its checks. */
function pull(
  checks: motionComplaints.IGatherer,
  label: string,
  body: IAutoMovieMotionHumanBody,
): void {
  const a: carriageScene.IArrival = carriageScene.arrival(body);
  const take: HumanPerformance = carriageScene.perform(
    `${label} pull`,
    body,
    a.props,
    carriageScene.walks(
      carriageScene.pull(
        carriageScene.draw(HumanChain.subject("actor").stand(), a),
      ),
    ),
  );
  motionGraspUnit.pickUp(checks, label, take, body, {
    subject: "actor",
    side: "left",
    prop: "case",
    model: a.case,
    handle: "pull",
    lift: 0,
  });
  const walks: IAutoMovieMotionHumanSegment[] = [1, 2].map(
    (n: number): IAutoMovieMotionHumanSegment =>
      motionActionUnit.segment(take, "actor", "walk", n),
  );
  const towed: carriageScene.ITowed = carriageScene.towed(take, walks);
  checks.check(
    `${label}: the suitcase's wheels stay on the floor (${(towed.wheels * 1000).toFixed(1)} mm)`,
    towed.wheels <= carriageScene.FLOOR,
  );
  checks.check(
    `${label}: the suitcase tracks behind the walker through the turn`,
    towed.behind,
  );
  for (const walk of walks)
    motionActionUnit.bounds(checks, label, take, "actor", walk);
}
