import type { IAutoMovieMotionHumanAuditMotion as IAutoMovieMotionHumanAuditMotionContract } from "@automovie/interface";

/** Contact-window and sample-grid readers for the canonical motion-audit contract. */
export namespace AutoMovieMotionHumanAuditMotion {
  /**
   * Every declared contact window of a person in film seconds: a window's
   * shares are of its action's own duration from the action's start, and the
   * action only holds the body from its entry to its end, so the window is
   * clipped to that span. A window the clip empties is dropped.
   *
   * @param motion The motion.
   * @param subject The person.
   * @returns The windows, in action order.
   */
  export function windows(
    motion: IAutoMovieMotionHumanAuditMotionContract,
    subject: string,
  ): IAutoMovieMotionHumanAuditMotionContract.IWindow[] {
    const out: IAutoMovieMotionHumanAuditMotionContract.IWindow[] = [];
    for (const span of motion.segments(subject))
      for (const contact of span.plan.contacts) {
        const from: number = Math.max(
          span.entryTime,
          span.start + contact.from * span.plan.duration,
        );
        const to: number = Math.min(
          span.end,
          span.start + contact.to * span.plan.duration,
        );
        if (to >= from) out.push({ action: span.name, contact, from, to });
      }
    return out;
  }

  /**
   * The film seconds a check samples between two instants: `from`, then every
   * `1 / rate` after it, and `to` itself when the grid does not land on it, so
   * neither end of a window is left unread.
   *
   * @param from Film seconds.
   * @param to Film seconds, at least `from`.
   * @param rate Samples per second, positive.
   * @returns The instants, ascending.
   * @throws {Error} When the rate is not positive or the span is reversed.
   */
  export function grid(from: number, to: number, rate: number): number[] {
    if (!(rate > 0)) throw new Error("An audit grid needs a positive rate");
    if (!(to >= from)) throw new Error("An audit grid needs from <= to");
    const out: number[] = [];
    const count: number = Math.floor((to - from) * rate + 1e-9);
    for (let i: number = 0; i <= count; i++) out.push(from + i / rate);
    if (to - out[out.length - 1]! > 1e-9) out.push(to);
    return out;
  }
}
