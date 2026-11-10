import type { AutoMovieRecoveryCompactApproximation as C } from "../../../packages/recovery/src/curves/AutoMovieRecoveryCompactApproximation";
import type { AutoMovieRecoveryConicApproximation as P } from "../../../packages/recovery/src/curves/AutoMovieRecoveryConicApproximation";
import type { ConicPaperInput as I } from "./ConicPaperInput";

/** Whole saved curves keep their physical phase clock while old span boundaries remain soft observations. */
export namespace CompactCurveSource {
  /** Observed source discontinuity; it is preserved without judging anatomical intent from a fit artifact. */
  export interface Joint {
    /** Original cumulative physical phase, millimetres. */
    phase: number;
    /** Exact incident endpoint separation in the planar world chart, millimetres. */
    gapMm: number;
    /** Oriented tangent-direction discrepancy in degrees, null if a tangent vanishes. */
    tangentDegrees: number | null;
    /** Relative endpoint speed mismatch; speed alone does not define a geometric corner. */
    relativeSpeedJump: number;
    /** First nonzero analytic jet order at the incoming endpoint; null denotes a constant cubic. */
    incomingJetOrder: number | null;
    /** First nonzero analytic jet order at the outgoing endpoint; null denotes a constant cubic. */
    outgoingJetOrder: number | null;
    /** Whether this is the final-to-first closure joint. */
    seam: boolean;
  }

  /** Explicit scalar accounting makes coordinate-plane savings distinct from curve reduction. */
  export interface Storage {
    /** Two coordinates per control after exact adjacent and closed-seam endpoint sharing. */
    controlScalars: number;
    /** Shared source-domain knots; neighbouring records do not store a knot twice. */
    knotScalars: number;
    /** One polynomial degree or one rational middle weight per piece. */
    degreeOrWeightScalars: number;
    /** The world-Y plane value; the global XZ axes are shared schema, not per-curve fitting freedom. */
    planeScalars: number;
    /** Sum of control, knot, primitive-tag and plane scalar counts. */
    total: number;
  }

  /** Immutable source coefficients and the complete callback chart used by every candidate degree. */
  export interface Prepared {
    /** Whole closed source domain, old soft knots and observed hard tangent breaks. */
    curve: C.ICurve;
    /** Exact planar cubic baseline pieces with original physical phase intervals. */
    pieces: C.IPiece[];
    /** Baseline cost under the same shared-coordinate and knot convention as every new result. */
    storage: Storage;
    /** Every source joint, including closure, retained for artifact and corner attribution. */
    joints: Joint[];
    /** Reasons preventing one continuous planar source callback from representing the original faithfully. */
    refusals: string[];
    /** Maximum original control's departure from its declared world-Y plane, millimetres. */
    planeResidualMm: number;
    /** Actual evaluator/derivative callback invocations, separate from fitter-internal counters. */
    queries(): number;
  }

  /** Count the same independently stored numeric fields for old and new planar coefficient nets. */
  export function storage(pieces: readonly C.IPiece[]): Storage {
    let coordinates: number = pieces.reduce((sum: number, p: C.IPiece): number => sum + 2 * p.controls.length, 0);
    const same = (a: P.Point, b: P.Point): boolean => a[0] === b[0] && a[1] === b[1];
    for (let i: number = 1; i < pieces.length; ++i)
      if (same(pieces[i - 1]!.controls.at(-1)!, pieces[i]!.controls[0]!)) coordinates -= 2;
    if (pieces.length > 0 && same(pieces.at(-1)!.controls.at(-1)!, pieces[0]!.controls[0]!)) coordinates -= 2;
    const knots: number = pieces.length === 0 ? 0 : pieces.length + 1;
    return { controlScalars: coordinates, knotScalars: knots, degreeOrWeightScalars: pieces.length, planeScalars: 1, total: coordinates + knots + pieces.length + 1 };
  }

  /** Prepare cached analytic coefficients once; each later query uses binary interval lookup, not a span scan. */
  export function prepare(loop: I.Loop): Prepared {
    const prefix: number[] = [0];
    const coefficients: P.Point[][][] = [];
    const pieces: C.IPiece[] = [];
    const refusals: string[] = [];
    let planeResidual: number = 0;
    for (let i: number = 0; i < loop.curve.spans.length; ++i) {
      const span: I.Span = loop.curve.spans[i]!;
      const h: number = loop.curve.phaseIntervals[i]!;
      if (!(h > 0 && Number.isFinite(h))) throw new Error("Invalid physical source interval at " + loop.key);
      const original: P.Point[] = span.map((p: I.V): P.Point => [p[0], p[2]]);
      const levels: P.Point[][] = [original];
      for (let order: number = 1; order <= 3; ++order) {
        const previous: P.Point[] = levels.at(-1)!;
        const degree: number = previous.length - 1;
        levels.push(previous.slice(1).map((p: P.Point, j: number): P.Point => [degree * (p[0] - previous[j]![0]) / h, degree * (p[1] - previous[j]![1]) / h]));
      }
      coefficients.push(levels);
      const a: number = prefix.at(-1)!;
      prefix.push(a + h);
      pieces.push({ kind: "polynomial", degree: 3, domain: [a, a + h], controls: original, maximumSampleErrorMm: 0 });
      for (const p of span) {
        if (!p.every(Number.isFinite)) refusals.push("Nonfinite source coefficient");
        planeResidual = Math.max(planeResidual, Math.abs(p[1] - loop.heightMm));
      }
    }
    const period: number = prefix.at(-1)!;
    if (!(period > 0)) throw new Error("Empty source curve at " + loop.key);
    if (planeResidual > 1e-7) refusals.push("Source controls leave their declared plane by more than 1e-7 mm");
    const joints: Joint[] = [];
    const breaks: number[] = [];
    for (let i: number = 0; i < pieces.length; ++i) {
      const j: number = (i + 1) % pieces.length;
      const a: P.Point = coefficients[i]![0]!.at(-1)!;
      const b: P.Point = coefficients[j]![0]![0]!;
      const da: P.Point = coefficients[i]![1]!.at(-1)!;
      const db: P.Point = coefficients[j]![1]![0]!;
      const la: number = Math.hypot(...da), lb: number = Math.hypot(...db);
      let incoming: P.Point | undefined, outgoing: P.Point | undefined;
      let incomingOrder: number | null = null, outgoingOrder: number | null = null;

      // A stationary parameter is not necessarily a geometric corner: the exact first nonzero Taylor jet owns its limit.
      for (let order: number = 1; order <= 3; ++order) {
        const left: P.Point = coefficients[i]![order]!.at(-1)!;
        const right: P.Point = coefficients[j]![order]![0]!;
        if (incoming === undefined && Math.hypot(...left) > 0) {
          const sign: number = order % 2 === 0 ? -1 : 1;
          incoming = [sign * left[0], sign * left[1]]; incomingOrder = order;
        }
        if (outgoing === undefined && Math.hypot(...right) > 0) { outgoing = right; outgoingOrder = order; }
      }
      const angle: number | null = incoming === undefined || outgoing === undefined ? null : Math.atan2(Math.abs(incoming[0] * outgoing[1] - incoming[1] * outgoing[0]),
        incoming[0] * outgoing[0] + incoming[1] * outgoing[1]) * 180 / Math.PI;
      const gap: number = Math.hypot(a[0] - b[0], a[1] - b[1]);
      const seam: boolean = j === 0;
      joints.push({ phase: prefix[i + 1]!, gapMm: gap, tangentDegrees: angle, relativeSpeedJump: Math.abs(la - lb) / Math.max(la, lb, 1e-30), incomingJetOrder: incomingOrder, outgoingJetOrder: outgoingOrder, seam });
      if (gap > 1e-7) refusals.push("Source position gap exceeds 1e-7 mm at phase " + prefix[i + 1]);
      if (!seam && (angle === null || angle > 1e-5)) breaks.push(prefix[i + 1]!);
    }
    let queries: number = 0;

    // Source breaks need exact side jets: an epsilon offset would conflate phase scale and source noise.
    const evaluate = (t: number, order: 0 | 1 | 2 | 3 | 4 | 5, side?: "left" | "right"): P.Point => {
      ++queries;
      if (order > 3) return [0, 0];
      let parameter: number = Math.max(0, Math.min(period, t));
      if (side === "left" && parameter === 0) parameter = period;
      else if (side === "right" && parameter === period) parameter = 0;
      let lo: number = 0, hi: number = pieces.length - 1;
      while (lo < hi) {
        const middle: number = Math.floor((lo + hi) / 2);
        if (prefix[middle + 1]! < parameter || prefix[middle + 1] === parameter && side !== "left") lo = middle + 1;
        else hi = middle;
      }
      const u: number = (parameter - prefix[lo]!) / (prefix[lo + 1]! - prefix[lo]!);
      let values: P.Point[] = coefficients[lo]![order]!.slice();
      while (values.length > 1)
        values = values.slice(1).map((p: P.Point, i: number): P.Point => [(1 - u) * values[i]![0] + u * p[0], (1 - u) * values[i]![1] + u * p[1]]);
      return values[0]!;
    };
    return { curve: { domain: [0, period], knots: prefix.slice(1, -1), breaks, closed: true,
      evaluate: (t: number): P.Point => evaluate(t, 0),
      derivative: (t: number, order: 1 | 2 | 3 | 4 | 5, side?: "left" | "right"): P.Point => evaluate(t, order, side) },
    pieces, storage: storage(pieces), joints, refusals: [...new Set(refusals)], planeResidualMm: planeResidual, queries: (): number => queries };
  }
}
