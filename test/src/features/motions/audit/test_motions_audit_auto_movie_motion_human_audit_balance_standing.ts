import type {
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAuditBalance
} from "../../../../../packages/motions/src/audit/internal/AutoMovieMotionHumanAuditBalance";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieMotionHumanAuditBalance.standing` says whether both feet alone bear
 * the body at an instant: each inside a plant window on the ground and no other
 * window open; with `until`, both stay planted to it without a gap and no other
 * support arrives before it; with a `bear` window open (a knee down), every
 * open window bears on the ground through the hold.
 *
 * Scenarios, film seconds:
 *
 * 1. Both feet planted 0 to 2 s: standing at 1 s and held to 2 s, not to 2.5 s.
 * 2. The left foot's plant handed on at 1 s to another without a gap: held to 2 s.
 * 3. A grip open at 1 s: not standing.
 * 4. Only the left foot planted: not standing.
 * 5. A seat window opening at 1.5 s: standing at 1 s, but not held to 2 s.
 * 6. A knee borne on the ground with both feet: standing; on a prop: not.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the current and held planting intervals, gapless handoff, absent foot, grip, later seat and ground versus prop knee support.
 * @evidence contracts/development/testing.md#behavioral-verification Calls AuditBalance.standing with typed contact windows at known seconds, with and without a future hold endpoint.
 * @evidence contracts/development/testing.md#independent-expectations The literal windows put both feet on the ground from 0 to 2 s and exclude 2.5 s. A left-plant handoff at 1 s covers the requested interval, while a seat beginning at 1.5 s invalidates a two-foot hold through 2 s.
 */
export function test_motions_audit_auto_movie_motion_human_audit_balance_standing(): void {
  const window = (
    part: IAutoMovieMotionHumanContactWindow["part"],
    kind: IAutoMovieMotionHumanContactWindow["kind"],
    from: number,
    to: number,
    support: IAutoMovieMotionHumanContactWindow.Support = { kind: "ground" },
  ): IAutoMovieMotionHumanAuditMotion.IWindow => ({
    action: "stand",
    contact: { part, kind, from: 0, to: 1, support },
    from,
    to,
  });
  const feet: IAutoMovieMotionHumanAuditMotion.IWindow[] = [
    window("leftFoot", "plant", 0, 2),
    window("rightFoot", "plant", 0, 2),
  ];
  TestValidator.equals(
    "both feet",
    [
      AutoMovieMotionHumanAuditBalance.standing(feet, 1),
      AutoMovieMotionHumanAuditBalance.standing(feet, 1, 2),
      AutoMovieMotionHumanAuditBalance.standing(feet, 1, 2.5),
    ],
    [true, true, false],
  );
  TestValidator.predicate(
    "handed on",
    AutoMovieMotionHumanAuditBalance.standing(
      [
        window("leftFoot", "plant", 0, 1),
        window("leftFoot", "plant", 1, 3),
        window("rightFoot", "plant", 0, 3),
      ],
      0.5,
      2,
    ),
  );
  TestValidator.equals(
    "other supports",
    [
      AutoMovieMotionHumanAuditBalance.standing(
        [...feet, window("rightHand", "grip", 0, 2)],
        1,
      ),
      AutoMovieMotionHumanAuditBalance.standing([feet[0]!], 1),
      AutoMovieMotionHumanAuditBalance.standing(
        [...feet, window("seat", "seat", 1.5, 2)],
        1,
      ),
      AutoMovieMotionHumanAuditBalance.standing(
        [...feet, window("seat", "seat", 1.5, 2)],
        1,
        2,
      ),
    ],
    [false, false, true, false],
  );
  TestValidator.equals(
    "a knee down",
    [
      AutoMovieMotionHumanAuditBalance.standing(
        [...feet, window("leftLowerLeg", "bear", 0, 2)],
        1,
      ),
      AutoMovieMotionHumanAuditBalance.standing(
        [
          ...feet,
          window("leftLowerLeg", "bear", 0, 2, {
            kind: "prop",
            subject: "mat",
          }),
        ],
        1,
      ),
    ],
    [true, false],
  );
}
