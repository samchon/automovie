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
 * The schematic is derived, never authored: it is the evidence that the graph
 * the validator accepted is the graph the production meant, at a size a report
 * can carry.
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
