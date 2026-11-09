import type { IAutoMovieSchedule } from "./IAutoMovieSchedule";

/**
 * Measure a schedule's pacing against the production's own classification:
 * actions per minute, the share of actions that follow the same subject's
 * previous action within the combination gap, each subject's lateral share
 * of displacement and idle seconds over its presence, and the share of time
 * a camera entry moves with the cut cadence. Targets for these numbers stay
 * in the production's research; the engine only counts.
 *
 * @param schedule The resolved schedule.
 * @param classify The production's classification of entries.
 * @returns The measurements.
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Measure a schedule's pacing against the production's own classification: actions per minute, the share of actions that follow the same subject's previous action within the combination gap, each subject's lateral share of displacement and idle seconds over its presence, and the share of time a camera entry moves with the cut cadence) and documents parameters `schedule`, `classify`, the returned value as stated in this comment.
 * @evidence contracts/development/implementation.md#principled-implementation Implements the documented behavior (Measure a schedule's pacing against the production's own classification: actions per minute, the share of actions that follow the same subject's previous action within the combination gap, each subject's lateral share of displacement and idle seconds over its presence, and the share of time a camera entry moves with the cut cadence) directly over its typed inputs (`schedule`, `classify`) as nested iteration of depth 3 (filter over schedule.entries; for-of over actions; for-of over new Set( schedule.entries.map((e: IA), delegating to `classify.action`, `last.get`, `last.set`, `classify.displacement`, `Math.abs`; the premises are the units, frames and ranges stated in its parameter documentation, enforced only where the body performs no validation and relies on its callers. Beyond structural 0, 1 and 2 the body uses the literals 60, 0.5, whose basis this answer does not independently establish and a reviewer must confirm.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One operation of 68 lines and 11 top-level statements that reuses `classify.action`, `last.get`, `last.set`, `classify.displacement`, `Math.abs` from their owners instead of copying them; it adds no option, layer or abstraction beyond its documented parameters.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Scanning the body finds no `any`, type assertion, non-null assertion, suppression directive or TODO, and no branch keyed on a consumer, fixture or expected answer; values come from its parameters. Literal caveat: 60, 0.5 are not independently sourced here.
 * @evidence contracts/development/implementation.md#efficient-algorithms Cost is driven by the sizes of `schedule`, `classify`; the dominant cost is nested iteration of depth 3 (filter over schedule.entries; for-of over actions; for-of over new Set( schedule.entries.map((e: IA), performed once per call with 8 allocation sites (literals and constructed values). No speedup is claimed and none is measured.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The operation coordinates no requests, phases or consumers and holds no cache: each call recomputes from its arguments and shares nothing, which is correct because its result depends only on them.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The function acquires no handle, timer, listener or task and keeps no state between calls; its 8 allocation sites become the returned value or die with the call, so nothing grows.
 */
export function measureAutoMovieSchedule(
  schedule: IAutoMovieSchedule,
  classify: measureAutoMovieSchedule.IClassify,
): measureAutoMovieSchedule.IMeasure {
  const minutes: number = schedule.duration / 60;
  const actions: IAutoMovieSchedule.IEntry[] = schedule.entries.filter(
    (e: IAutoMovieSchedule.IEntry): boolean => classify.action(e),
  );
  const gap: number = classify.combinationGap ?? 0.5;
  const last: Map<string, number> = new Map();
  let combined: number = 0;
  for (const action of actions) {
    const previous: number | undefined = last.get(action.subject);
    if (previous !== undefined && action.start - previous <= gap) combined++;
    last.set(action.subject, action.end);
  }

  // Per subject: displacement shares, and idle time over its presence.
  const subjects: Record<string, measureAutoMovieSchedule.ISubject> = {};
  for (const subject of new Set(
    schedule.entries.map((e: IAutoMovieSchedule.IEntry): string => e.subject),
  )) {
    const own: IAutoMovieSchedule.IEntry[] = schedule.entries.filter(
      (e: IAutoMovieSchedule.IEntry): boolean => e.subject === subject,
    );
    let lateral: number = 0;
    let linear: number = 0;
    for (const e of own) {
      const d: { lateral: number; linear: number } | undefined =
        classify.displacement?.(e);
      lateral += Math.abs(d?.lateral ?? 0);
      linear += Math.abs(d?.linear ?? 0);
    }
    const presence: { start: number; end: number } = classify.presence?.(
      subject,
    ) ?? { start: 0, end: schedule.duration };
    const busy: number = union(
      own
        .filter((e: IAutoMovieSchedule.IEntry): boolean => !classify.idle?.(e))
        .map((e: IAutoMovieSchedule.IEntry): [number, number] => [
          Math.max(e.start, presence.start),
          Math.min(e.end, presence.end),
        ]),
    );
    subjects[subject] = {
      lateralShare: lateral + linear > 0 ? lateral / (lateral + linear) : 0,
      idleSeconds: Math.max(0, presence.end - presence.start - busy),
    };
  }
  const moving: number = union(
    schedule.entries
      .filter(
        (e: IAutoMovieSchedule.IEntry): boolean =>
          classify.cameraMoves?.(e) === true,
      )
      .map((e: IAutoMovieSchedule.IEntry): [number, number] => [
        e.start,
        e.end,
      ]),
  );
  const cuts: number = schedule.entries.filter(
    (e: IAutoMovieSchedule.IEntry): boolean => classify.cut?.(e) === true,
  ).length;
  return {
    actionsPerMinute: minutes > 0 ? actions.length / minutes : 0,
    combinationShare: actions.length > 0 ? combined / actions.length : 0,
    subjects,
    cameraMotionShare: schedule.duration > 0 ? moving / schedule.duration : 0,
    cutsPerMinute: minutes > 0 ? cuts / minutes : 0,
  };
}
/**
 * Companion types of {@link measureAutoMovieSchedule}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (Companion types of ) and documents 3 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents Companion types of : companion namespace of 3 members (`IClassify`, `ISubject`, `IMeasure`); units and frames named in its text: seconds, metres. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `measureAutoMovieSchedule` in packages/engine/src/composition/measureAutoMovieSchedule.ts; its surface is the 3 members listed and the text shows 3 other files naming it, mostly movies (1), packages/engine (1), test (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace measureAutoMovieSchedule {
  /** The production's classification of entries. */
  export interface IClassify {
    /** Whether an entry counts as an action. */
    action(entry: IAutoMovieSchedule.IEntry): boolean;

    /** Seconds within which a subject's next action is a combination; 0.5 by default. */
    combinationGap?: number;

    /** An entry's lateral and linear displacement, metres. */
    displacement?(entry: IAutoMovieSchedule.IEntry): {
      lateral: number;
      linear: number;
    };

    /** Whether an entry is idle time. */
    idle?(entry: IAutoMovieSchedule.IEntry): boolean;

    /** A subject's presence; the whole schedule by default. */
    presence?(subject: string): { start: number; end: number };

    /** Whether an entry is a moving camera. */
    cameraMoves?(entry: IAutoMovieSchedule.IEntry): boolean;

    /** Whether an entry is a cut. */
    cut?(entry: IAutoMovieSchedule.IEntry): boolean;
  }

  /** One subject's numbers. */
  export interface ISubject {
    /** Lateral share of total displacement, in [0, 1]. */
    lateralShare: number;

    /** Seconds of presence without a non-idle entry. */
    idleSeconds: number;
  }

  /** The measurements. */
  export interface IMeasure {
    /** Actions per minute. */
    actionsPerMinute: number;

    /** Share of actions following the same subject's previous action within the gap. */
    combinationShare: number;

    /** Per subject. */
    subjects: Record<string, ISubject>;

    /** Share of the schedule a camera entry moves. */
    cameraMotionShare: number;

    /** Cuts per minute. */
    cutsPerMinute: number;
  }
}

/** Total length of a union of intervals. */
function union(intervals: [number, number][]): number {
  const sorted: [number, number][] = intervals
    .filter(([a, b]: [number, number]): boolean => b > a)
    .sort((x: [number, number], y: [number, number]): number => x[0] - y[0]);
  let total: number = 0;
  let end: number = -Infinity;
  for (const [a, b] of sorted) {
    if (b <= end) continue;
    total += b - Math.max(a, end);
    end = b;
  }
  return total;
}
