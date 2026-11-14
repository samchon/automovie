import type { AutoMovieComposition } from "./AutoMovieComposition";
import { AutoMovieScheduleError } from "./AutoMovieScheduleError";
import type { IAutoMovieIntent } from "./IAutoMovieIntent";
import type { IAutoMovieSchedule } from "./IAutoMovieSchedule";
import type { resolveAutoMovieSchedule } from "./resolveAutoMovieSchedule";

/**
 * The state of one walk of a composition (`resolveAutoMovieSchedule`) and the
 * readings of it every placement shares: the instants an anchor or a cue
 * track offers, the names placed so far, the instant an event names and the
 * intent a part begins with.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the walk keeps and what each reading answers.
 * @evidence contracts/development/design.md#principled-representation The placed entries, the anchors' contact instants, the cuts' successors, the anchored entries and the cue tracks are the five things a later placement reads of an earlier one.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One record and four readings, used by the cut, the intent, the `at` placement and the walk itself.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No law and no composition is named; every reading refuses with an `AutoMovieScheduleError`.
 */
export namespace AutoMovieScheduleWalk {
  /**
   * What one walk keeps.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member, its keys and its unit.
   * @evidence contracts/development/design.md#principled-representation The placed entries, the anchors' instants, the cuts' successors, the anchored entries and the cue tracks are the five things a later placement reads of an earlier one.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members, all read by the cut, the placements and the walk.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No composition is named and nothing outlives the walk.
   */
  export interface IWalk {
    /** The production's pure laws. */
    laws: resolveAutoMovieSchedule.ILaws;

    /** Entries placed so far, in walk order. */
    entries: IAutoMovieSchedule.IEntry[];

    /** Each anchor's contact instant, or its start when it has none, film seconds. */
    anchors: Map<string, number>;

    /** The index an entry's cut is followed by, by the cut entry's index. */
    interrupted: Map<number, number>;

    /** The entry each anchor names. */
    anchored: Map<string, IAutoMovieSchedule.IEntry>;

    /** The cue tracks of the laws. */
    tracks: Map<string, readonly resolveAutoMovieSchedule.ICue[]>;
  }

  /**
   * A walk with nothing placed.
   *
   * @param laws The production's laws.
   * @returns The walk.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and that nothing is placed.
   * @evidence contracts/development/implementation.md#principled-implementation The tracks are the laws' own cues.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The record lives as long as the walk.
   */
  export function create(laws: resolveAutoMovieSchedule.ILaws): IWalk {
    return {
      laws,
      entries: [],
      anchors: new Map(),
      interrupted: new Map(),
      anchored: new Map(),
      tracks: new Map(Object.entries(laws.cues ?? {})),
    };
  }

  /**
   * The named instants of an anchored entry (its events, and its own start
   * and end where it names none so) or of a cue track.
   *
   * @param walk The walk.
   * @param of The anchor or track.
   * @returns The instants, or undefined when nothing of that name is placed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two sources and the start and end added.
   * @evidence contracts/development/implementation.md#principled-implementation An entry always offers its start and its end unless its events name them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one list.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the anchor's events.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function instants(
    walk: IWalk,
    of: string,
  ): readonly resolveAutoMovieSchedule.ICue[] | undefined {
    const entry: IAutoMovieSchedule.IEntry | undefined = walk.anchored.get(of);
    if (entry === undefined) return walk.tracks.get(of);
    const events: readonly resolveAutoMovieSchedule.ICue[] = entry.events ?? [];
    const named: (name: string) => boolean = (name: string): boolean =>
      events.some(
        (e: resolveAutoMovieSchedule.ICue): boolean => e.name === name,
      );
    return [
      ...(named("start") ? [] : [{ name: "start", seconds: entry.start }]),
      ...events,
      ...(named("end") ? [] : [{ name: "end", seconds: entry.end }]),
    ];
  }

  /**
   * Every name a later part may align to.
   *
   * @param walk The walk.
   * @returns The anchors and the tracks.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is listed.
   * @evidence contracts/development/implementation.md#principled-implementation The names an error offers as alternatives.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One list.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the names.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function placed(walk: IWalk): string[] {
    return [...walk.anchored.keys(), ...walk.tracks.keys()];
  }

  /**
   * The instant an event names, the `index`-th of that name.
   *
   * @param of The anchor or track the events belong to.
   * @param events Its instants.
   * @param name The event.
   * @param index The occurrence, from 0.
   * @param by The intent that asks, for the error.
   * @returns Film seconds.
   * @throws {AutoMovieScheduleError} When there is no event of that name or that many.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the two refusals.
   * @evidence contracts/development/implementation.md#principled-implementation Events of one name are taken in order, as a score repeats a beat.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One filter and two refusals.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing event or index is refused with the alternatives, not defaulted.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the events.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function instant(
    of: string,
    events: readonly resolveAutoMovieSchedule.ICue[],
    name: string,
    index: number,
    by: IAutoMovieIntent | undefined,
  ): number {
    const same: resolveAutoMovieSchedule.ICue[] = events.filter(
      (e: resolveAutoMovieSchedule.ICue): boolean => e.name === name,
    );
    const names: string[] = [
      ...new Set(
        events.map((e: resolveAutoMovieSchedule.ICue): string => e.name),
      ),
    ];
    if (same.length === 0)
      throw new AutoMovieScheduleError(
        `${of} has no event ${name}; its events are ${names.join(", ") || "none"}`,
        {
          code: "event",
          subject: by?.subject,
          capability: by?.capability,
          of,
          value: name,
          alternatives: names,
        },
      );
    const found: resolveAutoMovieSchedule.ICue | undefined = same[index];
    if (found === undefined)
      throw new AutoMovieScheduleError(
        `${of} has ${same.length} ${name} events, so index ${index} names none (the first is 0)`,
        {
          code: "index",
          subject: by?.subject,
          capability: by?.capability,
          of,
          value: index,
          alternatives: same.map(
            (_: resolveAutoMovieSchedule.ICue, i: number): string => String(i),
          ),
        },
      );
    return found.seconds;
  }

  /**
   * The intent a part begins with.
   *
   * @param node The part.
   * @returns The first intent of a sequence or group, an intent itself, or undefined for an `at` or an empty group.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each node kind gives.
   * @evidence contracts/development/implementation.md#principled-implementation The first part is followed down; an `at` begins where its anchor puts it, so it names none.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One recursion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Linear in the depth.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function leading(
    node: AutoMovieComposition,
  ): IAutoMovieIntent | undefined {
    return node.kind === "intent"
      ? node.intent
      : node.kind === "at" || node.parts[0] === undefined
        ? undefined
        : leading(node.parts[0]);
  }
}
