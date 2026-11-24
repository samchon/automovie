import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanPerformance } from "@automovie/motions";

import { motionComplaints } from "../../../features/internal/motionComplaints";
import { wardrobeFilm } from "../../../features/internal/wardrobeFilm";
import { motionActionUnit } from "../../internal/motionActionUnit";
import { wardrobeFootwearScene } from "../../internal/wardrobeFootwearScene";

/**
 * Footwear pulled onto the raised foot of a seated performer, on its own: the
 * `footwearOn` step of `test_motion_dress_wardrobe_footwear`, a shoe on the
 * average man's right foot and a sock on the small woman's left, entered by the
 * minimal chain pickUp > sit (the grammar has no entry state; the rise, the
 * second sit, the removal and the put-down after it are left out).
 *
 * Scenarios:
 *
 * 1. The footwear keeps its pose across the custody change at `footwearWorn`, hand
 *    to foot, within 2 mm and 0.005 rad.
 * 2. The heel and toe lie before the opening at `footwearReady` (more than 10 mm
 *    out along its axis), at the opening's mouth at `footwearOpening` (within
 *    15 mm along the axis, inside its width and height), and inside it at
 *    `footwearWorn` (more than 15 mm in).
 * 3. The footwearOn keeps the shipped bounds over its own span.
 *
 * Decomposes the original's checks "footwear keeps its pose across custody"
 * (the worn boundary) and the entering, mouth and fitted parts of "the real
 * heel and toe pass into the opening and back out"; the removal's parts are
 * `test_motion_dress_wardrobe_footwear_off`'s, and the footwear riding the foot
 * through the stand stays the integration copy's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the original, its step and split checks, the entry chain, the cases and every bound.
 * @evidence contracts/development/testing.md#behavioral-verification Performs pickUp > sit > wardrobe and reads the displayed footwear across the custody change and the displayed heel and toe in its opening's frame at the law's events, with the verdict report over the footwearOn's span; a jump at the hand-over, a foot that misses the mouth or ends outside the footwear, or a finding in the action fails.
 * @evidence contracts/development/testing.md#independent-expectations The custody and opening bounds are the original's, read on the displayed foot geometry converted through the posed model, not a stored target pose.
 * @evidence contracts/development/testing.md#distinguishing-cases Two casts, opposite feet and the two footwear kinds; the removal is the off unit's.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances through the public chain, entered through `test_motion_dress_wardrobe_footwear_on`.
 */
export function test_motion_dress_wardrobe_footwear_on(): void {
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
          }),
      );
      const act: IAutoMovieMotionHumanSegment = motionActionUnit.segment(
        film,
        "actor",
        "wardrobe",
      );
      const on: number = wardrobeFilm.mark(act, "footwearWorn");
      wardrobeFootwearScene.custody(checks, c.label, film, on);
      const opening: IAutoMovieAffordance = s.model.affordance("opening");
      const entering: IAutoMovieVector3[] = wardrobeFootwearScene.inOpening(
        s,
        film,
        c.side,
        wardrobeFilm.mark(act, "footwearReady"),
      );
      const mouth: IAutoMovieVector3[] = wardrobeFootwearScene.inOpening(
        s,
        film,
        c.side,
        wardrobeFilm.mark(act, "footwearOpening"),
      );
      const fitted: IAutoMovieVector3[] = wardrobeFootwearScene.inOpening(
        s,
        film,
        c.side,
        on,
      );
      checks.check(
        `${c.label}: the heel and toe pass into the opening ${JSON.stringify({ entering, mouth, fitted })}`,
        entering.every((p: IAutoMovieVector3): boolean => p.z > 0.01) &&
          fitted.every((p: IAutoMovieVector3): boolean => p.z < -0.015) &&
          mouth.every(
            (p: IAutoMovieVector3): boolean =>
              Math.abs(p.z) < 0.015 &&
              Math.abs(p.x) < opening.width! / 2 &&
              p.y > 0 &&
              p.y < opening.height!,
          ),
      );
      motionActionUnit.bounds(checks, c.label, film, "actor", act);
    } catch (error: unknown) {
      checks.check(
        `${c.label}: ${error instanceof Error ? error.message : String(error)}`,
        false,
      );
    }
  checks.assert("footwear goes onto the seated foot");
}
