import type {
  IAutoMovieComposition,
  IAutoMovieIntent,
  IAutoMovieScheduleCue,
  IAutoMovieScheduleEntry,
  IAutoMovieScheduleLaws,
  IAutoMovieScheduleWalk,
} from "@automovie/interface";

import { AutoMovieEngineScheduleError } from "./AutoMovieEngineScheduleError";

/**
 * The state of one walk of a composition (`resolveSchedule`) and the
 * readings of it every placement shares: the instants an anchor or a cue track
 * offers, the names placed so far, the instant an event names and the intent a
 * part begins with.
 */
export namespace AutoMovieEngineScheduleWalk {
  /**
   * A walk with nothing placed.
   *
   * @param laws The production's laws.
   * @returns The walk.
   */
  export function create(
    laws: IAutoMovieScheduleLaws,
  ): IAutoMovieScheduleWalk.IWalk {
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
   * The named instants of an anchored entry (its events, and its own start and
   * end where it names none so) or of a cue track.
   *
   * @param walk The walk.
   * @param of The anchor or track.
   * @returns The instants, or undefined when nothing of that name is placed.
   */
  export function instants(
    walk: IAutoMovieScheduleWalk.IWalk,
    of: string,
  ): readonly IAutoMovieScheduleCue[] | undefined {
    const entry: IAutoMovieScheduleEntry | undefined = walk.anchored.get(of);

    // A name that is no anchor and no fixed track may be a track the laws
    // compute from what is placed so far (a struck person's hits).
    if (entry === undefined)
      return walk.tracks.get(of) ?? walk.laws.instants?.(of, walk.entries);
    const events: readonly IAutoMovieScheduleCue[] = entry.events ?? [];
    const named: (name: string) => boolean = (name: string): boolean =>
      events.some((e: IAutoMovieScheduleCue): boolean => e.name === name);
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
   */
  export function placed(walk: IAutoMovieScheduleWalk.IWalk): string[] {
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
   * @throws {AutoMovieEngineScheduleError} When there is no event of that name or
   *   that many.
   */
  export function instant(
    of: string,
    events: readonly IAutoMovieScheduleCue[],
    name: string,
    index: number,
    by: IAutoMovieIntent | undefined,
  ): number {
    const same: IAutoMovieScheduleCue[] = events.filter(
      (e: IAutoMovieScheduleCue): boolean => e.name === name,
    );
    const names: string[] = [
      ...new Set(events.map((e: IAutoMovieScheduleCue): string => e.name)),
    ];
    if (same.length === 0)
      throw new AutoMovieEngineScheduleError(
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
    const found: IAutoMovieScheduleCue | undefined = same[index];
    if (found === undefined)
      throw new AutoMovieEngineScheduleError(
        `${of} has ${same.length} ${name} events, so index ${index} names none (the first is 0)`,
        {
          code: "index",
          subject: by?.subject,
          capability: by?.capability,
          of,
          value: index,
          alternatives: same.map(
            (_: IAutoMovieScheduleCue, i: number): string => String(i),
          ),
        },
      );
    return found.seconds;
  }

  /**
   * The intent a part begins with.
   *
   * @param node The part.
   * @returns The first intent of a sequence or group, an intent itself, or
   *   undefined for an `at` or an empty group.
   */
  export function leading(
    node: IAutoMovieComposition,
  ): IAutoMovieIntent | undefined {
    return node.type === "intent"
      ? node.intent
      : node.type === "at" || node.parts[0] === undefined
        ? undefined
        : leading(node.parts[0]);
  }
}
