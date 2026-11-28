import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  stageDeflectRebound
} from "../../../../../packages/motions/src/throwing/internal/stageDeflectRebound";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/**
 * Check a rebound computed from an incoming flight at touch.
 *
 * Scenarios:
 *
 * 1. At 0.5 s, reverse an incoming (3, 1, -4) m/s velocity and scale it by
 *    restitution 0.6.
 * 2. Refuse a ball at rest at touch.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases give the contact instant, restitution, vectors and rejected condition.
 * @evidence contracts/development/testing.md#behavioral-verification The rebound operation reads the fixture flight near touch and exercises admission without staging an entire action.
 * @evidence contracts/development/testing.md#independent-expectations Multiplying the authored incoming vector by -0.6 gives the expected outgoing velocity.
 */
export function test_motions_throwing_stage_deflect(): void {
  const flying = (t: number): IAutoMovieVector3 => ({
    x: 3 * t,
    y: 1 + t,
    z: -4 * t,
  });
  TestValidator.predicate(
    "the head-on rebound",
    vclose(
      stageDeflectRebound(flying, 0.5, 0.6),
      { x: -1.8, y: -0.6, z: 2.4 },
      1e-9,
    ) &&
      throwsError(() =>
        stageDeflectRebound(
          (): IAutoMovieVector3 => ({ x: 0, y: 1, z: 0 }),
          0.5,
          0.6,
        ),
      ),
  );
}
