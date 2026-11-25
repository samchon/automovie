import { HumanLungePivot, walkReach } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * The `HumanLunge` law's pivot (`HumanLungePivot`): the handler's feet follow
 * the horse's bearing in pivot steps, each taken once the bearing runs
 * `TRIGGER` (a third of the hip's twist) from the feet, led by the foot on that
 * side, the other following a swing later, each turning on a minimum-jerk share
 * to the bearing two swings on plus `TRIGGER`; a bearing running more than the
 * hip's twist from the feet is refused.
 *
 * Scenarios:
 *
 * 1. A still bearing takes no step.
 * 2. A bearing turning `2 TRIGGER` per second, read every 0.25 s with 0.5 s
 *    swings, first steps at 0.5 s led by the left foot, to `4 TRIGGER` past the
 *    entry; halfway through its swing the left foot has turned half of it, the
 *    right not yet.
 * 3. A bearing a whole twist and more off the feet at once is refused.
 */
export function test_motions_lexicon_lunge(): void {
  const trigger: number = HumanLungePivot.TRIGGER;
  TestValidator.equals(
    "a still bearing",
    HumanLungePivot.plan((): number => 0, 3, 0, 0.5, 0.25).steps,
    [],
  );
  const turning = (t: number): number => 2 * trigger * t;
  const schedule: HumanLungePivot.ISchedule = HumanLungePivot.plan(
    turning,
    3,
    0,
    0.5,
    0.25,
  );
  const first: HumanLungePivot.IStep = schedule.steps[0]!;
  const left: HumanLungePivot.IFoot = HumanLungePivot.foot(
    schedule,
    "left",
    0.75,
  );
  const right: HumanLungePivot.IFoot = HumanLungePivot.foot(
    schedule,
    "right",
    0.75,
  );
  TestValidator.predicate(
    "the first pivot step",
    nclose(first.start, 0.5, 1e-12) &&
      first.lead === "left" &&
      nclose(first.to, turning(1.5) + trigger, 1e-9) &&
      nclose(left.heading, first.to / 2, 1e-9) &&
      nclose(left.swing!, 0.5, 1e-12) &&
      right.heading === 0,
  );
  TestValidator.predicate(
    "a bearing past the twist",
    throwsError(() =>
      HumanLungePivot.plan((): number => walkReach.TWIST + 1, 3, 0, 0.5, 0.25),
    ),
  );
}
