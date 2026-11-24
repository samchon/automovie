import type {
  IAutoMovieCaptureFindingDiff,
  IAutoMovieInspectionDiagnostics,
} from "@automovie/interface";

import { compareAutoMovieInspectionFindings } from "../scene/inspection/compareAutoMovieInspectionFindings.js";

/** One finding identity within one round. */
interface ISummary {
  /** The identity, with this round's category. */
  identity: Omit<IAutoMovieCaptureFindingDiff.IIdentity, "category">;

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
 * `not-sampled` when no coverage row of that round reaches into it. An identity
 * both rounds have is `carried`, and its change compares the two worst
 * observations.
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
  const entries: IAutoMovieCaptureFindingDiff.IEntry[] = [];
  for (const [key, summary] of now) {
    const old: ISummary | undefined = before.get(key);
    entries.push(
      old === undefined
        ? lone(summary, earlier, "current")
        : {
            ...identityOf(old, summary),
            state: "carried",
            change: changeOf(
              compareAutoMovieInspectionFindings(
                summary.worst.finding,
                old.worst.finding,
              ),
            ),
            earlier: old.worst,
            current: summary.worst,
          },
    );
  }
  for (const [key, summary] of before)
    if (!now.has(key)) entries.push(lone(summary, current, "earlier"));

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

/** Classify an identity only one round has against the other round's coverage. */
function lone(
  summary: ISummary,
  other: IAutoMovieInspectionDiagnostics.IAudit,
  holder: "earlier" | "current",
): IAutoMovieCaptureFindingDiff.IEntry {
  const identity: IAutoMovieCaptureFindingDiff.IIdentity = identityOf(summary);
  const spans: ISpan[] = spansOf(other, summary.identity);
  let cause: IAutoMovieCaptureFindingDiff.Cause | undefined;
  for (const [from, to] of summary.intervals) {
    cause = causeOver(spans, from, to);
    if (cause !== undefined) break;
  }
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
 * The round's coverage of one obligation, merged across consecutive output
 * frames of one status.
 */
function spansOf(
  audit: IAutoMovieInspectionDiagnostics.IAudit,
  identity: Pick<ISummary["identity"], "scope" | "check" | "key">,
): ISpan[] {
  const ranges: IAutoMovieInspectionDiagnostics.ICoverageRange[] =
    audit.coverage
      .filter(
        (range: IAutoMovieInspectionDiagnostics.ICoverageRange): boolean =>
          range.scope === identity.scope &&
          range.coverage.check === identity.check &&
          range.coverage.key === identity.key,
      )
      .sort(
        (
          left: IAutoMovieInspectionDiagnostics.ICoverageRange,
          right: IAutoMovieInspectionDiagnostics.ICoverageRange,
        ): number => left.first.filmSeconds - right.first.filmSeconds,
      );
  const spans: ISpan[] = [];
  for (const range of ranges) {
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
  return spans;
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
