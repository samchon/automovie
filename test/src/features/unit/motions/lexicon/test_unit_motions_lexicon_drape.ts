import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { humanDrapeLying } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { throwsError } from "../../../internal/throwsError";

/** Standing at the carrier's origin facing +Z. */
const FROM: IAutoMovieMotionHumanPosture = {
  root: { x: 0, y: 0.9, z: 0 },
  yaw: 0,
  pitch: 0,
  roll: 0,
  joints: {},
  limbs: {},
};

/**
 * The `HumanDrape` law's own logic (`humanDrapeLying`): a limp body laid face
 * down across a saddle, its trunk level toward the head's side and its hips a
 * trunk's half depth above the seat, laid over 0.6 s by default and then
 * carried with its seat borne on the carrier.
 *
 * Scenarios:
 *
 * 1. Draped 2 s with the head to the right over a 0.24 m deep chest, it lasts
 *    2.6 s, is `laid` at 0.6 s, lies at yaw -90 and pitch 90 with its root 0.12 m
 *    up and its hips folded 90 degrees, and bears its seat on the horse from the
 *    cue to the end.
 * 2. A drape of no length is refused.
 */
export function test_unit_motions_lexicon_drape(): void {
  const drape: humanDrapeLying.IDrape = humanDrapeLying(
    { duration: 2, on: "horse", head: "right" },
    0.24,
    FROM,
  );
  TestValidator.predicate(
    "laid across the seat",
    nclose(drape.duration, 2.6, 1e-12) &&
      nclose(drape.events[0]!.share, 0.6 / 2.6, 1e-12) &&
      drape.lying.yaw === -90 &&
      drape.lying.pitch === 90 &&
      nclose(drape.lying.root.y, 0.12, 1e-12) &&
      drape.lying.joints.leftUpperLeg![0] === 90 &&
      drape.contacts[0]!.part === "seat" &&
      drape.contacts[0]!.to === 1,
  );
  TestValidator.predicate(
    "no drape",
    throwsError(() => humanDrapeLying({ duration: 0, on: "horse" }, 0.24, FROM)),
  );
}