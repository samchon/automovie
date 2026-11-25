import type { IAutoMovieVector3 } from "@automovie/interface";
import { beatFlamesBeats } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { throwsError } from "../../../internal/throwsError";
import { vclose } from "../../../internal/vclose";

/**
 * The `beatFlames` law's own logic (`beatFlamesBeats`): the cloth's face comes
 * down `CLEAR` (2 cm) off the burning region along its outward normal and each
 * beat starts `RAISE` (0.3 m) above that, coming down at its middle.
 *
 * Scenarios:
 *
 * 1. On a region at (0, 0.2, 1) facing up, three beats come down to 0.22 m and rise
 *    to 0.52 m; the face starts high, is down at a sixth of the stroke (the first
 *    beat's middle) and high again at a third.
 * 2. With no count asked the law beats four times.
 * 3. A count rounding to none is refused.
 */
export function test_unit_motions_tasks_beat_flames(): void {
  const region: beatFlamesBeats.IRegion = {
    point: { x: 0, y: 0.2, z: 1 },
    normal: { x: 0, y: 1, z: 0 },
  };
  const beats: beatFlamesBeats.IBeats = beatFlamesBeats(3, region);
  const low: IAutoMovieVector3 = { x: 0, y: 0.22, z: 1 };
  const high: IAutoMovieVector3 = { x: 0, y: 0.52, z: 1 };
  TestValidator.predicate(
    "down at each beat's middle",
    vclose(beats.down, low, 1e-12) &&
      vclose(beats.up, high, 1e-12) &&
      vclose(beats.at(0), high, 1e-12) &&
      vclose(beats.at(1 / 6), low, 1e-12) &&
      vclose(beats.at(1 / 3), high, 1e-12),
  );
  TestValidator.predicate(
    "four by default, none refused",
    beatFlamesBeats(undefined, region).count === 4 &&
      throwsError(() => beatFlamesBeats(0.4, region)),
  );
}