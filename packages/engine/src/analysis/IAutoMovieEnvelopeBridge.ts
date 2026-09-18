/**
 * One linear thermal bridge along an assembly.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `IAutoMovieEnvelopeBridge` declares one linear bypass whose extra heat load must not disappear into planar U-values.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The bridge links a length and linear transmittance to a resolved assembly before its watt contribution is added.
 */
export interface IAutoMovieEnvelopeBridge {
  /**
   * Stable bridge identity within the request.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment The bridge `id` keeps each linear thermal path individually attributable in validation and settings evidence.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract This identity makes duplicate bridge declarations explicit before their loads are summed.
   */
  id: string;
  /**
   * Assembly the bridge runs along.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `assembly` names the envelope build-up along which this extra thermal path runs.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The foreign key is resolved against declared assembly ids so an orphaned bridge cannot enter the load total.
   */
  assembly: string;
  /**
   * Linear thermal transmittance in W/(m*K); at or above zero.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `linearTransmittance` declares the bridge's additional heat-flow rate per metre and kelvin.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The nonnegative psi-value is multiplied by bridge length and temperature difference for its bounded load.
   */
  linearTransmittance: number;
  /**
   * Length in metres; strictly positive.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment Bridge `length` states how far the declared linear heat path extends.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The positive metre measure scales psi into a conductance before exterior-interior temperature difference is applied.
   */
  length: number;
}
