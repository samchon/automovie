import { minimumJerk } from "@automovie/engine";

/**
 * The arrest of a travel that a contact interrupts: a strike that meets a
 * body before its step has finished does not keep stepping into it, and does
 * not freeze in mid-stride either; the travel is brought to rest from the
 * speed it had.
 *
 * The arrest is the quintic that leaves its start with the travel's own
 * velocity and no added acceleration and arrives at rest, so position and
 * velocity stay continuous through the contact and only the acceleration
 * breaks, as it does at any impact.
 */
export namespace StrikingArrest {
  /**
   * The travel during an arrest.
   *
   * The curve is `from + velocity * span * h(u) + (to - from) * s(u)` with
   * `u = elapsed / span`, `s` the minimum-jerk share and
   * `h(u) = u - 6u^3 + 8u^4 - 3u^5`, the quintic with `h(0) = 0`,
   * `h'(0) = 1` and every other end condition zero.
   *
   * @param from The travel at the interruption, metres.
   * @param velocity Its speed then, metres per second.
   * @param to Where it comes to rest, metres.
   * @param span How long the arrest takes, seconds; positive.
   * @param elapsed Seconds since the interruption; held at the ends outside [0, span].
   * @returns The travel, metres.
   * @throws {Error} When the span is not positive.
   */
  export function settle(
    from: number,
    velocity: number,
    to: number,
    span: number,
    elapsed: number,
  ): number {
    if (!(span > 0)) throw new Error("An arrest takes a positive time");
    const u: number = Math.min(1, Math.max(0, elapsed / span));
    const h: number = u - 6 * u ** 3 + 8 * u ** 4 - 3 * u ** 5;
    return from + velocity * span * h + (to - from) * minimumJerk(u).s;
  }

  /**
   * Where an arrested travel naturally comes to rest: half the distance its
   * speed would cover over the span, the one end for which the curve of
   * {@link settle} slows monotonically (its speed is then
   * `velocity * (1 - u)^2 * (1 + 2u)`, never reversing).
   *
   * @param from The travel at the interruption, metres.
   * @param velocity Its speed then, metres per second.
   * @param span How long the arrest takes, seconds.
   * @returns The resting travel, metres.
   */
  export function rest(from: number, velocity: number, span: number): number {
    return from + 0.5 * velocity * span;
  }
}
