/**
 *
 * One linear thermal bridge along an assembly.
 *
 * Adds `linearTransmittance * length` W/K to the envelope's heat transfer and
 * to the bridge share. `assembly` must name an assembly of the same request,
 * but the bridge is not attributed to that assembly's own metrics or sample.
 *
 * @evidence contracts/common.md#principled-implementation Linear transmittance psi times length is the standard additive correction of a one-dimensional U-value network for heat flow at junctions.
 * @evidence contracts/common.md#clear-and-simple-design Kept apart from assemblies so a junction is declared once without splitting an assembly's area.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The assembly reference is validated for existence and then unused in the arithmetic; every bridge adds to the envelope totals whichever assembly it names.
 * @evidence contracts/common.md#meaningful-documentation States the heat-transfer contribution, its effect on the bridge share, and that the assembly link is checked but not attributed.
 * @evidenceExclude contracts/performance.md#cost-and-resources An input record; bridges are summed once, linear in their count. Summed once per study into one bridge total that both the heat-loss and bridge-share metrics read. An id, an assembly reference and two numbers owned by the request for one study.
 * @author Samchon
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
