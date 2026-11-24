import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRange,
  HumanFoot,
  crawlFeet,
  type humanFootOffset,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a few rotations, metres and degrees. */
const ROUNDING: number = 1e-9;

/**
 * `crawlFeet.rolled` rolls a standing foot onto its toes without the toes
 * sliding: the heel rises about the toes' joint until the toes reach their
 * extension range, then the foot turns on its toes' tip, its turn to the new
 * heading taken about that tip throughout.
 *
 * Scenarios, the average man's left sole sockets, the foot standing flat at
 * (0.1, 0.08, 0.4) facing +Z, rolled to a heading of 20 degrees with its heel
 * lifted 60:
 *
 * 1. At the start it stands where it stood, its toes flat.
 * 2. At every share the toes' tip stays where it stood.
 * 3. At the end it faces 20 degrees, pitched 60 heel-up, its toes extended to the
 *    lesser of 60 and their range.
 */
export async function test_unit_motions_floor_crawl_feet_rolled(): Promise<void> {
  const body: humanFootOffset.IBody = {
    rest: new Map<AutoMovieHumanoidBone, IAutoMovieVector3>([
      ["leftFoot", { x: 0.09, y: 0.08, z: 0 }],
      ["leftToes", { x: 0.09, y: 0.02, z: 0.13 }],
    ]),
    surfaces: (await humanFixture("m-average")).surfaces,
  };
  const standing: IAutoMovieMotionHumanFoot.IPlacement = {
    ankle: { x: 0.1, y: 0.08, z: 0.4 },
    rotation: HumanFoot.rotation(0, 0),
  };
  const roll: ReturnType<typeof crawlFeet.prepareRoll> = crawlFeet.prepareRoll(
    body,
    "left",
    standing,
    20,
    60,
  );
  const tip: IAutoMovieVector3 = HumanFoot.point(
    body,
    "left",
    "toe",
    standing,
    0,
  );
  const start: ReturnType<typeof roll> = roll(0);
  TestValidator.predicate(
    "the start",
    vclose(start.placement.ankle, standing.ankle, ROUNDING) && start.toes === 0,
  );
  TestValidator.predicate(
    "the tip stays",
    [0.1, 0.3, 0.6, 1].every((share: number): boolean => {
      const at: ReturnType<typeof roll> = roll(share);
      return vclose(
        HumanFoot.point(body, "left", "toe", at.placement, at.toes),
        tip,
        ROUNDING,
      );
    }),
  );
  const end: ReturnType<typeof crawlFeet.rolled> = crawlFeet.rolled(
    body,
    "left",
    standing,
    20,
    60,
    1,
  );
  const facing: ReturnType<typeof HumanFoot.headingPitch> =
    HumanFoot.headingPitch(end.placement.rotation);
  TestValidator.predicate(
    "the end",
    nclose(facing.heading, 20, ROUNDING) &&
      nclose(facing.pitch, -60, ROUNDING) &&
      nclose(
        end.toes,
        Math.min(
          60,
          AutoMovieMotionHumanRange.limit("leftToes", "flexion") ?? 60,
        ),
        ROUNDING,
      ),
  );
}
