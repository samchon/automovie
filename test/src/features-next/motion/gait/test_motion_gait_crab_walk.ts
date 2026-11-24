import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanCrabWalk,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanChain, HumanPerformance, HumanRefusal } from "@automovie/motions";
import { HUMAN_LEXICON } from "@automovie/motions/internal";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionComplaints } from "../../../features/internal/motionComplaints";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The crawl's travel, metres in the performer's frame. */
const TO: IAutoMovieVector3 = { x: 0, y: 0, z: 1.2 };
/** The authored pelvis height, statures. */
const HEIGHT: number = 0.22;
/** The pelvis holds its height within this while travelling, metres: a trunk's sway. */
const LEVEL: number = 0.05;
/** The root arrives within this of the travel's end, metres. */
const ARRIVE: number = 0.03;
/** A part other than the hands and feet stays this far above the floor, metres: the skin. */
const CLEAR: number = 0.05;
/** The bones that must stay off the floor. */
const OFF: readonly AutoMovieHumanoidBone[] = [
  "hips",
  "spine",
  "chest",
  "head",
];

/**
 * The supine crab walk on two bodies, feet first and head first.
 *
 * Scenarios:
 * 1. The pelvis holds the authored height while travelling, and the trunk
 *    and the head stay off the floor, so the hands and the feet are the only
 *    floor contacts.
 * 2. The supports alternate in the diagonal sequence: at every sampled
 *    instant of the travel a diagonal pair (a hand and the opposite foot)
 *    bears.
 * 3. The pelvis travels the authored displacement; feet first and head first face
 *    opposite ways.
 * 4. A full backbend beyond the canonical spine's extension is refused, and
 *    so is a pelvis height the limbs cannot hold.
 * 5. Each take passes the shipped verdict report.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the variants and what each check pins.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the registered crabWalk row through HumanPerformance and reads bones, contact windows, the root and the verdict report.
 * @evidence contracts/development/testing.md#independent-expectations The height is authored; the level and skin bounds are a trunk's sway and the floor skin.
 * @evidence contracts/development/testing.md#distinguishing-cases Two bodies, two leads, a refused backbend and a refused height.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on polygon men.
 */
export function test_motion_gait_crab_walk(): void {
  const checks: motionComplaints.IGatherer = motionComplaints();
  for (const label of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(label);
    const yaws: number[] = [];
    for (const lead of ["feet", "head"] as const)
      try {
        const film: HumanPerformance = perform(body, {
          to: TO,
          lead,
          height: HEIGHT,
        });
        const crawl: IAutoMovieMotionHumanSegment = film
          .segments("s")
          .find(
            (s: IAutoMovieMotionHumanSegment): boolean => s.name === "crabWalk",
          )!;
        const settled: number =
          crawl.start +
          crawl.plan.duration *
            crawl.plan.events.find((e): boolean => e.name === "settled")!.share;
        const end: number = crawl.start + crawl.plan.duration;
        for (let i: number = 0; i <= 16; ++i) {
          const t: number = settled + ((end - settled) * i) / 16;
          const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
            film.bones("s", t);
          const pelvis: number = bones.get("hips")!.worldPosition.y;
          checks.check(
            `${label} ${lead}: the pelvis holds its height at ${t.toFixed(2)} (${pelvis.toFixed(3)} m)`,
            Math.abs(pelvis - HEIGHT * body.measure.stature) <= LEVEL,
          );
          for (const bone of OFF)
            checks.check(
              `${label} ${lead}: the ${bone} stays off the floor at ${t.toFixed(2)}`,
              bones.get(bone)!.worldPosition.y >= CLEAR,
            );
          const share: number = (t - crawl.start) / crawl.plan.duration;
          const bearing: (
            part: IAutoMovieMotionHumanContactWindow["part"],
          ) => boolean = (
            part: IAutoMovieMotionHumanContactWindow["part"],
          ): boolean =>
            crawl.plan.contacts.some(
              (c: IAutoMovieMotionHumanContactWindow): boolean =>
                c.part === part &&
                c.kind === "plant" &&
                c.from <= share + 1e-9 &&
                c.to >= share - 1e-9,
            );
          checks.check(
            `${label} ${lead}: a diagonal pair bears at ${t.toFixed(2)}`,
            (bearing("rightHand") && bearing("leftFoot")) ||
              (bearing("leftHand") && bearing("rightFoot")),
          );
        }
        // The pelvis travels the authored displacement from where it settled.
        const moved: IAutoMovieVector3 = Vector3.subtract(
          film.bones("s", end).get("hips")!.worldPosition,
          film.bones("s", settled).get("hips")!.worldPosition,
        );
        checks.check(
          `${label} ${lead}: the pelvis travels (${moved.x.toFixed(3)}, ${moved.z.toFixed(3)} m)`,
          Math.abs(moved.z - TO.z) <= ARRIVE &&
            Math.abs(moved.x - TO.x) <= ARRIVE,
        );
        yaws.push(film.posture("s", film.duration).yaw);
        assertTakeClean(`${label} crab walk ${lead} first`, film);
      } catch (error: unknown) {
        checks.check(`${label} ${lead} refused: ${String(error)}`, false);
      }
    checks.check(
      `${label}: feet first and head first face opposite ways`,
      yaws.length === 2 &&
        Math.abs(Math.abs(((yaws[0]! - yaws[1]! + 540) % 360) - 180) - 180) <=
          1,
    );
    for (const [axis, params] of [
      ["backbend", { to: TO, backbend: true }],
      ["height", { to: TO, height: 0.6 }],
    ] as const) {
      let refusal: unknown = undefined;
      try {
        perform(body, params);
      } catch (error: unknown) {
        refusal = error;
      }
      checks.check(
        `${label}: refused on ${axis}: ${String(refusal)}`,
        refusal instanceof HumanRefusal && refusal.axis === axis,
      );
    }
  }
  checks.assert("crab walk");
}

/** Sit, then crab walk with the given parameters. */
function perform(
  body: IAutoMovieMotionHumanBody,
  params: IAutoMovieMotionHumanCrabWalk.IParams,
): HumanPerformance {
  return new HumanPerformance({
    seed: "crab-walk",
    laws: Object.values(HUMAN_LEXICON).flat(),
    performers: [
      {
        subject: "s",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("s")
      .stand({ hold: 0.3, sway: 0 })
      .registered("crabWalk", params).node,
  });
}
