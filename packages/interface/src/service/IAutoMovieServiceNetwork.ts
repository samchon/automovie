import { IAutoMovieWetZone } from "./IAutoMovieWetZone";
import { IAutoMovieServiceNode } from "./IAutoMovieServiceNode";
import { IAutoMovieServicePenetration } from "./IAutoMovieServicePenetration";
import { IAutoMovieServiceSegment } from "./IAutoMovieServiceSegment";
import { IAutoMovieServiceSystem } from "./IAutoMovieServiceSystem";

/**
 * The distribution networks a built environment is served by, as one graph.
 *
 * Water, drainage, power, data, air, fire suppression and control are the same
 * computational object: equipment that owns typed ports, segments that join two
 * ports, junctions where several meet, and sleeves where a run crosses a
 * boundary. Giving each discipline its own record would make "is this network
 * connected" seven different questions with seven different answers, so the
 * graph is shared and only the **rules** are per discipline: an engine
 * validator decides which media a discipline may carry and which unit each
 * medium is measured in, and a domain solver — flow, circuit load, duct
 * pressure — remains a separate analysis this record does not claim to
 * perform.
 *
 * Nothing here is a catalogue. There is no fixture library, no pipe schedule
 * and no equipment model: a basin, a sprinkler head and a distribution panel
 * are all authored by the production as nodes with the ports they actually
 * have. What the record owns is the part a rendering that merely _looks_
 * plumbed cannot prove — that every port is joined to something, that the
 * medium and unit agree end to end, that a run crossing a wall declares the
 * sleeve it passes through, that two disciplines do not occupy the same cubic
 * metre, and that the space a panel needs to be opened in stays clear.
 *
 * The record is **beside** the architecture record rather than inside it, and
 * cites it only by stable id, exactly as an independent fluid domain is bound
 * to a basin by `IAutoMovieWaterFeature`. A drainage network that ends in a
 * floor gully composes that same fluid domain instead of inventing a second
 * model of moving water.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `IAutoMovieServiceNetwork` as the portable data boundary for the interior service network validation requirement.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `IAutoMovieServiceNetwork` for the interior space service network contract system contract.
 * @author Samchon
 */
export interface IAutoMovieServiceNetwork {
  /**
   * Schema version.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `version` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `version` for the interior space service network contract system contract.
   */
  version: 1;

  /**
   * Stable identity of this network within the production.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `id` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `id` for the interior space service network contract system contract.
   */
  id: string;

  /**
   * All authored lengths are measured in metres.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `units` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `units` for the interior space service network contract system contract.
   */
  units: "meter";

  /**
   * Id of the `IAutoMovieBuiltEnvironment` this network serves.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `environment` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `environment` for the interior space service network contract system contract.
   */
  environment: string;

  /**
   * Independently rooted distribution systems, each carrying one medium.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `systems` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `systems` for the interior space service network contract system contract.
   */
  systems: IAutoMovieServiceSystem[];

  /**
   * Every fixture, machine, junction, terminal and inline device.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `nodes` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `nodes` for the interior space service network contract system contract.
   */
  nodes: IAutoMovieServiceNode[];

  /**
   * Runs joining exactly two ports: a pipe, a duct, a conduit, a cable.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `segments` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `segments` for the interior space service network contract system contract.
   */
  segments: IAutoMovieServiceSegment[];

  /**
   * Sleeves where a run crosses a boundary of the served environment.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `penetrations` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `penetrations` for the interior space service network contract system contract.
   */
  penetrations: IAutoMovieServicePenetration[];

  /**
   * Wet and waterproofed regions bound to logical spaces of that environment.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-network-validation Exposes `zones` as the portable data boundary for the interior service network validation requirement.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract Types `zones` for the interior space service network contract system contract.
   */
  zones: IAutoMovieWetZone[];
}
