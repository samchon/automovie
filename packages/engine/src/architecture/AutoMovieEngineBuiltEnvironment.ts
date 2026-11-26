import { type IAutoMovieBoundaryWallCut, type IAutoMovieBuiltEnvironment, type IAutoMovieConnectorCarriagePlacement, type IAutoMovieConnectorGeometry, type IAutoMovieConnectorSectionAt, type IAutoMovieBuiltConnector, type IAutoMovieVector3, type IAutoMovieConvexSpaceCell, type IAutoMovieBuiltElement, type IAutoMovieBuiltEnvelopeCorner, type IAutoMovieBuiltEnvelopeFace, type IAutoMovieBuildingObservationCensus, type IAutoMovieSubjectBox, type IAutoMovieBuiltPlacementBounds, type IAutoMovieBuiltEnvironmentPlacementBounds, type IAutoMovieBuiltPlacementOverlapResult, type IAutoMovieBuiltEnvironmentPlacementOverlap, type IAutoMovieBuiltPlacementOverlapReport, type IAutoMovieBuiltEnvironmentPlacementOverlapSweep, type IAutoMovieBuiltBoundary, type IAutoMovieBuiltPopulation, type IAutoMovieBuiltSupportResult, type IAutoMovieBuiltEnvironmentSupportStatus, type IAutoMovieBuiltSupportSweepReport, type IAutoMovieBuiltEnvironmentSupportSweep, type IAutoMovieBuiltOpening, type IAutoMovieInstanceSetDesign, type IAutoMovieOpeningPanelPlacement, type IAutoMovieOpeningSweep, type IAutoMoviePlanarPoint, type IAutoMovieViolationCollector, type IAutoMovieModel, type IAutoMovieBuiltSpace, type IAutoMovieSpaceObservationStation, type IAutoMovieSpaceShell } from "@automovie/interface";
import { builtBoundaryWallCut as builtBoundaryWallCutImplementation } from "./internal/builtBoundaryWallCut";
import { builtConnectorCarriagePlacements as builtConnectorCarriagePlacementsImplementation } from "./internal/builtConnectorCarriagePlacements";
import { builtConnectorGeometry as builtConnectorGeometryImplementation } from "./internal/builtConnectorGeometry";
import { builtConnectorSection as builtConnectorSectionImplementation } from "./internal/builtConnectorSection";
import { builtConnectorSectionAt as builtConnectorSectionAtImplementation } from "./internal/builtConnectorSectionAt";
import { builtConnectorStops as builtConnectorStopsImplementation } from "./internal/builtConnectorStops";
import { builtConvexCellVertices as builtConvexCellVerticesImplementation } from "./internal/builtConvexCellVertices";
import { builtElementSubtree as builtElementSubtreeImplementation } from "./internal/builtElementSubtree";
import { builtEnvelopeFaceCorners as builtEnvelopeFaceCornersImplementation } from "./internal/builtEnvelopeFaceCorners";
import { builtEnvironmentAdjacentSpaces as builtEnvironmentAdjacentSpacesImplementation } from "./internal/builtEnvironmentAdjacentSpaces";
import { builtEnvironmentBuildingCensus as builtEnvironmentBuildingCensusImplementation } from "./internal/builtEnvironmentBuildingCensus";
import { builtEnvironmentBuildingOfSpace as builtEnvironmentBuildingOfSpaceImplementation } from "./internal/builtEnvironmentBuildingOfSpace";
import { builtEnvironmentContainsPoint as builtEnvironmentContainsPointImplementation } from "./internal/builtEnvironmentContainsPoint";
import { builtEnvironmentDescendantSpaces as builtEnvironmentDescendantSpacesImplementation } from "./internal/builtEnvironmentDescendantSpaces";
import { builtEnvironmentElementBounds as builtEnvironmentElementBoundsImplementation } from "./internal/builtEnvironmentElementBounds";
import { builtEnvironmentElementPartBounds as builtEnvironmentElementPartBoundsImplementation } from "./internal/builtEnvironmentElementPartBounds";
import { builtEnvironmentEnvelopeCorners as builtEnvironmentEnvelopeCornersImplementation } from "./internal/builtEnvironmentEnvelopeCorners";
import { builtEnvironmentEnvelopeFaces as builtEnvironmentEnvelopeFacesImplementation } from "./internal/builtEnvironmentEnvelopeFaces";
import { builtEnvironmentPartBoxes as builtEnvironmentPartBoxesImplementation } from "./internal/builtEnvironmentPartBoxes";
import { builtEnvironmentPlacementBounds as builtEnvironmentPlacementBoundsImplementation } from "./internal/builtEnvironmentPlacementBounds";
import { builtEnvironmentPlacementOverlap as builtEnvironmentPlacementOverlapImplementation } from "./internal/builtEnvironmentPlacementOverlap";
import { builtEnvironmentPlacementOverlapSweep as builtEnvironmentPlacementOverlapSweepImplementation } from "./internal/builtEnvironmentPlacementOverlapSweep";
import { builtEnvironmentSpaceBoundaries as builtEnvironmentSpaceBoundariesImplementation } from "./internal/builtEnvironmentSpaceBoundaries";
import { builtEnvironmentSpaceConnectors as builtEnvironmentSpaceConnectorsImplementation } from "./internal/builtEnvironmentSpaceConnectors";
import { builtEnvironmentSpaceContentBounds as builtEnvironmentSpaceContentBoundsImplementation } from "./internal/builtEnvironmentSpaceContentBounds";
import { builtEnvironmentSpaceFidelity as builtEnvironmentSpaceFidelityImplementation } from "./internal/builtEnvironmentSpaceFidelity";
import { builtEnvironmentSpaceNodes as builtEnvironmentSpaceNodesImplementation } from "./internal/builtEnvironmentSpaceNodes";
import { builtEnvironmentSpacePopulations as builtEnvironmentSpacePopulationsImplementation } from "./internal/builtEnvironmentSpacePopulations";
import { builtEnvironmentSpaceSurfaces as builtEnvironmentSpaceSurfacesImplementation } from "./internal/builtEnvironmentSpaceSurfaces";
import { builtEnvironmentSupportStatus as builtEnvironmentSupportStatusImplementation } from "./internal/builtEnvironmentSupportStatus";
import { builtEnvironmentSupportSweep as builtEnvironmentSupportSweepImplementation } from "./internal/builtEnvironmentSupportSweep";
import { builtEnvironmentUnclaimedElements as builtEnvironmentUnclaimedElementsImplementation } from "./internal/builtEnvironmentUnclaimedElements";
import { builtEnvironmentWorldMatrices as builtEnvironmentWorldMatricesImplementation } from "./internal/builtEnvironmentWorldMatrices";
import { builtFootprintsOverlap as builtFootprintsOverlapImplementation } from "./internal/builtFootprintsOverlap";
import { builtInstanceSetPlacementBounds as builtInstanceSetPlacementBoundsImplementation } from "./internal/builtInstanceSetPlacementBounds";
import { builtOpeningPanelPlacements as builtOpeningPanelPlacementsImplementation } from "./internal/builtOpeningPanelPlacements";
import { builtOpeningSweepEnvelope as builtOpeningSweepEnvelopeImplementation } from "./internal/builtOpeningSweepEnvelope";
import { builtOutlineIsClosed as builtOutlineIsClosedImplementation } from "./internal/builtOutlineIsClosed";
import { builtPlacedPartBoxes as builtPlacedPartBoxesImplementation } from "./internal/builtPlacedPartBoxes";
import { builtPointBounds as builtPointBoundsImplementation } from "./internal/builtPointBounds";
import { builtSpaceContainsPoint as builtSpaceContainsPointImplementation } from "./internal/builtSpaceContainsPoint";
import { builtSpaceIsConvex as builtSpaceIsConvexImplementation } from "./internal/builtSpaceIsConvex";
import { builtSpaceObservationStations as builtSpaceObservationStationsImplementation } from "./internal/builtSpaceObservationStations";
import { builtSpaceShellVolume as builtSpaceShellVolumeImplementation } from "./internal/builtSpaceShellVolume";
import { builtSpaceStatesVolume as builtSpaceStatesVolumeImplementation } from "./internal/builtSpaceStatesVolume";
import { builtSpaceSubtree as builtSpaceSubtreeImplementation } from "./internal/builtSpaceSubtree";
import { builtSpaceVolumeBounds as builtSpaceVolumeBoundsImplementation } from "./internal/builtSpaceVolumeBounds";

/** Public operations for Auto Movie Engine Built Environment. */
export namespace AutoMovieEngineBuiltEnvironment {
  /**
   * Turn one boundary's declared face into the wall panel a mesh kernel can cut.
   *
   * This is the join that stops the declared opening and the modelled hole from
   * being two unrelated facts: the returned voids carry the architectural
   * opening's own id, so `buildAutoMovieWall` cuts the wall against the same
   * records validation held inside the face.
   *
   * The rectangular kernel receives the bounds of the shared straight
   * arc-envelope ring, which can overstate an arched opening's profile-axis
   * extent. A concave face likewise becomes its bounding panel. Distinct void
   * outlines can therefore have overlapping rectangle proxies that the kernel
   * refuses by name; callers needing curved cuts must compose the profile
   * geometry separately.
   *
   * Void positions are measured in metres from the panel's lower-left corner in
   * the face's own planar frame, voids follow record order, and an opening
   * without a profile contributes no void. Throws when the boundary does not
   * exist or declares no face.
   */
  export function boundaryWallCut(environment: IAutoMovieBuiltEnvironment, boundaryId: string): IAutoMovieBoundaryWallCut {
    return builtBoundaryWallCutImplementation(environment, boundaryId);
  }

  /**
   * Where a run's carriages stand, in world space, at one named state.
   *
   * Omitting the state answers for the state the record itself stands in, which
   * is the placement {@link lowerBuiltEnvironment} stages. Naming another one
   * answers for that state without editing the record, so a shot can ask where
   * the car would be at the top landing while the design still holds it at the
   * bottom. Naming a state applies it to every opening and run that declares a
   * state with that id, and a member without such a state stands at rest, as
   * {@link builtEnvironmentWorldMatrices} states. The space each carriage serves
   * is handed back beside its placement, because "where the car is" and "which
   * floor that is" are one answer and making a caller rejoin them invites two.
   *
   * One placement per carriage in authored order. A connector without an
   * operation answers an empty list, and `serves` is null when the state names no
   * served space for that carriage. Throws when the connector does not exist, the
   * named state is not one of its states, or a carriage's element is missing from
   * the record.
   */
  export function connectorCarriagePlacements(environment: IAutoMovieBuiltEnvironment, connectorId: string, stateId?: string): IAutoMovieConnectorCarriagePlacement[] {
    return builtConnectorCarriagePlacementsImplementation(environment, connectorId, stateId);
  }

  /**
   * Measure one connector's traversal shape: climb, run, length, slope, stations.
   *
   * A station's facing is answered as authored or as `null`, never as a heading
   * this function invented. A connector that declared no orientation has no
   * orientation, and saying so is what keeps a later analysis from reading a
   * derived guess as a design decision.
   *
   * Run is the horizontal (`x`, `z`) length of the route polyline and rise its
   * signed `y` change between the end points, both in metres; length is the 3D
   * polyline length. Stations and landings are placed by arc-length fraction, so
   * a landing on an unevenly spaced route stands where its author put it, exactly
   * as a connector section is placed. Throws when the connector does not exist or
   * its route has fewer than two points or zero length.
   */
  export function connectorGeometry(environment: IAutoMovieBuiltEnvironment, connectorId: string): IAutoMovieConnectorGeometry {
    return builtConnectorGeometryImplementation(environment, connectorId);
  }

  /**
   * The usable section of one connector record, or null when it states none.
   *
   * This is the record-addressed form {@link builtConnectorSectionAt} answers
   * through. A caller already holding the record reads it here rather than
   * resolving an id a second time, because a work carrying two connectors under
   * one id would otherwise be sectioned against whichever one was declared first,
   * a contradiction validation refuses by name and one this function has no
   * business re-deciding. The route parameter is not range-checked here; the
   * id-addressed form owns that guard.
   *
   * A connector without `sections` answers its constant `width` and
   * `clearHeight`, or null when either is absent. A varying section is read as
   * linear between the two stations bracketing the fraction. Past the last
   * station it holds that station's values, and before the first it extends the
   * first segment's line, which validation rules out by starting stations at `0`.
   * Widths and clear heights are in metres.
   */
  export function connectorSection(connector: IAutoMovieBuiltConnector, at: number): IAutoMovieConnectorSectionAt | null {
    return builtConnectorSectionImplementation(connector, at);
  }

  /**
   * The usable section of a connector at one arc-length fraction of its route.
   *
   * A constant section answers the same pair everywhere; a varying one is read as
   * the piecewise-linear function its stations describe, so a corridor that
   * narrows between two stations narrows evenly rather than in a step nothing
   * declared.
   *
   * Widths and clear heights are in metres. Throws when the connector does not
   * exist, when `at` is non-finite or outside `[0, 1]`, and when the connector
   * states no section.
   */
  export function connectorSectionAt(environment: IAutoMovieBuiltEnvironment, connectorId: string, at: number): IAutoMovieConnectorSectionAt {
    return builtConnectorSectionAtImplementation(environment, connectorId, at);
  }

  /**
   * The spaces one connector serves, in the order its own route reaches them.
   *
   * A run stops at its `from` space, at every landing in declared order, and at
   * its `to` space. Adjacency, space-connector lookup and the building census all
   * read a run's stops through this one list, so a landing counts as a stop in
   * every answer or in none. Landings are not re-sorted by `at`; validation
   * requires them in route order.
   */
  export function connectorStops(connector: IAutoMovieBuiltConnector): string[] {
    return builtConnectorStopsImplementation(connector);
  }

  /**
   * The corner points of one convex cell's own half-space intersection.
   *
   * A cell is stated as the planes that cut it rather than as the shape those
   * planes leave, so every question about where the room actually is starts by
   * solving them. Each triple of planes meets at one point when their normals are
   * independent, and the point belongs to the cell when every other plane admits
   * it. Unbounded cells simply produce fewer points, which is the honest answer
   * for a half-space that closes nothing.
   *
   * Planes are normalized first, a plane whose normal is shorter than
   * {@link ObservationGeometry.Epsilon} is ignored, a triple whose normals'
   * determinant is within that tolerance of zero yields no point, a point outside
   * any plane by more than it is dropped, and corners closer than it are merged.
   * Points are world-space in metres, in the order their first plane triple was
   * found.
   */
  export function convexCellVertices(cell: IAutoMovieConvexSpaceCell): IAutoMovieVector3[] {
    return builtConvexCellVerticesImplementation(cell);
  }

  /**
   * The ids of some elements and of every element below them through `parent`
   * links.
   *
   * The roots are always included, even when no declared element carries them, so
   * the caller decides whether an undeclared root is an error. A parent cycle in
   * an unvalidated record terminates, because each id enters the set once. The
   * set's iteration order is breadth-first discovery order from the roots in the
   * order given.
   *
   * @param elements Every element of one environment.
   * @param roots Element ids to start from.
   * @returns The roots and all their descendants.
   */
  export function elementSubtree(elements: readonly IAutoMovieBuiltElement[], roots: readonly string[]): Set<string> {
    return builtElementSubtreeImplementation(elements, roots);
  }

  /**
   * Proximity-based corner records among already placed envelope facades.
   *
   * Only non-parallel `facade` pairs of one building qualify. Vertex proximity
   * within the thicker separation plus numeric slack supplies an allowance rather
   * than proof of a shared edge. The position averages approximately nearest
   * vertex-pair midpoints; it equals a shared edge midpoint only when those pairs
   * describe its ends. Boundary ids fix pair order. The first probe-oriented
   * normal's sign toward the second centroid determines exterior/reentrant;
   * negligible direction or dot product skips an unreadable pair. Results sort by
   * id.
   *
   * {@link builtEnvironmentEnvelopeCorners} answers for a whole environment, and
   * the building census passes the faces it already placed so they are not placed
   * twice.
   */
  export function envelopeFaceCorners(faces: readonly IAutoMovieBuiltEnvelopeFace[]): IAutoMovieBuiltEnvelopeCorner[] {
    return builtEnvelopeFaceCornersImplementation(faces);
  }

  /**
   * Return spaces directly joined by a boundary or traversal connector.
   *
   * A run reaches every stop it declares, not only its two ends: a lift serving
   * four floors makes all four reachable from each other, because the floors it
   * stops at are the floors it joins. A one-way run reaches only stops further
   * along its own route.
   *
   * A shared boundary joins two spaces whether or not any opening passes through
   * it, so a closed partition still makes its rooms adjacent. Stops and boundary
   * sides are matched exactly, not through containment, so asking a storey does
   * not return what its rooms touch. Ids come back once each in discovery order,
   * boundaries first and then connectors, without sorting. Throws for an
   * undeclared space id.
   */
  export function environmentAdjacentSpaces(environment: IAutoMovieBuiltEnvironment, spaceId: string): string[] {
    return builtEnvironmentAdjacentSpacesImplementation(environment, spaceId);
  }

  /**
   * The complete observation topology of every building unit in one environment.
   *
   * This is the building aggregate a review counts against. A building is not the
   * sum of the rooms a space tree happens to index, so the census carries the
   * envelope, its corners, the openings cut through it, and the connectors that
   * cross it beside the spaces, and every one of those populations is derived
   * from the record rather than declared by whoever writes the review.
   *
   * Faces and corners are those of {@link builtEnvironmentEnvelopeFaces} and
   * {@link builtEnvironmentEnvelopeCorners} owned by the building. Entrances are
   * the openings on the building's exposed boundaries, spaces are the descendants
   * of its root that state a volume, and connectors are those stopping at any
   * descendant space, volume or not, each listed once. Every id list and the
   * census itself are sorted in code-unit order. Throws when a building's root
   * space is undeclared or an exposed face's space belongs to no building unit.
   */
  export function environmentBuildingCensus(environment: IAutoMovieBuiltEnvironment): IAutoMovieBuildingObservationCensus[] {
    return builtEnvironmentBuildingCensusImplementation(environment);
  }

  /**
   * Name the building unit that owns a logical space.
   *
   * A work holds several independently placed building units, so "which building
   * is this room in" is a real question rather than a constant. A building owns
   * its root space and every space below it, so the owner is found by walking
   * `parent` links up from the space to the first ancestor, the space itself
   * included, that some building names as its root. Validation requires every
   * building root to have no parent and every space to have exactly one owner, so
   * in a validated record that ancestor is the top of the chain and the answer is
   * unique; an unvalidated record whose building roots nest answers the nearest
   * one, and a parent cycle ends the walk without an owner.
   *
   * Throws for an undeclared space id and for a space no building unit owns, the
   * same refusal validation makes for an unowned space.
   */
  export function environmentBuildingOfSpace(environment: IAutoMovieBuiltEnvironment, spaceId: string): string {
    return builtEnvironmentBuildingOfSpaceImplementation(environment, spaceId);
  }

  /**
   * Test whether a world point lies in a logical space or any of its child
   * spaces.
   *
   * A storey contains whatever its rooms contain, at any depth. Each space of the
   * subtree is read through {@link builtSpaceContainsPoint}, its own stated volume
   * and nothing else, so a subtree that states no volume anywhere contains
   * nothing. Throws for an undeclared space id.
   */
  export function environmentContainsPoint(environment: IAutoMovieBuiltEnvironment, spaceId: string, point: IAutoMovieVector3): boolean {
    return builtEnvironmentContainsPointImplementation(environment, spaceId, point);
  }

  /**
   * Every logical space under one space, including that space itself.
   *
   * The containment fold the space queries perform, published so a caller asking
   * what a storey holds, what a building unit owns, or which rooms a derived
   * review population must charge for uses this walk instead of rewriting it,
   * because two walks over one hierarchy are two answers that eventually
   * disagree.
   *
   * Membership follows `parent` links at any depth. Sorted in code-unit order,
   * because a population is compared and printed rather than only tested for
   * membership. Throws for an undeclared space id.
   */
  export function environmentDescendantSpaces(environment: IAutoMovieBuiltEnvironment, spaceId: string): string[] {
    return builtEnvironmentDescendantSpacesImplementation(environment, spaceId);
  }

  /**
   * The world box one named element's placed geometry fills.
   *
   * The box is the union of {@link builtEnvironmentElementPartBounds}, measured at
   * the current operating state from static CPU vertices: tessellated primitives
   * and stated meshes. Placement resolution shares that part query directly
   * through its body resolver; this function is the element-specific union entry
   * point.
   *
   * `null` has two ordinary readings, and neither is a fault. An id this record
   * never declared resolves to nothing, because the caller is usually resolving a
   * locator that project source authored and an unresolved locator is a finding
   * for that caller to report rather than an engine refusal, which is why this
   * answers `null` where the space queries such as
   * {@link builtEnvironmentSpaceContentBounds} throw. A transform-only element
   * draws nothing, so it has no geometry box either: a grouping node standing
   * eight metres up is not something a camera can be aimed at.
   *
   * An element citing a runtime model reference, whose bytes this record never
   * holds, or whose parts draw no vertex, answers a degenerate box at its own
   * world origin rather than nothing, because that is the place the record does
   * state.
   *
   * One call stages the whole work's transform hierarchy, because an element's
   * world matrix is its ancestors' product. A caller resolving many elements of
   * one environment reads {@link builtEnvironmentPartBoxes} once instead.
   *
   * These are CPU boxes of finite stated or tessellated vertices under
   * element-world and part-local TRS. Attached-bone transforms, skinning,
   * animation, loaded external geometry and GPU Float32 evaluation are outside
   * this measurement; enclosure of a rendered frame requires those extra effects
   * to be absent or separately bounded.
   */
  export function environmentElementBounds(environment: IAutoMovieBuiltEnvironment, elementId: string): IAutoMovieSubjectBox | null {
    return builtEnvironmentElementBoundsImplementation(environment, elementId);
  }

  /**
   * The world boxes one element's drawn parts fill, one per part.
   *
   * Answers the question {@link builtEnvironmentElementBounds} cannot: how much of
   * a body's box is body. A shelf is a back panel and two boards, so its union
   * box spans floor to head height and is mostly air, and anything standing on a
   * board is inside it. A caller testing whether two placed things intersect, or
   * which face one rests on, reads these boxes rather than the union. Every part
   * box lies inside the union, so a part test can only withdraw a contact the
   * union invented, and a single-part body yields exactly its union box.
   *
   * `null` for an element that was never declared and for a transform-only
   * element, which draws nothing. Boxes are world-space, one per part with at
   * least one vertex in the model's part order, measured where the environment's
   * current operating state puts the element. An element whose model the record
   * does not hold, or whose parts draw no vertex, gets one degenerate box at its
   * world origin.
   *
   * Each call stages the whole element hierarchy, so a caller measuring many
   * elements of one environment reads {@link builtEnvironmentPartBoxes} once
   * instead.
   *
   * These are CPU boxes of finite stated or tessellated vertices under
   * element-world and part-local TRS. Attached-bone transforms, skinning,
   * animation, loaded external geometry and GPU Float32 evaluation are outside
   * this measurement; enclosure of a rendered frame requires those extra effects
   * to be absent or separately bounded.
   */
  export function environmentElementPartBounds(environment: IAutoMovieBuiltEnvironment, elementId: string): IAutoMovieSubjectBox[] | null {
    return builtEnvironmentElementPartBoundsImplementation(environment, elementId);
  }

  /**
   * Every meeting of two exposed facades of one building unit.
   *
   * Facades of the same building qualify by vertex proximity within the thicker
   * separation plus numeric slack. This is an observation allowance, not a
   * construction-error proof. Exterior/reentrant classification uses the first
   * probe-oriented normal's sign toward the second centroid from the proxy
   * meeting point; it does not establish intersection or a global envelope
   * topology.
   *
   * A corner's id is `<boundary>+<boundary>` in code-unit order, its position
   * averages approximately nearest vertex-pair midpoints within the
   * wall-thickness proximity allowance, and its normal bisects the two
   * probe-oriented face normals. This proxy does not prove a shared edge or exact
   * geometric intersection. Results are sorted by id; an exposed face's unowned
   * space throws through {@link builtEnvironmentEnvelopeFaces}.
   */
  export function environmentEnvelopeCorners(environment: IAutoMovieBuiltEnvironment): IAutoMovieBuiltEnvelopeCorner[] {
    return builtEnvironmentEnvelopeCornersImplementation(environment);
  }

  /**
   * Every exposed separation of every building unit, placed in world space.
   *
   * A face is exposed when its boundary separates exactly one declared space.
   * Each result carries placed vertices, shoelace centroid, owning building and a
   * computed normal used for roof/underside/facade classification. Authored +Z
   * flips only if the positive-offset centroid probe is inside the space; the
   * opposite side is not tested. Off-volume faces, concave outlines and numerical
   * limitations preclude a general outward-orientation certificate. Results sort
   * by boundary id in code-unit order.
   *
   * Throws when an exposed face's space belongs to no building unit, which
   * validation refuses.
   */
  export function environmentEnvelopeFaces(environment: IAutoMovieBuiltEnvironment): IAutoMovieBuiltEnvelopeFace[] {
    return builtEnvironmentEnvelopeFacesImplementation(environment);
  }

  /**
   * Every drawn element's part boxes, resolved in one pass over the record.
   *
   * {@link builtEnvironmentElementPartBounds} stages the whole tree per element
   * query. This batch stages once and indexes models once, then measures each
   * element with the same shared part fold. Answers agree with the single-element
   * query for validated unique element/model ids; forged duplicate model ids
   * differ because the batch map selects the last model while find selects the
   * first.
   *
   * Transform-only elements are absent, matching the single-element query's null
   * answer; body resolution consequently reports them unresolved. A model-bearing
   * element with no available vertices instead receives the shared world-origin
   * point fallback.
   *
   * Keys follow element declaration order. World boxes use current operating
   * states, and the returned map is a snapshot that does not follow later edits.
   */
  export function environmentPartBoxes(environment: IAutoMovieBuiltEnvironment): Map<string, IAutoMovieSubjectBox[]> {
    return builtEnvironmentPartBoxesImplementation(environment);
  }

  /**
   * Resolve one building element or compact population to its current world box.
   *
   * An environment-owned element is measured as the union of the part boxes its
   * spatial queries use, so this is not a second answer to "where does it stand".
   * A compact population delegates to its one placement-bounds fold, is never
   * expanded here, and throws for an `along-route` layout.
   *
   * A missing identity or a transform-only group answers `null`, because neither
   * states a place a body occupies. An element the record locates but carries no
   * vertices for, a runtime model reference or a model with no parts, resolves to
   * the single world origin the record does state, and says so with the
   * `element-origin-point` basis rather than passing a point off as geometry. The
   * caller keeps the position it asked for, and every overlap or gap taken from
   * that box carries the label that says it measured no volume.
   *
   * The point basis is selected by equal box corners and can also describe
   * genuine degenerate geometry; it does not independently prove that the model's
   * vertices were absent.
   *
   * These are CPU boxes of finite stated or tessellated vertices under
   * element-world and part-local TRS. Attached-bone transforms, skinning,
   * animation, loaded external geometry and GPU Float32 evaluation are outside
   * this measurement; enclosure of a rendered frame requires those extra effects
   * to be absent or separately bounded.
   */
  export function environmentPlacementBounds(props: IAutoMovieBuiltEnvironmentPlacementBounds.IProps): IAutoMovieBuiltPlacementBounds | null {
    return builtEnvironmentPlacementBoundsImplementation(props);
  }

  /**
   * Test two named building bodies with the placement kernel's AABB overlap rule.
   *
   * The comparison delegates to {@link propBoundsOverlap}. For positive extents,
   * exact face contact is excluded; a zero-width plane or point strictly inside
   * another box can still pass its strict endpoint comparisons. Population
   * operands stay compact and each operand's basis identifies measured bounds
   * versus an extent-free fallback point.
   *
   * An element operand is tested part by part because a multi-part body's union
   * box can include gaps; a population keeps its one reported box. A missing
   * operand makes the status `unresolved`, is listed by side in left-then-right
   * order, and leaves its basis `null`.
   *
   * Parts are axis-aligned CPU box proxies, not mesh solids. Positive overlap can
   * over-admit actual geometry, and a population box can also include gaps
   * between members; `overlapping` is a bounds finding under those premises.
   */
  export function environmentPlacementOverlap(props: IAutoMovieBuiltEnvironmentPlacementOverlap.IProps): IAutoMovieBuiltPlacementOverlapResult {
    return builtEnvironmentPlacementOverlapImplementation(props);
  }

  /**
   * Find positive-volume intersections of placed bodies' axis-aligned part-box
   * proxies.
   *
   * Resolves each body from one building-wide part table, sorts lower x corners,
   * then sweeps an active list. The broad phase avoids narrow-phase work for
   * disjoint union boxes; compared counts active candidate comparisons and is not
   * a full operation or timing measurement.
   *
   * Exact box-face contact is excluded by {@link propBoundsOverlap}. Positive
   * overlap is a bounds finding, not proof of mesh interpenetration: part boxes
   * include empty space, and a population envelope includes gaps between members.
   * Volume and fraction grade these proxies, not occupied material.
   *
   * Every element and population is a body, elements first in declaration order.
   * A pair whose union boxes meet is confirmed part against part and reported,
   * left being the earlier body, with its summed shared part volume in cubic
   * metres and that volume's share of the smaller body's summed part volume,
   * clamped to `1` because two parts of one body may themselves meet. Pairs are
   * sorted by share and then by volume, both descending. `measured` counts
   * resolved bodies and `unresolved` lists the rest in body order. A population
   * with an `along-route` layout makes the placement fold throw.
   */
  export function environmentPlacementOverlapSweep(props: IAutoMovieBuiltEnvironmentPlacementOverlapSweep.IProps): IAutoMovieBuiltPlacementOverlapReport {
    return builtEnvironmentPlacementOverlapSweepImplementation(props);
  }

  /**
   * Return every boundary that encloses or separates a logical space.
   *
   * {@link builtEnvironmentAdjacentSpaces} keeps only the far-side space ids,
   * which answers which rooms are next to this one and discards what stands
   * between them: the boundary's identity, its `kind`, and the elements realizing
   * it. This answers with what, as {@link builtEnvironmentSpaceConnectors} does
   * for traversal. A slab between two storeys belongs to neither room alone, so a
   * room whose ceiling is owned by its storey reads like a room with no ceiling
   * unless its enclosure can be asked directly.
   *
   * Matched exactly rather than through containment, the rule adjacency and
   * connector lookup follow: asking a storey returns the storey's own enclosure
   * and not every partition standing inside its rooms. Boundaries are handed back
   * whole, because `kind` distinguishes a ceiling from a wall and `elements` says
   * whether anything visible realizes it; a boundary with an empty `elements` is
   * a separation the design declares and nothing builds.
   *
   * The returned boundaries are the record's own objects in record order, not
   * copies. Throws for an undeclared space id.
   */
  export function environmentSpaceBoundaries(environment: IAutoMovieBuiltEnvironment, spaceId: string): IAutoMovieBuiltBoundary[] {
    return builtEnvironmentSpaceBoundariesImplementation(environment, spaceId);
  }

  /**
   * Return every connector stopping at a logical space, endpoints and route
   * intact.
   *
   * Adjacency answers which spaces are reachable; this answers with what. The
   * authored 3D centre route is handed back as written rather than reduced to a
   * pair of ids, because a stair's rise and a bridge's span are the part a shot
   * stages and a later pathfinder would have to re-derive.
   *
   * Stops are matched exactly, not through containment: a connector declares the
   * spaces it actually lands in, its two ends and any landing between them, so
   * asking a building root returns the connectors declared on the root itself
   * rather than every connector inside it. That is the rule
   * {@link builtEnvironmentAdjacentSpaces} follows, and both read stops from one
   * list.
   *
   * The returned connectors are the record's own objects in record order. Throws
   * for an undeclared space id.
   */
  export function environmentSpaceConnectors(environment: IAutoMovieBuiltEnvironment, spaceId: string): IAutoMovieBuiltConnector[] {
    return builtEnvironmentSpaceConnectorsImplementation(environment, spaceId);
  }

  /**
   * The world box the contents of a logical space and its descendants fill.
   *
   * Declared room volume and placed contents answer different questions. This
   * query folds content proxies for framing or inspection; it does not replace
   * the room's stated volume or prove that a chosen camera pose is inside the
   * room or has an unobstructed view.
   *
   * What is measured is exactly what {@link builtEnvironmentSpaceNodes} names: the
   * staged elements that draw a model and the compact populations of this space
   * and every space below it. Each element is measured by the same part boxes as
   * {@link builtEnvironmentElementPartBounds}, where the environment's current
   * operating state puts it, which is where {@link lowerBuiltEnvironment} stages
   * it, so a leaf authored open widens the box by the leaf where it actually
   * rests.
   *
   * A population widens this box. It contributes through
   * {@link builtInstanceSetPlacementBounds}, which measures the region its
   * declared placement law spans after folding the population's authored
   * prototype-local box through every scale and rotation that law permits, and
   * throws for an `along-route` layout. The building cannot inspect the model's
   * mesh, so the local box is the explicit geometry fact that keeps a one-member
   * table from collapsing to its origin.
   *
   * An element citing a runtime model reference, whose bytes this record never
   * holds, contributes its own world origin rather than nothing, exactly as one
   * whose parts draw no vertices does. A space furnished entirely by referenced
   * models therefore still reports where its content stands, and the horizontal
   * degeneracy is deliberate: a width the record never stated is a number that
   * would frame geometry nobody wrote down.
   *
   * `null` is a space with nothing placed in it at any depth. That is an ordinary
   * answer, not a fault: an undressed room and a purely semantic container ("the
   * west wing") are both legitimately empty, so refusing would make every caller
   * guard a normal case. An undeclared space id throws, because that is the
   * caller's own mistake. A degenerate box would be worse than null, because
   * nothing distinguishes it from one real element standing at the origin.
   *
   * These are CPU boxes of finite stated or tessellated vertices under
   * element-world and part-local TRS. Attached-bone transforms, skinning,
   * animation, loaded external geometry and GPU Float32 evaluation are outside
   * this measurement; enclosure of a rendered frame requires those extra effects
   * to be absent or separately bounded.
   */
  export function environmentSpaceContentBounds(environment: IAutoMovieBuiltEnvironment, spaceId: string): IAutoMovieSubjectBox | null {
    return builtEnvironmentSpaceContentBoundsImplementation(environment, spaceId);
  }

  /**
   * What a logical space's own volume claims to be, folded over its descendants.
   *
   * `"unstated"` is a subtree in which no space states a volume, `"faceted"` is a
   * subtree where at least one stated volume declares itself an approximation of
   * a curved region, and `"exact"` is everything else. Folding matters because a
   * storey holding one vaulted hall is a storey whose measured volume is a facet
   * count: the approximation does not stop at the space that declared it. A space
   * that states no volume does not count toward `"faceted"` even when it sets
   * `fidelity`.
   *
   * The result folds authored metadata; it neither detects curvature nor
   * certifies geometric or numerical accuracy. An omitted fidelity defaults to
   * the exact claim, even if the author used facets to approximate a curve.
   * Authors must declare that approximation as `"faceted"`.
   *
   * Contents do not enter the fold. The subtree matches
   * {@link builtEnvironmentContainsPoint}, so callers can read the contributing
   * volumes' authored fidelity beside containment without treating it as a
   * numerical error bound. Throws for an undeclared space id.
   */
  export function environmentSpaceFidelity(environment: IAutoMovieBuiltEnvironment, spaceId: string): "exact" | "faceted" | "unstated" {
    return builtEnvironmentSpaceFidelityImplementation(environment, spaceId);
  }

  /**
   * Name what is staged in a logical space and its descendants.
   *
   * This is the join that keeps the visible model and the semantic partition from
   * drifting apart: a room can be asked what is visibly inside it without a
   * second traversal that could answer differently.
   *
   * Two spellings come back, in this order, because two things are staged. An
   * element contributes exactly the `node` id {@link lowerBuiltEnvironment} emits
   * for it, `<environment>/<element>`. A population contributes
   * `instance-set:<set>`, the one owner id the render inventory and the semantic
   * mask already address a whole population by, because lowering emits it as one
   * compact set and not as `count` nodes. Naming the population rather than its
   * members is the difference between an answer and an unbounded expansion: one
   * authored field of roof slate is 2,392 members, and a query a reviewer calls
   * in a loop may not hand back 2,392 strings to say "there is slate here".
   * {@link builtEnvironmentSpacePopulations} hands back the sets themselves for a
   * caller that wants the placement law. Regeneration names a procedural member
   * `instance:<set>:slot:<six-digit-index>` and an explicit member
   * `instance:<set>:<transform-id>`, exactly as the production materializer
   * does.
   *
   * Membership is the authored `space` field folded through the space tree.
   * Transform-only elements are left out because they draw nothing. Each group
   * keeps record order. Throws an `Error` for an undeclared space id.
   *
   * @param environment Building record to read.
   * @param spaceId Logical space whose staged contents are named.
   * @returns Element node ids, then population owner ids.
   */
  export function environmentSpaceNodes(environment: IAutoMovieBuiltEnvironment, spaceId: string): string[] {
    return builtEnvironmentSpaceNodesImplementation(environment, spaceId);
  }

  /**
   * Report the compact populations standing in a logical space and its
   * descendants.
   *
   * {@link builtEnvironmentSpaceNodes} returns owner ids; this returns the
   * population records so callers can regenerate member transforms from the
   * renderer's declared placement law. Selection uses the authored space field
   * and its ancestors, independent of member positions. That semantic ownership
   * can include members intentionally crossing a geometric boundary and does not
   * imply every member lies in the space's stated volume.
   *
   * The records are the environment's own objects in record order. Throws an
   * `Error` for an undeclared space id.
   *
   * @param environment Building record to read.
   * @param spaceId Logical space whose populations are reported.
   * @returns The population records the space or a descendant declares.
   */
  export function environmentSpacePopulations(environment: IAutoMovieBuiltEnvironment, spaceId: string): IAutoMovieBuiltPopulation[] {
    return builtEnvironmentSpacePopulationsImplementation(environment, spaceId);
  }

  /**
   * Report the support patches usable in a logical space and its descendants.
   *
   * Support and walkability are separate facts: a roof deck may carry a prop
   * without being somewhere a performer may walk. Both are answered by the stable
   * surface id the lowered stage space also cites, so a caller never has to match
   * geometry to learn which patch it is holding.
   *
   * Each entry names the space that owns the patch, which may be a descendant of
   * the asked space, the patch's surface id, and whether the record lists that id
   * as walkable; entries come back in the record's surface order. Throws an
   * `Error` for an undeclared space id.
   *
   * @param environment Building record to read.
   * @param spaceId Logical space whose support patches are reported.
   * @returns One entry per patch the space or a descendant owns.
   */
  export function environmentSpaceSurfaces(environment: IAutoMovieBuiltEnvironment, spaceId: string): Array<{ space: string; surface: string; walkable: boolean }> {
    return builtEnvironmentSpaceSurfacesImplementation(environment, spaceId);
  }

  /**
   * Classify one project-authored bearing or suspension relation.
   *
   * Bearing delegates to the prop placement kernel's two-sided footprint probes,
   * so a small plinth under a wide member and a small member on a wide slab are
   * the same measurement rather than two near-copies. A suspension is accepted
   * only after both named sides resolve. The query is a deterministic visual
   * placement check, not a structural load or safety analysis.
   *
   * A negative or non-finite tolerance throws a `RangeError` rather than
   * resolving to a default, because it does not narrow or widen what "touching"
   * means, it withdraws the meaning: every distance would be outside a negative
   * band, so the answer would be a confident `floating` or `sunk` for a member
   * that rests exactly. An omitted tolerance is `AUTOMOVIE_SUPPORT_TOLERANCE`,
   * `1e-9` metres.
   *
   * Both bases travel with the verdict. A subject the record carries no vertices
   * for is probed as its stated origin, so its gap is measured from that point
   * rather than from an underside nobody declared, and `element-origin-point` is
   * how the caller reads a `floating` answer as "the origin sits this high"
   * instead of "this member hangs in the air".
   *
   * A support surface bears on its footprint polygon and height rule, and one
   * whose footprint encloses no area does not resolve. A support body bears on
   * the top of the drawn part nearest the subject's underside among the parts its
   * footprint covers; a subject over none of the parts is measured against one of
   * them, which answers `not-over-support`, because the body's union box would
   * claim the subject stands over a notch or the air beside a shelf. `gap` is the
   * signed metre distance from that face to the subject's underside, null when
   * unresolved, suspended, or not over the support, and `unresolved` names each
   * side that did not resolve.
   *
   * The delegated gap uses finite footprint and ring-corner probes. Thin overlaps
   * or deeper relief between probes can be missed; box proxies and a resting
   * verdict do not certify continuous mesh contact.
   *
   * @param props.environment Building record holding both sides.
   * @param props.query The subject, the claimed support, the relation kind and an
   *   optional tolerance.
   * @returns The verdict, the signed gap, the unresolved sides and both bases.
   */
  export function environmentSupportStatus(props: IAutoMovieBuiltEnvironmentSupportStatus.IProps): IAutoMovieBuiltSupportResult {
    return builtEnvironmentSupportStatusImplementation(props);
  }

  /**
   * Find every placed body in a building with clear air under it.
   *
   * The requirement this answers asks for two capabilities in one sentence:
   * express what supports what, and find the floating or disconnected elements.
   * {@link builtEnvironmentSupportStatus} is the first and cannot be the second,
   * because it judges a relation the author already named, and an oriel window
   * nobody suspected is a query nobody wrote. This sweeps the record instead and
   * needs no declaration at all.
   *
   * Reports a measurement rather than an authored support relation. For each
   * non-grounded body it chooses the highest candidate part-box top no higher
   * than underside plus tolerance with an overlapping footprint, then reports
   * signed clearance and owner. This identifies the nearest admitted proxy, not a
   * proven physical support.
   *
   * Candidate part boxes avoid treating a multi-part support's entire union as
   * material: a shelf board can support a subject below the shelf back's highest
   * point. The subject still uses its union box, so a notch or gap in its
   * footprint remains outside this approximation's ability to distinguish.
   *
   * Every element and population is a body. An underside at or below `groundY +
   * tolerance` is grounded, including bodies below the ground plane. Candidate
   * tops may reach tolerance above the underside; the first footprint overlap
   * yields a signed clearance, and clearance no greater than tolerance is borne.
   * Other bodies are floating. The subject's union footprint can bridge notches,
   * and candidate part boxes can include empty space, so these are proxy
   * classifications rather than mesh-contact certificates. `groundY` defaults to
   * zero, and the point basis accompanies degenerate bounds.
   *
   * Throws a `RangeError` when the tolerance is negative or non-finite, or
   * `groundY` is not finite. `measured` counts resolved bodies, `compared` the
   * candidate parts examined, and `unresolved` lists the bodies that occupy no
   * place.
   *
   * @param props.environment Building record to sweep.
   * @param props.groundY World height a body may rest on directly, in metres.
   * @param props.tolerance Contact slack in metres; `AUTOMOVIE_SUPPORT_TOLERANCE`
   *   when omitted.
   * @returns The counts, the floating bodies and the unresolved bodies.
   */
  export function environmentSupportSweep(props: IAutoMovieBuiltEnvironmentSupportSweep.IProps): IAutoMovieBuiltSupportSweepReport {
    return builtEnvironmentSupportSweepImplementation(props);
  }

  /**
   * Hierarchy roots that carry no logical-space assignment.
   *
   * Logical-space assignment is an authored index, so an exterior wall or
   * foundation can correctly have no room assignment. This query filters only
   * `parent === null && space === null`; it does not diagnose missing
   * building-unit ownership.
   *
   * The reach path therefore belongs on the element hierarchy rather than on the
   * space tree, and that is the record's own arrangement:
   * {@link IAutoMovieBuiltEnvironment.buildings} states that ownership is total,
   * every element descending from exactly one unit's roots. A space is an index
   * over that hierarchy, so an unassigned element is not detached, only
   * unindexed.
   *
   * Building-unit root declarations can still name returned elements. Descendants
   * of these roots are intentionally absent from the result even when they also
   * have no space assignment; consumers must not read this as the complete set of
   * unassigned or unowned elements.
   *
   * A resolvable hierarchy is the precondition, which `validateBuiltEnvironment`
   * enforces by rejecting an unresolved parent and a parent cycle.
   *
   * @param environment Building record to read.
   * @returns `<environment>/<element>` node ids of every root element with no
   *   space, in record order.
   */
  export function environmentUnclaimedElements(environment: IAutoMovieBuiltEnvironment): string[] {
    return builtEnvironmentUnclaimedElementsImplementation(environment);
  }

  /**
   * The column-major world matrix of every element, displaced by its selected
   * operating state.
   *
   * The local matrix is rest transform times joint displacement; the world matrix
   * is parent world times local. Travel consequently carries descendants, and
   * {@link lowerBuiltEnvironment} and element measurements share this staging.
   *
   * Omitting stateId selects each operation's current state. A string selects
   * that name wherever declared; an operation without it, or a member without a
   * value, stays at rest. A selector chooses a name or null per operation. State
   * and value lookup preserve the first matching entry. Validated records require
   * every member value and prohibit multiple members driving one element;
   * otherwise later operation iteration overwrites a shared driven element's
   * displacement.
   *
   * Parents must resolve and be acyclic: an unresolved parent throws a TypeError
   * and a cycle or sufficiently deep chain can exhaust the call stack. Returned
   * keys are element ids, with one world matrix per id under the validated
   * unique-id premise.
   */
  export function environmentWorldMatrices(environment: IAutoMovieBuiltEnvironment, stateId?: | string
    | ((
        member: IAutoMovieBuiltOpening | IAutoMovieBuiltConnector,
      ) => string | null)): Map<string, number[]> {
    return builtEnvironmentWorldMatricesImplementation(environment, stateId);
  }

  /**
   * Whether two world boxes share plan area on the ground plane.
   *
   * Only the `x` and `z` extents are compared, because a support question asks
   * whether one body stands over another, not whether they meet in height. The
   * comparisons are strict, so two footprints that only touch along an edge or at
   * a corner share no area and answer false.
   *
   * @param left One world box, in metres.
   * @param right The other world box, in metres.
   * @returns True when the two plan rectangles overlap with positive area.
   */
  export function footprintsOverlap(left: IAutoMovieSubjectBox, right: IAutoMovieSubjectBox): boolean {
    return builtFootprintsOverlapImplementation(left, right);
  }

  /**
   * The world box one compact population and its prototype geometry occupy.
   *
   * The placement law and authored prototype-local box define an envelope. Grid
   * and lattice folds use occupied hull slots, including a short final row;
   * scatter uses its declared disk, independent of realized seed samples.
   * Prototype-box corners use fixed rotations directly, or an enclosing
   * origin-centred sphere for a varying rotation range. Explicit layouts fold the
   * first count stored transforms, while validation reads all stored transforms.
   * These envelopes may include empty space, and binary64 arithmetic is not
   * outward rounded. Visibility variation does not shrink the envelope.
   *
   * `along-route` throws an `Error`: its slots follow a production-world route,
   * and a building record carries no field that can reach one.
   * `validateBuiltEnvironment` refuses such a population outright, so this throws
   * only for a caller handing over a world set directly.
   *
   * Every other input is checked by {@link validateBuiltPopulation}, the same
   * rules the building validator applies, and the first violation is thrown as a
   * `RangeError` naming its path under `$input`. The box is world-space, in
   * metres, and inclusive.
   *
   * @param set The population's instance-set design.
   * @param prototypeBounds The prototype's model-local box, in metres.
   * @returns A new world box enclosing every member the set can place.
   */
  export function instanceSetPlacementBounds(set: IAutoMovieInstanceSetDesign, prototypeBounds: IAutoMovieBuiltPopulation["prototypeBounds"]): IAutoMovieSubjectBox {
    return builtInstanceSetPlacementBoundsImplementation(set, prototypeBounds);
  }

  /**
   * Where an opening's panels stand, in world space, at one named state.
   *
   * Omitting the state answers for the state the record itself stands in, which
   * is the placement {@link lowerBuiltEnvironment} stages. Naming another one
   * answers for that state without editing the record, so a shot can ask where
   * the leaf would be when open without a second building.
   *
   * A state is a configuration rather than a moment. A door that swings on screen
   * is a shot `objectMotions` clip over the
   * {@link IAutoMovieOpeningPanelPlacement.node} ids this answers with, so the
   * architecture record never grows a second clock beside the shot's own.
   *
   * Entries follow the opening's panel order, each with the decomposed world
   * transform of the element the panel drives and a normalized rotation. Naming a
   * state applies it to every opening and run that declares a state with that id,
   * through {@link builtEnvironmentWorldMatrices}, so an ancestor leaf of another
   * opening moves too. An opening without an operation answers an empty list.
   * Throws an `Error` when the opening does not exist, the named state is not one
   * of its states, or a panel's element is missing from the record.
   *
   * @param environment Building record holding the opening.
   * @param openingId Id of the opening whose panels are placed.
   * @param stateId Operating state to answer for; the record's own when omitted.
   * @returns One placement per panel, in panel order.
   */
  export function openingPanelPlacements(environment: IAutoMovieBuiltEnvironment, openingId: string, stateId?: string): IAutoMovieOpeningPanelPlacement[] {
    return builtOpeningPanelPlacementsImplementation(environment, openingId, stateId);
  }

  /**
   * The world volume each panel of an opening sweeps across its whole travel.
   *
   * The envelope is solved rather than sampled. Every corner of a turning leaf
   * traces `A + B cos(t) + D sin(t)` under the panel's own placement, and an
   * affine world matrix keeps that form, so each axis is a single cosine whose
   * extremes are its endpoints and the critical angles the travel actually
   * crosses. A sliding leaf is linear and reaches its extremes at its limits.
   * Nothing here judges whether a person can pass the leaf: this is the volume a
   * later clearance or collision analysis reads, not its verdict.
   *
   * The answer is per panel, and only that panel's own travel. Ancestors stand
   * where the environment's current state puts them, so an inner folding leaf is
   * measured against the outer leaf as it currently stands. That is the volume
   * this leaf sweeps from where the design has it, not the union over every
   * configuration a chain of leaves could reach between its named states. A
   * caller wanting that union asks for each state in turn and takes the hull
   * itself; inventing it here would quietly report a chain's envelope under one
   * panel's name.
   *
   * Each entry is a world-space axis-aligned box over the four corners of the
   * panel's `width` by `height` leaf, in panel order. An opening without an
   * operation answers an empty list. Throws an `Error` when the opening does not
   * exist, a panel's element is missing, or travel limits are non-finite,
   * unordered, empty, exclude rest at zero, or span more than a full revolute
   * turn plus `AUTOMOVIE_FULL_TURN_EPSILON`; these are the travel rules
   * `validateBuiltEnvironment` applies.
   *
   * @param environment Building record holding the opening.
   * @param openingId Id of the opening whose panels are swept.
   * @returns One swept box per panel, in panel order.
   */
  export function openingSweepEnvelope(environment: IAutoMovieBuiltEnvironment, openingId: string): IAutoMovieOpeningSweep[] {
    return builtOpeningSweepEnvelopeImplementation(environment, openingId);
  }

  /**
   * Whether a closed planar outline names enough distinct, finite corners,
   * reporting the first reason it does not.
   *
   * The minimum corner count differs by what the outline may carry: a straight
   * face needs three, while an outline whose edges may bulge needs only two,
   * because a full circle is two half-turn arcs and demanding a third corner
   * would outlaw a round oculus for no geometric reason. Then every coordinate
   * must be finite, each non-finite one reported at `<path>[i].<axis>`, and no
   * two consecutive corners, the closing pair included, may lie within
   * `BUILT_PLANAR_EPSILON` (1e-9 m) of each other. A failed count or a non-finite
   * corner stops before the later test, which could not be computed.
   *
   * @param outline Closed ring of corners, in metres.
   * @param least Fewest corners the outline may have.
   * @param path Violation path of the outline.
   * @param label Name of the outline in the messages.
   * @param collector Sink that receives the violations.
   * @returns True when the outline passed every check.
   */
  export function outlineIsClosed(outline: readonly IAutoMoviePlanarPoint[], least: number, path: string, label: string, collector: IAutoMovieViolationCollector): boolean {
    return builtOutlineIsClosedImplementation(outline, least, path, label, collector);
  }

  /**
   * One world box per drawn part of one placed element, in the model's part
   * order, or the element's world origin as a single degenerate box when it draws
   * no vertex.
   *
   * Each part is placed for this CPU measurement under its own transform and then
   * under the element's world matrix. The canonical geometry realizer supplies
   * primitive or bicubic vertices and borrows stated mesh vertices, retaining
   * finite partial recipe output. A part with no vertex adds no box. A model the
   * environment does not hold is `undefined`, because a runtime model reference
   * is a legal way to furnish a building whose bytes the record never carries;
   * such an element, and one whose parts draw nothing, keeps its origin so the
   * answer still says where the record put it.
   *
   * The union of the returned boxes is the element's whole world box, so the
   * per-element union query and the per-part queries read one measurement.
   *
   * These are CPU boxes of finite stated or tessellated vertices under
   * element-world and part-local TRS. Attached-bone transforms, skinning,
   * animation, loaded external geometry and GPU Float32 evaluation are outside
   * this measurement; enclosure of a rendered frame requires those extra effects
   * to be absent or separately bounded.
   */
  export function placedPartBoxes(model: IAutoMovieModel | undefined, world: number[]): IAutoMovieSubjectBox[] {
    return builtPlacedPartBoxesImplementation(model, world);
  }

  /**
   * The smallest axis-aligned box containing every given point, or null when
   * there is none.
   *
   * The corners are folded one point at a time rather than spread into
   * `Math.min`, so a list of any length, such as every vertex a space states,
   * returns a box instead of throwing a `RangeError` for too many call arguments.
   * A `NaN` coordinate propagates into the result. The box is new and shares no
   * object with the points.
   */
  export function pointBounds(points: readonly IAutoMovieVector3[]): IAutoMovieSubjectBox | null {
    return builtPointBoundsImplementation(points);
  }

  /**
   * Does one logical space's own stated volume contain a point?
   *
   * A celled space is the union of its half-space cells, a shelled space uses its
   * closed boundary, and a space with neither spelling contains nothing.
   * Descendant containment, room visibility, prop occupancy and basin containment
   * share this per-space reader.
   *
   * Boundary points are intended inside. Cell slack is 1e-9 in the plane's scale,
   * measured in metres only for unit normals. A shell is read by
   * `createAutoMovieMeshWindingQuery`: a point on a shell triangle within its
   * area-scaled slack is inside, and otherwise the winding number distinguishes
   * the outer region from inward-wound voids. Raw binary64 products and sums can
   * overflow or lose accuracy for extreme or nearly degenerate inputs; the
   * returned Boolean is not an exact containment certificate.
   *
   * @param space Logical space whose stated volume is tested.
   * @param point World point, in metres.
   * @returns True when the point lies inside or on the stated volume.
   */
  export function spaceContainsPoint(space: IAutoMovieBuiltSpace, point: IAutoMovieVector3): boolean {
    return builtSpaceContainsPointImplementation(space, point);
  }

  /**
   * Is the space's stated volume a single convex region?
   *
   * A caller deciding one rectangle against a convex region only has to test its
   * corners; against anything else the middle can fall through a notch, a void,
   * or the gap between two cells. This answers which of the two it is holding, so
   * the cheap test is taken exactly when it is exact.
   *
   * Only a celled space with exactly one cell answers true. A shell answers false
   * even when its triangles happen to bound a convex solid, and so does a space
   * that states no volume.
   *
   * @param space Logical space whose stated volume is classified.
   * @returns True only for a shell-less space with exactly one cell.
   */
  export function spaceIsConvex(space: IAutoMovieBuiltSpace): boolean {
    return builtSpaceIsConvexImplementation(space);
  }

  /**
   * The closed interior observation population one logical space owes.
   *
   * Four outward views from the interior centre and four inward views from the
   * corners of the space's own extent read the room's proportion, its junctions,
   * and the parts a single flattering angle hides. One threshold view for every
   * opening on one of the space's boundaries reads the arrival, which is the
   * observation a sweep taken from inside can never substitute for. A space that
   * states no volume is a name rather than a room and owes nothing here.
   *
   * Every returned eye passes the space's numerical containment predicate; this
   * is the stated interior-placement check, not proof of visibility or exact-real
   * containment.
   *
   * The interior candidate is the accepted volume-box centre, otherwise the first
   * enumerated cell-corner mean that passes containment. Enumeration does not
   * prove the cell closes a bounded volume. Reading height is the box floor plus
   * the lesser of {@link ObservationGeometry.EyeHeightMeters} and half box height.
   * A failed raised probe falls back to the interior candidate. Centre views aim
   * along world ±x/±z. Corner/threshold eyes try the fixed inset ladder toward
   * the anchor. Thresholds start from the profile-box centre or host-face
   * centroid at anchor height. Order is centre, corner, then opening-id-sorted
   * thresholds. Shelled spaces have no cell fallback. Missing bounds/anchor/face,
   * failed eye placement or non-finite/negligible aim yields null poses; an
   * unknown space throws.
   *
   * @param environment Building record holding the space.
   * @param spaceId Logical space to observe.
   * @returns Eight interior stations plus one per opening on the space's
   *   boundaries, or none for a volume-less space.
   */
  export function spaceObservationStations(environment: IAutoMovieBuiltEnvironment, spaceId: string): IAutoMovieSpaceObservationStation[] {
    return builtSpaceObservationStationsImplementation(environment, spaceId);
  }

  /**
   * Volume, in cubic metres, enclosed by a closed outward-wound shell.
   *
   * The divergence theorem over triangles: a sixth of the summed scalar triple
   * products. Voids subtract themselves through opposite winding. This is a
   * binary64 evaluation of the polyhedral formula, with cancellation and overflow
   * possible, especially for large coordinates far from the origin; it is not an
   * exact-arithmetic volume certificate. {@link builtEnvironmentSpaceFidelity}
   * reports the author's fidelity claim for what the facets represent.
   *
   * A shell wound inward returns the negative of its volume, and a triangle
   * naming a missing vertex is skipped, as is a trailing index group shorter than
   * three; validation refuses an open shell and an out-of-range index before this
   * is reached.
   *
   * @param shell Closed triangle shell, in metres.
   * @returns Signed enclosed volume in cubic metres, positive for outward
   *   winding.
   */
  export function spaceShellVolume(shell: IAutoMovieSpaceShell): number {
    return builtSpaceShellVolumeImplementation(shell);
  }

  /**
   * Does a logical space bound a volume at all, in either spelling?
   *
   * A space with neither spelling is a semantic name, such as "the west wing".
   * Volume-dependent prop, visibility and fluid checks distinguish it from a
   * located region; using this query keeps shelled spaces from being mistaken for
   * unlocated ones.
   *
   * Tests presence, not closure or positive volume: a space whose only cells are
   * unbounded still answers true.
   *
   * @param space Logical space to classify.
   * @returns True when the space states at least one cell or a shell.
   */
  export function spaceStatesVolume(space: IAutoMovieBuiltSpace): boolean {
    return builtSpaceStatesVolumeImplementation(space);
  }

  /**
   * The ids of one space and of every space below it through `parent` links.
   *
   * The containment fold the space queries share: a storey contains what its
   * rooms contain, at any depth. The root id is always included, even when no
   * declared space carries it, so the caller decides whether an undeclared root
   * is an error. The set's iteration order is breadth-first discovery order;
   * callers that publish the population sort it.
   */
  export function spaceSubtree(spaces: readonly IAutoMovieBuiltSpace[], root: string): Set<string> {
    return builtSpaceSubtreeImplementation(spaces, root);
  }

  /**
   * The world box one logical space's own stated volume occupies.
   *
   * Both spellings answer here so no consumer has to know which one a space used:
   * a shelled space is bounded by its own vertices and a celled space by the
   * corners its half-spaces cut. A space that states no volume, and a space whose
   * cells close nothing, report null rather than a box of the origin.
   *
   * The box is world-space in metres. Every listed shell vertex counts, used by a
   * triangle or not, and an unbounded cell contributes only the corners it has,
   * so its extent can be understated.
   *
   * @param space Logical space whose stated volume is boxed.
   * @returns A new world box, or null when the space states no corner.
   */
  export function spaceVolumeBounds(space: IAutoMovieBuiltSpace): IAutoMovieSubjectBox | null {
    return builtSpaceVolumeBoundsImplementation(space);
  }
}
