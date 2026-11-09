import type { IAutoMovieSchedule } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { Student } from "../../entities/cast/student/Student";
import type { IStageSet } from "../../entities/sets/IStageSet";
import { IBodyState } from "../../laws/body/IBodyState";
import { Gait } from "../../laws/everyday/Gait";
import type { StageAction } from "../../laws/staging/StageAction";
import { RiderMotion } from "../flight/RiderMotion";
import type { IStageWorld } from "./IStageWorld";
import { PropPoint } from "./PropPoint";

/**
 * What the stage laws see while one intent is placed: the world and the
 * entries placed so far. It resolves a target to a world point and finds a
 * subject's latest body state, so every relation is read from the schedule
 * rather than written as a coordinate in a scene.
 *
 * ```ts
 * const context = new StageContext(world, entries, start);
 * context.point({ subject: "harry" }); // Harry's floor point as placed so far
 * ```
 *
 * @evidence contracts/development/behaviors.md#relational-goals Targets resolve to the counterpart's placed state or the set's named place, never to a scene coordinate.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation Reads only the frozen entries placed before the current intent.
 * @evidence contracts/development/common.md#meaningful-documentation States what it resolves and from what.
 * @evidence contracts/development/implementation.md#efficient-algorithms A latest-state lookup scans the entries placed so far once, linear in their number.
 */
export class StageContext {
  /** The world. */
  public readonly world: IStageWorld;

  /** Entries placed so far. */
  public readonly entries: readonly IAutoMovieSchedule.IEntry[];

  /** The current intent's start, seconds. */
  public readonly time: number;

  /** The previous resolution pass, whose states answer for subjects placed later in walk order. */
  public readonly previous: IAutoMovieSchedule | undefined;

  /**
   * A context.
   *
   * @param world The world.
   * @param entries Entries placed so far.
   * @param time The current intent's start.
   * @param previous The previous resolution pass, if any.
   */
  public constructor(world: IStageWorld, entries: readonly IAutoMovieSchedule.IEntry[], time: number, previous?: IAutoMovieSchedule) {
    this.world = world;
    this.entries = entries;
    this.time = time;
    this.previous = previous;
  }

  /** A student's own latest placed state: the state its next intent starts from. */
  public self(subject: string): IBodyState {
    const s: IStageWorld.Step | undefined = this.step(subject);
    if (!s || s.kind !== "student") throw new Error(`${subject} acts before entering the stage`);
    return s.to;
  }

  /** The latest entry matching a predicate among the placed entries, else in the previous pass. */
  public find(match: (e: IAutoMovieSchedule.IEntry) => boolean): IAutoMovieSchedule.IEntry | undefined {
    for (let k = this.entries.length - 1; k >= 0; k--) if (match(this.entries[k]!)) return this.entries[k];
    if (this.previous) {
      let best: IAutoMovieSchedule.IEntry | undefined;
      for (const e of this.previous.entries) if (match(e) && (!best || e.start >= best.start)) best = e;
      return best;
    }
    return undefined;
  }

  /** Another subject's state at this instant from the previous pass, with its position interpolated through the step under way. */
  private earlier(subject: string, at: number): IBodyState | undefined {
    if (!this.previous) return undefined;
    let best: IAutoMovieSchedule.IEntry | undefined;
    for (const e of this.previous.entries)
      if (e.subject === subject && (e.state as IStageWorld.Step | undefined)?.kind === "student" && e.start <= at + 1e-9 && (!best || e.start > best.start || (e.start === best.start && e.index > best.index))) best = e;
    if (!best) return undefined;
    const step = best.state as IStageWorld.IStudentStep;
    if (at >= best.end) return step.to;
    // A rider in flight is wherever the broom has carried or flown it by then, not at the step's start.
    if (step.from.support === "ride" || step.from.support === "hang") {
      const b: RiderMotion.IBroom = RiderMotion.broom(step, at - best.start);
      // Before the step's own motion begins (its lead) the rider keeps the state it started in: grip, speed and climb.
      const base: IBodyState = at - best.start < step.lead + 1e-9 ? step.from : step.to;
      return { ...base, position: b.position, heading: b.heading, speed: b.speed };
    }
    const u: number = step.natural > 0 ? Math.max(0, Math.min(1, (at - best.start - step.lead) / step.natural)) : 1;
    if (step.action.kind === "walk" && step.route !== undefined && step.route.length > 2) return { ...step.to, position: Gait.along(step.route, u) };
    return {
      ...step.to,
      position: {
        x: step.from.position.x + (step.to.position.x - step.from.position.x) * u,
        y: step.from.position.y + (step.to.position.y - step.from.position.y) * u,
        z: step.from.position.z + (step.to.position.z - step.from.position.z) * u,
      },
    };
  }

  /** A student by id. */
  public student(id: string): Student {
    const s: Student | undefined = this.world.students.get(id);
    if (!s) throw new Error(`Unknown student ${id}`);
    return s;
  }

  /** A named place of the set. */
  public place(name: string): IStageSet.IPlace {
    const p: IStageSet.IPlace | undefined = this.world.set.places[name];
    if (!p) throw new Error(`The ${this.world.set.id} has no place ${name}`);
    return p;
  }

  /** The latest placed step of a subject, if any. */
  public step(subject: string): IStageWorld.Step | undefined {
    let best: IAutoMovieSchedule.IEntry | undefined;
    for (const e of this.entries)
      if (e.subject === subject && e.state !== undefined && e.start <= this.time + 1e-9)
        if (!best || e.end > best.end || (e.end === best.end && e.index > best.index)) best = e;
    return best?.state as IStageWorld.Step | undefined;
  }

  /**
   * Another student's body state at this instant: from the previous pass when
   * there is one (so a counterpart placed later in walk order answers with
   * where it actually is), else the latest placed state, else a provisional
   * standing state at the set's origin for the first pass.
   *
   * @param subject The student.
   * @param at Film seconds; the current intent's start by default.
   * @returns The state.
   */
  public body(subject: string, at: number = this.time): IBodyState {
    const earlier: IBodyState | undefined = this.earlier(subject, at);
    if (earlier) return earlier;
    const s: IStageWorld.Step | undefined = this.step(subject);
    if (s && s.kind === "student") return s.to;
    if (!this.world.students.has(subject)) throw new Error(`Unknown student ${subject}`);
    return IBodyState.standing({ x: 0, y: 0, z: 0 }, 0);
  }

  /** Whether a subject has entered. */
  public entered(subject: string): boolean {
    return this.step(subject) !== undefined;
  }

  /**
   * The world point of a target: a place's point, a student's floor point,
   * a prop's resting point, or the point itself.
   *
   * @param target The target.
   * @returns World metres.
   */
  public point(target: StageAction.Target): IAutoMovieVector3 {
    if ("place" in target) return this.place(target.place).point;
    if ("point" in target) return target.point;
    if (this.world.students.has(target.subject)) return this.body(target.subject).position;
    if (this.world.props.has(target.subject) && this.previous !== undefined) {
      // A prop is where the previous pass's prop track has it: held, resting, fallen or flying.
      const at: IAutoMovieVector3 | undefined = PropPoint.at(this.world, this.previous, target.subject, this.time, (id: string, t: number) => this.body(id, t));
      if (at !== undefined) return at;
    }
    const step: IStageWorld.Step | undefined = this.step(target.subject) ?? this.previousStep(target.subject);
    if (!step) {
      // The first pass may meet a prop before anything places it; a later pass reads its track.
      if (this.previous === undefined && this.world.props.has(target.subject)) return { x: 0, y: 0, z: 0 };
      throw new Error(`${target.subject} is not on the stage`);
    }
    return step.kind === "student" ? step.to.position : step.point;
  }

  /** A subject's latest step in the previous pass. */
  private previousStep(subject: string): IStageWorld.Step | undefined {
    const e: IAutoMovieSchedule.IEntry | undefined = this.previous?.entries.filter((x) => x.subject === subject && x.state !== undefined).at(-1);
    return e?.state as IStageWorld.Step | undefined;
  }
}
