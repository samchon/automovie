import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  stageDeflectRebound
} from "../../../../../packages/motions/src/throwing/internal/stageDeflectRebound";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../internal/throwsError";
import { vclose } from "../../internal/vclose";

/**
 * The `stageDeflect` law's own logic (`stageDeflectRebound`): a ball met head
 * on by a still palm comes back at `-e v`, its incoming velocity read from the
 * flight just before the touch.
 *
 * Scenarios:
 *
 * 1. A ball flying (3, 1, -4) m/s, touched at 0.5 s with restitution 0.6, leaves
 *    at (-1.8, -0.6, 2.4) m/s.
 * 2. A ball at rest at the touch is refused.
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
