import type {
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCrouch,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanRange,
  HumanFoot,
  HumanRefusal,
  crouch,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../../internal/fixtures/humanFixtureBody";
import { motionActionContext } from "../../../internal/motionActionContext";
import { motionPlanReading as R } from "../../../internal/motionPlanReading";

/** Held knee flexion of a partial crouch, degrees (Hemmerich et al. 2006). */
const PARTIAL: readonly [number, number] = [40, 110];

/** Held knee flexion of a full crouch, at least, degrees (Escamilla 2001). */
const FULL: number = 120;

/** A flat heel's greatest height from lowering to return, metres. */
const FLAT: number = 0.02;

/** A raised heel's least height through the hold, metres. */
const RAISED: number = 0.03;

/** Samples through the held span. */
const HELD: number = 5;

/**
 * `crouch`'s plan lowers the hips onto bent knees and holds them, the heels
 * flat or raised, then returns standing.
 *
 * Scenarios:
 *
 * 1. The default and an explicit partial crouch hold 40 to 110 degrees of knee
 *    flexion, a full crouch at least 120.
 * 2. Flat heels stay within 2 cm of the floor throughout; raised heels, and a
 *    full crouch's, stand at least 3 cm up through the hold.
 * 3. Every crouch ends standing.
 * 4. A full crouch with flat heels is refused on depth, naming the hip's and
 *    the ankle's open range in degrees.
 */
export async function test_unit_motions_everyday_crouch_plan(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  for (const [row, params] of [
    ["default", { hold: 0.5 }],
    ["partial raised", { hold: 0.5, depth: "partial", heels: "up" }],
    ["full", { hold: 0.5, depth: "full" }],
  ] as const) {
    const plan: IAutoMovieMotionHumanActionPlan = crouch.plan(
      motionActionContext<IAutoMovieMotionHumanCrouch.IParams>(body, params),
    );
    const lowest: number = R.event(plan, "lowest")!;
    const ascend: number = R.event(plan, "ascend")!;
    const held: number[] = Array.from(
      { length: HELD },
      (_: unknown, i: number): number =>
        lowest + ((ascend - lowest) * i) / (HELD - 1),
    );
    const full: boolean = row === "full";
    const raised: boolean = row !== "default";
    for (const side of ["left", "right"] as const) {
      const knee: number =
        held.reduce(
          (sum: number, t: number): number =>
            sum + R.knee(R.pose(body, plan, t), side),
          0,
        ) / HELD;
      TestValidator.predicate(
        `${row}: held ${side} knee ${knee}`,
        full ? knee >= FULL : knee >= PARTIAL[0] && knee <= PARTIAL[1],
      );
      const heels: number[] = (raised
        ? held
        : Array.from(
            { length: 9 },
            (_: unknown, i: number): number => (plan.duration * i) / 8,
          )
      ).map(
        (t: number): number =>
          HumanFoot.sockets(body, R.bones(body, plan, t), side)[0]!.point.y,
      );
      TestValidator.predicate(
        `${row}: the ${side} heel`,
        raised
          ? Math.min(...heels) >= RAISED
          : Math.max(...heels) <= FLAT,
      );
    }
    TestValidator.equals(`${row}: ends standing`, plan.base?.kind, "standing");
  }

  // 4. Flat and full.
  let refused: unknown;
  try {
    crouch.plan(
      motionActionContext(body, { depth: "full", heels: "flat", hold: 0.5 }),
    );
  } catch (error: unknown) {
    refused = error;
  }
  const maximum: number =
    AutoMovieMotionHumanRange.limit("leftUpperLeg", "flexion")! +
    Math.min(28, AutoMovieMotionHumanRange.limit("leftFoot", "flexion")!);
  TestValidator.predicate(
    "a flat full crouch names its open range",
    refused instanceof HumanRefusal &&
      refused.axis === "depth" &&
      refused.feasible?.kind === "range" &&
      refused.feasible.unit === "degrees" &&
      refused.feasible.maximum === maximum,
  );
}
