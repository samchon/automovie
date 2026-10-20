import { IAutoMovieServiceNode } from "./IAutoMovieServiceNode";
import { IAutoMovieServicePenetration } from "./IAutoMovieServicePenetration";
import { IAutoMovieServiceSegment } from "./IAutoMovieServiceSegment";
import { IAutoMovieServiceSystem } from "./IAutoMovieServiceSystem";
import { IAutoMovieWetZone } from "./IAutoMovieWetZone";

/**
 * The distribution networks a built environment is served by, as one graph.
 *
 * Typed ports, two-port segments, junctions and boundary sleeves share one graph across disciplines. Discipline rules select medium and unit; quantitative flow, circuit and pressure models remain separate and are not supplied by this graph alone.
 *
 * Productions author equipment nodes and their ports rather than selecting a built-in fixture catalog. Validation examines declared connectivity, medium/unit agreement, demand, sleeves, run clashes and maintenance keep-outs; missing spatial facts remain explicit analysis gaps rather than measured service performance.
 *
 * This record sits beside architecture and cites its environment by stable id. The exported `lowerWetZoneDrainage` can compose declared plumbing inlets and drainage outlets into an independent fluid domain, but currently has test callers rather than a production wet-zone binding phase; declaring this graph alone starts no water simulation.
 *
 * @evidence contracts/common.md#principled-implementation A typed port/segment graph joins rooted systems to the served environment, validating declared connectivity, medium/unit/direction, demand capacity, spatial run clashes, maintenance volumes and explicit boundary penetrations.
 * @evidence contracts/common.md#clear-and-simple-design Shared graph structure serves every discipline while architecture owns spaces/boundaries and domain analysis reports unsupported quantitative solvers separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Structural admission cannot prove hydraulic head loss, circuit behavior or duct pressure. Missing spatial cell/face facts limit applicability; `serviceAnalysisSupport` separately describes those limits as capability metadata and is not proof that a check ran or that a production report consumed it.
 * @evidence contracts/common.md#meaningful-documentation Defines meter units, environment ownership, rooted systems, nodes, two-port runs, sleeves and waterproofed zones.
 */
export interface IAutoMovieServiceNetwork {
  /** Schema version. */
  version: 1;

  /** Stable identity of this network within the production. */
  id: string;

  /** All authored lengths are measured in metres. */
  units: "meter";

  /** Id of the `IAutoMovieBuiltEnvironment` this network serves. */
  environment: string;

  /** Independently rooted distribution systems, each carrying one medium. */
  systems: IAutoMovieServiceSystem[];

  /** Every fixture, machine, junction, terminal and inline device. */
  nodes: IAutoMovieServiceNode[];

  /** Runs joining exactly two ports: a pipe, a duct, a conduit, a cable. */
  segments: IAutoMovieServiceSegment[];

  /** Sleeves where a run crosses a boundary of the served environment. */
  penetrations: IAutoMovieServicePenetration[];

  /**
   * Wet and waterproofed regions bound to logical spaces of that environment.
   */
  zones: IAutoMovieWetZone[];
}
