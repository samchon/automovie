import type {
  IAutoMovieMotionHumanAuditMotion as IAutoMovieMotionHumanAuditMotionContract,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";

/** Contact-window, floor and sample-grid readers for the canonical motion-audit contract. */
export namespace AutoMovieMotionHumanAuditMotion {
  /** Random access to the audit lattice including its optional final endpoint. */
  export interface IGrid {
    /** Number of sampled instants. */
    length: number;
    /** Film second at a zero-based index in this grid. */
    at(index: number): number;
  }

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
   * The floor under a person, read at film seconds from the supports their
   * bearing contacts (a plant, a pivot, a seat, a lying or a borne contact)
   * declare: the height of the ground they bear on (a raised bank, a tread,
   * the lower foot on a slope), the lowest while several bear at once; none
   * while only a prop or a person bears them (a saddle, a seat, a partner),
   * whose surface, not a floor, is under them; between contacts (a jump, a
   * swing), the support the last one ended on. While the motion says water
   * carries the person (`IAutoMovieMotionHumanAuditMotion.water`) only a
   * ground contact gives a floor. With no bearing contact yet, the world
   * plane `y = 0`.
   *
   * @param motion The motion.
   * @param subject The person.
   * @returns The reader: world metres, or `null` where no floor is under the person.
   */
  export function floors(
    motion: IAutoMovieMotionHumanAuditMotionContract,
    subject: string,
  ): (seconds: number) => number | null {
    const bearing: IAutoMovieMotionHumanAuditMotionContract.IWindow[] = windows(
      motion,
      subject,
    ).filter((w: IAutoMovieMotionHumanAuditMotionContract.IWindow): boolean =>
      BEARING.includes(w.contact.kind),
    );
    return (seconds: number): number | null => {
      let lowest: number | null = null;
      let borne: boolean = false;
      let last: IAutoMovieMotionHumanAuditMotionContract.IWindow | undefined;
      for (const w of bearing) {
        if (w.from <= seconds + 1e-9 && seconds <= w.to + 1e-9) {
          if (w.contact.support.kind === "ground")
            lowest = Math.min(
              lowest ?? Infinity,
              w.contact.support.height ?? 0,
            );
          else borne = true;
        } else if (w.to < seconds && (last === undefined || w.to > last.to))
          last = w;
      }
      if (lowest !== null) return lowest;
      if (borne || motion.water?.(subject, seconds) === true) return null;
      if (last === undefined) return 0;
      return last.contact.support.kind === "ground"
        ? (last.contact.support.height ?? 0)
        : null;
    };
  }

  /**
   * The floor under one foot and its leg, where the person stands on two
   * levels (a tread and the next, the two sides of a step): the ground the
   * foot's own bearing contact declares while it bears; between its
   * contacts, the lower of the ground it left and the ground it lands on,
   * the levels its swing travels between; the person's floor (`floors`)
   * where the foot declares no ground of its own, and none where the person
   * has none.
   *
   * @param motion The motion.
   * @param subject The person.
   * @param side The foot.
   * @returns The reader: world metres, or `null` where no floor is under the person.
   */
  export function feet(
    motion: IAutoMovieMotionHumanAuditMotionContract,
    subject: string,
    side: "left" | "right",
  ): (seconds: number) => number | null {
    const person: (seconds: number) => number | null = floors(motion, subject);
    const part: "leftFoot" | "rightFoot" = `${side}Foot`;
    const own: IAutoMovieMotionHumanAuditMotionContract.IWindow[] = windows(
      motion,
      subject,
    ).filter(
      (w: IAutoMovieMotionHumanAuditMotionContract.IWindow): boolean =>
        w.contact.part === part && BEARING.includes(w.contact.kind),
    );
    const ground = (
      w: IAutoMovieMotionHumanAuditMotionContract.IWindow | undefined,
    ): number | undefined =>
      w?.contact.support.kind === "ground"
        ? (w.contact.support.height ?? 0)
        : undefined;
    return (seconds: number): number | null => {
      const floor: number | null = person(seconds);
      if (floor === null) return null;
      let last: IAutoMovieMotionHumanAuditMotionContract.IWindow | undefined;
      let next: IAutoMovieMotionHumanAuditMotionContract.IWindow | undefined;
      for (const w of own) {
        if (w.from <= seconds + 1e-9 && seconds <= w.to + 1e-9)
          return ground(w) ?? floor;
        if (w.to < seconds && (last === undefined || w.to > last.to)) last = w;
        if (w.from > seconds && (next === undefined || w.from < next.from))
          next = w;
      }
      const left: number | undefined = ground(last);
      const landing: number | undefined = ground(next);
      if (left === undefined) return landing === undefined ? floor : Math.min(floor, landing);
      return landing === undefined ? left : Math.min(left, landing);
    };
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
    const indexed: IGrid = lattice(from, to, rate);
    const out: number[] = [];
    for (let i: number = 0; i < indexed.length; ++i) out.push(indexed.at(i));
    return out;
  }

  /**
   * Index the same audit grid without visiting any of its samples.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Same lattice and endpoint rule as grid.
   * @evidence contracts/development/implementation.md#principled-implementation Computes the count of regular ticks and preserves the optional endpoint.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Each query is one indexed regular tick or the final endpoint.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Same origin and tolerance as the materialized grid.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant setup and indexed access with no materialized array.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Both whole-grid and sparse consumers use identical sample clocks.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains only numeric terms.
   */
  export function lattice(from: number, to: number, rate: number): IGrid {
    if (!(rate > 0)) throw new Error("An audit grid needs a positive rate");
    if (!(to >= from)) throw new Error("An audit grid needs from <= to");
    const count: number = Math.floor((to - from) * rate + 1e-9);
    const endsBetweenTicks: boolean = to - (from + count / rate) > 1e-9;
    return {
      length: count + (endsBetweenTicks ? 2 : 1),
      at: (index: number): number =>
        index <= count ? from + index / rate : to,
    };
  }
}

/** The contact kinds that bear the body on their support. */
const BEARING: readonly IAutoMovieMotionHumanContactWindow["kind"][] = [
  "plant",
  "pivot",
  "seat",
  "lie",
  "bear",
];
