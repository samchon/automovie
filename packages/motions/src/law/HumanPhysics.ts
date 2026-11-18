import { convexHull2D, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieMotionHumanScheduledInstant,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanBalance,
  IAutoMovieMotionEvent,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "./HumanRefusal";

/**
 * The one reader of the balance option (`IAutoMovieMotionHumanBalance`):
 * the shift an action applies, by how much at a film second, and whether
 * the audit judges the body's balance over it. Absent on the params, none:
 * a posed, planted action computes no centre of mass and is not checked
 * against gravity unless its law stages a physical outcome
 * (`IAutoMovieMotionHumanActionLaw.physical`). Given, each field is the
 * caller's where given, else the law's recommendation
 * (`IAutoMovieMotionHumanActionLaw.balance`), and a field neither gives is
 * refused, naming it, except for the explicit weight and ramp defaults.
 * Its bounds are events, resolved as the scheduled instants are
 * (`HumanPerformance.instant`). The law only asks for a correction where
 * the prepared window has positive weight.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the questions, the default, the resolution, the bounds and the refusal.
 * @evidence contracts/development/design.md#principled-representation One owner of the option's reading, so every law and the audit read it alike.
 * @evidence contracts/development/design.md#minimal-and-owned-surface `prepare` and `weightAt` resolve and read the active window, and `judged` gates the audit on the prepared window.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Absent is none. A part or event bound must come from the caller or law, and only weight and ramp have intrinsic defaults.
 */
export namespace HumanPhysics {
  /** An action's params as the option reads them: the balance, when given. */
  export interface IBalanced {
    /** The balancing shift; none when absent. */
    balance?: IAutoMovieMotionHumanBalance;
  }

  /** An action's law as the option reads it. */
  export interface ILaw {
    /** Whether the law's content is a staged physical outcome (`IAutoMovieMotionHumanActionLaw.physical`). */
    physical?: boolean;

    /** The law's recommended shift, every field set (`IAutoMovieMotionHumanActionLaw.balance`); none when absent. */
    balance?: IAutoMovieMotionHumanBalance;
  }

  /** An action as the audit reads it, a placed action also carrying its law and params. */
  export interface ISpan extends IAutoMovieMotionHumanAuditMotion.ISpan {
    /** The placed action's law, when the span is one. */
    law?: ILaw;

    /** The placed action's params, when the span is one. */
    params?: IBalanced;
  }

  /** A shift with its author bounds' names and admitted numeric terms. */
  export interface IShift {
    /** The part moved to keep the centre of mass over the support. */
    by: IAutoMovieMotionHumanBalance.Part;

    /** The share of the full shift applied, 0 to 1. */
    weight: number;

    /** The instant it starts. */
    from: IAutoMovieMotionHumanBalance.IBound;

    /** The instant it ends. */
    to: IAutoMovieMotionHumanBalance.IBound;

    /** The blend durations in seconds, zero at each end if omitted. */
    ramp: IAutoMovieMotionHumanBalance.IRamp;
  }

  /** The shift an action applies (`shift`), or none. */
  export type Shift = IShift | null;

  /** The resolver of a scheduled instant, film seconds (`HumanPerformance.instant`). */
  export type Instant = IAutoMovieMotionHumanActionContext.Instant;

  /** An action's named events and duration are sufficient to resolve its own bounds. */
  interface ITiming {
    /** The full duration of the action in seconds. */
    duration: number;

    /** The events on that clock, in order and expressed as duration shares. */
    events: readonly IAutoMovieMotionEvent[];
  }

  /** The prepared window, or null when a correction cannot contribute. */
  export type Window = IAutoMovieMotionHumanBalance.Window;

  /** Name the requested part when the action cannot balance it on its actual supports. */
  export function unsupported(part: IAutoMovieMotionHumanBalance.Part, reason: string): never {
    throw new HumanRefusal({
      kind: "parameter",
      axis: "balance.by",
      value: part,
      feasible: null,
      reason,
      fix: "choose a supported balancing part or omit balance",
    });
  }

  /** Admit absent and zero-weight requests on a planner whose contact constraints own all movable parts. */
  export function fixed(params: IBalanced, reason: string, law?: ILaw): void {
    const request: Shift = shift(params, law);
    if (request !== null && request.weight > 0) unsupported(request.by, reason);
  }

  /** A registered planner or composite must publish the window it actually applies when an author requests balance. */
  export function admitted(params: unknown, law: ILaw, plan: IAutoMovieMotionHumanActionPlan): void {
    if (plan.balanceWindow === undefined && typeof params === "object" && params !== null && "balance" in params)
      fixed(params as IBalanced, "this action did not prepare a correction for its own body and support phase", law);
  }

  /** A candidate interval of a placed span, in film seconds. */
  export interface IJudgedInterval {
    /** First candidate second. */
    from: number;
    /** Last candidate second. */
    to: number;
  }

  /** A signed distance along the requested direction, or null if its line misses the support hull. */
  export type SupportOffset = number | null;

  /**
   * Project the centre onto the closest part of its support hull reachable
   * along a horizontal unit direction. A point already inside moves zero.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the world-space direction, zero case and signed distance in metres.
   * @evidence contracts/development/implementation.md#principled-implementation Intersects the line through the mass centre with the convex hull's inward half planes and clamps zero to the common interval.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pass narrows the interval after the engine orders the support hull.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An empty reachable interval returns null, and a point inside is never pulled towards the middle.
   * @evidence contracts/development/implementation.md#efficient-algorithms The hull costs O(P log P); the supported travel interval then costs one edge pass with constant scalar storage.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A single geometric projection with no time or pose samples.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources No geometry is retained after the query.
   */
  export function supportOffset(
    support: IAutoMovieMotionHumanBalance.ISupport,
    direction: IAutoMovieVector3,
  ): SupportOffset {
    const hull: IAutoMovieVector3[] = convexHull2D(support.points);
    if (hull.length < 3) return null;
    let from: number = -Infinity;
    let to: number = Infinity;
    for (let i: number = 0; i < hull.length; ++i) {
      const a: IAutoMovieVector3 = hull[i]!;
      const b: IAutoMovieVector3 = hull[(i + 1) % hull.length]!;
      const dx: number = b.x - a.x;
      const dz: number = b.z - a.z;
      const offset: number = dx * (support.centre.z - a.z) - dz * (support.centre.x - a.x);
      const slope: number = dx * direction.z - dz * direction.x;
      if (slope > 0) from = Math.max(from, -offset / slope);
      else if (slope < 0) to = Math.min(to, -offset / slope);
      else if (offset < 0) return null;
    }
    return from <= to ? Math.max(from, Math.min(0, to)) : null;
  }

  /**
   * The shift an action applies: none when its params give no balance;
   * given, each field the caller's where given, else the law's.
   *
   * @param params The action's params; none when absent.
   * @param law The action's law; it recommends none when absent.
   * @returns The shift, or null for none.
   * @throws {HumanRefusal} When a part or bound is missing, or a supplied term is outside its domain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the resolution and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Author fields precede recommendations, followed by the intrinsic weight and blend defaults.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One presence test, then resolve and admit the terms once.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing part or bound is refused by its own field name.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record; retains nothing.
   */
  export function shift(params?: IBalanced, law?: ILaw): Shift {
    const given: IAutoMovieMotionHumanBalance | undefined = params?.balance;
    if (given === undefined) return null;
    const recommended: IAutoMovieMotionHumanBalance = law?.balance ?? {};
    const by: IAutoMovieMotionHumanBalance.Part | undefined = given.by ?? recommended.by;
    const weight: number = given.weight ?? recommended.weight ?? 1;
    const from: IAutoMovieMotionHumanBalance.IBound | undefined = given.from ?? recommended.from;
    const to: IAutoMovieMotionHumanBalance.IBound | undefined = given.to ?? recommended.to;
    const ramp: IAutoMovieMotionHumanBalance.IRamp = given.ramp ?? recommended.ramp ?? { in: 0, out: 0 };
    if (by === undefined) throw missing("by");
    if (from === undefined) throw missing("from");
    if (to === undefined) throw missing("to");
    if (by !== "hips" && by !== "trunk")
      throw invalid("by", by, "name hips or trunk");
    if (!Number.isFinite(weight) || !(weight >= 0 && weight <= 1))
      throw invalid("weight", weight, "give a weight from 0 to 1");
    if (!Number.isFinite(ramp.in) || ramp.in < 0)
      throw invalid("ramp.in", ramp.in, "give a nonnegative finite duration in seconds");
    if (!Number.isFinite(ramp.out) || ramp.out < 0)
      throw invalid("ramp.out", ramp.out, "give a nonnegative finite duration in seconds");
    return { by, weight, from: { ...from }, to: { ...to }, ramp: { ...ramp } };
  }

  /**
   * Resolve a requested window once for all evaluations of the placed plan.
   * The law's own events use its plan clock and other anchors use film seconds.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two clocks and per-plan lifetime.
   * @evidence contracts/development/implementation.md#principled-implementation Event shares become seconds using the plan duration; a foreign cue's film second loses the action start to put both kinds on the same clock.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve one option and two endpoints, or return early for a zero weight.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reversed bounds are refused by field name, and an absent external resolver cannot fabricate a time.
   * @evidence contracts/development/implementation.md#efficient-algorithms Resolves names only on request and at most twice per plan, skipping event resolution entirely for a zero weight.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work All actual posture samples borrow the same admitted endpoints.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns numeric bounds and blend lengths without retaining the action or its resolver.
   */
  export function prepare(
    params: IBalanced,
    law: ILaw,
    start: number,
    timing: ITiming,
    resolve?: Instant,
  ): Window {
    const active: Shift = shift(params, law);
    if (active === null || active.weight === 0) return null;
    const from: number = actionSecond(active.from, "from", start, timing, resolve);
    const to: number = actionSecond(active.to, "to", start, timing, resolve);
    if (!Number.isFinite(from)) throw invalid("from", from, "resolve to a finite film second");
    if (!Number.isFinite(to)) throw invalid("to", to, "resolve to a finite film second");
    if (to < from) throw invalid("to", to, "end at or after the opening bound");
    if (to < 0 || timing.duration < from) return null;
    return admitWindow(active, from, to);
  }

  /**
   * The needed shift's share at one action second. Only the active edge's
   * minimum-jerk polynomial is evaluated. Overlapping ramps are shortened
   * proportionally, so the two eased edges meet at full weight.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the action clock, the profile and the overlap rule.
   * @evidence contracts/development/implementation.md#principled-implementation The Flash–Hogan quintic gives a smooth rise or fall. Dividing the finite window length by the sum of both ramps gives the common shortening factor when they would overlap.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Rejects seconds outside the window, then evaluates an active edge or returns full weight.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both transition lengths come from the window, with no fixed extra timing or pose work.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar arithmetic and at most one easing evaluation, only inside the window.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows already-resolved bounds from the plan.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a scalar and retains nothing.
   */
  export function weightAt(window: Window, seconds: number): number {
    if (window === null || !(window.from <= seconds && seconds <= window.to)) return 0;
    if (window.phase !== undefined && (seconds < window.phase.from || seconds > window.phase.to)) return 0;
    const into: number = seconds - window.from;
    const out: number = window.to - seconds;
    const rise: number = window.ramp.in;
    const fall: number = window.ramp.out;
    if (into < rise) return window.weight * minimumJerk.share(into / rise);
    if (out < fall) return window.weight * minimumJerk.share(out / fall);
    return window.weight;
  }

  /** Does any instant of a closed action-local interval carry a positive requested weight? */
  export function intersects(window: Window, from: number, to: number): boolean {
    if (window === null) return false;
    const a: number = Math.max(from, window.phase?.from ?? window.from, window.from);
    const b: number = Math.min(to, window.phase?.to ?? window.to, window.to);
    return a < b || (a === b && weightAt(window, a) > 0);
  }

  /** Limit the requested correction to a support phase while preserving the author's easing origins. */
  export function during(window: Window, from: number, to: number): Window {
    if (window === null || !intersects(window, from, to)) return null;
    const phase: IAutoMovieMotionHumanBalance.IInterval = {
      from: Math.max(window.phase?.from ?? window.from, from),
      to: Math.min(window.phase?.to ?? window.to, to),
    };
    return phase.from === window.from && phase.to === window.to ? window : { ...window, phase };
  }

  /**
   * A bound as the scheduled instants name theirs: the event of the action
   * or cue it names, this action's when it names none.
   *
   * @param bound The bound.
   * @param own This action's id (`IAutoMovieMotionHumanSegment.id`).
   * @returns The scheduled instant the performance resolves.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the mapping and its default.
   * @evidence contracts/development/implementation.md#principled-implementation The same representation the layers and cue tracks resolve, so one resolver reads every instant.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No share of a duration names an instant.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A reading.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh record; retains nothing.
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

  /**
   * The share of the full balancing shift applied at a film second: the
   * shift's weight between its two resolved bounds, 0 outside them or where
   * no shift applies. The shift is one closed-form evaluation scaled by
   * this, never iterated.
   *
   * @param resolved The action's shift (`shift`).
   * @param seconds Film seconds.
   * @param own This action's id, for bounds that name no action.
   * @param resolve The scheduled-instant resolver (`HumanPerformance.instant`).
   * @returns The weight applied there, 0 to 1.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The shift's own weight between its event-named bounds, resolved by the performance's one instant resolver.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two instants, one comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No ramp of its own: the shift's terms alone.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two instant resolutions a call.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function weight(resolved: Shift, seconds: number, own: string, resolve: Instant): number {
    if (resolved === null || resolved.weight === 0) return 0;
    const from: number = resolve(instant(resolved.from, own));
    const to: number = resolve(instant(resolved.to, own));
    return weightAt(admitWindow(resolved, from, to), seconds);
  }

  /**
   * Whether the audit judges the body's balance over an action: the span
   * says so (`IAutoMovieMotionHumanAuditMotion.ISpan.physical`), or, for a
   * placed action read as a span, its law stages a physical outcome or it
   * applies a shift.
   *
   * @param span The action as the audit reads it.
   * @param seconds The film second being judged. Omit to ask whether any of the action is judged.
   * @returns Whether its balance is judged.
   * @throws {HumanRefusal} As `shift` does.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three sources and their order.
   * @evidence contracts/development/implementation.md#principled-implementation Judgement follows the explicit override, the law's physical phase or a balance with positive actual weight.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads the explicit override, physical declaration, or prepared balance in that order. A cut limits both physical and requested phases to the placed lifetime.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing else turns the check on; a planted, posed action is not judged.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A reading.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function judged(span: ISpan, seconds?: number): boolean {
    if (seconds !== undefined && (seconds < span.entryTime || span.end < seconds)) return false;
    if (span.physical !== undefined) return span.physical;
    const physical: IAutoMovieMotionHumanActionPlan["physicalWindow"] =
      span.plan.physicalWindow;
    const local: number | undefined = seconds === undefined ? undefined : seconds - span.start;
    if (
      span.law?.physical === true &&
      (physical === undefined || (physical !== null && (local === undefined
        ? physical.from <= span.end - span.start && span.entryTime - span.start <= physical.to
        : physical.from <= local && local <= physical.to)))
    ) return true;
    const window: Window | undefined = span.plan.balanceWindow;
    if (window !== undefined)
      return local === undefined
        ? intersects(window, span.entryTime - span.start, span.end - span.start)
        : weightAt(window, local) > 0;
    return false;
  }

  /**
   * The parts of the placed span that can contribute to a balance audit.
   * `judged` still checks the precise weight at the individual sample.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the film clock and the separate exact sample predicate.
   * @evidence contracts/development/implementation.md#principled-implementation Intersects each local phase with the span's placed lifetime.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Return the whole span if declared, otherwise take up to two bounded ranges.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains both phases even if their bounds do not overlap.
   * @evidence contracts/development/implementation.md#efficient-algorithms Produces at most two intervals irrespective of film duration.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Uses the plan's existing numeric bounds.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns new interval values.
   */
  export function intervals(span: ISpan): IJudgedInterval[] {
    const physical: IAutoMovieMotionHumanActionPlan.IPhysicalWindow | null | undefined =
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

  /** Fit the requested edge durations to a numeric window, preserving their ratio. */
  function admitWindow(active: IShift, from: number, to: number): Window {
    const span: number = to - from;
    const ramp: IAutoMovieMotionHumanBalance.IRamp = active.ramp;
    const longest: number = Math.max(ramp.in, ramp.out);
    if (span < 0 || (span === 0 && longest > 0)) return null;
    if (ramp.in + ramp.out <= span)
      return { by: active.by, from, to, weight: active.weight, ramp };

    // Normalize before adding so large finite durations retain their ratio.
    const incoming: number = ramp.in / longest;
    const outgoing: number = ramp.out / longest;
    const unit: number = span / (incoming + outgoing);
    return {
      by: active.by,
      from,
      to,
      weight: active.weight,
      ramp: { in: incoming * unit, out: outgoing * unit },
    };
  }

  /** Resolve one open or close bound in the current action's seconds. */
  function actionSecond(
    bound: IAutoMovieMotionHumanBalance.IBound,
    field: string,
    start: number,
    timing: ITiming,
    resolve: Instant | undefined,
  ): number {
    const index: number = bound.index ?? 0;
    const offset: number = bound.offset ?? 0;
    if (!Number.isInteger(index) || index < 0)
      throw invalid(field, index, "name a nonnegative integer event occurrence");
    if (!Number.isFinite(offset))
      throw invalid(field, offset, "give a finite offset in seconds");
    if (bound.of !== undefined) {
      if (resolve === undefined)
        throw invalid(field, bound.of, "resolve that anchor in a performance");
      return resolve(instant(bound, bound.of)) - start;
    }
    if (index === 0 && bound.event === "start") return offset;
    if (index === 0 && bound.event === "end") return timing.duration + offset;
    let occurrence: number = 0;
    for (const event of timing.events)
      if (event.name === bound.event && occurrence++ === index)
        return event.share * timing.duration + offset;
    throw invalid(field, bound.event, "name an event and occurrence in the action's plan");
  }

  /** A parameter error with the balance term the author needs to correct. */
  function invalid(field: string, value: unknown, fix: string): HumanRefusal {
    return new HumanRefusal({
      kind: "parameter",
      axis: `balance.${field}`,
      value,
      feasible: null,
      reason: `the balance cannot use this ${field}`,
      fix,
    });
  }

  /** The refusal of a balance missing a field neither the caller nor the law gives. */
  function missing(field: string): HumanRefusal {
    return new HumanRefusal({
      kind: "parameter",
      axis: `balance.${field}`,
      value: undefined,
      feasible: null,
      reason: `the balance needs its ${field}, and the law recommends none`,
      fix: `give balance.${field}, or leave the balance out`,
    });
  }
}
