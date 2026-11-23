import type { AutoMovieServiceDiscipline } from "./AutoMovieServiceDiscipline";
import type { AutoMovieServiceMedium } from "./AutoMovieServiceMedium";
import type { AutoMovieServiceUnit } from "./AutoMovieServiceUnit";
import type { IAutoMovieServiceSchematicEdge } from "./IAutoMovieServiceSchematicEdge";
import type { IAutoMovieServiceSchematicNode } from "./IAutoMovieServiceSchematicNode";

/**
 * One system reduced to the drawing an operator can actually read.
 *
 * The schematic derives plan geometry and totals from the supplied graph; it
 * neither proves design intent nor asserts that validation accepted it.
 * serviceNetworkSchematic currently has no production consumer; validation is
 * not a precondition enforced by this record or that producer.
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
  /** Declared load of the system in {@link unit}; see {@link serviceSystemLoad}. */
  totalDemand: number;
  /** Nodes on the system the root does not reach, in declaration order. */
  unreachable: string[];
}
