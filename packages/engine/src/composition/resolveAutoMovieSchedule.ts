import type { AutoMovieComposition } from "./AutoMovieComposition";
import type { IAutoMovieIntent } from "./IAutoMovieIntent";
import type { IAutoMovieSchedule } from "./IAutoMovieSchedule";

/**
 * Place a composition on the film clock with the production's pure laws.
 *
 * The walk is depth first in declaration order. A sequence starts each part
 * at the previous part's end; a parallel group starts every part at its own
 * start and ends at the latest end; `at` starts its part at the named
 * anchor's contact instant (its start when the timing gives no contact) plus
 * the offset, and the walk continues after the later of the cursor and that
 * part's end. For each intent the production's `timing` gives its duration
 * and optional contact offset, then `outcome` and `state` read the entries
 * placed so far, so an outcome may depend on earlier state. The result is
 * deeply frozen; the same composition and laws give the same schedule.
 *
 * @param composition The composition.
 * @param laws The production's pure timing, outcome and state functions.
 * @returns The frozen schedule.
 */
export function resolveAutoMovieSchedule(
  composition: AutoMovieComposition,
  laws: resolveAutoMovieSchedule.ILaws,
): IAutoMovieSchedule {
  const entries: IAutoMovieSchedule.IEntry[] = [];
  const anchors: Map<string, number> = new Map();
  const place = (node: AutoMovieComposition, start: number): number => {
    if (node.kind === "intent") {
      const context: resolveAutoMovieSchedule.IContext = { start, entries };
      const timing: resolveAutoMovieSchedule.ITiming = laws.timing(
        node.intent,
        context,
      );
      if (!(timing.duration >= 0) || !Number.isFinite(timing.duration))
        throw new Error(
          `Invalid duration of ${node.intent.subject}.${node.intent.capability}`,
        );
      if (
        timing.contact !== undefined &&
        !(timing.contact >= 0 && timing.contact <= timing.duration)
      )
        throw new Error(
          `Contact outside ${node.intent.subject}.${node.intent.capability}`,
        );
      const draft: IAutoMovieSchedule.IEntry = {
        index: entries.length,
        subject: node.intent.subject,
        intent: node.intent,
        start,
        ...(timing.contact === undefined
          ? {}
          : { contact: start + timing.contact }),
        end: start + timing.duration,
      };
      const outcome: string | undefined = laws.outcome?.(draft, context);
      const state: unknown = laws.state?.(draft, context);
      entries.push({
        ...draft,
        ...(outcome === undefined ? {} : { outcome }),
        ...(state === undefined ? {} : { state }),
      });
      if (node.intent.anchor !== undefined) {
        if (anchors.has(node.intent.anchor))
          throw new Error(`Duplicate composition anchor ${node.intent.anchor}`);
        anchors.set(node.intent.anchor, draft.contact ?? start);
      }
      return draft.end;
    }
    if (node.kind === "sequence")
      return node.parts.reduce(
        (at: number, part: AutoMovieComposition): number => place(part, at),
        start,
      );
    if (node.kind === "parallel")
      return node.parts.reduce(
        (end: number, part: AutoMovieComposition): number =>
          Math.max(end, place(part, start)),
        start,
      );
    const anchor: number | undefined = anchors.get(node.anchor);
    if (anchor === undefined)
      throw new Error(
        `Composition anchor ${node.anchor} is not placed earlier`,
      );
    return Math.max(start, place(node.part, anchor + node.offset));
  };
  const end: number = place(composition, 0);
  const sorted: IAutoMovieSchedule.IEntry[] = [...entries].sort(
    (a: IAutoMovieSchedule.IEntry, b: IAutoMovieSchedule.IEntry): number =>
      a.start - b.start || a.index - b.index,
  );
  return Object.freeze({
    entries: Object.freeze(
      sorted.map((e: IAutoMovieSchedule.IEntry) => Object.freeze(e)),
    ),
    duration: Math.max(
      end,
      ...entries.map((e: IAutoMovieSchedule.IEntry): number => e.end),
    ),
  });
}
/** Companion types of {@link resolveAutoMovieSchedule}. */
export namespace resolveAutoMovieSchedule {
  /** What the laws see while an intent is placed. */
  export interface IContext {
    /** The intent's start, seconds. */
    start: number;

    /** Entries placed so far, in walk order. */
    entries: readonly IAutoMovieSchedule.IEntry[];
  }

  /** An intent's timing. */
  export interface ITiming {
    /** Seconds the intent takes; nonnegative. */
    duration: number;

    /** Seconds from the start to its contact or decisive instant, within the duration. */
    contact?: number;
  }

  /** The production's pure laws. */
  export interface ILaws {
    /** Duration and contact of an intent. */
    timing(intent: IAutoMovieIntent, context: IContext): ITiming;

    /** Outcome class of a placed entry, if any. */
    outcome?(
      entry: IAutoMovieSchedule.IEntry,
      context: IContext,
    ): string | undefined;

    /** State snapshot after a placed entry, if any. */
    state?(entry: IAutoMovieSchedule.IEntry, context: IContext): unknown;
  }
}
