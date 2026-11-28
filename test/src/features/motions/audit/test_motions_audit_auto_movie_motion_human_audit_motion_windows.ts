import type { IAutoMovieMotionHumanAuditMotion } from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditMotion
} from "../../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditMotion";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieMotionHumanAuditMotion.windows` turns each declared contact's
 * shares of its action into film seconds, `start + share * duration`, clipped
 * to the span the action holds the body (`entryTime` to `end`); a window the
 * clip empties is dropped, and a window of the last action that holds to its
 * own end goes on to the film's end.
 *
 * Scenarios, a 5 s film: a wave whose clock starts at 0 but takes the body at
 * 0.5 s and is cut at 2 s (2 s long), then a 1 s nod from 2 s to its own end at
 * 3 s:
 *
 * 1. The wave's foot plant over shares 0 to 0.5 (0 to 1 s) starts at the entry,
 *    0.5 s.
 * 2. Its grip over 0.9 to 1 (1.8 to 2 s) keeps its seconds: the cut wave is not
 *    the last action.
 * 3. Its plant over 0 to 0.1 (0 to 0.2 s) ends before the entry and is dropped.
 * 4. The nod's plant to share 1 holds to the film's end, 5 s; its plant to share
 *    0.5 ends at 2.5 s.
 * 5. A motion with no actions has no windows.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes entry clipping, a retained earlier contact, discarded pre-entry contact, final holds and an empty motion.
 * @evidence contracts/development/testing.md#behavioral-verification Passes authored spans and contact shares to AuditMotion.windows and checks action, body part and film seconds for every returned window.
 * @evidence contracts/development/testing.md#independent-expectations The 2 s wave converts 0.9 to 1.8 s and clips the earlier right-foot plant to start at 0.5 s. The last action starts at 2 s and converts half-share to 2.5 s. Only its full terminal hold extends to the 5 s film end.
 */
export function test_motions_audit_auto_movie_motion_human_audit_motion_windows(): void {
  const spans: IAutoMovieMotionHumanAuditMotion.ISpan[] = [
    {
      name: "wave",
      start: 0,
      entryTime: 0.5,
      end: 2,
      plan: {
        duration: 2,
        contacts: [
          {
            part: "rightFoot",
            kind: "plant",
            from: 0,
            to: 0.5,
            support: { kind: "ground" },
          },
          {
            part: "leftHand",
            kind: "grip",
            from: 0.9,
            to: 1,
            support: { kind: "prop", subject: "cup" },
          },
          {
            part: "leftFoot",
            kind: "plant",
            from: 0,
            to: 0.1,
            support: { kind: "ground" },
          },
        ],
      },
    },
    {
      name: "nod",
      start: 2,
      entryTime: 2,
      end: 3,
      plan: {
        duration: 1,
        contacts: [
          {
            part: "leftFoot",
            kind: "plant",
            from: 0.5,
            to: 1,
            support: { kind: "ground" },
          },
          {
            part: "rightFoot",
            kind: "plant",
            from: 0,
            to: 0.5,
            support: { kind: "ground" },
          },
        ],
      },
    },
  ];
  const motion = (
    of: readonly IAutoMovieMotionHumanAuditMotion.ISpan[],
  ): IAutoMovieMotionHumanAuditMotion => ({
    duration: 5,
    bones: () => new Map(),
    segments: () => of,
  });
  TestValidator.equals(
    "the windows in film seconds",
    AutoMovieMotionHumanAuditMotion.windows(motion(spans), "a").map(
      (w: IAutoMovieMotionHumanAuditMotion.IWindow) => [
        w.action,
        w.contact.part,
        w.from,
        w.to,
      ],
    ),
    [
      ["wave", "rightFoot", 0.5, 1],
      ["wave", "leftHand", 1.8, 2],
      ["nod", "leftFoot", 2.5, 5],
      ["nod", "rightFoot", 2, 2.5],
    ],
  );
  TestValidator.equals(
    "no actions",
    AutoMovieMotionHumanAuditMotion.windows(motion([]), "a"),
    [],
  );
}
