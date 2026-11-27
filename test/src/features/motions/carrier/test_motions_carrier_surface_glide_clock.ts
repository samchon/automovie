import {
  HumanSurfaceGlide
} from "../../../../../packages/motions/src/carrier/internal/HumanSurfaceGlide";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { throwsError } from "../../internal/throwsError";

/**
 * Each distance has three bounded speed intervals below 8 m. Sixty-four
 * binary64 rounding units at 8 m enclose their integration and addition.
 */
const ROUNDING: number = 64 * Number.EPSILON * 8;

/**
 * Integrate the authored glide speed through acquisition, cruise and braking.
 *
 * Scenarios:
 *
 * 1. From 1 m/s to 2 m/s in 0.8 s, the acquisition's half-span advances 0.4 m plus
 *    0.075 m of accelerating travel. After acquisition, the cruise has the full
 *    speed and an initial deficit of 0.4 m.
 * 2. A 1.4 s brake from 2 m/s subtracts 1.4 m of total travel, with 0.2625 m
 *    already lost halfway through the brake. Without a stop it subtracts none.
 * 3. Duration and speed must each be positive before reading a surface.
 */
export function test_motions_carrier_surface_glide_clock(): void {
  const stopped: HumanSurfaceGlide.ICourse = HumanSurfaceGlide.clock({
    duration: 4,
    speed: 2,
    stop: true,
  }).prepare(1);
  const pass: HumanSurfaceGlide.ICourse = HumanSurfaceGlide.clock({
    duration: 4,
    speed: 2,
  }).prepare(1);
  TestValidator.predicate(
    "the cubic acquisition reaches the exact area of the chosen speed ramp",
    nclose(stopped.sample(0.4).distance, 0.475, ROUNDING) &&
      nclose(stopped.sample(0.4).acquired, 0.5, ROUNDING) &&
      nclose(stopped.sample(2).distance, 3.6, ROUNDING) &&
      nclose(stopped.sample(-1).distance, 0, ROUNDING),
  );
  TestValidator.predicate(
    "braking integrates only from its own origin and ends at the same travel",
    nclose(stopped.sample(3.3).braked, 0.5, ROUNDING) &&
      nclose(stopped.sample(3.3).distance, 5.9375, ROUNDING) &&
      nclose(stopped.sample(5).distance, 6.2, ROUNDING) &&
      nclose(stopped.travel, 6.2, ROUNDING) &&
      nclose(pass.sample(4).distance, 7.6, ROUNDING) &&
      nclose(pass.sample(4).braked, 0, ROUNDING),
  );
  TestValidator.predicate(
    "a zero duration or speed does not stage a glide",
    throwsError(
      (): unknown => HumanSurfaceGlide.clock({ duration: 0, speed: 2 }),
      "duration",
    ) &&
      throwsError(
        (): unknown => HumanSurfaceGlide.clock({ duration: 2, speed: 0 }),
        "speed",
      ),
  );
}
