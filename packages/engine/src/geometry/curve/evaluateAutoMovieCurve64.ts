import type { IAutoMovieCurve64 as C } from "./IAutoMovieCurve64";
import { assertAutoMovieCurve64 } from "./assertAutoMovieCurve64";
import { evaluateAutoMovieBernstein64 } from "./evaluateAutoMovieBernstein64";

/**
 * Evaluate a millimetre primitive in its declared phase chart. Piecewise derivatives are divided by the selected positive phase width; analytic oval derivatives are per turn. Interior seams choose the following piece, and the final endpoint chooses the final piece at local t=1.
 *
 * @param curve Complete generating coefficients and their physical phase chart.
 * @param parameter Finite value from 0 through the sum of phase widths, or through 1 turn for an oval.
 * @throws Error when admission, domain selection or represented arithmetic is unresolved.
 *
 * @evidence contracts/common.md#principled-implementation Complete primitive admission precedes cumulative-width selection; analytic ellipses use center plus cosine/sine semiaxes and their analytic derivatives.
 * @evidence contracts/common.md#clear-and-simple-design One dispatch preserves the representation and exposes a position plus tangent in declared parameter units.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No display samples, uniform-piece assumption or cubic fit replace coefficients; unresolved nonzero physical derivative underflow is rejected. Closure metadata alone does not establish seam continuity.
 * @evidence contracts/common.md#meaningful-documentation Documents mm output, per-phase derivatives, domain endpoints and interior-piece selection.
 * @evidence contracts/performance.md#efficient-algorithms Each query scans all C coefficients for admission and S widths/pieces; a selected degree-d Bernstein evaluation adds O(d²) work and O(d) scratch storage. Cubics additionally create S local piece descriptors.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No partition or validity cache spans calls because the input record is not required to be immutable.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Local partition/descriptors and output vectors are per-call; the evaluator retains no primitive or external resources.
 */
export function evaluateAutoMovieCurve64(
  curve: C.Primitive,
  parameter: number,
): {
  /** Position in the primitive's millimetre chart. */
  point: C.Vector;

  /** Millimetres per declared phase unit; no unit normalization is applied. */
  tangentPerParameter: C.Vector;
} {
  assertAutoMovieCurve64(curve);
  if (!Number.isFinite(parameter) || parameter < 0)
    throw new Error("A nonnegative finite curve parameter is required");
  if (
    curve.unit !== "mm" ||
    !["turn", "mm", "normalized"].includes(curve.phaseUnit)
  )
    throw new Error("Explicit coordinate and parameter units required");
  if (typeof curve.name !== "string" || typeof curve.closed !== "boolean")
    throw new Error("Explicit curve identity and topology required");
  const point: number[] = [0, 0, 0];
  const tangent: number[] = [0, 0, 0];
  if (curve.type === "analyticOval") {
    if (curve.phaseUnit !== "turn" || parameter > 1)
      throw new Error("An analytic oval uses one turn");
    if (
      ![curve.center, curve.u, curve.v].every(
        (v: C.Vector): boolean => v.length === 3 && v.every(Number.isFinite),
      ) ||
      ![curve.radiusU, curve.radiusV].every(Number.isFinite) ||
      curve.radiusU <= 0 ||
      curve.radiusV <= 0 ||
      curve.closed !== true
    )
      throw new Error("Invalid analytic oval");
    const dot: (a: C.Vector, b: C.Vector) => number = (
      a: C.Vector,
      b: C.Vector,
    ): number =>
      a.reduce((s: number, x: number, k: number): number => s + x * b[k]!, 0);
    if (
      Math.abs(dot(curve.u, curve.u) - 1) > 64 * Number.EPSILON ||
      Math.abs(dot(curve.v, curve.v) - 1) > 64 * Number.EPSILON ||
      Math.abs(dot(curve.u, curve.v)) > 64 * Number.EPSILON
    )
      throw new Error("Orthonormal oval axes required");
    const angle: number = 2 * Math.PI * parameter;
    for (let k: number = 0; k < 3; k++) {
      point[k] =
        curve.center[k]! +
        curve.radiusU * Math.cos(angle) * curve.u[k]! +
        curve.radiusV * Math.sin(angle) * curve.v[k]!;
      tangent[k] =
        2 *
        Math.PI *
        (-curve.radiusU * Math.sin(angle) * curve.u[k]! +
          curve.radiusV * Math.cos(angle) * curve.v[k]!);
    }
  } else {
    if (curve.type !== "cubicBezier" && curve.type !== "bernstein")
      throw new Error("Unknown actual primitive");
    const pieces: readonly C.Piece[] =
      curve.type === "cubicBezier"
        ? curve.spans.map((s: C.Span): C.Piece => {
            if (s.length !== 4) throw new Error("Cubic degree mismatch");
            return { primitive: "polynomialBezier", degree: 3, controls: s };
          })
        : curve.pieces;
    const cumulative: number[] = [0];
    for (const width of curve.phaseIntervals)
      cumulative.push(cumulative.at(-1)! + width);
    const total: number = cumulative.at(-1)!;
    if (
      pieces.length === 0 ||
      cumulative.length !== pieces.length + 1 ||
      !Number.isFinite(total) ||
      parameter > total ||
      curve.phaseIntervals.some(
        (w: number, i: number): boolean =>
          !Number.isFinite(w) || w <= 0 || cumulative[i + 1]! <= cumulative[i]!,
      )
    )
      throw new Error("Unresolved parameter partition");
    const index: number =
      parameter === total
        ? pieces.length - 1
        : cumulative.findIndex(
            (x: number, i: number): boolean =>
              i < pieces.length &&
              parameter >= x &&
              parameter < cumulative[i + 1]!,
          );
    const width: number = curve.phaseIntervals[index]!;
    const t: number =
      parameter === total ? 1 : (parameter - cumulative[index]!) / width;
    const evaluated: ReturnType<typeof evaluateAutoMovieBernstein64> =
      evaluateAutoMovieBernstein64(pieces[index]!, t);
    for (let k: number = 0; k < 3; k++) {
      point[k] = evaluated.point[k]!;
      tangent[k] = evaluated.derivative[k]! / width;
      if (evaluated.derivative[k] !== 0 && tangent[k] === 0)
        throw new Error("Unresolved physical parameter derivative underflow");
    }
  }
  if (![...point, ...tangent].every(Number.isFinite))
    throw new Error("Unresolved curve evaluation");
  return {
    point: point as unknown as C.Vector,
    tangentPerParameter: tangent as unknown as C.Vector,
  };
}
