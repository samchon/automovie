import type {
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";
import {
  splitSolvedHumanAuditSpan
} from "../../../../../packages/motions/src/audit/internal/splitSolvedHumanAuditSpan";
import { TestValidator } from "@nestia/e2e";

/**
 * `splitSolvedHumanAuditSpan` reads one action around the span a solved window
 * owns: before and after as declared, inside with the owned parts' windows
 * removed and the solver's overlapping contacts added as bearing windows at
 * shares of the action, `(seconds - start) / duration` clamped to [0, 1]; a
 * root the solver owns takes no balance judgement inside.
 *
 * Scenarios, a 4 s action from 0 s planting both feet, the solver owning the
 * left leg from 1 to 3 s and touching the floor with the left foot from 2 to 5
 * s:
 *
 * 1. Three pieces: 0 to 1 s and 3 to 4 s as declared; inside, 1 to 3 s, the left
 *    plant removed, the right kept and the left foot bearing on the floor over
 *    shares 0.5 to 0.75 (2 to 3 s, the contact clipped to the span).
 * 2. With the root owned, the inside piece is not physical.
 * 3. An action from 5 to 6 s, outside the span, is read as it is.
 */
export function test_motions_audit_split_solved_human_audit_span(): void {
  const plant = (
    part: "leftFoot" | "rightFoot",
  ): IAutoMovieMotionHumanContactWindow => ({
    part,
    kind: "plant",
    from: 0,
    to: 1,
    support: { kind: "ground" },
  });
  const span: IAutoMovieMotionHumanAuditMotion.ISpan = {
    name: "stand",
    start: 0,
    entryTime: 0,
    end: 4,
    plan: { duration: 4, contacts: [plant("leftFoot"), plant("rightFoot")] },
  };
  const solved: splitSolvedHumanAuditSpan.IContact[] = [
    { part: "leftFoot", support: { kind: "ground" }, from: 2, to: 5 },
  ];
  const owns = (window: IAutoMovieMotionHumanContactWindow): boolean =>
    window.part === "leftFoot";
  const pieces: IAutoMovieMotionHumanAuditMotion.ISpan[] =
    splitSolvedHumanAuditSpan(
      span,
      { from: 1, to: 3, root: false },
      solved,
      owns,
    );
  TestValidator.equals(
    "three pieces",
    pieces.map((piece: IAutoMovieMotionHumanAuditMotion.ISpan) => [
      piece.entryTime,
      piece.end,
      piece.physical,
      piece.plan.contacts,
    ]),
    [
      [0, 1, undefined, span.plan.contacts],
      [
        1,
        3,
        undefined,
        [
          plant("rightFoot"),
          {
            part: "leftFoot",
            kind: "bear",
            from: 0.5,
            to: 0.75,
            support: { kind: "ground" },
          },
        ],
      ],
      [3, 4, undefined, span.plan.contacts],
    ],
  );
  TestValidator.equals(
    "the root owned",
    splitSolvedHumanAuditSpan(
      span,
      { from: 1, to: 3, root: true },
      solved,
      owns,
    )[1]!.physical,
    false,
  );
  const later: IAutoMovieMotionHumanAuditMotion.ISpan = {
    ...span,
    start: 5,
    entryTime: 5,
    end: 6,
  };
  TestValidator.equals(
    "outside",
    splitSolvedHumanAuditSpan(
      later,
      { from: 1, to: 3, root: true },
      solved,
      owns,
    ),
    [later],
  );
}
