import type { IAutoMovieMotionEvent } from "@automovie/interface";

import type { IHumanContactWindow } from "../law/IHumanContactWindow";

/**
 * Whether what an action declares about its own time is coherent, and
 * whether its named instants fall where its contract says: in a stated
 * order, and at the same film second as a partner's.
 *
 * Everything that reads a plan trusts its declarations: an author cuts at an
 * event, a reaction aligns to one, the foot audit reads the plant windows.
 * A plan whose event lies outside its action, whose two events share a name,
 * whose window ends before it starts or whose decisive instant lies after
 * its end misleads all of them without any pose looking wrong. `faults`
 * reads those declarations against what their owners document; `order` and
 * `shared` read the named instants a law's contract speaks of.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States who relies on the declarations, the defects and the three readings.
 * @evidence contracts/development/implementation.md#principled-implementation Each rule restates a documented invariant of `IHumanActionPlan`, `IAutoMovieMotionEvent`, `IHumanContactWindow` or the placed segment.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One rule per line of `faults`; the two instant readings are separate functions.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every span, event and window is read; a number that is not finite is a fault, never skipped.
 * @evidence contracts/development/implementation.md#efficient-algorithms Linear in spans, events and windows.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading of the declarations handed in.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export namespace AutoMovieMotionHumanAuditTiming {
  /**
   * A placed action as this audit reads it. `HumanPerformance.segments`
   * yields such spans.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its unit.
   * @evidence contracts/development/design.md#principled-representation The placement in film seconds and the plan's declared shares, as their owners state them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A structural subset of the placed segment; only what the rules read.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the event and the contact window; the two optional members are optional on the plan itself.
   */
  export interface ISpan {
    /** The action's name, for findings. */
    name: string;

    /** Where the action's own clock starts, film seconds. */
    start: number;

    /** Where the action takes the body over, film seconds. */
    entryTime: number;

    /** Where it ends, film seconds. */
    end: number;

    /** The part of the plan the audit reads. */
    plan: {
      /** The action's own length, seconds. */
      duration: number;

      /** The named instants, shares of the duration. */
      events: readonly IAutoMovieMotionEvent[];

      /** The declared contact windows, shares of the duration. */
      contacts: readonly IHumanContactWindow[];

      /** Seconds from the start to the decisive instant. */
      contact?: number;

      /** Seconds from the start to the contact a feint pretends. */
      feigned?: number;
    };
  }

  /**
   * Every incoherent declaration of a person's placed actions.
   *
   * @param spans The person's actions, in film order.
   * @returns One line per fault, `<index> <action>: <what>`; empty when all cohere.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input's order and the line format.
   * @evidence contracts/development/implementation.md#principled-implementation A positive finite duration; start, entry and end in order and within the plan's length; no action entered before the one before it ends; event shares in [0, 1] under unique names; windows with `0 <= from <= to <= 1`; a decisive or feigned instant inside the action, never both.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A flat list of rules over each span.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Comparisons are written so that a value that is not a number fails them.
   * @evidence contracts/development/implementation.md#efficient-algorithms One pass; names are checked through a set.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function faults(spans: readonly ISpan[]): string[] {
    const out: string[] = [];
    const eps: number = 1e-9;
    spans.forEach((span: ISpan, index: number): void => {
      const say = (what: string): void => {
        out.push(`${index} ${span.name}: ${what}`);
      };
      const D: number = span.plan.duration;
      if (!(D > 0 && Number.isFinite(D))) say(`duration ${D}`);
      if (!(span.start <= span.entryTime + eps))
        say(`entered at ${span.entryTime} before its start ${span.start}`);
      if (!(span.entryTime <= span.end + eps))
        say(`ends at ${span.end} before its entry ${span.entryTime}`);
      if (!(span.end <= span.start + D + eps))
        say(`ends at ${span.end}, after its plan's ${span.start + D}`);
      const previous: ISpan | undefined = spans[index - 1];
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
    });
    return out;
  }

  /**
   * The film second of an action's named event.
   *
   * @param span The action.
   * @param event The event's name.
   * @returns Film seconds.
   * @throws {Error} When the action declares no such event.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the unit and the failure.
   * @evidence contracts/development/implementation.md#principled-implementation A share is of the plan's duration from the action's own start.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing event throws; no default instant stands in.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A linear search of a handful of events.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function instant(span: ISpan, event: string): number {
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
   * @returns One line per event that is missing or comes before the one stated before it; empty when the order holds. Two events at the same instant are in order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the line per fault and how equal instants are read.
   * @evidence contracts/development/implementation.md#principled-implementation Consecutive shares are compared, which orders the whole list.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass that remembers the last found event.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing event is a fault, not skipped.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms A handful of events.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function order(span: ISpan, events: readonly string[]): string[] {
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
   * How far apart two actions put an instant they share: a handshake's
   * clasp, a hand-over's release and its receipt, a strike's impact and the
   * reaction's.
   *
   * @param a One action.
   * @param first Its event.
   * @param b The partner's action.
   * @param second The partner's event.
   * @returns The absolute difference of the two film seconds.
   * @throws {Error} When either action declares no such event.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the property with examples, the unit and the failure.
   * @evidence contracts/development/implementation.md#principled-implementation Both instants are read in film seconds, the one clock two people share.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two instants and their difference.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance here; the caller's limit judges.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads each instant through `instant`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two lookups.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function shared(
    a: ISpan,
    first: string,
    b: ISpan,
    second: string,
  ): number {
    return Math.abs(instant(a, first) - instant(b, second));
  }
}
