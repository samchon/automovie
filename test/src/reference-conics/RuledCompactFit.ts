import type { IAutoMovieCurve64 as G } from "@automovie/engine";
import { approximateAutoMovieRecoveryCompactCurves as approximate } from "../../../packages/recovery/src/curves/approximateAutoMovieRecoveryCompactCurves";
import type { AutoMovieRecoveryCompactApproximation as C } from "../../../packages/recovery/src/curves/AutoMovieRecoveryCompactApproximation";
import { createWriteStream } from "node:fs";
import { once } from "node:events";
import path from "node:path";
import { RuledCompactCurve as A } from "./RuledCompactCurve";
import type { RuledCompactInput as I } from "./RuledCompactInput";

/** Cubic-only representation selection over every coefficient actually consumed by the same ruled graph. */
export namespace RuledCompactFit {
  /** Aggregate scope and cost; per-curve decisions are streamed into an immutable ledger. */
  export interface Summary {
    /** Same additional source-curve error budget, millimetres. */
    toleranceMm: number;
    /** Explicit aggregate fitting/subdivision deadline. */
    wallBudgetMs: number;
    /** Actual fit and decision-ledger wall time, excluding input publication and generation. */
    milliseconds: number;
    /** All closed and graph-used open authorities, including retained/unattempted curves. */
    cohorts: { closed: Counts; open: Counts };
    /** Reasons are exhaustive over every retained input. */
    retainedReasons: { [reason: string]: number };
    /** Maximum accepted coefficient convex-hull estimate, not an outward-rounded certificate. */
    maximumAddedUpperEstimateMm: number;
    /** Largest independently sampled discrepancy inside accepted coefficient bounds. */
    maximumAddedObservedMm: number;
    /** Actual source callback invocations by the frozen generic fitter. */
    queries: number;
    /** Actual coefficient-hull subdivision visits. */
    boundVisits: number;
    /** JSONL containing every original identity, decision, span count and accepted error bound. */
    ledger: string;
  }
  /** Same cubic/phase schema on both sides; no removal of repeated Y values is credited as compression. */
  export interface Counts {
    /** Original number of curve authorities, unchanged by representation selection. */
    curves: number;
    /** Original actual cubic pieces in this cohort. */
    oldSpans: number;
    /** Final actual cubic pieces, including retained source representations. */
    newSpans: number;
    /** Independently admitted lower-cost replacements. */
    adopted: number;
    /** Original coefficients kept, explicitly including budget-limited inputs. */
    retained: number;
    /** Literal same-schema coordinate and phase float entries: thirteen per cubic. */
    oldFloat64Entries: number;
    /** Literal same-schema coordinate and phase float entries after selection. */
    newFloat64Entries: number;
  }

  /** Fit once per eligible curve, independently bound polynomial error, and keep every original relationship and unselected representation. */
  export async function run(loaded: I.Loaded, out: string, progress: (details: object) => Promise<void>): Promise<Summary> {
    const started: number = performance.now();
    const empty = (): Counts => ({ curves: 0, oldSpans: 0, newSpans: 0, adopted: 0, retained: 0, oldFloat64Entries: 0, newFloat64Entries: 0 });
    const summary: Summary = { toleranceMm: 0.5, wallBudgetMs: 180000, milliseconds: 0, cohorts: { closed: empty(), open: empty() }, retainedReasons: {}, maximumAddedUpperEstimateMm: 0, maximumAddedObservedMm: 0, queries: 0, boundVisits: 0, ledger: path.join(out, "curve-decisions.jsonl") };
    const stream: ReturnType<typeof createWriteStream> = createWriteStream(summary.ledger);
    let lastHeartbeat: number = started;
    let processed: number = 0;
    const qualifiedSections: Set<number> = new Set();
    const alive = (): boolean => performance.now() - started < summary.wallBudgetMs && process.memoryUsage.rss() <= 8 * 1024 ** 3;
    for (const entry of loaded.cohort) {
      const begin: number = performance.now();
      const original: G.Cubic = entry.holder.curve;
      const oldSpans: number = original.spans.length;
      const counts: Counts = summary.cohorts[entry.kind];
      ++counts.curves;
      counts.oldSpans += oldSpans;
      let reason: string = "not-smaller";
      let adopted: boolean = false;
      let queries: number = 0;
      let checked: A.Bound | null = null;
      if (!alive()) reason = "aggregate-budget-retained-unattempted";
      else if (oldSpans <= (original.closed ? 4 : 1)) reason = "already-at-initial-chart-floor";
      else {
        try {
          const prepared: A.Prepared = A.prepare(original);
          if (!prepared.accepted) reason = prepared.reason;
          else {
            const options: C.IOptions = { toleranceMm: summary.toleranceMm, degree: 3, maximumPieces: Math.min(1024, oldSpans - 1), maximumDepth: 12, maximumQueries: 12000 };
            const fitted: C.IResult = approximate(prepared.source, options);
            queries = fitted.queries;
            const candidate: G.Cubic | null = A.materialize(original, prepared, fitted);
            if (candidate === null) reason = fitted.status !== "complete" ? "fit-budget-or-admission-retained" : "exact-phase-materialization-retained";
            else if (candidate.spans.length >= oldSpans) reason = "not-smaller";
            else {
              checked = A.bound(original, candidate, summary.toleranceMm, alive);
              summary.boundVisits += checked.visits;
              if (!checked.accepted) reason = checked.reason;
              else {
                adopted = true;
                reason = "lower-cost-cubic-adopted";
                entry.holder.curve = candidate;
                loaded.bundle.summary.spans += candidate.spans.length - oldSpans;

                // These observations were not re-fitted to the native mesh.
                // Null is honest unavailable metadata, which the existing ruled
                // consumer records as unqualified while still using coefficients.
                entry.quality.sampleMaximumMm = null;
                entry.quality.polylineUpperEstimateMm = null;
                entry.quality.observationsPerSpan = null;
                entry.quality.toleranceMet = false;
                entry.quality.handleFallbacks = 0;
                qualifiedSections.add(entry.section);
                summary.maximumAddedUpperEstimateMm = Math.max(summary.maximumAddedUpperEstimateMm, checked.upperMm);
                summary.maximumAddedObservedMm = Math.max(summary.maximumAddedObservedMm, checked.observedMm);
              }
            }
          }
        } catch (error) {
          reason = "explicit-fit-exception: " + (error instanceof Error ? error.message : String(error));
        }
      }
      summary.queries += queries;
      const newSpans: number = entry.holder.curve.spans.length;
      counts.newSpans += newSpans;
      counts.oldFloat64Entries += 13 * oldSpans;
      counts.newFloat64Entries += 13 * newSpans;
      if (adopted) ++counts.adopted;
      else { ++counts.retained; summary.retainedReasons[reason] = (summary.retainedReasons[reason] ?? 0) + 1; }
      const record: string = JSON.stringify({ name: original.name, kind: entry.kind, section: entry.section, ordinal: entry.ordinal, adopted, reason, oldSpans, newSpans, queries, additionalUpperEstimateMm: checked?.accepted ? checked.upperMm : null, additionalObservedMm: checked?.observedMm ?? null, boundVisits: checked?.visits ?? 0, milliseconds: performance.now() - begin }) + "\n";
      if (!stream.write(record)) await once(stream, "drain");
      ++processed;
      if (performance.now() - lastHeartbeat > 1000) {
        await progress({ processed, total: loaded.cohort.length, cohorts: summary.cohorts, retainedReasons: summary.retainedReasons });
        lastHeartbeat = performance.now();
      }
    }
    stream.end();
    await once(stream, "finish");
    for (const section of qualifiedSections) loaded.bundle.reports[section]!.diagnostics.push("Derived same-phase cubic refit: native fit measurements are unavailable; additional coefficient error is separately bounded in curve-decisions.jsonl.");
    loaded.bundle.diagnostics.push("Derived cubic representation selection preserves source topology/phase; original acquisition policy is historical, not re-proved native accuracy.");
    summary.milliseconds = performance.now() - started;
    return summary;
  }
}
