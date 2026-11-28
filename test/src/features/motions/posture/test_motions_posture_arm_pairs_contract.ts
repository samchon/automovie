import { AutoMovieEngineQuaternion } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";
import {
  HumanArmGeometry
} from "../../../../../packages/motions/src/posture/internal/HumanArmGeometry";
import {
  HumanArmTrajectoryModel
} from "../../../../../packages/motions/src/posture/internal/HumanArmTrajectoryModel";
import {
  HumanArmTrajectoryPairs
} from "../../../../../packages/motions/src/posture/internal/HumanArmTrajectoryPairs";
import { TestValidator } from "@nestia/e2e";

import { armTrajectoryReading as fixture } from "../../internal/armTrajectoryReading";
import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";

/**
 * The collinear signed gap uses the radius and absolute axial distance, then
 * applies the allowance and converts to millimetres. Even charging 32 binary64
 * rounding units for placement and the gap at a one-metre scale, the error is
 * at most this many millimetres.
 */
const GAP_ROUNDING_MM: number = 32 * 1000 * Number.EPSILON;

/**
 * Obstruction pairs retain one signed depth per directed part pair. The first
 * arm's two probes and two external corners give different depths into
 * axis-aligned spheres. A related part is omitted even when it overlaps.
 *
 * Crossing reads a different probe in each direction. It subtracts that
 * direction's rest and approach-grasp allowances from the depth, and excuses
 * the holding direction entirely once its grasp allowance is unbounded.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines signed obstruction per directed part pair, related-pair omission and directional grasp allowances.
 * @evidence contracts/development/testing.md#behavioral-verification Queries both directions of a fixture whose probe and corner depths differ, then tests allowed and unbounded grasp directions.
 * @evidence contracts/development/testing.md#independent-expectations Independent sphere depths and declared allowance subtraction give different directed results. An unbounded allowance excuses only its own direction.
 */
export async function test_motions_posture_arm_pairs_contract(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const left: IAutoMovieMotionHumanArmGeometry.ISetup = fixture.setup(
    body,
    "left",
  );
  const right: IAutoMovieMotionHumanArmGeometry.ISetup = fixture.setup(
    body,
    "right",
  );
  const external: number = body.tangle.parts.length;
  const first: IAutoMovieMotionHumanArmGeometry.IFrame = fixture.frame(
    left,
    0,
    [3 / 128, 1 / 128],
    1 / 32,
  );
  const related: number = body.tangle.parts.findIndex(
    (part) => part.bone === "leftLowerArm",
  );
  first.related[fixture.hand(left)] = [];
  first.related[fixture.hand(left)]![related] = true;
  first.shapes = [
    {
      bone: "fixture:external",
      part: external,
      pose: { position: fixture.point(0), rotation: AutoMovieEngineQuaternion.identity() },
      shape: fixture.sphere(1 / 32),
      centre: fixture.point(0),
      radius: 1 / 32,
    },
    {
      bone: "leftLowerArm",
      part: related,
      pose: { position: fixture.point(0), rotation: AutoMovieEngineQuaternion.identity() },
      shape: fixture.sphere(1 / 32),
      centre: fixture.point(0),
      radius: 1 / 32,
    },
  ];
  first.body = [
    {
      point: fixture.point(-3 / 128),
      part: external,
      corner: 0,
      bone: "fixture:external",
    },
    {
      point: fixture.point(-1 / 128),
      part: external,
      corner: 1,
      bone: "fixture:external",
    },
  ];
  const placed: IAutoMovieMotionHumanArmGeometry.IPlaced =
    HumanArmGeometry.placed(left, first, fixture.zero());
  const context: HumanArmTrajectoryModel.IContext = {
    ...fixture.context([left], [[first]], [0], true),
    allowed: () => -1 / 128,
    inside: () => -1 / 256,
    rested: (_a, _k, _probe, bone) => bone === "fixture:external",
    lying: (_a, _k, segment, bone) =>
      segment === "hand" && bone === "fixture:external",
  };

  const forward = [
    ...HumanArmTrajectoryPairs.deepest(context, 0, 0, placed).values(),
  ];
  TestValidator.equals(
    "one forward pair, with the related part suppressed",
    forward.map(({ probe, shape, rested }) => ({ probe, shape, rested })),
    [{ probe: 9, shape: 0, rested: true }],
  );
  TestValidator.predicate(
    "forward probe's allowed depth",
    nclose(
      forward[0]!.short,
      1000 * (1 / 32 - 1 / 128 - 1 / 128),
      GAP_ROUNDING_MM,
    ),
  );

  const reverse = [
    ...HumanArmTrajectoryPairs.embedded(context, 0, 0, placed).values(),
  ];
  TestValidator.equals(
    "one reverse pair, with the deepest external corner",
    reverse.map(({ corner, index, owner, bone, shape, rested }) => ({
      corner,
      index,
      owner,
      bone,
      armBone: shape.bone,
      rested,
    })),
    [
      {
        corner: 1,
        index: 0,
        owner: "hand",
        bone: "fixture:external",
        armBone: "leftHand",
        rested: true,
      },
    ],
  );
  TestValidator.predicate(
    "reverse corner's separate allowed depth",
    nclose(
      reverse[0]!.short,
      1000 * (1 / 32 - 1 / 128 - 1 / 256),
      GAP_ROUNDING_MM,
    ),
  );

  const second: IAutoMovieMotionHumanArmGeometry.IFrame = fixture.frame(
    right,
    1 / 64,
    [1 / 128],
    1 / 32,
  );
  const partner: IAutoMovieMotionHumanArmGeometry.IPlaced =
    HumanArmGeometry.placed(right, second, fixture.zero());
  const crossing: HumanArmTrajectoryModel.IContext = {
    ...fixture.context([left, right], [[first], [second]], [0], true),
    between: (a) => (a === 0 ? -1 / 256 : 0),
    grasped: (a, _k, own, other, index) =>
      a === 0 && own === "hand" && other === "hand" && index === 0
        ? 1 / 256
        : undefined,
    rested: (a, _k, _probe, bone) => a === 0 && bone === "rightHand",
  };
  const directions = [
    ...HumanArmTrajectoryPairs.crossing(crossing, 0, placed, partner).values(),
  ];
  TestValidator.equals(
    "both crossing directions identify their opposite collider",
    directions.map(({ a, probe, bone, owner, rested }) => ({
      a,
      probe,
      bone,
      owner,
      rested,
    })),
    [
      { a: 0, probe: 8, bone: "rightHand", owner: "hand", rested: true },
      { a: 1, probe: 8, bone: "leftHand", owner: "hand", rested: false },
    ],
  );
  TestValidator.predicate(
    "one crossing keeps both allowances",
    nclose(
      directions[0]!.short,
      1000 * (1 / 32 - 1 / 128 - 2 / 256),
      GAP_ROUNDING_MM,
    ),
  );
  TestValidator.predicate(
    "the opposite crossing keeps the whole depth",
    nclose(directions[1]!.short, 1000 * (1 / 32 - 3 / 128), GAP_ROUNDING_MM),
  );
  const held = HumanArmTrajectoryPairs.crossing(
    { ...crossing, grasped: (a) => (a === 0 ? Infinity : undefined) },
    0,
    placed,
    partner,
  );
  TestValidator.equals(
    "only the unbounded grasp direction is excused",
    [...held.values()].map((pair) => pair.a),
    [1],
  );
}
