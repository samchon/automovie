/**
 * One linear thermal bridge along an assembly.
 *
 * Adds `linearTransmittance * length` W/K to the envelope's heat transfer and
 * to the bridge share. `assembly` must name an assembly of the same request,
 * but the bridge is not attributed to that assembly's own metrics or sample.
 *
 * @evidence contracts/common.md#principled-implementation Linear transmittance psi times length is the standard additive correction a one-dimensional U-value network makes for heat flow at junctions, so the analyzer adds `sum(psi * L)` to the fabric `sum(U * A)` before multiplying by the temperature difference.
 * @evidence contracts/common.md#clear-and-simple-design Bridges are a request-level list rather than members of an assembly because the envelope totals, not the per-assembly metrics, consume them; the `assembly` reference only proves the junction belongs to a declared build-up.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The assembly reference is validated for existence and is then not used in the arithmetic, which the documentation states, and no psi default or catalogue value is substituted.
 * @evidence contracts/common.md#meaningful-documentation The documentation states the W/K contribution, where it is counted and where it is not, and each property's unit, sign range and uniqueness scope.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A record type with no runtime code; the analyzer sums the bridges once, linear in their count.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A record type with no runtime code; its summed total is computed once per study and read by both the heat-loss and the bridge-share metrics.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources A record of an id, a reference and two numbers owned by the request; the analyzer retains nothing from it after returning.
 */
export interface IAutoMovieEnvelopeBridge {
  /** Stable bridge identity, unique within the request. */
  id: string;

  /** Assembly the bridge runs along; must be declared by the same request. */
  assembly: string;

  /** Linear thermal transmittance in W/(m*K); finite, at or above zero. */
  linearTransmittance: number;

  /** Length in metres; finite and strictly positive. */
  length: number;
}
