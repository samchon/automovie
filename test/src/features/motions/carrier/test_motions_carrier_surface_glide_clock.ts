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
 * Check how the authored speed profile accumulates travel.
 *
 * Scenarios:
 *
 * 1. Acquire 2 m/s from 1 m/s over 0.8 s. At 0.4 s read distance 0.475 m and
 *    half acquisition, then continue at cruise speed.
 * 2. Brake over 1.4 s to a total 6.2 m. At mid-brake read 5.9375 m, and
 *    compare with the no-stop clock at 7.6 m.
 * 3. Refuse zero duration or speed before reading a surface.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The scenarios give the speed and travel during acquisition and braking and the zero-input refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Readbacks cover pre-entry, acquisition, cruise, braking, terminal clamping and admission.
 * @evidence contracts/development/testing.md#independent-expectations The fixture integrates the cubic speed change over each interval and accounts for acquisition and braking as deficits from full-speed travel.
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
