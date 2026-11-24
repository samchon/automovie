import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { type walkStation, walkTempo } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few sums and the inverse's 40 halvings, seconds. */
const ROUNDING: number = 1e-9;

/**
 * `walkTempo` takes a stepping plan's steps unevenly in time: each step between
 * two heel strikes lasts its planned time stretched by its own share, held
 * within `HOLD`, a limp cutting the spared leg's steps short and drawing the
 * other's out, the plan's clock running at `1 + k sin^2(pi u)` of the film's
 * within a step; `strikes` names a plan's heel strikes and `entrainment` sends
 * them to given seconds.
 *
 * Scenarios, a 4 s plan striking left at 1 s, right at 2 s and left at 3 s, its
 * root `x` the plan's second:
 *
 * 1. The strikes are left 1, right 2 and left 3 s.
 * 2. Stretching the first step by a tenth and shrinking the second by a tenth
 *    keeps 4 s; the second strike falls at 2.1 s and the third at 3 s; the
 *    middle of the first step, 1.55 s, reads the plan at 1.5 s, since the
 *    rate's sine integrates to a half there; before the first strike and after
 *    the last the clocks run alike.
 * 3. A half stretch is held at a fifth: the first step lasts 1.2 s.
 * 4. A 5 % limp spared on the left shortens the left-struck first step to 0.95 s
 *    and lengthens the second to 1.05 s.
 * 5. Entraining the strikes to 1, 2.2 and 3.1 s maps plan 2 s to 2.2 s and film
 *    3.1 s to plan 3 s; a step longer than twice its planned time is refused,
 *    and a plan with one strike is returned as it is.
 */
export function test_unit_motions_actions_walk_tempo(): void {
  const event: (name: string, share: number) => IAutoMovieMotionEvent = (
    name: string,
    share: number,
  ): IAutoMovieMotionEvent => ({ name, share });
  const plan: walkStation.IPlan = {
    duration: 4,
    events: [
      event("leftHeelStrike1", 0.25),
      event("ready", 0.3),
      event("rightHeelStrike1", 0.5),
      event("leftHeelStrike2", 0.75),
    ],
    contacts: [],
    posture: (seconds: number): IAutoMovieMotionHumanPosture => ({
      root: { x: seconds, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    }),
  };
  TestValidator.equals("the strikes", walkTempo.strikes(plan), [
    { seconds: 1, side: "left" },
    { seconds: 2, side: "right" },
    { seconds: 3, side: "left" },
  ]);
  const strike: (p: walkStation.IPlan, name: string) => number = (
    p: walkStation.IPlan,
    name: string,
  ): number =>
    p.events.find((e: IAutoMovieMotionEvent): boolean => e.name === name)!
      .share * p.duration;
  const uneven: walkStation.IPlan = walkTempo(plan, (index: number): number =>
    index === 0 ? 0.1 : -0.1,
  );
  TestValidator.predicate(
    "an uneven step",
    nclose(uneven.duration, 4, ROUNDING) &&
      nclose(strike(uneven, "rightHeelStrike1"), 2.1, ROUNDING) &&
      nclose(strike(uneven, "leftHeelStrike2"), 3, ROUNDING) &&
      nclose(uneven.posture(1.55).root.x, 1.5, ROUNDING) &&
      nclose(uneven.posture(0.5).root.x, 0.5, ROUNDING) &&
      nclose(uneven.posture(3.5).root.x, 3.5, ROUNDING),
  );
  TestValidator.predicate(
    "held at a fifth",
    nclose(
      strike(
        walkTempo(plan, (): number => 0.5),
        "rightHeelStrike1",
      ),
      2.2,
      ROUNDING,
    ),
  );
  TestValidator.predicate(
    "a limp",
    nclose(
      strike(
        walkTempo(plan, (): number => 0, { side: "left", share: 0.05 }),
        "rightHeelStrike1",
      ),
      1.95,
      ROUNDING,
    ),
  );
  const clock: walkTempo.IClock = walkTempo.entrainment(
    walkTempo.strikes(plan),
    [1, 2.2, 3.1],
  )!;
  TestValidator.predicate(
    "entrained",
    nclose(clock.toFilm(2), 2.2, ROUNDING) &&
      nclose(clock.toPlan(3.1), 3, ROUNDING),
  );
  TestValidator.error("a step past twice its time", (): void => {
    walkTempo.entrainment(walkTempo.strikes(plan), [1, 3.5]);
  });
  const single: walkStation.IPlan = {
    ...plan,
    events: [event("leftHeelStrike1", 0.5)],
  };
  TestValidator.predicate(
    "one strike",
    walkTempo(single, (): number => 0.1) === single &&
      walkTempo.entrainment(walkTempo.strikes(single), [2]) === undefined,
  );
}
