/**
 * One homogeneous layer of an envelope assembly.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `IAutoMovieEnvelopeLayer` declares one material thickness and conductivity used to calculate envelope thermal resistance.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The layer record contributes one explicit `thickness / conductivity` resistance to a resolved assembly load path.
 */
export interface IAutoMovieEnvelopeLayer {
  /**
   * Stable layer identity within the assembly.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment The layer `id` keeps each authored material stratum separately traceable in the envelope build-up.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract This stable key makes duplicate layers a deterministic validation error within their assembly.
   */
  id: string;
  /**
   * Thickness in metres; strictly positive.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `thickness` states the material depth through which the envelope heat load passes.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The positive metre value is divided by conductivity to obtain this layer's thermal resistance.
   */
  thickness: number;
  /**
   * Thermal conductivity in W/(m*K); strictly positive.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `conductivity` declares how readily this authored layer transmits heat instead of selecting a hidden material table.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The positive W/(m*K) operand closes the steady one-dimensional resistance calculation for the layer.
   */
  conductivity: number;
}
