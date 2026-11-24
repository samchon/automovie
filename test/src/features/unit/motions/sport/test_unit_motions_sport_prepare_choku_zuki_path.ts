import type {
  AutoMovieHumanoidBone,
  IAutoMovieBodyMeasure,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanTargetGrid,
  prepareChokuZukiPath,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixture } from "../../../internal/fixtures/humanFixture";
import { nclose } from "../../../internal/nclose";

/** Rounding of a few closed-form quintic sums. */
const ROUNDING: number = 1e-12;

/**
 * `prepareChokuZukiPath` lays the fist's shares of the way from chamber to aim
 * through three knots: the chamber at progress 0, the chest-front crossing with
 * no share inward yet, and the aim at progress 1, each knot's progress its
 * share of the chord length, joined by the minimum-jerk knot course.
 *
 * The average man's stored measures, his right shoulder joint 0.19 m right of
 * the root, 1.2 m above it and 2 cm ahead, and a chamber 8 cm outward, at waist
 * height and 9 cm ahead of it.
 *
 * Scenarios:
 *
 * 1. The path starts at `[0, 0]`, passes `[0, c]` at the crossing's chord share
 *    and ends at `[1, 1]`, where `c` brings the fist to half the chest's depth
 *    and a forearm diameter ahead of the shoulder.
 * 2. Before the crossing no share goes inward: the forearm runs along the flank.
 */
export async function test_unit_motions_sport_prepare_choku_zuki_path(): Promise<void> {
  const measure: IAutoMovieBodyMeasure = (await humanFixture("m-average"))
    .measure;
  const shoulder: IAutoMovieVector3 = { x: -0.19, y: 1.2, z: 0.02 };
  const rest: ReadonlyMap<AutoMovieHumanoidBone, IAutoMovieVector3> = new Map<
    AutoMovieHumanoidBone,
    IAutoMovieVector3
  >([["rightUpperArm", shoulder]]);
  const chamber: IAutoMovieVector3 = {
    x: 0.08,
    y: measure.waistHeight - measure.shoulderHeight,
    z: 0.09,
  };
  const path = prepareChokuZukiPath({ measure, rest }, chamber);

  // The knots' closed forms.
  const forward: number =
    measure.upperArm + measure.forearm - shoulder.z - chamber.z;
  const up: number =
    AutoMovieMotionHumanTargetGrid.height({ measure }, "chest") *
      measure.stature -
    measure.waistHeight;
  const c: number =
    (measure.chestDepth / 2 +
      2 * measure.forearmRadius +
      measure.forearm -
      chamber.z) /
    forward;
  const along: number = Math.hypot(up, forward);
  const first: number = c * along;
  const at: number =
    first / (first + Math.hypot(chamber.x - shoulder.x, (1 - c) * along));
  const share = (u: number): readonly number[] => path.position(u);
  TestValidator.predicate(
    "through its knots",
    c > 0 &&
      c < 1 &&
      nclose(share(0)[0]!, 0, ROUNDING) &&
      nclose(share(0)[1]!, 0, ROUNDING) &&
      nclose(share(at)[0]!, 0, ROUNDING) &&
      nclose(share(at)[1]!, c, ROUNDING) &&
      nclose(share(1)[0]!, 1, ROUNDING) &&
      nclose(share(1)[1]!, 1, ROUNDING),
  );
  TestValidator.predicate(
    "none inward before the chest's front",
    [0.1, 0.25, 0.5, 0.75, 0.9].every(
      (f: number): boolean => share(f * at)[0]! <= ROUNDING,
    ),
  );
}
