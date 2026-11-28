import type { IAutoMovieMotionHumanAuditMotion } from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditStatics
} from "../../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditStatics";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieMotionHumanAuditStatics.bearing` lists the windows open at an
 * instant that bear the body: a kind that bears it (plant, pivot, seat, lie,
 * bear) or any kind declaring a load, both ends included.
 *
 * Scenarios, at 1 s:
 *
 * 1. A plant over 0 to 2 s and a seat ending at 1 s bear; a grip without a load
 *    does not; a grip that declares a load does.
 * 2. A plant from 1.5 s is not yet open.
 * 3. With no windows nothing bears.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names an ongoing plant, a seat at its closed end, loaded and unloaded grips and a future plant.
 * @evidence contracts/development/testing.md#behavioral-verification Calls AuditStatics.bearing at second 1 on prepared windows and an empty list, then compares their retained action names.
 * @evidence contracts/development/testing.md#independent-expectations The stand and seat contain second 1, including the seat's endpoint. Only the loaded grip joins them, and the plant from 1.5 s has not begun, producing the listed stand, sit and hang sequence.
 */
export function test_motions_audit_auto_movie_motion_human_audit_statics_bearing(): void {
  const windows: IAutoMovieMotionHumanAuditMotion.IWindow[] = [
    {
      action: "stand",
      contact: {
        part: "leftFoot",
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
      from: 0,
      to: 2,
    },
    {
      action: "sit",
      contact: {
        part: "seat",
        kind: "seat",
        from: 0,
        to: 1,
        support: { kind: "prop", subject: "chair" },
      },
      from: 0.5,
      to: 1,
    },
    {
      action: "hold",
      contact: {
        part: "rightHand",
        kind: "grip",
        from: 0,
        to: 1,
        support: { kind: "prop", subject: "rail" },
      },
      from: 0,
      to: 2,
    },
    {
      action: "hang",
      contact: {
        part: "leftHand",
        kind: "grip",
        from: 0,
        to: 1,
        load: 0.3,
        support: { kind: "prop", subject: "bar" },
      },
      from: 0,
      to: 2,
    },
    {
      action: "step",
      contact: {
        part: "rightFoot",
        kind: "plant",
        from: 0,
        to: 1,
        support: { kind: "ground" },
      },
      from: 1.5,
      to: 2,
    },
  ];
  TestValidator.equals(
    "the bearing windows at 1 s",
    AutoMovieMotionHumanAuditStatics.bearing(windows, 1).map(
      (w: IAutoMovieMotionHumanAuditMotion.IWindow): string => w.action,
    ),
    ["stand", "sit", "hang"],
  );
  TestValidator.equals(
    "none",
    AutoMovieMotionHumanAuditStatics.bearing([], 1),
    [],
  );
}
