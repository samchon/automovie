import type { IAutoMovieInteractionEvent, IAutoMovieMotionHumanHitTrack, IAutoMovieMotionHumanPerformanceState, IAutoMovieResolveContactEvents, IAutoMovieResolveSchedule, IAutoMovieVector3 } from "@automovie/interface";

import { resolveAutoMovieContactEvents } from "@automovie/engine";

import { HumanColliders } from "../posture/HumanColliders";
import { HumanPerformanceContacts } from "./HumanPerformanceContacts";
import { HumanPerformanceHits } from "./HumanPerformanceHits";
import { HumanPerformanceRead } from "./HumanPerformanceRead";

/**
 * A struck subject's hits as a track of named instants, so an action is
 * synced to a hit as to any instant (#3480: `sync({ hit })`).
 *
 * The track of `on` is named `hit:<on>`, or `hit:<on>:<by>` for the hits by
 * one striking prop or anchored striker; each hit is an instant named
 * `hit`, in time order. The schedule asks for it when an action is placed
 * (`resolveAutoMovieSchedule.ILaws.instants`), so the strikers must be
 * composed before the struck performer, as a pursuit is. While the schedule
 * is being placed the melee stops are not resolved yet, so each placed
 * weapon of another person is swept against the struck person alone, as
 * their placed poses show them (`resolveAutoMovieContactEvents`); the
 * flights and the blasts are the hit record's own. Once everything is
 * placed the record's resolved hits are read instead.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the track's name, its instants, when it is read, what it reads while placing and after.
 * @evidence contracts/development/design.md#principled-representation A track of the schedule's own named instants, so a hit is addressed exactly as a cue is.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The hit's address, the track's name and its instants.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The hits are the record's; the provisional sweep uses the one contact resolver.
 */
export namespace HumanHitTrack {

  /** The instant name of every hit on a track. */
  export const EVENT: string = "hit";

  /** The prefix of a hit track's name. */
  export const PREFIX: string = "hit:";

  /**
   * The name of a hit's track.
   *
   * @param hit The hit.
   * @returns `hit:<on>` or `hit:<on>:<by>`.
   */
  export function name(hit: IAutoMovieMotionHumanHitTrack.IHit): string {
    return hit.by === undefined
      ? `${PREFIX}${hit.on}`
      : `${PREFIX}${hit.on}:${hit.by}`;
  }

  /**
   * A hit track's instants, or undefined for a name that is no hit track.
   *
   * @param self The performance being placed.
   * @param of The track's name.
   * @returns The instants.
   */
  export function instants(
    self: IAutoMovieMotionHumanPerformanceState,
    of: string,
  ): readonly IAutoMovieResolveSchedule.ICue[] | undefined {
    if (!of.startsWith(PREFIX)) return undefined;
    const [on, by] = of.slice(PREFIX.length).split(":") as [
      string,
      string | undefined,
    ];
    const hits: readonly IAutoMovieInteractionEvent[] = self.resolving
      ? [...provisional(self, on), ...HumanPerformanceHits.hits(self, on)]
      : HumanPerformanceHits.hits(self, on);
    return hits
      .filter(
        (h: IAutoMovieInteractionEvent): boolean =>
          h.target === on &&
          (by === undefined || h.actor === by || h.object === by),
      )
      .map(
        (h: IAutoMovieInteractionEvent): IAutoMovieResolveSchedule.ICue => ({
          name: EVENT,
          seconds: h.time,
        }),
      )
      .sort(
        (a: IAutoMovieResolveSchedule.ICue, b: IAutoMovieResolveSchedule.ICue) =>
          a.seconds - b.seconds,
      );
  }

  /** The melee hits on a person while placing: each placed weapon of another person swept against them alone. */
  function provisional(
    self: IAutoMovieMotionHumanPerformanceState,
    on: string,
  ): IAutoMovieInteractionEvent[] {
    const struck = self.people.get(on);
    if (struck === undefined) return [];
    const out: IAutoMovieInteractionEvent[] = [];
    for (const person of self.people.values()) {
      if (person === struck) continue;
      for (const segment of person.segments)
        for (const w of segment.plan.weapons ?? []) {
          const from: number = Math.max(w.from, segment.entryTime);
          const to: number = Math.min(w.to, segment.end);
          if (!(to > from)) continue;
          const tail = w.tail;
          const events: IAutoMovieResolveContactEvents.IEvent[] =
            resolveAutoMovieContactEvents({
              weapons: [
                {
                  id: w.id,
                  owner: person.performer.subject,
                  radius: w.radius,
                  position: (t: number): IAutoMovieVector3 => w.path(t),
                  ...(tail === undefined
                    ? {}
                    : {
                        tail: (t: number): IAutoMovieVector3 => tail(t),
                        ...(w.tailRadius === undefined
                          ? {}
                          : { tailRadius: w.tailRadius }),
                      }),
                },
              ],
              bodies: [
                {
                  id: on,
                  distance: (p: IAutoMovieVector3, t: number): number =>
                    HumanColliders.distance(
                      struck.performer.body,
                      HumanPerformanceRead.bones(self, on, t),
                      p,
                    ).distance,
                  axis: (
                    a: IAutoMovieVector3,
                    b: IAutoMovieVector3,
                    t: number,
                    _: IAutoMovieResolveContactEvents.IStops,
                    taper?: readonly [number, number],
                  ): number =>
                    HumanColliders.distanceToSegment(
                      struck.performer.body,
                      HumanPerformanceRead.bones(self, on, t),
                      a,
                      b,
                      taper,
                    ).distance,
                },
              ],
              from,
              to,
              step: HumanPerformanceContacts.STEP,
            });
          for (const e of events)
            out.push({
              id: `hit:${person.performer.subject}:${w.id}:${on}:${e.seconds.toFixed(6)}`,
              kind: "hit",
              source: "collisionSolver",
              time: e.seconds,
              actor: person.performer.subject,
              target: on,
              object: null,
              point: w.path(e.seconds),
              actionIndex: segment.entry,
              reaction: null,
            });
        }
    }
    return out;
  }
}
