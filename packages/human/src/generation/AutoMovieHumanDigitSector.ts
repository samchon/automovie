import type {
  IAutoMovieHumanDigitSector,
  IAutoMovieHumanSeamKnot,
} from "@automovie/interface";

import { AutoMovieHumanSeam } from "../lofting/AutoMovieHumanSeam";

/**
 * One sector of a digit's section: the arc between two guides, built in the
 * section's own plane by the quintic Hermite of the two guides' jets.
 *
 * A guide is a longitudinal landmark curve at a fixed phase; it owns its
 * point, its unit tangent and its curvature vector there. The sector copies
 * both ends' jets exactly (point, velocity `lambda T`, acceleration
 * `lambda^2 kappa N`, `AutoMovieHumanSeam.adopt`), so a section assembled from
 * four sectors is C2 at every guide whatever the sectors' own shape. The
 * quintic Hermite is the least-degree curve that does it
 * (`AutoMovieHumanSeam.quintic`).
 *
 * Phase runs in radians over the sector's own span, as the section's
 * control-point assembly reads it (`AutoMovieHumanSeamKnot.assemble`): the
 * velocity here is millimetres per radian.
 */
export namespace AutoMovieHumanDigitSector {
  /*
   * Central difference step in the unit parameter.
   */
  const H: number = 1e-3;

  /**
   * The sector's jet at a phase.
   *
   * @param from The guide at the sector's start.
   * @param to The guide at its end.
   * @param span Phase between the two guides, radians.
   * @param start Absolute phase of the start guide.
   * @returns A function of absolute phase giving `[p, p', p'']` per radian.
   */
  export function of(
    from: IAutoMovieHumanDigitSector.IGuide,
    to: IAutoMovieHumanDigitSector.IGuide,
    span: number,
    start: number,
  ): IAutoMovieHumanDigitSector.OfResult {
    const jetOf = (g: IAutoMovieHumanDigitSector.IGuide): number[][] => {
      const [p, d1, d2] = AutoMovieHumanSeam.adopt(
        { point: g.point, tangent: g.tangent, curvature: g.curvature },
        g.speed,
      );
      return [
        p,
        d1.map((v: number): number => v * span),
        d2.map((v: number): number => v * span * span),
      ];
    };
    const lo: number[][] = jetOf(from);
    const hi: number[][] = jetOf(to);
    const at = (u: number): number[] =>
      AutoMovieHumanSeam.quintic(lo, hi, 1, u);

    return (t: number): IAutoMovieHumanSeamKnot.Jet => {
      // Derivatives of the degree-five polynomial by central differences in
      // the unit parameter: their error is below 1e-6 of the value at this
      // step. Inside a guide's neighbourhood the one-sided clamp of the
      // quintic holds the end values, so the ends are evaluated one step in.
      const u: number = Math.min(1 - H, Math.max(H, (t - start) / span));
      const p: number[] = at(u);
      const a: number[] = at(u - H);
      const b: number[] = at(u + H);
      const d1: number[] = p.map(
        (_: number, k: number): number => (b[k]! - a[k]!) / (2 * H * span),
      );
      const d2: number[] = p.map(
        (v: number, k: number): number =>
          (a[k]! - 2 * v + b[k]!) / (H * H * span * span),
      );
      return [p, d1, d2];
    };
  }
}
