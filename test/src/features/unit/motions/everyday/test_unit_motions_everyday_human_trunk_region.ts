import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanTrunk } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { vclose } from "../../../internal/vclose";

/** Rounding of a forward-kinematics chain, metres. */
const ROUNDING: number = 1e-9;

/**
 * `HumanTrunk`'s region readers place a trunk region on a posture: `region`,
 * the prepared `prepareRegion` and `preparePoint`, and the reading `prepare`
 * all give the same point and normal, the region moving rigidly with the
 * posture's root and heading; `surface` casts a ray onto the trunk's own
 * colliders.
 *
 * The body is built whole (`humanFixtureBody`): a region is placed by forward
 * kinematics over the rig and the surfaces, records `createHumanBody` derives.
 *
 * Scenarios, the average man upright with no joint turned:
 *
 * 1. The sternum read by all four readers is one point and one normal.
 * 2. Moving the root 1 m along +X and 0.5 m along +Z moves the point by that and
 *    keeps the normal.
 * 3. Turning the heading 90 degrees turns the point's offset from the root about
 *    +Y: (x, z) to (z, -x).
 * 4. A ray from 1 m ahead of the sternum toward it lands on the trunk between the
 *    two, its normal facing back toward the ray's start.
 */
export async function test_unit_motions_everyday_human_trunk_region(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const posture: (
    root: IAutoMovieVector3,
    yaw: number,
  ) => IAutoMovieMotionHumanPosture = (
    root: IAutoMovieVector3,
    yaw: number,
  ): IAutoMovieMotionHumanPosture => ({
    root,
    yaw,
    pitch: 0,
    roll: 0,
    joints: {},
    limbs: {},
  });
  const root: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const upright: IAutoMovieMotionHumanPosture = posture(root, 0);
  const at: HumanTrunk.ISurface = HumanTrunk.region(body, upright, "sternum");
  const prepared: HumanTrunk.ISurface = HumanTrunk.prepareRegion(
    body,
    "sternum",
  )(upright);
  const reading: ReturnType<typeof HumanTrunk.prepare> = HumanTrunk.prepare(
    body,
    upright,
  );
  TestValidator.predicate(
    "one point",
    vclose(prepared.point, at.point, ROUNDING) &&
      vclose(prepared.normal, at.normal, ROUNDING) &&
      vclose(
        HumanTrunk.preparePoint(body, "sternum")(upright),
        at.point,
        ROUNDING,
      ) &&
      vclose(reading.region("sternum").point, at.point, ROUNDING),
  );
  const moved: HumanTrunk.ISurface = HumanTrunk.region(
    body,
    posture({ x: 1, y: 0, z: 0.5 }, 0),
    "sternum",
  );
  TestValidator.predicate(
    "moved",
    vclose(
      moved.point,
      { x: at.point.x + 1, y: at.point.y, z: at.point.z + 0.5 },
      ROUNDING,
    ) && vclose(moved.normal, at.normal, ROUNDING),
  );
  const turned: HumanTrunk.ISurface = HumanTrunk.region(
    body,
    posture(root, 90),
    "sternum",
  );
  TestValidator.predicate(
    "turned",
    vclose(
      turned.point,
      { x: at.point.z, y: at.point.y, z: -at.point.x },
      ROUNDING,
    ),
  );
  const from: IAutoMovieVector3 = {
    x: at.point.x + at.normal.x,
    y: at.point.y + at.normal.y,
    z: at.point.z + at.normal.z,
  };
  const hit: ReturnType<typeof HumanTrunk.surface> = HumanTrunk.surface(
    body,
    upright,
    from,
    { x: -at.normal.x, y: -at.normal.y, z: -at.normal.z },
  );
  const toStart: IAutoMovieVector3 = {
    x: from.x - hit.point.x,
    y: from.y - hit.point.y,
    z: from.z - hit.point.z,
  };
  TestValidator.predicate(
    "the ray's hit",
    toStart.x * hit.normal.x +
      toStart.y * hit.normal.y +
      toStart.z * hit.normal.z >
      0 && Math.hypot(toStart.x, toStart.y, toStart.z) < 1 + 1e-9,
  );
}
