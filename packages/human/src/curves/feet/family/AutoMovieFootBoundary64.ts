import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import { AutoMovieFootMath64 as M } from "./AutoMovieFootMath64";

/** Actual cubic collar tensor; its full derivative uses the proximal mm chart. */
export namespace AutoMovieFootBoundary64 {
  /**
   * Four longitudinal Bernstein rows over the actual four angular ankle spans.
   * Row n is P - n*drop*J/3; all control positions are world millimetres.
   *
   * @author Samchon
   */
  export interface Tensor {
    /** Upstream canonical ankle identity preserved at s=0. */
    id: string;

    /** Positive distal extrusion distance in proximal-chart millimetres. */
    drop: number;

    /** Rows 0 through 3, each containing the same ordered angular cubic spans. */
    nets: readonly (readonly C.Span[])[];

    /** World unit direction of increasing proximal millimetres. */
    axis: C.Vector;
  }
  /**
   * Extrude current ankle P linearly toward distal collar P-drop*J.
   * Drop is positive proximal-chart millimetres; J is the actual per-proximal-mm
   * control derivative. Caller admission supplies matching angular span order.
   */
  export function construct(boundary: C.Boundary, drop: number): Tensor {
    return {
      id: boundary.id,
      drop,
      axis: boundary.longitudinalAxis,
      nets: [0, 1, 2, 3].map((n: number): C.Span[] =>
        boundary.section.spans.map(
          (span: C.Span, i: number): C.Span =>
            span.map(
              (p: C.Vector, k: number): C.Vector =>
                M.sub(p, M.mul(boundary.fullJ[i]![k]!, (n * drop) / 3)),
            ) as unknown as C.Span,
        ),
      ),
    };
  }
  /**
   * Evaluate the angular control rows at normalized distal s: zero is ankle, one collar.
   * Returns world-millimetre cubic angular spans, not sampled section vertices.
   */
  export function section(tensor: Tensor, s: number): C.Span[] {
    return tensor.nets[0]!.map(
      (span: C.Span, i: number): C.Span =>
        span.map(
          (_: C.Vector, k: number): C.Vector =>
            M.bezier(
              [
                tensor.nets[0]![i]![k]!,
                tensor.nets[1]![i]![k]!,
                tensor.nets[2]![i]![k]!,
                tensor.nets[3]![i]![k]!,
              ],
              s,
            ),
        ) as unknown as C.Span,
    );
  }
  /**
   * Return the control derivative per increasing proximal millimetre at distal s.
   * The chain rule ds/d(proximal mm)=-1/drop preserves the upstream sign at s=0.
   */
  export function fullJ(tensor: Tensor, s: number): C.Span[] {
    return tensor.nets[0]!.map(
      (span: C.Span, i: number): C.Span =>
        span.map(
          (_: C.Vector, k: number): C.Vector =>
            M.mul(
              M.derivative(
                [
                  tensor.nets[0]![i]![k]!,
                  tensor.nets[1]![i]![k]!,
                  tensor.nets[2]![i]![k]!,
                  tensor.nets[3]![i]![k]!,
                ],
                s,
              ),
              -1 / tensor.drop,
            ),
        ) as unknown as C.Span,
    );
  }
  /**
   * Publish the tensor's ankle end with its actual full derivative and proximal axis.
   * The four angular spans retain the canonical outer/front/inner/back quarter-turn chart.
   */
  export function evaluate(tensor: Tensor): C.Boundary {
    return {
      id: tensor.id,
      section: {
        type: "cubicBezier",
        name: tensor.id,
        closed: true,
        unit: "mm",
        phaseUnit: "turn",
        phaseIntervals: [0.25, 0.25, 0.25, 0.25],
        spans: section(tensor, 0),
      },
      fullJ: fullJ(tensor, 0),
      longitudinalUnit: "mm",
      longitudinalAxis: tensor.axis,
    };
  }
}
