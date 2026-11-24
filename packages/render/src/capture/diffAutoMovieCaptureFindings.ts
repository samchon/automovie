import type {
  IAutoMovieCaptureFindingDiff,
  IAutoMovieInspectionDiagnostics,
} from "@automovie/interface";

import { compareAutoMovieInspectionFindings } from "../scene/inspection/compareAutoMovieInspectionFindings.js";

/** One finding identity within one round. */
interface ISummary {
  /** The identity, with this round's category. */
  identity: Omit<IAutoMovieCaptureFindingDiff.IIdentity, "category">;

  /** Address of the coverage shared by the findings of this obligation. */
  obligation: string;

  /** The worst observation across the identity's episodes. */
  worst: IAutoMovieInspectionDiagnostics.IObservation;

  /**
   * Each episode's span in film seconds, from its first observation to its last
   * sample.
   */
  intervals: [from: number, to: number][];
}

/** Consecutive coverage of one obligation with one status. */
interface ISpan {
  /** First sample, film seconds. */
  from: number;

  /** Last sample, film seconds. */
  to: number;

  /** Output index of the last sample, when the sample has one. */
  frame: number | undefined;

  /** The coverage outcome over the span. */
  status: IAutoMovieInspectionDiagnostics.ICoverage["status"];
}

/**
 * Compare this round's inspection findings with an earlier round's and decide
 * the round outcome from its errors.
 *
 * Each finding identity, its `scope`, `check`, `key`, `code` and ordered
 * `paths`, is summarized per round by its worst observation across its
 * episodes, under compareAutoMovieInspectionFindings, the order the reducer
 * keeps an episode's worst witness by. Its intervals are its episodes' spans
 * from the first observation time to the last sample time.
 *
 * An identity only one round has is `fixed` or `new` only when the other
 * round's coverage shows its obligation `checked` over every one of those
 * intervals. Coverage ranges of one status merge across consecutive output
 * frames, because consecutive frames leave no unsampled time between them;
 * ranges apart by a gap do not. Otherwise the identity is `unmatched`, with the
 * other round's status over the first interval it did not check, or
 * `not-sampled` when no coverage span reaches all of it and no open coverage
 * reaches into it. An identity both rounds have is `carried` only if both
 * audits checked every interval of both rounds. Its change compares the two
 * worst observations. With insufficient coverage it stays `unmatched` and
 * retains both witnesses.
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
  const earlierSpans: Map<string, ISpan[]> = indexCoverage(
    earlier,
    obligations,
  );
  const currentSpans: Map<string, ISpan[]> = indexCoverage(
    current,
    obligations,
  );

  const entries: IAutoMovieCaptureFindingDiff.IEntry[] = [];
  for (const [key, summary] of now) {
    const old: ISummary | undefined = before.get(key);
    const coveredEarlier: readonly ISpan[] =
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
    const start: number = episode.first.time.filmSeconds;
    const end: number = episode.last.filmSeconds;
    const interval: [number, number] = [
      Math.min(start, end),
      Math.max(start, end),
    ];
    const summary: ISummary | undefined = output.get(key);
    if (summary === undefined) {
      output.set(key, {
        identity,
        obligation: obligationKey(identity.scope, identity),
        worst: episode.worst,
        intervals: [interval],
      });
      continue;
    }

    // The earlier episode keeps a tie, as the reducer keeps the earlier witness.
    if (compareAutoMovieInspectionFindings(finding, summary.worst.finding) > 0)
      summary.worst = episode.worst;
    summary.intervals.push(interval);
  }
  return output;
}

/** Compare two worst witnesses only across mutually checked episode spans. */
function carried(
  old: ISummary,
  now: ISummary,
  earlier: readonly ISpan[],
  current: readonly ISpan[],
): IAutoMovieCaptureFindingDiff.IEntry {
  const identity: IAutoMovieCaptureFindingDiff.IIdentity = identityOf(old, now);
  const observations: {
    earlier: IAutoMovieInspectionDiagnostics.IObservation;
    current: IAutoMovieInspectionDiagnostics.IObservation;
  } = { earlier: old.worst, current: now.worst };

  // The current round is the first place to recheck a missing span.
  const cause: IAutoMovieCaptureFindingDiff.Cause | undefined =
    firstUncovered(current, old, now) ?? firstUncovered(earlier, old, now);
  if (cause !== undefined)
    return { ...identity, ...observations, state: "unmatched", cause };

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
  other: readonly ISpan[],
  holder: "earlier" | "current",
): IAutoMovieCaptureFindingDiff.IEntry {
  const identity: IAutoMovieCaptureFindingDiff.IIdentity = identityOf(summary);
  const cause: IAutoMovieCaptureFindingDiff.Cause | undefined = firstUncovered(
    other,
    summary,
  );
  if (cause !== undefined)
    return holder === "earlier"
      ? {
          ...identity,
          state: "unmatched",
          cause,
          earlier: summary.worst,
          current: null,
        }
      : {
          ...identity,
          state: "unmatched",
          cause,
          earlier: null,
          current: summary.worst,
        };
  return holder === "earlier"
    ? { ...identity, state: "fixed", earlier: summary.worst, current: null }
    : { ...identity, state: "new", earlier: null, current: summary.worst };
}

/** Read one audit's first uncovered span among episodes of the same identity. */
function firstUncovered(
  spans: readonly ISpan[],
  ...summaries: ISummary[]
): IAutoMovieCaptureFindingDiff.Cause | undefined {
  for (const summary of summaries)
    for (const [from, to] of summary.intervals) {
      const cause: IAutoMovieCaptureFindingDiff.Cause | undefined = causeOver(
        spans,
        from,
        to,
      );
      if (cause !== undefined) return cause;
    }
  return undefined;
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
 * Index relevant coverage once in the audit's first-observation order, merging
 * consecutive output frames of one status for each obligation.
 */
function indexCoverage(
  audit: IAutoMovieInspectionDiagnostics.IAudit,
  obligations: ReadonlySet<string>,
): Map<string, ISpan[]> {
  const indexed: Map<string, ISpan[]> = new Map();
  if (obligations.size === 0) return indexed;
  for (const range of audit.coverage) {
    const key: string = obligationKey(range.scope, range.coverage);
    if (!obligations.has(key)) continue;
    let spans: ISpan[] | undefined = indexed.get(key);
    if (spans === undefined) {
      spans = [];
      indexed.set(key, spans);
    }
    const last: ISpan | undefined = spans.at(-1);
    const frame: number | undefined = range.first.outputFrame;
    if (
      last !== undefined &&
      last.status === range.coverage.status &&
      last.frame !== undefined &&
      frame !== undefined &&
      frame <= last.frame + 1
    ) {
      last.to = Math.max(last.to, range.last.filmSeconds);
      last.frame = range.last.outputFrame;
      continue;
    }
    spans.push({
      from: range.first.filmSeconds,
      to: range.last.filmSeconds,
      frame: range.last.outputFrame,
      status: range.coverage.status,
    });
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
 * Undefined when one checked span holds the interval, otherwise why it does
 * not.
 */
function causeOver(
  spans: readonly ISpan[],
  from: number,
  to: number,
): IAutoMovieCaptureFindingDiff.Cause | undefined {
  if (
    spans.some(
      (span: ISpan): boolean =>
        span.status === "checked" && span.from <= from && to <= span.to,
    )
  )
    return undefined;
  const open: ISpan | undefined = spans.find(
    (span: ISpan): boolean =>
      span.status !== "checked" && span.from <= to && from <= span.to,
  );
  return open === undefined || open.status === "checked"
    ? "not-sampled"
    : open.status;
}
