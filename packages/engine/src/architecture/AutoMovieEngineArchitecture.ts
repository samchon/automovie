import { type IAutoMoviePatternFinding, type IAutoMovieSurfacePattern, type IAutoMoviePatternPlacement, type IAutoMoviePatternInstancing, type IAutoMoviePatternInstanceTransforms, type IAutoMoviePatternPoint, type IAutoMoviePatternTexturing, type IAutoMoviePatternTextureTransforms, type IAutoMovieValidation, type IAutoMovieValidateMaterialAssembly, type IAutoMovieValidateMaterialSubstance, type IAutoMovieBuiltBoundaryIndex, type IAutoMovieBuiltEnvironment, type IAutoMovieViolationCollector, type IAutoMovieBuiltConnector, type IAutoMovieValidateBuiltConnectorOperation, type IAutoMovieValidateBuiltEnvironment, type IAutoMovieValidateBuiltOpeningOperation, type IAutoMoviePlanarPoint, type IAutoMovieBoundaryFace, type IAutoMovieBuiltPopulation, type IAutoMovieSpaceShell, type IAutoMovieTravelMotion, type IAutoMovieViolationAppendSink, type IAutoMovieValidateDesignEvidence, type IAutoMovieValidateDesignLineage, type IAutoMovieValidateDesignLineageBinding, type IAutoMovieValidateDesignLineageDerived, type IAutoMovieValidateDesignReference, type IAutoMovieDesignSourceFrame, type IAutoMovieValidateGeneratedAcquisition } from "@automovie/interface";
import { autoMoviePatternFindings as autoMoviePatternFindingsImplementation } from "./internal/autoMoviePatternFindings";
import { autoMoviePatternInstanceTransforms as autoMoviePatternInstanceTransformsImplementation } from "./internal/autoMoviePatternInstanceTransforms";
import { autoMoviePatternPolygonArea as autoMoviePatternPolygonAreaImplementation } from "./internal/autoMoviePatternPolygonArea";
import { autoMoviePatternTextureTransforms as autoMoviePatternTextureTransformsImplementation } from "./internal/autoMoviePatternTextureTransforms";
import { canonicalAutoMoviePatternPolygon as canonicalAutoMoviePatternPolygonImplementation } from "./internal/canonicalAutoMoviePatternPolygon";
import { clipAutoMoviePatternPolygon as clipAutoMoviePatternPolygonImplementation } from "./internal/clipAutoMoviePatternPolygon";
import { validateAutoMovieMaterialAssembly as validateAutoMovieMaterialAssemblyImplementation } from "./internal/validateAutoMovieMaterialAssembly";
import { validateAutoMovieMaterialSubstance as validateAutoMovieMaterialSubstanceImplementation } from "./internal/validateAutoMovieMaterialSubstance";
import { validateBuiltBoundaries as validateBuiltBoundariesImplementation } from "./internal/validateBuiltBoundaries";
import { validateBuiltBuildings as validateBuiltBuildingsImplementation } from "./internal/validateBuiltBuildings";
import { validateBuiltCarriageService as validateBuiltCarriageServiceImplementation } from "./internal/validateBuiltCarriageService";
import { validateBuiltConnectorLandings as validateBuiltConnectorLandingsImplementation } from "./internal/validateBuiltConnectorLandings";
import { validateBuiltConnectorOperation as validateBuiltConnectorOperationImplementation } from "./internal/validateBuiltConnectorOperation";
import { validateBuiltConnectorShape as validateBuiltConnectorShapeImplementation } from "./internal/validateBuiltConnectorShape";
import { validateBuiltEnvironment as validateBuiltEnvironmentImplementation } from "./internal/validateBuiltEnvironment";
import { validateBuiltOpeningOperation as validateBuiltOpeningOperationImplementation } from "./internal/validateBuiltOpeningOperation";
import { validateBuiltOpenings as validateBuiltOpeningsImplementation } from "./internal/validateBuiltOpenings";
import { validateBuiltPanelFit as validateBuiltPanelFitImplementation } from "./internal/validateBuiltPanelFit";
import { validateBuiltPopulation as validateBuiltPopulationImplementation } from "./internal/validateBuiltPopulation";
import { validateBuiltSpaces as validateBuiltSpacesImplementation } from "./internal/validateBuiltSpaces";
import { validateBuiltSpaceShell as validateBuiltSpaceShellImplementation } from "./internal/validateBuiltSpaceShell";
import { validateBuiltStagedConfigurations as validateBuiltStagedConfigurationsImplementation } from "./internal/validateBuiltStagedConfigurations";
import { validateBuiltTravelMotion as validateBuiltTravelMotionImplementation } from "./internal/validateBuiltTravelMotion";
import { validateDesignEvidence as validateDesignEvidenceImplementation } from "./internal/validateDesignEvidence";
import { validateDesignLineage as validateDesignLineageImplementation } from "./internal/validateDesignLineage";
import { validateDesignLineageBinding as validateDesignLineageBindingImplementation } from "./internal/validateDesignLineageBinding";
import { validateDesignLineageDerived as validateDesignLineageDerivedImplementation } from "./internal/validateDesignLineageDerived";
import { validateDesignReference as validateDesignReferenceImplementation } from "./internal/validateDesignReference";
import { validateDesignSourceFrame as validateDesignSourceFrameImplementation } from "./internal/validateDesignSourceFrame";
import { validateGeneratedAcquisition as validateGeneratedAcquisitionImplementation } from "./internal/validateGeneratedAcquisition";

/** Public operations for Auto Movie Engine Architecture. */
export namespace AutoMovieEngineArchitecture {
  /**
   * Measure every laid piece and every neighbouring pair against the declaration.
   *
   * Per-piece findings come first, in placement order, so a defect that belongs
   * to one piece is never buried under the pair findings its neighbours produced:
   * a `sliver` when its surviving coverage is below `minimumPiece`, and an
   * `unsupported-piece` when an exclusion punched it, because the convex
   * procedural kernel has no boolean difference to build that piece. Pair
   * findings follow for each piece against its later neighbours in placement
   * order: a `module-overlap` when the pieces interpenetrate, otherwise, within
   * the adjacency gap, a `joint-deviation` when the joint is off `joint` by more
   * than `jointTolerance`, and a `grain-break` when the grain turns by more than
   * `grainToleranceDeg`, unless that tolerance is null.
   *
   * Candidate pairs share a centre bucket or one of its eight neighbours. The
   * cell width is the largest module diagonal plus adjacency. With finite,
   * well-scaled generated convex geometry, Euclidean-near pieces fit this broad
   * phase because each lies within half its module diagonal of its centre.
   * Partners are sorted by placement index before measurement.
   *
   * The narrow phase uses the largest edge-normal projection gap, not Euclidean
   * distance. A diagonally distant pair inside neighbouring buckets can therefore
   * still report a small joint; a projection-close pair outside those buckets is
   * not tested. Findings describe this combined bucket/projection policy, not
   * exhaustive Euclidean or projection-gap neighbourhoods. Measurements use
   * clipped outlines rather than uncut module rectangles.
   *
   * @param pattern The validated declaration whose limits are applied.
   * @param placements The run's placements, in run order.
   * @returns Every quality finding, per-piece findings first.
   */
  export function patternFindings(pattern: IAutoMovieSurfacePattern, placements: readonly IAutoMoviePatternPlacement[]): IAutoMoviePatternFinding[] {
    return autoMoviePatternFindingsImplementation(pattern, placements);
  }

  /**
   * Turn whole occurrences into computed instance slots and name the ones that
   * cannot be.
   *
   * A repeated module is a GPU instance, never duplicated vertex data, so the
   * whole modules leave here as explicit full-TRS slots: the occurrence id
   * becomes the slot id, the in-plane rotation becomes a real unit quaternion
   * rather than a yaw, and the module's two face dimensions plus its thickness
   * become a per-axis scale rather than a uniform one. A prototype table, when
   * given, is indexed by the occurrence's own seeded variant, so the variation
   * the run drew is the variation the instancer draws.
   *
   * A cut piece is not an instance and is not pretended to be one. Scaling a
   * whole module down to a cut piece's bounding box would render a tile that is
   * the wrong shape and the wrong size, so cut occurrences are returned by id for
   * the caller to build as geometry.
   *
   * The prototype's local `+X` maps to the module's U extent, local `+Y` to its V
   * extent, and local `+Z` to the face normal, which is `u × v`.
   *
   * A host that folds at a corner or curves is one developed face standing on
   * several flat panels, so a zone may name its own {@link IAutoMoviePatternFacet}
   * and every zone that does not stays on {@link frame}.
   *
   * Throws when the thickness is not a finite positive number, a frame or facet
   * value is not finite, an axis is not unit length or the two axes are not
   * perpendicular within `1e-6`, a facet names a zone the run did not lay or
   * repeats one, or an occurrence's variant has no entry in `prototypes`.
   */
  export function patternInstanceTransforms(props: IAutoMoviePatternInstanceTransforms.IProps): IAutoMoviePatternInstancing {
    return autoMoviePatternInstanceTransformsImplementation(props);
  }

  /**
   * The unsigned area, in square metres, a face-local outline encloses.
   *
   * The outline closes from its last corner to its first and may wind either way.
   * With suitable finite intermediates, fewer than three corners give zero; an
   * empty ring always gives zero. Non-finite input/products can instead yield
   * `NaN` or infinity.
   *
   * @param polygon Simple outline in face-local metres.
   * @returns The absolute shoelace result; non-finite intermediates can yield
   *   `NaN` or infinity.
   */
  export function patternPolygonArea(polygon: readonly IAutoMoviePatternPoint[]): number {
    return autoMoviePatternPolygonAreaImplementation(polygon);
  }

  /**
   * Say how each laid piece samples its material, in the UV transform the PBR
   * record already carries.
   *
   * A pattern is not a texture repeat, but what a laid piece finally shows is
   * still a texture, and the way to show it is the one the material record
   * already has: an `offset`, a `scale`, and a `rotationDeg` on its texture
   * reference. Nothing new is invented here and no second texturing path is
   * opened; what this adds is the arithmetic that turns a piece's own place,
   * size, rotation, grain, and flip into that transform, so a book-matched pair
   * is a real mirrored image rather than two slabs a viewer cannot tell apart.
   *
   * The mesh UV this is applied to is a point's place inside the module rectangle
   * the occurrence was generated at, normalized: the binding this fills in is a
   * `"normalized"` coordinate source and not the `"surface-metres"` one an
   * atlas-bearing procedural surface emits, so a prototype has to be a unit
   * square by construction rather than by luck, and the binding has to say which
   * arithmetic it was written in. A whole piece therefore spans `[0, 1]` on both
   * axes, which is what a unit-square prototype gives, and a cut piece spans the
   * sub-rectangle the cut left it rather than being renormalized over its own
   * outline, because a renormalized cut piece would show the whole image squeezed
   * into the surviving sliver. The sheet is turned by the piece's own
   * {@link IAutoMoviePatternPlacement.grainDeg}, so a board whose grain runs along
   * it samples straight while a slab set across the grain samples across it.
   *
   * One call states one material's sheet. A run whose zones carry different
   * materials calls it once per material and keeps the occurrences belonging to
   * that material's zones, exactly as the prototype table is stated per call.
   *
   * At zero texture centre, the viewer/Three matrix is `diag(scale) ·
   * R(-rotationDeg) · uv + offset`: it rotates the UV column vector first, then
   * applies axis scales. Orthogonal rows admit this ideal factorization; the
   * implementation accepts their relative dot product within `1e-9` and reports
   * larger residual skew by occurrence id.
   *
   * Every placement of the run lands in exactly one of the two lists, in
   * placement order. Throws when a tile length is not a finite number above zero
   * or a face sheet's origin is not finite.
   */
  export function patternTextureTransforms(props: IAutoMoviePatternTextureTransforms.IProps): IAutoMoviePatternTexturing {
    return autoMoviePatternTextureTransformsImplementation(props);
  }

  /**
   * Canonicalize an authored face-local polygon to a counter-clockwise convex
   * outline, or throw.
   *
   * Treats the input as an unordered point set and compares hull/input counts.
   * Interior, duplicate and collinear points dropped by the hull cause refusal.
   * Authored boundary order is discarded: even a self-crossing ordering of
   * convex-position points can be accepted and reordered.
   *
   * Throws an `Error` prefixed with `label` for a non-finite corner, for fewer
   * than three non-collinear corners, and for any corner the hull drops.
   *
   * @param polygon Authored corners, in face-local metres and any winding.
   * @param label Field name the refusals start with.
   * @returns The same corners as a counter-clockwise convex outline.
   */
  export function canonicalPatternPolygon(polygon: readonly IAutoMoviePatternPoint[], label: string): IAutoMoviePatternPoint[] {
    return canonicalAutoMoviePatternPolygonImplementation(polygon, label);
  }

  /**
   * Clip a convex face-local pattern outline by its canonical counter-clockwise
   * boundary.
   *
   * Pattern coordinates remain face-local metres; this adapter changes their
   * record shape only. The shared Sutherland-Hodgman operation retains subject
   * winding and previous/current traversal order. Strict crossings avoid
   * duplicate corners on an edge. Disjoint inputs yield an empty list; point or
   * line contact can yield a zero-area outline. Finite convex well-scaled
   * coordinates remain caller premises without directed rounding or independent
   * convexity validation here.
   *
   * @param subject Convex outline to clip, in face-local metres.
   * @param clipper Counter-clockwise convex outline in the same frame and unit.
   * @returns Newly allocated intersection records, possibly empty or zero-area.
   */
  export function clipPatternPolygon(subject: readonly IAutoMoviePatternPoint[], clipper: readonly IAutoMoviePatternPoint[]): IAutoMoviePatternPoint[] {
    return clipAutoMoviePatternPolygonImplementation(subject, clipper);
  }

  /**
   * Judge one layered build-up: its layers, its finishes, and its total.
   *
   * The checks fall into three groups the requirement names separately. Layer
   * conflicts are contradictions inside a layer: a cavity that carries a
   * substance, a solid with no thickness, a substance id that resolves to
   * nothing. Finish defects are contradictions between the stack and the faces it
   * presents: an exposed face with nothing finishing it, a finish laid over
   * another finish, a finish buried where it will never be seen, a finish spent
   * on a concealed face. Dimension conflicts are contradictions with the host: a
   * build-up whose layers do not sum to the thickness the host was drawn at.
   *
   * A single-layer stack presents both faces with the same layer, so its finish
   * answers for whichever of them is exposed rather than being demanded twice.
   *
   * A wrapping layer must belong to the run of wrapping layers starting at one
   * face; one behind a non-wrapping layer is refused. Ids must be unique within
   * the assembly, the axis, sense, exposures and substances must be known words,
   * the offset finite, and at least one layer present. Every finding is reported
   * at once with a `$input` path, and none throws. With `host`, the summed
   * thickness must equal the host's within 1e-9 m; with `substances`, every
   * non-cavity layer's material must name one of them by id.
   *
   * @param props.assembly Layered build-up to judge.
   * @param props.substances Substances the layers may cite, or omitted.
   * @param props.host Host dimension the layers must sum to, or omitted.
   * @returns Success, or every violation found.
   */
  export function validateMaterialAssembly(props: IAutoMovieValidateMaterialAssembly.IProps): IAutoMovieValidation {
    return validateAutoMovieMaterialAssemblyImplementation(props);
  }

  /**
   * Range-check one substance record.
   *
   * The engine ships no substances, so every value here is the production's own
   * and every measured property is optional. What the engine owns is the refusal:
   * a negative density, an absorption above one, or a vapour resistance below
   * still air are not measurements a later study can use, and a study that
   * silently consumes them reports a number nobody can trace back to a defect.
   *
   * A null property is unmeasured and passes. A present one must be finite and in
   * range: density, specific heat and service life above 0, thermal conductivity
   * at least 0, sound absorption within [0, 1], and vapour resistance at least 1,
   * the factor of still air. The classification must be non-blank, and a present
   * name too. Every finding is returned with a `$input` path; nothing throws, and
   * the surface id is not resolved against any material.
   *
   * @param props.substance Substance record to range-check.
   * @returns Success, or every violation found.
   */
  export function validateMaterialSubstance(props: IAutoMovieValidateMaterialSubstance.IProps): IAutoMovieValidation {
    return validateAutoMovieMaterialSubstanceImplementation(props);
  }

  /**
   * Validate a building's boundaries and the faces openings are cut in.
   *
   * Each boundary needs a unique id, a non-blank kind, one or two spaces it
   * encloses or separates, and space and element references that resolve once
   * each. A stated face needs a finite origin, a unit rotation, a positive
   * thickness, and an outline of at least 3 distinct finite corners that encloses
   * area without crossing itself. Findings are pushed under `<root>.boundaries`.
   *
   * @param environment Building whose boundaries are checked.
   * @param root Violation path of the building record, `$input`.
   * @param spaceIds Declared space ids.
   * @param elementIds Declared element ids.
   * @param collector Sink that receives the violations.
   * @returns The declared boundary ids, and every face that passed its checks by
   *   boundary id, so openings are only placed on a usable face.
   */
  export function validateBuiltBoundaries(environment: IAutoMovieBuiltEnvironment, root: string, spaceIds: ReadonlySet<string>, elementIds: ReadonlySet<string>, collector: IAutoMovieViolationCollector): IAutoMovieBuiltBoundaryIndex.IMutable {
    return validateBuiltBoundariesImplementation(environment, root, spaceIds, elementIds, collector);
  }

  /**
   * Validate a work's building units and that they own every element and space
   * exactly once.
   *
   * A work needs at least one unit, each with a unique id. A unit's root element
   * and root space must resolve and have no parent, and no two units may share a
   * root. Then every element and every space must reach, through its parents, a
   * topmost record that is some unit's root; one that does not is reported on its
   * own `parent` path, naming its topmost record. A walk that hits a dangling or
   * cyclic parent stops silently, because that defect is reported on its own
   * path. Findings are pushed under `<root>.buildings`, `<root>.elements` and
   * `<root>.spaces`.
   *
   * @param environment Building record whose units are checked.
   * @param root Violation path of the building record, `$input`.
   * @param collector Sink that receives the violations.
   */
  export function validateBuiltBuildings(environment: IAutoMovieBuiltEnvironment, root: string, collector: IAutoMovieViolationCollector): void {
    validateBuiltBuildingsImplementation(environment, root, collector);
  }

  /**
   * Refuse a carriage that does not stand in the space its state says it serves.
   *
   * A named stop is a claim about geometry, so it is settled against geometry:
   * the state is applied, the element the carriage drives is placed, and its own
   * origin has to land inside the space or a space below it, by
   * `builtEnvironmentContainsPoint`. A space whose subtree states no volume is
   * skipped rather than failed, because a purely semantic container has no stated
   * interior for the car to be in. A stated but unbounded cell is not skipped
   * merely because it has no finite bounds.
   *
   * Every other member stands where its own current state puts it, the same rule
   * the swept envelope follows, so a state is measured as the one change it makes
   * rather than against a configuration nothing declared. Findings are pushed at
   * the claiming value's `serves` path.
   *
   * @param environment Building already free of validation errors.
   * @param root Violation path of the building record, `$input`.
   * @param collector Sink that receives the violations.
   */
  export function validateBuiltCarriageService(environment: IAutoMovieBuiltEnvironment, root: string, collector: IAutoMovieViolationCollector): void {
    validateBuiltCarriageServiceImplementation(environment, root, collector);
  }

  /**
   * Validate the further spaces a run serves along its own route.
   *
   * A landing is a stop, and a stop stated twice, stated at an end the run
   * already names, or stated out of order is a stop later work cannot place. Each
   * landing's space must resolve, differ from the run's `from` and `to`, and
   * appear once; its arc-length fraction `at` must lie strictly inside `(0, 1)`,
   * because both ends are already served by the run's own endpoints, and strictly
   * increase from the landing before it. Findings are pushed under
   * `<path>.landings`; a run with no landings is skipped.
   *
   * @param connector Run whose landings are checked.
   * @param path Violation path of the connector.
   * @param spaces Declared space ids.
   * @param collector Sink that receives the violations.
   */
  export function validateBuiltConnectorLandings(connector: IAutoMovieBuiltConnector, path: string, spaces: ReadonlySet<string>, collector: IAutoMovieViolationCollector): void {
    validateBuiltConnectorLandingsImplementation(connector, path, spaces, collector);
  }

  /**
   * Validate the travelling carriages, named states, and stops of one run.
   *
   * An operated connector must name the elements it is built from, and declare at
   * least one carriage and one state. Each carriage needs a unique id, an element
   * that resolves and is one of the run's elements or below one, and a valid
   * travel by {@link validateBuiltTravelMotion}; no element may be driven by two
   * members of the whole work, which `driven` records across every opening and
   * connector and is updated here. Each state needs a unique id and a known
   * drive, may drive in `reverse` only on a bidirectional run, and gives every
   * carriage exactly one value inside its travel; a carriage's `serves` must be
   * one of the run's stops, its endpoints or landings. The current state must
   * resolve. Findings are pushed under `path`; a run with no operation is
   * skipped.
   *
   * @param props.connector Run whose operation is checked.
   * @param props.path Violation path of the connector.
   * @param props.elements Every element of the work.
   * @param props.elementIds Declared element ids.
   * @param props.driven Which member already drives each element, updated.
   * @param props.collector Sink that receives the violations.
   */
  export function validateBuiltConnectorOperation(props: IAutoMovieValidateBuiltConnectorOperation.IProps): void {
    validateBuiltConnectorOperationImplementation(props);
  }

  /**
   * Validate a connector's stations, section spelling, slope, and steps.
   *
   * Consecutive route stations must be more than 1e-9 m apart, and stated station
   * facings must match the route one for one as unit quaternions. A connector
   * states either a constant positive width and clear height or a varying
   * section, never both and never neither; a varying section needs at least 2
   * stations from `at` 0 to 1, strictly increasing, each with a positive width
   * and clear height. A stated slope must be finite within [0, PI / 2] radians,
   * and stated steps need a whole count of at least 1 with positive rise and run
   * in metres. When the route is measurable, the slope must agree with the
   * route's `atan2(|rise|, run)` within 1e-6 rad and the steps must climb and run
   * what the route does within 1e-3 m, both measured by
   * {@link builtConnectorGeometry}. The route is measurable when it has at least
   * two finite stations, at least one pair of them distinct, and `measured` is
   * true, which the caller sets only for the first connector bearing an id, the
   * one `builtConnectorGeometry` resolves. Findings are pushed under `path`.
   *
   * @param environment Building the connector belongs to.
   * @param connector Run whose shape is checked.
   * @param path Violation path of the connector.
   * @param measured Whether `builtConnectorGeometry` resolves this record by id.
   * @param collector Sink that receives the violations.
   */
  export function validateBuiltConnectorShape(environment: IAutoMovieBuiltEnvironment, connector: IAutoMovieBuiltConnector, path: string, measured: boolean, collector: IAutoMovieViolationCollector): void {
    validateBuiltConnectorShapeImplementation(environment, connector, path, measured, collector);
  }

  /**
   * Validate the graph, geometry references, and spatial topology of a building.
   *
   * Checks, in order: schema version 1 and metre units; owned models through
   * `validateModel` and runtime model references; logical spaces with their cells
   * or closed shells; the element and space hierarchies for dangling parents and
   * cycles; populations; ownership by exactly one building unit; boundaries and
   * their faces; openings, their voids inside the host face, their operations,
   * and void overlap on one boundary; connectors, their route shape, landings and
   * operations; and the support surfaces through `validateSpace`. Only when none
   * of that produced an error does it run the staged checks: every closed panel
   * fits its void, every carriage stands inside the stated-volume space its state
   * serves, and no operating state composes shear into the element hierarchy.
   *
   * Record defects are collected with `$input` paths, warnings included. Typed
   * containers and executable traversal depth remain premises; this is not a
   * universal non-throw guarantee for arbitrary runtime values or resource
   * exhaustion. Guarded lowering and downstream consumers refuse a rejected
   * record.
   *
   * @param props.environment Building record to validate.
   * @returns Success with any warnings, or every violation found.
   */
  export function validateBuiltEnvironment(props: IAutoMovieValidateBuiltEnvironment.IProps): IAutoMovieValidation {
    return validateBuiltEnvironmentImplementation(props);
  }

  /**
   * Validate the movable panels, named states, and hardware of one opening.
   *
   * An operated opening must name the element it fills, and declare at least one
   * panel and one state. Each panel needs a unique id, an element that resolves
   * and is the filling element or below it, a positive width and height, and a
   * valid travel by {@link validateBuiltTravelMotion}. No element may be driven by
   * two members of the whole work, because one element carries one displacement:
   * `driven` records which member already drives each element across every
   * opening and connector, and is updated here. Each state needs a unique id and
   * gives every panel exactly one value inside its travel, and the current state
   * must resolve. Hardware needs unique ids, a non-blank kind, and an element
   * that resolves when it names one. Findings are pushed under `path`; an opening
   * with no operation is skipped.
   *
   * @param props.opening Opening whose operation is checked.
   * @param props.path Violation path of the opening.
   * @param props.elements Every element of the work.
   * @param props.elementIds Declared element ids.
   * @param props.driven Which member already drives each element, updated.
   * @param props.collector Sink that receives the violations.
   */
  export function validateBuiltOpeningOperation(props: IAutoMovieValidateBuiltOpeningOperation.IProps): void {
    validateBuiltOpeningOperationImplementation(props);
  }

  /**
   * Validate a building's openings: references, voids, operations and overlap.
   *
   * Each opening needs a unique id, a non-blank kind, a boundary that resolves,
   * and a fill element that resolves when it names one. A stated void must sit on
   * a boundary that declares a face, have at least 2 distinct finite corners and
   * one finite bulge in [-1, 1] per edge when bulges are stated, and its
   * arc-bounding hull from {@link outlineHull} must enclose area without crossing
   * itself and stay inside the host face's outline. The operation is judged by
   * {@link validateBuiltOpeningOperation} right after each opening's void, sharing
   * `driven` with the connectors. Finally, two usable voids on one boundary may
   * not share any point. Findings are pushed under `<root>.openings`.
   *
   * @param environment Building whose openings are checked.
   * @param root Violation path of the building record, `$input`.
   * @param boundaries Declared boundary ids and the usable faces by boundary id.
   * @param elementIds Declared element ids.
   * @param driven Which member already drives each element, updated.
   * @param collector Sink that receives the violations.
   * @returns Every usable void hull by opening index, for the staged panel fit.
   */
  export function validateBuiltOpenings(environment: IAutoMovieBuiltEnvironment, root: string, boundaries: IAutoMovieBuiltBoundaryIndex, elementIds: ReadonlySet<string>, driven: Map<string, string>, collector: IAutoMovieViolationCollector): Map<number, IAutoMoviePlanarPoint[]> {
    return validateBuiltOpeningsImplementation(environment, root, boundaries, elementIds, driven, collector);
  }

  /**
   * Refuse a closed leaf that does not fit the void it fills.
   *
   * The leaf is measured where it actually rests, every member at zero travel,
   * projected into the host boundary's own frame, so a leaf and a void authored
   * in unrelated coordinates disagree here instead of at render time. Nothing is
   * said about a leaf smaller than its void: two leaves sharing one opening, or a
   * sash inside a frame, are ordinary designs, while a leaf larger than its own
   * hole is not a design at all.
   *
   * Only the two in-plane coordinates are compared. How far the leaf sits in
   * front of or behind the face is a design freedom, not an error: a leaf in a
   * rebate, a storm sash outside the frame, and a surface-mounted sliding leaf
   * all rest off the face's own plane on purpose.
   *
   * Containment is the same test a void gets against its face, so a leaf that
   * spans the notch of a concave void is refused even though each of its corners
   * is inside. The leaf is the `width` by `height` rectangle in its element's
   * local XY plane from the element origin. An opening without an operation, a
   * usable hull or a usable host face is skipped, because those defects are
   * reported on their own paths. Findings are pushed at each refused panel's
   * path.
   *
   * @param environment Building already free of validation errors.
   * @param root Violation path of the building record, `$input`.
   * @param faces Usable boundary faces by boundary id.
   * @param hulls Usable opening void hulls by opening index.
   * @param collector Sink that receives the violations.
   */
  export function validateBuiltPanelFit(environment: IAutoMovieBuiltEnvironment, root: string, faces: ReadonlyMap<string, IAutoMovieBoundaryFace>, hulls: ReadonlyMap<number, IAutoMoviePlanarPoint[]>, collector: IAutoMovieViolationCollector): void {
    validateBuiltPanelFitImplementation(environment, root, faces, hulls, collector);
  }

  /**
   * Check exactly what a building owns about one population it stages.
   *
   * The whole instance-set design is the production builder's to validate, and it
   * validates it again when the lowered set reaches the world. What is checked
   * here is the subset a building record answers for on its own: the prototype
   * box, the slot count, and the placement law `builtInstanceSetPlacementBounds`
   * has to be total over, because a space query that cannot bound a population it
   * was handed would have to return either a lie or nothing at all.
   *
   * Violations are pushed under `${path}.prototypeBounds` and `${path}.set`, so
   * `validateBuiltEnvironment` reports them at the population's own record path
   * and `builtInstanceSetPlacementBounds` at `$input`. The prototype box must be
   * finite and ordered on every axis. The set needs a positive integer count, a
   * finite anchor and heading, positive and ordered scale ranges, finite and
   * ordered rotation ranges, and a layout that is not `along-route`, carries one
   * finite unit-rotation positive-scale transform per slot when explicit, a
   * positive scatter radius, or positive integer rows, columns and layers with
   * positive spacing and a capacity of at least the count. Nothing is thrown;
   * every defect becomes one violation.
   *
   * @param population The set and its prototype box, as a building records them.
   * @param path Path prefix the violations are reported under.
   * @param collector Collector the violations are appended to.
   */
  export function validateBuiltPopulation(population: Pick<IAutoMovieBuiltPopulation, "set" | "prototypeBounds">, path: string, collector: IAutoMovieViolationCollector): void {
    validateBuiltPopulationImplementation(population, path, collector);
  }

  /**
   * Validate the logical spaces of a building and their hierarchy.
   *
   * Each space needs a unique id, a non-blank kind and a parent that resolves. It
   * states its volume at most once, as convex cells or as a closed shell judged
   * by {@link validateBuiltSpaceShell}, and a `fidelity` is either `exact` or
   * `faceted` and only allowed on a space that states a volume. Each cell needs a
   * unique id within its space and at least 4 planes, each with a finite non-zero
   * normal and a finite offset. The parent hierarchy must be acyclic. Findings
   * are pushed under `<root>.spaces`.
   *
   * @param environment Building whose spaces are checked.
   * @param root Violation path of the building, `$input`.
   * @param collector Sink that receives the violations.
   * @returns The declared space ids, for resolving references to spaces.
   */
  export function validateBuiltSpaces(environment: IAutoMovieBuiltEnvironment, root: string, collector: IAutoMovieViolationCollector): Set<string> {
    return validateBuiltSpacesImplementation(environment, root, collector);
  }

  /**
   * Check shell indices, finite facet areas, paired edges and positive signed
   * volume.
   *
   * Indices must resolve, computed facet areas must be finite/non-negligible, and
   * each directed edge must appear once with its reverse once. Aggregate computed
   * signed volume must be finite/positive. Nothing is repaired. These checks
   * reject missing/duplicated edges and nonpositive global volume but do not
   * prove every disconnected component's orientation or exclude all
   * self-intersections. Containment's absolute solid-angle test is a separate
   * numerical policy.
   *
   * Vertices must be finite, with at least four vertices and four whole
   * triangles. Vertex-component/count findings do not stop checking; bad triangle
   * count/index, unusable facet area or unmatched edge does. Findings can
   * therefore include a vertex-count finding plus one later structural finding
   * and non-finite component findings.
   *
   * @param shell Shell to check.
   * @param path Violation path of the shell, such as `$input.spaces[0].shell`.
   * @param collector Sink that receives the violations.
   */
  export function validateBuiltSpaceShell(shell: IAutoMovieSpaceShell, path: string, collector: IAutoMovieViolationCollector): void {
    validateBuiltSpaceShellImplementation(shell, path, collector);
  }

  /**
   * Refuse a configuration the scene could not stage, in any state the record
   * names.
   *
   * A staged node is world TRS, so a composed hierarchy carrying shear cannot be
   * lowered without silently dropping it. Checking only the state the record
   * currently stands in would let a door pass shut and lie open: the same
   * revolute leaf below a non-uniformly scaled ancestor is a clean rigid frame at
   * rest and a sheared one a quarter turn later, and both the staged set and the
   * placement queries would answer with a decomposition that never existed.
   *
   * Every element is checked in the current staging and reported at its own
   * `transform`. Then each non-current state of each opening and connector is
   * staged with every other member in its current state, and only the subtree the
   * state moves is re-checked, because a displacement rides down from the element
   * it drives and nothing above or beside it can change. A state that shears any
   * element is reported once, at the state's path, naming the first. Operations
   * whose moved subtrees overlap are also checked in every joint assignment of
   * their named states. Independent branches do not interact. A matrix is sheared
   * when recomposing its decomposition differs in the linear basis by more than
   * 1e-8 times max(1, that basis's largest absolute entry). The unit floor gives
   * tiny bases an absolute tolerance; translation cannot enlarge it. Non-finite
   * compositions are refused by the same gate.
   *
   * @param environment Building already free of validation errors.
   * @param root Violation path of the building record, `$input`.
   * @param collector Sink that receives the violations.
   */
  export function validateBuiltStagedConfigurations(environment: IAutoMovieBuiltEnvironment, root: string, collector: IAutoMovieViolationCollector): void {
    validateBuiltStagedConfigurationsImplementation(environment, root, collector);
  }

  /**
   * Validate the one degree of freedom a moving member travels on.
   *
   * The label names what is moving so the refusal reads as the author wrote it: a
   * door leaf and a lift car share this arithmetic, and a message that called a
   * car a panel would send its author looking through the openings for it.
   *
   * Axis components/computed length must be finite, length above 1e-12, and a
   * revolute pivot finite. Rest-relative `min` must be finite and at most zero,
   * `max` finite and at least zero, with `max > min`. Revolute span is capped at
   * `2 * PI + AutoMovieEngineFullTurnEpsilon` radians for the swept-envelope solver.
   * Prismatic values are metres and revolute values radians. Findings use
   * `path`.
   *
   * @param motion Travel to check.
   * @param path Violation path of the motion.
   * @param label What is moving, such as `panel` or `carriage`.
   * @param collector Sink that receives the violations.
   */
  export function validateBuiltTravelMotion(motion: IAutoMovieTravelMotion, path: string, label: string, collector: IAutoMovieViolationAppendSink): void {
    validateBuiltTravelMotionImplementation(motion, path, label, collector);
  }

  /**
   * Validate authored citations from a normalized design to its evidence.
   *
   * A citation may point at an unsettled reading on purpose: recording that a
   * wall was drawn where two centreline candidates disagree is exactly the
   * accountability this graph exists for. What it may not do is point at nothing.
   * A dangling document, a dangling candidate, or a blank rationale each turn the
   * citation into a decoration that survives the evidence it claims to rest on.
   *
   * A citation also needs at least one candidate, and may cite each (subject,
   * document, candidate) once. A citation whose document does not resolve skips
   * candidate checks, while rationale blank checks still report findings.
   * Findings use `$input.evidence[i]` paths and nothing throws. Two references
   * sharing an id are merged into one candidate set here rather than refused; the
   * production builder reports that collision as `design-reference-duplicate`.
   *
   * @param props.references Observed documents the citations may point at.
   * @param props.evidence Authored citations to judge.
   * @returns Success, or every violation found.
   */
  export function validateDesignEvidence(props: IAutoMovieValidateDesignEvidence.IProps): IAutoMovieValidation {
    return validateDesignEvidenceImplementation(props);
  }

  /**
   * Validate one lineage record as a self-consistent phase, alternative, and
   * derivation graph.
   *
   * The record annotates identities other graphs own, so this validator checks
   * the annotation and never the building. What it refuses is exactly the set of
   * ways a lineage stops being able to answer its own questions: a construction
   * plan that requires itself, an alternative applying to a revision nobody
   * recorded, two edits of the same aspect inside one alternative, a subject
   * removed before it was ever installed, and a derived artifact still stamping a
   * superseded revision, reading imported bytes that have since been replaced, or
   * disagreeing with the inputs it was computed from.
   *
   * Staleness is a refusal rather than a warning, which makes the order of a
   * rebake explicit: ask {@link designLineageImpact} what a change reaches while
   * the record still describes the outputs on disk, then move the revision or the
   * imported digest and the outputs together. A record caught mid-rebake is
   * invalid on purpose; the alternative is serving an output nobody can check.
   *
   * Lifecycle coverage is total by the same reasoning
   * {@link IAutoMovieDesignLifecycle} states: a subject with no lifecycle would
   * have to be given a default, and every available default asserts something the
   * author did not, either that the thing predates the work or that it survives
   * it.
   *
   * Comparison fairness is a validation rule rather than a convention. When two
   * alternatives of one decision both carry a derived artifact of the same kind,
   * those artifacts must share a lowering configuration and a phase, because a
   * comparison shot under two cameras compares the cameras. The derived artifact
   * rules are listed on {@link validateDesignLineageDerived}.
   *
   * Every digest must be a lowercase `sha256:` hex digest. Findings are returned
   * with `$input` paths and nothing throws; the lineage query functions throw on
   * the first finding instead. Host identities are not checked here;
   * {@link validateDesignLineageBinding} does that.
   *
   * @param props.lineage Lineage record to validate.
   * @returns Success, or every violation found.
   */
  export function validateDesignLineage(props: IAutoMovieValidateDesignLineage.IProps): IAutoMovieValidation {
    return validateDesignLineageImplementation(props);
  }

  /**
   * Check a lineage against the identities its host graphs actually publish.
   *
   * Self-consistency is not enough: a lineage annotates ids it does not own, so a
   * renamed wall leaves a phase plan quietly talking about nothing. The caller
   * hands over every stable id its graphs publish, which is why this stays a
   * separate function; binding lineage to one named graph would make it useless
   * to the next fold that lands.
   *
   * A host id absent from the lineage is not an error. Lineage is additive, and a
   * production may phase one wing and leave the rest unannotated. The refusals
   * run the other way: a declared subject that resolves to nothing, and a derived
   * artifact id that squats on a design identity.
   *
   * Ids are compared exactly. Findings are returned with `$input.subjects[i].id`
   * or `$input.derived[i].id` paths and nothing throws; the lineage's own
   * consistency is {@link validateDesignLineage}'s to check.
   *
   * @param props.lineage Lineage whose subjects and derived ids are checked.
   * @param props.known Every stable id the host graphs publish.
   * @returns Success, or every violation found.
   */
  export function validateDesignLineageBinding(props: IAutoMovieValidateDesignLineageBinding.IProps): IAutoMovieValidation {
    return validateDesignLineageBindingImplementation(props);
  }

  /**
   * Validate the derived artifacts of one design lineage: their identity, their
   * freshness, and the fairness of every comparison they take part in.
   *
   * Each artifact needs a unique id that is not a subject's, a non-blank kind, at
   * least one input naming a subject or another artifact once, and lowercase
   * `sha256:` digests for its bytes and its configuration. It is stale, and
   * refused, when its stamp names a revision other than `head`, an unknown
   * variant, a variant based on another revision, or an unknown phase; when an
   * input artifact was stamped differently; when it reads an input subject
   * carrying imported bytes without citing exactly that subject's current digest
   * once; or when it cites bytes of a subject that is not such an input. The
   * input graph must be acyclic. Within one decision, two artifacts of the same
   * kind stamped with that decision's alternatives must share a configuration and
   * a phase, because a comparison shot under two cameras compares the cameras.
   *
   * Findings are pushed to `out` with `<root>.derived[i]` paths, in artifact
   * order and then decision order for the fairness check; nothing throws.
   *
   * @param props.lineage Lineage whose `derived` list is judged.
   * @param props.subjectIds Declared subject ids, which artifact ids must avoid.
   * @param props.phaseIds Declared construction phase ids.
   * @param props.variants Declared variants by id.
   * @param props.root Violation path of the lineage itself.
   * @param props.out Sink that receives the violations.
   */
  export function validateDesignLineageDerived(props: IAutoMovieValidateDesignLineageDerived.IProps): void {
    validateDesignLineageDerivedImplementation(props);
  }

  /**
   * Validate one observed design reference as evidence.
   *
   * The record is checked as a self-consistent observation, never as a design: a
   * frame states how its own units are read, a primitive states what was on the
   * sheet, a candidate states one proposed meaning, and an issue states what is
   * still undecided. The validator's whole job is to keep those four layers from
   * collapsing into each other, because the moment an observation is allowed to
   * carry a conclusion, the design source of truth has been silently replaced.
   *
   * So it refuses a candidate that cites a primitive nobody saw, an issue about
   * nothing, an analysis that claims `observed` while producing no reading, and a
   * non-observed analysis without a non-blank reason. Extra runtime properties on
   * non-observed analysis objects are not inspected. It also refuses a settled
   * scale that names no recorded candidate: an unknown scale is a fact about the
   * drawing, and inventing one is how a plan image turns into metres nobody
   * measured.
   *
   * The same principle binds an analysis to the one frame it says it read: a
   * candidate built from marks on another sheet was not produced by this reading,
   * and filing it here would let a section's geometry inherit a plan's scale.
   * Correlating two sheets is the authored building's job, through evidence that
   * may cite any candidate of any document.
   *
   * Observed points are in frame units and must lie within the frame's `bounds`
   * (0 to width, 0 to height); each primitive family has its own point-count
   * bounds, and only `text` and `level-marker` carry literal text. Frames are
   * judged by {@link validateDesignSourceFrame}. Every id is unique, the digest is
   * a lowercase `sha256:` hex digest, and the media is a supported type. Findings
   * are returned with `$input` paths and nothing throws; the asset bytes behind
   * `digest` are not read here.
   *
   * @param props.reference Observed design reference to validate.
   * @returns Success, or every violation found.
   */
  export function validateDesignReference(props: IAutoMovieValidateDesignReference.IProps): IAutoMovieValidation {
    return validateDesignReferenceImplementation(props);
  }

  /**
   * Validate how one source frame of an observed design reference is read.
   *
   * A frame states its own sheet: a known view, a whole page number from 1, a
   * null or non-blank level, a finite positive width and height, and an anchor
   * inside those bounds. Its scale readings need unique ids, a finite positive
   * `metersPerUnit`, a confidence in [0, 1] and a non-blank basis, and a settled
   * `scale` must name one of them; leaving it null is how an unknown scale is
   * recorded. `axisX`, `axisY`, `up` and a present `north` must be finite
   * non-zero directions, `axisX` and `axisY` must not be parallel, the origin
   * must be finite, and a present transform must have finite components, a unit
   * rotation and a positive scale. Every finding is pushed to `collector` under
   * `path`; nothing throws.
   *
   * @param frame Frame to validate.
   * @param path Violation path of the frame, such as `$input.frames[0]`.
   * @param collector Sink that receives the violations.
   */
  export function validateDesignSourceFrame(frame: IAutoMovieDesignSourceFrame, path: string, collector: IAutoMovieViolationCollector): void {
    validateDesignSourceFrameImplementation(frame, path, collector);
  }

  /**
   * Validate authored generation metadata beside a supplied output-digest
   * identity.
   *
   * A record claiming reproducibility must carry a seed, while a seed beside a
   * false reproducibility claim produces a consistency warning. Presence is
   * evidence that the field was recorded; this gate invokes no provider and
   * proves neither replay nor whether the output was externally served.
   *
   * A seed must be a safe integer within ±(2^53-1), so adjacent integer
   * identities survive JSON-number transport; fractional, nonfinite and
   * larger-magnitude values are refused before the presence/warning rules. The
   * actual provider's seed domain remains outside this metadata gate.
   *
   * Provider and model must be non-blank, a present prompt non-blank, and both
   * digests lowercase `sha256:` hex. A supplied digest must equal outputDigest.
   * Findings use `$input` paths; an irreproducible seed is a non-blocking
   * warning. Input slots, including holes, are visited by index and checked for
   * nonblank strings without resolving paths. Non-throwing collection assumes the
   * declared acquisition/container and string shapes; malformed runtime
   * containers can throw before findings are returned.
   *
   * @param props.acquisition Generation identity recorded for one set of bytes.
   * @param props.digest Digest the bytes must still have, or null when replaced.
   * @returns Success, possibly with the seed warning, or every violation found.
   */
  export function validateGeneratedAcquisition(props: IAutoMovieValidateGeneratedAcquisition.IProps): IAutoMovieValidation {
    return validateGeneratedAcquisitionImplementation(props);
  }
}
