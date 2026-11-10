import { AutoMovieRecoveryCompactApproximation as C, approximateAutoMovieRecoveryCompactCurves as approximate, type AutoMovieRecoveryConicApproximation as P } from "@automovie/recovery";
import type { ConicPaperInput as I } from "./ConicPaperInput";
import { CompactCurveSource as S } from "./CompactCurveSource";

/** Bounded whole-curve fitting keeps every unattempted source identity and does not hide a refused pilot. */
export namespace CompactCurveFit {
  /** Durable one-loop outcome; coefficients are new fit output, never an original-surface fallback. */
  export interface Record {
    /** Original section/closed-loop identity. */
    key: string;
    /** Whether a closed result can enter a coefficient-only loft. */
    status: "complete" | "partial" | "refused" | "unattempted" | "validation-refused";
    /** Actual returned coefficients and numerical work, absent only before fitting. */
    result: C.IResult | null;
    /** Original and fitted counts under the same planar shared-coordinate convention. */
    storage: { old: number; fitted: number };
    /** Original physical cubic count, distinct from new piece count. */
    oldSpans: number;
    /** Independent offset-node error, millimetres; null means no result was checked. */
    observedErrorMm: number | null;
    /** Source preparation, fitting and independent-check time, milliseconds. */
    milliseconds: number;
    /** Explicit original-source gap/plane refusal or caught numerical exception. */
    diagnostics: string[];
  }
  /** One method over the disclosed pilot with all other closed input retained as unattempted. */
  export interface Result {
    /** Fixed degree or storage-selected mixed polynomial/conic family. */
    degree: 3 | 4 | 5 | "mixed" | "bestValidated";
    /** Every original closed curve, including unavailable or unattempted ones. */
    records: Record[];
    /** Actual wall time through all disclosed method work. */
    milliseconds: number;
    /** Shared physical tolerance and finite solver limits. */
    options: C.IOptions;
  }

  /** Select one deterministic median per available region/quality stratum and its reciprocal neighbours. */
  export function pilot(packet: I.Packet): { keys: string[]; strata: { region: string; quality: string; population: number; seed: string }[] } {
    const groups: Map<string, I.Loop[]> = new Map();
    const byKey: Map<string, I.Loop> = new Map(packet.loops.map((loop: I.Loop): [string, I.Loop] => [loop.key, loop]));
    for (const loop of packet.loops) {
      const key: string = loop.region + ":" + loop.quality;
      const list: I.Loop[] = groups.get(key) ?? [];
      list.push(loop); groups.set(key, list);
    }
    const keys: Set<string> = new Set();
    const strata: { region: string; quality: string; population: number; seed: string }[] = [];
    for (const [, list] of [...groups.entries()].sort(([a], [b]): number => a.localeCompare(b))) {
      const seed: I.Loop = list[Math.floor(list.length / 2)]!;
      keys.add(seed.key);
      strata.push({ region: seed.region, quality: seed.quality, population: list.length, seed: seed.key });
      if (seed.above.length === 1) {
        const next: I.Loop | undefined = byKey.get((seed.section + 1) + ":" + seed.above[0]);
        if (next?.below.length === 1 && next.below[0] === seed.ordinal) keys.add(next.key);
      }
      if (seed.below.length === 1) {
        const previous: I.Loop | undefined = byKey.get((seed.section - 1) + ":" + seed.below[0]);
        if (previous?.above.length === 1 && previous.above[0] === seed.ordinal) keys.add(previous.key);
      }
    }
    return { keys: [...new Set([...strata.map((s: { seed: string }): string => s.seed), ...keys])], strata };
  }

  /** Fit across source knots until the method wall budget expires; the result never upgrades missed coverage. */
  export function run(packet: I.Packet, selected: ReadonlySet<string>, degree: C.IOptions["degree"], wallBudgetMs: number): Result {
    const started: number = performance.now();
    const options: C.IOptions = { toleranceMm: 0.5, degree, maximumPieces: 128, maximumDepth: 12, maximumQueries: 12000 };
    const records: Record[] = [];
    const lookup: Map<string, I.Loop> = new Map(packet.loops.map((loop: I.Loop): [string, I.Loop] => [loop.key, loop]));
    const ordered: I.Loop[] = [...[...selected].map((key: string): I.Loop => lookup.get(key)!), ...packet.loops.filter((loop: I.Loop): boolean => !selected.has(loop.key))];
    for (const loop of ordered) {
      const record: Record = { key: loop.key, status: "unattempted", result: null, storage: { old: 0, fitted: 0 }, oldSpans: loop.curve.spans.length, observedErrorMm: null, milliseconds: 0, diagnostics: [] };
      records.push(record);
      if (!selected.has(loop.key) || performance.now() - started > wallBudgetMs) continue;
      const begin: number = performance.now();
      try {
        const source: S.Prepared = S.prepare(loop);
        record.storage.old = source.storage.total;
        if (source.refusals.length > 0) { record.status = "refused"; record.diagnostics = source.refusals; }
        else {
          const fitted: C.IResult = approximate(source.curve, options);
          record.result = fitted;
          record.storage.fitted = S.storage(fitted.pieces).total;
          record.status = fitted.status;
          if (fitted.status === "complete") {
            record.observedErrorMm = validate(source.curve, fitted.pieces);
            if (record.observedErrorMm > options.toleranceMm) record.status = "validation-refused";
          }
        }
      } catch (error) { record.status = "refused"; record.diagnostics.push(error instanceof Error ? error.message : String(error)); }
      record.milliseconds = performance.now() - begin;
    }
    return { degree, records, milliseconds: performance.now() - started, options };
  }

  /** Select existing independently admitted coefficients without refitting or mutating any raw method status. */
  export function bestValidated(packet: I.Packet, fits: readonly Result[]): { result: Result; selection: object[] } {
    const started: number = performance.now();
    const maps: Map<string, Record>[] = fits.map((fit: Result): Map<string, Record> => new Map(fit.records.map((r: Record): [string, Record] => [r.key, r])));
    const records: Record[] = [];
    const selection: object[] = [];
    for (const loop of packet.loops) {
      const candidates: { method: Result["degree"]; record: Record }[] = fits.flatMap((fit: Result, i: number): { method: Result["degree"]; record: Record }[] => {
        const record: Record = maps[i]!.get(loop.key)!;
        return record.status === "complete" ? [{ method: fit.degree, record }] : [];
      }).sort((a: { record: Record }, b: { record: Record }): number => a.record.storage.fitted - b.record.storage.fitted || a.record.result!.pieces.length - b.record.result!.pieces.length);
      const candidate: { method: Result["degree"]; record: Record } | undefined = candidates[0];
      if (candidate !== undefined && candidate.record.storage.fitted < candidate.record.storage.old) {
        records.push(candidate.record);
        selection.push({ key: loop.key, origin: "validated-new-coefficients", method: candidate.method, oldScalars: candidate.record.storage.old, selectedScalars: candidate.record.storage.fitted });
      } else {
        const source: S.Prepared = S.prepare(loop);
        const reason: string = candidate === undefined ? "No independently validated fitted candidate" : "No fitted scalar saving";
        const record: Record = { key: loop.key, status: source.refusals.length === 0 ? "complete" : "refused", result: source.refusals.length === 0 ? { status: "complete", pieces: source.pieces, maximumSampleErrorMm: 0, storedScalars: C.storedScalars(source.pieces), queries: 0, diagnostics: ["Existing coefficient retention: " + reason], certified: false } : null, storage: { old: source.storage.total, fitted: source.storage.total }, oldSpans: loop.curve.spans.length, observedErrorMm: source.refusals.length === 0 ? 0 : null, milliseconds: 0, diagnostics: source.refusals };
        records.push(record);
        selection.push({ key: loop.key, origin: source.refusals.length === 0 ? "retained-existing-source-coefficients" : "unavailable-source", method: null, reason, oldScalars: source.storage.total, selectedScalars: source.storage.total });
      }
    }
    return { result: { degree: "bestValidated", records, milliseconds: performance.now() - started, options: { ...fits[0]!.options, degree: "mixed" } }, selection };
  }

  /** Held-out offsets use original phase for polynomials and explicit two-way sampled geometry for rational speed. */
  function validate(source: C.ICurve, pieces: readonly C.IPiece[]): number {
    let maximum: number = 0;
    const distance = (p: P.Point, polyline: readonly P.Point[]): number => {
      let best: number = Infinity;
      for (let i: number = 1; i < polyline.length; ++i) {
        const a: P.Point = polyline[i - 1]!, b: P.Point = polyline[i]!;
        const dx: number = b[0] - a[0], dy: number = b[1] - a[1], length: number = dx * dx + dy * dy;
        const t: number = length === 0 ? 0 : Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / length));
        best = Math.min(best, Math.hypot(p[0] - a[0] - t * dx, p[1] - a[1] - t * dy));
      }
      return best;
    };
    for (const piece of pieces) {
      const [a, b]: readonly [number, number] = piece.domain;
      if (piece.kind === "polynomial") {
        const nodes: number[] = [...Array.from({ length: 23 }, (_: unknown, i: number): number => (i + 0.371) / 23), ...source.knots.filter((t: number): boolean => t > a && t < b).map((t: number): number => (t - a) / (b - a))];
        for (const u of nodes) {
          const p: P.Point = source.evaluate(a + (b - a) * u), q: P.Point = C.evaluate(piece, u);
          maximum = Math.max(maximum, Math.hypot(p[0] - q[0], p[1] - q[1]));
        }
      } else {
        const original: P.Point[] = Array.from({ length: 65 }, (_: unknown, i: number): P.Point => source.evaluate(a + (b - a) * i / 64));
        const fitted: P.Point[] = Array.from({ length: 65 }, (_: unknown, i: number): P.Point => C.evaluate(piece, i / 64));
        for (const p of original) maximum = Math.max(maximum, distance(p, fitted));
        for (const p of fitted) maximum = Math.max(maximum, distance(p, original));
      }
    }
    return maximum;
  }
}
