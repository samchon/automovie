import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanAuditTiming,
} from "@automovie/interface";

/**
 * Whether what an action declares about its own time is coherent, and whether
 * its named instants fall where its contract says: in a stated order, and at
 * the same film second as a partner's.
 *
 * Everything that reads a plan trusts its declarations: an author cuts at an
 * event, a reaction aligns to one, the foot audit reads the plant windows. A
 * plan whose event lies outside its action, whose two events share a name,
 * whose window ends before it starts or whose decisive instant lies after its
 * end misleads all of them without any pose looking wrong. `faults` reads those
 * declarations against what their owners document; `order` and `shared` read
 * the named instants a law's contract speaks of.
 */
export namespace AutoMovieMotionHumanAuditTiming {
  /**
   * Every incoherent declaration of a person's placed actions.
   *
   * @param spans The person's actions, in film order.
   * @returns One line per fault, `<index> <action>: <what>`; empty when all
   *   cohere.
   */
  export function faults(
    spans: readonly IAutoMovieMotionHumanAuditTiming.ISpan[],
  ): string[] {
    const out: string[] = [];
    const eps: number = 1e-9;
    spans.forEach(
      (span: IAutoMovieMotionHumanAuditTiming.ISpan, index: number): void => {
        const say = (what: string): void => {
          out.push(`${index} ${span.name}: ${what}`);
        };
        const D: number = span.plan.duration;
        if (!(D > 0)) say(`duration ${D}`);
        if (!(span.start <= span.entryTime + eps))
          say(`entered at ${span.entryTime} before its start ${span.start}`);
        if (!(span.entryTime <= span.end + eps))
          say(`ends at ${span.end} before its entry ${span.entryTime}`);
        if (!(span.end <= span.start + D + eps))
          say(`ends at ${span.end}, after its plan's ${span.start + D}`);
        const previous: IAutoMovieMotionHumanAuditTiming.ISpan | undefined =
          spans[index - 1];
        if (previous !== undefined && !(previous.end <= span.entryTime + eps))
          say(`entered at ${span.entryTime} before ${previous.name} ends`);
        const names: Set<string> = new Set();
        for (const event of span.plan.events) {
          if (!(event.share >= 0 && event.share <= 1))
            say(`event ${event.name} at share ${event.share}`);
          if (names.has(event.name)) say(`event ${event.name} twice`);
          names.add(event.name);
        }
        for (const c of span.plan.contacts)
          if (!(c.from >= 0 && c.from <= c.to && c.to <= 1))
            say(`${c.kind} of ${c.part} from ${c.from} to ${c.to}`);
        for (const key of ["contact", "feigned"] as const) {
          const at: number | undefined = span.plan[key];
          if (at !== undefined && !(at >= 0 && at <= D + eps))
            say(`${key} at ${at} s of ${D}`);
        }
        if (span.plan.contact !== undefined && span.plan.feigned !== undefined)
          say("both a contact and a feigned contact");
      },
    );
    return out;
  }

  /**
   * The film second of an action's named event.
   *
   * @param span The action.
   * @param event The event's name.
   * @returns Film seconds.
   * @throws {Error} When the action declares no such event.
   */
  export function instant(
    span: IAutoMovieMotionHumanAuditTiming.ISpan,
    event: string,
  ): number {
    const found: IAutoMovieMotionEvent | undefined = span.plan.events.find(
      (e: IAutoMovieMotionEvent): boolean => e.name === event,
    );
    if (found === undefined)
      throw new Error(
        `${span.name} declares no event ${event}; it declares ${span.plan.events.map((e: IAutoMovieMotionEvent): string => e.name).join(", ") || "none"}`,
      );
    return span.start + found.share * span.plan.duration;
  }

  /**
   * Whether an action's named events come in a stated order.
   *
   * @param span The action.
   * @param events The names, in the order the contract states.
   * @returns One line per event that is missing or comes before the one stated
   *   before it; empty when the order holds. Two events at the same instant are
   *   in order.
   */
  export function order(
    span: IAutoMovieMotionHumanAuditTiming.ISpan,
    events: readonly string[],
  ): string[] {
    const out: string[] = [];
    let last: IAutoMovieMotionEvent | undefined;
    for (const name of events) {
      const found: IAutoMovieMotionEvent | undefined = span.plan.events.find(
        (e: IAutoMovieMotionEvent): boolean => e.name === name,
      );
      if (found === undefined) {
        out.push(`${span.name}: no event ${name}`);
        continue;
      }
      if (last !== undefined && !(found.share >= last.share))
        out.push(
          `${span.name}: ${name} at share ${found.share} before ${last.name} at ${last.share}`,
        );
      last = found;
    }
    return out;
  }

  /**
   * How far apart two actions put an instant they share: a handshake's clasp, a
   * hand-over's release and its receipt, a strike's impact and the reaction's.
   *
   * @param a One action.
   * @param first Its event.
   * @param b The partner's action.
   * @param second The partner's event.
   * @returns The absolute difference of the two film seconds.
   * @throws {Error} When either action declares no such event.
   */
  export function shared(
    a: IAutoMovieMotionHumanAuditTiming.ISpan,
    first: string,
    b: IAutoMovieMotionHumanAuditTiming.ISpan,
    second: string,
  ): number {
    return Math.abs(instant(a, first) - instant(b, second));
  }
}
