import type {
  IAutoMovieCaptureFindingDiff,
  IAutoMovieInspectionDiagnostics,
} from "@automovie/interface";

import { compareAutoMovieInspectionFindings } from "../../scene/inspection/internal/compareAutoMovieInspectionFindings.js";
import { sameAutoMovieInspectionShotClock } from "../../scene/inspection/sameAutoMovieInspectionShotClock.js";

/** The reducer's saved clocks and sample count for one finding episode. */
type IEpisode = IAutoMovieInspectionDiagnostics.IEpisode;

/** The reducer's saved coverage of consecutive frames or one isolated sample. */
type ICoverageRange = IAutoMovieInspectionDiagnostics.ICoverageRange;

/** A captured film sample or exact witness clock. */
type ITime = IAutoMovieInspectionDiagnostics.ITime;

type IInterval = IAutoMovieInspectionDiagnostics.IInterval;

interface IUncovered {
  cause: IAutoMovieCaptureFindingDiff.Cause;

  uncovered: IInterval[];
}

/** One finding identity within one round. */
interface ISummary {
  /** Fields that identify the finding across rounds. */
  identity: Omit<IAutoMovieCaptureFindingDiff.IIdentity, "category">;

  /** Address of the coverage shared by the findings of this obligation. */
  obligation: string;

  /** The worst observation across the identity's episodes. */
  worst: IAutoMovieInspectionDiagnostics.IObservation;

  /** Episodes whose actual samples must be covered. */
  episodes: IEpisode[];
}

/**
 * Compare this round's inspection findings with an earlier round's and decide
 * the round outcome from its errors.
 *
 * Each finding identity, its `scope`, `check`, `key`, `code` and ordered
 * `paths`, is summarized per round by its worst observation across its
 * episodes, under compareAutoMovieInspectionFindings, the order the reducer
 * keeps an episode's worst witness by.
 *
 * An identity only one round has is `fixed` or `new` only when the other round
 * checked its episode samples. An isolated second can match a recorded sample
 * exactly. To match inside a range, the captured frame clocks must agree on the
 * zero-origin output grid and every required frame must be checked. The elapsed
 * bounds of two ranges cannot establish that on their own. An identity both
 * rounds have is `carried` only if each audit checked the samples of both sets
 * of episodes. Its change compares the worst observations. With insufficient
 * coverage it is `unmatched` with the open coverage status or `not-sampled`,
 * retaining all available witnesses.
 *
 * The outcome reads errors only: `worse` when an error is new or carried worse,
 * `better` when none is new, carried worse or unmatched and one is fixed or
 * carried better, and `same` otherwise.
 *
 * @param props The earlier round's audit and this round's, either absent when
 *   that record has no diagnostics.
 * @returns The compared entries and outcome, or `omitted` naming the records
 *   without diagnostics.
 */
export function diffAutoMovieCaptureFindings(props: {
  /** The earlier round's recorded audit, absent when its record has none. */
  earlier: IAutoMovieInspectionDiagnostics.IAudit | undefined;

  /** This round's audit, absent when no drawn cell supplied diagnostics. */
  current: IAutoMovieInspectionDiagnostics.IAudit | undefined;
}): IAutoMovieCaptureFindingDiff {
  const { earlier, current }: typeof props = props;
  if (earlier === undefined || current === undefined)
    return {
      state: "omitted",
      lacking: [
        ...(earlier === undefined ? ["earlier" as const] : []),
        ...(current === undefined ? ["current" as const] : []),
      ],
    };

  // Summarize both rounds, then walk this round's identities before the earlier-only ones.
  const before: Map<string, ISummary> = summarize(earlier);
  const now: Map<string, ISummary> = summarize(current);
  const obligations: Set<string> = new Set();
  for (const summary of before.values()) obligations.add(summary.obligation);
  for (const summary of now.values()) obligations.add(summary.obligation);
  const earlierSpans: Map<string, ICoverageRange[]> = indexCoverage(
    earlier,
    obligations,
  );
  const currentSpans: Map<string, ICoverageRange[]> = indexCoverage(
    current,
    obligations,
  );

  const entries: IAutoMovieCaptureFindingDiff.IEntry[] = [];
  for (const [key, summary] of now) {
    const old: ISummary | undefined = before.get(key);
    const coveredEarlier: readonly ICoverageRange[] =
      earlierSpans.get(summary.obligation) ?? [];
    entries.push(
      old === undefined
        ? lone(summary, coveredEarlier, "current")
        : carried(
            old,
            summary,
            coveredEarlier,
            currentSpans.get(summary.obligation) ?? [],
          ),
    );
  }
  for (const [key, summary] of before)
    if (!now.has(key))
      entries.push(
        lone(summary, currentSpans.get(summary.obligation) ?? [], "earlier"),
      );

  // Errors alone decide the outcome.
  const errors: IAutoMovieCaptureFindingDiff.IEntry[] = entries.filter(
    (entry: IAutoMovieCaptureFindingDiff.IEntry): boolean =>
      entry.category === "error",
  );
  const outcome: "worse" | "better" | "same" = errors.some(
    (entry: IAutoMovieCaptureFindingDiff.IEntry): boolean =>
      entry.state === "new" ||
      (entry.state === "carried" && entry.change === "worse"),
  )
    ? "worse"
    : !errors.some(
          (entry: IAutoMovieCaptureFindingDiff.IEntry): boolean =>
            entry.state === "unmatched",
        ) &&
        errors.some(
          (entry: IAutoMovieCaptureFindingDiff.IEntry): boolean =>
            entry.state === "fixed" ||
            (entry.state === "carried" && entry.change === "better"),
        )
      ? "better"
      : "same";
  return { state: "compared", outcome, entries };
}

/**
 * Group one round's episodes by identity, keeping the worst observation and
 * every episode's span.
 */
function summarize(
  audit: IAutoMovieInspectionDiagnostics.IAudit,
): Map<string, ISummary> {
  const output: Map<string, ISummary> = new Map();
  for (const episode of audit.episodes) {
    const { finding }: IAutoMovieInspectionDiagnostics.IObservation =
      episode.worst;
    const identity: ISummary["identity"] = {
      scope: episode.scope,
      check: finding.check,
      key: finding.key,
      code: finding.code,
      paths: [...finding.paths],
    };
    const key: string = JSON.stringify([
      identity.scope,
      identity.check,
      identity.key,
      identity.code,
      identity.paths,
    ]);
    const summary: ISummary | undefined = output.get(key);
    if (summary === undefined) {
      output.set(key, {
        identity,
        obligation: obligationKey(identity.scope, identity),
        worst: episode.worst,
        episodes: [episode],
      });
      continue;
    }

    // The earlier episode keeps a tie, as the reducer keeps the earlier witness.
    if (compareAutoMovieInspectionFindings(finding, summary.worst.finding) > 0)
      summary.worst = episode.worst;
    summary.episodes.push(episode);
  }
  return output;
}

/** Compare two worst witnesses only across mutually checked episode spans. */
function carried(
  old: ISummary,
  now: ISummary,
  earlier: readonly ICoverageRange[],
  current: readonly ICoverageRange[],
): IAutoMovieCaptureFindingDiff.IEntry {
  const identity: IAutoMovieCaptureFindingDiff.IIdentity = identityOf(old, now);
  const observations: {
    earlier: IAutoMovieInspectionDiagnostics.IObservation;
    current: IAutoMovieInspectionDiagnostics.IObservation;
  } = { earlier: old.worst, current: now.worst };

  // The current round is the first place to recheck a missing span.
  const currentGap: IUncovered | undefined = findUncovered(current, old, now);
  const earlierGap: IUncovered | undefined = findUncovered(earlier, old, now);
  const gap: IUncovered | undefined = currentGap ?? earlierGap;
  if (gap !== undefined)
    return {
      ...identity,
      ...observations,
      state: "unmatched",
      cause: gap.cause,
      uncovered: [
        ...(currentGap?.uncovered ?? []),
        ...(earlierGap?.uncovered ?? []),
      ],
    };

  const order: number = compareAutoMovieInspectionFindings(
    now.worst.finding,
    old.worst.finding,
  );
  return {
    ...identity,
    ...observations,
    state: "carried",
    change: changeOf(order),
  };
}

/** Classify an identity only one round has against the other round's coverage. */
function lone(
  summary: ISummary,
  other: readonly ICoverageRange[],
  holder: "earlier" | "current",
): IAutoMovieCaptureFindingDiff.IEntry {
  const identity: IAutoMovieCaptureFindingDiff.IIdentity = identityOf(summary);
  const gap: IUncovered | undefined = findUncovered(other, summary);
  if (gap !== undefined)
    return holder === "earlier"
      ? {
          ...identity,
          state: "unmatched",
          ...gap,
          earlier: summary.worst,
          current: null,
        }
      : {
          ...identity,
          state: "unmatched",
          ...gap,
          earlier: null,
          current: summary.worst,
        };
  return holder === "earlier"
    ? { ...identity, state: "fixed", earlier: summary.worst, current: null }
    : { ...identity, state: "new", earlier: null, current: summary.worst };
}

/** Read one audit's first uncovered span among episodes of the same identity. */
function findUncovered(
  ranges: readonly ICoverageRange[],
  ...summaries: ISummary[]
): IUncovered | undefined {
  let result: IUncovered | undefined;
  for (const summary of summaries)
    for (const episode of summary.episodes) {
      const gap: IUncovered | undefined = uncoveredOf(ranges, episode);
      if (gap === undefined) continue;
      result ??= { cause: gap.cause, uncovered: [] };
      for (const interval of gap.uncovered) result.uncovered.push(interval);
    }
  return result;
}

/**
 * The identity with the category that counts: an error when either round's
 * worst is one.
 */
function identityOf(
  ...summaries: ISummary[]
): IAutoMovieCaptureFindingDiff.IIdentity {
  return {
    ...summaries[0]!.identity,
    category: summaries.some(
      (summary: ISummary): boolean =>
        summary.worst.finding.category === "error",
    )
      ? "error"
      : "warning",
  };
}

/** Name the sign of the order. */
function changeOf(order: number): "worse" | "better" | "same" {
  return order > 0 ? "worse" : order < 0 ? "better" : "same";
}

/**
 * Index relevant coverage once in the audit's first-observation order. Keep the
 * reducer's original endpoints as independently observed sample clocks.
 */
function indexCoverage(
  audit: IAutoMovieInspectionDiagnostics.IAudit,
  obligations: ReadonlySet<string>,
): Map<string, ICoverageRange[]> {
  const indexed: Map<string, ICoverageRange[]> = new Map();
  if (obligations.size === 0) return indexed;
  for (const range of audit.coverage) {
    const key: string = obligationKey(range.scope, range.coverage);
    if (!obligations.has(key)) continue;
    const ranges: ICoverageRange[] | undefined = indexed.get(key);
    if (ranges === undefined) indexed.set(key, [range]);
    else ranges.push(range);
  }
  return indexed;
}

/** Address an obligation without delimiter ambiguities in its owner fields. */
function obligationKey(
  scope: string,
  row: Pick<IAutoMovieInspectionDiagnostics.ICoverage, "check" | "key">,
): string {
  return JSON.stringify([scope, row.check, row.key]);
}

/**
 * Match an episode's concrete sampled frames, preserving the temporal bounds of
 * an exact witness that differs from the enclosing sample.
 */
function uncoveredOf(
  ranges: readonly ICoverageRange[],
  episode: IEpisode,
): IUncovered | undefined {
  if (
    episode.sampledShotClock === false ||
    [episode.first.time, episode.worst.time].some(
      (time: ITime): boolean =>
        time.shot !== undefined &&
        !sameAutoMovieInspectionShotClock(time, episode.last),
    )
  )
    return { cause: "not-sampled", uncovered: [episodeExtent(episode)] };

  const from: number = Math.min(
    episode.first.time.filmSeconds,
    episode.last.filmSeconds,
  );
  const to: number = Math.max(
    episode.first.time.filmSeconds,
    episode.last.filmSeconds,
  );
  const last: number | undefined = episode.last.outputFrame;
  const first: number | undefined =
    last === undefined ? undefined : last - episode.samples + 1;
  const knowEpisodeClock: boolean =
    episode.sampledShotClock === true || episode.samples === 1;
  const canSplit: boolean =
    knowEpisodeClock &&
    first !== undefined &&
    last !== undefined &&
    last > 0 &&
    episode.first.finding.witness.time === undefined &&
    episode.worst.finding.witness.time === undefined &&
    episode.first.time.outputFrame === first &&
    sameOutputGrid(episode.first.time, episode.last);
  const uncovered: IInterval[] = [];
  let through: number = first === undefined ? -1 : first - 1;
  let open: IAutoMovieCaptureFindingDiff.Cause | undefined;
  for (const range of ranges) {
    const status: ICoverageRange["coverage"]["status"] = range.coverage.status;
    if (range.last.filmSeconds < from || to < range.first.filmSeconds) continue;

    // A recorded sample can match independently of the surrounding rate.
    if (
      episode.samples === 1 &&
      from === to &&
      (sameRecordedSample(range.first, episode.last) ||
        sameRecordedSample(range.last, episode.last))
    ) {
      if (status === "checked") return undefined;
      open ??= status;
      continue;
    }

    const startFrame: number | undefined = range.first.outputFrame;
    const endFrame: number | undefined = range.last.outputFrame;
    if (
      first === undefined ||
      last === undefined ||
      startFrame === undefined ||
      endFrame === undefined ||
      endFrame < first ||
      last < startFrame ||
      !knowEpisodeClock ||
      (range.sampledShotClock !== true && range.samples > 2) ||
      !sameAutoMovieInspectionShotClock(range.first, episode.last) ||
      !sameAutoMovieInspectionShotClock(range.last, episode.last) ||
      !sameOutputGrid(range.first, episode.last) ||
      !sameOutputGrid(range.last, episode.last) ||
      (episode.first.finding.witness.time === undefined &&
        !sameOutputGrid(episode.first.time, episode.last)) ||
      (range.first.filmSeconds === episode.last.filmSeconds &&
        !sameRecordedSample(range.first, episode.last)) ||
      (range.last.filmSeconds === episode.last.filmSeconds &&
        !sameRecordedSample(range.last, episode.last))
    )
      continue;
    if (status !== "checked") {
      open ??= status;
      continue;
    }
    if (
      through < endFrame &&
      ((canSplit && through + 1 < startFrame) ||
        (startFrame <= through + 1 &&
          (first <= through || range.first.filmSeconds <= from)))
    ) {
      if (through + 1 < startFrame)
        uncovered.push(gridInterval(episode.last, through + 1, startFrame - 1));
      through = endFrame;
      if (
        uncovered.length === 0 &&
        last <= through &&
        to <= range.last.filmSeconds
      )
        return undefined;
    }
  }
  if (canSplit && last !== undefined && through < last)
    uncovered.push(gridInterval(episode.last, through + 1, last));
  return {
    cause: open ?? "not-sampled",
    uncovered: uncovered.length === 0 ? [episodeExtent(episode)] : uncovered,
  };
}

function episodeExtent(episode: IEpisode): IInterval {
  const first: number = episode.first.time.filmSeconds;
  const worst: number = episode.worst.time.filmSeconds;
  const last: number = episode.last.filmSeconds;
  return {
    from: Math.min(first, worst, last),
    to: Math.max(first, worst, last),
  };
}

function gridInterval(anchor: ITime, first: number, last: number): IInterval {
  const from: number = (first / anchor.outputFrame!) * anchor.filmSeconds;
  const to: number = (last / anchor.outputFrame!) * anchor.filmSeconds;
  return {
    from: from - 2 * Number.EPSILON * from,
    to: to + 2 * Number.EPSILON * to,
  };
}

/** Match exact recorded clocks without inferring a retimed shot timestamp. */
function sameRecordedSample(left: ITime, right: ITime): boolean {
  return (
    left.filmSeconds === right.filmSeconds &&
    sameAutoMovieInspectionShotClock(left, right)
  );
}

/** Test the regular capture clock, where sample i occurs at i divided by fps. */
function sameOutputGrid(left: ITime, right: ITime): boolean {
  if (left.outputFrame === undefined || right.outputFrame === undefined)
    return false;
  const a: number = left.outputFrame * right.filmSeconds;
  const b: number = right.outputFrame * left.filmSeconds;
  // Each product includes one rounded frame instant and one multiplication.
  return (
    Number.isFinite(a) &&
    Number.isFinite(b) &&
    Math.abs(a - b) <= 2 * Number.EPSILON * Math.max(Math.abs(a), Math.abs(b))
  );
}
