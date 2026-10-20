import type { IAutoMovieRecoveryImageInput } from "@automovie/interface/recovery";

import { recoveryImageFixture } from "./recoveryImageFixture";

/**
 * Independent nonelliptical RGB section fixtures with known cameras.
 * A rotated box uses analytic support; the smooth asymmetric family uses
 * h=R(1+.16 cos(2a)+.04 sin(3a))+centre. Its h+h'' is positive, so it is
 * a strictly convex support function. Neither formula imports the fitter.
 *
 * @evidence contracts/testing.md#behavioral-verification Supplies actual RGB8 rasters that public observation must scan before fitting; no measured rows or expected coefficients are injected.
 * @evidence contracts/testing.md#independent-expectations Analytic box support and a strictly convex harmonic support function define independent silhouette limits; translating centres and cubic dimensions determine physical pixel inclusion. Each supplied camera angle and its opposite prepare their fixed trigonometric factors once; every row still evaluates the same cubic dimensions and centres before raster inclusion.
 * @evidence contracts/testing.md#distinguishing-cases Axis-aligned/rotated box and smooth asymmetric families distinguish sharp active-boundary events from smooth constant incidence. Optional angles permit separate training and withheld observations.
 * @evidence contracts/testing.md#execution-ownership This portable fixture owns resident arrays and deterministic arithmetic only, without filesystem, process, trained model, renderer or Human source.
 */
export function recoverySupportFixture(
  kind: "box" | "rotated-box" | "smooth-asymmetric",
  angles: number[] = Array.from(
    { length: 12 },
    (_: unknown, i: number): number => i * 15,
  ),
): IAutoMovieRecoveryImageInput {
  const directions: Map<
    number,
    { c: number; s: number; harmonic: number; boxX: number; boxZ: number }
  > = new Map();
  for (const degrees of angles) {
    const azimuth: number = (degrees * Math.PI) / 180;
    for (const angle of [azimuth, azimuth + Math.PI]) {
      const rotated: number =
        angle - (kind === "rotated-box" ? (19 * Math.PI) / 180 : 0);
      directions.set(angle, {
        c: Math.cos(angle),
        s: Math.sin(angle),
        harmonic: 1 + 0.16 * Math.cos(2 * angle) + 0.04 * Math.sin(3 * angle),
        boxX: Math.abs(Math.cos(rotated)),
        boxZ: Math.abs(Math.sin(rotated)),
      });
    }
  }
  const support: (t: number, a: number) => number = (
    t: number,
    a: number,
  ): number => {
    const direction: NonNullable<ReturnType<typeof directions.get>> =
      directions.get(a)!;
    const centre: number =
      (1 - 2 * t + t * t) * direction.c +
      (-1 + 2 * t - 0.5 * t ** 3) * direction.s;
    if (kind === "smooth-asymmetric")
      return centre + (16 + 4 * t - 2 * t * t + t ** 3) * direction.harmonic;
    return (
      centre +
      (17 + 3 * t + 2 * t * t - 2 * t ** 3) * direction.boxX +
      (10 + 5 * t - 2 * t * t + 2 * t ** 3) * direction.boxZ
    );
  };
  const capture: IAutoMovieRecoveryImageInput = recoveryImageFixture({
    angles,
    support: (t: number, a: number): [number, number] => [
      -support(t, a + Math.PI),
      support(t, a),
    ],
  });
  capture.budget = {
    maxViews: angles.length,
    maxRows: angles.length * 400,
    maxPixels: angles.length * 256 * 480,
  };
  return capture;
}
