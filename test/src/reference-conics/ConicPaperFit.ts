import { AutoMovieRecoveryConicApproximation as C, approximateAutoMovieRecoveryConicsAhn, approximateAutoMovieRecoveryConicsGhosh } from "@automovie/recovery";
import { ConicPaperInput as I } from "./ConicPaperInput";

/** Bounded paper experiments; unsupported source charts remain missing rather than becoming source-mesh fallbacks. */
export namespace ConicPaperFit {
  /** Independently saved rational coefficients and explicit incomplete coverage. */
  export interface Record {
    /** Original section/closed-loop identity, shared with the input and generated surfaces. */
    key: string;
    /** Complete covers every source chart; partial/refused omit charts; unattempted reached the global wall budget. */
    status: "complete" | "partial" | "refused" | "unattempted";
    /** Accepted rational quadratics only, with no cubic or mesh fallback for missing intervals. */
    arcs: C.IArc[];
    /** Actual source evaluation and derivative callbacks, including a budget-triggering call. */
    queries: number;
    /** Distinct algorithm admission failures, numerical qualifications and experiment limits. */
    diagnostics: string[];
  }
  /** Aggregation separates anatomical label, source quality and actual algorithm status. */
  export interface Count {
    /** Number of original closed-loop curve records in this category. */
    curves: number;
    /** Total original cubic spans belonging to those closed-loop records. */
    spans: number;
    /** Curves whose every original cubic chart produced complete conic coverage. */
    complete: number;
    /** Curves with some admitted conics and some omitted source coverage. */
    partial: number;
    /** Attempted curves with no admitted rational coefficients. */
    refused: number;
    /** Curves not started after the global fitting wall budget expired. */
    unattempted: number;
    /** Number of admitted rational quadratic arcs, including arcs on partial curves. */
    conicArcs: number;
  }
  /** Measured fitting scope, cost and finite independent polyline comparisons. */
  export interface Result {
    /** Selected numerical paper adaptation, ahn or ghosh. */
    method: string;
    /** Fitting, aggregation and held-out comparison wall time, in milliseconds. */
    milliseconds: number;
    /** Requested sampled conic approximation tolerance, in millimetres. */
    toleranceMm: number;
    /** Per-source-chart adaptive subdivision depth limit. */
    maximumDepth: number;
    /** Global elapsed-time limit checked before starting each closed source curve, in milliseconds. */
    wallBudgetMs: number;
    /** Maximum source callbacks allowed on one original closed-loop record. */
    queryBudgetPerCurve: number;
    /** One attributed result for every original closed loop, including unattempted records. */
    records: Record[];
    /** Aggregate counts for all curves and independently for each region and saved quality status. */
    groups: { [name: string]: Count };
    /** Total actual source callbacks over the fitting run. */
    queries: number;
    /** Largest solver-reported finite sample error, in millimetres; not a continuous certificate. */
    maximumReportedSampleErrorMm: number;
    /** Method-specific mandatory source-critical boundaries and shared preprocessing cost; no source smoothing is performed. */
    critical: I.CriticalSummary;
    /** Bidirectional held-out polyline estimates for the first complete curve of each region; not population-wide bounds. */
    independent: { region: string; key: string; arcs: number; polylineEstimateMm: number }[];
  }

  /** Fit all closed inputs in source order, preserving every omitted and unattempted chart in the receipt. */
  export function run(packet: I.Packet, method: "ahn" | "ghosh", wallBudgetMs: number): Result {
    const started: number = performance.now();
    const solver: typeof approximateAutoMovieRecoveryConicsAhn = method === "ahn" ? approximateAutoMovieRecoveryConicsAhn : approximateAutoMovieRecoveryConicsGhosh;
    const result: Result = { method, milliseconds: 0, toleranceMm: 0.5, maximumDepth: 8, wallBudgetMs,
      queryBudgetPerCurve: 100000, records: [], groups: {}, queries: 0, maximumReportedSampleErrorMm: 0,
      critical: { charts: 0, stationaryRoots: 0, zeroCurvatureRoots: 0, affineCriticalRoots: 0, collinearCharts: 0, selectedBreaks: 0, collapsedBreaks: 0, computedCharts: 0, cachedCharts: 0, milliseconds: 0 }, independent: [] };
    const validated: Set<string> = new Set();
    for (const loop of packet.loops) {
      const record: Record = { key: loop.key, status: "unattempted", arcs: [], queries: 0, diagnostics: [] };
      if (performance.now() - started < wallBudgetMs) {
        let failures: number = 0;
        for (let i: number = 0; i < loop.curve.spans.length; ++i) {
          try {
            const chart: C.ICurve = I.chart(loop.curve.spans[i]!, i, (): void => {
              ++record.queries;
              if (record.queries > result.queryBudgetPerCurve) throw new Error("Experiment query budget reached; remaining source charts omitted.");
            }, method, (summary: I.CriticalSummary, diagnostics: readonly string[]): void => {
              for (const key of Object.keys(summary) as (keyof I.CriticalSummary)[]) result.critical[key] += summary[key];
              for (const message of diagnostics)
                if (!record.diagnostics.includes("critical: " + message)) record.diagnostics.push("critical: " + message);
            });
            const fitted: C.IResult = solver(chart, { toleranceMm: result.toleranceMm, maximumArcs: 32, maximumDepth: result.maximumDepth });
            record.arcs.push(...fitted.arcs);
            if (fitted.status !== "complete") ++failures;
            for (const message of fitted.diagnostics)
              if (!record.diagnostics.includes(message)) record.diagnostics.push(message);
            result.maximumReportedSampleErrorMm = Math.max(result.maximumReportedSampleErrorMm, fitted.maximumSampleErrorMm);
            if (record.queries > result.queryBudgetPerCurve) { ++failures; break; }
          } catch (error) {
            ++failures;
            record.diagnostics.push(error instanceof Error ? error.message : String(error));
            if (record.queries > result.queryBudgetPerCurve) break;
          }
        }
        record.status = failures === 0 ? "complete" : record.arcs.length > 0 ? "partial" : "refused";
      } else record.diagnostics.push("Experiment wall budget reached before this source curve was attempted.");
      result.records.push(record);
      result.queries += record.queries;
      for (const name of ["all", "region:" + loop.region, "quality:" + loop.quality]) {
        const count: Count = result.groups[name] ?? { curves: 0, spans: 0, complete: 0, partial: 0, refused: 0, unattempted: 0, conicArcs: 0 };
        ++count.curves;
        count.spans += loop.curve.spans.length;
        ++count[record.status];
        count.conicArcs += record.arcs.length;
        result.groups[name] = count;
      }

      // Independent geometry comparisons use held-out polylines, not the fit's parameter residual.
      if (record.status === "complete" && !validated.has(loop.region)) {
        result.independent.push({ region: loop.region, key: loop.key, arcs: record.arcs.length, polylineEstimateMm: compare(loop, record.arcs) });
        validated.add(loop.region);
      }
      if (result.records.length % 100 === 0)
        process.stdout.write(JSON.stringify({ event: "conic-fit-progress", method, curves: result.records.length, elapsedMs: performance.now() - started, count: result.groups.all }) + "\n");
    }
    result.milliseconds = performance.now() - started;
    return result;
  }

  /** A finite bidirectional point-to-polyline estimate on one independently selected complete curve per region. */
  function compare(loop: I.Loop, arcs: readonly C.IArc[]): number {
    let maximum: number = 0;
    for (const arc of arcs) {
      const ordinal: number = Math.min(loop.curve.spans.length - 1, Math.floor(arc.domain[0]));
      const source: C.Point[] = [];
      const fitted: C.Point[] = [];
      for (let i: number = 0; i <= 32; ++i) {
        source.push(I.value(loop.curve.spans[ordinal]!, arc.domain[0] - ordinal + (arc.domain[1] - arc.domain[0]) * i / 32, 0));
        fitted.push(C.evaluate(arc, i / 32));
      }
      for (const [a, b] of [[source, fitted], [fitted, source]])
        for (const p of a!) {
          let closest: number = Infinity;
          for (let i: number = 1; i < b!.length; ++i) closest = Math.min(closest, distance(p, b![i - 1]!, b![i]!));
          maximum = Math.max(maximum, closest);
        }
    }
    return maximum;
  }

  /** Euclidean point-to-segment distance, in the original millimetre chart. */
  function distance(p: C.Point, a: C.Point, b: C.Point): number {
    const x: number = b[0] - a[0];
    const y: number = b[1] - a[1];
    const square: number = x * x + y * y;
    const t: number = square === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * x + (p[1] - a[1]) * y) / square));
    return Math.hypot(p[0] - a[0] - t * x, p[1] - a[1] - t * y);
  }
}
