import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import { HumanArmTrajectoryModel } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { armTrajectoryReading as fixture } from "../../../internal/armTrajectoryReading";
import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";

/**
 * The bind rotations are identities and all geometry is collinear. Budget 64
 * binary64 rounding units at the one-metre scale for the FK, the two distance
 * readings, and their sums, converted to millimetres.
 */
const MERIT_ROUNDING_MM: number = 64 * 1000 * Number.EPSILON;

/**
 * At 0.25 s, a straight held arm has a contact-site miss, a harder task point
 * miss, and two directed clearance violations. Clearance is sampled only at
 * requested waypoints. A task point is checked at its own time regardless of
 * that mask. A forward clearance certificate still leaves a reverse collision
 * to check, and an approach state omits the hold's task.
 */
export async function test_unit_motions_posture_arm_model_evaluation(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const setup: IAutoMovieMotionHumanArmGeometry.ISetup = fixture.setup(
    body,
    "left",
  );
  const empty: IAutoMovieMotionHumanArmGeometry.IFrame = fixture.frame(
    setup,
    0,
    [],
  );
  const hold: IAutoMovieMotionHumanArmGeometry.IFrame = fixture.frame(
    setup,
    0,
    [1 / 128],
    1 / 16,
  );
  const obstacle: number = body.tangle.parts.length;
  hold.shapes = [
    {
      bone: "fixture:external",
      part: obstacle,
      pose: {
        position: fixture.point(-5 / 64),
        rotation: Quaternion.identity(),
      },
      shape: fixture.sphere(1 / 8),
      centre: fixture.point(-5 / 64),
      radius: 1 / 8,
    },
  ];
  hold.body = [
    {
      point: fixture.point(3 / 64),
      part: obstacle,
      corner: 0,
      bone: "fixture:external",
    },
  ];
  const site: HumanArmTrajectoryModel.ISite = {
    point: fixture.point(1 / 32),
    contact: fixture.point(0),
    disc: 1 / 64,
    rotation: Quaternion.identity(),
    limits: [{ contact: fixture.point(1 / 16), bound: 1 / 128 }],
  };
  const context: HumanArmTrajectoryModel.IContext = {
    ...fixture.context(
      [setup],
      [[empty, hold, empty]],
      [0, 1 / 4, 3 / 4],
      false,
    ),
    sites: [[undefined, site, undefined]],
  };
  const coordinates: number[][][] = [
    [fixture.zero(), fixture.zero(), fixture.zero()],
  ];
  const siteShort: number = 1000 * (1 / 32 - 1 / 64);
  const limitShort: number = 1000 * (1 / 32 - 1 / 128) + 1;
  const forwardShort: number = 1000 * (1 / 8 - 5 / 64 - 1 / 128);
  const reverseShort: number = 1000 * (1 / 16 - 3 / 64);

  const read = HumanArmTrajectoryModel.evaluate(
    context,
    coordinates,
    undefined,
    [false, true, false],
  );
  TestValidator.equals("only the timed hold fails", read.failing, [
    false,
    true,
    false,
  ]);
  TestValidator.equals(
    "forward clearance dominates the timed placement",
    {
      term: read.worst.term,
      axis: read.worst.axis,
      at: read.worst.at,
      placement: read.placement.term,
    },
    { term: "probe", axis: "region", at: 1, placement: "probe" },
  );
  TestValidator.predicate(
    "the forward diagnostic names the displaced time and pair",
    read.worst.what.includes("fixture:external") &&
      read.worst.what.includes("0.250 s") &&
      nclose(read.worst.value, forwardShort, MERIT_ROUNDING_MM),
  );
  TestValidator.predicate(
    "merit counts the forward, reverse and two task misses",
    nclose(
      read.violation,
      forwardShort + reverseShort + siteShort + limitShort,
      MERIT_ROUNDING_MM,
    ),
  );

  const masked = HumanArmTrajectoryModel.evaluate(
    context,
    coordinates,
    undefined,
    [true, false, false],
  );
  TestValidator.equals(
    "excluding hold clearance keeps the task at its own waypoint",
    {
      term: masked.worst.term,
      axis: masked.worst.axis,
      at: masked.worst.at,
      failing: masked.failing,
      pairs: [
        masked.pairs[0]![1]!.deepest.size,
        masked.pairs[0]![1]!.embedded.size,
      ],
    },
    {
      term: "limit",
      axis: "target",
      at: 1,
      failing: [false, true, false],
      pairs: [0, 0],
    },
  );
  TestValidator.predicate(
    "the masked merit has exactly the site and task shortfalls",
    nclose(masked.worst.value, limitShort, MERIT_ROUNDING_MM) &&
      nclose(masked.violation, siteShort + limitShort, MERIT_ROUNDING_MM),
  );

  const atHold: readonly (readonly number[])[] = [fixture.zero()];
  const unproved = HumanArmTrajectoryModel.invalid(context, 1, atHold);
  const proved = HumanArmTrajectoryModel.invalid(context, 1, atHold, true);
  const approach = HumanArmTrajectoryModel.invalid(
    context,
    1,
    atHold,
    true,
    false,
  );
  TestValidator.predicate(
    "validity without a certificate reads the forward pair",
    unproved.what.includes("fixture:external") &&
      nclose(unproved.value, forwardShort, MERIT_ROUNDING_MM),
  );
  TestValidator.predicate(
    "a forward certificate leaves the tighter hold task",
    proved.what.includes("task point") &&
      nclose(proved.value, limitShort, MERIT_ROUNDING_MM),
  );
  TestValidator.predicate(
    "an approach keeps the reverse pair after removing the hold task",
    approach.what.includes("fixture:external") &&
      approach.what.includes("leftHand") &&
      nclose(approach.value, reverseShort, MERIT_ROUNDING_MM),
  );
}
