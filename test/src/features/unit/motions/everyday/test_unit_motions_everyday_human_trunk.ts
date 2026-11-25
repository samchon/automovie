import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanTrunk,
  addHumanTrunkInclination,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

namespace part_add_human_trunk_inclination {
  /** Rounding of one product and sum, degrees. */
  const ROUNDING: number = 1e-12;

  /**
   * `addHumanTrunkInclination` adds a bone's share of the spine's flexion to its
   * flexion, keeping its abduction and twist.
   *
   * Scenarios:
   *
   * 1. A spine at (2, 3, -1) given 0.4 of a 10-degree flexion is at (6, 3, -1).
   * 2. A chest the record leaves out takes its share from zero: 0.6 of 10 is (6, 0,
   *    0).
   */
  export function verify(): void {
    const joints: IAutoMovieMotionHumanPosture["joints"] = {
      spine: [2, 3, -1],
    };
    addHumanTrunkInclination(joints, "spine", 0.4, 10);
    addHumanTrunkInclination(joints, "chest", 0.6, 10);
    TestValidator.predicate(
      "the spine's share added",
      nclose(joints.spine![0], 6, ROUNDING) &&
        joints.spine![1] === 3 &&
        joints.spine![2] === -1,
    );
    TestValidator.predicate(
      "the chest's share from zero",
      nclose(joints.chest![0], 6, ROUNDING) &&
        joints.chest![1] === 0 &&
        joints.chest![2] === 0,
    );
  }
}

namespace part_human_trunk_incline {
  /** Rounding of a few products, degrees. */
  const ROUNDING: number = 1e-12;

  /**
   * `HumanTrunk.incline` shares a forward trunk inclination by the lumbopelvic
   * rhythm (Esola et al. 1996): the pelvis takes 0.64 of it, up to its limit, and
   * the spine and chest the rest, split 0.28 to 0.08; a backward inclination is
   * the pelvis alone. `pelvisPitch` is the pelvis's share.
   *
   * Scenarios:
   *
   * 1. 50 degrees forward: the pelvis 32, the spine 18 shared 14 and 4.
   * 2. With the pelvis limited to 20, it takes 20 and the spine 30, shared 23.33 and
   *    6.67.
   * 3. 10 degrees back is the pelvis's -10, the joints as they were.
   */
  export function verify(): void {
    const joints: IAutoMovieMotionHumanPosture["joints"] = {};
    const free: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
      joints,
      50,
    );
    TestValidator.predicate(
      "the rhythm",
      nclose(free.pitch, 32, ROUNDING) &&
        nclose(HumanTrunk.pelvisPitch(50), 32, ROUNDING) &&
        nclose(free.joints.spine![0], 14, ROUNDING) &&
        nclose(free.joints.chest![0], 4, ROUNDING),
    );
    const limited: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
      joints,
      50,
      20,
    );
    TestValidator.predicate(
      "a limited pelvis",
      nclose(limited.pitch, 20, ROUNDING) &&
        nclose(limited.joints.spine![0], (30 * 0.28) / 0.36, ROUNDING) &&
        nclose(limited.joints.chest![0], (30 * 0.08) / 0.36, ROUNDING),
    );
    const back: ReturnType<typeof HumanTrunk.incline> = HumanTrunk.incline(
      joints,
      -10,
    );
    TestValidator.predicate(
      "leaning back",
      back.pitch === -10 && back.joints === joints,
    );
  }
}

namespace part_human_trunk_pelvis_limit {
  /** Rounding of a few trigonometric products, degrees. */
  const ROUNDING: number = 1e-9;

  /**
   * Rounding of a straight knee, degrees: cos at 1 keeps only half the digits of
   * its argument, so a cosine one rounding off 1 reads about a microdegree.
   */
  const STRAIGHT: number = 1e-5;

  /**
   * `HumanTrunk.pelvisLimit` is the most the pelvis may tilt forward before a
   * planted leg's hip flexion passes `HIP_FLEXION`: each thigh's angle from
   * vertical, its knee bending forward, by the law of cosines on the hip-to-ankle
   * distance, taken from that limit.
   *
   * Scenarios, 0.4 m thighs and shanks, hips 0.09 m either side and 5 cm below a
   * root 1 m up:
   *
   * 1. Standing straight, the ankles 0.8 m below the hips, the thighs are vertical
   *    and the pelvis may tilt the whole `HIP_FLEXION`.
   * 2. Crouched, the ankles 0.4 m below the hips, each knee closes a 60-degree angle
   *    (an equilateral triangle) and the limit is 60 less.
   * 3. Turned 90 degrees, with the ankles on the turned hips, the limit is the
   *    standing one.
   */
  export function verify(): void {
    const body: Parameters<typeof HumanTrunk.pelvisLimit>[0] = {
      rest: new Map<AutoMovieHumanoidBone, IAutoMovieVector3>([
        ["leftUpperLeg", { x: 0.09, y: -0.05, z: 0 }],
        ["rightUpperLeg", { x: -0.09, y: -0.05, z: 0 }],
      ]),
      measure: { thigh: 0.4, shank: 0.4 },
    };
    const root: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const under: (y: number) => Record<"left" | "right", IAutoMovieVector3> = (
      y: number,
    ): Record<"left" | "right", IAutoMovieVector3> => ({
      left: { x: 0.09, y, z: 0 },
      right: { x: -0.09, y, z: 0 },
    });
    TestValidator.predicate(
      "the limits",
      nclose(
        HumanTrunk.pelvisLimit(body, root, 0, under(0.15)),
        HumanTrunk.HIP_FLEXION,
        STRAIGHT,
      ) &&
        nclose(
          HumanTrunk.pelvisLimit(body, root, 0, under(0.55)),
          Math.max(0, HumanTrunk.HIP_FLEXION - 60),
          ROUNDING,
        ) &&
        nclose(
          HumanTrunk.pelvisLimit(body, root, 90, {
            left: { x: 0, y: 0.15, z: -0.09 },
            right: { x: 0, y: 0.15, z: 0.09 },
          }),
          HumanTrunk.HIP_FLEXION,
          STRAIGHT,
        ),
    );
  }
}

namespace part_human_trunk_region {
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
  export async function verify(): Promise<void> {
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
}

/**
 * `HumanTrunk`'s unit contract: its inclination, pelvis limit and regions.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `add_human_trunk_inclination`: `addHumanTrunkInclination` adds a bone's share
 *   of the spine's flexion to its flexion, keeping its abduction and twist.
 * - `human_trunk_incline`: `HumanTrunk.incline` shares a forward trunk
 *   inclination by the lumbopelvic rhythm (Esola et al.
 * - `human_trunk_pelvis_limit`: Rounding of a straight knee, degrees:
 * - `human_trunk_region`: `HumanTrunk`'s region readers place a trunk region on a
 *   posture:
 */
export async function test_unit_motions_everyday_human_trunk(): Promise<void> {
  part_add_human_trunk_inclination.verify();
  part_human_trunk_incline.verify();
  part_human_trunk_pelvis_limit.verify();
  await part_human_trunk_region.verify();
}
