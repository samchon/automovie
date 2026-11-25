import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCrawl,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  crawlCourse,
  crawlDownTiming,
  crawlUnder,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

namespace part_crawl_course {
  /** Rounding of one minimum-jerk share and one parabola, metres. */
  const ROUNDING: number = 1e-12;

  /** The minimum-jerk share at a quarter, `10/64 - 15/256 + 6/1024`. */
  const QUARTER: number = 10 / 64 - 15 / 256 + 6 / 1024;

  /**
   * `crawlCourse` carries each limb from print to print over its swing on the
   * minimum-jerk share of the swing's time (Flash and Hogan 1985), lifted on
   * the parabola `4 h p (1 - p)`, and holds it on its print between swings.
   *
   * The left hand here has prints 0.3 m apart along x, swings of 0.4 s lifting
   * at 1 and 2 s, and a 5 cm lift; the left knee lifts 2 cm.
   *
   * Scenarios:
   *
   * 1. Before its first swing a limb is on its entry print.
   * 2. Half way through a swing it is half way and at its full lift.
   * 3. A quarter through the second swing it is at `0.3 + 0.3 s(1/4)` and `4 h
   *    (1/4)(3/4)` high.
   * 4. At a touchdown and after the last swing it is on the print it reached.
   * 5. A knee lifts by the knee's height.
   */
  export function verify(): void {
    const place: (
      limb: IAutoMovieMotionHumanCrawl.Limb,
      seconds: number,
    ) => IAutoMovieVector3 = crawlCourse({
      limbs: ["leftHand", "leftKnee"],
      cycles: 2,
      print: (
        _limb: IAutoMovieMotionHumanCrawl.Limb,
        k: number,
      ): IAutoMovieVector3 => ({
        x: 0.3 * k,
        y: 0,
        z: 0,
      }),
      lift: (_limb: IAutoMovieMotionHumanCrawl.Limb, k: number): number => k,
      swing: 0.4,
      handLift: 0.05,
      kneeLift: 0.02,
    });

    // 1. On the entry print.
    TestValidator.predicate(
      "before the first swing",
      vclose(place("leftHand", 0.5), { x: 0, y: 0, z: 0 }, ROUNDING),
    );

    // 2. Half way and fully lifted.
    TestValidator.predicate(
      "half way through a swing",
      vclose(place("leftHand", 1.2), { x: 0.15, y: 0.05, z: 0 }, ROUNDING),
    );

    // 3. A quarter through the second swing.
    TestValidator.predicate(
      "a quarter through the second swing",
      vclose(
        place("leftHand", 2.1),
        { x: 0.3 + 0.3 * QUARTER, y: 4 * 0.05 * 0.25 * 0.75, z: 0 },
        ROUNDING,
      ),
    );

    // 4. On the reached print.
    TestValidator.predicate(
      "at a touchdown",
      vclose(place("leftHand", 1.4), { x: 0.3, y: 0, z: 0 }, ROUNDING),
    );
    TestValidator.predicate(
      "after the last swing",
      vclose(place("leftHand", 5), { x: 0.6, y: 0, z: 0 }, ROUNDING),
    );

    // 5. The knee's own lift.
    TestValidator.predicate(
      "a knee's lift",
      vclose(place("leftKnee", 1.2), { x: 0.15, y: 0.02, z: 0 }, ROUNDING),
    );
  }
}

namespace part_crawl_down_timing {
  /** Rounding of a sum of forward-kinematics distances, seconds. */
  const ROUNDING: number = 1e-9;

  /**
   * `crawlDownTiming` times the keys of a way down to the floor by how far the
   * limbs travel between them: the first key at 0, the second at `sit`, and
   * each later one at `sit` times its summed limb travel over the first
   * stretch's.
   *
   * The body is built whole (`humanFixtureBody`): the keys are posed by forward
   * kinematics over the rig.
   *
   * Scenarios, the average man upright, the keys his posture moved along +X by
   * 0, 0.1 and 0.3 m, so every limb bone travels 0.1 and then 0.2 m:
   *
   * 1. With `sit` 0.8 s the keys fall at 0, 0.8 and 0.8 x 3 = 2.4 s.
   */
  export async function verify(): Promise<void> {
    const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
    const at: (x: number) => IAutoMovieMotionHumanPosture = (
      x: number,
    ): IAutoMovieMotionHumanPosture => ({
      root: { x, y: 0, z: 0 },
      yaw: 0,
      pitch: 0,
      roll: 0,
      joints: {},
      limbs: {},
    });
    const times: number[] = crawlDownTiming(
      body,
      [at(0), at(0.1), at(0.3)],
      0.8,
    );
    TestValidator.predicate(
      "the times",
      times.length === 3 &&
        nclose(times[0]!, 0, ROUNDING) &&
        nclose(times[1]!, 0.8, ROUNDING) &&
        nclose(times[2]!, 2.4, ROUNDING),
    );
  }
}

namespace part_crawl_under {
  /** Rounding of one subtraction per component, metres. */
  const ROUNDING: number = 1e-12;

  /**
   * `crawlUnder` lays a palm on the floor under its shoulder: the shoulder's
   * floor point less the wrist's offset from the palm, so the wrist stands over
   * the place the palm takes, at floor height.
   *
   * Scenarios:
   *
   * 1. A left shoulder at (0.18, 1.4, 0.05) over a wrist offset (0.01, 0.03,
   *    -0.04) lays its palm at (0.17, 0, 0.09).
   * 2. The right side reads its own shoulder and wrist.
   */
  export function verify(): void {
    const shoulders: Partial<Record<AutoMovieHumanoidBone, IAutoMovieVector3>> =
      {
        leftUpperArm: { x: 0.18, y: 1.4, z: 0.05 },
        rightUpperArm: { x: -0.18, y: 1.4, z: 0.05 },
      };
    const under: (side: AutoMovieHumanSide) => IAutoMovieVector3 = crawlUnder({
      local: (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
        shoulders[bone]!,
      wrists: {
        left: { x: 0.01, y: 0.03, z: -0.04 },
        right: { x: -0.01, y: 0.03, z: -0.04 },
      },
    });
    TestValidator.predicate(
      "the left palm",
      vclose(under("left"), { x: 0.17, y: 0, z: 0.09 }, ROUNDING),
    );
    TestValidator.predicate(
      "the right palm",
      vclose(under("right"), { x: -0.17, y: 0, z: 0.09 }, ROUNDING),
    );
  }
}

/**
 * `crawl`'s unit contract: its course, timing, feet, frame, prints and passage
 * under.
 *
 * Its parts, each documented with its own scenarios:
 *
 * - `crawl_course`: `crawlCourse` carries each limb from print to print over its
 *   swing on the minimum-jerk share of the swing's time (Flash and Hogan 1985),
 *   lifted on the parabola `4 h p (1 - p)`, and holds it on its print between
 *   swings.
 * - `crawl_down_timing`: `crawlDownTiming` times the keys of a way down to the
 *   floor by how far the limbs travel between them:
 * - `crawl_under`: `crawlUnder` lays a palm on the floor under its shoulder:
 */
export async function test_unit_motions_floor_crawl(): Promise<void> {
  part_crawl_course.verify();
  await part_crawl_down_timing.verify();
  part_crawl_under.verify();
}
