import type { IAutoMovieMotionClock, IAutoMovieMotionHumanFoot } from "@automovie/interface";
import {
  AthleticsSwing
} from "../../../../../packages/motions/src/sport/internal/AthleticsSwing";
import {
  motionManner
} from "../../../../../packages/motions/src/compose/internal/motionManner";
import {
  athleticsClock
} from "../../../../../packages/motions/src/sport/internal/athleticsClock";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { qclose } from "../../internal/qclose";
import { vclose } from "../../internal/vclose";

/** A foot turned a quarter about +X. */
const TIPPED: IAutoMovieMotionHumanFoot.IPlacement["rotation"] = {
  x: Math.SQRT1_2,
  y: 0,
  z: 0,
  w: Math.SQRT1_2,
};

/**
 * The athletics laws' own logic: the sprint start's timetable and a foot's
 * swing over an obstacle.
 *
 * Scenarios:
 *
 * 1. Held 1 s with a 0.4 s drive, the start sets after the 1.5 s crouch, fires the
 *    gun at 2.5 s, lifts the rear foot off its block at the drive's middle, 2.7
 *    s, and leaves the blocks at 2.9 s, the end; without a drive it ends 1 ms
 *    after the gun.
 * 2. A foot swung from the origin over (0, 0.4, 0.5) to (0, 0, 1) passes the top
 *    at half progress with its turn there, and stands on `to` at the end.
 */
export function test_motions_sport_athletics(): void {
  const driven: IAutoMovieMotionClock = athleticsClock(
    1,
    0.4,
    motionManner.NEUTRAL,
  );
  const held: IAutoMovieMotionClock = athleticsClock(
    1,
    undefined,
    motionManner.NEUTRAL,
  );
  TestValidator.predicate(
    "the sprint start",
    nclose(driven.at("set"), 1.5, 1e-12) &&
      nclose(driven.at("gun"), 2.5, 1e-12) &&
      nclose(driven.at("rearBlockOff"), 2.7, 1e-12) &&
      nclose(driven.at("blockExit"), 2.9, 1e-12) &&
      nclose(driven.duration, 2.9, 1e-12) &&
      nclose(held.duration - held.at("gun"), 0.001, 1e-12),
  );
  const swing: (progress: number) => IAutoMovieMotionHumanFoot.IPlacement =
    AthleticsSwing.prepare({
      from: {
        ankle: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 1 },
      },
      over: { ankle: { x: 0, y: 0.4, z: 0.5 }, rotation: TIPPED },
      to: { ankle: { x: 0, y: 0, z: 1 }, rotation: { x: 0, y: 0, z: 0, w: 1 } },
    });
  TestValidator.predicate(
    "over the top and down",
    vclose(swing(0.5).ankle, { x: 0, y: 0.4, z: 0.5 }, 1e-12) &&
      qclose(swing(0.5).rotation, TIPPED, 1e-12) &&
      vclose(swing(1).ankle, { x: 0, y: 0, z: 1 }, 1e-12),
  );
}
