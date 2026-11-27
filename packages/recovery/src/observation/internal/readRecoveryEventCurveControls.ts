import { AutoMovieBernstein64 as B } from "@automovie/engine";
import type {
  AutoMovieBernsteinPolynomial64,
  AutoMovieCubicBezierControls3,
  AutoMovieVector3Tuple,
  IAutoMovieRecoveryEventCurvePiece,
} from "@automovie/interface";

import { readRecoveryEventCurveParent } from "./readRecoveryEventCurveParent";

/*
 * Derive oriented occurrence controls directly from their sole native curve.
 * Optional native endpoint evaluation preserves the compiler's declared
 * boundary policy while every interior control uses the same original-curve
 * restriction.
 */
export function readRecoveryEventCurveControls(
  piece: IAutoMovieRecoveryEventCurvePiece,
  nativeEndpoints: boolean = false,
): AutoMovieCubicBezierControls3 {
  const parent: AutoMovieCubicBezierControls3 = readRecoveryEventCurveParent(
    piece.source,
  );
  const start: number = piece.source.start,
    end: number = piece.source.end;
  if (
    start < 0 ||
    start > 1 ||
    end < 0 ||
    end > 1 ||
    start === end ||
    !(piece.width > 0)
  )
    throw new Error(
      "An occurrence requires a positive chart width and nonempty oriented normalized native interval",
    );
  const reverse: boolean = start > end;
  let controls: AutoMovieCubicBezierControls3;
  if (Math.min(start, end) === 0 && Math.max(start, end) === 1)
    controls = parent;
  else {
    const restricted: AutoMovieBernsteinPolynomial64 = B.restrict(
      parent.map(
        (p: Readonly<AutoMovieVector3Tuple>): AutoMovieVector3Tuple => [...p],
      ),
      Math.min(start, end),
      Math.max(start, end),
    );
    if (restricted.length !== 4)
      throw new Error("Cubic restriction changed coefficient cardinality");
    controls = [restricted[0]!, restricted[1]!, restricted[2]!, restricted[3]!];
  }
  if (reverse) controls = [controls[3], controls[2], controls[1], controls[0]];
  if (nativeEndpoints) {
    const net: AutoMovieBernsteinPolynomial64 = parent.map(
      (p: Readonly<AutoMovieVector3Tuple>): AutoMovieVector3Tuple => [...p],
    );
    controls = [
      B.value(net, start),
      controls[1],
      controls[2],
      B.value(net, end),
    ];
  }
  return controls;
}
