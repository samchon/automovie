import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import {
  HumanForceThrow
} from "../../../../../packages/motions/src/grappling/internal/HumanForceThrow";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../internal/fixtures/humanFixture";
import { vclose } from "../../internal/vclose";

/** A quarter turn about +Y: (x, y, z) goes to (z, y, -x). */
const QUARTER: IAutoMovieQuaternion = {
  x: 0,
  y: Math.SQRT1_2,
  z: 0,
  w: Math.SQRT1_2,
};

/**
 * Check world placement of grapple force sites from displayed bones.
 *
 * Scenarios:
 *
 * 1. Place a bone-local point 0.1 m along X in a quarter-turned bone at (1,
 *    2, 3). Its world displacement is 0.1 m along -Z.
 * 2. Place the measured abdomen region through the same displayed frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases identify the bone point and measured region along with their common transform.
 * @evidence contracts/development/testing.md#behavioral-verification The force-site reader handles both direct bone offsets and a named region on a canonical body.
 * @evidence contracts/development/testing.md#independent-expectations The fixture reconstructs expected positions from the source coordinates and given rigid rotation.
 */
export async function test_motions_grappling_force_throw(): Promise<void> {
  const surfaces: IAutoMovieHumanoidSurfaces.ISurfaces = (
    await humanFixture("m-average")
  ).surfaces;
  const abdomen: IAutoMovieHumanoidSurfaces.IFrame = surfaces.regions.abdomen;
  const placed = (bone: AutoMovieHumanoidBone): IAutoMovieResolvedBone => ({
    bone,
    localRotation: QUARTER,
    worldPosition: { x: 1, y: 2, z: 3 },
    worldRotation: QUARTER,
  });
  const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = new Map([
    ["leftLowerArm", placed("leftLowerArm")],
    [abdomen.bone, placed(abdomen.bone)],
  ]);
  TestValidator.predicate(
    "a bone's point and a region",
    vclose(
      HumanForceThrow.site({ surfaces }, bones, {
        bone: "leftLowerArm",
        point: { x: 0.1, y: 0, z: 0 },
      }),
      { x: 1, y: 2, z: 2.9 },
      1e-12,
    ) &&
      vclose(
        HumanForceThrow.site({ surfaces }, bones, "abdomen"),
        {
          x: 1 + abdomen.point.z,
          y: 2 + abdomen.point.y,
          z: 3 - abdomen.point.x,
        },
        1e-12,
      ),
  );
}
