import type {
  AutoMovieMotionHumanChannel,
  AutoMovieMotionHumanScheduledInstant,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanRefusal,
  IAutoMovieMotionHumanSegment,
  IAutoMovieScheduleCue,
  IAutoMovieScheduleEntry,
} from "@automovie/interface";

import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { HumanSegment } from "./HumanSegment";

/*
 * The instants of a performance and the windows of its layers: an instant named
 * by film seconds, by an action's event, by a cue or by another layer, and a
 * scheduled layer placed between two of them.
 */
export namespace HumanPerformanceLayers {
  /*
   * The film second of an instant: a second as given, or a named instant of an
   * anchored action or of a cue track. An action contributes only the events
   * it plays within its realized interval, including its exact cut instant.
   * Parameter at: The instant.
   * Parameter entries: Earlier schedule entries available while placing an action.
   * Returns: The film second.
   * When nothing is anchored or tracked under the name,
   * or it has no such event.
   */
  export function instant(
    self: IAutoMovieMotionHumanPerformanceState,
    at: AutoMovieMotionHumanScheduledInstant,
    entries?: readonly IAutoMovieScheduleEntry[],
  ): number {
    if (typeof at === "number") return at;
    const placed = self.anchors.get(at.of);
    // A layer's instants are known once its window is placed; a layer later
    // in a person's list, or one that waits for an action, is not placed
    // yet when an earlier window asks for it.
    const waiting: readonly IAutoMovieScheduleCue[] | undefined =
      self.layered.get(at.of);
    const track: readonly IAutoMovieScheduleCue[] | undefined =
      self.cues[at.of] ??
      (waiting === undefined || waiting.length === 0 ? undefined : waiting);
    if (placed === undefined && track === undefined)
      throw new AutoMovieMotionHumanRefusal({
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
                  readonly IAutoMovieScheduleCue[],
                ]): boolean => cues.length !== 0,
              )
              .map(
                ([name]: [string, readonly IAutoMovieScheduleCue[]]): string =>
                  name,
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
    const entry: IAutoMovieScheduleEntry | undefined =
      placed === undefined
        ? undefined
        : (entries ?? self.schedule?.entries)?.find(
            (e: IAutoMovieScheduleEntry): boolean => e.index === placed.entry,
          );
    let events: readonly IAutoMovieScheduleCue[] = track ?? [];
    if (placed !== undefined) {
      const start: number = placed.entryTime;
      const end: number =
        entry === undefined
          ? placed.end
          : (self.clipped.get(entry.index) ?? entry.end);
      if (at.event === undefined) {
        const contact: number | undefined = entry?.contact;
        return (
          (contact !== undefined && contact >= start && contact <= end
            ? contact
            : start) + (at.offset ?? 0)
        );
      }
      // Placement stores plan events on the film clock. Reuse that conversion
      // so an exact cut and the event defining it compare as the same second.
      const planned: readonly IAutoMovieScheduleCue[] =
        entry?.events ??
        placed.plan.events.map(
          (e): IAutoMovieScheduleCue => ({
            name: e.name,
            seconds: placed.start + e.share * placed.plan.duration,
          }),
        );
      events = [
        { name: "start", seconds: start },
        ...planned.filter(
          (event: IAutoMovieScheduleCue): boolean =>
            event.seconds >= start && event.seconds <= end,
        ),
        { name: "end", seconds: end },
      ];
    }
    const found: IAutoMovieScheduleCue | undefined = events.filter(
      (e: IAutoMovieScheduleCue): boolean => e.name === at.event,
    )[at.index ?? 0];
    if (found === undefined)
      throw new AutoMovieMotionHumanRefusal({
        kind: "parameter",
        axis: "event",
        value:
          at.index === undefined ? at.event : `${at.event} (index ${at.index})`,
        feasible: {
          kind: "alternatives",
          values: [
            ...new Set(
              events.map((e: IAutoMovieScheduleCue): string => e.name),
            ),
          ],
        },
        reason: `${at.of} has no such instant`,
        fix: "name one of its events, or a lower index of a repeated one",
      });
    return found.seconds + (at.offset ?? 0);
  }

  /*
   * A layer window's own named instants: it starts coming in at `onset`, is
   * fully in at `full`, starts going out at `offset` and is gone at `end`. The
   * fade is the one the window is displayed with: the one asked, an overlay's
   * (`HumanSegment.FADE`) when none is, and never more than half the window.
   */
  export function instants(
    from: number,
    to: number,
    fade: number | undefined,
  ): IAutoMovieScheduleCue[] {
    const ramp: number = Math.max(
      0,
      Math.min(fade ?? HumanSegment.FADE, (to - from) / 2),
    );
    return [
      { name: "onset", seconds: from },
      { name: "full", seconds: from + ramp },
      { name: "offset", seconds: to - ramp },
      { name: "end", seconds: to },
    ];
  }

  /*
   * A scheduled layer's window in film seconds, refused where one of the
   * person's actions holds a channel it writes.
   */
  export function window(
    self: IAutoMovieMotionHumanPerformanceState,
    person: IAutoMovieMotionHumanSegment.IPerson,
    scheduled: IAutoMovieMotionHumanLayer.IScheduled,
  ): IAutoMovieMotionHumanSegment.ILayered {
    const from: number =
      scheduled.from === undefined
        ? 0
        : HumanPerformanceLayers.instant(self, scheduled.from);
    const to: number =
      scheduled.to === undefined
        ? self.schedule.duration
        : HumanPerformanceLayers.instant(self, scheduled.to);
    const layer: IAutoMovieMotionHumanLayer =
      typeof scheduled.layer === "function"
        ? scheduled.layer({ from, to })
        : scheduled.layer;
    const located = (
      refusal: IAutoMovieMotionHumanRefusal.IProps,
    ): IAutoMovieMotionHumanRefusal =>
      new AutoMovieMotionHumanRefusal({
        performer: person.performer.subject,
        ...refusal,
      });
    if (!(to > from))
      throw located({
        kind: "parameter",
        axis: "layers",
        value: layer.name,
        reason: `the layer ${layer.name} would run from ${from.toFixed(2)} s to ${to.toFixed(2)} s`,
        fix: "end the layer after it starts",
      });
    const fade: number = Math.min(
      scheduled.fade ?? HumanSegment.FADE,
      (to - from) / 2,
    );
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
