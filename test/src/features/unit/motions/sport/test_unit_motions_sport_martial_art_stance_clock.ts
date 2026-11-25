import type { IAutoMovieMotionClock } from "@automovie/interface";
import {
  AutoMovieMotionManner,
  MartialArtStanceForms,
  martialArtStanceClock,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/**
 * `martialArtStanceClock` times a stance form from its blocking: the step in to
 * `ready`, the forward transfer to `stroke`, the back transfer to `strokeEnd`,
 * the hold to `relax` and the step back, under the neutral manner.
 *
 * Scenarios, each held 0.24 s:
 *
 * 1. Karate (0.55 s steps, 0.42 s transfers): marks at 0.55, 0.97, 1.39 and 1.63
 *    s, 2.18 s in all.
 * 2. Taekwondo (0.64 s steps, 0.48 and 0.72 s transfers): marks at 0.64, 1.12,
 *    1.84 and 2.08 s, 2.72 s in all.
 * 3. Tai chi (2 s steps, 2.5 s transfers): 9.24 s in all, the slowest form.
 */
export function test_unit_motions_sport_martial_art_stance_clock(): void {
  const marks = (kind: MartialArtStanceForms.Kind): number[] => {
    const clock: IAutoMovieMotionClock = martialArtStanceClock(
      MartialArtStanceForms.FORM[kind],
      0.24,
      AutoMovieMotionManner.NEUTRAL,
    );
    return [
      clock.at("ready"),
      clock.at("stroke"),
      clock.at("strokeEnd"),
      clock.at("relax"),
      clock.duration,
    ];
  };
  const near = (got: number[], want: number[]): boolean =>
    want.every((w: number, i: number): boolean => nclose(got[i]!, w, 1e-12));
  TestValidator.predicate(
    "karate",
    near(marks("karateStanceTransfer"), [0.55, 0.97, 1.39, 1.63, 2.18]),
  );
  TestValidator.predicate(
    "taekwondo",
    near(marks("taekwondoStanceReset"), [0.64, 1.12, 1.84, 2.08, 2.72]),
  );
  TestValidator.predicate(
    "tai chi",
    nclose(marks("taiChiTransfer")[4]!, 9.24, 1e-12),
  );
}
