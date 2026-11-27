import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
} from "@automovie/interface";
import {
  motionHumanFootSwing
} from "../../../../../packages/motions/src/compose/internal/motionHumanFootSwing";
import {
  HumanFoot
} from "../../../../../packages/motions/src/posture/internal/HumanFoot";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/** Rounding of a slerp and a short sole reading, metres. */
const ROUNDING: number = 1e-9;

/** The swing's clearance, metres. */
const CLEARANCE: number = 0.05;

/**
 * `motionHumanFootSwing` places a stepping foot through its swing: it
 * travels and turns on the minimum-jerk share of the swing's time, and its
 * sole's lowest point rises `clearance sin(πu)` above the line joining that
 * point's heights at the ends, the ankle raised further by however far the
 * foot's turn carries the sole below that line, so no sole point slides on the
 * support at lift-off or touch-down.
 *
 * The body is built whole (`humanFixtureBody`) for the left foot's sole.
 *
 * Scenarios, the left foot stepping 0.4 m ahead:
 *
 * 1. At the swing's two ends it is on its two placements.
 * 2. Flat and level, at mid-swing the ankle is midway and `clearance` up.
 * 3. Turning 30 degrees heel up as it lands, at every tenth of the swing the
 *    sole's lowest point is at least `clearance sin(πu)` above the line between
 *    the ends' lowest points.
 */
export async function test_motions_compose_foot_swing(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const from: IAutoMovieMotionHumanFoot.IPlacement = {
    ankle: { x: 0.1, y: 0.08, z: 0 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const to: IAutoMovieMotionHumanFoot.IPlacement = {
    ankle: { x: 0.1, y: 0.08, z: 0.4 },
    rotation: { x: 0, y: 0, z: 0, w: 1 },
  };
  const at = (
    end: IAutoMovieMotionHumanFoot.IPlacement,
    u: number,
  ): IAutoMovieMotionHumanFoot.IPlacement =>
    motionHumanFootSwing(body, "left", from, end, CLEARANCE, u);

  // 1. The ends.
  TestValidator.predicate(
    "on its placements at the ends",
    vclose(at(to, 0).ankle, from.ankle, ROUNDING) &&
      vclose(at(to, 1).ankle, to.ankle, ROUNDING),
  );

  // 2. Mid-swing, flat.
  TestValidator.predicate(
    "midway and the clearance up",
    vclose(
      at(to, 0.5).ankle,
      { x: 0.1, y: 0.08 + CLEARANCE, z: 0.2 },
      ROUNDING,
    ),
  );

  // 3. A turning foot's sole.
  const tipped: IAutoMovieMotionHumanFoot.IPlacement = {
    ...to,
    rotation: AutoMovieEngineQuaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -30),
  };
  const low0: number = HumanFoot.lowest(body, "left", from);
  const low1: number = HumanFoot.lowest(body, "left", tipped);
  TestValidator.predicate(
    "the sole clears its line by the half sine",
    Array.from({ length: 11 }, (_: unknown, k: number): number => k / 10).every(
      (u: number): boolean => {
        const placed: IAutoMovieMotionHumanFoot.IPlacement = at(tipped, u);
        const s: number = u * u * u * (10 - 15 * u + 6 * u * u);
        return (
          HumanFoot.lowest(body, "left", placed) >=
          low0 +
            (low1 - low0) * s +
            CLEARANCE * Math.sin(Math.PI * u) -
            ROUNDING
        );
      },
    ) && nclose(AutoMovieEngineVector3.distance(at(tipped, 1).ankle, to.ankle), 0, ROUNDING),
  );
}
