import { type IAutoMovieServiceNetwork, type IAutoMovieBuiltEnvironment, type IAutoMovieServiceSegment, type IAutoMovieViolationAppendSink, type IAutoMovieAppendServiceInsideSpace, type IAutoMovieViolationCollector, type IAutoMovieAppendServiceNetworkNodes, type IAutoMovieAppendServiceNetworkSegments, type IAutoMovieServicePenetration, type IAutoMovieSubjectContribution, type IAutoMovieLowerServiceNetwork, type IAutoMovieFluidDomain, type IAutoMovieLowerWetZoneDrainage, type IAutoMovieServiceNode, type IAutoMovieServicePort, type IAutoMovieVector3, type IAutoMovieServiceCheckReport, type IAutoMovieServiceAnalysisSupport, type IAutoMovieServiceEnvelopeObstructions, type IAutoMoviePropBox, type IAutoMovieServiceSchematic, type IAutoMovieServiceNetworkSchematic, type IAutoMovieServiceClash, type IAutoMovieServiceSystemLoad, type IAutoMovieServiceSystemReach, type IAutoMovieValidation, type IAutoMovieValidateServiceNetwork, type IAutoMovieValidateWetZones } from "@automovie/interface";
import { appendServiceCrossings as appendServiceCrossingsImplementation } from "./internal/appendServiceCrossings";
import { appendServiceInsideSpace as appendServiceInsideSpaceImplementation } from "./internal/appendServiceInsideSpace";
import { appendServiceNetworkCapacity as appendServiceNetworkCapacityImplementation } from "./internal/appendServiceNetworkCapacity";
import { appendServiceNetworkInterference as appendServiceNetworkInterferenceImplementation } from "./internal/appendServiceNetworkInterference";
import { appendServiceNetworkNodes as appendServiceNetworkNodesImplementation } from "./internal/appendServiceNetworkNodes";
import { appendServiceNetworkSegments as appendServiceNetworkSegmentsImplementation } from "./internal/appendServiceNetworkSegments";
import { appendServiceNetworkSystems as appendServiceNetworkSystemsImplementation } from "./internal/appendServiceNetworkSystems";
import { appendServiceSleeveOnFace as appendServiceSleeveOnFaceImplementation } from "./internal/appendServiceSleeveOnFace";
import { lowerServiceNetwork as lowerServiceNetworkImplementation } from "./internal/lowerServiceNetwork";
import { lowerWetZoneDrainage as lowerWetZoneDrainageImplementation } from "./internal/lowerWetZoneDrainage";
import { portOwners as portOwnersImplementation } from "./internal/portOwners";
import { portRecords as portRecordsImplementation } from "./internal/portRecords";
import { routeDistanceSquared as routeDistanceSquaredImplementation } from "./internal/routeDistanceSquared";
import { routeLength as routeLengthImplementation } from "./internal/routeLength";
import { serviceAnalysisSupport as serviceAnalysisSupportImplementation } from "./internal/serviceAnalysisSupport";
import { serviceEnvelopeObstructions as serviceEnvelopeObstructionsImplementation } from "./internal/serviceEnvelopeObstructions";
import { serviceMaintenanceBounds as serviceMaintenanceBoundsImplementation } from "./internal/serviceMaintenanceBounds";
import { serviceNetworkSchematic as serviceNetworkSchematicImplementation } from "./internal/serviceNetworkSchematic";
import { serviceSegmentBounds as serviceSegmentBoundsImplementation } from "./internal/serviceSegmentBounds";
import { serviceSegmentClashes as serviceSegmentClashesImplementation } from "./internal/serviceSegmentClashes";
import { serviceSegmentSpanBounds as serviceSegmentSpanBoundsImplementation } from "./internal/serviceSegmentSpanBounds";
import { serviceSystemLoad as serviceSystemLoadImplementation } from "./internal/serviceSystemLoad";
import { serviceSystemReach as serviceSystemReachImplementation } from "./internal/serviceSystemReach";
import { validateServiceNetwork as validateServiceNetworkImplementation } from "./internal/validateServiceNetwork";
import { validateWetZones as validateWetZonesImplementation } from "./internal/validateWetZones";

/** Public operations for Auto Movie Engine Service. */
export namespace AutoMovieEngineService {
  /**
   * Report a run that leaves the logical space it was in without a sleeve.
   *
   * The crossing is read off the logical space cells rather than off a wall face.
   * A boundary may now carry one, but it need not, and a run that leaves a room
   * has left it whether or not the separation it went through was ever modelled;
   * reading the rooms therefore finds crossings a face-intersection would miss
   * entirely. Losing or gaining a space between two consecutive route points is
   * exactly the moment a run left one region for another, and the run is expected
   * to name a sleeve on a boundary of one of them. Where the sleeve's boundary
   * does carry a face, that sleeve is separately held on it. Where no space in
   * the environment locates a volume at all, nothing can be said and nothing is:
   * a purely semantic partition is a name, not a wall to drill.
   *
   * Only the first uncovered crossing of a run is reported. A riser that left its
   * chase undeclared crosses every floor it passes, and one located finding is
   * what the author fixes.
   */
  export function appendServiceCrossings(network: IAutoMovieServiceNetwork, environment: IAutoMovieBuiltEnvironment, segment: IAutoMovieServiceSegment, path: string, out: IAutoMovieViolationAppendSink): void {
    appendServiceCrossingsImplementation(network, environment, segment, path, out);
  }

  /**
   * Hold one authored world point inside the logical space its node stands in.
   *
   * A node is placed in a room, and a port is the point a run is anchored to, so
   * the two answer the same question and are held by the same predicate the
   * architecture holds a prop with. A port allowed to drift out of its node's
   * room is the hole the crossing rule is evaded through: a crossing is read
   * _between_ consecutive route points, so a duct whose terminal port sits in the
   * plant room can be routed entirely inside that room, never appear to leave
   * anywhere, need no sleeve, and still render as the thing that serves the
   * hall.
   *
   * A point that is not finite has already been reported for being unreadable,
   * and a space that does not resolve has already been reported for not existing.
   * Neither is accused a second time of standing in the wrong place, which would
   * send an author looking for a second mistake at one address.
   */
  export function appendServiceInsideSpace(props: IAutoMovieAppendServiceInsideSpace.IProps): void {
    appendServiceInsideSpaceImplementation(props);
  }

  /**
   * Append declared capacity and root-reach findings in system then node
   * declaration order.
   */
  export function appendServiceNetworkCapacity(network: IAutoMovieServiceNetwork, root: string, out: IAutoMovieViolationCollector): void {
    appendServiceNetworkCapacityImplementation(network, root, out);
  }

  /**
   * Append conservative run clashes and unrelated-run access obstructions in
   * their original diagnostic order.
   */
  export function appendServiceNetworkInterference(network: IAutoMovieServiceNetwork, root: string, out: IAutoMovieViolationCollector): void {
    appendServiceNetworkInterferenceImplementation(network, root, out);
  }

  /**
   * Check node placement and ports while retaining first declaration paths for
   * later connectivity diagnostics.
   */
  export function appendServiceNetworkNodes(props: IAutoMovieAppendServiceNetworkNodes.IProps): void {
    appendServiceNetworkNodesImplementation(props);
  }

  /**
   * Check segment connectivity, admitted routes and cited sleeve fit, collecting
   * used penetration ids without changing diagnostic order.
   */
  export function appendServiceNetworkSegments(props: IAutoMovieAppendServiceNetworkSegments.IProps): Set<string> {
    return appendServiceNetworkSegmentsImplementation(props);
  }

  /**
   * Check system vocabulary, declared units and root port direction in source
   * order.
   */
  export function appendServiceNetworkSystems(network: IAutoMovieServiceNetwork, root: string, out: IAutoMovieViolationAppendSink, positive: (
    value: number,
    path: string,
    label: string,
    out: IAutoMovieViolationAppendSink,
  ) => void): void {
    appendServiceNetworkSystemsImplementation(network, root, out, positive);
  }

  /**
   * Hold a sleeve inside the face it claims to pierce.
   *
   * Until a boundary carried a face this could not be asked at all, and a sleeve
   * could only be held against the run that cited it. A face gives the question
   * an answer: the sleeve's world centre is read in the boundary's own frame,
   * where it must lie within the separation's thickness and inside its outline,
   * and a sleeve citing a declared opening must additionally sit inside that
   * opening's own void rather than merely somewhere on the same wall.
   *
   * The sleeve is held as the square that bounds it rather than as its true
   * circle, which errs towards refusing a hole tucked into a corner of an
   * irregular face. That is the same direction every other tolerance here leans:
   * a refused sleeve is moved, an unrefused one leaks. It is held by the very
   * predicate the architecture holds a door inside a wall with, so a sleeve and a
   * window cannot come to disagree about what "inside this face" means.
   *
   * A boundary with no face is not a failure. It is the pre-geometry record, and
   * `serviceAnalysisSupport` reports it as the reason this check is `unsupported`
   * rather than passing it silently.
   */
  export function appendServiceSleeveOnFace(environment: IAutoMovieBuiltEnvironment, sleeve: IAutoMovieServicePenetration, path: string, out: IAutoMovieViolationCollector): void {
    appendServiceSleeveOnFaceImplementation(environment, sleeve, path, out);
  }

  /**
   * Lower a service network into world-space run models and set pieces.
   *
   * The network and its wet zones must pass admission against the supplied
   * built environment. Each route sweeps a smooth, capped polygon of its
   * radius. Sides default to eight and must be a safe integer of at least
   * three.
   *
   * Output IDs are network ID followed by segment ID. The mesh already uses
   * world coordinates and each piece is placed at the origin.
   */
  export function lowerServiceNetwork(props: IAutoMovieLowerServiceNetwork.IProps): IAutoMovieSubjectContribution {
    return lowerServiceNetworkImplementation(props);
  }

  /**
   * Append a wet zone's plumbing sources and drains to a fluid domain.
   *
   * Use an admitted service network and a domain over the zone. Plumbing
   * inlets in its room become sources at their node's X/Z cell. Selected
   * inlets require cubic metres per second on both system and port. Listed
   * drain nodes contribute outgoing waste-water ports, with each sill at its
   * cell's bed elevation.
   *
   * Derived flows start at zero seconds with no end time. The new source and
   * drain arrays keep authored entries first. The function throws for an
   * unknown zone or listed drain, an off-lattice selected node, incompatible
   * inlet units or a derived ID already used by its authored flow array.
   */
  export function lowerWetZoneDrainage(props: IAutoMovieLowerWetZoneDrainage.IProps): IAutoMovieFluidDomain {
    return lowerWetZoneDrainageImplementation(props);
  }

  /**
   * Map every port id to the node that declares it, first declaration winning.
   * Values alias source nodes; duplicate admission belongs to
   * validateServiceNetwork.
   */
  export function portOwners(network: IAutoMovieServiceNetwork): Map<string, IAutoMovieServiceNode> {
    return portOwnersImplementation(network);
  }

  /** Map port ids to their source records, retaining the first declaration. */
  export function portRecords(network: IAutoMovieServiceNetwork): Map<string, IAutoMovieServicePort> {
    return portRecordsImplementation(network);
  }

  /**
   * Measure the closest squared distance to a service route, in square metres.
   *
   * The closest point may lie inside a segment or at its endpoint. A segment
   * with coincident endpoints supplies one candidate point. A route with
   * fewer than two points returns Infinity. Use metre coordinates whose
   * differences, projection products and squared distances are representable.
   */
  export function routeDistanceSquared(segment: IAutoMovieServiceSegment, point: IAutoMovieVector3): number {
    return routeDistanceSquaredImplementation(segment, point);
  }

  /**
   * Sum the lengths of consecutive three-dimensional route spans, in metres.
   *
   * A route with fewer than two points has length zero. Coincident neighbours
   * contribute zero. Use finite metre coordinates whose differences and total
   * length are representable.
   */
  export function routeLength(segment: IAutoMovieServiceSegment): number {
    return routeLengthImplementation(segment);
  }

  /**
   * Report which service checks the supplied network and building can
   * support.
   *
   * Placement and crossing require a declared space volume. Sleeve fit
   * requires a face on each cited boundary. Shared-endpoint run pairs are
   * exempt along their full routes. Each declared discipline adds an
   * unsupported performance row, in first-declaration order.
   *
   * The rows describe available checks. Run network and wet-zone admission
   * separately to obtain findings.
   */
  export function serviceAnalysisSupport(props: IAutoMovieServiceAnalysisSupport.IProps): IAutoMovieServiceCheckReport[] {
    return serviceAnalysisSupportImplementation(props);
  }

  /**
   * List equipment whose maintenance envelopes overlap a world-space box.
   *
   * Supply axis-aligned metre bounds. Each minimum must lie strictly below
   * the other box's maximum on every axis. This admits a flat box strictly
   * inside an envelope and excludes exterior contact. The result gives
   * node IDs in declaration order, skipping absent envelopes.
   */
  export function serviceEnvelopeObstructions(props: IAutoMovieServiceEnvelopeObstructions.IProps): string[] {
    return serviceEnvelopeObstructionsImplementation(props);
  }

  /**
   * Translate a node's maintenance box into world metres.
   *
   * Add the node's position to the local minimum and maximum corners. An
   * absent envelope returns null.
   */
  export function serviceMaintenanceBounds(node: IAutoMovieServiceNode): IAutoMoviePropBox | null {
    return serviceMaintenanceBoundsImplementation(node);
  }

  /**
   * Project one service system to a plan schematic with run lengths and
   * demand.
   *
   * Plan X and Y read world X and Z. Each edge length uses the original
   * three-dimensional route in metres. Declared flow determines system
   * demand and unreachable nodes are listed in declaration order.
   *
   * An unknown system throws. When an endpoint has no owner, its authored
   * port ID remains in the schematic.
   */
  export function serviceNetworkSchematic(props: IAutoMovieServiceNetworkSchematic.IProps): IAutoMovieServiceSchematic {
    return serviceNetworkSchematicImplementation(props);
  }

  /**
   * Enclose a service route in one world-space box padded by its radius.
   *
   * Use an admitted route and radius in metres. One route point gives a
   * radius-padded point box. An empty route throws. Use the span bounds for
   * clash comparisons.
   */
  export function serviceSegmentBounds(segment: IAutoMovieServiceSegment): IAutoMoviePropBox {
    return serviceSegmentBoundsImplementation(segment);
  }

  /**
   * Report run pairs with overlapping radius-padded span boxes.
   *
   * Use admitted world-metre routes. Runs with no spans are skipped. Pairs
   * sharing any endpoint node are exempt along their full routes. The other
   * pairs are emitted once in segment declaration order.
   */
  export function serviceSegmentClashes(network: IAutoMovieServiceNetwork): IAutoMovieServiceClash[] {
    return serviceSegmentClashesImplementation(network);
  }

  /**
   * Return one radius-padded world-space box per consecutive route span.
   *
   * Bounds follow route order and use metre coordinates. Diagonal spans are
   * enclosed conservatively. A route with fewer than two points returns an
   * empty array.
   */
  export function serviceSegmentSpanBounds(segment: IAutoMovieServiceSegment): IAutoMoviePropBox[] {
    return serviceSegmentSpanBoundsImplementation(segment);
  }

  /**
   * Sum one system's declared demand in the system's unit.
   *
   * A to-root system counts out ports. From-root and undirected systems
   * count in ports. Zero-demand fittings contribute zero and bidirectional
   * ports contribute nothing.
   */
  export function serviceSystemLoad(props: IAutoMovieServiceSystemLoad.IProps): number {
    return serviceSystemLoadImplementation(props);
  }

  /**
   * List the nodes reachable from one system's root in declaration order.
   *
   * Walk runs forward for from-root, backward for to-root and both ways for
   * undirected flow. With closedValvesBlock enabled, a reached node whose
   * opening is zero stops traversal through itself. The default traverses
   * it.
   *
   * An unknown system throws. An unresolved root returns an empty list.
   * Supply a structurally admitted network.
   */
  export function serviceSystemReach(props: IAutoMovieServiceSystemReach.IProps): string[] {
    return serviceSystemReachImplementation(props);
  }

  /**
   * Admit a typed service network against its served built environment.
   *
   * Findings cover schema, metre units, references, port compatibility,
   * declared capacity, root reach, route and sleeve geometry, and
   * conservative interference. Space containment uses route vertices, sleeve
   * fit uses authored faces and shared-endpoint run pairs are exempt along
   * their full routes.
   *
   * Success establishes structural admission. Use validateWetZones for the
   * zone's slope, membrane and drain declarations.
   */
  export function validateServiceNetwork(props: IAutoMovieValidateServiceNetwork.IProps): IAutoMovieValidation {
    return validateServiceNetworkImplementation(props);
  }

  /**
   * Check wet-zone declarations against building boundaries and service
   * nodes.
   *
   * Upturn and slope must be finite and nonnegative. Wet and immersed zones
   * require full membrane coverage, positive declared slope and a drain.
   * Thresholds cover handovers to a lower grade, and each cited drain must
   * stand in the zone and declare outgoing waste-water.
   *
   * The check uses authored scalars for upturn and slope. Distinct
   * declaration errors retain their field paths.
   */
  export function validateWetZones(props: IAutoMovieValidateWetZones.IProps): IAutoMovieValidation {
    return validateWetZonesImplementation(props);
  }
}
