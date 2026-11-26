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
   * Lower one service network to the models and staged pieces that draw it.
   *
   * A run is authored as a centre line and a radius, which is the description a
   * clash and a sleeve are measured against; drawing it is the deterministic
   * derivation of that description and nothing more. Sweeping a regular polygon
   * section along the authored line with `meshAutoMovieSweep`, one smooth-shaded
   * ring per route point and both ends capped, is therefore the whole of it: no
   * fitting library, no elbow catalogue, no per-discipline appearance. A
   * production that wants a modelled valve body authors that prop and places it
   * on the node, exactly as it would author any other asset.
   *
   * The geometry is baked in world coordinates, matching how a connector's route
   * and a support surface are already authored, so the staged piece carries no
   * rotation and no scale of its own and a run cannot drift from the line the
   * validator measured.
   *
   * Refuses to draw an invalid network. Lowering a graph with a dangling port or
   * a clash would put a picture of a working installation in front of the reason
   * it does not work, which is the one thing this record exists to prevent. No
   * current production consumer calls this lowering; service render tests
   * exercise the emitted contribution. Sides are unbounded apart from integer
   * admission, so caller-selected resolution controls allocation size.
   */
  export function lowerServiceNetwork(props: IAutoMovieLowerServiceNetwork.IProps): IAutoMovieSubjectContribution {
    return lowerServiceNetworkImplementation(props);
  }

  /**
   * Compose a wet zone's plumbing into an independent fluid domain.
   *
   * This is the seam that keeps one model of moving water. The service graph
   * states where water is delivered and where it is taken away; the shallow-water
   * domain states how it then moves. Rather than inventing a second, weaker
   * account of flow inside the building record, the zone's supply ports become
   * the domain's declared sources and its drains become the domain's declared
   * drains, at the lattice cells they actually stand over. A basin that fills,
   * overflows and empties is then the fluid solver's ordinary business, and its
   * mass ledger is the same one every other domain is checked with.
   *
   * The sill of a derived drain is the bed elevation of its own cell, which is
   * what a plain floor gully is: it opens the moment water stands on the floor
   * above it. A weir with a raised sill is a different fixture and is authored on
   * the domain directly.
   *
   * Every supply inlet in the room becomes a source, including the inlet of a
   * fitting that merely passes the medium on. That is not a double count: such a
   * fitting declares `0`, so it lowers to a source that delivers nothing, and the
   * water is counted once where it is actually drawn. Dropping those inlets by
   * node kind would instead make `kind` decide a hydraulic quantity the port's
   * own `demand` already states.
   *
   * The network is expected to have been validated already; this lowering answers
   * only for the placement it performs, not for the graph it reads. Selected
   * plumbing inlet system and port units must both be cubic-meter-per-second;
   * other units throw because network admission permits nonvolumetric "other"
   * media, while this seam performs no physical unit conversion.
   *
   * Refuses rather than repairs. An unknown zone, an unknown drain node, a node
   * standing off the lattice and a derived id that collides with an authored one
   * each raise, because every one of them would otherwise produce a domain that
   * silently conserves the wrong amount of water. The returned domain shares
   * unchanged grid, bed and authored entry records; only source/drain arrays and
   * derived entries are new. There is currently no production caller for this
   * composition, only service drainage tests.
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
   * Squared distance from a point to a run's centre line, in square metres.
   *
   * Squared because every caller compares it against a squared radius, and taking
   * the root first would only add a rounding step to a comparison that does not
   * need one. Fewer than two route points return infinity. Direct products assume
   * finite representable spans and residuals; extreme coordinate squares can
   * overflow or underflow and this query is not a certified separation bound.
   */
  export function routeDistanceSquared(segment: IAutoMovieServiceSegment, point: IAutoMovieVector3): number {
    return routeDistanceSquaredImplementation(segment, point);
  }

  /**
   * Sum consecutive 3D centre-line lengths in metres; fewer than two points yield
   * zero. Finite represented differences and total are the caller's premise.
   */
  export function routeLength(segment: IAutoMovieServiceSegment): number {
    return routeLengthImplementation(segment);
  }

  /**
   * State plainly which analyses this network and this building can answer.
   *
   * A record existing is not an analysis, and the honest way to say so is to say
   * so. The structural rules below are the ones the engine really performs; the
   * per-discipline entries are the quantitative questions nothing here solves,
   * listed once for each discipline the network actually declares so a report
   * names the missing solver rather than implying a pass.
   *
   * The building is required rather than optional because two of these answers
   * depend on it. A crossing is read off logical space volumes, so a building
   * whose partitions are names with no cells cannot be asked where a run left a
   * room; a sleeve is placed on its boundary's own face, so a boundary written
   * before faces existed cannot be asked where its holes are. Saying `supported`
   * in either case would be the dressing-up this report exists to prevent. This
   * is capability metadata, not a record that validation ran. No current
   * production report consumes these rows; topology tests exercise their
   * wording.
   */
  export function serviceAnalysisSupport(props: IAutoMovieServiceAnalysisSupport.IProps): IAutoMovieServiceCheckReport[] {
    return serviceAnalysisSupportImplementation(props);
  }

  /**
   * Which nodes' maintenance envelopes a world volume intrudes on.
   *
   * This is the seam a prop, a piece of furniture or a second discipline is
   * compared through: hand it any axis-aligned world box — a staged prop's
   * occupancy bound, for instance — and it names the equipment that could no
   * longer be serviced. Contact alone is not intrusion, so a cabinet standing
   * exactly on the edge of an access zone is left alone. World metre boxes are
   * expected to be admitted. This query currently has no product caller and is
   * exercised only by service geometry tests.
   */
  export function serviceEnvelopeObstructions(props: IAutoMovieServiceEnvelopeObstructions.IProps): string[] {
    return serviceEnvelopeObstructionsImplementation(props);
  }

  /**
   * The world keep-out volume a node needs to be serviced, or `null`.
   *
   * The authored box is node-local so that moving the equipment moves the space
   * it is opened in; a world box authored beside a world position would let the
   * two drift apart with no way to tell which one was meant. No rotation or scale
   * is applied; the source node has only world position.
   */
  export function serviceMaintenanceBounds(node: IAutoMovieServiceNode): IAutoMoviePropBox | null {
    return serviceMaintenanceBoundsImplementation(node);
  }

  /**
   * Project one system to a plan schematic with its totals.
   *
   * Lengths are measured on the authored 3D centre line and only the drawing is
   * flattened, so a riser does not silently become a point of zero pipe. Demand
   * is the system's own declared load, read in the direction the system flows by
   * {@link serviceSystemLoad}, so a drainage stack reports what it carries rather
   * than the zero a supply-shaped reading would give it. This report has no
   * current product caller. An unknown system throws and a missing endpoint owner
   * remains the authored port id; validation is separate.
   */
  export function serviceNetworkSchematic(props: IAutoMovieServiceNetworkSchematic.IProps): IAutoMovieServiceSchematic {
    return serviceNetworkSchematicImplementation(props);
  }

  /**
   * The single world volume a whole run is contained by.
   *
   * This is the broad-phase companion to {@link serviceSegmentSpanBounds}: one box
   * a caller can index, cull or draw a bounding volume from without walking every
   * leg. Interference is decided on the spans, never on this. Coordinates and
   * radius use metres and must already be admitted; empty routes throw, while a
   * singleton gives its radius-padded point box. No live product caller currently
   * consumes this broad-phase query.
   */
  export function serviceSegmentBounds(segment: IAutoMovieServiceSegment): IAutoMoviePropBox {
    return serviceSegmentBoundsImplementation(segment);
  }

  /**
   * Every pair of runs whose occupied volumes overlap.
   *
   * Two runs that share any endpoint node are exempt as a whole pair: the query
   * does not restrict that exemption to a neighbourhood of the fitting, so a
   * second overlap farther along those same runs is currently unreported. Every
   * other pair is a clash whether or not the two belong to the same discipline,
   * because a duct and a cable tray cannot share a cubic metre any more than two
   * ducts can.
   */
  export function serviceSegmentClashes(network: IAutoMovieServiceNetwork): IAutoMovieServiceClash[] {
    return serviceSegmentClashesImplementation(network);
  }

  /**
   * The world volume one run occupies, span by span.
   *
   * Each straight leg of the centre line gets its own box grown by the run's
   * radius, because one box around a whole polyline is not a pipe: a run that
   * drops, turns and crosses a building would claim the entire cuboid those three
   * legs span and clash with everything inside it. Per-span boxes stay tight on
   * orthogonal routing, which is how distribution is actually run, and remain
   * conservative on a diagonal — a bias that reports a near miss rather than
   * missing a real interference.
   *
   * A route with fewer than two points has no span and yields nothing to compare;
   * the validator refuses that route on its own path.
   */
  export function serviceSegmentSpanBounds(segment: IAutoMovieServiceSegment): IAutoMoviePropBox[] {
    return serviceSegmentSpanBoundsImplementation(segment);
  }

  /**
   * Total demand one system is declared to carry, in the system's own unit.
   *
   * The load is read at the ports facing **opposite to the root**, because that
   * is the end a system is loaded from. A supply main, a lighting circuit and a
   * supply air trunk are loaded by what their `in` ports draw; a drainage stack,
   * a return riser and an exhaust are loaded by what their `out` ports discharge.
   * Summing `in` ports for every system would leave every `to-root` system
   * measured against a load of zero — a capacity check that cannot fail is worse
   * than none, because it reads as one that passed.
   *
   * A fitting merely passing the medium on — a tee, a valve, a damper — declares
   * `0` and contributes nothing, so the water that reaches a basin through a
   * shut-off is counted where the basin draws it and not again at the valve. A
   * `bidirectional` port is counted at neither end: it is the fitting on a ring
   * that may be fed from either side, and a tap's draw is stated on the port that
   * draws it rather than on the ring it hangs off.
   *
   * This is a declaration check and nothing more. No diversity, no simultaneity
   * and no head loss enter it; `serviceAnalysisSupport` names the solver that
   * would as `unsupported`.
   */
  export function serviceSystemLoad(props: IAutoMovieServiceSystemLoad.IProps): number {
    return serviceSystemLoadImplementation(props);
  }

  /**
   * Which nodes one system's root actually reaches.
   *
   * Reachability is what separates a drawn network from a working one, and its
   * direction is the system's own: a supply main is walked forward from the root,
   * a drainage stack backward into it, a ring either way. The answer is returned
   * in declaration order so two runs of the same design produce the same list.
   *
   * `closedValvesBlock` is the difference between the design question and the
   * operating one. Left off — the default — an isolating valve is walked straight
   * through, because a valve someone happened to shut is not a design defect.
   * Set, a node whose state passes nothing stops the walk at itself: it is still
   * reached, everything beyond it is not, and that is how a shut-off is shown to
   * isolate what it was installed to isolate.
   *
   * A system whose root does not resolve reaches nothing rather than reaching a
   * name; the validator owns reporting the dangling root itself. An unknown
   * system id throws. Nodes, ports and segment references must already be
   * structurally admitted; the queue walk is not an arbitrary-JSON gate.
   */
  export function serviceSystemReach(props: IAutoMovieServiceSystemReach.IProps): string[] {
    return serviceSystemReachImplementation(props);
  }

  /**
   * Admit a typed distribution network against its served built environment.
   * Vocabulary, references, units, port directions, declared capacity and root
   * reach are checked before conservative run/maintenance interference. Findings
   * retain declaration order and authored values; success is structural
   * admission, not hydraulic pressure, electrical loss or discipline-performance
   * proof.
   *
   * Logical-space containment is sampled at route vertices rather than
   * continuously along each leg. Shared-endpoint run pairs are entirely exempt
   * from clash comparison, so a second overlap along those same runs is currently
   * omitted. Sleeve fit uses the authored boundary face when present; missing
   * geometry is outside that fit check's applicability rather than a
   * reconstructed wall.
   */
  export function validateServiceNetwork(props: IAutoMovieValidateServiceNetwork.IProps): IAutoMovieValidation {
    return validateServiceNetworkImplementation(props);
  }

  /**
   * Validate the wet and waterproofed regions a network declares.
   *
   * This is the half of building services a frame is worst at showing. A tiled
   * room with a gully in it renders identically whether the membrane reaches the
   * walls or stops at the screed, whether the floor falls toward the gully or
   * away from it, and whether the sleeve carrying a pipe through the tanking was
   * made good. Those are the facts a leak is found in, so they are stated and
   * checked here rather than inferred from a look.
   *
   * The zone owns no geometry of its own on purpose. Its extent is the
   * architecture's logical space, its membrane is that space's own boundaries,
   * and its drains are the service network's nodes, so a zone can disagree with
   * neither. What it adds is the obligations those three cannot state alone: that
   * a wet region is covered everywhere water can reach, that every handover to a
   * drier region is declared, that the floor actually falls, and that it falls to
   * a drain that really discharges waste. Slope and membrane upturn are declared
   * scalars; this gate does not measure an actual floor gradient or infer
   * waterproof construction from mesh geometry.
   */
  export function validateWetZones(props: IAutoMovieValidateWetZones.IProps): IAutoMovieValidation {
    return validateWetZonesImplementation(props);
  }
}
