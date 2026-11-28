import { AutoMovieEngineDefaultHumanoidRom } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  FootStrikeTilt
} from "../../../../../packages/motions/src/striking/internal/FootStrikeTilt";
import {
  KickForm
} from "../../../../../packages/motions/src/striking/internal/KickForm";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { vclose } from "../../internal/vclose";

/**
 * A kicking leg against the hip's range (`FootStrikeTilt.excess`, `knee`): a
 * straight leg level ahead rises 90 degrees against the share of the hip's
 * flexion, as the elliptical reach reads straight ahead; a leg straight down
 * has no level direction; a knee hint twisted past the share of the hip's twist
 * is turned back to it about the leg.
 *
 * Scenarios:
 *
 * 1. A right leg reaching 0.9 m level ahead with 0.45 m segments exceeds by `90
 *
 *    - 0.9 F`, F the hip's greatest flexion, along +Z; one reaching straight down
 *         has none.
 * 2. A hip over the ankle with the knee hinted ahead keeps the hint; hinted to the
 *    side, a quarter twist, it is turned back to the twist limit `L`: at `(0.3
 *    sin L, 0.5, 0.3 cos L)`, or kept when the quarter lies within it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes a pose's hip elevation limit and knee hint twist bound for straight ahead and vertical goals.
 * @evidence contracts/development/testing.md#behavioral-verification Queries the posed leg excess and clamps a side hint against the catalog joint range, with an aligned hint as a control.
 * @evidence contracts/development/testing.md#independent-expectations The horizontal straight leg elevates 90 degrees, so excess is 90° minus 0.9 times the declared range. Turning the hint to limit L yields the stated sine/cosine coordinates.
 */
export function test_motions_striking_foot_strike_tilt(): void {
  const hip: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const flexion: number = AutoMovieEngineDefaultHumanoidRom.rightUpperLeg!.flexion!.max;
  const ahead = FootStrikeTilt.excess(
    "right",
    0,
    hip,
    { x: 0, y: 1, z: 0.9 },
    0.45,
    0.45,
  );
  TestValidator.predicate(
    "level ahead",
    KickForm.RANGE_SHARE === 0.9 &&
      ahead !== undefined &&
      nclose(ahead.degrees, 90 - 0.9 * flexion, 1e-9) &&
      nclose(ahead.elevation, 90, 1e-9) &&
      vclose(ahead.across, { x: 0, y: 0, z: 1 }, 1e-12) &&
      FootStrikeTilt.excess(
        "right",
        0,
        hip,
        { x: 0, y: 0.1, z: 0 },
        0.45,
        0.45,
      ) === undefined,
  );
  const still = { x: 0, y: 0, z: 0, w: 1 };
  const ankle: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const twist = AutoMovieEngineDefaultHumanoidRom.rightUpperLeg!.twist!;
  const limit: number =
    KickForm.RANGE_SHARE * Math.min(Math.abs(twist.min), Math.abs(twist.max));
  const l: number = (limit * Math.PI) / 180;
  const aside: IAutoMovieVector3 = { x: 0.3, y: 0.5, z: 0 };
  TestValidator.predicate(
    "the knee's twist",
    vclose(
      FootStrikeTilt.knee("right", still, hip, ankle, { x: 0, y: 0.5, z: 0.3 }),
      { x: 0, y: 0.5, z: 0.3 },
      1e-12,
    ) &&
      vclose(
        FootStrikeTilt.knee("right", still, hip, ankle, aside),
        limit >= 90
          ? aside
          : { x: 0.3 * Math.sin(l), y: 0.5, z: 0.3 * Math.cos(l) },
        1e-9,
      ),
  );
}
