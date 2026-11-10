import { AutoMovieNaturalSpline as S } from "../../../packages/engine/src/geometry/construction/AutoMovieNaturalSpline";
import { AutoMovieViewOutline as O } from "../../../packages/engine/src/geometry/construction/AutoMovieViewOutline";
import { AutoMovieViewAxis } from "../../../packages/engine/src/geometry/construction/AutoMovieViewAxis";
import { AutoMovieViewLoft as L } from "../../../packages/engine/src/geometry/construction/AutoMovieViewLoft";
import { AutoMovieViewChain as Q } from "../../../packages/engine/src/geometry/construction/AutoMovieViewChain";
import type { IAutoMovieViewPart as V } from "../../../packages/engine/src/geometry/construction/IAutoMovieViewPart";
import type { PartConicTypes as T } from "./PartConicTypes";
import { PartConicProfile as P } from "./PartConicProfile";

/** Shared-knot C2 station fields, preserving source support contacts and absolute section frames. */
export namespace PartConicFields {
  /** Standalone coefficients; no dense source sections or source mesh are needed to regenerate these fields. */
  export interface Coefficients {
    /** Study identity retained through the actual engine loft. */
    name: string;
    /** Absolute source proximal bone centre, in millimetres. */
    origin: T.V;
    /** Unchanged original section chart direction. */
    u: T.V;
    /** Unchanged original companion direction; v cross u follows the bone. */
    v: T.V;
    /** Four or eight rational conic pieces per evaluated section. */
    piecesPerQuarter: 1 | 2;
    /** One station knot vector shared by every scalar field, in millimetres. */
    knots: number[];
    /** Value and normalized first/second jet at each shared knot, grouped by field. */
    fields: V.IKnot[][];
  }
  /** Complete numeric experiment evidence, separate from any visual acceptance claim. */
  export interface Result {
    /** Independently reconstructible coefficient record. */
    coefficients: Coefficients;
    /** Actual existing view-loft result, not a mesh fitted afterward. */
    loft: L.IResult;
    /** Maximum source-to-direct-conic sampled radial discrepancy before station compression, in millimetres. */
    intrinsicMaximumMm: number;
    /** Maximum final sampled radial discrepancy on fitting planes, in millimetres. */
    trainingMaximumMm: number;
    /** Maximum final sampled radial discrepancy on independent native midpoint planes, in millimetres. */
    heldoutMaximumMm: number;
    /** Pointwise and regularity observations for every native plane. */
    rows: { s: number; heldout: boolean; maximumMm: number }[];
    /** Original training profile count; derived rendering rings are counted elsewhere. */
    sourceProfiles: number;
    /** All independently retained numeric shape controls, including jets, one shared clock and the absolute frame. */
    independentScalars: number;
    /** Field measurement, coupled knot selection and engine preparation work, in milliseconds. */
    milliseconds: number;
  }

  /** Fit the complete section family with one common knot vector; held-out planes never enter coefficient selection. */
  export function fit(part: T.Part, pieces: 1 | 2): Result {
    const started: number = performance.now();
    const rows: T.Row[] = part.rows.filter((row: T.Row): boolean => !row.heldout);
    const values: number[][] = rows.map((row: T.Row): number[] => P.measure(row.points, pieces));
    const xs: number[] = rows.map((row: T.Row): number => row.s);
    const dense: S.ISpline[] = values[0]!.map((_: number, field: number): S.ISpline => S.create(xs, values.map((value: number[]): number => value[field]!)));
    const retained: Set<number> = new Set([0, rows.length - 1]);
    const span: number = xs.at(-1)! - xs[0]!;
    let coefficients: Coefficients;
    let prepared: O.IOutline[] = [];
    for (let iteration: number = 0; ; ++iteration) {
      if (iteration > rows.length) throw new Error("Finite shared-knot refinement failed to terminate.");
      const indices: number[] = [...retained].sort((a: number, b: number): number => a - b);
      const fields: V.IKnot[][] = dense.map((spline: S.ISpline): V.IKnot[] => indices.map((index: number): V.IKnot => {
        const jet: [number, number, number] = S.read(spline, xs[index]!);
        return { site: "source-plane-" + index, station: xs[index]!, value: jet[0], jet: { first: jet[1] * span, second: jet[2] * span * span } };
      }));
      coefficients = { name: part.name + ".conic-" + pieces * 4, origin: [...part.origin], u: [...part.u], v: [...part.v], piecesPerQuarter: pieces, knots: indices.map((index: number): number => xs[index]!), fields };
      prepared = fields.map((knots: V.IKnot[]): O.IOutline => {
        const outline: ReturnType<typeof O.create> = O.create({ knots });
        if ("contract" in outline) throw new Error(outline.detail);
        return outline;
      });
      const additions: number[] = [];
      for (let i: number = 0; i < rows.length; ++i) {
        if (retained.has(i)) continue;
        const sparse: number[] = read(prepared, xs[i]!);
        let deviation: number = 0;
        const a = P.section(values[i]!, pieces);
        const b = P.section(sparse, pieces);
        if (a.fault !== null || b.fault !== null) deviation = Infinity;
        else for (let k: number = 0; k < 48; ++k) {
          const phi: number = 2 * Math.PI * k / 48;
          const first: number = Q.radius(a, phi);
          const second: number = Q.radius(b, phi);
          deviation = Math.max(deviation, Math.abs(first - second));
        }
        if (deviation > 0.12) additions.push(i);
      }
      if (additions.length === 0) break;
      for (const index of additions) retained.add(index);
    }

    // Rebuild from serialized numeric coefficients before any final geometry is evaluated.
    coefficients = JSON.parse(JSON.stringify(coefficients)) as Coefficients;
    const loft: L.IResult = create(coefficients, part.rows.map((row: T.Row): number => row.s));
    if (loft.chain === null) throw new Error("View-loft admission: " + JSON.stringify(loft.diagnostics));
    let intrinsicMaximumMm: number = 0;
    for (let i: number = 0; i < rows.length; ++i) intrinsicMaximumMm = Math.max(intrinsicMaximumMm, P.error(rows[i]!.points, values[i]!, pieces));
    const evidence: Result["rows"] = part.rows.map((row: T.Row): Result["rows"][number] => ({ s: row.s, heldout: row.heldout, maximumMm: P.error(row.points, read(prepared, row.s), pieces) }));
    return { coefficients, loft, intrinsicMaximumMm,
      trainingMaximumMm: Math.max(...evidence.filter((row): boolean => !row.heldout).map((row): number => row.maximumMm)),
      heldoutMaximumMm: Math.max(...evidence.filter((row): boolean => row.heldout).map((row): number => row.maximumMm)), rows: evidence,
      sourceProfiles: rows.length, independentScalars: 9 + coefficients.knots.length + coefficients.fields.length * coefficients.knots.length * 3, milliseconds: performance.now() - started };
  }

  /** Generate actual existing conic loft geometry from numeric family fields alone, in the original absolute pose. */
  export function create(coefficients: Coefficients, stations: number[]): L.IResult {
    const outline = (field: number): V.IOutline => ({ knots: coefficients.fields[field]! });
    const shoulders: V.IQuarters<V.IOutline> = [outline(8), outline(9), outline(10), outline(11)];
    const touch: V.IQuarters<V.IOutline> = [outline(4), outline(5), outline(6), outline(7)];
    const part: V = { name: coefficients.name, axis: AutoMovieViewAxis.straight(coefficients.origin, coefficients.u, coefficients.v), stations,
      front: { positive: outline(0), negative: outline(1) }, side: { positive: outline(2), negative: outline(3) },
      fullness: { kind: "top", shoulders, touch, ...(coefficients.piecesPerQuarter === 2 ? { splits: [0, 1, 2, 3].map((q: number): V.ISplit => ({ u: outline(12 + 4 * q), v: outline(13 + 4 * q), angle: outline(14 + 4 * q), shoulder: outline(15 + 4 * q) })) as V.IQuarters<V.ISplit> } : {}) }, order: 32, samples: 128 };
    return L.create(part);
  }
  /** Evaluate the prepared scalar owner, preserving its real failure rather than substituting a value. */
  function read(fields: O.IOutline[], s: number): number[] { return fields.map((field: O.IOutline): number => { const value: number | string = O.value(field, s); if (typeof value === "string") throw new Error(value); return value; }); }
}
