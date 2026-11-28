import {
  AutoMovieEngineBernstein64 as B,
  AutoMovieEngineCurveMath64 as V,
} from "@automovie/engine";
import type {
  AutoMovieCubicBezierControls3,
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryEventCurveArc,
  IAutoMovieRecoveryEventCurveCoefficients,
  IAutoMovieRecoveryEventCurvePiece,
  IAutoMovieRecoveryEventCurveSource,
} from "@automovie/interface";

import { readRecoveryEventCurveControls } from "./internal/readRecoveryEventCurveControls";
import { readRecoveryEventCurveParent } from "./internal/readRecoveryEventCurveParent";

/**
 * Named cubic occurrences retain native coefficient owners and oriented
 * parameter intervals. Millimetre coefficients remain independent of source
 * topology and material correspondence.
 */
export namespace AutoMovieRecoveryEventCurve {
  /**
   * Return four millimetre Bernstein controls for the occurrence's oriented
   * interval of its native cubic. Optional native endpoint evaluation preserves
   * the compiler's shared endpoint policy. The source must retain one admitted
   * native cubic.
   */
  export function controls(
    piece: IAutoMovieRecoveryEventCurvePiece,
    nativeEndpoints: boolean = false,
  ): AutoMovieCubicBezierControls3 {
    return readRecoveryEventCurveControls(piece, nativeEndpoints);
  }

  /**
   * Read the sole native Bernstein control net of a supplied millimetre event
   * occurrence. Require one positive finite original phase width and four
   * finite control triples. Use a basis conversion upstream for Hermite input.
   */
  export function fullparentControls(
    source: IAutoMovieRecoveryEventCurveSource,
  ): AutoMovieCubicBezierControls3 {
    return readRecoveryEventCurveParent(source);
  }

  /**
   * Compare three millimetre coefficient components exactly. Opposite signed
   * zeros are equal, so a stored zero can share either representation.
   */
  export const same: (
    a: Readonly<AutoMovieVector3Tuple>,
    b: Readonly<AutoMovieVector3Tuple>,
  ) => boolean = (
    a: Readonly<AutoMovieVector3Tuple>,
    b: Readonly<AutoMovieVector3Tuple>,
  ): boolean => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

  /**
   * Admit one named Bernstein path in millimetres and preserve original span
   * authorities and widths. By default use the curve's name as authority.
   * Adjacent spans and a closed seam must meet exactly. Keep borrowed native
   * controls unchanged while using the returned arc.
   */
  export function fromCurve(
    curve: IAutoMovieRecoveryEventCurveCoefficients,
    authority: string = curve.name,
  ): IAutoMovieRecoveryEventCurveArc {
    if (
      curve.spans.length === 0 ||
      curve.spans.length !== curve.phaseIntervals.length
    )
      throw new Error(
        "Named cubic spans and widths must have equal positive cardinality",
      );
    const arc: IAutoMovieRecoveryEventCurveArc = {
      id: authority,
      closed: curve.closed,
      pieces: curve.spans.map(
        (
          net: AutoMovieCubicBezierControls3,
          i: number,
        ): IAutoMovieRecoveryEventCurvePiece => ({
          width: curve.phaseIntervals[i]!,
          source: {
            authority: `${authority}.span${i}`,
            curve: {
              type: "cubicBezier",
              name: `${authority}.span${i}`,
              closed: false,
              unit: "mm",
              phaseUnit: curve.phaseUnit,
              phaseIntervals: [curve.phaseIntervals[i]!],
              spans: [net],
            },
            endpointAuthorities: [
              `${authority}.knot${i}`,
              `${authority}.knot${(i + 1) % (curve.closed ? curve.spans.length : curve.spans.length + 1)}`,
            ],
            start: 0,
            end: 1,
          },
        }),
      ),
      ...(curve.canonicalKnots
        ? { canonicalKnots: [...curve.canonicalKnots] }
        : {}),
    };
    for (const piece of arc.pieces) {
      if (!piece) throw new Error("Every native curve span must be present");
      fullparentControls(piece.source);
    }
    for (let i: number = 1; i < curve.spans.length; i++)
      if (!same(curve.spans[i - 1]![3], curve.spans[i]![0]))
        throw new Error(
          "Stored curve has conflicting C0 endpoint coefficients",
        );
    if (curve.closed && !same(curve.spans[0]![0], curve.spans.at(-1)![3]))
      throw new Error("Stored periodic curve has conflicting seam endpoints");
    knots(arc);
    return arc;
  }

  /**
   * Return an owned normalized partition from zero to one. Copy a valid
   * supplied canonical partition. Otherwise normalize positive finite piece
   * widths. Invalid, nonfinite or collapsed partitions throw.
   */
  export function knots(arc: IAutoMovieRecoveryEventCurveArc): number[] {
    if (!arc.pieces.length)
      throw new Error("An arc requires positive finite piece widths");
    for (const p of arc.pieces)
      if (!p || !Number.isFinite(p.width) || !(p.width > 0))
        throw new Error("An arc requires positive finite piece widths");
    if (arc.canonicalKnots) {
      const q: number[] = arc.canonicalKnots;
      if (q.length !== arc.pieces.length + 1 || q[0] !== 0 || q.at(-1) !== 1)
        throw new Error(
          "Canonical arc knots must be strictly increasing from zero to one",
        );
      for (let i: number = 1; i < q.length; i++)
        if (!(q[i]! > q[i - 1]!))
          throw new Error(
            "Canonical arc knots must be strictly increasing from zero to one",
          );
      return [...q];
    }
    const total: number = arc.pieces.reduce(
      (sum: number, p: IAutoMovieRecoveryEventCurvePiece): number =>
        sum + p.width,
      0,
    );
    if (!Number.isFinite(total))
      throw new Error(
        "Positive widths must retain a representable strict partition",
      );
    const q: number[] = [0];
    let sum: number = 0;
    for (const p of arc.pieces) {
      sum += p.width;
      q.push(sum / total);
    }
    q[q.length - 1] = 1;
    if (q.some((u: number, i: number): boolean => i > 0 && u <= q[i - 1]!))
      throw new Error(
        "Positive widths must retain a representable strict partition",
      );
    return q;
  }

  /**
   * Resolve the chosen oriented occurrence endpoint to its exact native P0 or
   * P3 identity. A valid interior endpoint returns null. Invalid endpoint
   * phase, missing identity or a mismatch with the original coefficient
   * throws.
   */
  export function endpointAuthority(
    piece: IAutoMovieRecoveryEventCurvePiece,
    endpoint: 0 | 1,
  ): string | null {
    const parameter: number =
      endpoint === 0 ? piece.source.start : piece.source.end;
    if (
      (endpoint !== 0 && endpoint !== 1) ||
      !Number.isFinite(parameter) ||
      parameter < 0 ||
      parameter > 1
    )
      throw new Error(
        "An occurrence endpoint needs a normalized finite native parameter",
      );
    if (parameter !== 0 && parameter !== 1) return null;
    const index: 0 | 1 = parameter === 0 ? 0 : 1;
    const name: string = piece.source.endpointAuthorities[index];
    if (
      !name ||
      !same(
        controls(piece)[endpoint === 0 ? 0 : 3],
        fullparentControls(piece.source)[index === 0 ? 0 : 3],
      )
    )
      throw new Error(
        "A native endpoint name requires its exact original coefficient",
      );
    return name;
  }

  /**
   * Restrict a path to a finite increasing interval within its normalized
   * chart. The returned open portion preserves each oriented native source and
   * its restricted native interval. Empty or invalid requests throw.
   */
  export function portion(
    arc: IAutoMovieRecoveryEventCurveArc,
    a: number,
    b: number,
  ): IAutoMovieRecoveryEventCurveArc {
    if (!(a >= 0 && a < b && b <= 1))
      throw new Error("A finite increasing normalized interval is required");
    const q: number[] = knots(arc),
      pieces: IAutoMovieRecoveryEventCurvePiece[] = [];
    for (let i: number = 0; i < arc.pieces.length; i++) {
      const x: number = Math.max(a, q[i]!),
        y: number = Math.min(b, q[i + 1]!);
      if (!(x < y)) continue;
      const p: IAutoMovieRecoveryEventCurvePiece = arc.pieces[i]!,
        lo: number = x === q[i] ? 0 : (x - q[i]!) / (q[i + 1]! - q[i]!),
        hi: number = y === q[i + 1] ? 1 : (y - q[i]!) / (q[i + 1]! - q[i]!);
      const phase: (t: number) => number = (t: number): number =>
        t === 0
          ? p.source.start
          : t === 1
            ? p.source.end
            : p.source.start + (p.source.end - p.source.start) * t;
      pieces.push({
        ...p,
        width: y - x,
        source: { ...p.source, start: phase(lo), end: phase(hi) },
      });
    }
    if (!pieces.length) throw new Error("Empty curve interval");
    return { id: arc.id, closed: false, pieces };
  }

  /**
   * Reverse path order and the orientation of every native occurrence. Retain
   * the arc's identity and closure. A retained canonical partition is reflected
   * into the new chart and must remain strictly increasing.
   */
  export function reverse(
    arc: IAutoMovieRecoveryEventCurveArc,
  ): IAutoMovieRecoveryEventCurveArc {
    const q: number[] = knots(arc);
    const out: IAutoMovieRecoveryEventCurveArc = {
      ...arc,
      pieces: arc.pieces
        .slice()
        .reverse()
        .map(
          (
            p: IAutoMovieRecoveryEventCurvePiece,
          ): IAutoMovieRecoveryEventCurvePiece => ({
            ...p,
            source: { ...p.source, start: p.source.end, end: p.source.start },
          }),
        ),
    };
    if (arc.canonicalKnots) {
      out.canonicalKnots = q
        .reverse()
        .map((u: number, i: number): number =>
          i === 0 ? 0 : i === arc.pieces.length ? 1 : 1 - u,
        );
      knots(out);
    }
    return out;
  }

  /**
   * Read one native-span occurrence for a nonempty interval of an arc's
   * normalized chart. A request crossing a native knot throws. The returned
   * piece keeps its oriented original interval.
   */
  export function piece(
    arc: IAutoMovieRecoveryEventCurveArc,
    a: number,
    b: number,
  ): IAutoMovieRecoveryEventCurvePiece {
    const part: IAutoMovieRecoveryEventCurveArc = portion(arc, a, b);
    if (part.pieces.length !== 1)
      throw new Error("A cubic chart cell crosses an undeclared native knot");
    return part.pieces[0]!;
  }

  /**
   * Evaluate the arc at one normalized phase from zero to one. Return a
   * position in millimetres, including exact supplied endpoints at chart
   * boundaries. An out-of-range phase throws.
   */
  export function evaluate(
    arc: IAutoMovieRecoveryEventCurveArc,
    t: number,
  ): Readonly<AutoMovieVector3Tuple> {
    const q: number[] = knots(arc);
    const index: number = q.findIndex(
      (u: number, i: number): boolean =>
        i + 1 < q.length && t >= u && t <= q[i + 1]!,
    );
    if (index < 0) throw new Error("Parameter is outside the declared arc");
    const local: number =
      t === q[index]
        ? 0
        : t === q[index + 1]
          ? 1
          : (t - q[index]!) / (q[index + 1]! - q[index]!);
    return B.value(
      controls(arc.pieces[index]!).map(
        (point: Readonly<AutoMovieVector3Tuple>): AutoMovieVector3Tuple => [
          ...point,
        ],
      ),
      local,
    );
  }

  /**
   * Join nonempty arcs under the requested name in input order. Neighboring
   * pieces must meet at exactly equal physical endpoints. The result is an open
   * composite whose original native occurrences remain available.
   */
  export function concatenate(
    arcs: readonly IAutoMovieRecoveryEventCurveArc[],
    id: string,
  ): IAutoMovieRecoveryEventCurveArc {
    if (!id.trim() || !arcs.length)
      throw new Error("A composite needs a name and nonempty paths");
    for (const arc of arcs) knots(arc);
    for (let i: number = 1; i < arcs.length; i++)
      if (
        !same(
          controls(arcs[i - 1]!.pieces.at(-1)!)[3],
          controls(arcs[i]!.pieces[0]!)[0],
        )
      )
        throw new Error(
          "Composite paths must share an exact endpoint coefficient",
        );
    return {
      id,
      closed: false,
      pieces: arcs.flatMap(
        (
          arc: IAutoMovieRecoveryEventCurveArc,
        ): IAutoMovieRecoveryEventCurvePiece[] => arc.pieces,
      ),
    };
  }

  /**
   * Create one named straight millimetre cubic between two explicit points. Its
   * phase width is their positive representable Euclidean separation. Equal
   * points or unrepresentable length throw.
   */
  export function line(
    a: Readonly<AutoMovieVector3Tuple>,
    b: Readonly<AutoMovieVector3Tuple>,
    id: string,
  ): IAutoMovieRecoveryEventCurveArc {
    const width: number = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    if (!Number.isFinite(width) || !(width > 0))
      throw new Error("A named line needs positive representable length");
    const ma: AutoMovieVector3Tuple = V.clone(a),
      mb: AutoMovieVector3Tuple = V.clone(b);
    return fromCurve({
      type: "cubicBezier",
      name: id,
      closed: false,
      unit: "mm",
      phaseUnit: "mm",
      phaseIntervals: [width],
      spans: [[a, V.mix(ma, mb, 1 / 3), V.mix(ma, mb, 2 / 3), b]],
    });
  }

  /**
   * Move a closed path's normalized phase origin to an existing knot. Retain
   * its original native coefficients and authorities. An open path or invalid
   * knot index throws.
   */
  export function rotateAtKnot(
    arc: IAutoMovieRecoveryEventCurveArc,
    index: number,
  ): IAutoMovieRecoveryEventCurveArc {
    const q: number[] = knots(arc);
    if (
      index < 0 ||
      index >= arc.pieces.length ||
      !same(controls(arc.pieces[0]!)[0], controls(arc.pieces.at(-1)!)[3])
    )
      throw new Error(
        "A periodic rotation must address an existing knot of a closed path",
      );
    const out: IAutoMovieRecoveryEventCurveArc = {
      ...arc,
      pieces: [...arc.pieces.slice(index), ...arc.pieces.slice(0, index)],
    };
    if (arc.canonicalKnots) {
      const offset: number = q[index]!;
      out.canonicalKnots = [
        ...q.slice(index, -1).map((u: number): number => u - offset),
        ...q.slice(0, index).map((u: number): number => 1 - offset + u),
        1,
      ];
      out.canonicalKnots[0] = 0;
      knots(out);
    }
    return out;
  }
}
