import type { IAutoMovieMotionHumanFoot } from "@automovie/interface";
import { AthleticsSwing } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { qclose } from "../../../internal/qclose";
import { vclose } from "../../../internal/vclose";

/**
 * `AthleticsSwing.prepare` swings a foot through a quadratic Bézier whose
 * control point makes it pass `over` at its middle, `2 over - (from + to) / 2`,
 * on a minimum-jerk share of the progress clamped to [0, 1]; the foot turns
 * from `from` to `over` over the first half and on to `to` over the second.
 *
 * The foot swings from the origin over (0, 0.4, 0.5) to (0, 0, 1), turned a
 * quarter about +X over the top.
 *
 * Scenarios:
 *
 * 1. At the start it stands on `from`; at the end, and past it, on `to`.
 * 2. At half progress (share one half) it passes `over` with `over`'s turn.
 */
export function test_unit_motions_sport_athletics_swing_prepare(): void {
  const level: IAutoMovieMotionHumanFoot.IPlacement["rotation"] = {
    x: 0,
    y: 0,
    z: 0,
    w: 1,
  };
  const tipped: IAutoMovieMotionHumanFoot.IPlacement["rotation"] = {
    x: Math.SQRT1_2,
    y: 0,
    z: 0,
    w: Math.SQRT1_2,
  };
  const swing: (progress: number) => IAutoMovieMotionHumanFoot.IPlacement =
    AthleticsSwing.prepare({
      from: { ankle: { x: 0, y: 0, z: 0 }, rotation: level },
      over: { ankle: { x: 0, y: 0.4, z: 0.5 }, rotation: tipped },
      to: { ankle: { x: 0, y: 0, z: 1 }, rotation: level },
    });
  TestValidator.predicate(
    "the ends",
    vclose(swing(0).ankle, { x: 0, y: 0, z: 0 }, 1e-12) &&
      vclose(swing(1).ankle, { x: 0, y: 0, z: 1 }, 1e-12) &&
      vclose(swing(2).ankle, { x: 0, y: 0, z: 1 }, 1e-12),
  );
  TestValidator.predicate(
    "over the top",
    vclose(swing(0.5).ankle, { x: 0, y: 0.4, z: 0.5 }, 1e-12) &&
      qclose(swing(0.5).rotation, tipped, 1e-12),
  );
}
