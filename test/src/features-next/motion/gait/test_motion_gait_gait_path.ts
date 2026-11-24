import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanWalkParams,
  IAutoMovieMotionHumanWalkSteps,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanGait,
  HumanChain,
  HumanPerformance,
  HumanVerdicts,
} from "@automovie/motions";
import { HumanFoot } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

/**
 * A straight, externally paced walk places the ankle ahead of the pelvis
 * by half a step in double support and by half of contact in flight,
 * accounting for where the foot rolls between heel and ball.
 *
 * Scenarios:
 * 1. Swing just below or at one period leaves the footprint half a step ahead.
 * 2. Swing just above one period centres the pressure path over midstance.
 * 3. Walking backwards and sideways preserves the fixed heading, while
 *    following a bend can face an independently specified point.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the contact transition and flat ankle observation, the fixed and point heading modes and their displayed endpoint and contact bounds.
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public foot schedule and separately measures the displayed pelvis and soles in the heading branches.
 * @evidence contracts/development/testing.md#independent-expectations Elapsed seconds give metres on the fixed path. Half contact locates midstance, corrected by the heel and ball midpoint. The pelvis faces perpendicular to the hip axis, toward world +Z or the vector from the pelvis to the authored target.
 * @evidence contracts/development/testing.md#distinguishing-cases Swing brackets one period and the nonzero foot offset distinguishes the equality branch. Reversing travel and crossing it at a right angle distinguish heading from velocity. A bent path distinguishes point-facing from fixed yaw.
 * @evidence contracts/development/testing.md#execution-ownership One body supplies three arithmetic step plans, one straight pace reference and one displayed walk per directional branch.
 */
export function test_motion_gait_gait_path(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const entry: IAutoMovieMotionHumanEntryState = new HumanPerformance({
    seed: "footfall",
    performers: [
      {
        subject: "walker",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("walker").stand({ hold: 1, sway: 0 }).node,
  }).segments("walker")[0]!.context.entry;
  const start: number =
    (entry.feet.left.ankle.z + entry.feet.right.ankle.z) / 2;
  const distance: number = 10;
  const offset: number =
    (HumanFoot.offset(body, "left", "heel").z +
      HumanFoot.offset(body, "left", "mtp").z) /
    2;
  for (const swing of [0.999, 1, 1.001]) {
    const plan: IAutoMovieMotionHumanWalkSteps.IPlan =
      AutoMovieMotionHumanGait.walkSteps.plan({
        body,
        entry,
        to: {
          x: (entry.feet.left.ankle.x + entry.feet.right.ankle.x) / 2,
          y: 0,
          z: start + distance,
        },
        speed: 1,
        longest: 1,
        swing,
        period: (): number => 1,
        travel: (seconds: number): number =>
          Math.max(0, Math.min(1, seconds / distance)),
      });
    const strikes = plan.events.filter((event) =>
      event.name.includes("HeelStrike"),
    );
    const landing: number = strikes.find(
      (event) => event.name === "leftHeelStrike3",
    )!.seconds;
    const step: number = distance / (strikes.length - 1);
    const contact: number = 2 - swing;
    const lead: number = swing <= 1 ? 0.5 : contact / 2 - offset / step;
    const ankle: number = plan.foot("left", landing + contact / 3).placement
      .ankle.z;
    TestValidator.predicate(
      `flat ankle after landing with swing ${swing}`,
      nclose(ankle, start + landing + lead, 1e-9),
    );
  }
  checkFacing(body);
}

/** Read the original fixed and point-facing branches without a stature sweep. */
function checkFacing(body: IAutoMovieMotionHumanBody): void {
  const point = (x: number, z: number): IAutoMovieVector3 => ({ x, y: 0, z });
  const play = (
    params: IAutoMovieMotionHumanWalkParams,
  ): IAutoMovieMotionHumanPerformance =>
    new HumanPerformance({
      seed: "facing",
      performers: [
        {
          subject: "a",
          body,
          at: point(0, 0),
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.subject("a").walk(params).node,
    });
  const fixed = { yaw: 0 };
  const centre: IAutoMovieVector3 = point(0, 1.5);
  const forward: IAutoMovieMotionHumanPerformance = play({ to: point(0, 2) });
  const back: IAutoMovieMotionHumanPerformance = play({
    to: point(0, -2),
    facing: fixed,
  });
  const side: IAutoMovieMotionHumanPerformance = play({
    to: point(1.2, 0),
    facing: fixed,
  });
  const arc: IAutoMovieMotionHumanPerformance = play({
    to: point(1.5, 1.5),
    via: [1, 2, 3].map((i: number): IAutoMovieVector3 => {
      const angle: number = (i * Math.PI) / 8;
      return point(1.5 * Math.sin(angle), 1.5 * (1 - Math.cos(angle)));
    }),
    facing: { toward: centre },
  });
  const ratio: number = back.duration / forward.duration;
  TestValidator.predicate(
    "backwards pace remains in the original ratio band",
    ratio >= 1.1 && ratio <= 1.4,
  );

  // Retain the original 15-degree allowance and the 100 mm endpoint bound.
  const cosine: number = Math.cos((15 * Math.PI) / 180);
  for (const [film, end, toward] of [
    [back, point(0, -2), undefined],
    [side, point(1.2, 0), undefined],
    [arc, point(1.5, 1.5), centre],
  ] as const) {
    const scene = film.segments("a")[0]!;
    const sample: number = (scene.entryTime + scene.end) / 2;
    const here = film.bones("a", sample);
    const pelvis: IAutoMovieVector3 = here.get("hips")!.worldPosition;
    const left: IAutoMovieVector3 = here.get("leftUpperLeg")!.worldPosition;
    const right: IAutoMovieVector3 = here.get("rightUpperLeg")!.worldPosition;
    const acrossX: number = left.x - right.x;
    const acrossZ: number = left.z - right.z;
    const wantedX: number = toward === undefined ? 0 : toward.x - pelvis.x;
    const wantedZ: number = toward === undefined ? 1 : toward.z - pelvis.z;
    const facing: number =
      (-acrossZ * wantedX + acrossX * wantedZ) /
      (Math.hypot(acrossX, acrossZ) * Math.hypot(wantedX, wantedZ));
    const arrival: IAutoMovieVector3 = film
      .bones("a", scene.end)
      .get("hips")!.worldPosition;
    TestValidator.predicate(
      "displayed hip axis faces the authored heading",
      facing >= cosine,
    );
    TestValidator.predicate(
      "hip arrives within 100 millimetres of the target",
      Math.hypot(arrival.x - end.x, arrival.z - end.z) <= 0.1,
    );
    TestValidator.equals(
      "ground contacts keep their original verdicts",
      HumanVerdicts.of(film).findings.filter(
        (f) => f.check === "slip" || f.check === "lift" || f.check === "floor",
      ),
      [],
    );
    if (film === side) {
      const leftFoot: IAutoMovieVector3 = here.get("leftFoot")!.worldPosition;
      const rightFoot: IAutoMovieVector3 = here.get("rightFoot")!.worldPosition;
      TestValidator.predicate(
        "the side step keeps the feet ordered across the pelvis",
        (leftFoot.x - rightFoot.x) * acrossX +
          (leftFoot.z - rightFoot.z) * acrossZ >
          0,
      );
    }
  }
}
