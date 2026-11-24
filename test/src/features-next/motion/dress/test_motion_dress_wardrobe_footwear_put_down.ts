import type { IAutoMovieMotionHumanSegment } from "@automovie/interface";
import { HumanPerformance } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { wardrobeFilm } from "../../../features/internal/wardrobeFilm";
import { motionActionUnit } from "../../internal/motionActionUnit";
import { wardrobeFootwearScene } from "../../internal/wardrobeFootwearScene";

/**
 * Footwear set back down on its table top, on its own: the closing bend and
 * putDown of `test_motion_dress_wardrobe_footwear`, on the average man and the
 * small woman, entered by the minimal chain pickUp > bend to the table top (the
 * grammar has no entry state; the exchange on the foot before it is left out).
 *
 * Scenarios:
 *
 * 1. Once released the footwear stays where it was released (1 mm, 1e-4 rad) and
 *    within 75 mm of its table-top place, the original's
 *    `wardrobeFilm.setDown`.
 * 2. The putDown keeps the shipped bounds over its own span.
 *
 * Decomposes the original's final `setDown` check, read here after a put-down
 * entered by its own minimal chain.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original, its step and check, the entry chain, the cases and the bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Performs pickUp > bend > putDown and reads the displayed footwear after the release and at the film's end, with the verdict report over the putDown's span; a footwear that moves after it is left, lands off its place or a finding in the put-down fails.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are the original's (`wardrobeFilm.setDown`); the place is the scene's staged table top.
 * @evidence contracts/development/testing.md#distinguishing-cases Two casts with opposite hands; the exchange on the foot is the on and off units'.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_dress_wardrobe_footwear_put_down`.
 */
export function test_motion_dress_wardrobe_footwear_put_down(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const c of wardrobeFootwearScene.CASES)
    try {
      const s: wardrobeFootwearScene.IScene = wardrobeFootwearScene.scene(c);
      const film: HumanPerformance = wardrobeFootwearScene.perform(
        s,
        wardrobeFootwearScene
          .pickUp(s)
          // The table top lies below the standing arm of the smaller cast:
          // bend to it, as the original.
          .bend({
            target: { kind: "point", at: s.touch.position, frame: "world" },
            hand: s.hand,
          })
          .until({ event: "deepest" })
          .putDown({ prop: "footwear", to: s.touch.position, hand: s.hand }),
      );
      try {
        wardrobeFilm.setDown(film, "footwear", s.touch.position);
      } catch (error: unknown) {
        checks.check(
          `${c.label}: ${error instanceof Error ? error.message : String(error)}`,
          false,
        );
      }
      const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
        film,
        "actor",
        "putDown",
      );
      motionActionUnit.bounds(checks, c.label, film, "actor", act);
    } catch (error: unknown) {
      checks.check(
        `${c.label}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  checks.assert("footwear is set back down on its table top");
}
