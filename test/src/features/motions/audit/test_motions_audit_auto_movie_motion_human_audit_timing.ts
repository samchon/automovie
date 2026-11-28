import type { IAutoMovieMotionHumanAuditTiming } from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditTiming
} from "../../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditTiming";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieMotionHumanAuditTiming` reads what placed actions declare about
 * their own time: `faults` lists each incoherent declaration, `instant` is a
 * named event's film second, `order` the events out of a stated order, and
 * `shared` how far apart two actions put an instant they share.
 *
 * Scenarios, a 2 s wave starting at 1 s with `ready` at a quarter and `relax`
 * at three quarters, and a 1 s nod from 3 s with `ready` at a half:
 *
 * 1. The two cohere: no fault.
 * 2. A nod entered at 2.5 s, before the wave ends at 3 s, with an event at share
 *    1.5, two events named `ready`, a grip window ending before it starts, and
 *    a contact past its end alongside a feigned contact, lists each fault.
 * 3. The wave's `ready` falls at 1.5 s; its order `relax`, `ready` puts `ready`
 *    before `relax`, and a missing `stroke` is named; its `ready` and the nod's
 *    are 2 s apart; an undeclared event is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names coherent and malformed timing, event film seconds, order and absence diagnostics, and two actions' event separation.
 * @evidence contracts/development/testing.md#behavioral-verification Calls AuditTiming faults, instant, order and shared on authored schedules with duplicate events, incompatible contact fields, and reversed window bounds.
 * @evidence contracts/development/testing.md#independent-expectations The wave starts at 1 s and reaches a quarter of its 2 s duration at 1.5 s. The nod reaches its half-share at 3.5 s, so their ready events differ by 2 s. The invalid fixture determines each listed fault.
 */
export function test_motions_audit_auto_movie_motion_human_audit_timing(): void {
  const wave: IAutoMovieMotionHumanAuditTiming.ISpan = {
    name: "wave",
    start: 1,
    entryTime: 1,
    end: 3,
    plan: {
      duration: 2,
      events: [
        { name: "ready", share: 0.25 },
        { name: "relax", share: 0.75 },
      ],
      contacts: [],
    },
  };
  const nod: IAutoMovieMotionHumanAuditTiming.ISpan = {
    name: "nod",
    start: 3,
    entryTime: 3,
    end: 4,
    plan: {
      duration: 1,
      events: [{ name: "ready", share: 0.5 }],
      contacts: [],
    },
  };
  TestValidator.equals(
    "coherent",
    AutoMovieMotionHumanAuditTiming.faults([wave, nod]),
    [],
  );
  const early: IAutoMovieMotionHumanAuditTiming.ISpan = {
    name: "nod",
    start: 2.5,
    entryTime: 2.5,
    end: 3.5,
    plan: {
      duration: 1,
      events: [
        { name: "ready", share: 0.5 },
        { name: "ready", share: 0.6 },
        { name: "late", share: 1.5 },
      ],
      contacts: [
        {
          part: "rightHand",
          kind: "grip",
          from: 0.6,
          to: 0.4,
          support: { kind: "ground" },
        },
      ],
      contact: 2,
      feigned: 0.5,
    },
  };
  TestValidator.equals(
    "faults",
    AutoMovieMotionHumanAuditTiming.faults([wave, early]),
    [
      "1 nod: entered at 2.5 before wave ends",
      "1 nod: event ready twice",
      "1 nod: event late at share 1.5",
      "1 nod: grip of rightHand from 0.6 to 0.4",
      "1 nod: contact at 2 s of 1",
      "1 nod: both a contact and a feigned contact",
    ],
  );
  TestValidator.equals(
    "the instants",
    [
      AutoMovieMotionHumanAuditTiming.instant(wave, "ready"),
      AutoMovieMotionHumanAuditTiming.order(wave, ["relax", "ready", "stroke"]),
      AutoMovieMotionHumanAuditTiming.shared(wave, "ready", nod, "ready"),
    ],
    [
      1.5,
      [
        "wave: ready at share 0.25 before relax at 0.75",
        "wave: no event stroke",
      ],
      2,
    ],
  );
  TestValidator.error("an undeclared event", (): void => {
    AutoMovieMotionHumanAuditTiming.instant(nod, "relax");
  });
}
