import type { IAutoMovieMotionHumanAuditMotion as Motion } from "@automovie/interface";
import { AutoMovieMotionHumanAuditMotion } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionAuditPoints } from "../../../../features/internal/motionAuditPoints";
import { nclose } from "../../../../features/internal/nclose";

/**
 * Contact-window observation clips a held support to the entered action and excludes an expired contact.
 *
 * Scenarios:
 * 1. Read the public measure on the declared input and its control.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Contact-window observation clips a held support to the entered action and excludes an expired contact.
 * @evidence contracts/development/testing.md#independent-expectations A four-second action entered one second late preserves the last two seconds of its three-second left plant.
 * @evidence contracts/development/testing.md#distinguishing-cases The temporal boundary distinguishes admitted and excluded observations.
 * @evidence contracts/development/testing.md#execution-ownership Reads the public operation directly in memory.
 * @evidence contracts/development/common.md#meaningful-documentation States the quantities observed and their relation.
 */
export function test_motion_dynamics_audit_temporal(): void {
  const span: Motion.ISpan = {
    name: "hold",
    start: 2,
    entryTime: 3,
    end: 6,
    plan: {
      duration: 4,
      contacts: [
        {
          part: "leftFoot",
          kind: "plant",
          from: 0,
          to: 0.75,
          support: { kind: "ground" },
        },
        {
          part: "rightFoot",
          kind: "plant",
          from: 0,
          to: 0.125,
          support: { kind: "ground" },
        },
      ],
    },
  };
  const windows = AutoMovieMotionHumanAuditMotion.windows(
    motionAuditPoints(6, () => ({}), [span]),
    "a",
  );
  TestValidator.equals("expired contact excluded", windows.length, 1);
  TestValidator.predicate(
    "entry clips active support",
    nclose(windows[0]!.from, 3) &&
      nclose(windows[0]!.to, 5) &&
      windows[0]!.contact.part === "leftFoot",
  );
}
