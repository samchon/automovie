import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanBase,
  HumanSegmentEntry,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/**
 * The base used by an upper-body act keeps the support at its entry cut.
 *
 * Scenarios:
 * 1. Enter before the preceding seat bears and keep only the grounded foot.
 * 2. Enter on the seat's first bearing instant and keep it in the same frame
 *    throughout the next act, including an out-of-order posture read.
 */
export function test_motions_compose_seat_entry_base(): void {
  const posture: IAutoMovieMotionHumanPosture = {
    root: { x: 0, y: 0.45, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  };
  const previous: HumanSegmentEntry.ISupportsPrevious = {
    start: 2,
    plan: {
      duration: 4,
      contacts: [
        {
          part: "leftFoot",
          kind: "plant",
          support: { kind: "ground" },
          from: 0,
          to: 1,
        },
        {
          part: "seat",
          kind: "seat",
          support: { kind: "prop", subject: "stool", point: "disc" },
          from: 0.75,
          to: 1,
        },
      ],
    },
  };
  const enter = (seconds: number): IAutoMovieMotionHumanActionPlan =>
    AutoMovieMotionHumanBase.under(
      {
        entry: {
          posture,
          supports: HumanSegmentEntry.supports(previous, seconds),
        },
      },
      2,
    );
  const before: IAutoMovieMotionHumanActionPlan = enter(4.5);
  const bearing: IAutoMovieMotionHumanActionPlan = enter(5);
  TestValidator.predicate(
    "only the foot bears before the seat's contact",
    before.contacts.length === 1 && before.contacts[0]?.part === "leftFoot",
  );
  const contact: IAutoMovieMotionHumanActionPlan["contacts"][number] | undefined =
    bearing.contacts.find((window): boolean => window.part === "seat");
  TestValidator.predicate(
    "the seat bears in its own material frame for the entire held base",
    contact?.kind === "seat" &&
      contact.support.kind === "prop" &&
      contact.support.subject === "stool" &&
      contact.support.point === "disc" &&
      nclose(contact.from, 0, 1e-9) &&
      nclose(contact.to, 1, 1e-9) &&
      [2, 0, 1, 2].every(
        (seconds): boolean => bearing.posture(seconds) === posture,
      ),
  );
}
