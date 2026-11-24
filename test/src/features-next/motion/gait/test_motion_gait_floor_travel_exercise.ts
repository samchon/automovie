import { AutoMovieComposition, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanSegment,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanWorkout,
  HumanChain,
  HumanPerformance,
} from "@automovie/motions";
import { HumanFoot, HumanSport } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { assertTakeClean } from "../../../features/internal/assertTakeClean";
import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/** The line of dance travelled by the figure, world metres. */
const TRAVEL: IAutoMovieVector3 = { x: 0.6, y: 0, z: 1.2 };

/**
 * A led waltz box travelling down the floor, and a breaking freeze (#3879).
 *
 * Scenarios:
 * 1. A couple dancing the waltz box about a shared pivot with a travel
 *    both arrive moved by the travel within 100 mm, and stay their
 *    starting distance apart within 50 mm throughout.
 * 2. The beats fall at the tempo.
 * 3. The baby freeze bears on both hands while both feet are off the floor
 *    by at least 30 mm through its hold, and returns to the feet.
 * 4. Both takes pass the shipped verdicts.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the travel, the pair's distance, the beat, the freeze's support and the verdicts.
 * @evidence contracts/development/testing.md#behavioral-verification Plans the box-step and baby-freeze rows through the public chain and reads displayed hips and feet.
 * @evidence contracts/development/testing.md#independent-expectations The travel is authored; the beat is the tempo's; the freeze's support is the hands alone.
 * @evidence contracts/development/testing.md#distinguishing-cases A leader and a reversed follower on two bodies, and a hand-supported freeze.
 * @evidence contracts/development/testing.md#execution-ownership In-memory performances on the shared Human fixture.
 */
export function test_motion_gait_floor_travel_exercise(): void {
  // 1 and 2. The travelling waltz box.
  const pivot: IAutoMovieVector3 = { x: 0, y: 0, z: 0.25 };
  const couple: HumanPerformance = new HumanPerformance({
    seed: "floor-travel",
    laws: [HumanSport.boxStep],
    performers: [
      {
        subject: "lead",
        body: motionHumanBody("m-average"),
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
      {
        subject: "follow",
        body: motionHumanBody("f-small"),
        at: { x: 0, y: 0, z: 0.5 },
        yaw: 180,
        proficiency: { level: "trained" },
      },
    ],
    composition: AutoMovieComposition.parallel(
      HumanChain.subject("lead").registered("boxStep", {
        count: 6,
        bpm: 90,
        waltz: { pivot, turn: 0, travel: TRAVEL },
      }).node,
      HumanChain.subject("follow").registered("boxStep", {
        count: 6,
        bpm: 90,
        waltz: { pivot, turn: 0, travel: TRAVEL, reverse: true },
      }).node,
    ),
  });
  const lead: IAutoMovieMotionHumanSegment = couple.segments("lead")[0]!;
  const gap0: number = Vector3.distance(
    hips(couple, "lead", lead.start),
    hips(couple, "follow", lead.start),
  );
  let drift: number = 0;
  for (let t: number = lead.start; t <= lead.end; t += 0.05)
    drift = Math.max(
      drift,
      Math.abs(
        Vector3.distance(hips(couple, "lead", t), hips(couple, "follow", t)) -
          gap0,
      ),
    );
  const moved: (subject: string) => number = (subject: string): number =>
    Vector3.distance(
      Vector3.subtract(
        hips(couple, subject, lead.end),
        hips(couple, subject, lead.start),
      ),
      TRAVEL,
    );
  TestValidator.predicate(
    `the couple travels down the floor together (${(moved("lead") * 1000).toFixed(0)} and ${(moved("follow") * 1000).toFixed(0)} mm off, ${(drift * 1000).toFixed(0)} mm apart)`,
    moved("lead") <= 0.1 && moved("follow") <= 0.1 && drift <= 0.05,
  );
  const period: number = 60 / 90;
  const beats: number[] = lead.plan.events
    .filter((e: IAutoMovieMotionEvent): boolean => /^beat\d+$/.test(e.name))
    .map((e: IAutoMovieMotionEvent): number => e.share * lead.plan.duration);
  TestValidator.predicate(
    "the beats fall at the tempo",
    beats.length === 6 &&
      beats.every(
        (b: number, k: number): boolean =>
          k === 0 || Math.abs(b - beats[k - 1]! - period) <= 1e-6,
      ),
  );
  assertTakeClean("travelling waltz box", couple);

  // 3. The baby freeze.
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const freeze: HumanPerformance = new HumanPerformance({
    seed: "baby-freeze",
    laws: [AutoMovieMotionHumanWorkout.HumanSportWorkout.babyFreeze],
    performers: [
      {
        subject: "b",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("b")
      .stand({ hold: 0.3, sway: 0 })
      .registered("babyFreeze", {}).node,
  });
  const held: IAutoMovieMotionHumanSegment = freeze.segments("b")[1]!;
  const hands: readonly IAutoMovieMotionHumanContactWindow[] =
    held.plan.contacts.filter(
      (c: IAutoMovieMotionHumanContactWindow): boolean =>
        c.part === "leftHand" || c.part === "rightHand",
    );
  const hold: IAutoMovieMotionHumanContactWindow = hands[0]!;
  let lowest: number = Infinity;
  for (
    let s: number = hold.from + 0.3 * (hold.to - hold.from);
    s <= hold.to - 0.3 * (hold.to - hold.from);
    s += 0.02
  ) {
    const t: number = held.start + s * held.plan.duration;
    for (const side of ["left", "right"] as const)
      lowest = Math.min(lowest, toe(freeze, body, t, side));
  }
  TestValidator.predicate(
    `the baby freeze bears on both hands with the feet up (${(lowest * 1000).toFixed(0)} mm)`,
    hands.length >= 2 && lowest >= 0.03,
  );
  assertTakeClean("baby freeze", freeze);
}

/** The displayed hips of a subject. */
function hips(
  film: HumanPerformance,
  subject: string,
  time: number,
): IAutoMovieVector3 {
  return film.bones(subject, time).get("hips")!.worldPosition;
}

/** The lowest of a displayed foot's sole points at a film second. */
function toe(
  film: HumanPerformance,
  body: IAutoMovieMotionHumanBody,
  time: number,
  side: AutoMovieHumanSide,
): number {
  const foot: IAutoMovieResolvedBone = film
    .bones("b", time)
    .get(`${side}Foot`)!;
  return Math.min(
    ...(["heel", "ball", "toe"] as const).map(
      (p: IAutoMovieMotionHumanFoot.Socket): number =>
        HumanFoot.point(body, side, p, {
          ankle: foot.worldPosition,
          rotation: foot.worldRotation,
        }).y,
    ),
  );
}
