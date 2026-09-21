/**
 * What an analysis of this network can and cannot answer today.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-routing `IAutoMovieServiceCheckReport` distinguishes checks the engine truly performs from quantitative service analyses it cannot claim have passed.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `IAutoMovieServiceCheckReport` carries one named capability decision with an explicit support state and rationale.
 */
export interface IAutoMovieServiceCheckReport {
  /**
   * Stable rule identity.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `check` gives each connectivity, clearance, waterproofing, or discipline-performance claim a stable name in the report.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `check` is the deterministic rule identity to which the support decision applies.
   */
  check: string;
  /**
   * `supported` when the engine really performs the check on this input;
   * `unsupported` when nothing here can perform it. A supported check that was
   * simply not executed is never reported as either.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `status` prevents an unavailable pressure, head, voltage-drop, or throw solver from being presented as a successful check.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `status` closes every reported capability to the honest `supported` or `unsupported` outcome.
   */
  status: "supported" | "unsupported";
  /**
   * Why it is or is not answerable, naming what is missing when it is not.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `reason` tells the author which geometry, reference, or solver makes the named service check answerable or unavailable.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `reason` records the input-specific basis for the paired support state instead of implying a silent pass.
   */
  reason: string;
}
