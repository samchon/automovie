import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import {
  walkPaced
} from "../../../../../packages/motions/src/actions/internal/walkPaced";
import type {
  walkStation
} from "../../../../../packages/motions/src/gait/internal/walkStation";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Rounding of a few linear products, seconds. */
const ROUNDING: number = 1e-12;

/**
 * `walkPaced` plays a stepping plan on a tabulated clock: at film second `t`
 * the body is where the plan has it at the plan second the table interpolates
 * linearly there, and each event, contact window and decisive instant moves to
 * the first film second that reaches it.
 *
 * Scenarios, a 2 s plan with `strike` at a quarter, a plant over its second
 * half and a contact at 1.5 s, on a table of half-second entries 0, 0, 0.5, 1,
 * 1, 2 (a late start, a stand at 1 s and a hurry to the end):
 *
 * 1. The paced plan lasts 2.5 s; its posture at 0.75 s reads the plan at 0.25 s,
 *    at 1.6 s at 1 s, standing, and at 2.25 s at 1.5 s.
 * 2. The strike at plan 0.5 s moves to 1 s, share 0.4; the plant's start at plan 1
 *    s to 1.5 s, the first second the clock reaches it, share 0.6; the contact
 *    at plan 1.5 s to 2.25 s.
 * 3. A table of one entry returns the plan as it is.
 *
 * @evidence contracts/development/common.md#meaningful-documentation A tabulated walk holds or advances the plan clock and moves events and contacts to their first reachable film seconds.
 * @evidence contracts/development/testing.md#behavioral-verification Calls paced playback with an explicit clock containing a delay and a plateau, and compares a one-entry table.
 * @evidence contracts/development/testing.md#independent-expectations Linear interpolation gives the three queried plan times. The first table crossing gives the event and contact-window times even when the clock repeats a value.
 */
export function test_motions_actions_walk_paced(): void {
  const plan: walkStation.IPlan = {
    duration: 2,
    events: [{ name: "strike", share: 0.25 }],
    contacts: [
      {
        part: "leftFoot",
        kind: "plant",
        from: 0.5,
        to: 1,
        support: { kind: "ground" },
      },
    ],
    contact: 1.5,
    posture: (seconds: number): IAutoMovieMotionHumanPosture => ({
      root: { x: seconds, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    }),
  };
  const paced: walkStation.IPlan = walkPaced(plan, 0.5, [0, 0, 0.5, 1, 1, 2]);
  TestValidator.predicate(
    "the clock",
    nclose(paced.duration, 2.5, ROUNDING) &&
      nclose(paced.posture(0.75).root.x, 0.25, ROUNDING) &&
      nclose(paced.posture(1.6).root.x, 1, ROUNDING) &&
      nclose(paced.posture(2.25).root.x, 1.5, ROUNDING),
  );
  TestValidator.predicate(
    "the moved instants",
    nclose(paced.events[0]!.share, 0.4, ROUNDING) &&
      nclose(paced.contacts[0]!.from, 0.6, ROUNDING) &&
      nclose(paced.contacts[0]!.to, 1, ROUNDING) &&
      nclose(paced.contact!, 2.25, ROUNDING),
  );
  TestValidator.predicate("one entry", walkPaced(plan, 0.5, [0]) === plan);
}
