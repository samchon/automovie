import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { crawlDownTiming } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/** Rounding of a sum of forward-kinematics distances, seconds. */
const ROUNDING: number = 1e-9;

/**
 * `crawlDownTiming` times the keys of a way down to the floor by how far the
 * limbs travel between them: the first key at 0, the second at `sit`, and each
 * later one at `sit` times its summed limb travel over the first stretch's.
 *
 * The body is built whole (`humanFixtureBody`): the keys are posed by forward
 * kinematics over the rig.
 *
 * Scenarios, the average man upright, the keys his posture moved along +X by 0,
 * 0.1 and 0.3 m, so every limb bone travels 0.1 and then 0.2 m:
 *
 * 1. With `sit` 0.8 s the keys fall at 0, 0.8 and 0.8 x 3 = 2.4 s.
 */
export async function test_unit_motions_floor_crawl_down_timing(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const at: (x: number) => IAutoMovieMotionHumanPosture = (
    x: number,
  ): IAutoMovieMotionHumanPosture => ({
    root: { x, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  });
  const times: number[] = crawlDownTiming(body, [at(0), at(0.1), at(0.3)], 0.8);
  TestValidator.predicate(
    "the times",
    times.length === 3 &&
      nclose(times[0]!, 0, ROUNDING) &&
      nclose(times[1]!, 0.8, ROUNDING) &&
      nclose(times[2]!, 2.4, ROUNDING),
  );
}
