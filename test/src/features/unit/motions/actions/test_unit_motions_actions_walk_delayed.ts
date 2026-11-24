import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { walkDelayed } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of one share's division, unitless. */
const ROUNDING: number = 1e-12;

/**
 * `walkDelayed` waits in a plan's first posture before it begins: its duration
 * grows by the wait, each share `s` after the start becomes `(wait + s d) /
 * (wait + d)`, a share at the start stays at it, a `depart` event marks the
 * wait's end, and a read at `t` reads the plan at `max(0, t - wait)`.
 *
 * The plan here lasts 2 s; it is delayed by 1 s.
 *
 * Scenarios:
 *
 * 1. The duration is 3 s and `depart` stands at 1 / 3.
 * 2. An event at half the plan moves to (1 + 1) / 3 = 2 / 3; one at its start
 *    stays at 0.
 * 3. A contact open from the start stays open from it; its end at half the plan
 *    moves to 2 / 3.
 * 4. The plan's contact second 1 moves to 2.
 * 5. A read inside the wait reads the plan's start; a read at 2.5 s reads it at
 *    1.5 s.
 */
export function test_unit_motions_actions_walk_delayed(): void {
  const plan: IAutoMovieMotionHumanActionPlan = {
    duration: 2,
    events: [
      { name: "begin", share: 0 },
      { name: "middle", share: 0.5 },
    ],
    contacts: [
      {
        part: "leftFoot",
        kind: "plant",
        from: 0,
        to: 0.5,
        support: { kind: "ground" },
      },
    ],
    contact: 1,
    posture: (seconds: number): IAutoMovieMotionHumanPosture => ({
      root: { x: seconds, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    }),
  };
  const delayed: IAutoMovieMotionHumanActionPlan = walkDelayed(plan, 1);

  // 1. The wait's length and its end.
  TestValidator.equals("the duration", delayed.duration, 3);
  TestValidator.predicate(
    "depart at the wait's end",
    delayed.events[0]!.name === "depart" &&
      nclose(delayed.events[0]!.share, 1 / 3, ROUNDING),
  );

  // 2. The events after the wait.
  TestValidator.equals("an event at the start", delayed.events[1]!.share, 0);
  TestValidator.predicate(
    "an event at half the plan",
    nclose(delayed.events[2]!.share, 2 / 3, ROUNDING),
  );

  // 3. The contact window.
  TestValidator.predicate(
    "a window open from the start",
    delayed.contacts[0]!.from === 0 &&
      nclose(delayed.contacts[0]!.to, 2 / 3, ROUNDING),
  );

  // 4. The contact second.
  TestValidator.equals("the contact second", delayed.contact, 2);

  // 5. The reads.
  TestValidator.equals("inside the wait", delayed.posture(0.5).root.x, 0);
  TestValidator.predicate(
    "after the wait",
    nclose(delayed.posture(2.5).root.x, 1.5, ROUNDING),
  );
}
