import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieMotionHumanSeated,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanRefusal } from "@automovie/motions";
import {
  seated
} from "../../../../../packages/motions/src/everyday/internal/seated";
import { TestValidator } from "@nestia/e2e";
import { strict as assert } from "node:assert";

import type { IHumanFixture } from "../../internal/fixtures/IHumanFixture";
import { humanFixture } from "../../internal/fixtures/humanFixture";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Sourced seat heights and diameters at the ordinary and high bounds. */
const DISCS: readonly (readonly [number, number, boolean])[] = [
  [0.43, 0.3, false],
  [0.457, 0.35, false],
  [1.067 - 12 * 0.0254, 0.3, true],
  [1.067 - 10 * 0.0254, 0.35, true],
];

/**
 * The seated geometry admits the original disc supports and refuses a low
 * ordinary cushion against the floor's actual height.
 *
 * Scenarios:
 * 1. The surveyed average man's socket is on the source-sized discs at their
 *    lower and upper bounds. A 90-degree turn rotates the point and its root.
 * 2. A cushion exactly at 0.8 of popliteal height above its floor is admitted.
 *    At 1 mm lower the refusal states the measured world height in metres.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Approved disc seats place the stock sockets at their surveyed bounds. An ordinary cushion must clear the minimum height above its floor.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the seating geometry and admission owner with a stock body, turned disc, and cushion at and below the minimum.
 * @evidence contracts/development/testing.md#independent-expectations The floor plus 0.8 of measured popliteal height gives the exact cushion boundary. Turning the disc by 90 degrees gives its distinct rotated point.
 */
export async function test_motions_everyday_stool_contact(): Promise<void> {
  const rig: IHumanFixture = await humanFixture("m-average");
  const hips: IAutoMovieBone = rig.skeleton.bones.find(
    (bone): boolean => bone.bone === "hips",
  )!;
  const joint: IAutoMovieBone = rig.skeleton.bones.find(
    (bone): boolean => bone.bone === "leftUpperLeg",
  )!;
  // The stored rig has both axes aligned and the left hip directly on hips.
  assert.equal(joint.parent, hips.bone);
  const hip: IAutoMovieVector3 = hips.rest.translation;
  const offset: IAutoMovieVector3 = AutoMovieEngineVector3.add(
    hip,
    rig.surfaces.sockets.seat.point,
  );
  const body: Parameters<typeof seated.point>[0] = {
    rest: new Map<AutoMovieHumanoidBone, IAutoMovieVector3>([
      ["hips", hip],
      ["leftUpperLeg", AutoMovieEngineVector3.add(hip, joint.rest.translation)],
    ]),
    measure: rig.measure,
    surfaces: rig.surfaces,
  };

  for (const [top, diameter, high] of DISCS) {
    const front: number = diameter / 2;
    const seat: IAutoMovieMotionHumanSeated.ISeat = {
      at: { x: front, y: top, z: 0 },
      yaw: 90,
      depth: diameter,
    };
    // These discs are shallow enough for the 20 mm back clearance to govern.
    const expected: IAutoMovieVector3 = { x: 0.02 - front, y: top, z: 0 };
    const point: IAutoMovieVector3 = seated.point(body, seat);
    const root: IAutoMovieVector3 = seated.root(body, expected, {
      yaw: 90,
      pitch: 0,
      roll: 0,
    });
    TestValidator.predicate(
      `the ${top} m disc holds its socket within 10 mm`,
      seated.high(rig, seat) === high &&
        vclose(point, expected, 1e-9) &&
        Math.hypot(
          point.y - top,
          Math.max(0, Math.hypot(point.x, point.z) - front),
        ) <= 0.01 &&
        vclose(
          root,
          { x: expected.x - offset.z, y: top - offset.y, z: offset.x },
          1e-9,
        ),
    );
  }

  const { ankleHeight, shank, thighRadius }: IHumanFixture["measure"] = rig.measure;
  const floor: number = 0.12;
  const minimum: number = floor + 0.8 * (ankleHeight + shank - thighRadius);
  seated.check(rig, { at: { x: 0, y: minimum, z: 0 }, yaw: 0 }, floor);
  const below: number = minimum - 0.001;
  assert.throws(
    (): void =>
      seated.check(rig, { at: { x: 0, y: below, z: 0 }, yaw: 0 }, floor),
    (error: unknown): boolean =>
      error instanceof AutoMovieMotionHumanRefusal &&
      error.kind === "reach" &&
      error.axis === "seat" &&
      typeof error.value === "number" &&
      nclose(error.value, below, 1e-9) &&
      error.feasible?.kind === "range" &&
      error.feasible.minimum !== null &&
      nclose(error.feasible.minimum, minimum, 1e-9) &&
      error.feasible.maximum === null &&
      error.feasible.unit === "m" &&
      error.fix.length > 0,
  );
}
