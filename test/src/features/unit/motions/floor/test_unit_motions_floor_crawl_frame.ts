import type { IAutoMovieVector3 } from "@automovie/interface";
import { crawlFrame } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";
import { vclose } from "../../../internal/vclose";

/** Rounding of a few square roots and arcsines, metres and degrees. */
const ROUNDING: number = 1e-9;

/**
 * `crawlFrame`'s closed forms: `pitched` bisects the trunk's pitch between
 * upright and `PITCH` (120 degrees) over `HALVINGS` (24) halvings, under a
 * ten-thousandth of a degree; `over` sets the hips a thigh above each knee at
 * its place along the heading, their middle the pelvis's height and their
 * difference, over the hip separation's projection at the pitch, its turn.
 *
 * Scenarios:
 *
 * 1. A shoulder reading that stops holding past 37.5 degrees is pitched at 37.5
 *    within 120 / 2^24.
 * 2. Knees on the floor 0.3 m ahead of the level point with the hips 0.3 m behind
 *    them, under 0.45 m thighs, put the hips a thigh up; a pitch of 0 turns
 *    nothing.
 * 3. The left knee raised 0.1 m with hips 0.2 m apart at a 90-degree pitch turns
 *    the pelvis asin(0.1 / 0.2) = 30 degrees, lifting the left hip, the middle
 *    0.05 m higher.
 */
export function test_unit_motions_floor_crawl_frame(): void {
  TestValidator.predicate(
    "the pitch",
    Math.abs(crawlFrame.pitched((d: number): boolean => d < 37.5) - 37.5) <=
      crawlFrame.PITCH / 2 ** crawlFrame.HALVINGS,
  );
  const level: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  const forward: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const knee: (y: number, x: number) => IAutoMovieVector3 = (
    y: number,
    x: number,
  ): IAutoMovieVector3 => ({ x, y, z: 0.3 });
  const flat: ReturnType<typeof crawlFrame.over> = crawlFrame.over(
    0.45,
    level,
    forward,
    { left: knee(0, 0.1), right: knee(0, -0.1) },
    { left: 0.3, right: 0.3 },
    0.2,
    0,
  );
  TestValidator.predicate(
    "level knees",
    vclose(flat.point, { x: 0, y: 0.45, z: 0 }, ROUNDING) && flat.hike === 0,
  );
  const raised: ReturnType<typeof crawlFrame.over> = crawlFrame.over(
    0.45,
    level,
    forward,
    { left: knee(0.1, 0.1), right: knee(0, -0.1) },
    { left: 0.3, right: 0.3 },
    0.2,
    90,
  );
  TestValidator.predicate(
    "a raised knee",
    nclose(raised.point.y, 0.5, ROUNDING) && nclose(raised.hike, 30, ROUNDING),
  );
}
