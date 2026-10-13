import { IAutoMovieServiceNode } from "./IAutoMovieServiceNode";
import { IAutoMovieServicePenetration } from "./IAutoMovieServicePenetration";
import { IAutoMovieServiceSegment } from "./IAutoMovieServiceSegment";
import { IAutoMovieServiceSystem } from "./IAutoMovieServiceSystem";
import { IAutoMovieWetZone } from "./IAutoMovieWetZone";

/**
 * The distribution networks a built environment is served by, as one graph.
 *
 * Water, drainage, power, data, air, fire suppression and control are the same computational object: equipment that owns typed ports, segments that join two ports, junctions where several meet, and sleeves where a run crosses a boundary. Giving each discipline its own record would make "is this network connected" seven different questions with seven different answers, so the graph is shared and only the **rules** are per discipline: an engine validator decides which media a discipline may carry and which unit each medium is measured in, and a domain solver; flow, circuit load, duct pressure; remains a separate analysis this record does not claim to perform.
 *
 * Nothing here is a catalogue. There is no fixture library, no pipe schedule and no equipment model: a basin, a sprinkler head and a distribution panel are all authored by the production as nodes with the ports they actually have. What the record owns is the part a rendering that merely _looks_ plumbed cannot prove; that every port is joined to something, that the medium and unit agree end to end, that a run crossing a wall declares the sleeve it passes through, that two disciplines do not occupy the same cubic metre, and that the space a panel needs to be opened in stays clear.
 *
 * The record is **beside** the architecture record rather than inside it, and cites it only by stable id, exactly as an independent fluid domain is bound to a basin by `IAutoMovieWaterFeature`. A drainage network that ends in a floor gully composes that same fluid domain instead of inventing a second model of moving water.
 *
 * @evidence contracts/common.md#principled-implementation A typed port/segment graph joins rooted systems to the served environment, validating declared connectivity, medium/unit/direction, demand capacity, spatial run clashes, maintenance volumes and explicit boundary penetrations.
 * @evidence contracts/common.md#clear-and-simple-design Shared graph structure serves every discipline while architecture owns spaces/boundaries and domain analysis reports unsupported quantitative solvers separately.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Topological and declared-load validation cannot prove hydraulic head loss, circuit behavior or duct pressure; missing spatial cell/face facts remain analysis gaps rather than guessed containment.
 * @evidence contracts/common.md#meaningful-documentation Defines meter units, environment ownership, rooted systems, nodes, two-port runs, sleeves and waterproofed zones.
 * @author Samchon
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
