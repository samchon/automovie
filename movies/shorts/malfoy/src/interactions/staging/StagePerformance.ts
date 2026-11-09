import type { IAutoMovieSchedule } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { Student } from "../../entities/cast/student/Student";
import { BodyFrame } from "../../laws/body/BodyFrame";
import type { IBodyPosture } from "../../laws/body/IBodyPosture";
import { PostureFrame } from "../../laws/body/PostureFrame";
import { Gait } from "../../laws/everyday/Gait";
import { BroomLaw } from "../../laws/flight/BroomLaw";
import { RiderMotion } from "../flight/RiderMotion";
import type { IStageWorld } from "./IStageWorld";
import { StudentMotion } from "./StudentMotion";

/**
 * Every student's performance over the resolved schedule: each student's
 * steps indexed once in time order, the step under way at any second, the
 * posture it gives, and where the student stands (or rides) then, which gaze,
 * props and the camera read. A second before a student's first step finds
 * no posture: the student is not yet on the stage.
 *
 * ```ts
 * const performance = new StagePerformance(world, schedule);
 * performance.posture("carina", 12.5);
 * ```
 *
 * @evidence contracts/development/behaviors.md#deterministic-evaluation The schedule resolves once; every query is a pure function of it and the second.
 * @evidence contracts/development/implementation.md#efficient-algorithms Steps are indexed per student once; a query is a binary search, logarithmic in that student's steps.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One index serves postures, positions, props and the camera.
 * @evidence contracts/development/common.md#meaningful-documentation States what is indexed and what a query returns.
 */
export class StagePerformance {
  /** The world. */
  public readonly world: IStageWorld;

  /** The schedule. */
  public readonly schedule: IAutoMovieSchedule;

  private readonly steps: Map<string, IAutoMovieSchedule.IEntry[]> = new Map();

  /** Seconds a second rider's weight came onto each broom, from transfers. */
  private readonly loads: Map<string, number[]> = new Map();

  /**
   * Index a schedule.
   *
   * @param world The world.
   * @param schedule The resolved schedule.
   */
  public constructor(world: IStageWorld, schedule: IAutoMovieSchedule) {
    this.world = world;
    this.schedule = schedule;
    for (const e of schedule.entries) {
      if (!world.students.has(e.subject) || (e.state as IStageWorld.Step | undefined)?.kind !== "student") continue;
      const list: IAutoMovieSchedule.IEntry[] = this.steps.get(e.subject) ?? [];
      list.push(e);
      this.steps.set(e.subject, list);
    }
    for (const list of this.steps.values()) list.sort((a, b) => a.start - b.start || a.index - b.index);
    for (const e of schedule.entries) {
      if (e.intent.capability !== "transfer") continue;
      const step = e.state as IStageWorld.IStudentStep;
      if (step.to.broom === null || step.outcome === "not-admitted") continue;
      // The weight comes on as the first hand closes on the new shaft.
      const list: number[] = this.loads.get(step.to.broom) ?? [];
      list.push(e.start + step.lead + BroomLaw.TRANSFER_PHASES[0]!);
      this.loads.set(step.to.broom, list);
    }
  }

  /** The entry under way at a second, or the last ended, with its local time; undefined before the first. */
  public entry(subject: string, seconds: number): { entry: IAutoMovieSchedule.IEntry; step: IStageWorld.IStudentStep; local: number } | undefined {
    const list: IAutoMovieSchedule.IEntry[] | undefined = this.steps.get(subject);
    if (!list || list.length === 0 || seconds < list[0]!.start) return undefined;
    let lo: number = 0;
    let hi: number = list.length - 1;
    while (lo < hi) {
      const mid: number = (lo + hi + 1) >> 1;
      if (list[mid]!.start <= seconds) lo = mid;
      else hi = mid - 1;
    }
    // Zero-length steps at the same start resolve to the latest placed.
    const entry: IAutoMovieSchedule.IEntry = list[lo]!;
    const step = entry.state as IStageWorld.IStudentStep;
    return { entry, step, local: Math.min(seconds, entry.end) - entry.start };
  }

  /** A student's posture at a second, or undefined before entering. */
  public posture(subject: string, seconds: number, depth: number = 0): IBodyPosture | undefined {
    const found = this.entry(subject, seconds);
    if (!found) return undefined;
    const student: Student = this.world.students.get(subject)!;
    const tandem: boolean = found.step.to.support === "tandem";
    const host: RiderMotion.IBroom | undefined = tandem ? (() => {
      const id: string | undefined = this.host(subject, found.step.to.broom, seconds);
      return id === undefined ? undefined : this.broom(id, seconds);
    })() : undefined;
    const locate = Object.assign((id: string) => this.position(id, seconds), {
      // A gripping hand follows the gripped wand hand; one level deep, so two grips never recurse.
      hand: (id: string) => (depth > 0 ? undefined : this.posture(id, seconds, depth + 1)?.hands.right.point),
      limb: (id: string, side: "left" | "right") => (depth > 0 ? undefined : this.posture(id, seconds, depth + 1)?.hands[side].point),
    });
    const live: RiderMotion.IBroom | undefined = tandem ? undefined : this.broom(subject, seconds);
    const current: IBodyPosture = StudentMotion.posture(student, found.step, found.local, seconds, locate, host, live);

    // A step's first instant need not equal the previous step's last, so the
    // body crosses over from the previous step's end pose during the first
    // quarter second instead of jumping in one frame.
    const previous: IAutoMovieSchedule.IEntry | undefined = this.before(subject, found.entry);
    if (
      previous === undefined ||
      found.step.action.kind === "enter" ||
      found.local >= StagePerformance.CROSSFADE ||
      found.entry.start - previous.end > 1e-6
    )
      return current;
    const from: IBodyPosture = StudentMotion.posture(
      student,
      previous.state as IStageWorld.IStudentStep,
      previous.end - previous.start,
      found.entry.start,
      locate,
      host,
      live,
    );
    // A previous step whose end pose is not finite cannot be crossed from.
    if (![from.pelvis.x, from.pelvis.y, from.pelvis.z, from.heading].every(Number.isFinite)) return current;
    return PostureFrame.blend(from, current, PostureFrame.smooth(found.local / StagePerformance.CROSSFADE));
  }

  /** Seconds over which a step crosses over from the previous step's end pose. */
  public static readonly CROSSFADE: number = 0.25;

  /** The subject's entry placed just before an entry, if any. */
  private before(subject: string, entry: IAutoMovieSchedule.IEntry): IAutoMovieSchedule.IEntry | undefined {
    const list: IAutoMovieSchedule.IEntry[] | undefined = this.steps.get(subject);
    const index: number = list?.indexOf(entry) ?? -1;
    return index > 0 ? list![index - 1] : undefined;
  }

  /** Where a student stands or rides at a second (the floor point or the seat point), or undefined before entering. */
  public position(subject: string, seconds: number): IAutoMovieVector3 | undefined {
    const found = this.entry(subject, seconds);
    if (!found) return undefined;
    const { step, local } = found;
    if (step.from.support === "ride" || step.from.support === "hang" || step.from.support === "tandem" || (step.to.support !== "stand" && step.to.support !== "seat"))
      return this.broom(subject, seconds)?.position ?? RiderMotion.broom(step, local, RiderMotion.limitOf(this.world.students.get(subject)!)).position;
    const u: number = step.natural > 0 ? Math.max(0, Math.min(1, (local - step.lead) / step.natural)) : 1;
    // A walk bent around someone follows its bend.
    if (step.action.kind === "walk" && step.route !== undefined && step.route.length > 2) return Gait.along(step.route, u);
    return {
      x: step.from.position.x + (step.to.position.x - step.from.position.x) * u,
      y: step.from.position.y + (step.to.position.y - step.from.position.y) * u,
      z: step.from.position.z + (step.to.position.z - step.from.position.z) * u,
    };
  }

  /** A rider's live broom at a second, or undefined when not riding or hanging. */
  public broom(subject: string, seconds: number, depth: number = 0): RiderMotion.IBroom | undefined {
    const found = this.entry(subject, seconds);
    if (!found) return undefined;
    const { step, local } = found;
    if (step.to.support === "tandem" && step.action.kind !== "transfer") {
      const host: string | undefined = this.host(subject, step.to.broom, seconds);
      return host === undefined ? undefined : this.broom(host, seconds);
    }
    if (step.from.support === "stand" && step.to.support === "stand") return undefined;
    if (step.from.support === "seat" || step.to.support === "seat") return undefined;
    const loads: number[] = step.to.broom === null ? [] : (this.loads.get(step.to.broom) ?? []);
    // The rider's own bank limit, and no more than 30° once a second rider is aboard.
    const limit: number = Math.min(RiderMotion.limitOf(this.world.students.get(subject)!), loads.some((load) => seconds > load) ? BroomLaw.TANDEM_BANK : Infinity);
    const a = step.action;
    const b: RiderMotion.IBroom =
      a.kind === "escort"
        ? RiderMotion.escort(step, local, this.broom(a.subject, seconds), this.broom(a.subject, found.entry.start + step.lead))
        : RiderMotion.broom(step, local, limit);
    // A broom dips under a second rider's weight and recovers in a shallow climb.
    let dip: number = 0;
    for (const load of loads) {
      const t: number = seconds - load;
      if (t <= 0) continue;
      const smooth = (u: number): number => { const c: number = Math.max(0, Math.min(1, u)); return c * c * (3 - 2 * c); };
      dip = Math.max(dip, t < 0.75 ? BroomLaw.TANDEM_DIP * smooth(t / 0.75) : BroomLaw.TANDEM_DIP * (1 - smooth((t - 0.75) / BroomLaw.TANDEM_RECOVERY)));
    }
    const dipped: RiderMotion.IBroom = dip === 0 ? b : { ...b, position: { ...b.position, y: b.position.y - dip } };
    // A new step turns, pitches, banks and changes speed from where the last one left the broom, over 0.3 s, never in one frame.
    const settle: number = 0.3;
    if (local >= settle || depth >= 3 || found.entry.start <= 0) return dipped;
    const before: RiderMotion.IBroom | undefined = this.broom(subject, found.entry.start - 1e-4, depth + 1);
    if (before === undefined) return dipped;
    const k: number = local / settle;
    const u: number = k * k * (3 - 2 * k);
    return {
      ...dipped,
      heading: before.heading + BodyFrame.turn(before.heading, dipped.heading) * u,
      pitch: before.pitch + (dipped.pitch - before.pitch) * u,
      roll: before.roll + (dipped.roll - before.roll) * u,
      speed: before.speed + (dipped.speed - before.speed) * u,
    };
  }

  /** The front rider of a broom at a second: the other student riding it. */
  public host(subject: string, broom: string | null, seconds: number): string | undefined {
    if (broom === null) return undefined;
    for (const id of this.steps.keys()) {
      if (id === subject) continue;
      const found = this.entry(id, seconds);
      if (found && found.step.to.broom === broom && (found.step.to.support === "ride" || found.step.from.support === "ride")) return id;
    }
    return undefined;
  }

  /** The students with steps. */
  public subjects(): string[] {
    return [...this.steps.keys()];
  }
}
