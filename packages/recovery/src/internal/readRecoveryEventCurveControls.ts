import {
  AutoMovieBernstein64 as B,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine/geometry/curve";

import type { IAutoMovieRecoveryEventCurvePiece } from "../structures/curve/IAutoMovieRecoveryEventCurvePiece";
import { readRecoveryEventCurveParent } from "./readRecoveryEventCurveParent";

/**
 * Derive oriented occurrence controls directly from their sole native curve.
 * Optional native endpoint evaluation preserves the compiler's declared boundary
 * policy while every interior control uses the same original-curve restriction.
 *
 * @evidence contracts/common.md#principled-implementation Affine Bernstein restriction and control reversal represent the oriented normalized native interval without composing rounded intermediate nets.
 * @evidence contracts/common.md#clear-and-simple-design One transient derivation replaces stored occurrence coefficient copies.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No fitted point, normalized tangent, epsilon, snap or fallback net replaces native coefficients.
 * @evidence contracts/common.md#meaningful-documentation States normalized interval direction, millimetre controls and optional exact native endpoint evaluation.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Fixed-degree restriction and two optional endpoint evaluations have constant cost.
 * @evidence contracts/performance.md#reuse-equivalent-work Full forward occurrences borrow the original tuple; proper restrictions allocate one temporary four-control tuple.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned controls belong to the caller; no restriction cache or persistent state is retained.
 */
export function readRecoveryEventCurveControls(
  piece: IAutoMovieRecoveryEventCurvePiece,
  nativeEndpoints: boolean = false,
): C.Span {
  const parent: C.Span = readRecoveryEventCurveParent(piece.source);
  const start: number = piece.source.start,
    end: number = piece.source.end;
  if (
    !Number.isFinite(start) ||
    !Number.isFinite(end) ||
    start < 0 ||
    start > 1 ||
    end < 0 ||
    end > 1 ||
    start === end ||
    !(piece.width > 0 && Number.isFinite(piece.width))
  )
    throw new Error(
      "An occurrence requires a positive chart width and nonempty oriented normalized native interval",
    );
  const reverse: boolean = start > end;
  let controls: C.Span;
  if (Math.min(start, end) === 0 && Math.max(start, end) === 1)
    controls = parent;
  else {
    const restricted: B.Poly = B.restrict(
      parent.map((p: C.Vector): B.Vec => [...p]),
      Math.min(start, end),
      Math.max(start, end),
    );
    if (restricted.length !== 4)
      throw new Error("Cubic restriction changed coefficient cardinality");
    controls = [restricted[0]!, restricted[1]!, restricted[2]!, restricted[3]!];
  }
  if (reverse) controls = [controls[3], controls[2], controls[1], controls[0]];
  if (nativeEndpoints) {
    const net: B.Poly = parent.map((p: C.Vector): B.Vec => [...p]);
    controls = [
      B.value(net, start),
      controls[1],
      controls[2],
      B.value(net, end),
    ];
  }
  return controls;
}
