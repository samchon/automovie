import { AffordanceArticulation, Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionPlan } from "../law/IHumanActionPlan";
import { HumanPerformanceLayers } from "./HumanPerformanceLayers";
import type { HumanPerformanceState } from "./HumanPerformanceState";
import type { HumanSegment } from "./HumanSegment";
import type { IHumanProp } from "./IHumanProp";

/**
 * The state of the props' articulations over the film: what the acts drive
 * (`IHumanActionPlan.drives`) and what the props run themselves
 * (`IHumanProp.tracks`), as one input per coupled degree at each second, and
 * a prop's contacts posed at that state.
 *
 * At a second, a coupled degree of freedom is set by the latest drive or track
 * that has begun: inside its window it gives its own travel, after the window
 * its last travel holds, as a released prop stays where it was released; one
 * nothing has begun to move stays at rest. Its state keeps that writer's own
 * coordinate, replacing an earlier writer of another coordinate of the same
 * degree. Two drives of one independent degree of freedom
 * that overlap in time are refused, naming both actions, because no rule
 * says which hand wins. This is the smart-object coupling of Kallmann and
 * Thalmann (1999, Modeling Objects for Interaction Tasks): the object
 * declares how it moves, the act drives it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what sets a travel, what holds after a drive, what is refused and the pattern's source.
 * @evidence contracts/development/design.md#principled-representation Timed writers name their authored coordinate and its independent degree of freedom; the latest begun writer of each degree supplies one input to the prop's own articulate function.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The state, the posed point, the admission and the writers' list.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A drive never moves the prop's frame; the travel is the act's own function.
 */
export namespace HumanPerformanceObject {
  /** One timed writer of an articulation's travel. */
  export interface IWriter {
    /** The articulation affordance. */
    articulation: string;

    /** The independent degree of freedom this coordinate addresses. */
    leader: string;

    /** Film second it begins. */
    from: number;

    /** Film second it ends. */
    to: number;

    /** The travel at a film second inside the window. */
    travel(seconds: number): number;

    /** The action that drives it, or undefined for the prop's own track. */
    source?: HumanSegment.ISegment & { subject: string };
  }

  /**
   * Every writer of a prop's articulations in film order, with its independent
   * degree resolved once: each placed action's drives, clipped to its active
   * span, and the prop's own tracks from their instants. Kept only after all
   * actions and their final clipped ends have been placed.
   *
   * @param self The performance.
   * @param prop The prop.
   * @returns The writers, by their start.
   */
  export function writers(
    self: HumanPerformanceState,
    prop: IHumanProp,
  ): readonly IWriter[] {
    const known: readonly IWriter[] | undefined = WRITERS.get(self)?.get(
      prop.subject,
    );
    if (known !== undefined) return known;
    const out: IWriter[] = [];
    const byId: ReadonlyMap<string, IAutoMovieAffordance> = new Map(
      (prop.affordances ?? []).map((a: IAutoMovieAffordance): [string, IAutoMovieAffordance] => [a.id, a]),
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
          const own: IHumanActionPlan.IDrive = drive;
          out.push({
            articulation: own.articulation,
            leader: AffordanceArticulation.leader(byId, own.articulation) ?? own.articulation,
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
        leader: AffordanceArticulation.leader(byId, track.articulation) ?? track.articulation,
        from,
        to: from + (track.duration ?? Infinity),
        travel: (seconds: number): number => track.travel(seconds - from),
      });
    }
    out.sort((a: IWriter, b: IWriter): number => a.from - b.from);
    if (!self.resolving) {
      const kept: Map<string, readonly IWriter[]> =
        WRITERS.get(self) ?? new Map();
      kept.set(prop.subject, out);
      WRITERS.set(self, kept);
    }
    return out;
  }

  /**
   * One input per coupled degree of freedom moved by a film second, in its
   * latest writer's coordinate. A new writer replaces the old coordinate;
   * after its end its last travel holds. Other degrees start at rest.
   *
   * @param self The performance.
   * @param prop The prop.
   * @param seconds Film seconds.
   * @returns Travel by articulation id.
   */
  export function state(
    self: HumanPerformanceState,
    prop: IHumanProp,
    seconds: number,
  ): Record<string, number> {
    const out: Record<string, number> = {};
    const latest: Map<string, IWriter> = new Map();
    for (const w of writers(self, prop)) {
      if (w.from > seconds) break;
      latest.set(w.leader, w);
    }
    for (const w of latest.values())
      out[w.articulation] = w.travel(Math.min(seconds, w.to));
    return out;
  }

  /**
   * A named point of a prop in the prop's own frame at a film second: where
   * its posed contact is when something has moved the prop's parts, its rest
   * place otherwise.
   *
   * @param self The performance.
   * @param prop The prop.
   * @param id The point's name.
   * @param seconds Film seconds.
   * @returns The point and its outward normal in the prop's frame, or undefined when the prop has no such point.
   */
  export function point(
    self: HumanPerformanceState,
    prop: IHumanProp,
    id: string,
    seconds: number,
  ): { point: IAutoMovieVector3; normal: IAutoMovieVector3 } | undefined {
    const rest = prop.points[id];
    if (rest === undefined || prop.articulate === undefined) return rest;
    if (writers(self, prop).length === 0) return rest;
    const posed: IHumanProp.IPosed = pose(self, prop, seconds);
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
   * A prop posed at its state at a film second, the last one read kept per
   * prop, so the many reads of one instant (every contact of every hand at a
   * frame) pose it once.
   *
   * @param self The performance.
   * @param prop The prop, which articulates.
   * @param seconds Film seconds.
   * @returns The posed contacts and colliders.
   */
  export function pose(
    self: HumanPerformanceState,
    prop: IHumanProp,
    seconds: number,
  ): IHumanProp.IPosed {
    const kept: Map<string, { seconds: number; posed: IHumanProp.IPosed }> =
      POSED.get(self) ?? new Map();
    const last = kept.get(prop.subject);
    if (last !== undefined && last.seconds === seconds && !self.resolving)
      return last.posed;
    const posed: IHumanProp.IPosed = prop.articulate!(
      state(self, prop, seconds),
    );
    if (!self.resolving) {
      kept.set(prop.subject, { seconds, posed });
      POSED.set(self, kept);
    }
    return posed;
  }

  /**
   * Admit the placed performance's drives: two drives of one independent degree
   * of freedom of one prop that overlap in time are refused, naming both actions, and a
   * drive whose travel leaves its articulation's range is refused where the
   * prop poses it, with the action and the second.
   *
   * @param self The placed performance.
   * @throws {HumanRefusal} A `cut` refusal for overlapping drives; a `parameter` refusal for a travel out of range.
   */
  export function admit(self: HumanPerformanceState): void {
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

  /** The writers kept per placed performance and prop. */
  const WRITERS: WeakMap<
    HumanPerformanceState,
    Map<string, readonly IWriter[]>
  > = new WeakMap();

  /** The last posed prop read per performance and prop. */
  const POSED: WeakMap<
    HumanPerformanceState,
    Map<string, { seconds: number; posed: IHumanProp.IPosed }>
  > = new WeakMap();
}
