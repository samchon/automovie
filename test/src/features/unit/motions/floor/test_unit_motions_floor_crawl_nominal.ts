import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanCrawl,
  IAutoMovieVector3,
} from "@automovie/interface";
import { crawlNominal } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `crawlNominal` puts each palm where `under` places it and each knee under its
 * hip joint, the hip's local place lowered to the knee's height.
 *
 * Scenarios:
 *
 * 1. The palms are `under`'s for their sides.
 * 2. Each knee keeps its hip's x and z and takes the knee's height.
 *
 * Every value is copied, not computed, so each agrees exactly.
 */
export function test_unit_motions_floor_crawl_nominal(): void {
  const hips: Partial<Record<AutoMovieHumanoidBone, IAutoMovieVector3>> = {
    leftUpperLeg: { x: 0.09, y: 0.9, z: -0.02 },
    rightUpperLeg: { x: -0.09, y: 0.9, z: -0.02 },
  };
  const nominal: Record<IAutoMovieMotionHumanCrawl.Limb, IAutoMovieVector3> =
    crawlNominal({
      under: (side: AutoMovieHumanSide): IAutoMovieVector3 => ({
        x: side === "left" ? 0.2 : -0.2,
        y: 0,
        z: 0.6,
      }),
      local: (bone: AutoMovieHumanoidBone): IAutoMovieVector3 => hips[bone]!,
      knee: 0.04,
    });
  const expected: Record<IAutoMovieMotionHumanCrawl.Limb, IAutoMovieVector3> = {
    leftHand: { x: 0.2, y: 0, z: 0.6 },
    rightHand: { x: -0.2, y: 0, z: 0.6 },
    leftKnee: { x: 0.09, y: 0.04, z: -0.02 },
    rightKnee: { x: -0.09, y: 0.04, z: -0.02 },
  };
  for (const limb of Object.keys(expected) as IAutoMovieMotionHumanCrawl.Limb[])
    TestValidator.predicate(
      `the ${limb}`,
      vclose(nominal[limb], expected[limb], 0),
    );
}
