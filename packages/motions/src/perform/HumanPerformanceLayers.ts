import {
  type IAutoMovieSchedule,
  resolveAutoMovieSchedule,
} from "@automovie/engine";

import type { AutoMovieMotionHumanChannel } from "../compose/AutoMovieMotionHumanChannel";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanLayer } from "../law/IHumanLayer";
import type { HumanPerformanceState } from "./HumanPerformanceState";
import { HumanSegment } from "./HumanSegment";

/**
 * The instants of a performance and the windows of its layers: an instant
 * named by film seconds, by an action's event, by a cue or by another
 * layer, and a scheduled layer placed between two of them.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what an instant may name and what a window is.
 * @evidence contracts/development/design.md#principled-representation An instant resolves to film seconds through the schedule's own anchors and cue tracks.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The instant reader `HumanPerformance` exposes, a layer's four instants and its window (#3399).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts An unknown anchor or an instant not yet placed is refused, never read as zero.
 */
export namespace HumanPerformanceLayers {
  /**
   * The film second of an instant: a second as given, or a named instant of
   * an anchored action or of a cue track.
   *
   * @param at The instant.
   * @returns The film second.
   * @throws {HumanRefusal} When nothing is anchored or tracked under the name, or it has no such event.
   */
  export function instant(
    self: HumanPerformanceState,
    at: IHumanLayer.Instant,
  ): number {
    if (typeof at === "number") return at;
    const placed = self.anchors.get(at.of);
    // A layer's instants are known once its window is placed; a layer later
    // in a person's list, or one that waits for an action, is not placed
    // yet when an earlier window asks for it.
    const waiting: readonly resolveAutoMovieSchedule.ICue[] | undefined =
      self.layered.get(at.of);
    const track: readonly resolveAutoMovieSchedule.ICue[] | undefined =
      self.cues[at.of] ??
      (waiting === undefined || waiting.length === 0 ? undefined : waiting);
    if (placed === undefined && track === undefined)
      throw new HumanRefusal({
        kind: "participant",
        axis: "of",
        value: at.of,
        feasible: {
          kind: "alternatives",
          values: [
            ...self.anchors.keys(),
            ...Object.keys(self.cues),
            ...[...self.layered]
              .filter(
                ([, cues]: [
                  string,
                  readonly resolveAutoMovieSchedule.ICue[],
                ]): boolean => cues.length !== 0,
              )
              .map(
                ([name]: [
                  string,
                  readonly resolveAutoMovieSchedule.ICue[],
                ]): string => name,
              ),
          ],
        },
        reason:
          waiting === undefined
            ? `nothing is anchored ${at.of}, and no cue track or layer has that name`
            : `the layer anchored ${at.of} is not placed yet: its window waits for an action, or it comes later in its person's layers`,
        fix:
          waiting === undefined
            ? "name an action's anchor, a cue track or an anchored layer"
            : "name a layer given earlier in the list, or give that layer a window of film seconds and cue instants",
      });
    const entry: IAutoMovieSchedule.IEntry | undefined =
      placed === undefined
        ? undefined
        : self.schedule.entries.find(
            (e: IAutoMovieSchedule.IEntry): boolean => e.index === placed.entry,
          );
    if (placed !== undefined && at.event === undefined)
      return (entry?.contact ?? placed.entryTime) + (at.offset ?? 0);
    const events: readonly resolveAutoMovieSchedule.ICue[] =
      placed === undefined
        ? track!
        : [
            { name: "start", seconds: placed.entryTime },
            ...placed.plan.events.map((e) => ({
              name: e.name,
              seconds: placed.start + e.share * placed.plan.duration,
            })),
            {
              name: "end",
              seconds:
                entry === undefined
                  ? placed.end
                  : (self.clipped.get(entry.index) ?? entry.end),
            },
          ];
    const found: resolveAutoMovieSchedule.ICue | undefined = events.filter(
      (e: resolveAutoMovieSchedule.ICue): boolean => e.name === at.event,
    )[at.index ?? 0];
    if (found === undefined)
      throw new HumanRefusal({
        kind: "parameter",
        axis: "event",
        value:
          at.index === undefined ? at.event : `${at.event} (index ${at.index})`,
        feasible: {
          kind: "alternatives",
          values: [
            ...new Set(
              events.map((e: resolveAutoMovieSchedule.ICue): string => e.name),
            ),
          ],
        },
        reason: `${at.of} has no such instant`,
        fix: "name one of its events, or a lower index of a repeated one",
      });
    return found.seconds + (at.offset ?? 0);
  }

  /**
   * A layer window's own named instants: it starts coming in at `onset`, is
   * fully in at `full`, starts going out at `offset` and is gone at `end`.
   * The fade is the one the window is displayed with: the one asked, 0.3 s
   * when none is, and never more than half the window.
   */
  export function instants(
    from: number,
    to: number,
    fade: number | undefined,
  ): resolveAutoMovieSchedule.ICue[] {
    const ramp: number = Math.max(0, Math.min(fade ?? 0.3, (to - from) / 2));
    return [
      { name: "onset", seconds: from },
      { name: "full", seconds: from + ramp },
      { name: "offset", seconds: to - ramp },
      { name: "end", seconds: to },
    ];
  }

  /** A scheduled layer's window in film seconds, refused where one of the person's actions holds a channel it writes. */
  export function window(
    self: HumanPerformanceState,
    person: HumanSegment.IPerson,
    scheduled: IHumanLayer.IScheduled,
  ): HumanSegment.ILayered {
    const from: number =
      scheduled.from === undefined
        ? 0
        : HumanPerformanceLayers.instant(self, scheduled.from);
    const to: number =
      scheduled.to === undefined
        ? self.schedule.duration
        : HumanPerformanceLayers.instant(self, scheduled.to);
    const layer: IHumanLayer =
      typeof scheduled.layer === "function"
        ? scheduled.layer({ from, to })
        : scheduled.layer;
    const located = (refusal: HumanRefusal.IProps): HumanRefusal =>
      new HumanRefusal({ performer: person.performer.subject, ...refusal });
    if (!(to > from))
      throw located({
        kind: "parameter",
        axis: "layers",
        value: layer.name,
        reason: `the layer ${layer.name} would run from ${from.toFixed(2)} s to ${to.toFixed(2)} s`,
        fix: "end the layer after it starts",
      });
    const fade: number = Math.min(scheduled.fade ?? 0.3, (to - from) / 2);
    for (const segment of person.segments) {
      const D: number = segment.plan.duration;
      for (const contact of segment.plan.contacts) {
        const held: AutoMovieMotionHumanChannel[] =
          contact.part === "leftHand" || contact.part === "rightHand"
            ? contact.part === "leftHand"
              ? ["leftHand", "leftArm"]
              : ["rightHand", "rightArm"]
            : contact.part === "leftUpperArm" || contact.part === "leftLowerArm"
              ? ["leftArm"]
              : contact.part === "rightUpperArm" ||
                  contact.part === "rightLowerArm"
                ? ["rightArm"]
                : contact.part === "leftFoot"
                  ? ["leftLeg"]
                  : contact.part === "rightFoot"
                    ? ["rightLeg"]
                    : [];
        const taken: AutoMovieMotionHumanChannel[] = held.filter(
          (c: AutoMovieMotionHumanChannel): boolean =>
            layer.channels?.includes(c) === true,
        );
        const since: number = Math.max(
          from,
          segment.entryTime,
          segment.start + contact.from * D,
        );
        const until: number = Math.min(
          to,
          segment.end,
          segment.start + contact.to * D,
        );
        if (taken.length !== 0 && until > since + 1e-9)
          throw located({
            kind: "channel",
            axis: "layers",
            value: layer.name,
            reason: `the layer ${layer.name} writes ${taken.join(", ")}, which ${segment.name} holds by a ${contact.kind} of the ${contact.part} from ${since.toFixed(2)} s to ${until.toFixed(2)} s`,
            fix: "end the layer before that contact or start it after, or use a layer that leaves that limb alone",
          });
      }
    }
    if (scheduled.anchor !== undefined) {
      if (self.anchors.has(scheduled.anchor))
        throw located({
          kind: "parameter",
          axis: "layers",
          value: scheduled.anchor,
          reason: `the layer anchor ${scheduled.anchor} is also the anchor of an action, so an instant of that name would be ambiguous`,
          fix: "give the layer a name no action is anchored under",
        });
      self.layered.set(
        scheduled.anchor,
        HumanPerformanceLayers.instants(from, to, scheduled.fade),
      );
    }
    return { layer, from, to, fade };
  }
}
