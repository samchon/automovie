import {
  AutoMovieServiceDiscipline,
  AutoMovieServiceMedium,
  AutoMovieServiceUnit,
} from "@automovie/interface";

import { IAutoMovieServiceSchematicEdge } from "./IAutoMovieServiceSchematicEdge";
import { IAutoMovieServiceSchematicNode } from "./IAutoMovieServiceSchematicNode";

/**
 * One system reduced to the drawing an operator can actually read.
 *
 * The schematic derives plan geometry and totals from the supplied graph;
 * it neither proves design intent nor asserts that validation accepted it.
 * serviceNetworkSchematic currently has no production consumer; validation is
 * not a precondition enforced by this record or that producer.
 *
 * @evidence contracts/common.md#principled-implementation System metadata, projected nodes/edges and unprojected totals are distinct quantities, so drawing coordinates do not replace physical route length or declared demand.
 * @evidence contracts/common.md#clear-and-simple-design One derived report combines schematic rows and totals while the network owns source records and serviceSystemReach owns connectivity.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unreachable ids and source metadata remain visible; this report neither certifies hydraulic performance nor implies its producer ran validation.
 * @evidence contracts/common.md#meaningful-documentation Explains projection versus physical totals, declaration order, source units and the current producer's unconsumed status.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface declares no algorithm; projection, traversal and total cost are answered by serviceNetworkSchematic.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The producer creates one report per current system, and this data type coordinates no repeated projection work.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Fresh schematic arrays and primitive metadata belong to the caller, containing no live map or network object handle.
 */
export interface IAutoMovieServiceSchematic {
  /** Identity of the system this schematic projects. */
  system: string;
  /** Discipline the system declared. */
  discipline: AutoMovieServiceDiscipline;
  /** Medium the system declared. */
  medium: AutoMovieServiceMedium;
  /** Unit every demand below is stated in. */
  unit: AutoMovieServiceUnit;
  /** Node the system is rooted at. */
  root: string;
  /** Every node carrying a port on the system, in declaration order. */
  nodes: IAutoMovieServiceSchematicNode[];
  /** Every run on the system, in declaration order. */
  edges: IAutoMovieServiceSchematicEdge[];
  /** Sum of every edge's developed length, in metres. */
  totalLength: number;
  /**
   * Declared load of the system in {@link unit}; see {@link serviceSystemLoad}.
   */
  totalDemand: number;
  /** Nodes on the system the root does not reach, in declaration order. */
  unreachable: string[];
}
