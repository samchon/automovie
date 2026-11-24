import { Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanSegment,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTouch,
  HumanChain,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanColliders, HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";
import { nclose } from "../../../features/internal/nclose";

const { hug } = AutoMovieMotionHumanTouch;

/**
 * Two closely staged performers give one another a criss-cross hug after a
 * standing beat. The shoulders and waist receive a hand in each direction,
 * as in Dueren et al. (2021, Fig. 2).
 *
 * Scenarios:
 * 1. The performances start together and share at least half the one-second
 *    dwell tested by Dueren et al.
 * 2. All four palms touch their partners' backs to within 10 mm at three
 *    instants in the shared dwell, with the forearm axes outside the partners.
 * 3. Each hand is clear of its contact point before and after the embrace.
 * 4. The nearer, opposite-flank entry refuses an obstructed reach.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the staging, hold, four contacts, clearance, refusal and source of the arm placement.
 * @evidence contracts/development/testing.md#behavioral-verification Reads posed palms, back surfaces and body colliders. Fingertip-only contact cannot satisfy the palm check.
 * @evidence contracts/development/testing.md#independent-expectations Dueren et al. (https://doi.org/10.1016/j.actpsy.2021.103441) supply the bilateral arm layout and one-second hold. The touch verification contract supplies the 10 mm tolerance. A forearm axis inside the partner means more than skin contact. The samples bound the selected instants.
 * @evidence contracts/development/testing.md#distinguishing-cases Checks both hands within and outside contact. The nearer stage puts the back targets behind an obstructing chest; the mirrored and deeper stage admits the same bilateral touch.
 * @evidence contracts/development/testing.md#execution-ownership The feature runner discovers this in-memory integration test. It builds an accepted performance and checks an obstructed placement on the same average polygon body.
 */
export function test_motion_touch_hug(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const hold: number = 1;
  const entry: number = 0.3;
  /** Stage the same two-performer action at the requested partner position. */
  const perform = (at: IAutoMovieVector3): HumanPerformance =>
    new HumanPerformance({
      seed: "hug",
      performers: [
        {
          subject: "a",
          body,
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          proficiency: { level: "trained" },
        },
        {
          subject: "b",
          body,
          at,
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      composition: HumanChain.mutual(
        hug,
        {
          one: HumanChain.subject("a").stand({ hold: entry }),
          other: HumanChain.subject("b").stand({ hold: entry }),
        },
        { hold },
      ).node,
    });

  // Stagger the partners toward their higher arms and leave room to
  // reach the back around the partner's chest.
  const performance: HumanPerformance = perform({ x: -0.1, y: 0, z: 0.32 });
  const a: IAutoMovieMotionHumanSegment = performance.segments("a")[1]!;
  const b: IAutoMovieMotionHumanSegment = performance.segments("b")[1]!;

  /** An action event on the film clock, in seconds. */
  const event = (
    segment: IAutoMovieMotionHumanSegment,
    name: "strokeEnd" | "relax",
  ): number =>
    segment.start +
    segment.plan.duration *
      segment.plan.events.find((item): boolean => item.name === name)!.share;

  const from: number = Math.max(event(a, "strokeEnd"), event(b, "strokeEnd"));
  const to: number = Math.min(event(a, "relax"), event(b, "relax"));
  TestValidator.predicate("a common dwell", to - from >= hold / 2);
  const contactTimes: number[] = [0.25, 0.5, 0.75].map(
    (share: number): number => from + share * (to - from),
  );

  for (const [subject, partner, segment] of [
    ["a", "b", a],
    ["b", "a", b],
  ] as const) {
    TestValidator.predicate(
      `${subject} starts together`,
      nclose(segment.start, entry),
    );
    TestValidator.predicate(
      `${subject} holds at least one second`,
      event(segment, "relax") - event(segment, "strokeEnd") >= hold - 0.001,
    );
    const end: number = segment.start + segment.plan.duration;
    for (const time of [entry, ...contactTimes, end]) {
      const arm = performance.bones(subject, time);
      const other = performance.bones(partner, time);
      for (const [side, region] of [
        ["right", "upperBack"],
        ["left", "lowerBack"],
      ] as const) {
        const surface = body.surfaces.regions[region];
        const goal = resolveAutoMovieHumanoidSurfaces.place(
          surface,
          other.get(surface.bone)!,
        );
        const palm: ReturnType<typeof HumanHand.frame> = HumanHand.frame(
          body,
          arm,
          side,
          "palm",
          "flat",
        );
        const gap: number = Vector3.length(
          Vector3.subtract(palm.point, goal.point),
        );
        const hand = new Map(
          [...arm].filter(
            ([bone]): boolean =>
              bone.startsWith(side) &&
              /Hand|Thumb|Index|Middle|Ring|Little/.test(bone),
          ),
        );
        const clearance: number = HumanColliders.distance(
          body,
          hand,
          goal.point,
        ).distance;
        const embracing: boolean = time !== entry && time !== end;
        TestValidator.predicate(
          `${subject}'s ${side} hand at ${time} s (${gap} m)`,
          embracing
            ? nclose(gap, 0, 0.01) &&
                clearance >= -0.01 &&
                Vector3.dot(palm.normal, goal.normal) < 0
            : clearance > 0.01,
        );
        if (embracing) {
          const elbow: IAutoMovieVector3 = arm.get(
            `${side}LowerArm`,
          )!.worldPosition;
          const wrist: IAutoMovieVector3 = arm.get(
            `${side}Hand`,
          )!.worldPosition;
          const forearmGap: number = HumanColliders.distanceToSegment(
            body,
            other,
            elbow,
            wrist,
          ).distance;
          TestValidator.predicate(
            `${subject}'s ${side} forearm axis clears ${partner} at ${time} s (${forearmGap} m)`,
            forearmGap >= 0,
          );
        }
      }
    }
  }

  let obstructed: unknown;
  try {
    perform({ x: 0.1, y: 0, z: 0.24 });
  } catch (error) {
    obstructed = error;
  }
  TestValidator.predicate(
    "the nearer stage refuses the obstructed two-arm reach",
    obstructed instanceof HumanRefusal &&
      obstructed.kind === "reach" &&
      obstructed.axis === "region",
  );
}
