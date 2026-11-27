import type { IAutoMovieVector3 } from "@automovie/interface";

/*
 * The level shift of a stagger's root that puts the displayed centre of mass on
 * the pendulum's course, from two readings of its residual: the residual with
 * no shift, and the residual left once that first residual is the shift.
 *
 * The planted legs do not follow the root, so a shift `s` moves the centre of
 * mass by `(1 - r) s`, with `r` the share that stays: the first residual `e0`
 * asks for `e0`, which leaves `e1 = r e0`, which asks for `r e0` more, and so
 * on, a geometric series whose sum is `e0 / (1 - r)` (Aitken's extrapolation of
 * a linearly converging fixed point, Aitken 1926). Adding the two readings
 * alone stops the series after two terms and leaves `r² e0`. The share is read
 * on each level axis from the readings themselves, with no further posture.
 * Unmeasured: the stagger's balance verdicts (the extrapolated centre of mass 4
 * mm outside the feet's hull at 1.4 s pushed sideways, 12 mm at 1.71 s pushed
 * backward) read the same with the two-term sum and with this one, so that
 * remainder is not their cause.
 * Parameter first: The residual with no shift, world metres, level.
 * Parameter second: The residual with the first residual as the shift, world
 * metres, level.
 * Returns: The shift, world metres, level.
 */
export function staggerShift(
  first: IAutoMovieVector3,
  second: IAutoMovieVector3,
): IAutoMovieVector3 {
  const summed: (e0: number, e1: number) => number = (
    e0: number,
    e1: number,
  ): number => {
    const share: number = Math.abs(e0) > 1e-9 ? e1 / e0 : NaN;
    return share >= 0 && share <= SHARE ? e0 / (1 - share) : e0 + e1;
  };
  return { x: summed(first.x, second.x), y: 0, z: summed(first.z, second.z) };
}

/*
 * The greatest share of a root's shift that the centre of mass may fail to
 * follow for the shift to be extrapolated: one half, above the two legs' 40 %
 * of the body's mass (de Leva 1996, J Biomech 29:1223, the male thigh, shank
 * and foot: 14.16, 4.33 and 1.37 % a leg), the share that stands planted while
 * the rest follows the root. A greater share, or a negative one, is not that of
 * planted legs, and its series is summed as far as it was read.
 */
const SHARE: number = 0.5;
