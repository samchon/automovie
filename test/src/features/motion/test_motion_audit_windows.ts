import {
  AutoMovieMotionHumanAuditBalance,
  IAutoMovieMotionHumanAuditMotion,
  type IHumanContactWindow,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionAuditPoints } from "../internal/motionAuditPoints";

/**
 * Declared contact windows in film seconds, and the instants at which both
 * feet alone bear the body.
 *
 * A window's shares are of its action's own duration from the action's
 * start; the action holds the body only from its entry to its end. The film
 * here has two actions: `first` starts at 1 s, lasts 2 s and is entered at
 * its start; `second` starts at 2.5 s on its own clock, lasts 4 s, is entered
 * at 3 s (it interrupts `first`) and ends at 6.5 s.
 *
 * Scenarios:
 * 1. A left-foot plant over shares 0.25 to 0.75 of `first` spans 1.5 to 2.5 s.
 * 2. A right-foot plant over the whole of `second` would span 2.5 to 6.5 s
 *    and is clipped to the entry: 3 to 6.5 s.
 * 3. A hand grip over shares 0 to 0.1 of `second` ends at 2.9 s, before the
 *    entry at 3 s, and is dropped.
 * 4. A window clipped to nothing but one instant (shares 0 to 0.125 of
 *    `second`, ending at exactly 3 s) is kept as that instant.
 * 5. With the left foot in a ground plant from 3 to 5 s, the right from 4
 *    to 5 s and a hand grip from 4.5 to 5 s: at 4.2 s both feet alone bear
 *    the body; at 4.7 s the grip is open and they do not; at 3.5 s only one
 *    foot is planted; at 5.5 s nothing is declared.
 * 6. A foot planted on a prop, or a foot in a pivot, does not count as
 *    standing on the ground.
 * 7. Asked whether both feet stay planted to a later second (the hold a
 *    standing balance needs): with the left foot planted from 0 to 2 s and
 *    2 to 4 s by two actions and the right from 0 to 1 s and from 1.6 s, the
 *    body stands from 0.5 to 0.8 s, does not from 0.8 to 1.1 s (the right
 *    foot lifts at 1 s) though it does at 0.8 s alone, and stands from 1.9 to
 *    2.2 s across the two actions' plants.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public window list and the standing predicate; an unclipped window, a kept empty window or a grip ignored by the predicate fails.
 * @evidence contracts/development/testing.md#independent-expectations Every second is `start + share * duration` clipped to the stated entry and end, by hand.
 * @evidence contracts/development/testing.md#distinguishing-cases An unclipped window, a clipped one, a dropped one, a degenerate one, and the predicate's every branch.
 * @evidence contracts/development/testing.md#execution-ownership A pure in-memory unit. It runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the film and lists the 7 scenarios with their seconds.
 */
export function test_motion_audit_windows(): void {
  const ground: IHumanContactWindow["support"] = { kind: "ground" };
  const contact = (
    part: IHumanContactWindow["part"],
    kind: IHumanContactWindow["kind"],
    from: number,
    to: number,
    support: IHumanContactWindow["support"] = ground,
  ): IHumanContactWindow => ({ part, kind, from, to, support });
  const span = (
    name: string,
    start: number,
    entryTime: number,
    end: number,
    duration: number,
    contacts: IHumanContactWindow[],
  ): IAutoMovieMotionHumanAuditMotion.ISpan => ({
    name,
    start,
    entryTime,
    end,
    plan: { duration, contacts },
  });
  const film = (
    spans: IAutoMovieMotionHumanAuditMotion.ISpan[],
  ): IAutoMovieMotionHumanAuditMotion.IWindow[] =>
    IAutoMovieMotionHumanAuditMotion.windows(
      motionAuditPoints(6.5, () => ({}), spans),
      "a",
    );
  const near = (got: number, expected: number): boolean =>
    Math.abs(got - expected) <= 1e-9;

  const windows: IAutoMovieMotionHumanAuditMotion.IWindow[] = film([
    span("first", 1, 1, 3, 2, [contact("leftFoot", "plant", 0.25, 0.75)]),
    span("second", 2.5, 3, 6.5, 4, [
      contact("rightFoot", "plant", 0, 1),
      contact("rightHand", "grip", 0, 0.1),
      contact("leftHand", "grip", 0, 0.125),
    ]),
  ]);
  TestValidator.equals("the dropped window is gone", windows.length, 3);
  TestValidator.predicate(
    "shares become film seconds",
    windows[0]!.action === "first" &&
      windows[0]!.contact.part === "leftFoot" &&
      near(windows[0]!.from, 1.5) &&
      near(windows[0]!.to, 2.5),
  );
  TestValidator.predicate(
    "a window is clipped to its action's entry",
    windows[1]!.action === "second" &&
      windows[1]!.contact.part === "rightFoot" &&
      near(windows[1]!.from, 3) &&
      near(windows[1]!.to, 6.5),
  );
  TestValidator.predicate(
    "a window clipped to one instant is kept",
    windows[2]!.contact.part === "leftHand" &&
      near(windows[2]!.from, 3) &&
      near(windows[2]!.to, 3),
  );

  const standing = AutoMovieMotionHumanAuditBalance.standing;
  const stance: IAutoMovieMotionHumanAuditMotion.IWindow[] = film([
    span("stance", 3, 3, 6.5, 2, [
      contact("leftFoot", "plant", 0, 1),
      contact("rightFoot", "plant", 0.5, 1),
      contact("rightHand", "grip", 0.75, 1, { kind: "prop", subject: "rail" }),
    ]),
  ]);
  TestValidator.equals("both feet alone", standing(stance, 4.2), true);
  TestValidator.equals("an open grip", standing(stance, 4.7), false);
  TestValidator.equals("one foot", standing(stance, 3.5), false);
  TestValidator.equals("nothing declared", standing(stance, 5.5), false);
  TestValidator.equals(
    "a foot on a prop",
    standing(
      film([
        span("step", 0, 0, 6.5, 6.5, [
          contact("leftFoot", "plant", 0, 1),
          contact("rightFoot", "plant", 0, 1, { kind: "prop", subject: "box" }),
        ]),
      ]),
      2,
    ),
    false,
  );
  TestValidator.equals(
    "a pivoting foot",
    standing(
      film([
        span("turn", 0, 0, 6.5, 6.5, [
          contact("leftFoot", "plant", 0, 1),
          contact("rightFoot", "pivot", 0, 1),
        ]),
      ]),
      2,
    ),
    false,
  );

  // 7. A step being taken: the left foot planted by two actions back to back,
  // the right planted to 1 s and again from 1.6 s.
  const gait: IAutoMovieMotionHumanAuditMotion.IWindow[] = film([
    span("one", 0, 0, 2, 2, [
      contact("leftFoot", "plant", 0, 1),
      contact("rightFoot", "plant", 0, 0.5),
      contact("rightFoot", "plant", 0.8, 1),
    ]),
    span("two", 2, 2, 4, 2, [
      contact("leftFoot", "plant", 0, 1),
      contact("rightFoot", "plant", 0, 1),
    ]),
  ]);
  TestValidator.equals(
    "both feet stay planted for the hold",
    standing(gait, 0.5, 0.8),
    true,
  );
  TestValidator.equals(
    "a foot lifts within the hold",
    standing(gait, 0.8, 1.1),
    false,
  );
  TestValidator.equals(
    "the same instant without a hold",
    standing(gait, 0.8),
    true,
  );
  TestValidator.equals(
    "plants of two actions back to back are one plant",
    standing(gait, 1.9, 2.2),
    true,
  );
}
