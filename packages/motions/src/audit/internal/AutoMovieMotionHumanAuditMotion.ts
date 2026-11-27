import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanAuditMotion as IAutoMovieMotionHumanAuditMotionContract,
  IAutoMovieMotionHumanContactWindow,
} from "@automovie/interface";

/*
 * Contact-window, floor and sample-grid readers for the canonical motion-audit
 * contract.
 */
export namespace AutoMovieMotionHumanAuditMotion {
  /*
   * Random access to the audit lattice including its optional final endpoint.
   */
  export interface IGrid {
    /*
     * Number of sampled instants.
     */
    length: number;
    /*
     * Film second at a zero-based index in this grid.
     */
    at(index: number): number;
  }

  /*
   * Every declared contact window of a person in film seconds: a window's
   * shares are of its action's own duration from the action's start, and the
   * action only holds the body from its entry to its end, so the window is
   * clipped to that span. A window the clip empties is dropped. After their
   * last action a person holds the pose it ended on to the film's end, so a
   * window that holds them at that action's own end goes on holding them to the
   * film's end.
   * Parameter motion: The motion.
   * Parameter subject: The person.
   * Returns: The windows, in action order.
   */
  export function windows(
    motion: IAutoMovieMotionHumanAuditMotionContract,
    subject: string,
  ): IAutoMovieMotionHumanAuditMotionContract.IWindow[] {
    const out: IAutoMovieMotionHumanAuditMotionContract.IWindow[] = [];
    const spans: readonly IAutoMovieMotionHumanAuditMotionContract.ISpan[] =
      motion.segments(subject);
    let final: number = -Infinity;
    for (const span of spans) final = Math.max(final, span.end);
    for (const span of spans) {
      // The last action, ended at its own end rather than cut.
      const held: boolean =
        span.end >= final - 1e-9 &&
        span.end >= span.start + span.plan.duration - 1e-9;
      for (const contact of span.plan.contacts) {
        const from: number = Math.max(
          span.entryTime,
          span.start + contact.from * span.plan.duration,
        );
        const to: number =
          held && contact.to >= 1 - 1e-9
            ? Math.max(span.end, motion.duration)
            : Math.min(span.end, span.start + contact.to * span.plan.duration);
        if (to >= from) out.push({ action: span.name, contact, from, to });
      }
    }
    return out;
  }

  /*
   * The floor under a person, read at film seconds from the supports their
   * bearing contacts (a plant, a pivot, a seat, a lying or a borne contact)
   * declare: the height of the ground they bear on (a raised bank, a tread, the
   * lower foot on a slope), the lowest while several bear at once; none while
   * only a prop or a person bears them (a saddle, a seat, a partner), whose
   * surface, not a floor, is under them; between contacts (a jump, a swing),
   * the support the last one ended on. A raised rest one sole point bears on (a
   * declared socket at a declared height: a stirrup's tread, a footrest) holds
   * that point and gives no floor plane. While the motion says water carries
   * the person (`IAutoMovieMotionHumanAuditMotion.water`) only a ground contact
   * gives a floor. With no bearing contact yet, the world plane `y = 0`.
   * Parameter motion: The motion.
   * Parameter subject: The person.
   * Returns: The reader: world metres, or `null` where no floor is under the
   * person.
   */
  export function floors(
    motion: IAutoMovieMotionHumanAuditMotionContract,
    subject: string,
  ): (seconds: number) => number | null {
    const rest = (
      w: IAutoMovieMotionHumanAuditMotionContract.IWindow,
    ): boolean =>
      w.contact.support.kind === "ground" &&
      w.contact.socket !== undefined &&
      w.contact.support.height !== undefined;
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
        // A raised rest a sole point bears on (a stirrup's tread, a footrest: a declared socket at a declared height) holds that point, not a plane: the toes of a foot standing on a stirrup by its ball hang past the tread, so the floor stays the ground the person stood on.
        if (rest(w)) continue;
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

  /*
   * The floor under one foot and its leg, where the person stands on two levels
   * (a tread and the next, the two sides of a step): the lowest of the person's
   * floor (`floors`), the ground the foot's own bearing contact declares while
   * it bears and, between its contacts, the ground it left and the ground it
   * lands on, the levels its swing travels between; none where the person has
   * none. It is never above the person's floor: a foot leaving a lower tread is
   * read on that tread, and a foot resting on a raised footrest, which declares
   * a height and not a plane, is read no higher than the person's.
   * Parameter motion: The motion.
   * Parameter subject: The person.
   * Parameter side: The foot.
   * Returns: The reader: world metres, or `null` where no floor is under the
   * person.
   */
  export function feet(
    motion: IAutoMovieMotionHumanAuditMotionContract,
    subject: string,
    side: AutoMovieHumanSide,
  ): (seconds: number) => number | null {
    const person: (seconds: number) => number | null = floors(motion, subject);
    const part: FeetPart = `${side}Foot`;
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
          return Math.min(floor, ground(w) ?? floor);
        if (w.to < seconds && (last === undefined || w.to > last.to)) last = w;
        if (w.from > seconds && (next === undefined || w.from < next.from))
          next = w;
      }
      return Math.min(floor, ground(last) ?? floor, ground(next) ?? floor);
    };
  }

  /*
   * The film seconds a check samples between two instants: `from`, then every
   * `1 / rate` after it, and `to` itself when the grid does not land on it, so
   * neither end of a window is left unread.
   * Parameter from: Film seconds.
   * Parameter to: Film seconds, at least `from`.
   * Parameter rate: Samples per second, positive.
   * Returns: The instants, ascending.
   * When the rate is not positive or the span is reversed.
   */
  export function grid(from: number, to: number, rate: number): number[] {
    const indexed: IGrid = lattice(from, to, rate);
    const out: number[] = [];
    for (let i: number = 0; i < indexed.length; ++i) out.push(indexed.at(i));
    return out;
  }

  /*
   * Index the same audit grid without visiting any of its samples.
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

/*
 * The alternatives of `FeetPart`'s site.
 */
type FeetPart = "leftFoot" | "rightFoot";

/*
 * The contact kinds that bear the body on their support.
 */
const BEARING: readonly IAutoMovieMotionHumanContactWindow["kind"][] = [
  "plant",
  "pivot",
  "seat",
  "lie",
  "bear",
];
