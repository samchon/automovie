import type {
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanPerformance } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { wardrobeFilm } from "../../../features/internal/wardrobeFilm";
import { motionActionUnit } from "../../internal/motionActionUnit";
import { wardrobeFootwearScene } from "../../internal/wardrobeFootwearScene";

/**
 * Footwear drawn off the raised foot of a seated performer, on its own: the
 * `footwearOff` step of `test_motion_dress_wardrobe_footwear`, the shoe off the
 * average man's right foot and the sock off the small woman's left, entered by
 * the minimal chain pickUp > sit > wardrobe(footwearOn), without the rise, the
 * stand and the second sit between them in the original (the grammar has no
 * entry state).
 *
 * Scenarios:
 *
 * 1. The footwear keeps its pose across the custody change at the removal's
 *    `footwearReady`, foot to hand, within 2 mm and 0.005 rad.
 * 2. The heel and toe lie out of the opening again at `footwearClear` (more than
 *    10 mm out along its axis).
 * 3. The footwearOff keeps the shipped bounds over its own span.
 *
 * Decomposes the original's check "footwear keeps its pose across custody" (the
 * hand-over boundary) and the leaving part of "the real heel and toe pass into
 * the opening and back out"; the putting on is
 * `test_motion_dress_wardrobe_footwear_on`'s.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original, its step and split checks, the entry chain, the cases and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs pickUp > sit > wardrobe > wardrobe and reads the displayed footwear across the custody change and the displayed heel and toe in its opening's frame at the law's events, with the verdict report over the footwearOff's span; a jump at the hand-over, a foot left inside the footwear, or a finding in the action fails.
 * @evidence contracts/development/testing.md#independent-expectations The custody and opening bounds are the original's, read on the displayed foot geometry converted through the posed model.
 * @evidence contracts/development/testing.md#distinguishing-cases Two casts, opposite feet and the two footwear kinds; the putting on is the on unit's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_dress_wardrobe_footwear_off`.
 */
export function test_motion_dress_wardrobe_footwear_off(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const c of wardrobeFootwearScene.CASES)
    try {
      const s: wardrobeFootwearScene.IScene = wardrobeFootwearScene.scene(c);
      const film: HumanPerformance = wardrobeFootwearScene.perform(
        s,
        wardrobeFootwearScene
          .pickUp(s)
          .sit({ seat: s.seat, hold: 0.8 })
          .registered("wardrobe", {
            kind: "footwearOn",
            prop: "footwear",
            side: c.side,
            hand: s.hand,
          })
          .registered("wardrobe", {
            kind: "footwearOff",
            prop: "footwear",
            side: c.side,
            hand: s.hand,
          }),
      );
      const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
        film,
        "actor",
        "wardrobe",
        2,
      );
      wardrobeFootwearScene.custody(
        checks,
        c.label,
        film,
        wardrobeFilm.mark(act, "footwearReady"),
      );
      const leaving: IAutoMovieVector3[] = wardrobeFootwearScene.inOpening(
        s,
        film,
        c.side,
        wardrobeFilm.mark(act, "footwearClear"),
      );
      checks.check(
        `${c.label}: the heel and toe pass back out of the opening ${JSON.stringify(leaving)}`,
        leaving.every((p: IAutoMovieVector3): boolean => p.z > 0.01),
      );
      motionActionUnit.bounds(checks, c.label, film, "actor", act);
    } catch (error: unknown) {
      checks.check(
        `${c.label}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  checks.assert("footwear comes off the seated foot");
}
