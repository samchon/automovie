import type { IAutoMovieBodyMeasure, IAutoMovieMotionHumanDanceBeats, IAutoMovieVector3 } from "@automovie/interface";
import { conductFigure, conductTip } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../internal/fixtures/humanFixture";
import { vclose } from "../../internal/vclose";

/**
 * The conduct law's own logic: the conducting figure in the performer's frontal
 * plane (Rudolf's figures, half size `HALF` = 0.18 m) and the baton tip's path
 * over the beat clock.
 *
 * Scenarios:
 *
 * 1. The average man at (1, 0.9, 2) facing +Z beats 2/4 with the right hand: the
 *    figure's centre a forearm and 0.6 upper arms ahead, 0.1 m below the
 *    shoulders and half a shoulder half width toward the baton; its second
 *    ictus 0.2 halves inward and 0.4 down, its top a half above. With the left
 *    hand it mirrors.
 * 2. Three beats at 120 bpm after a 1 s lead on ictuses at 1.0, 0.8 and 0.9 m from
 *    a 1.2 m top with a 0.1 m rebound: the tip starts at the top, reaches the
 *    first ictus at the first beat, passes mid-beat between the first two
 *    lifted the whole rebound, and holds the last ictus after the last beat.
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
