import type { IAutoMovieBodyMeasure } from "@automovie/interface";
import { conductFigure } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { vclose } from "../../../internal/vclose";

/**
 * `conductFigure` lays a conducting figure in the performer's frontal plane:
 * its centre a forearm and 0.6 upper arms ahead of the root's floor point, 0.1
 * m below the shoulders and half a shoulder half-width toward the baton's side,
 * each ictus at its meter's shares of the 0.18 m half size (Rudolf's figures),
 * cycling through the meter, and the top 0.18 m above the centre.
 *
 * The average man stands at (1, 0.9, 2) facing +Z, the left toward +X.
 *
 * Scenarios:
 *
 * 1. Three beats of 2/4 with the right hand: down, then 0.2 in toward the middle
 *    and 0.4 down, then down again; the top above the centre.
 * 2. With the left hand the figure moves to the left side and mirrors.
 */
export async function test_unit_motions_music_conduct_figure(): Promise<void> {
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
    3,
  );
  const cx: number = 1 - 0.5 * m.shoulderHalfWidth;
  TestValidator.predicate(
    "the right hand's figure",
    right.ictus.length === 3 &&
      vclose(right.ictus[0]!, { x: cx, y: y - h, z }, 1e-12) &&
      vclose(right.ictus[1]!, { x: cx - 0.2 * h, y: y - 0.4 * h, z }, 1e-12) &&
      vclose(right.ictus[2]!, right.ictus[0]!, 1e-12) &&
      vclose(right.top, { x: cx, y: y + h, z }, 1e-12),
  );
  const left: ReturnType<typeof conductFigure> = conductFigure(
    posture,
    m,
    "left",
    "2/4",
    2,
  );
  const lx: number = 1 + 0.5 * m.shoulderHalfWidth;
  TestValidator.predicate(
    "the left hand's mirror",
    vclose(left.ictus[1]!, { x: lx + 0.2 * h, y: y - 0.4 * h, z }, 1e-12),
  );
}
