import type { IAutoMovieMotionHumanPosture } from "@automovie/interface";
import { HumanTrunk } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** Rounding of a few products, degrees. */
const ROUNDING: number = 1e-12;

/**
 * `HumanTrunk.incline` shares a forward trunk inclination by the lumbopelvic
 * rhythm (Esola et al. 1996): the pelvis takes 0.64 of it, up to its limit, and
 * the spine and chest the rest, split 0.28 to 0.08; a backward inclination is
 * the pelvis alone. `pelvisPitch` is the pelvis's share.
 *
 * Scenarios:
 *
 * 1. 50 degrees forward: the pelvis 32, the spine 18 shared 14 and 4.
 * 2. With the pelvis limited to 20, it takes 20 and the spine 30, shared 23.33 and
 *    6.67.
 * 3. 10 degrees back is the pelvis's -10, the joints as they were.
 */
export function test_unit_motions_everyday_human_trunk_incline(): void {
  const joints: IAutoMovieMotionHumanPosture["joints"] = {};
  const free: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
    joints,
    50,
  );
  TestValidator.predicate(
    "the rhythm",
    nclose(free.pitch, 32, ROUNDING) &&
      nclose(HumanTrunk.pelvisPitch(50), 32, ROUNDING) &&
      nclose(free.joints.spine![0], 14, ROUNDING) &&
      nclose(free.joints.chest![0], 4, ROUNDING),
  );
  const limited: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
    joints,
    50,
    20,
  );
  TestValidator.predicate(
    "a limited pelvis",
    nclose(limited.pitch, 20, ROUNDING) &&
      nclose(limited.joints.spine![0], (30 * 0.28) / 0.36, ROUNDING) &&
      nclose(limited.joints.chest![0], (30 * 0.08) / 0.36, ROUNDING),
  );
  const back: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
    joints,
    -10,
  );
  TestValidator.predicate(
    "leaning back",
    back.pitch === -10 && back.joints === joints,
  );
}
