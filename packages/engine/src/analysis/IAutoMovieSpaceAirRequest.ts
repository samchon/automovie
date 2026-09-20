import { IAutoMovieAnalysisTarget } from "@automovie/interface";

/**
 * Everything one ventilation study is configured with.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `IAutoMovieSpaceAirRequest` declares one zone's volume, outdoor-air supply, occupancy, carbon-dioxide sources, and targets without implying a flow field.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The request closes the scalar ventilation network used for air-change, per-person flow, and well-mixed concentration outcomes.
 */
export interface IAutoMovieSpaceAirRequest {
  /**
   * Stable run identity.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment The air request `id` gives one ventilation calculation a stable run identity.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract This key anchors the sealed air-domain result and its deterministic diagnostics.
   */
  id: string;
  /**
   * Logical space being ventilated.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment Air-study `subject` names the logical space whose supply and contaminant capacity are evaluated.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The space label is copied into the run so ventilation evidence remains attributable to its resolved zone.
   */
  subject: string;
  /**
   * Design revision being read.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment Air-study `inputRevision` records which design state supplied the volume, occupancy, and ventilation flow.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The revision is sealed with the outcome so superseded service-capacity evidence is classified as stale.
   */
  inputRevision: string;
  /**
   * Space volume in m^3; strictly positive.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment Space `volume` states the air capacity across which the declared supply is distributed.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The positive cubic-metre operand converts supply flow into the room's hourly air-change rate.
   */
  volume: number;
  /**
   * Mechanical outdoor-air supply in m^3/s, or null when none is declared.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `supplyFlow` declares mechanical outdoor-air capacity, with null preserving the absence of a specified service.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract A positive flow enables the three scalar ventilation equations; null or zero yields named gaps instead of inferred air movement.
   */
  supplyFlow: number | null;
  /**
   * Occupants the space is designed for; a whole number at or above zero.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `occupants` states the design population against which ventilation capacity and contaminant load are judged.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The whole-number count determines whether per-person flow is defined and multiplies individual carbon-dioxide generation.
   */
  occupants: number;
  /**
   * Carbon dioxide one occupant generates, in m^3/s; at or above zero.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `occupantCarbonDioxide` declares the contaminant generation assigned to each design occupant.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The per-person m3/s rate is multiplied by occupancy in the well-mixed steady-state concentration balance.
   */
  occupantCarbonDioxide: number;
  /**
   * Outdoor carbon dioxide concentration in ppm; at or above zero.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment `outdoorCarbonDioxide` states the incoming baseline concentration instead of assuming ambient air quality.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The ppm baseline is the additive boundary condition in the resolved zone concentration equation.
   */
  outdoorCarbonDioxide: number;
  /**
   * Targets the production declares for this study.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-capacity-environment Air-study `targets` declare the service-capacity thresholds applied to computed ventilation and concentration values.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract The list is validated and matched by key and unit as each supported zone metric is constructed.
   */
  targets: readonly IAutoMovieAnalysisTarget[];
}
