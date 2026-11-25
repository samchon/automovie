import type {
  IAutoMovieCurveLengthQuadrature64,
  IAutoMovieMeasureCurveLength64,
} from "@automovie/interface";

import { overflowsBinary64 } from "../../math/overflowsBinary64";

/**
 * Internal shared GL8 computation for original curve derivatives, with numeric
 * observations separated from each public length owner's admission policy. This
 * module is not re-exported by the curve barrel or a scalar integrator.
 */
export namespace AutoMovieCurveLengthQuadrature64 {
  /** Exact closed-domain addresses requested by the two composite rules. */
  export function parameters(
    domain: readonly [number, number],
    subdivisions: number,
  ): number[] {
    const [a, b]: readonly [number, number] = domain;
    const width: number = b - a;
    const samples: number[] = [a, b];
    for (const count of [subdivisions, 2 * subdivisions])
      for (let interval: number = 0; interval < count; ++interval)
        for (const node of NODES)
          samples.push(parameter(a, width, interval, node, count));
    return samples;
  }

  /**
   * Observe two bounded composite rules without choosing the public policy.
   * Callers admit nonempty pieces, finite increasing representable domains and
   * integer K in [1,1024]. Derivatives use mm per domain-parameter unit. Zero
   * speed is valid. Endpoint reads are requested only by the strict owner; the
   * legacy cubic owner keeps its original interior-only finite-final test.
   * Callback exceptions propagate, while arithmetic observations accompany the
   * actual computed coarse/fine sums. Their difference is not an error bound.
   */
  export function measure(
    pieces: IAutoMovieMeasureCurveLength64.IPieces,
    subdivisions: number,
    endpoints: boolean,
  ): IAutoMovieCurveLengthQuadrature64.IMeasureResult {
    let nonfiniteDerivative: boolean = false;
    let underflowingContribution: boolean = false;
    let nonfiniteContribution: boolean = false;
    let collapsedNode: boolean = false;
    if (endpoints)
      for (const piece of pieces) {
        speed(piece.derivative, piece.domain[0]);
        speed(piece.derivative, piece.domain[1]);
      }
    const coarseMm: number = integral(subdivisions);
    const fineMm: number = integral(2 * subdivisions);
    return {
      coarseMm,
      fineMm,
      nonfiniteDerivative,
      underflowingContribution,
      nonfiniteContribution,
      collapsedNode,
    };

    /**
     * Observe each original norm without applying either public owner's failure
     * policy.
     */
    function speed(
      read: (parameter: number) => readonly [number, number, number],
      parameter: number,
    ): number {
      const derivative: readonly [number, number, number] = read(parameter);
      const value: number = Math.hypot(...derivative);
      // A callback supplies the derivative, and a finite one can still overflow its norm.
      nonfiniteDerivative ||=
        !derivative.every(Number.isFinite) || overflowsBinary64(value);
      return value;
    }

    /**
     * Keep local [0,1] cubic arithmetic and accumulation unchanged, including
     * underflow observations.
     */
    function integral(count: number): number {
      let length: number = 0;
      for (const piece of pieces) {
        const [a, b]: readonly [number, number] = piece.domain;
        const width: number = b - a;
        for (let interval: number = 0; interval < count; ++interval) {
          const low: number = a + width * (interval / count);
          const high: number = a + width * ((interval + 1) / count);
          for (let i: number = 0; i < NODES.length; ++i) {
            const at: number = parameter(a, width, interval, NODES[i]!, count);
            collapsedNode ||= !(at > low && at < high);

            // Arithmetic collapse must not send a strict source callback outside its closed chart.
            if (!(at >= a && at <= b)) {
              length = NaN;
              continue;
            }
            const value: number = speed(piece.derivative, at);
            const contribution: number =
              (WEIGHTS[i]! * value * width) / (2 * count);
            underflowingContribution ||= value > 0 && contribution === 0;
            nonfiniteContribution ||= overflowsBinary64(contribution);
            length += contribution;
          }
        }
      }
      return length;
    }
  }
}

/** Preserve the original binary64 affine-node operation order. */
function parameter(
  a: number,
  width: number,
  interval: number,
  node: number,
  count: number,
): number {
  const unit: number = (interval + (node + 1) / 2) / count;
  return a + width * unit;
}

/** Existing cubic-length eight-point Gauss-Legendre abscissas on [-1,1]. */
const NODES: readonly number[] = [
  -0.9602898564975363, -0.7966664774136267, -0.525532409916329,
  -0.1834346424956498, 0.1834346424956498, 0.525532409916329,
  0.7966664774136267, 0.9602898564975363,
];

/** Existing positive cubic-length weights, in the unchanged node order. */
const WEIGHTS: readonly number[] = [
  0.1012285362903763, 0.2223810344533745, 0.3137066458778873, 0.362683783378362,
  0.362683783378362, 0.3137066458778873, 0.2223810344533745, 0.1012285362903763,
];
