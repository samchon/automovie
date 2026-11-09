/**
 * Internal shared GL8 computation for original curve derivatives, with numeric
 * observations separated from each public length owner's admission policy.
 * This module is not re-exported by the curve barrel or a scalar integrator.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States internal ownership, validated caller premises, unchanged GL8 arithmetic and policy-neutral observations.
 * @evidence contracts/development/design.md#principled-representation Represents Internal shared GL8 computation for original curve derivatives, with numeric observations separated from each public length owner's admission policy: companion namespace of 1 member (`measure`); units and frames named in its text: world, second, local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieCurveLengthQuadrature64` in packages/engine/src/geometry/curve/AutoMovieCurveLengthQuadrature64.ts; its surface is the 1 member listed and the text shows 2 other files naming it, mostly packages/engine (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieCurveLengthQuadrature64 {
  /**
   * Observe two bounded composite rules without choosing the public policy.
   * Callers admit nonempty pieces, finite increasing representable domains and
   * integer K in [1,1024]. Derivatives use mm per domain-parameter unit.
   * Zero speed is valid. Endpoint reads are requested only by the strict owner;
   * the legacy cubic owner keeps its original interior-only finite-final test.
   * Callback exceptions propagate, while arithmetic observations accompany the
   * actual computed coarse/fine sums. Their difference is not an error bound.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Evaluates each original world derivative norm and unchanged GL8 weighted term in original piece/panel/node order for K and 2K; optional endpoints are observations only.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Returns computed sums with finite/underflow/node observations so public owners apply distinct existing contracts without a second quadrature implementation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not clamp parameters, manufacture derivatives or reject a legacy finite-final observation on strict-only premises; an out-of-domain rounded query is skipped and marked unavailable.
   * @evidence contracts/development/common.md#meaningful-documentation States validated input/units, optional endpoints, flags, exception propagation and observation-only accuracy.
   * @evidence contracts/development/implementation.md#efficient-algorithms Uses 24NK interior slots and optionally 2N endpoint reads, with fixed-size flags and scalar accumulators instead of an adaptive queue.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The same speed reader, constants and summation serve both rules and both public length callers; no previous source measurement is cached.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Borrows callbacks and domains synchronously and returns scalar observations only; fixed module constants are the sole retained population.
   */
  export function measure(
    pieces: readonly {
      /** Original finite closed parameter interval, admitted by the caller. */
      domain: readonly [number, number];
      /** Original world derivative in mm per interval-parameter unit. */
      derivative: (parameter: number) => readonly [number, number, number];
    }[],
    subdivisions: number,
    endpoints: boolean,
  ): {
    /** K-panel computed sum, mm. */
    coarseMm: number;
    /** K*2-panel computed sum, mm. */
    fineMm: number;
    /** A requested derivative component or its norm was nonfinite. */
    nonfiniteDerivative: boolean;
    /** A positive speed produced a zero weighted contribution. */
    underflowingContribution: boolean;
    /** A weighted contribution was nonfinite. */
    nonfiniteContribution: boolean;
    /** A mapped node was not strictly inside its panel. */
    collapsedNode: boolean;
  } {
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

    /** Observe each original norm without applying either public owner's failure policy. */
    function speed(
      read: (parameter: number) => readonly [number, number, number],
      parameter: number,
    ): number {
      const derivative: readonly [number, number, number] = read(parameter);
      const value: number = Math.hypot(...derivative);
      nonfiniteDerivative ||=
        !derivative.every(Number.isFinite) || !Number.isFinite(value);
      return value;
    }

    /** Keep local [0,1] cubic arithmetic and accumulation unchanged, including underflow observations. */
    function integral(count: number): number {
      let length: number = 0;
      for (const piece of pieces) {
        const [a, b]: readonly [number, number] = piece.domain;
        const width: number = b - a;
        for (let interval: number = 0; interval < count; ++interval) {
          const low: number = a + width * (interval / count);
          const high: number = a + width * ((interval + 1) / count);
          for (let i: number = 0; i < NODES.length; ++i) {
            const unit: number = (interval + (NODES[i]! + 1) / 2) / count;
            const parameter: number = a + width * unit;
            collapsedNode ||= !(parameter > low && parameter < high);

            // Arithmetic collapse must not send a strict source callback outside its closed chart.
            if (!(parameter >= a && parameter <= b)) {
              length = NaN;
              continue;
            }
            const value: number = speed(piece.derivative, parameter);
            const contribution: number =
              (WEIGHTS[i]! * value * width) / (2 * count);
            underflowingContribution ||= value > 0 && contribution === 0;
            nonfiniteContribution ||= !Number.isFinite(contribution);
            length += contribution;
          }
        }
      }
      return length;
    }
  }
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
