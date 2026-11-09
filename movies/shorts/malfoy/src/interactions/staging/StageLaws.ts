import type { IAutoMovieIntent, IAutoMovieSchedule, resolveAutoMovieSchedule } from "@automovie/engine";

import type { Student } from "../../entities/cast/student/Student";
import type { IBodyState } from "../../laws/body/IBodyState";
import { StageAction } from "../../laws/staging/StageAction";
import { DuelSteps } from "../duelling/DuelSteps";
import { EverydaySteps } from "../everyday/EverydaySteps";
import { FlightSteps } from "../flight/FlightSteps";
import type { IStageWorld } from "./IStageWorld";
import { StageContext } from "./StageContext";

/**
 * The production's schedule laws: for each intent, its duration and contact
 * from the discipline that owns its kind, held back by a lead-in so an
 * absolute `start` or `contact` second lands exactly; and the snapshot after
 * it, which carries the state it started from and the outcome the laws
 * decided. Students act through the everyday, duel and flight steps; props
 * rest where they are placed; the camera's shots and the stage's scene
 * markers take only their lead.
 *
 * ```ts
 * const schedule = resolveAutoMovieSchedule(composition, new StageLaws(world));
 * ```
 *
 * @evidence docs/research/everyday/walking.md#law Walk timing through the everyday steps.
 * @evidence docs/research/duelling/practice-duel.md#law Duel timing through the duel steps.
 * @evidence docs/research/flight/broom-riding.md#law Flight timing through the flight steps.
 * @evidence contracts/development/behaviors.md#studied-laws Durations come from the owning discipline's laws; the lead only waits.
 * @evidence contracts/development/behaviors.md#relational-goals Targets resolve through the stage context from placed states.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation The engine resolves the composition once with these pure functions.
 * @evidence contracts/development/common.md#meaningful-documentation States the dispatch, the lead and the snapshot.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An absolute second the action cannot reach throws instead of compressing the action.
 */
export class StageLaws implements resolveAutoMovieSchedule.ILaws {
  /** The world. */
  public readonly world: IStageWorld;

  /** The previous resolution pass, which answers for counterparts placed later in walk order. */
  public readonly previous: IAutoMovieSchedule | undefined;

  /**
   * Laws over a world.
   *
   * @param world The set, students and props.
   * @param previous The previous resolution pass, if any.
   */
  public constructor(world: IStageWorld, previous?: IAutoMovieSchedule) {
    this.world = world;
    this.previous = previous;
  }

  /** Duration and contact of an intent. */
  public timing(intent: IAutoMovieIntent, context: resolveAutoMovieSchedule.IContext): resolveAutoMovieSchedule.ITiming {
    const action: StageAction.Action = StageAction.read(intent);
    const { own, lead } = this.placed(intent, action, context.entries, context.start);
    return {
      duration: lead + own.duration,
      ...(own.contact === undefined ? {} : { contact: lead + own.contact }),
    };
  }

  /** The snapshot after an intent. */
  public state(entry: IAutoMovieSchedule.IEntry, context: resolveAutoMovieSchedule.IContext): IStageWorld.Step | undefined {
    const action: StageAction.Action = StageAction.read(entry.intent);
    const stage: StageContext = new StageContext(this.world, context.entries, entry.start, this.previous);
    if (this.world.props.has(entry.subject)) {
      if (action.kind !== "rest") return undefined;
      return { kind: "prop", point: stage.point(action.at) };
    }
    const student: Student | undefined = this.world.students.get(entry.subject);
    if (!student) return undefined;
    const from: IBodyState = action.kind === "enter" ? (undefined as unknown as IBodyState) : stage.self(entry.subject);
    const { own, lead } = this.placed(entry.intent, action, context.entries, entry.start);
    // The end state reads its counterparts where they are when the motion begins, after the lead.
    const begun: StageContext = lead > 0 ? new StageContext(this.world, context.entries, entry.start + lead, this.previous) : stage;
    const ended: IBodyState = StageAction.isEveryday(action)
      ? EverydaySteps.end(action, from, begun, student, own)
      : StageAction.isDuel(action)
        ? DuelSteps.end(action, from, begun, student, own)
        : StageAction.isFlight(action)
          ? FlightSteps.end(action, StageLaws.flown(from, action, lead), begun, student, own)
          : from;
    // A flying broom never stops: any step that is not itself a flight carries the rider on at the
    // broom's speed and climb over the whole step, lead included, as the rider motion draws it.
    const carried: boolean =
      from !== undefined &&
      (from.support === "ride" || from.support === "hang") &&
      !["fly", "offerRear", "mount", "hover", "escort"].includes(action.kind) &&
      !(action.kind === "transfer" && own.outcome !== "not-admitted");
    const span: number = lead + own.duration;
    const forward = { x: Math.sin(from?.heading ?? 0), z: Math.cos(from?.heading ?? 0) };
    const to: IBodyState = carried
      ? {
          ...ended,
          position: {
            x: from.position.x + forward.x * from.speed * span,
            y: Math.max(0.5, from.position.y + (ended.support === "hang" ? ended.climb : from.climb) * span),
            z: from.position.z + forward.z * from.speed * span,
          },
        }
      : ended;
    return {
      kind: "student",
      action,
      from: from ?? to,
      to,
      lead,
      natural: own.duration,
      ...(own.contact === undefined ? {} : { contact: own.contact }),
      ...(own.walk === undefined ? {} : { walk: own.walk }),
      ...(own.outcome === undefined ? {} : { outcome: own.outcome }),
      ...(own.point === undefined ? {} : { point: own.point }),
      ...(own.route === undefined ? {} : { route: own.route }),
    };
  }

  /** The outcome class an intent's laws decided. */
  public outcome(entry: IAutoMovieSchedule.IEntry, context: resolveAutoMovieSchedule.IContext): string | undefined {
    const student: Student | undefined = this.world.students.get(entry.subject);
    if (!student) return undefined;
    const action: StageAction.Action = StageAction.read(entry.intent);
    return this.placed(entry.intent, action, context.entries, entry.start).own.outcome;
  }

  /**
   * An intent's own timing and lead, its counterparts read when its own
   * motion begins: after the lead that an absolute start or contact asks
   * for, not at the placed start, so a relation waiting for a second meets
   * the counterpart where it is then.
   */
  private placed(intent: IAutoMovieIntent, action: StageAction.Action, entries: readonly IAutoMovieSchedule.IEntry[], start: number): { own: EverydaySteps.ITime; lead: number } {
    const first: EverydaySteps.ITime = this.own(intent, action, new StageContext(this.world, entries, start, this.previous));
    const wait: number = StageLaws.lead(intent, action, start, first.contact);
    if (wait <= 0) return { own: first, lead: 0 };
    const own: EverydaySteps.ITime = this.own(intent, action, new StageContext(this.world, entries, start + wait, this.previous), wait);
    return { own, lead: StageLaws.lead(intent, action, start, own.contact) };
  }

  /** An intent's own timing from its owner. */
  private own(intent: IAutoMovieIntent, action: StageAction.Action, stage: StageContext, lead: number = 0): EverydaySteps.ITime {
    if (action.kind === "shot" || action.kind === "scene" || action.kind === "rest") return { duration: 0 };
    if (action.kind === "until") return { duration: Math.max(0, action.seconds - stage.time) };
    if (this.world.props.has(intent.subject)) return { duration: 0 };
    const student: Student = stage.student(intent.subject);
    const from: IBodyState = action.kind === "enter" ? (undefined as unknown as IBodyState) : stage.self(intent.subject);
    if (StageAction.isEveryday(action)) return EverydaySteps.time(action, from, stage, student);
    if (StageAction.isDuel(action)) return DuelSteps.time(action, from, stage, student);
    if (StageAction.isFlight(action)) return FlightSteps.time(action, StageLaws.flown(from, action, lead), stage, student);
    throw new Error(`A student cannot ${action.kind}`);
  }

  /**
   * A rider's state when a flight action's own motion begins: the broom has
   * flown on along its heading at its speed and climb through the lead.
   *
   * @param from The placed state.
   * @param action The action.
   * @param lead Seconds of lead.
   * @returns The state after the lead.
   */
  public static flown(from: IBodyState, action: StageAction.Action, lead: number): IBodyState {
    if (lead <= 0 || from === undefined || !StageAction.isFlight(action) || (from.support !== "ride" && from.support !== "hang")) return from;
    const f = { x: Math.sin(from.heading), z: Math.cos(from.heading) };
    return {
      ...from,
      position: { x: from.position.x + f.x * from.speed * lead, y: Math.max(0.5, from.position.y + from.climb * lead), z: from.position.z + f.z * from.speed * lead },
    };
  }

  /**
   * Seconds an intent waits before its own motion so an absolute start or
   * contact lands exactly.
   *
   * @param intent The intent.
   * @param action Its action.
   * @param start Its placed start.
   * @param contact Its own contact offset.
   * @returns Seconds, nonnegative.
   * @throws When the absolute second lies before what the composition allows.
   */
  public static lead(intent: IAutoMovieIntent, action: StageAction.Action, start: number, contact: number | undefined): number {
    const want: number | undefined =
      action.start !== undefined ? action.start - start : action.contact !== undefined ? action.contact - start - (contact ?? 0) : undefined;
    if (want === undefined) return 0;
    if (want < -1e-6)
      throw new Error(
        `${intent.subject}.${intent.capability} cannot ${action.start !== undefined ? `start at ${action.start}` : `make contact at ${action.contact}`}: the composition reaches it at ${start.toFixed(3)} s`,
      );
    return Math.max(0, want);
  }
}
