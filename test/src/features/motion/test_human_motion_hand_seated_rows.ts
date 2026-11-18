import { resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanSeated,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouchEffector,
  HumanChain,
  HumanEmblem,
  HumanPerformance,
  seated,
  touch,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The upper-body rows are performed seated as they are standing: a person
 * who has sat down puts a hand on the heart, hushes and drinks without
 * leaving the seat (#3361's composition matrix, the seated base).
 *
 * The small woman's hand-on-heart and drink and the average man's hush
 * each begin on the original seat at their own popliteal height:
 * 1. `handOnHeart` (a row of `touch`): at the middle of its hold the right
 *    palm lies within 15 mm of the left chest region (#3345).
 * 2. `hush` (a row of `handToFace`): the forefinger's middle joint lies
 *    within 20 mm of the mouth region (provisional, as standing).
 * 3. `handToFace` `drink` with the implied cup: the plan keeps the task's
 *    `atMouth` event.
 * 4. In each, the pelvis stays within 10 mm of where the base left it, at
 *    the middle of the hold (the campaign's bound for a supported body,
 *    #3358).
 * 5. The seated drink runs through the drinking task's phases in order
 *    (Alt Murphy et al. 2006, with the glass already in the hand): the
 *    forward transport to `atMouth`, the drinking to `relax` and the back
 *    transport to the end, each between 0.2 and 3 s (provisional band: the
 *    paper's phase durations are not read yet; the order is its own).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds the performances through the public chain and reads displayed joints and regions; a row that stands the body up, misses its region seated or loses its event fails.
 * @evidence contracts/development/testing.md#independent-expectations The bounds are acceptance lines of #3345 and #3358 or marked provisional; the seat is the body's own popliteal height.
 * @evidence contracts/development/testing.md#distinguishing-cases Three distinct seated goals exercise palm contact, digit contact and a transported glass. The same small rig exercises palm contact on its knees separately.
 * @evidence contracts/development/testing.md#execution-ownership Prepares two rigs and builds one short performance per goal type.
 * @evidence contracts/development/common.md#meaningful-documentation States the rule and the 5 scenarios with their bounds.
 */
export function test_human_motion_hand_seated_rows(): void {
  const laws: IAutoMovieMotionHumanActionLaw<never>[] = [
    HumanEmblem.handOnHeart,
    HumanEmblem.hush,
  ];
  const complaints: string[] = [];
  const gap = (p: IAutoMovieVector3, q: IAutoMovieVector3): number =>
    Math.hypot(p.x - q.x, p.y - q.y, p.z - q.z);
  for (const [label, name, row] of [
    [
      "handOnHeart",
      "f-small",
      (c: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
        c.registered("handOnHeart", {}),
    ],
    [
      "hush",
      "m-average",
      (c: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
        c.registered("hush", {}),
    ],
    [
      "drink",
      "f-small",
      (c: IAutoMovieMotionHumanChain): IAutoMovieMotionHumanChain =>
        c.handToFace({ task: "drink" }),
    ],
  ] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const seat: IAutoMovieMotionHumanSeated.ISeat = {
      at: {
        x: 0,
        y: seated.popliteal(body),
        z: body.rest.get("leftFoot")!.z - 0.1,
      },
      yaw: 0,
      depth: 0.45,
    };
    try {
      const performance: IAutoMovieMotionHumanPerformance =
        new HumanPerformance({
          seed: "seated",
          laws,
          performers: [
            {
              subject: "a",
              body,
              at: { x: 0, y: 0, z: 0 },
              yaw: 0,
              proficiency: { level: "trained" },
            },
          ],
          composition: row(HumanChain.subject("a").sit({ seat })).node,
        });
      const settled: IAutoMovieMotionHumanSegment =
        performance.segments("a")[0]!;
      const placed: IAutoMovieMotionHumanSegment =
        performance.segments("a")[1]!;
      const instant = (event: string): number =>
        placed.start +
        (placed.plan.events.find((e): boolean => e.name === event)?.share ??
          NaN) *
          placed.plan.duration;
      const held: number = (instant("strokeEnd") + instant("relax")) / 2;
      const bones: ReturnType<typeof performance.bones> = performance.bones(
        "a",
        held,
      );

      // 4. Still seated.
      const moved: number = gap(
        bones.get("hips")!.worldPosition,
        performance.bones("a", settled.end).get("hips")!.worldPosition,
      );
      if (!(moved <= 0.01))
        complaints.push(
          `${name}: ${label} after sitting: the pelvis is ${(moved * 1000).toFixed(0)} mm from where the base left it, within 10 mm expected`,
        );
      if (label === "handOnHeart") {
        const chest = body.surfaces.regions.chestLeft;
        const off: number = gap(
          AutoMovieMotionHumanTouchEffector.point(
            body,
            bones,
            "right",
            touch.EFFECTORS.palm,
          ),
          resolveAutoMovieHumanoidSurfaces.place(chest, bones.get(chest.bone)!)
            .point,
        );
        if (!(off <= 0.015))
          complaints.push(
            `${name}: handOnHeart seated: the palm is ${(off * 1000).toFixed(0)} mm from the left chest, within 15 mm expected`,
          );
      } else if (label === "hush") {
        const mouth = body.surfaces.regions.mouth;
        const off: number = gap(
          bones.get("rightIndexIntermediate")!.worldPosition,
          resolveAutoMovieHumanoidSurfaces.place(mouth, bones.get(mouth.bone)!)
            .point,
        );
        if (!(off <= 0.02))
          complaints.push(
            `${name}: hush seated: the forefinger's middle joint is ${(off * 1000).toFixed(0)} mm from the mouth, within 20 mm expected`,
          );
      } else if (!Number.isFinite(instant("atMouth")))
        complaints.push(`${name}: drink seated: the plan has no atMouth`);
      else {
        // 5. The drinking task's phases, in order and of a hand's length.
        const phases: readonly (readonly [string, number])[] = [
          ["forward transport", instant("atMouth") - placed.start],
          ["drinking", instant("relax") - instant("atMouth")],
          ["back transport", placed.end - instant("relax")],
        ];
        for (const [phase, seconds] of phases)
          if (!(seconds >= 0.2 && seconds <= 3))
            complaints.push(
              `${name}: drink seated: the ${phase} lasts ${seconds.toFixed(2)} s, between 0.2 and 3 s expected`,
            );
      }
    } catch (error) {
      complaints.push(
        `${name}: ${label} seated: expected to plan, got ${(error as Error).message}`,
      );
    }
  }
  TestValidator.equals("upper-body rows on a seated base", complaints, []);
}
