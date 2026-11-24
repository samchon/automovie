import type {
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieResolvedBone,
} from "@automovie/interface";
import { HumanChain, HumanPerformance } from "@automovie/motions";
import {
  AutoMovieMotionHumanAuditStatics,
  HumanContactWindow,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../../features/internal/motionHumanBody";

/** One trunk-part case: the part, the region it bears through and whether the still body balances over it. */
interface ICase {
  /** The bearing part. */
  part: "head" | "chest";

  /** The region named, or the part's default when absent. */
  region?: AutoMovieHumanoidRegion;

  /** Whether the centre of mass lies within the statics bound of the region's point. */
  balanced: boolean;
}

/**
 * The head and the chest as contact parts (#4012).
 *
 * Scenarios, on a standing average man whose whole weight is declared on
 * one trunk-part window:
 * 1. The parts and their default regions are in the contact tables: the
 *    back of the head and the breastbone.
 * 2. The statics audit reads a head or chest window at its region's point:
 *    the crown, straight over the centre of mass, holds the body; the back
 *    of the head (the head's default) and the breastbone, a hand's depth
 *    behind and before it, do not.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the tables and the cases.
 * @evidence contracts/development/testing.md#behavioral-verification Feeds a still body's displayed bones with declared windows to the statics audit; a part missing from the tables or read at another point fails.
 * @evidence contracts/development/testing.md#independent-expectations The crown lies over a standing body's centre of mass and the breastbone and the back of the head lie a chest's half depth off it, beyond the audit's 2 % of stature.
 * @evidence contracts/development/testing.md#distinguishing-cases Both parts, a named region and each default.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory performance supplies the bones; the audit runs on them directly.
 */
export function test_motion_contact_window_trunk_parts(): void {
  TestValidator.predicate(
    "the head and the chest are contact parts with their default regions",
    HumanContactWindow.PARTS.includes("head") &&
      HumanContactWindow.PARTS.includes("chest") &&
      HumanContactWindow.REGIONS.head === "headBack" &&
      HumanContactWindow.REGIONS.chest === "sternum",
  );
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const film: HumanPerformance = new HumanPerformance({
    seed: "trunk-parts",
    performers: [
      {
        subject: "a",
        body,
        at: { x: 0, y: 0, z: 0 },
        yaw: 0,
        proficiency: { level: "trained" },
      },
    ],
    composition: HumanChain.subject("a").stand({ hold: 1, sway: 0 }).node,
  });
  const bound: number =
    AutoMovieMotionHumanAuditStatics.SHARE * body.measure.stature;
  const cases: readonly ICase[] = [
    { part: "head", region: "crown", balanced: true },
    { part: "head", balanced: false },
    { part: "chest", balanced: false },
  ];
  for (const c of cases) {
    const window: IAutoMovieMotionHumanContactWindow = {
      part: c.part,
      kind: "bear",
      from: 0,
      to: 1,
      load: 1,
      support: { kind: "person", subject: "b", region: "shoulderLeft" },
      ...(c.region === undefined ? {} : { region: c.region }),
    };
    const motion: IAutoMovieMotionHumanAuditMotion = {
      duration: 1,
      bones: (
        subject: string,
        seconds: number,
      ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
        film.bones(subject, Math.min(seconds, 0.5)),
      segments: (): readonly IAutoMovieMotionHumanAuditMotion.ISpan[] => [
        {
          name: "rest",
          start: 0,
          entryTime: 0,
          end: 1,
          plan: { duration: 1, contacts: [window] },
        },
      ],
    };
    const value: number = AutoMovieMotionHumanAuditStatics.measure(
      motion,
      "a",
      body,
    ).value;
    TestValidator.predicate(
      `a ${c.part} window on ${c.region ?? "its default region"} ${c.balanced ? "holds" : "does not hold"} the still body (${(value * 1000).toFixed(0)} mm)`,
      c.balanced ? value <= bound : value > bound,
    );
  }
}
