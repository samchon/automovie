import { AutoMovieEngineDistalTwistSwivelRange } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * `AutoMovieEngineDistalTwistSwivelRange.of(props)` reads, over a turn of the swivel, where a
 * distally twisting mid segment can take the twist a requested end rotation
 * asks of it inside its own range: the breakpoints, the admission test and a
 * lower bound of the miss elsewhere.
 *
 * Fixture: twist axis x; the zero reading needs the carried axis perpendicular
 * to y and positive along z; the carried axis turns with the swivel in the yz
 * plane, (0, sin s, cos s), so the twist asked is the swivel itself (up to
 * sense); range [-30, 30].
 *
 * Scenarios:
 *
 * 1. Swivels 0, 20 and 340 are admitted; 45, 90 and 180 are not.
 * 2. The breakpoints include 30 and 330 within 1e-9, where the twist asked reaches
 *    the range's ends.
 * 3. The miss bound over [0, 2] is 0 and over [100, 102] positive.
 * 4. Untwisting around positive x changes the carried axis angle from s to s + r
 *    in this chart, so its forward zero occurs at r = -s. For [0, 30] this
 *    admits -20 and refuses +20 and -45.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Covers swivel admission, range breakpoints, miss bounds and the sign of the forward twist.
 * @evidence contracts/development/testing.md#behavioral-verification Calls AutoMovieEngineDistalTwistSwivelRange.of on a rotating carried axis and queries its results at explicit angles and intervals.
 * @evidence contracts/development/testing.md#independent-expectations The carried axis is (0, sin s, cos s), giving breakpoints at 30 and 330 for the symmetric range. The directed chart zeros at r = -s, so the asymmetric range separates -20 from +20 and -45.
 */
export function test_engine_kinematics_distal_twist_swivel_range(): void {
  const D: number = Math.PI / 180;
  const circle: Omit<AutoMovieEngineDistalTwistSwivelRange.IProps, "range"> = {
    axis: { x: 1, y: 0, z: 0 },
    normal: { x: 0, y: 1, z: 0 },
    ahead: { x: 0, y: 0, z: 1 },
    carried: (s: number): IAutoMovieVector3 => ({
      x: 0,
      y: Math.sin(s * D),
      z: Math.cos(s * D),
    }),
  };
  const range: AutoMovieEngineDistalTwistSwivelRange.IRange = AutoMovieEngineDistalTwistSwivelRange.of({
    ...circle,
    range: [-30, 30],
  });

  // 1.
  TestValidator.equals("admits", [0, 20, 340, 45, 90, 180].map(range.admits), [
    true,
    true,
    true,
    false,
    false,
    false,
  ]);

  // 2.
  const has = (s: number): boolean =>
    range.breaks.some((b: number): boolean => Math.abs(b - s) <= 1e-9);
  TestValidator.predicate("breaks", has(30) && has(330));

  // 3.
  const miss = range.miss([-10, 10], 1);
  TestValidator.predicate("miss", miss(0, 2) === 0 && miss(100, 102) > 0);

  const positiveTwist: AutoMovieEngineDistalTwistSwivelRange.IRange =
    AutoMovieEngineDistalTwistSwivelRange.of({
      ...circle,
      range: [0, 30],
    });
  TestValidator.equals(
    "the forward twist sign and its upper range end matter independently",
    [-20, 20, -45].map(positiveTwist.admits),
    [true, false, false],
  );
}
