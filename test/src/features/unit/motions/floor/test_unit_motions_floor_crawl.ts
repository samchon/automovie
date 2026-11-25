import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCrawl,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRange,
  HumanFoot,
  crawlCourse,
  crawlDownTiming,
  crawlFeet,
  crawlFrame,
  crawlNominal,
  crawlPrint,
  crawlUnder,
  type humanFootOffset,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../../internal/fixtures/humanFixture";
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
   * minimum-jerk share of the swing's time (Flash and Hogan 1985), lifted on the
   * parabola `4 h p (1 - p)`, and holds it on its print between swings.
   *
   * The left hand here has prints 0.3 m apart along x, swings of 0.4 s lifting at
   * 1 and 2 s, and a 5 cm lift; the left knee lifts 2 cm.
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
  export function run(): void {
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
   * limbs travel between them: the first key at 0, the second at `sit`, and each
   * later one at `sit` times its summed limb travel over the first stretch's.
   *
   * The body is built whole (`humanFixtureBody`): the keys are posed by forward
   * kinematics over the rig.
   *
   * Scenarios, the average man upright, the keys his posture moved along +X by 0,
   * 0.1 and 0.3 m, so every limb bone travels 0.1 and then 0.2 m:
   *
   * 1. With `sit` 0.8 s the keys fall at 0, 0.8 and 0.8 x 3 = 2.4 s.
   */
  export async function run(): Promise<void> {
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

namespace part_crawl_feet_rolled {
  /** Rounding of a few rotations, metres and degrees. */
  const ROUNDING: number = 1e-9;

  /**
   * `crawlFeet.rolled` rolls a standing foot onto its toes without the toes
   * sliding: the heel rises about the toes' joint until the toes reach their
   * extension range, then the foot turns on its toes' tip, its turn to the new
   * heading taken about that tip throughout.
   *
   * Scenarios, the average man's left sole sockets, the foot standing flat at
   * (0.1, 0.08, 0.4) facing +Z, rolled to a heading of 20 degrees with its heel
   * lifted 60:
   *
   * 1. At the start it stands where it stood, its toes flat.
   * 2. At every share the toes' tip stays where it stood.
   * 3. At the end it faces 20 degrees, pitched 60 heel-up, its toes extended to the
   *    lesser of 60 and their range.
   */
  export async function run(): Promise<void> {
    const body: humanFootOffset.IBody = {
      rest: new Map<AutoMovieHumanoidBone, IAutoMovieVector3>([
        ["leftFoot", { x: 0.09, y: 0.08, z: 0 }],
        ["leftToes", { x: 0.09, y: 0.02, z: 0.13 }],
      ]),
      surfaces: (await humanFixture("m-average")).surfaces,
    };
    const standing: IAutoMovieMotionHumanFoot.IPlacement = {
      ankle: { x: 0.1, y: 0.08, z: 0.4 },
      rotation: HumanFoot.rotation(0, 0),
    };
    const roll: ReturnType<typeof crawlFeet.prepareRoll> =
      crawlFeet.prepareRoll(body, "left", standing, 20, 60);
    const tip: IAutoMovieVector3 = HumanFoot.point(
      body,
      "left",
      "toe",
      standing,
      0,
    );
    const start: ReturnType<typeof roll> = roll(0);
    TestValidator.predicate(
      "the start",
      vclose(start.placement.ankle, standing.ankle, ROUNDING) &&
        start.toes === 0,
    );
    TestValidator.predicate(
      "the tip stays",
      [0.1, 0.3, 0.6, 1].every((share: number): boolean => {
        const at: ReturnType<typeof roll> = roll(share);
        return vclose(
          HumanFoot.point(body, "left", "toe", at.placement, at.toes),
          tip,
          ROUNDING,
        );
      }),
    );
    const end: ReturnType<typeof crawlFeet.rolled> = crawlFeet.rolled(
      body,
      "left",
      standing,
      20,
      60,
      1,
    );
    const facing: ReturnType<typeof HumanFoot.headingPitch> =
      HumanFoot.headingPitch(end.placement.rotation);
    TestValidator.predicate(
      "the end",
      nclose(facing.heading, 20, ROUNDING) &&
        nclose(facing.pitch, -60, ROUNDING) &&
        nclose(
          end.toes,
          Math.min(
            60,
            AutoMovieMotionHumanRange.limit("leftToes", "flexion") ?? 60,
          ),
          ROUNDING,
        ),
    );
  }
}

namespace part_crawl_frame {
  /** Rounding of a few square roots and arcsines, metres and degrees. */
  const ROUNDING: number = 1e-9;

  /**
   * `crawlFrame`'s closed forms: `pitched` bisects the trunk's pitch between
   * upright and `PITCH` (120 degrees) over `HALVINGS` (24) halvings, under a
   * ten-thousandth of a degree; `over` sets the hips a thigh above each knee at
   * its place along the heading, their middle the pelvis's height and their
   * difference, over the hip separation's projection at the pitch, its turn.
   *
   * Scenarios:
   *
   * 1. A shoulder reading that stops holding past 37.5 degrees is pitched at 37.5
   *    within 120 / 2^24.
   * 2. Knees on the floor 0.3 m ahead of the level point with the hips 0.3 m behind
   *    them, under 0.45 m thighs, put the hips a thigh up; a pitch of 0 turns
   *    nothing.
   * 3. The left knee raised 0.1 m with hips 0.2 m apart at a 90-degree pitch turns
   *    the pelvis asin(0.1 / 0.2) = 30 degrees, lifting the left hip, the middle
   *    0.05 m higher.
   */
  export function run(): void {
    TestValidator.predicate(
      "the pitch",
      Math.abs(crawlFrame.pitched((d: number): boolean => d < 37.5) - 37.5) <=
        crawlFrame.PITCH / 2 ** crawlFrame.HALVINGS,
    );
    const level: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
    const forward: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
    const knee: (y: number, x: number) => IAutoMovieVector3 = (
      y: number,
      x: number,
    ): IAutoMovieVector3 => ({ x, y, z: 0.3 });
    const flat: ReturnType<typeof crawlFrame.over> = crawlFrame.over(
      0.45,
      level,
      forward,
      { left: knee(0, 0.1), right: knee(0, -0.1) },
      { left: 0.3, right: 0.3 },
      0.2,
      0,
    );
    TestValidator.predicate(
      "level knees",
      vclose(flat.point, { x: 0, y: 0.45, z: 0 }, ROUNDING) && flat.hike === 0,
    );
    const raised: ReturnType<typeof crawlFrame.over> = crawlFrame.over(
      0.45,
      level,
      forward,
      { left: knee(0.1, 0.1), right: knee(0, -0.1) },
      { left: 0.3, right: 0.3 },
      0.2,
      90,
    );
    TestValidator.predicate(
      "a raised knee",
      nclose(raised.point.y, 0.5, ROUNDING) &&
        nclose(raised.hike, 30, ROUNDING),
    );
  }
}

namespace part_crawl_nominal {
  /**
   * `crawlNominal` puts each palm where `under` places it and each knee under its
   * hip joint, the hip's local place lowered to the knee's height.
   *
   * Scenarios:
   *
   * 1. The palms are `under`'s for their sides.
   * 2. Each knee keeps its hip's x and z and takes the knee's height.
   *
   * Every value is copied, not computed, so each agrees exactly.
   */
  export function run(): void {
    const hips: Partial<Record<AutoMovieHumanoidBone, IAutoMovieVector3>> = {
      leftUpperLeg: { x: 0.09, y: 0.9, z: -0.02 },
      rightUpperLeg: { x: -0.09, y: 0.9, z: -0.02 },
    };
    const nominal: Record<IAutoMovieMotionHumanCrawl.Limb, IAutoMovieVector3> =
      crawlNominal({
        under: (side: AutoMovieHumanSide): IAutoMovieVector3 => ({
          x: side === "left" ? 0.2 : -0.2,
          y: 0,
          z: 0.6,
        }),
        local: (bone: AutoMovieHumanoidBone): IAutoMovieVector3 => hips[bone]!,
        knee: 0.04,
      });
    const expected: Record<IAutoMovieMotionHumanCrawl.Limb, IAutoMovieVector3> =
      {
        leftHand: { x: 0.2, y: 0, z: 0.6 },
        rightHand: { x: -0.2, y: 0, z: 0.6 },
        leftKnee: { x: 0.09, y: 0.04, z: -0.02 },
        rightKnee: { x: -0.09, y: 0.04, z: -0.02 },
      };
    for (const limb of Object.keys(
      expected,
    ) as IAutoMovieMotionHumanCrawl.Limb[])
      TestValidator.predicate(
        `the ${limb}`,
        vclose(nominal[limb], expected[limb], 0),
      );
  }
}

namespace part_crawl_print {
  /** Rounding of one turn by a right angle and one sum, metres. */
  const ROUNDING: number = 1e-12;

  /**
   * `crawlPrint` places a limb's print in the floor frame: its nominal place
   * moved along the heading by the stride times the landed share for the entry
   * print and the limb's centred share after, turned by the frame's yaw (local
   * `(x, z)` to world `(z, -x)` at 90 degrees) and moved to its origin.
   *
   * The frame here stands at (1, 0, 2) facing 90 degrees; the left hand's nominal
   * place is (0.1, 0, 0.2), the stride 0.5 m, the landed share a quarter and the
   * centred share of print `j` is `j`.
   *
   * Scenarios:
   *
   * 1. The entry print is 0.125 m ahead of the nominal place: local (0.1, 0, 0.325),
   *    world (1.325, 0, 1.9).
   * 2. Print 2 is a metre ahead: local (0.1, 0, 1.2), world (2.2, 0, 1.9).
   */
  export function run(): void {
    const nominal: Record<IAutoMovieMotionHumanCrawl.Limb, IAutoMovieVector3> =
      {
        leftHand: { x: 0.1, y: 0, z: 0.2 },
        rightHand: { x: -0.1, y: 0, z: 0.2 },
        leftKnee: { x: 0.1, y: 0.05, z: -0.3 },
        rightKnee: { x: -0.1, y: 0.05, z: -0.3 },
      };
    const print: (
      limb: IAutoMovieMotionHumanCrawl.Limb,
      j: number,
    ) => IAutoMovieVector3 = crawlPrint({
      frame: { origin: { x: 1, y: 0, z: 2 }, yaw: 90 },
      nominal,
      stride: 0.5,
      landed: 0.25,
      centred: (_limb: IAutoMovieMotionHumanCrawl.Limb, j: number): number => j,
    });
    TestValidator.predicate(
      "the entry print",
      vclose(print("leftHand", 0), { x: 1.325, y: 0, z: 1.9 }, ROUNDING),
    );
    TestValidator.predicate(
      "the second print",
      vclose(print("leftHand", 2), { x: 2.2, y: 0, z: 1.9 }, ROUNDING),
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
   * 1. A left shoulder at (0.18, 1.4, 0.05) over a wrist offset (0.01, 0.03, -0.04)
   *    lays its palm at (0.17, 0, 0.09).
   * 2. The right side reads its own shoulder and wrist.
   */
  export function run(): void {
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
 * - `crawl_feet_rolled`: `crawlFeet.rolled` rolls a standing foot onto its toes
 *   without the toes sliding:
 * - `crawl_frame`: `crawlFrame`'s closed forms:
 * - `crawl_nominal`: `crawlNominal` puts each palm where `under` places it and
 *   each knee under its hip joint, the hip's local place lowered to the knee's
 *   height.
 * - `crawl_print`: `crawlPrint` places a limb's print in the floor frame:
 * - `crawl_under`: `crawlUnder` lays a palm on the floor under its shoulder:
 */
export async function test_unit_motions_floor_crawl(): Promise<void> {
  part_crawl_course.run();
  await part_crawl_down_timing.run();
  await part_crawl_feet_rolled.run();
  part_crawl_frame.run();
  part_crawl_nominal.run();
  part_crawl_print.run();
  part_crawl_under.run();
}
