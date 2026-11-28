import { AutoMovieMotionHumanSupport } from "@automovie/motions";
import {
  prepareSupportLiftCourse
} from "../../../../../packages/motions/src/actions/internal/prepareSupportLiftCourse";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

namespace part_prepare_support_lift_course {
  /** Rounding of a quintic's evaluation, metres. */
  const ROUNDING: number = 1e-12;

  /** The bump's height, metres: the 11 mm a held leg once sank by. */
  const BUMP: number = 0.011;

  /** The lift's tolerance, metres: the limb solver's millimetre. */
  const TOLERANCE: number = 1e-3;

  /**
   * `prepareSupportLiftCourse` fits a support interval's root lift exactly at
   * knots AutoKnots places over the share, no finer than one frame of the grid,
   * and reads it between them from the shared knot course.
   *
   * Scenarios, a grid of 64ths:
   *
   * 1. A lift that rises 11 mm at a quarter and falls back by the middle (`0.011
   *    sin^2(2 pi s)`, zero at 0, 0.5 and 1) reads within the millimetre of its
   *    full 11 mm at the quarter: a tessellation judged only at middles read
   *    none there.
   * 2. Every share the lift was fitted at reads its exact lift, both ends among
   *    them.
   * 3. Shares outside the interval read its ends.
   */
  export function verify(): void {
    const fitted: number[] = [];
    const exact: (s: number) => number = (s: number): number => {
      fitted.push(s);
      return BUMP * Math.sin(2 * Math.PI * s) ** 2;
    };
    const course: prepareSupportLiftCourse.ICourse = prepareSupportLiftCourse(
      1 / 64,
      exact,
    );
    const lift: (s: number) => number = (s: number): number =>
      BUMP * Math.sin(2 * Math.PI * s) ** 2;
    TestValidator.predicate(
      "the bump at the quarter",
      Math.abs(course.read(0.25) - BUMP) <= TOLERANCE,
    );
    TestValidator.predicate(
      "exact where fitted",
      fitted.includes(0) &&
        fitted.includes(1) &&
        fitted.every((s: number): boolean =>
          nclose(course.read(s), lift(s), ROUNDING),
        ),
    );
    TestValidator.predicate(
      "held outside",
      nclose(course.read(-1), 0, ROUNDING) &&
        nclose(course.read(2), lift(1), ROUNDING),
    );
  }
}

namespace part_scramble {
  /**
   * `AutoMovieMotionHumanSupport.SCRAMBLE`, the stances of the `scramble` row
   * of `support`, climbs onto a ledge in stages: both feet and both palms, a
   * knee up in place of a foot, the other foot up, hands free, then standing.
   *
   * Scenarios:
   *
   * 1. The row's family is `support`.
   * 2. The right knee remains just inside the same ledge edge during all
   *    three bearing stances. Both palms keep their original inset.
   * 3. The knee and foot bear while the hands release before the final rise.
   * 4. The last second still ends in the standing stance on both feet.
   */
  export function verify(): void {
    TestValidator.predicate(
      "a support row",
      AutoMovieMotionHumanSupport.rows.scramble.family === "support",
    );
    TestValidator.equals(
      "the stances",
      AutoMovieMotionHumanSupport.SCRAMBLE.stances.map((stance) =>
        stance.contacts.map((contact) => contact.part),
      ),
      [
        ["leftFoot", "rightFoot", "leftHand", "rightHand"],
        ["leftFoot", "leftHand", "rightHand", "rightKnee"],
        ["leftHand", "rightHand", "rightKnee", "leftFoot"],
        ["rightKnee", "leftFoot"],
        ["leftFoot", "rightFoot"],
      ],
    );
    const contacts = AutoMovieMotionHumanSupport.SCRAMBLE.stances.flatMap(
      (stance) => stance.contacts,
    );
    TestValidator.equals(
      "the same inboard knee target through hand release",
      contacts
        .filter(({ part }) => part === "rightKnee")
        .map(({ target, inset }) => ({ target, inset })),
      [
        { target: "on", inset: 0.1 },
        { target: "on", inset: 0.1 },
        { target: "on", inset: 0.1 },
      ],
    );
    TestValidator.equals(
      "both palms keep their same top placements",
      contacts
        .filter(({ part }) => part.endsWith("Hand"))
        .map(({ target, inset }) => ({ target, inset })),
      Array.from({ length: 6 }, () => ({ target: "on" as const, inset: 0.5 })),
    );
    const [release, standing] =
      AutoMovieMotionHumanSupport.SCRAMBLE.stances.slice(-2);
    TestValidator.equals("hands release before the rise", release!.free, [
      "leftHand",
      "rightHand",
    ]);
    TestValidator.predicate(
      "the final second ends at the existing standing event",
      release!.event === "handsFree" &&
        standing!.event === "stance3" &&
        release!.seconds! + standing!.seconds! === 1,
    );
    TestValidator.equals(
      "on the ledge",
      AutoMovieMotionHumanSupport.SCRAMBLE.stances
        .at(-1)!
        .contacts.map((contact) => contact.target),
      ["on", "on"],
    );
  }
}
/**
 * `support`'s unit contract: its lifted foot course.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `scramble`: the scramble row climbs onto a ledge in stages and ends on both
 *   feet.
 * - `prepare_support_lift_course`: `prepareSupportLiftCourse` fits a support
 *   interval's root lift exactly at knots AutoKnots places over the share, no
 *   finer than one frame of the grid, and reads it between them from the shared
 *   knot course.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Support courses retain declared stances, reproduce prepared lift knots and finish at the existing standing cue.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the support lift reader over a fixed bump and reads the scramble's repeated knee and palm targets and final standing event.
 * @evidence contracts/development/testing.md#independent-expectations The authored lift at its quarter knot, its zero endpoints and the row's standing cue determine the expected path and timing.
 */
export async function test_motions_actions_support(): Promise<void> {
  part_prepare_support_lift_course.verify();
  part_scramble.verify();
}
