/**
 * The N-step capture distance in closed form (Koolen et al. 2012, Int J Robot
 * Res 31:1094, eqs. 13, 25, 26): with `q = e^(-omega0 T_s)` per step of time
 * `T_s`, an extrapolated centre of mass within `d_N = r + l q (1 − q^N) / (1 −
 * q)` of the stance ankle can be caught in N later steps, `r` the base's reach
 * from the ankle and `l` the longest step; the first step, after its own time
 * `T_1`, gives `r + (l − r + d_(N−1)) e^(-omega0 T_1)`. No step is the base's
 * own reach.
 *
 * @param props The pendulum's frequency, the base's reach, the longest step,
 *   the step time and the first step's time.
 * @returns The capture distance by step count, metres.
 */
export function staggerCaptureDistance(
  props: staggerCaptureDistance.IProps,
): (steps: number) => number {
  const { w, reach, longest, step, first }: staggerCaptureDistance.IProps =
    props;
  const q: number = Math.exp(-w * step);
  const later: (n: number) => number = (n: number): number =>
    n <= 0 ? reach : reach + (longest * q * (1 - q ** n)) / (1 - q);
  return (steps: number): number =>
    steps <= 0
      ? reach
      : reach +
        (longest - reach + later(steps - 1)) *
          Math.exp(-w * Math.max(0, first));
}

/** Companion types of {@link staggerCaptureDistance}. */
export namespace staggerCaptureDistance {
  /** What the capture distance is read from. */
  export interface IProps {
    /** The pendulum's natural frequency `omega0`, 1/s. */
    w: number;
    /** The base's reach from its ankle, metres. */
    reach: number;
    /** The longest step, metres. */
    longest: number;
    /** A later step's time, seconds. */
    step: number;
    /** The first step's time, seconds. */
    first: number;
  }
}
