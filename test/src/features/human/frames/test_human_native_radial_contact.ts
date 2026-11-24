import { AutoMovieHumanNativeRadialContact as Radial } from "@automovie/human";
import type { IAutoMovieHumanNativeRadialContact } from "@automovie/interface";

/**
 * A cutter's seed is derived where its declared seed line enters a star-shaped host.
 *
 * Scenarios:
 * 1. A made cylinder host of radius 5 about the z axis and the line [20 - s, 3, 40]: the line enters at s = 16, where (20 - s)^2 + 9 = 25,
 *    at host station 40 and phase atan2(3, 4); the host's chart point is the part's point.
 * 2. The same line mirrored to y = -3 enters at the same s with phase 2 pi - atan2(3, 4), in [0, 2 pi).
 * 3. A line at y = 6 misses the host and is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production radial seed on a synthetic cylinder.
 * @evidence contracts/development/testing.md#independent-expectations Uses the closed-form circle-line intersection.
 * @evidence contracts/development/testing.md#distinguishing-cases Exercises both phases and a line that misses the host.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous CPU test using made functions.
 * @evidence contracts/development/common.md#meaningful-documentation Numbered scenarios state each made input and its expected seed.
 */
export function test_human_native_radial_contact(): void {
  const failures: string[] = [];
  const near = (what: string, got: number, want: number, tolerance: number): void => {
    if (!(Math.abs(got - want) <= tolerance)) failures.push(`${what}: ${got} instead of ${want}`);
  };
  const cylinder: IAutoMovieHumanNativeRadialContact.IHost = {
    at: (s: number): IAutoMovieHumanNativeRadialContact.IFrame => ({ origin: [0, 0, s], u: [1, 0, 0], v: [0, 1, 0] }),
    point: (s: number, t: number): number[] => [5 * Math.cos(t), 5 * Math.sin(t), s],
    domain: [0, 100],
  };
  for (const sign of [1, -1]) {
    const got: IAutoMovieHumanNativeRadialContact.IResult = Radial.seed((s: number): number[] => [20 - s, 3 * sign, 40], 0, 20, cylinder);
    const phase: number = sign > 0 ? Math.atan2(3, 4) : 2 * Math.PI - Math.atan2(3, 4);
    near(`side ${sign} part station`, got.part, 16, 1e-8);
    near(`side ${sign} host station`, got.host[0], 40, 1e-12);
    near(`side ${sign} host phase`, got.host[1], phase, 1e-9);
    near(`side ${sign} chart point meets part point`, Math.hypot(...got.point.map((x: number, k: number): number => x - got.target[k]!)), 0, 1e-8);
  }
  try {
    Radial.seed((s: number): number[] => [20 - s, 6, 40], 0, 20, cylinder);
    failures.push("a line that misses the host was seeded");
  } catch {
    // refused as required
  }
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
