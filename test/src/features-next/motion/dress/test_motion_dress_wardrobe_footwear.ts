import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanSegment,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import { HumanPerformance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { wardrobeFilm } from "../../../features/internal/wardrobeFilm";
import { wardrobeFootwearScene } from "../../internal/wardrobeFootwearScene";

/**
 * Seated footwear moves one prop identity between hand, foot and set, read as
 * one take: the integration spec of the exchange, whose actions are each their
 * own unit (`test_motion_dress_wardrobe_footwear_pick_up`, `_on`, `_off` and
 * `_put_down`).
 *
 * Scenarios, for a shoe on the average man's right foot and a sock on the small
 * woman's left, each pulled by the opposite hand:
 *
 * 1. The whole chain, pickUp > sit > wardrobe(footwearOn) > rise > stand > sit
 *
 * > Wardrobe(footwearOff) > rise > bend > putDown, passes the shipped verdicts at
 *    > its cuts and through every hand-over.
 * 2. The same footwear follows the foot through the rise, the stand and the second
 *    sit: its frame on the foot just after it is worn and just before the
 *    removal starts agree within 1 mm and 1e-4 rad, the worn custody carried
 *    across three actions.
 *
 * The checks of one action (the custody boundaries, the heel and toe in the
 * opening, the set-down) are its unit's.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the chain, the cross-action checks it keeps and where each action's own checks went.
 * @evidence contracts/development/testing.md#behavioral-verification Runs installed HumanPerformance, registered motion and concrete archetype producers for the complete exchange and reads the shipped verdicts and the footwear in the displayed foot's frame across the actions between the wear and the removal.
 * @evidence contracts/development/testing.md#independent-expectations A worn prop is rigid on its bone within 1 mm, read through the displayed foot, independently of a stored target pose.
 * @evidence contracts/development/testing.md#distinguishing-cases Two casts, opposite feet and the two footwear kinds; each action's goal is its unit's, the jacket and the refusal test_motion_dress_wardrobe_custody's.
 * @evidence contracts/development/testing.md#execution-ownership The focused public-entry feature test owns its performers, models and in-memory scene.
 */
export function test_motion_dress_wardrobe_footwear(): void {
  const failures: string[] = [];
  for (const c of wardrobeFootwearScene.CASES) {
    try {
      footwear(c);
    } catch (error: unknown) {
      failures.push(
        c.label +
          ": " +
          (error instanceof Error ? error.message : String(error)),
      );
    }
  }
  TestValidator.equals("footwear geometry and custody paths", failures, []);
}

/** One case's whole exchange and its cross-action checks. */
function footwear(c: wardrobeFootwearScene.ICase): void {
  const s: wardrobeFootwearScene.IScene = wardrobeFootwearScene.scene(c);
  const performance: HumanPerformance = wardrobeFootwearScene.perform(
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
      .rise({})
      .stand({ hold: 0.35 })
      .sit({ seat: s.seat, hold: 0.8 })
      .registered("wardrobe", {
        kind: "footwearOff",
        prop: "footwear",
        side: c.side,
        hand: s.hand,
      })
      .rise({})
      // The table top lies below the standing arm of the smaller cast (her
      // shoulder stands higher above it than her arm is long): bend to it.
      .bend({
        target: { kind: "point", at: s.touch.position, frame: "world" },
        hand: s.hand,
      })
      .until({ event: "deepest" })
      .putDown({ prop: "footwear", to: s.touch.position, hand: s.hand }),
  );
  assertTakeClean(`${c.kind}, ${c.cast}`, performance);
  const segments: readonly IAutoMovieMotionHumanSegment[] =
    performance.segments("actor");
  const forward: IAutoMovieMotionHumanSegment = wardrobeFilm.withEvent(
    segments,
    "footwearWorn",
  );
  const reverse: IAutoMovieMotionHumanSegment = wardrobeFilm.withEvent(
    segments,
    "footwearClear",
  );
  const on: number = wardrobeFilm.mark(forward, "footwearWorn");
  const foot: AutoMovieHumanoidBone =
    c.side === "left" ? "leftFoot" : "rightFoot";
  const worn: IAutoMovieRigidTransform = wardrobeFilm.relative(
    performance,
    "footwear",
    foot,
    on + 0.003,
  );
  const raised: IAutoMovieRigidTransform = wardrobeFilm.relative(
    performance,
    "footwear",
    foot,
    reverse.start - 0.05,
  );
  TestValidator.predicate(
    "the same footwear follows the foot through stand and seat",
    Vector3.distance(worn.position, raised.position) < 0.001 &&
      Quaternion.angle(worn.rotation, raised.rotation) < 1e-4,
  );
}
