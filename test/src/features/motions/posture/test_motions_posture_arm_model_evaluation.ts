import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanBody,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanArmGeometry
} from "../../../../../packages/motions/src/posture/internal/HumanArmGeometry";
import {
  HumanArmTrajectoryModel
} from "../../../../../packages/motions/src/posture/internal/HumanArmTrajectoryModel";
import { TestValidator } from "@nestia/e2e";

import { armTrajectoryReading as fixture } from "../../internal/armTrajectoryReading";
import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";

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
 *
 * Scenarios:
 *
 * 1. Compare the held, masked and approaching reads of the same two directed
 *    clearance pairs and task points.
 * 2. Change only the fifth knot's wrist angle. The first interior edge keeps
 *    its endpoint chord, but the material encounter between them clears.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Explains timed hold and task misses, directed clearance masks and certification, and remote-knot material recomputation.
 * @evidence contracts/development/testing.md#behavioral-verification Evaluates one arm with and without a clearance mask and certificate, then changes only the distant wrist knot.
 * @evidence contracts/development/testing.md#independent-expectations Independent miss magnitudes determine merit and the forward pair diagnostic. Reverse collision remains after forward certification and the later wrist turn removes only the material encounter.
 */
export async function test_motions_posture_arm_model_evaluation(): Promise<void> {
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
        rotation: AutoMovieEngineQuaternion.identity(),
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
    rotation: AutoMovieEngineQuaternion.identity(),
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
  readMaterialAfterRemoteKnot(setup);
}

/**
 * A native material encounter takes the entire minimum-jerk curve. Solving
 * the jerk and snap continuity equations on seconds 0 through 4 with only the
 * last angle nonzero gives `q(1.5) / q(4) = 210705 / 2480128`. A 45-degree
 * turn therefore moves the 1/8-m corner by 8.339 mm at the obstacle's centre.
 * The 1.953-mm sphere no longer contains it. The chord on seconds 1 to 2
 * still crosses the centre, and knot 4 lies beyond its adjacent knots 0 to 3.
 */
function readMaterialAfterRemoteKnot(
  setup: IAutoMovieMotionHumanArmGeometry.ISetup,
): void {
  const base: IAutoMovieMotionHumanArmGeometry.IFrame = fixture.frame(
    setup,
    0,
    [0],
  );
  const basis: ReturnType<typeof setup.basis> = setup.basis(
    setup.bones.hand,
    "material witness",
  );
  const corner: IAutoMovieVector3 = AutoMovieEngineVector3.scale(basis.abduction, 1 / 8);
  const at: IAutoMovieMotionHumanArmGeometry.IPlaced = HumanArmGeometry.placed(
    setup,
    base,
    fixture.zero(),
    false,
  );
  const centre: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    at.wrist,
    AutoMovieEngineQuaternion.rotateVector(at.hand, corner),
  );
  const axis: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
    at.hand,
    basis.flexion,
  );
  const radius: number = 1 / 512;
  const shape: IAutoMovieMotionHumanArmGeometry.IShape = {
    bone: "chest",
    part: setup.body.tangle.parts.findIndex((part) => part.bone === "chest"),
    pose: { position: centre, rotation: AutoMovieEngineQuaternion.identity() },
    shape: fixture.sphere(radius),
    centre,
    radius,
  };

  /** The wrist translates along its flexion axis from seconds 1 to 2. */
  const frame = (
    seconds: number,
  ): IAutoMovieMotionHumanArmGeometry.IFrame => ({
    ...base,
    bounds: { ...base.bounds, hand: { centre: corner, radius: 0 } },
    parent: {
      ...base.parent,
      position: AutoMovieEngineVector3.addScaled(
        base.parent.position,
        axis,
        (Math.min(2, Math.max(1, seconds)) - 3 / 2) / 128,
      ),
    },
    shapes: [shape],
    surface: [corner],
  });
  const times: readonly number[] = [0, 1, 2, 3, 4];
  const context: HumanArmTrajectoryModel.IContext = {
    ...fixture.context([setup], [times.map(frame)], times, false),
    material: { parts: [shape.part], frame: (_: number, t: number) => frame(t) },
  };
  const stillWrist: number[][] = times.map(fixture.zero);
  const turningWrist: number[][] = [...stillWrist];
  turningWrist[4] = fixture.zero();
  turningWrist[4]![6] = 45;
  const before: HumanArmTrajectoryModel.IEvaluation =
    HumanArmTrajectoryModel.evaluate(context, [stillWrist]);
  const fresh: HumanArmTrajectoryModel.IEvaluation =
    HumanArmTrajectoryModel.evaluate(context, [turningWrist]);
  const kept: HumanArmTrajectoryModel.IEvaluation =
    HumanArmTrajectoryModel.evaluate(context, [turningWrist], {
      reading: before,
      laid: [false, false, false, false, true],
    });
  TestValidator.equals(
    "a remote turn clears only the native material encounter",
    [before.swept[0]![1]!.length, fresh.swept[0]![1]!.length],
    [2, 1],
  );
  TestValidator.equals(
    "retaining the first interior edge still recomputes its material",
    kept.swept[0]![1]!.length,
    fresh.swept[0]![1]!.length,
  );
}
