import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { crawlUnder } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** Rounding of one subtraction per component, metres. */
const ROUNDING: number = 1e-12;

/**
 * `crawlUnder` lays a palm on the floor under its shoulder: the shoulder's
 * floor point less the wrist's offset from the palm, so the wrist stands over
 * the place the palm takes, at floor height.
 *
 * Scenarios:
 *
 * 1. A left shoulder at (0.18, 1.4, 0.05) over a wrist offset (0.01, 0.03,
 *    -0.04) lays its palm at (0.17, 0, 0.09).
 * 2. The right side reads its own shoulder and wrist.
 */
export function test_unit_motions_floor_crawl_under(): void {
  const shoulders: Partial<Record<AutoMovieHumanoidBone, IAutoMovieVector3>> = {
    leftUpperArm: { x: 0.18, y: 1.4, z: 0.05 },
    rightUpperArm: { x: -0.18, y: 1.4, z: 0.05 },
  };
  const under: (side: AutoMovieHumanSide) => IAutoMovieVector3 = crawlUnder({
    local: (bone: AutoMovieHumanoidBone): IAutoMovieVector3 => shoulders[bone]!,
    wrists: {
      left: { x: 0.01, y: 0.03, z: -0.04 },
      right: { x: -0.01, y: 0.03, z: -0.04 },
    },
  });
  TestValidator.predicate(
    "the left palm",
    vclose(under("left"), { x: 0.17, y: 0, z: 0.09 }, ROUNDING),
  );
  TestValidator.predicate(
    "the right palm",
    vclose(under("right"), { x: -0.17, y: 0, z: 0.09 }, ROUNDING),
  );
}
