import { AutoMovieEngineMotionSampling, AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieMotionHumanScheduledInstant,
  IAutoMovieMotionClock,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanBalance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanPhysicsActionSecond } from "./HumanPhysicsActionSecond";
import { HumanPhysicsAdmitWindow } from "./HumanPhysicsAdmitWindow";
import { HumanPhysicsInvalid } from "./HumanPhysicsInvalid";
import { HumanPhysicsMissing } from "./HumanPhysicsMissing";
import { AutoMovieMotionHumanRefusal } from "../AutoMovieMotionHumanRefusal";

/*
 * The one reader of the balance option (`IAutoMovieMotionHumanBalance`): the
 * shift an action applies, by how much at a film second, and whether the audit
 * judges the body's balance over it. Absent on the params, none: a posed,
 * planted action computes no centre of mass and is not checked against gravity
 * unless its law stages a physical outcome
 * (`IAutoMovieMotionHumanActionLaw.physical`). Given, each field is the
 * caller's where given, else the law's recommendation
 * (`IAutoMovieMotionHumanActionLaw.balance`), and a field neither gives is
 * refused, naming it, except for the explicit weight and ramp defaults. Its
 * bounds are events, resolved as the scheduled instants are
 * (`AutoMovieMotionHumanPerformance.instant`). The law only asks for a correction where the
 * prepared window has positive weight.
 */
export namespace HumanPhysics {
  /*
   * An action's params as the option reads them: the balance, when given.
   */
  export interface IBalanced {
    /*
     * The balancing shift; none when absent.
     */
    balance?: IAutoMovieMotionHumanBalance;
  }

  /*
   * An action's law as the option reads it.
   */
  export interface ILaw {
    /*
     * Whether the law's content is a staged physical outcome
     * (`IAutoMovieMotionHumanActionLaw.physical`).
     */
    physical?: boolean;

    /*
     * The law's recommended shift, every field set
     * (`IAutoMovieMotionHumanActionLaw.balance`); none when absent.
     */
    balance?: IAutoMovieMotionHumanBalance;
  }

  /*
   * An action as the audit reads it, a placed action also carrying its law and
   * params.
   */
  export interface ISpan extends IAutoMovieMotionHumanAuditMotion.ISpan {
    /*
     * The placed action's law, when the span is one.
     */
    law?: ILaw;

    /*
     * The placed action's params, when the span is one.
     */
    params?: IBalanced;
  }

  /*
   * A shift with its author bounds' names and admitted numeric terms.
   */
  export interface IShift {
    /*
     * The part moved to keep the centre of mass over the support.
     */
    by: IAutoMovieMotionHumanBalance.Part;

    /*
     * The share of the full shift applied, 0 to 1.
     */
    weight: number;

    /*
     * The instant it starts.
     */
    from: IAutoMovieMotionHumanBalance.IBound;

    /*
     * The instant it ends.
     */
    to: IAutoMovieMotionHumanBalance.IBound;

    /*
     * The blend durations in seconds, zero at each end if omitted.
     */
    ramp: IAutoMovieMotionHumanBalance.IRamp;
  }

  /*
   * The shift an action applies (`shift`), or none.
   */
  export type Shift = IShift | null;

  /*
   * The resolver of a scheduled instant, film seconds
   * (`AutoMovieMotionHumanPerformance.instant`).
   */
  export type Instant = IAutoMovieMotionHumanActionContext.Instant;

  /*
   * An action's named events and duration are sufficient to resolve its own
   * bounds.
   */
  export interface ITiming {
    /*
     * The full duration of the action in seconds.
     */
    duration: number;

    /*
     * The events on that clock, in order and expressed as duration shares.
     */
    events: readonly IAutoMovieMotionEvent[];
  }

  /*
   * The duration and named events a correction can read from its clock.
   */
  export type IClock = Pick<IAutoMovieMotionClock, "duration" | "events">;

  /*
   * The prepared window, or null when a correction cannot contribute.
   */
  export type Window = IAutoMovieMotionHumanBalance.Window;

  /*
   * Name the requested part when the action cannot balance it on its actual
   * supports.
   */
  export function unsupported(
    part: IAutoMovieMotionHumanBalance.Part,
    reason: string,
  ): never {
    throw new AutoMovieMotionHumanRefusal({
      kind: "parameter",
      axis: "balance.by",
      value: part,
      feasible: null,
      reason,
      fix: "choose a supported balancing part or omit balance",
    });
  }

  /*
   * Admit absent and zero-weight requests on a planner whose contact
   * constraints own all movable parts.
   */
  export function fixed(params: IBalanced, reason: string, law?: ILaw): void {
    const request: Shift = shift(params, law);
    if (request !== null && request.weight > 0) unsupported(request.by, reason);
  }

  /*
   * A registered planner or composite must publish the window it actually
   * applies when an author requests balance.
   */
  export function admitted(
    params: IBalanced,
    law: ILaw,
    plan: IAutoMovieMotionHumanActionPlan,
  ): void {
    if (plan.balanceWindow === undefined)
      fixed(
        params,
        "this action did not prepare a correction for its own body and support phase",
        law,
      );
  }

  /*
   * Only a planner which received the option declares its result, including an
   * explicitly inactive window.
   */
  export function declared(
    params: IBalanced,
    window: Window,
  ): Pick<IAutoMovieMotionHumanActionPlan, "balanceWindow"> {
    return params.balance === undefined ? {} : { balanceWindow: window };
  }

  /*
   * A candidate interval of a placed span, in film seconds.
   */
  export interface IJudgedInterval {
    /*
     * First candidate second.
     */
    from: number;
    /*
     * Last candidate second.
     */
    to: number;
  }

  /*
   * A signed distance along the requested direction, or null if its line misses
   * the support hull.
   */
  export type SupportOffset = number | null;

  /*
   * Project the centre onto the closest part of its support hull reachable
   * along a horizontal unit direction. A point already inside moves zero.
   */
  export function supportOffset(
    support: IAutoMovieMotionHumanBalance.ISupport,
    direction: IAutoMovieVector3,
  ): SupportOffset {
    const hull: IAutoMovieVector3[] = AutoMovieEngineMath.convexHull2D(support.points);
    if (hull.length < 3) return null;
    let from: number = -Infinity;
    let to: number = Infinity;
    for (let i: number = 0; i < hull.length; ++i) {
      const a: IAutoMovieVector3 = hull[i]!;
      const b: IAutoMovieVector3 = hull[(i + 1) % hull.length]!;
      const dx: number = b.x - a.x;
      const dz: number = b.z - a.z;
      const offset: number =
        dx * (support.centre.z - a.z) - dz * (support.centre.x - a.x);
      const slope: number = dx * direction.z - dz * direction.x;
      if (slope > 0) from = Math.max(from, -offset / slope);
      else if (slope < 0) to = Math.min(to, -offset / slope);
      else if (offset < 0) return null;
    }
    return from <= to ? Math.max(from, Math.min(0, to)) : null;
  }

  /*
   * The shift an action applies: none when its params give no balance; given,
   * each field the caller's where given, else the law's.
   * Parameter params: The action's params; none when absent.
   * Parameter law: The action's law; it recommends none when absent.
   * Returns: The shift, or null for none.
   * When a part or bound is missing, or a supplied term
   * is outside its domain.
   */
  export function shift(params?: IBalanced, law?: ILaw): Shift {
    const given: IAutoMovieMotionHumanBalance | undefined = params?.balance;
    if (given === undefined) return null;
    const recommended: IAutoMovieMotionHumanBalance = law?.balance ?? {};
    const by: IAutoMovieMotionHumanBalance.Part | undefined =
      given.by ?? recommended.by;
    const weight: number = given.weight ?? recommended.weight ?? 1;
    const from: IAutoMovieMotionHumanBalance.IBound | undefined =
      given.from ?? recommended.from;
    const to: IAutoMovieMotionHumanBalance.IBound | undefined =
      given.to ?? recommended.to;
    const ramp: IAutoMovieMotionHumanBalance.IRamp = given.ramp ??
      recommended.ramp ?? { in: 0, out: 0 };
    if (by === undefined) throw HumanPhysicsMissing("by");
    if (from === undefined) throw HumanPhysicsMissing("from");
    if (to === undefined) throw HumanPhysicsMissing("to");
    if (by !== "hips" && by !== "trunk")
      throw HumanPhysicsInvalid("by", by, "name hips or trunk");
    if (!(weight >= 0 && weight <= 1))
      throw HumanPhysicsInvalid("weight", weight, "give a weight from 0 to 1");
    if (!(ramp.in >= 0))
      throw HumanPhysicsInvalid(
        "ramp.in",
        ramp.in,
        "give a nonnegative finite duration in seconds",
      );
    if (!(ramp.out >= 0))
      throw HumanPhysicsInvalid(
        "ramp.out",
        ramp.out,
        "give a nonnegative finite duration in seconds",
      );
    return { by, weight, from: { ...from }, to: { ...to }, ramp: { ...ramp } };
  }

  /*
   * Resolve a requested window once for all evaluations of the placed plan. The
   * law's own events use its plan clock and other anchors use film seconds.
   */
  export function prepare(
    params: IBalanced,
    law: ILaw,
    start: number,
    timing: ITiming,
    resolve?: Instant,
  ): Window {
    return prepareWindow(shift(params, law), start, timing, resolve);
  }

  /*
   * Borrow a named clock, materializing its events only if a positive request
   * names a local event.
   */
  export function fromClock(
    params: IBalanced,
    law: ILaw,
    start: number,
    clock: IClock,
    resolve?: Instant,
  ): Window {
    const timing: ITiming = { duration: clock.duration, events: [] };
    return prepareWindow(
      shift(params, law),
      start,
      timing,
      resolve,
      (): readonly IAutoMovieMotionEvent[] => clock.events(),
    );
  }

  /*
   * The needed shift's share at one action second. Only the active edge's
   * minimum-jerk polynomial is evaluated. Overlapping ramps are shortened
   * proportionally, so the two eased edges meet at full weight.
   */
  export function weightAt(window: Window, seconds: number): number {
    if (window === null || !(window.from <= seconds && seconds <= window.to))
      return 0;
    if (
      window.phase !== undefined &&
      (seconds < window.phase.from || seconds > window.phase.to)
    )
      return 0;
    const into: number = seconds - window.from;
    const out: number = window.to - seconds;
    const rise: number = window.ramp.in;
    const fall: number = window.ramp.out;
    if (into < rise) return window.weight * AutoMovieEngineMotionSampling.minimumJerkShare(into / rise);
    if (out < fall) return window.weight * AutoMovieEngineMotionSampling.minimumJerkShare(out / fall);
    return window.weight;
  }

  /*
   * Does any instant of a closed action-local interval carry a positive
   * requested weight?
   */
  export function intersects(
    window: Window,
    from: number,
    to: number,
  ): boolean {
    if (window === null) return false;
    const a: number = Math.max(
      from,
      window.phase?.from ?? window.from,
      window.from,
    );
    const b: number = Math.min(to, window.phase?.to ?? window.to, window.to);
    return a < b || (a === b && weightAt(window, a) > 0);
  }

  /*
   * Limit the requested correction to a support phase while preserving the
   * author's easing origins.
   */
  export function during(window: Window, from: number, to: number): Window {
    if (window === null || !intersects(window, from, to)) return null;
    const phase: IAutoMovieMotionHumanBalance.IInterval = {
      from: Math.max(window.phase?.from ?? window.from, from),
      to: Math.min(window.phase?.to ?? window.to, to),
    };
    return phase.from === window.from && phase.to === window.to
      ? window
      : { ...window, phase };
  }

  /*
   * A bound as the scheduled instants name theirs: the event of the action or
   * cue it names, this action's when it names none.
   * Parameter bound: The bound.
   * Parameter own: This action's id (`IAutoMovieMotionHumanSegment.id`).
   * Returns: The scheduled instant the performance resolves.
   */
  export function instant(
    bound: IAutoMovieMotionHumanBalance.IBound,
    own: string,
  ): AutoMovieMotionHumanScheduledInstant {
    return {
      of: bound.of ?? own,
      event: bound.event,
      ...(bound.index === undefined ? {} : { index: bound.index }),
      ...(bound.offset === undefined ? {} : { offset: bound.offset }),
    };
  }

  /*
   * The share of the full balancing shift applied at a film second: the shift's
   * weight between its two resolved bounds, 0 outside them or where no shift
   * applies. The shift is one closed-form evaluation scaled by this, never
   * iterated.
   * Parameter resolved: The action's shift (`shift`).
   * Parameter seconds: Film seconds.
   * Parameter own: This action's id, for bounds that name no action.
   * Parameter resolve: The scheduled-instant resolver (`AutoMovieMotionHumanPerformance.instant`).
   * Returns: The weight applied there, 0 to 1.
   */
  export function weight(
    resolved: Shift,
    seconds: number,
    own: string,
    resolve: Instant,
  ): number {
    if (resolved === null || resolved.weight === 0) return 0;
    const from: number = resolve(instant(resolved.from, own));
    const to: number = resolve(instant(resolved.to, own));
    return weightAt(HumanPhysicsAdmitWindow(resolved, from, to), seconds);
  }

  /*
   * Whether the audit judges the body's balance over an action: the span says
   * so (`IAutoMovieMotionHumanAuditMotion.ISpan.physical`), or, for a placed
   * action read as a span, its law stages a physical outcome or it applies a
   * shift.
   * Parameter span: The action as the audit reads it.
   * Parameter seconds: The film second being judged. Omit to ask whether any of the
   * action is judged.
   * Returns: Whether its balance is judged.
   * As `shift` does.
   */
  export function judged(span: ISpan, seconds?: number): boolean {
    if (
      seconds !== undefined &&
      (seconds < span.entryTime || span.end < seconds)
    )
      return false;
    if (span.physical !== undefined) return span.physical;
    const physical: IAutoMovieMotionHumanActionPlan["physicalWindow"] =
      span.plan.physicalWindow;
    const local: number | undefined =
      seconds === undefined ? undefined : seconds - span.start;
    if (
      span.law?.physical === true &&
      (physical === undefined ||
        (physical !== null &&
          (local === undefined
            ? physical.from <= span.end - span.start &&
              span.entryTime - span.start <= physical.to
            : physical.from <= local && local <= physical.to)))
    )
      return true;
    const window: Window | undefined = span.plan.balanceWindow;
    if (window !== undefined)
      return local === undefined
        ? intersects(window, span.entryTime - span.start, span.end - span.start)
        : weightAt(window, local) > 0;
    return false;
  }

  /*
   * The parts of the placed span that can contribute to a balance audit.
   * `judged` still checks the precise weight at the individual sample.
   */
  export function intervals(span: ISpan): IJudgedInterval[] {
    const physical:
      | IAutoMovieMotionHumanActionPlan.IPhysicalWindow
      | null
      | undefined =
      span.law?.physical === true ? span.plan.physicalWindow : null;
    const balance: Window | undefined = span.plan.balanceWindow;
    if (span.physical === false) return [];
    if (span.physical === true || physical === undefined)
      return [{ from: span.entryTime, to: span.end }];
    const result: IJudgedInterval[] = [];
    for (const local of [physical, balance?.phase ?? balance]) {
      if (local === null || local === undefined) continue;
      const from: number = Math.max(span.entryTime, span.start + local.from);
      const to: number = Math.min(span.end, span.start + local.to);
      if (from <= to) result.push({ from, to });
    }
    return result;
  }
}

/*
 * Resolve the opening before asking a named clock for a closing event.
 */
function prepareWindow(
  active: HumanPhysics.Shift,
  start: number,
  timing: HumanPhysics.ITiming,
  resolve: HumanPhysics.Instant | undefined,
  clockEvents?: () => readonly IAutoMovieMotionEvent[],
): HumanPhysics.Window {
  if (active === null || active.weight === 0) return null;
  const opening: HumanPhysicsActionSecond.Bound = HumanPhysicsActionSecond(
    active.from,
    "from",
    start,
    timing,
    resolve,
  );
  const events: readonly IAutoMovieMotionEvent[] | undefined =
    opening.kind === "events" ? clockEvents?.() : undefined;
  const from: number =
    opening.kind === "second"
      ? opening.value
      : opening.read(events ?? timing.events);
  const closing: HumanPhysicsActionSecond.Bound = HumanPhysicsActionSecond(
    active.to,
    "to",
    start,
    timing,
    resolve,
  );
  const to: number =
    closing.kind === "second"
      ? closing.value
      : closing.read(events ?? clockEvents?.() ?? timing.events);
  if (to < from)
    throw HumanPhysicsInvalid("to", to, "end at or after the opening bound");
  if (to < 0 || timing.duration < from) return null;
  return HumanPhysicsAdmitWindow(active, from, to);
}
