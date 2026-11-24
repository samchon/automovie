import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  poseBones,
  presentHand,
  presentHandPlace,
  resolveHumanPosture,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { nclose } from "../../../internal/nclose";

/**
 * How near the presented wrist lies to the palm's place, metres: the hand's
 * length, the most the wrist joint lies from a point on the palm.
 *
 * @param body The body.
 * @returns Metres.
 */
const near = (body: IAutoMovieMotionHumanBody): number => body.measure.hand;

/**
 * How near the returned wrist lies to where it hung, metres: a centimetre, the
 * arm course's settle back onto its entry.
 */
const RETURNED: number = 0.01;

/**
 * `presentHand` plans a hand presented to a partner: the palm goes to the place
 * the arm reaches with the upper arm hanging and the forearm level ahead
 * (`presentHandPlace`), stays the authored seconds and returns, with `ready`
 * once presented and `relax` as it starts back.
 *
 * Scenarios, the average man standing at the origin facing +Z, presenting the
 * left hand for 0.5 s:
 *
 * 1. `relax` follows `ready` by the 0.5 s hold.
 * 2. At `ready` the left wrist lies within a hand's length of the palm's place.
 * 3. At the end the wrist is back within a centimetre of where it hung.
 *
 * The body is built whole (`humanFixtureBody`): the plan solves the arm on the
 * body's rig and reads its measure, and the wrist is read by forward
 * kinematics of the whole posture.
 */
export async function test_unit_motions_dressing_present_hand(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const context = motionActionContext(body, { side: "left", hold: 0.5 });
  const plan: IAutoMovieMotionHumanActionPlan = presentHand.plan(context);
  const at = (name: string): number =>
    plan.duration *
    plan.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share;
  const wrist = (seconds: number): IAutoMovieVector3 =>
    poseBones(body, resolveHumanPosture(body, plan.posture(seconds))).get(
      "leftHand",
    )!.worldPosition;
  TestValidator.predicate(
    "the hold",
    nclose(at("relax") - at("ready"), 0.5, 1e-9),
  );
  const place: IAutoMovieVector3 = presentHandPlace(body.measure, "left", {
    origin: context.entry.posture.root,
    yaw: 0,
  });
  const presented: IAutoMovieVector3 = wrist(at("ready"));
  TestValidator.predicate(
    "presented",
    Math.hypot(
      presented.x - place.x,
      presented.y - place.y,
      presented.z - place.z,
    ) <= near(body),
  );
  const hung: IAutoMovieVector3 = wrist(0);
  const back: IAutoMovieVector3 = wrist(plan.duration);
  TestValidator.predicate(
    "returned",
    Math.hypot(back.x - hung.x, back.y - hung.y, back.z - hung.z) <= RETURNED,
  );
}
