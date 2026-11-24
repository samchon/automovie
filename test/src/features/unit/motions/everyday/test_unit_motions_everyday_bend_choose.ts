import type { IAutoMovieVector3 } from "@automovie/interface";
import { bend } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `bend.choose` takes the strategy a target asks for: `auto` stoops for a
 * target above mid-shank and semi-squats below it; a named strategy is kept.
 *
 * Scenarios, for a 0.08 m ankle height and a 0.42 m shank (mid-shank at 0.29
 * m):
 *
 * 1. `auto` at 0.3 m stoops, at 0.28 m semi-squats.
 * 2. A named squat is kept for a target at 1 m.
 */
export function test_unit_motions_everyday_bend_choose(): void {
  const body: Parameters<typeof bend.choose>[0] = {
    measure: { ankleHeight: 0.08, shank: 0.42 },
  };
  const at = (y: number): IAutoMovieVector3 => ({ x: 0, y, z: 0.3 });
  TestValidator.equals(
    "auto",
    [bend.choose(body, at(0.3), "auto"), bend.choose(body, at(0.28), "auto")],
    ["stoop", "semiSquat"],
  );
  TestValidator.equals("named", bend.choose(body, at(1), "squat"), "squat");
}
