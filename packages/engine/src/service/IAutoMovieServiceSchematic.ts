import { AutoMovieServiceDiscipline, AutoMovieServiceMedium, AutoMovieServiceUnit } from "@automovie/interface";
import { IAutoMovieServiceSchematicEdge } from "./IAutoMovieServiceSchematicEdge";
import { IAutoMovieServiceSchematicNode } from "./IAutoMovieServiceSchematicNode";

/**
 * One system reduced to the drawing an operator can actually read.
 *
 * The schematic is derived, never authored: it is the evidence that the graph
 * the validator accepted is the graph the production meant, at a size a report
 * can carry.
 *
 * @evidence requirements/interior/services-and-environment.md#interior-service-routing `IAutoMovieServiceSchematic` gives an operator one readable projection of a system's topology, routing extent, declared load, and disconnected nodes.
 * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `IAutoMovieServiceSchematic` is the derived typed summary of one validated service system rather than a second authored network.
 */
export interface IAutoMovieServiceSchematic {
  /**
   * Identity of the system this schematic projects.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `system` identifies which authored distribution system the schematic explains.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `system` carries the exact system id used to select schematic nodes and segments.
   */
  system: string;
  /**
   * Discipline the system declared.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `discipline` labels the schematic as plumbing, drainage, electrical, data, HVAC, fire, or control work for review.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `discipline` repeats the selected system's closed discipline discriminator unchanged.
   */
  discipline: AutoMovieServiceDiscipline;
  /**
   * Medium the system declared.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `medium` states the water, air, power, or signal actually conveyed by the shown route.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `medium` preserves the selected system's compatible-port medium for schematic interpretation.
   */
  medium: AutoMovieServiceMedium;
  /**
   * Unit every demand below is stated in.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `unit` tells the reader whether the displayed demand is flow, power, current, data rate, or a dimensionless quantity.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `unit` carries the system unit against which all contributing port demands were validated.
   */
  unit: AutoMovieServiceUnit;
  /**
   * Node the system is rooted at.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `root` marks the supply, collection, or ring origin from which the shown network's reachability is judged.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `root` retains the system's resolved root-node identifier in the derived record.
   */
  root: string;
  /**
   * Every node carrying a port on the system, in declaration order.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `nodes` lists every fitting and terminal that carries a port on the selected service, in stable drawing order.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `nodes` filters the network's declaration-ordered nodes by membership in the selected system.
   */
  nodes: IAutoMovieServiceSchematicNode[];
  /**
   * Every run on the system, in declaration order.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `edges` lists every run belonging to the selected service so its connection path can be read end to end.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `edges` projects only segments whose system id matches the schematic while retaining declaration order.
   */
  edges: IAutoMovieServiceSchematicEdge[];
  /**
   * Sum of every edge's developed length, in metres.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `totalLength` reports the complete installed run length in metres without losing vertical risers in the plan projection.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `totalLength` sums the three-dimensional developed length of every selected segment.
   */
  totalLength: number;
  /**
   * Declared load of the system in {@link unit}; see {@link serviceSystemLoad}.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `totalDemand` exposes the load that the selected service has been authored to carry in its declared unit.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `totalDemand` aggregates only the terminal-facing port demands selected by the system's flow direction.
   */
  totalDemand: number;
  /**
   * Nodes on the system the root does not reach, in declaration order.
   *
   * @evidence requirements/interior/services-and-environment.md#interior-service-routing `unreachable` names the service nodes disconnected from the system root so drawn but non-working branches remain visible.
   * @evidence specifications/interior-space/services-wet-and-fluid.md#interior-space-service-network-contract `unreachable` subtracts direction-aware root reachability from declaration-ordered system nodes.
   */
  unreachable: string[];
}
