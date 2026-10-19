import type { IAutoMovieRecoveryImageInput } from "@automovie/interface/recovery";

import { recoveryImageFixture } from "./recoveryImageFixture";

/**
 * Independent nonelliptical RGB section fixtures with known cameras.
 * A rotated box uses analytic support; the smooth asymmetric family uses
 * h=R(1+.16 cos(2a)+.04 sin(3a))+centre. Its h+h'' is positive, so it is
 * a strictly convex support function. Neither formula imports the fitter.
 *
 * @evidence contracts/testing.md#behavioral-verification Supplies actual RGB8 rasters that public observation must scan before fitting; no measured rows or expected coefficients are injected.
 * @evidence contracts/testing.md#independent-expectations Analytic box support and a strictly convex harmonic support function define independent silhouette limits; translating centres and cubic dimensions determine physical pixel inclusion.
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
  const support: (t: number, a: number) => number = (
    t: number,
    a: number,
  ): number => {
    const centre: number =
      (1 - 2 * t + t * t) * Math.cos(a) +
      (-1 + 2 * t - 0.5 * t ** 3) * Math.sin(a);
    if (kind === "smooth-asymmetric")
      return (
        centre +
        (16 + 4 * t - 2 * t * t + t ** 3) *
          (1 + 0.16 * Math.cos(2 * a) + 0.04 * Math.sin(3 * a))
      );
    const angle: number =
      a - (kind === "rotated-box" ? (19 * Math.PI) / 180 : 0);
    return (
      centre +
      (17 + 3 * t + 2 * t * t - 2 * t ** 3) * Math.abs(Math.cos(angle)) +
      (10 + 5 * t - 2 * t * t + 2 * t ** 3) * Math.abs(Math.sin(angle))
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
