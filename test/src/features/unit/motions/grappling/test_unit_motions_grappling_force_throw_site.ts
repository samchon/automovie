import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { HumanForceThrow } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { vclose } from "../../../internal/vclose";

/** A quarter turn about +Y: (x, y, z) goes to (z, y, -x). */
const QUARTER: IAutoMovieQuaternion = {
  x: 0,
  y: Math.SQRT1_2,
  z: 0,
  w: Math.SQRT1_2,
};

/**
 * `HumanForceThrow.site` places a force site on resolved bones: a bone's point
 * by that bone's world frame, a region by its bone-local surface point.
 *
 * The average man's abdomen region, and a bone point 0.1 m along x, are read on
 * bones placed at (1, 2, 3) turned a quarter about +Y.
 *
 * Scenarios:
 *
 * 1. The bone's point lands at (1, 2, 3) plus its turned offset, (0, 0, -0.1).
 * 2. The abdomen lands at (1, 2, 3) plus its turned local point.
 */
export async function test_unit_motions_grappling_force_throw_site(): Promise<void> {
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
