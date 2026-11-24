import { AutoMovieLoftViewFullSource as Full } from "@automovie/engine";
import {
  AutoMovieHumanConicLoft as H,
  AutoMovieHumanF1,
  AutoMovieHumanNativeRadialContact as Radial,
} from "@automovie/human";
import type { IAutoMovieHumanNativeRadialContact, IAutoMovieLoftViewFullSource } from "@automovie/interface";

/**
 * A cutter's seed is derived where its declared seed line enters a star-shaped host, not copied from an earlier run.
 *
 * Scenarios:
 * 1. A made cylinder host of radius 5 about the z axis and the line [20 - s, 3, 40]: the line enters at s = 16, where (20 - s)^2 + 9 = 25,
 *    at host station 40 and phase atan2(3, 4); the host's chart point is the part's point.
 * 2. The same line mirrored to y = -3 enters at the same s with phase 2 pi - atan2(3, 4), in [0, 2 pi).
 * 3. A line at y = 6 misses the host and is refused.
 * 4. f1's stored nostril cutter along its declared seed line (phase 0, shares 0 to 0.9) enters f1's stored nose source; the host chart point
 *    lies within the nose floor net's largest lift, 3.4 mm, of the part point, so the chart reads the nose's own radial phase convention.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the production radial seed on a made host and on f1's stored nose and nostril sources.
 * @evidence contracts/development/testing.md#independent-expectations The made entries are the closed-form circle-line intersection; the f1 bound is the nose floor net's recorded largest height.
 * @evidence contracts/development/testing.md#distinguishing-cases Both half-planes of the phase, a missing line and a real relieved host, every finding collected.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous unit on made functions and stored family sources, with no loft, person or realization.
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

  // 4. f1's stored nostril and nose.
  const nostril: IAutoMovieLoftViewFullSource.IReader = Full.create(H.source(AutoMovieHumanF1.CUTTERS[2]!.family));
  const nose = H.source(AutoMovieHumanF1.BODY.nose);
  const noseReader: IAutoMovieLoftViewFullSource.IReader = Full.create(nose);
  const span: number = nostril.domain[1] - nostril.domain[0];
  const f1: IAutoMovieHumanNativeRadialContact.IResult = Radial.seed(
    (s: number): readonly number[] => nostril.point(s, 0),
    nostril.domain[0],
    nostril.domain[0] + 0.9 * span,
    { at: (s: number) => nose.axis.at(s), point: (s: number, t: number): readonly number[] => noseReader.point(s, t), domain: noseReader.domain },
  );
  const gap: number = Math.hypot(...f1.point.map((x: number, k: number): number => x - f1.target[k]!));
  if (!(gap <= 3.4)) failures.push(`f1's nostril seed: host chart point ${gap} mm from the part point (host ${f1.host.join(", ")}, part ${f1.part})`);
  if (failures.length !== 0) throw new Error(failures.join("\n"));
}
