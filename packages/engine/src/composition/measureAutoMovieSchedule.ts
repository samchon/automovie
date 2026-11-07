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
/** Companion types of {@link measureAutoMovieSchedule}. */
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
