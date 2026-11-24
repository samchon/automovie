import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
} from "@automovie/interface";
import { floorEntry } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of one hip lerp and one turn of the rest hips, metres. */
const ROUNDING: number = 1e-12;

/**
 * `floorEntry.between` blends two fixed postures: the joints by the weight, the
 * hips joint on the straight line between its two places with the root
 * following, and the body raised wherever the blend would sink a limb deeper
 * than its two ends, that rise solved at the blend's knots in preparation.
 *
 * Both postures here face +Z with the same legs; the root moves a metre along
 * +X and the left elbow bends from 0 to 40 degrees.
 *
 * The law reads most of the body record: its rig, pose resolution, chains,
 * projection, rest joints, measure, surfaces and profile, so the test builds
 * the stored body (humanFixtureBody).
 *
 * Scenarios:
 *
 * 1. Weight 0 and less is the first posture, 1 and more the second.
 * 2. Half way the root is half way, its hips on the line between theirs.
 * 3. The elbow is half bent.
 * 4. Legs that do not change sink no deeper, so the body is not raised.
 */
export async function test_unit_motions_floor_floor_entry_between(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const posture = (x: number, elbow: number): IAutoMovieMotionHumanPosture => ({
    root: { x, y: 0, z: 0 },
    yaw: 0,
    pitch: 0,
    roll: 0,
    joints: { leftLowerArm: [elbow, 0, 0] },
    limbs: {},
  });
  const from: IAutoMovieMotionHumanPosture = posture(0, 0);
  const to: IAutoMovieMotionHumanPosture = posture(1, 40);
  const blend: (weight: number) => IAutoMovieMotionHumanPosture =
    floorEntry.between(body, from, to);

  // 1. The ends.
  TestValidator.predicate(
    "the ends",
    blend(0) === from &&
      blend(-1) === from &&
      blend(1) === to &&
      blend(2) === to,
  );

  // 2 to 4. Half way.
  const half: IAutoMovieMotionHumanPosture = blend(0.5);
  TestValidator.predicate(
    "the root half way, not raised",
    vclose(half.root, { x: 0.5, y: 0, z: 0 }, ROUNDING),
  );
  TestValidator.predicate(
    "the elbow half bent",
    nclose(half.joints.leftLowerArm![0], 20, ROUNDING),
  );
}
