import { AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanToesOnFloor
} from "../../../../../packages/motions/src/compose/internal/AutoMovieMotionHumanToesOnFloor";
import {
  HumanFoot
} from "../../../../../packages/motions/src/posture/internal/HumanFoot";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { nclose } from "../../internal/nclose";

/** Rounding of an arcsine and a smoothstep, degrees. */
const ROUNDING: number = 1e-9;

/**
 * `AutoMovieMotionHumanToesOnFloor.bend` bends a risen foot's toes back onto
 * the support: by the heel's lift in full once the ball is down, fading on a
 * smoothstep over `TOUCH` above the support, and at least as far as keeps the
 * toes' tip from passing under the support, the arcsine of the tip's drop below
 * the ball against the support's.
 *
 * The body is built whole (`humanFixtureBody`) for the left foot's sockets.
 *
 * Scenarios, the left foot pivoted about its ball:
 *
 * 1. Flat on the floor the toes stay straight.
 * 2. With the heel 20 degrees up and the ball on the floor, the toes bend back 20
 *    degrees.
 * 3. With the ball half `TOUCH` up, the bend is the larger of 20 × smoothstep(½)
 *    and the tip's bound.
 * 4. High above the floor a flat foot's toes stay straight.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names flat and risen feet, full heel counter-rotation, contact fade and the support-clearance lower bound.
 * @evidence contracts/development/testing.md#behavioral-verification Calls HumanToesOnFloor.bend with foot placements pivoted about the ball on the stored sole geometry and checks all four returned angles.
 * @evidence contracts/development/testing.md#independent-expectations With ball down the 20-degree heel rise needs 20 degrees of toe bend. At half the contact height the smoothstep supplies half that value, competing with the tip bound derived from the inverse sine of the two vertical offsets.
 */
export async function test_motions_compose_toes_on_floor(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const at = (
    height: number,
    pitch: number,
  ): IAutoMovieMotionHumanFoot.IPlacement =>
    HumanFoot.pivot(
      body,
      "left",
      "ball",
      { x: 0.1, y: height, z: 0.2 },
      0,
      pitch,
    );
  const bend = (foot: IAutoMovieMotionHumanFoot.IPlacement): number =>
    AutoMovieMotionHumanToesOnFloor.bend(body, "left", foot, 0);

  // 1. Flat.
  TestValidator.predicate(
    "flat toes straight",
    nclose(bend(at(0, 0)), 0, ROUNDING),
  );

  // 2. Risen on the ball.
  TestValidator.predicate(
    "the heel's lift",
    nclose(bend(at(0, -20)), 20, 1e-6),
  );

  // 3. Half the touch above.
  const half: number = AutoMovieMotionHumanToesOnFloor.TOUCH / 2;
  const foot: IAutoMovieMotionHumanFoot.IPlacement = at(half, -20);
  const ball: IAutoMovieVector3 = HumanFoot.point(body, "left", "ball", foot);
  const toe: IAutoMovieVector3 = HumanFoot.point(body, "left", "toe", foot);
  const length: number = AutoMovieEngineVector3.distance(ball, toe);
  const down = (drop: number): number =>
    (Math.asin(drop / length) * 180) / Math.PI;
  TestValidator.predicate(
    "the faded lift or the tip's bound",
    nclose(
      bend(foot),
      Math.max(20 * 0.5, down(ball.y - toe.y) - down(ball.y)),
      1e-6,
    ),
  );

  // 4. High.
  TestValidator.predicate(
    "high and flat, straight",
    bend(at(0.5, 0)) <= ROUNDING,
  );
}
