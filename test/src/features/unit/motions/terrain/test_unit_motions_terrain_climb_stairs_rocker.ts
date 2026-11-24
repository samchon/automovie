import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanFoot, climbStairsRocker } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../../internal/vclose";

/** Rounding of one pivot about the ball, metres. */
const ROUNDING: number = 1e-9;

/**
 * `climbStairsRocker` rocks a stair foot on its ball: where the hip has
 * passed far enough over a tread that the ankle can bend no further, the heel
 * rises about the ball's fixed point, the toes extending by the change of
 * pitch, and otherwise the foot stays flat on its print.
 *
 * It reads the rest joints, the measure and the sole sockets through
 * HumanFoot, whose sole points take the whole body record, so the test
 * builds the stored body (humanFixtureBody).
 *
 * Scenarios, on the average man's left foot on a print at (0.1, 0.18, 0.3):
 *
 * 1. With the hip over the ankle the foot stays on its print, its toes
 *    unflexed.
 * 2. With the hip far ahead the heel rises: the ball keeps its place, and the
 *    toes extend by exactly the pitch the foot gave up.
 * 3. A placement no print holds is rocked the same way.
 */
export async function test_unit_motions_terrain_climb_stairs_rocker(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const print: IAutoMovieMotionHumanFoot.IPlacement = {
    ankle: { x: 0.1, y: 0.18, z: 0.3 },
    rotation: HumanFoot.rotation(0, 0),
  };
  const rock: ReturnType<typeof climbStairsRocker> = climbStairsRocker(body, {
    left: [{ print: { placement: print } }],
    right: [],
  });
  const ball: IAutoMovieVector3 = HumanFoot.point(body, "left", "mtp", print);
  const length: number = body.measure.thigh + body.measure.shank;

  // 1. Hip over the ankle.
  const over: ReturnType<typeof rock> = rock(
    "left",
    print,
    { ...print.ankle, y: print.ankle.y + 0.95 * length },
    20,
  );
  TestValidator.predicate(
    "flat under the hip",
    over.flexion === 0 && vclose(over.placement.ankle, print.ankle, ROUNDING),
  );

  // 2. Hip far ahead.
  const ahead: ReturnType<typeof rock> = rock(
    "left",
    print,
    { x: print.ankle.x, y: print.ankle.y + 0.7 * length, z: print.ankle.z + 0.6 * length },
    0,
  );
  const pitch: number = HumanFoot.headingPitch(ahead.placement.rotation).pitch;
  TestValidator.predicate(
    `the heel rises about the ball (${pitch} degrees)`,
    pitch < 0 &&
      vclose(HumanFoot.point(body, "left", "mtp", ahead.placement), ball, ROUNDING),
  );
  TestValidator.predicate(
    "the toes extend by the pitch given up",
    Math.abs(ahead.flexion + pitch) <= ROUNDING,
  );

  // 3. A placement outside the prints.
  const loose: IAutoMovieMotionHumanFoot.IPlacement = {
    ankle: { x: -0.1, y: 0.36, z: 0.6 },
    rotation: HumanFoot.rotation(0, 0),
  };
  const swung: ReturnType<typeof rock> = rock(
    "right",
    loose,
    { x: loose.ankle.x, y: loose.ankle.y + 0.7 * length, z: loose.ankle.z + 0.6 * length },
    0,
  );
  TestValidator.predicate(
    "a loose placement keeps its ball",
    vclose(
      HumanFoot.point(body, "right", "mtp", swung.placement),
      HumanFoot.point(body, "right", "mtp", loose),
      ROUNDING,
    ),
  );
}
