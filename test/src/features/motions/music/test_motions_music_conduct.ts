import type { IAutoMovieBodyMeasure, IAutoMovieMotionHumanDanceBeats, IAutoMovieVector3 } from "@automovie/interface";
import {
  conductFigure
} from "../../../../../packages/motions/src/music/internal/conductFigure";
import {
  conductTip
} from "../../../../../packages/motions/src/music/internal/conductTip";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../internal/fixtures/humanFixture";
import { vclose } from "../../internal/vclose";

/**
 * Check the conducting figure and timed baton-tip path.
 *
 * Scenarios:
 *
 * 1. On the posed body, place the right-hand 2/4 figure and check its top and
 *    second ictus. Mirror the second ictus for the left hand.
 * 2. At 120 bpm with one second of lead, sample the initial top, first ictus,
 *    midpoint rebound and final held ictus.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The cases identify measured body geometry, figure points, tempo and sample times.
 * @evidence contracts/development/testing.md#behavioral-verification The conducting figure and tip path consume separate typed body and beat fixtures.
 * @evidence contracts/development/testing.md#independent-expectations Measured limb lengths and the prescribed figure coefficients give the expected points. The half-second beat spacing and rebound supply the midpoint.
 */
export async function test_motions_music_conduct(): Promise<void> {
  // 1. The figure.
  const m: IAutoMovieBodyMeasure = (await humanFixture("m-average")).measure;
  const posture: Parameters<typeof conductFigure>[0] = {
    root: { x: 1, y: 0.9, z: 2 },
    yaw: 0,
  };
  const h: number = conductFigure.HALF;
  const y: number = m.shoulderHeight - 0.1;
  const z: number = 2 + m.forearm + 0.6 * m.upperArm;
  const right: ReturnType<typeof conductFigure> = conductFigure(
    posture,
    m,
    "right",
    "2/4",
    2,
  );
  const left: ReturnType<typeof conductFigure> = conductFigure(
    posture,
    m,
    "left",
    "2/4",
    2,
  );
  const cx: number = 1 - 0.5 * m.shoulderHalfWidth;
  const lx: number = 1 + 0.5 * m.shoulderHalfWidth;
  TestValidator.predicate(
    "the figure and its mirror",
    vclose(right.ictus[1]!, { x: cx - 0.2 * h, y: y - 0.4 * h, z }, 1e-12) &&
      vclose(right.top, { x: cx, y: y + h, z }, 1e-12) &&
      vclose(left.ictus[1]!, { x: lx + 0.2 * h, y: y - 0.4 * h, z }, 1e-12),
  );

  // 2. The tip.
  const ictus: IAutoMovieVector3[] = [
    { x: 0, y: 1, z: 0 },
    { x: 0.2, y: 0.8, z: 0 },
    { x: -0.2, y: 0.9, z: 0 },
  ];
  const top: IAutoMovieVector3 = { x: 0, y: 1.2, z: 0 };
  const beats: Pick<
    IAutoMovieMotionHumanDanceBeats,
    "count" | "period" | "at"
  > = { count: 3, period: 0.5, at: (k: number): number => 0.5 + 0.5 * k };
  const tip: (seconds: number) => IAutoMovieVector3 = conductTip(
    ictus,
    top,
    beats,
    0.1,
  );
  TestValidator.predicate(
    "the preparation, the beats and the hold",
    vclose(tip(0), top, 1e-12) &&
      vclose(tip(1), ictus[0]!, 1e-12) &&
      vclose(tip(1.25), { x: 0.1, y: 1, z: 0 }, 1e-12) &&
      vclose(tip(3), ictus[2]!, 1e-12),
  );
}
