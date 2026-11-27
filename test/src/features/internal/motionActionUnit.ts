import type {
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanVerdicts,
} from "@automovie/interface";
import { HumanPerformance, AutoMovieMotionHumanVerdicts } from "@automovie/motions";

import type { motionComplaints } from "./motionComplaints";

/**
 * One action of a take checked on its own (`.agents/skills/motion/laws/
 * verification.md`): the action's segment found by its name and occurrence, the
 * shipped bounds read over its own span alone, and the reads its goal checks
 * share, so a unit spec asserts what its action does without a fault of another
 * action deciding its verdict.
 *
 * The grammar has no entry state: a performer starts standing and a prop starts
 * at rest, so a unit enters its action by the shortest chain that produces the
 * entry, and its checks read only the action it names.
 */
export namespace motionActionUnit {
  /**
   * The verdicts' film rate, frames per second: the rate `assertTakeClean`
   * reads them at.
   */
  export const RATE: number = 24;

  /** One film frame, seconds: a cut's continuity is read within one frame of it. */
  const FRAME: number = 1 / RATE;

  /**
   * Seconds read on each side of a span, more than two frames, as
   * `assertTakeClean` widens an action so the report sees across its cuts.
   */
  const MARGIN: number = 0.1;

  /**
   * The bounds that read a channel's continuity, which a cut can break
   * whichever action the reading is placed in
   * (`IAutoMovieMotionHumanVerdicts`).
   */
  const CONTINUITY: readonly string[] = ["jump", "reversal", "speed", "turn"];

  /**
   * The touch contract's placement bound, metres: 10 mm, the bound the crutch
   * specs read a hand on its handgrip by.
   */
  export const GRIP: number = 0.01;

  /**
   * How far a held prop drifts at most in its hand's frame, metres: the
   * everyday prop specs' custody bound (`diningTable.HOLD`).
   */
  export const HOLD: number = 0.005;

  /** A film span, seconds. */
  export interface ISpan {
    /** First film second. */
    from: number;

    /** Last film second. */
    to: number;
  }

  /**
   * A performer's action by its name and occurrence.
   *
   * @param take The take.
   * @param subject The performer.
   * @param name The action's name, as the segment states it.
   * @param occurrence Which occurrence of that name in the performer's chain,
   *   from 1.
   * @returns The segment.
   * @throws An `Error` naming the action when the chain has no such occurrence.
   */
  export function segment(
    take: HumanPerformance,
    subject: string,
    name: string,
    occurrence: number = 1,
  ): IAutoMovieMotionHumanSegment {
    const found: IAutoMovieMotionHumanSegment | undefined = take
      .segments(subject)
      .filter((s: IAutoMovieMotionHumanSegment): boolean => s.name === name)[
      occurrence - 1
    ];
    if (found === undefined)
      throw new Error(`${subject} has no ${name} #${occurrence}`);
    return found;
  }

  /**
   * The film second of an action's named event.
   *
   * @param act The action.
   * @param name The event.
   * @returns Film seconds.
   * @throws An `Error` naming the event when the plan has none of that name.
   */
  export function event(
    act: IAutoMovieMotionHumanSegment,
    name: string,
  ): number {
    const found: IAutoMovieMotionEvent | undefined = act.plan.events.find(
      (e: IAutoMovieMotionEvent): boolean => e.name === name,
    );
    if (found === undefined)
      throw new Error(`${act.name} has no ${name} event`);
    return act.start + found.share * act.plan.duration;
  }

  /**
   * The shipped bounds' findings (`AutoMovieMotionHumanVerdicts`, the limits a take is judged
   * by) that are one action's own: every finding the report places in this
   * action and occurrence, a finding between two people that involves the
   * performer within the span, and a continuity finding within one frame of the
   * span's either end, whatever action it is placed in, since a cut belongs to
   * both actions it joins.
   *
   * The report is read over the span widened by more than two frames, as
   * `assertTakeClean` reads an action. An overlay is placed in the action it
   * rides, so its span is given and its findings are those of that action
   * within it.
   *
   * @param take The take.
   * @param subject The performer.
   * @param act The action the findings are placed in.
   * @param span The span read; the action's own, entry to end, when absent.
   * @param parts For an overlay that owns some channels only, the parts whose
   *   findings are its own, matched against the finding's `where`; every part
   *   when absent.
   * @returns The findings, in the report's order.
   */
  export function findings(
    take: HumanPerformance,
    subject: string,
    act: IAutoMovieMotionHumanSegment,
    span: ISpan = { from: act.entryTime, to: act.end },
    parts?: RegExp,
  ): IAutoMovieMotionHumanVerdicts.IFinding[] {
    // The occurrence as the report counts it: the segments of the same id
    // up to this one (`AutoMovieMotionHumanVerdicts`' placement).
    const occurrence: number = take
      .segments(subject)
      .filter(
        (s: IAutoMovieMotionHumanSegment): boolean =>
          s.id === act.id && s.index <= act.index,
      ).length;
    const report: IAutoMovieMotionHumanVerdicts.IReport = AutoMovieMotionHumanVerdicts.read(
      take,
      RATE,
      {
        from: Math.max(0, span.from - MARGIN),
        to: Math.min(take.duration, span.to + MARGIN),
      },
    );
    const within: (seconds: number) => boolean = (seconds: number): boolean =>
      seconds >= span.from - FRAME && seconds <= span.to + FRAME;
    return report.findings.filter(
      (f: IAutoMovieMotionHumanVerdicts.IFinding): boolean => {
        const people: string[] = f.subject.split("+");
        if (people.includes(subject) === false) return false;
        if (people.length > 1) return within(f.seconds);
        if (parts !== undefined && parts.test(f.where) === false) return false;
        if (f.act === act.name && f.instance === occurrence)
          return within(f.seconds);
        return (
          CONTINUITY.includes(f.check) &&
          (Math.abs(f.seconds - span.from) <= FRAME ||
            Math.abs(f.seconds - span.to) <= FRAME)
        );
      },
    );
  }

  /**
   * Check the shipped bounds over one action's own span: none of its own
   * findings (`findings`) may stand.
   *
   * @param checks The spec's gatherer.
   * @param label The case, for the failure.
   * @param take The take.
   * @param subject The performer.
   * @param act The action the findings are placed in.
   * @param span The span read; the action's own, entry to end, when absent.
   * @param parts For an overlay, the parts whose findings are its own.
   */
  export function bounds(
    checks: motionComplaints.IGatherer,
    label: string,
    take: HumanPerformance,
    subject: string,
    act: IAutoMovieMotionHumanSegment,
    span: ISpan = { from: act.entryTime, to: act.end },
    parts?: RegExp,
  ): void {
    const own: IAutoMovieMotionHumanVerdicts.IFinding[] = findings(
      take,
      subject,
      act,
      span,
      parts,
    );
    checks.check(
      (): string =>
        `${label}: ${act.name} keeps the shipped bounds over ${span.from.toFixed(2)}-${span.to.toFixed(2)} s: ${own.map(describe).join("; ")}`,
      own.length === 0,
    );
  }

  /** One finding in the report's own words. */
  export function describe(f: IAutoMovieMotionHumanVerdicts.IFinding): string {
    return `${f.subject}.${f.act}#${f.instance} ${f.check} ${f.value.toFixed(4)} over ${f.limit} at ${f.seconds.toFixed(2)} s (${f.where})`;
  }
}
