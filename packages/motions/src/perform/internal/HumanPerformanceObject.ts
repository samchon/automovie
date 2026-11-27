import { AffordanceArticulation, Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanPerformanceState,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionPropDrive,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { HumanPerformanceLayers } from "./HumanPerformanceLayers";

/** The record of `IPointResult`'s site. */
type IPointResult = { point: IAutoMovieVector3; normal: IAutoMovieVector3 };

/**
 * The state of the props' articulations over the film: what the acts drive
 * (`IHumanActionPlan.drives`) and what the props run themselves
 * (`IHumanProp.tracks`), as one input per coupled degree at each second, and a
 * prop's contacts posed at that state.
 *
 * At a second, a coupled degree of freedom is set by the latest drive or track
 * that has begun: inside its window it gives its own travel, after the window
 * its last travel holds, as a released prop stays where it was released; one
 * nothing has begun to move stays at rest. Its state keeps that writer's own
 * coordinate, replacing an earlier writer of another coordinate of the same
 * degree. Two drives of one independent degree of freedom that overlap in time
 * are refused, naming both actions, because no rule says which hand wins. This
 * is the smart-object coupling of Kallmann and Thalmann (1999, Modeling Objects
 * for Interaction Tasks): the object declares how it moves, the act drives it.
 */
export namespace HumanPerformanceObject {
  /**
   * One timed writer of an articulation's travel, the performance's record
   * (`IAutoMovieMotionHumanPerformanceState.IWriter`).
   */
  export type IWriter = IAutoMovieMotionHumanPerformanceState.IWriter;

  /**
   * Every writer of a prop's articulations in film order, with its independent
   * degree resolved once: each placed action's drives, clipped to its active
   * span, and the prop's own tracks from their instants: those the performance
   * prepared once every action and its final clipped end was placed, or, while
   * the schedule is resolved, those placed now.
   *
   * @param self The performance.
   * @param prop The prop.
   * @returns The writers, by their start.
   */
  export function writers(
    self: IAutoMovieMotionHumanPerformanceState,
    prop: IAutoMovieMotionHumanProp,
  ): readonly IWriter[] {
    return self.writers.get(prop.subject) ?? collect(self, prop);
  }

  /**
   * Collect a prop's writers from the placed actions and its tracks
   * ({@link writers}): what the performance prepares.
   *
   * @param self The performance.
   * @param prop The prop.
   * @returns The writers, by their start.
   */
  export function collect(
    self: IAutoMovieMotionHumanPerformanceState,
    prop: IAutoMovieMotionHumanProp,
  ): IWriter[] {
    const out: IWriter[] = [];
    const byId: ReadonlyMap<string, IAutoMovieAffordance> = new Map(
      (prop.affordances ?? []).map(
        (a: IAutoMovieAffordance): [string, IAutoMovieAffordance] => [a.id, a],
      ),
    );
    for (const person of self.people.values())
      for (const segment of [...person.segments, ...person.overlays])
        for (const drive of segment.plan.drives ?? []) {
          if (drive.prop !== prop.subject) continue;
          const duration: number = segment.plan.duration;
          const from: number = Math.max(
            segment.entryTime,
            segment.start + drive.from * duration,
          );
          const to: number = Math.min(
            segment.end,
            segment.start + drive.to * duration,
          );
          if (!(to >= from)) continue;
          const own: IAutoMovieMotionPropDrive = drive;
          out.push({
            articulation: own.articulation,
            leader:
              AffordanceArticulation.leader(byId, own.articulation) ??
              own.articulation,
            from,
            to,
            travel: (seconds: number): number =>
              own.travel(seconds - segment.start),
            source: { ...segment, subject: person.performer.subject },
          });
        }
    for (const track of prop.tracks ?? []) {
      const from: number = HumanPerformanceLayers.instant(self, track.start);
      out.push({
        articulation: track.articulation,
        leader:
          AffordanceArticulation.leader(byId, track.articulation) ??
          track.articulation,
        from,
        to: from + (track.duration ?? Infinity),
        travel: (seconds: number): number => track.travel(seconds - from),
      });
    }
    out.sort((a: IWriter, b: IWriter): number => a.from - b.from);
    return out;
  }

  /**
   * One input per coupled degree of freedom moved by a film second, in its
   * latest writer's coordinate. A new writer replaces the old coordinate; after
   * its end its last travel holds. Other degrees start at rest.
   *
   * @param self The performance.
   * @param prop The prop.
   * @param seconds Film seconds.
   * @returns Travel by articulation id.
   */
  export function state(
    self: IAutoMovieMotionHumanPerformanceState,
    prop: IAutoMovieMotionHumanProp,
    seconds: number,
  ): Record<string, number> {
    return travel(writers(self, prop), seconds);
  }

  /**
   * The travel a prop's writers in film order give at a film second
   * ({@link state}): each independent degree in its latest begun writer's
   * coordinate, read within that writer's window and held at its end.
   *
   * @param ordered The writers, by their start.
   * @param seconds Film seconds.
   * @returns Travel by articulation id.
   */
  export function travel(
    ordered: readonly IWriter[],
    seconds: number,
  ): Record<string, number> {
    const out: Record<string, number> = {};
    const latest: Map<string, IWriter> = new Map();
    for (const w of ordered) {
      if (w.from > seconds) break;
      latest.set(w.leader, w);
    }
    for (const w of latest.values())
      out[w.articulation] = w.travel(Math.min(seconds, w.to));
    return out;
  }

  /**
   * A named point of a prop in the prop's own frame at a film second: where its
   * posed contact is when something has moved the prop's parts, its rest place
   * otherwise.
   *
   * @param self The performance.
   * @param prop The prop.
   * @param id The point's name.
   * @param seconds Film seconds.
   * @returns The point and its outward normal in the prop's frame, or undefined
   *   when the prop has no such point.
   */
  export function point(
    self: IAutoMovieMotionHumanPerformanceState,
    prop: IAutoMovieMotionHumanProp,
    id: string,
    seconds: number,
  ): IPointResult | undefined {
    const rest = prop.points[id];
    if (rest === undefined || prop.articulate === undefined) return rest;
    if (writers(self, prop).length === 0) return rest;
    const posed: IAutoMovieMotionHumanProp.IPosed = pose(self, prop, seconds);
    const found: IAutoMovieAffordance | undefined = posed.affordances.find(
      (a: IAutoMovieAffordance): boolean => a.id === id,
    );
    if (found === undefined) return rest;
    return {
      point: found.frame.translation,
      normal: Quaternion.rotateVector(found.frame.rotation, {
        x: 0,
        y: 1,
        z: 0,
      }),
    };
  }

  /**
   * A prop posed at its state at a film second.
   *
   * @param self The performance.
   * @param prop The prop, which articulates.
   * @param seconds Film seconds.
   * @returns The posed contacts and colliders.
   */
  export function pose(
    self: IAutoMovieMotionHumanPerformanceState,
    prop: IAutoMovieMotionHumanProp,
    seconds: number,
  ): IAutoMovieMotionHumanProp.IPosed {
    return prop.articulate!(state(self, prop, seconds));
  }

  /**
   * Admit the placed performance's drives: two drives of one independent degree
   * of freedom of one prop that overlap in time are refused, naming both
   * actions, and a drive whose travel leaves its articulation's range is
   * refused where the prop poses it, with the action and the second.
   *
   * @param self The placed performance.
   * @throws {HumanRefusal} A `cut` refusal for overlapping drives; a
   *   `parameter` refusal for a travel out of range.
   */
  export function admit(self: IAutoMovieMotionHumanPerformanceState): void {
    for (const prop of self.props.values()) {
      const all: readonly IWriter[] = writers(self, prop);
      const driven: IWriter[] = all.filter(
        (w: IWriter): boolean => w.source !== undefined,
      );
      for (let i: number = 0; i < driven.length; i++)
        for (let j: number = i + 1; j < driven.length; j++) {
          const a: IWriter = driven[i]!;
          const b: IWriter = driven[j]!;
          if (a.leader !== b.leader || b.from >= a.to) continue;
          throw new HumanRefusal({
            kind: "cut",
            performer: b.source!.subject,
            act: b.source!.name,
            axis: "drives",
            value: `${prop.subject}.${a.leader}`,
            feasible: {
              kind: "range",
              minimum: Math.ceil(a.to * 1000) / 1000,
              maximum: null,
              unit: "s",
            },
            reason: `${a.source!.subject}'s ${a.source!.name} drives ${prop.subject}'s ${a.articulation} from ${a.from.toFixed(2)} s to ${a.to.toFixed(2)} s, and ${b.source!.subject}'s ${b.source!.name} drives it from ${b.from.toFixed(2)} s, while the first still does`,
            fix: `start ${b.source!.name} after ${a.source!.name} lets go of ${a.articulation}`,
          });
        }
      if (prop.articulate === undefined) continue;
      for (const w of driven)
        for (const at of [w.from, w.to])
          try {
            prop.articulate(state(self, prop, at));
          } catch (error) {
            throw new HumanRefusal({
              kind: "parameter",
              performer: w.source!.subject,
              act: w.source!.name,
              axis: "drives",
              value: w.travel(at),
              reason: `${w.source!.name} drives ${prop.subject}'s ${w.articulation} to ${w.travel(at).toFixed(3)} at ${at.toFixed(2)} s, which the prop refuses: ${(error as Error).message}`,
              fix: `drive ${w.articulation} within its range`,
            });
          }
    }
  }
}
