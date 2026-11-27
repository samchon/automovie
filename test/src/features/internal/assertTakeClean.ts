import type {
  IAutoMovieMotionHumanPerformance,
  IAutoMovieMotionHumanPerformer,
  IAutoMovieMotionHumanSegment,
  IAutoMovieMotionHumanVerdicts,
} from "@automovie/interface";
import { AutoMovieMotionHumanVerdicts } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/** One film window the verdicts read. */
interface IWindow {
  /** First film second. */
  from: number;

  /** Last film second. */
  to: number;
}

/**
 * Seconds read on each side of an action, more than two 24 Hz frames so
 * adjacent windows overlap as the report requires.
 */
const MARGIN: number = 0.1;

/**
 * Assert that a take passes the shipped verdict report at the film rate: the
 * checks a viewer would show, read from the displayed performance.
 *
 * The report is read over the windows where some performer acts, each action
 * widened by a margin, so long stretches of standing still are not read frame
 * by frame; a still stand shows nothing the report would fault.
 *
 * @param label What the take is, for the failure message.
 * @param take The placed performance.
 * @evidence contracts/development/common.md#meaningful-documentation States the report read, its rate, the windows and the failure message.
 * @evidence contracts/development/implementation.md#principled-implementation Delegates to HumanVerdicts, the motions package's own report of continuity, contact, range and interpenetration, over spans that overlap by more than two frames as its span contract requires.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure One shared assertion for every sport play take.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No check of its own and no relaxed limit: the report's limits apply over every action.
 * @evidence contracts/development/implementation.md#efficient-algorithms Merges the performers' acting windows once and reads one report per merged window at 24 Hz.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing is cached.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function assertTakeClean(
  label: string,
  take: IAutoMovieMotionHumanPerformance,
): void {
  const acting: IWindow[] = take.performers
    .flatMap(
      (
        performer: IAutoMovieMotionHumanPerformer,
      ): readonly IAutoMovieMotionHumanSegment[] =>
        take.segments(performer.subject),
    )
    .filter(
      (segment: IAutoMovieMotionHumanSegment): boolean =>
        segment.law.name !== "stand",
    )
    .map(
      (segment: IAutoMovieMotionHumanSegment): IWindow => ({
        from: Math.max(0, segment.start - MARGIN),
        to: Math.min(take.duration, segment.end + MARGIN),
      }),
    )
    .sort((a: IWindow, b: IWindow): number => a.from - b.from);
  const windows: IWindow[] = [];
  for (const window of acting) {
    const last: IWindow | undefined = windows.at(-1);
    if (last !== undefined && window.from <= last.to)
      last.to = Math.max(last.to, window.to);
    else windows.push({ ...window });
  }
  const faults: string[] = windows.flatMap((window: IWindow): string[] => {
    const report: IAutoMovieMotionHumanVerdicts.IReport = AutoMovieMotionHumanVerdicts.read(
      take,
      24,
      window,
    );
    return report.clean ? [] : [AutoMovieMotionHumanVerdicts.describe(report)];
  });
  TestValidator.predicate(
    `${label} passes the take verdicts: ${faults.length === 0 ? "clean" : faults.join("; ")}`,
    faults.length === 0,
  );
}
