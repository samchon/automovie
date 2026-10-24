import type { IAutoMovieHumanCurveJet } from "./IAutoMovieHumanCurveJet";
import type { IAutoMovieHumanHermiteCurve } from "./IAutoMovieHumanHermiteCurve";

/** Physical Hermite boundaries shared by appearance and construction. */
export namespace AutoMovieHumanHermiteCurve {
  /**
   * Evaluate an explicit span address without reconstructing a short local
   * parameter by subtracting two large cumulative phases. The supplied unit
   * parameter is independent of the span's original physical interval.
   *
   * @param span Original endpoints, physical derivatives and interval.
   * @param parameter Unit parameter in [0, 1]; the caller selects the side at a knot.
   * @param origin Common local origin in mm, subtracted before polynomial evaluation.
   * @returns Position relative to origin and derivatives per stored physical phase.
   *
   * @evidence contracts/common.md#principled-implementation Rewrites the cubic Hermite polynomial about its first endpoint and differentiates in physical phase. Literal endpoint jets avoid division of rounded world-space Bezier handles; a local origin avoids subtracting a rounded world-space result. This does not certify source correspondence, regularity or embedding.
   * @evidence contracts/common.md#clear-and-simple-design A single span evaluator returns position and both derivatives from the same polynomial and declared interval.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Uses only the addressed cubic; no anatomical name, specimen, fitted correction or native normal enters the calculation.
   * @evidence contracts/common.md#meaningful-documentation Gives units, knot-side ownership, parameter bounds, translation semantics and the reasons for retaining physical jets.
   * @evidence contracts/performance.md#efficient-algorithms Constant time and result space for three coordinates, with no search through cumulative phases.
   * @evidence contracts/performance.md#reuse-equivalent-work Position and derivatives reuse the endpoint difference and polynomial coefficients within the call; the pure operation retains no cross-call cache.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Allocates only bounded three-coordinate result and temporary arrays; no state or handles survive the call.
   */
  export function evaluate(
    span: IAutoMovieHumanHermiteCurve["spans"][number],
    parameter: number,
    origin: readonly [number, number, number] = [0, 0, 0],
  ): IAutoMovieHumanCurveJet {
    if (!(span.interval > 0 && Number.isFinite(span.interval)))
      throw new Error(`Invalid physical Hermite interval: ${span.address}`);
    if (!(Number.isFinite(parameter) && parameter >= 0 && parameter <= 1))
      throw new Error(`Invalid local Hermite parameter: ${span.address}`);

    const point: [number, number, number] = [0, 0, 0];
    const tangent: [number, number, number] = [0, 0, 0];
    const second: [number, number, number] = [0, 0, 0];
    for (let axis: number = 0; axis < 3; axis++) {
      const first: number = span.startDerivative[axis]!;
      const last: number = span.endDerivative[axis]!;
      const secant: number =
        (span.end[axis]! - span.start[axis]!) / span.interval;
      // P(t) = P0 + H*(m0*t + A*t^2 + B*t^3). Thus dP/ds
      // uses dt/ds=1/H, and the second derivative has one further 1/H.
      const a: number = 3 * secant - 2 * first - last;
      const b: number = -2 * secant + first + last;
      point[axis] =
        parameter === 0
          ? span.start[axis]! - origin[axis]!
          : parameter === 1
            ? span.end[axis]! - origin[axis]!
            : span.start[axis]! -
              origin[axis]! +
              span.interval *
                parameter *
                (first + parameter * (a + parameter * b));
      tangent[axis] =
        parameter === 0
          ? first
          : parameter === 1
            ? last
            : first + parameter * (2 * a + 3 * parameter * b);
      second[axis] = (2 * a + 6 * parameter * b) / span.interval;
    }
    return { point, tangent, second };
  }

  /**
   * Sample the stored polynomial with a bounded control-polygon chord.
   * Subdivision changes only drawing and distance-query resolution. Its
   * coordinates, endpoint identities and physical derivatives are never fitted again.
   *
   * @param curve Source-free, ordered physical spans.
   * @param spacing Maximum control-polygon length per sample, millimetres.
   * @returns Ordered points with no repeated endpoint on a closed curve.
   *
   * @evidence contracts/common.md#principled-implementation The cubic derivative control polygon bounds travel per unit parameter. Sampling evaluates the same addressed physical Hermite polynomial as evaluate; local control edges avoid subtracting rounded world-space handles.
   * @evidence contracts/common.md#clear-and-simple-design Owns only display subdivision and endpoint ordering; the shared evaluator owns the polynomial and physical derivatives.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Does not refit, smooth corners, replace endpoints or use a separate world-space interpolation formula.
   * @evidence contracts/common.md#meaningful-documentation States physical spacing, preserved polynomial and endpoints, and closed-curve endpoint ordering.
   * @evidence contracts/performance.md#efficient-algorithms Visits each span once and emits ceil(speedBound/spacing) samples, with constant work per emitted point; smaller requested spacing increases output without an independent allocation cap.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses evaluate for every sample rather than maintaining a second polynomial evaluation path.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns caller-owned points and retains no cache, source reference or external handle after the call.
   */
  export function sample(
    curve: IAutoMovieHumanHermiteCurve,
    spacing: number,
  ): [number, number, number][] {
    if (!(spacing > 0 && Number.isFinite(spacing)))
      throw new Error("Hermite boundary needs positive spacing");
    const points: [number, number, number][] = [];
    for (const [index, span] of curve.spans.entries()) {
      const next: IAutoMovieHumanHermiteCurve["spans"][number] | undefined =
        curve.spans[index + 1] ?? (curve.closed ? curve.spans[0] : undefined);
      if (
        next &&
        !span.end.every(
          (v: number, axis: number): boolean => v === next.start[axis],
        )
      )
        throw new Error(`Disconnected Hermite boundary: ${span.address}`);
      const delta: number[] = span.end.map(
        (v: number, axis: number): number => v - span.start[axis]!,
      );
      const first: number[] = span.startDerivative.map(
        (v: number): number => (span.interval * v) / 3,
      );
      const last: number[] = span.endDerivative.map(
        (v: number, axis: number): number =>
          delta[axis]! - (span.interval * v) / 3,
      );
      // The derivative is a convex combination of three control edges,
      // multiplied by three. Its maximum edge norm bounds speed on [0,1],
      // hence bounds every sampled chord without assuming uniform arclength.
      const speedBound: number =
        3 *
        Math.max(
          Math.hypot(...first),
          Math.hypot(
            ...last.map((v: number, axis: number): number => v - first[axis]!),
          ),
          Math.hypot(
            ...last.map((v: number, axis: number): number => delta[axis]! - v),
          ),
        );
      const steps: number = Math.max(1, Math.ceil(speedBound / spacing));
      for (let i: number = 0; i < steps; i++)
        points.push(evaluate(span, i / steps).point);
    }
    if (!curve.closed && curve.spans.length)
      points.push([...curve.spans[curve.spans.length - 1]!.end]);
    return points;
  }
}
