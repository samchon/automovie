import { admitSubdivisionCage as admitSubdivisionCageImplementation } from "./internal/admitSubdivisionCage";
import { buildConvexHull as buildConvexHullImplementation } from "./internal/buildConvexHull";
import { buildWall as buildWallImplementation } from "./internal/buildWall";
import { buildSubdivisionTopology as buildSubdivisionTopologyImplementation } from "./internal/buildSubdivisionTopology";
import { checkFormExpectation as checkFormExpectationImplementation } from "./internal/checkFormExpectation";
import { countAtLeast as countAtLeastImplementation } from "./internal/countAtLeast";
import { createMeshWindingQuery as createMeshWindingQueryImplementation } from "./internal/createMeshWindingQuery";
import { decaySubdivisionSharpness as decaySubdivisionSharpnessImplementation } from "./internal/decaySubdivisionSharpness";
import { emptyMeshTarget as emptyMeshTargetImplementation } from "./internal/emptyMeshTarget";
import { limitSubdivisionLevel as limitSubdivisionLevelImplementation } from "./internal/limitSubdivisionLevel";
import { limitSubdivisionRing as limitSubdivisionRingImplementation } from "./internal/limitSubdivisionRing";
import { measureModelContacts as measureModelContactsImplementation } from "./internal/measureModelContacts";
import { meshOf as meshOfImplementation } from "./internal/meshOf";
import { planarCross as planarCrossImplementation } from "./internal/planarCross";
import { planarSegmentsMeet as planarSegmentsMeetImplementation } from "./internal/planarSegmentsMeet";
import { pointInPlanarRing as pointInPlanarRingImplementation } from "./internal/pointInPlanarRing";
import { pushFlatTriangle as pushFlatTriangleImplementation } from "./internal/pushFlatTriangle";
import { refineSubdivisionLevel as refineSubdivisionLevelImplementation } from "./internal/refineSubdivisionLevel";
import { refineSubdivisionPoints as refineSubdivisionPointsImplementation } from "./internal/refineSubdivisionPoints";
import { refineSubdivisionUvs as refineSubdivisionUvsImplementation } from "./internal/refineSubdivisionUvs";
import { signedArea as signedAreaImplementation } from "./internal/signedArea";
import { stepSubdivisionRing as stepSubdivisionRingImplementation } from "./internal/stepSubdivisionRing";
import { subdivisionEdgeSmoothness as subdivisionEdgeSmoothnessImplementation } from "./internal/subdivisionEdgeSmoothness";
import { subdivisionRingEigenbasis as subdivisionRingEigenbasisImplementation } from "./internal/subdivisionRingEigenbasis";
import { subdivisionVertexMask as subdivisionVertexMaskImplementation } from "./internal/subdivisionVertexMask";
import { tessellate as tessellateImplementation } from "./internal/tessellate";
import { tessellateSurface as tessellateSurfaceImplementation } from "./internal/tessellateSurface";
import { tessellateToMesh as tessellateToMeshImplementation } from "./internal/tessellateToMesh";
import { transformMesh as transformMeshImplementation } from "./internal/transformMesh";

import { buildPolyhedron as buildPolyhedronImplementation } from "./internal/buildPolyhedron";
import { displaceSurface as displaceSurfaceImplementation } from "./internal/displaceSurface";
import { extrudeProfile as extrudeProfileImplementation } from "./internal/extrudeProfile";
import { inspectMeshTopology as inspectMeshTopologyImplementation } from "./internal/inspectMeshTopology";
import { measureMeshPieces as measureMeshPiecesImplementation } from "./internal/measureMeshPieces";
import { mergeMeshParts as mergeMeshPartsImplementation } from "./internal/mergeMeshParts";
import { mergeMeshes as mergeMeshesImplementation } from "./internal/mergeMeshes";
import { revolveProfile as revolveProfileImplementation } from "./internal/revolveProfile";

import { countMeshComponents as countMeshComponentsImplementation } from "./internal/countMeshComponents";
import { measureMeshDefects as measureMeshDefectsImplementation } from "./internal/measureMeshDefects";
import { measureModelCrossings as measureModelCrossingsImplementation } from "./internal/measureModelCrossings";
import { separateMeshSequence as separateMeshSequenceImplementation } from "./internal/separateMeshSequence";
import { subdivideSurface as subdivideSurfaceImplementation } from "./internal/subdivideSurface";
import { weldedDegenerateTriangles as weldedDegenerateTrianglesImplementation } from "./internal/weldedDegenerateTriangles";

import { type IAutoMovieAdmitBicubicAtlas, type IAutoMovieBicubicAtlasGeometry, type IAutoMovieFeatureEdgeDistance, type IAutoMovieVector3, type IAutoMovieSpatialQueryEntry, type IAutoMovieTriangleAttachmentContactBound, type IAutoMovieMeshQueryHierarchy, type IAutoMovieCreateEllipticLoftAtlas, type IAutoMovieMesh, type IAutoMovieMeshDeformationInfluence, type IAutoMovieMeshDeformationField, type IAutoMovieCreateMeshDepthSampler, type IAutoMovieMeshRayCaster, type IAutoMovieMeshSeparationQuery, type IAutoMovieSignedMeshQueryHit, type IAutoMovieSignedMeshQueryOptions, type IAutoMovieCreateSupportSectionQuery, type IAutoMovieEvaluateSupportSection, type IAutoMovieSubdivisionSurface, type IAutoMovieSubdivisionLevel, type IAutoMovieFitSubdivisionDomain, type IAutoMovieFitSubdivisionRegions, type IAutoMovieIntegrateRadialField, type IAutoMovieMark, type IAutoMovieMarkMeshClearance, type IAutoMovieMeasureFeatureEdges, type IAutoMovieMeasureMeshClearance, type IAutoMovieMeshClearanceWitness, type IAutoMovieProjectionIntervals, type IAutoMovieMinimizeMeshClearance, type IAutoMovieSweepFrame, type IAutoMovieSurfaceFrame, type IAutoMoviePreparedSurfaceFrame, type IAutoMovieRealizeBicubicAtlas64, type IAutoMovieRealizeGeometry, type IAutoMovieGeometry, type IAutoMovieSubdivisionTopology, type IAutoMovieSelectTriangleRegion, type IAutoMovieMeshDefect, type IAutoMovieMeasureMeshDefects, type IAutoMovieModelCrossing, type IAutoMovieModel, type IAutoMovieMeasureModelCrossings, type IAutoMovieSubdivideSurface, type IAutoMovieDisplaceSurface, type IAutoMovieExtrudeProfile, type IAutoMovieMeshTopology, type IAutoMovieMeshPiece, type IAutoMovieMeshAssembly, type IAutoMovieMeshPart, type IAutoMovieRevolveProfile, type IAutoMovieSubdivisionCage, type IAutoMovieBuildWall, type IAutoMovieFormCheck, type IAutoMovieFormExpectation, type IAutoMovieMeshWinding, type IAutoMovieMeshTarget, type IAutoMovieLimitSubdivisionLevel, type IAutoMovieLimitSubdivisionRing, type IAutoMovieSubdivisionRing, type IAutoMovieModelContact, type IAutoMovieMeasureModelContacts, type IAutoMoviePlanarPoint, type IAutoMovieRefineSubdivisionPoints, type IAutoMovieRefineSubdivisionUvs, type IAutoMovieSubdivisionVertexMask, type IAutoMovieProfilePoint, type IAutoMovieSubdivisionRingEigenbasis, type IAutoMovieTessellation, type IAutoMoviePrimitiveShape, type IAutoMovieSurface, type IAutoMovieMeshTransform } from "@automovie/interface";
import { admitBicubicAtlas as admitBicubicAtlasImplementation } from "./internal/admitBicubicAtlas";
import { assertDeformedTriangles as assertDeformedTrianglesImplementation } from "./internal/assertDeformedTriangles";
import { featureEdgeDistance as featureEdgeDistanceImplementation } from "./internal/featureEdgeDistance";
import { boundConvexSeparation as boundConvexSeparationImplementation } from "./internal/boundConvexSeparation";
import { boundMeshQueryPoint as boundMeshQueryPointImplementation } from "./internal/boundMeshQueryPoint";
import { boundProjectionSeparation as boundProjectionSeparationImplementation } from "./internal/boundProjectionSeparation";
import { boundTriangleAttachmentContact as boundTriangleAttachmentContactImplementation } from "./internal/boundTriangleAttachmentContact";
import { buildMeshQueryHierarchy as buildMeshQueryHierarchyImplementation } from "./internal/buildMeshQueryHierarchy";
import { collectSpatialQueryCandidates as collectSpatialQueryCandidatesImplementation } from "./internal/collectSpatialQueryCandidates";
import { createEllipticLoftAtlas as createEllipticLoftAtlasImplementation } from "./internal/createEllipticLoftAtlas";
import { createMeshDeformer as createMeshDeformerImplementation } from "./internal/createMeshDeformer";
import { createMeshDepthSampler as createMeshDepthSamplerImplementation } from "./internal/createMeshDepthSampler";
import { createMeshRayCaster as createMeshRayCasterImplementation } from "./internal/createMeshRayCaster";
import { createMeshSeparationQuery as createMeshSeparationQueryImplementation } from "./internal/createMeshSeparationQuery";
import { createSignedMeshQuery as createSignedMeshQueryImplementation } from "./internal/createSignedMeshQuery";
import { createSupportSectionQuery as createSupportSectionQueryImplementation } from "./internal/createSupportSectionQuery";
import { evaluateSupportSection as evaluateSupportSectionImplementation } from "./internal/evaluateSupportSection";
import { evaluateSubdivisionLevel as evaluateSubdivisionLevelImplementation } from "./internal/evaluateSubdivisionLevel";
import { fitSubdivisionDomain as fitSubdivisionDomainImplementation } from "./internal/fitSubdivisionDomain";
import { fitSubdivisionRegions as fitSubdivisionRegionsImplementation } from "./internal/fitSubdivisionRegions";
import { integrateRadialField as integrateRadialFieldImplementation } from "./internal/integrateRadialField";
import { intersectConvexPolygons as intersectConvexPolygonsImplementation } from "./internal/intersectConvexPolygons";
import { markMeshClearance as markMeshClearanceImplementation } from "./internal/markMeshClearance";
import { measureFeatureEdges as measureFeatureEdgesImplementation } from "./internal/measureFeatureEdges";
import { measureMeshClearance as measureMeshClearanceImplementation } from "./internal/measureMeshClearance";
import { measureProjectionIntervals as measureProjectionIntervalsImplementation } from "./internal/measureProjectionIntervals";
import { minimizeMeshClearance as minimizeMeshClearanceImplementation } from "./internal/minimizeMeshClearance";
import { normalizeSurfaceFrame as normalizeSurfaceFrameImplementation } from "./internal/normalizeSurfaceFrame";
import { placeSurfaceFrame as placeSurfaceFrameImplementation } from "./internal/placeSurfaceFrame";
import { prepareSurfaceFrame as prepareSurfaceFrameImplementation } from "./internal/prepareSurfaceFrame";
import { realizeBicubicAtlas64 as realizeBicubicAtlas64Implementation } from "./internal/realizeBicubicAtlas64";
import { realizeGeometry as realizeGeometryImplementation } from "./internal/realizeGeometry";
import { refineSubdivisionStencils as refineSubdivisionStencilsImplementation } from "./internal/refineSubdivisionStencils";
import { refitMeshQueryHierarchy as refitMeshQueryHierarchyImplementation } from "./internal/refitMeshQueryHierarchy";
import { selectTriangleRegion as selectTriangleRegionImplementation } from "./internal/selectTriangleRegion";
import { subdivisionBendingRows as subdivisionBendingRowsImplementation } from "./internal/subdivisionBendingRows";
import { triangleIndicesOf as triangleIndicesOfImplementation } from "./internal/triangleIndicesOf";

/** Public operations for Auto Movie Engine Geometry. */
export namespace AutoMovieEngineGeometry {
  /**
   * Select the usable patches of a model-space bicubic atlas.
   *
   * The model tolerance and retained XYZ coefficients must be representable in
   * millimetres. Global work policy requires a positive tolerance, at least one
   * cell and at least three vertices with safe integer limits. An invalid
   * coefficient, registry ordinal or canonical interval omits its incident
   * patches and preserves independent occurrences with their original IDs.
   * Source-fit diagnostics describe an independent qualification.
   */
  export function admitBicubicAtlas(input: IAutoMovieBicubicAtlasGeometry): IAutoMovieAdmitBicubicAtlas.IResult {
    return admitBicubicAtlasImplementation(input);
  }

  /**
   * Admit every emitted triangle of a deformed mesh by area and orientation.
   *
   * For each triangle of `indices`, the source and deformed area vectors over the
   * same three vertices must be finite and nonzero. The source unit normal is
   * transported through each corner's cofactor matrix (row-major, nine entries
   * per vertex) and must stay finite and nonzero there, its direction kept by
   * rescaling when only its norm overflows; the deformed normal must agree
   * positively with the sum of the three unit transported normals. Positions are
   * flat XYZ in one frame. A failure throws and names the triangle ordinal, and
   * for a transport failure the vertex; inputs are read only. Every index must
   * address a vertex of all four arrays, which `createMeshDeformer`
   * checks before calling.
   *
   * Compare a straight output face with the differential orientation of its
   * source face. Cofactors are det(J) * inverse(J)-transpose, so their positive
   * scalar does not alter orientation. Normalizing each transported face normal
   * before summation gives every corner equal weight, independent of local area
   * stretch. Comparing old and new area vectors directly would incorrectly refuse
   * an orientation-preserving bend that turns the face through 90 degrees.
   *
   * Cross products have square-metre units; normalized orientation is unitless.
   * No absolute area epsilon excludes a small but representable triangle. A
   * collapsed or opposing sampled face needs finer tessellation or a different
   * field, even when all of its endpoint Jacobians remain positive.
   */
  export function assertDeformedTriangles(source: readonly number[], target: readonly number[], indices: readonly number[], cofactors: readonly (readonly number[])[]): void {
    assertDeformedTrianglesImplementation(source, target, indices, cofactors);
  }

  /**
   * Read the convex and concave feature distances at a triangle point.
   *
   * Supply the bind-pose point and original triangle ordinal from a measured
   * feature table. Each sign returns its nearest listed segment distance,
   * capped at the table's reach. Missing signs return reach. A full
   * sixteen-edge row may exclude other nearby edges. An unknown triangle
   * ordinal raises an error.
   */
  export function featureEdgeDistance(props: IAutoMovieFeatureEdgeDistance.IProps): IAutoMovieFeatureEdgeDistance.IResult {
    return featureEdgeDistanceImplementation(props);
  }

  /**
   * Prove a lower bound on the separation of two represented convex hulls in
   * metres.
   *
   * Supply nonempty finite XYZ vertex runs in one frame. Degenerate hulls may
   * be points or segments. Candidate axes come from face normals, the first
   * vertex displacement and closest segment witnesses. A zero bound leaves
   * separation unresolved. A nonnegative sufficient bound allows an early
   * return, while its default of infinity examines every candidate. The
   * optional spend callback accounts for attempted triples, projections and
   * pair calculations.
   */
  export function boundConvexSeparation(a: readonly IAutoMovieVector3[], b: readonly IAutoMovieVector3[], sufficient?: number, spend?: () => void): number {
    return boundConvexSeparationImplementation(a, b, sufficient, spend);
  }

  /**
   * Bound squared XYZ distance from a point to a query box.
   *
   * Supply an admitted point and bounds in metres. With an omitted cutoff,
   * return the entire squared distance. A nonnegative squared cutoff permits
   * returning an X or XY partial sum as soon as it exceeds the cutoff. Equality
   * continues so equally near features remain eligible.
   */
  export function boundMeshQueryPoint(node: Readonly<Pick<IAutoMovieSpatialQueryEntry, "low" | "high">>, point: readonly number[], cutoff?: number): number {
    return boundMeshQueryPointImplementation(node, point, cutoff);
  }

  /**
   * Prove a convex-hull separation lower bound along one supplied direction.
   *
   * Both nonempty vertex runs and the direction use one finite XYZ frame.
   * Return a nonnegative bound in metres. A zero direction or overlapping
   * projection intervals returns zero, which leaves separation unresolved.
   * An empty run, nonfinite coordinate or unrepresentable projection enclosure
   * raises an error. A coordinate-axis proof can use two opposite box corners.
   */
  export function boundProjectionSeparation(a: readonly IAutoMovieVector3[], b: readonly IAutoMovieVector3[], raw: IAutoMovieVector3): number {
    return boundProjectionSeparationImplementation(a, b, raw);
  }

  /**
   * Bound how far one support triangle can contact an anchored fan.
   *
   * The fan lists its registered root first, then the two row corners. Supply
   * both triangles in the same finite metre frame. A positive outward slab gap
   * for both corners permits a conservative metre cap around the root.
   * Collapsed support or a nonpositive corner gap leaves the proof false. The
   * returned slab quantities apply to that support triangle. Malformed triangle
   * records or unrepresentable slab arithmetic raise errors.
   */
  export function boundTriangleAttachmentContact(fan: readonly IAutoMovieVector3[], support: readonly IAutoMovieVector3[]): IAutoMovieTriangleAttachmentContactBound {
    return boundTriangleAttachmentContactImplementation(fan, support);
  }

  /**
   * Build a median box hierarchy over admitted entries in one metre frame.
   *
   * Unions bound every descendant. For more than twelve entries, sort the
   * caller's array by centre on the widest axis and split it at the median.
   * Axis ties prefer X, then Y, then Z, and centre ties retain input order.
   * Smaller populations keep the original array as one leaf. An empty leaf has
   * infinity union sentinels. Rebuild or refit after its entry geometry
   * changes.
   */
  export function buildMeshQueryHierarchy<T extends IAutoMovieMeshQueryHierarchy.IEntry>(entries: T[]): IAutoMovieMeshQueryHierarchy<T> {
    return buildMeshQueryHierarchyImplementation<T>(entries);
  }

  /**
   * Return resident entries ordered by their first grid cell shared with a
   * subject box.
   *
   * The overlap population includes contact on actual box boundaries. The
   * shared-cell population tests intersections of integer cell ranges. Use a
   * positive cell width in metres. Infinity places all finite coordinates in
   * one cell. The result borrows entries and orders them by first cell in XYZ
   * order, then original ordinal.
   */
  export function collectSpatialQueryCandidates<T extends IAutoMovieSpatialQueryEntry>(hierarchy: IAutoMovieMeshQueryHierarchy<T>, subject: IAutoMovieSpatialQueryEntry, cell: number, population: "overlap" | "shared-cell"): T[] {
    return collectSpatialQueryCandidatesImplementation<T>(hierarchy, subject, cell, population);
  }

  /**
   * Form a shared bicubic atlas from cubic centre and ellipse-radius profiles.
   * Each quarter uses the tangent-matching circular cubic with k = 4 (sqrt(2) -
   *
   * 1. / 3. Its radial deviation from the unit circle is below 0.000273:
   *    differentiating x(t)^2 + z(t)^2 locates the interior extrema. Applying the
   *    diagonal ellipse scale bounds the section's Hausdorff deviation by that
   *    constant times its largest half-axis. This is a separate geometric
   *    approximation from the atlas-to-triangle tolerance and any observation
   *    error. Clockwise angular U and increasing physical Y make U cross V
   *    outward. Adjacent spans share coefficient identity at equal endpoints;
   *    each patch keeps its own analytic normal fan so a C0-only axial join
   *    retains both limits. C1 remains the caller's constraint rather than an
   *    inferred property.
   *
   * Supply finite adjacent Y intervals, finite centre controls, positive finite
   * radii and exactly shared endpoints. The returned coefficients are finite
   * model metres, with exact authored Y at each endpoint. This producer forwards
   * a positive finite tolerance and positive safe integer budgets. Realizing the
   * result requires a vertex budget of at least three.
   */
  export function createEllipticLoftAtlas(input: IAutoMovieCreateEllipticLoftAtlas.IInput): IAutoMovieCreateEllipticLoftAtlas.IResult {
    return createEllipticLoftAtlasImplementation(input);
  }

  /**
   * Compile compact deformation fields into an operation that deforms a mesh.
   *
   * Each field moves points inside its axis-aligned ellipsoid by its displacement
   * plus its stretch times the offset from its centre, weighted by `(1 - r^2)^3`
   * of the normalized radius `r` and zero outside. Every vertex uses the same
   * summed map, and normals are transported by its analytic cofactor
   * (inverse-transpose) matrix, so splitting one skin into material regions
   * cannot open a lighting seam. UVs, triangle identities and skin bindings are
   * kept; physical source correspondence is copied and checked before and after,
   * so a vertex-specific influence cannot separate declared aliases, while a mesh
   * without it keeps welding by current position. Fields are copied at compile
   * time; meshes and influences are only read, and each call returns a new mesh.
   *
   * An optional influence supplies, per vertex, a mask weight `f` in [0, 1] and
   * its gradient in inverse metres. For displacement `d` the composed map is `p +
   * f d` with Jacobian `I + f (J - I) + outer(d, grad f)`. Apply an attachment
   * mask here, before the orientation checks, rather than scaling the returned
   * displacement afterwards and invalidating the checked geometry. The caller
   * owns the samples' provenance and their behaviour between vertices.
   *
   * Compilation throws on a non-finite field vector or a nonpositive radius. A
   * call throws on a malformed index buffer, a non-finite position or normal, a
   * normal buffer not aligned to the positions, a wrong influence count or an
   * influence outside its domain, a Jacobian that reverses orientation at a
   * vertex, a non-finite result, and, through `assertDeformedTriangles`,
   * an emitted triangle that collapses or disagrees with its source orientation
   * transported by its three vertex Jacobians. That is a tessellation check, not
   * a global self-intersection test or a proof of the field between vertices.
   *
   * @param fields Deformation fields in the mesh's local metre frame.
   * @returns The deformation operation.
   */
  export function createMeshDeformer(fields: readonly IAutoMovieMeshDeformationField[]): (
  mesh: IAutoMovieMesh,
  influence?: readonly IAutoMovieMeshDeformationInfluence[],
) => IAutoMovieMesh {
    return createMeshDeformerImplementation(fields);
  }

  /**
   * Index a mesh for repeated axis-aligned depth queries.
   *
   * Finite query coordinates are mesh-local metres. Depth X reads Y/Z,
   * depth Y reads Z/X and depth Z reads X/Y. Covering triangles give the
   * minimum and maximum axial depth, which may be equal on one sheet.
   * A miss returns null. Winding is immaterial, shared edges are included
   * and projections with zero area are skipped. This is a surface envelope.
   *
   * The index copies its triangle coordinates. Later mesh changes leave
   * answers unchanged. Creation rejects invalid axes, malformed triangles,
   * nonfinite positions or unrepresentable projected area or bounds.
   * A read rejects nonfinite coordinates and unrepresentable interpolation.
   *
   * @param mesh Resident surface, copied into the index.
   * @param axis Depth axis.
   * @returns The synchronous depth query.
   */
  export function createMeshDepthSampler(mesh: IAutoMovieMesh, axis: "x" | "y" | "z"): IAutoMovieCreateMeshDepthSampler.IResult {
    return createMeshDepthSamplerImplementation(mesh, axis);
  }

  /**
   * Index a copied triangle mesh for repeated ray queries.
   *
   * Each ray takes a finite XYZ origin in mesh-local metres and a finite,
   * nonzero direction. The direction is normalized, including when its raw
   * norm is subnormal or exceeds binary64. Hit travel is in metres and uses
   * the closed interval from a finite nonnegative minimum (default 0) to the
   * maximum. Use positive infinity for an unbounded maximum.
   *
   * The caller may exclude original triangle ordinals. Nearest hit returns
   * the lowest ordinal among equal travels. A miss returns null through the
   * nearest operations and false through blocked. Winding is immaterial and
   * shared edges qualify for either neighbour.
   *
   * @param mesh Resident triangle mesh, copied into the index.
   * @returns Nearest travel, attributed hit and blocked reads over one index.
   * @throws Error for malformed geometry or ray queries, or unrepresentable
   *   triangle intersection arithmetic.
   */
  export function createMeshRayCaster(mesh: IAutoMovieMesh): IAutoMovieMeshRayCaster {
    return createMeshRayCasterImplementation(mesh);
  }

  /**
   * Compile conservative whole-feature separation against a copied resident mesh.
   *
   * The snapshot uses source binary64 coordinates by default. Float32 mode
   * rounds the measured coordinates but preserves the source attachment seats.
   * Original triangle ordinals remain visible in results. Open, disconnected
   * or degenerate triangle sets can serve as the resident surface.
   *
   * A query supplies a nonempty finite XYZ vertex run in the same metre frame,
   * a finite nonnegative clearance and a caller-owned nonnegative safe integer
   * work budget. Certification applies to the convex hull of the feature.
   * Positive clearance needs that full separation. Zero needs strict
   * separation or the declared attachment proof for a canonical fan.
   *
   * Full measurement returns a target-capped lower bound and attachments.
   * The decision read stops when a triangle refutes the target.
   *
   * @param mesh Resident mesh, copied into the selected representation.
   * @param representation Source coordinates or Float32 coordinates.
   * @returns Full separation and early decision reads.
   * @throws Error for malformed geometry, nonfinite represented coordinates,
   *   invalid clearance or budget, or exhausted required work.
   */
  export function createMeshSeparationQuery(mesh: IAutoMovieMesh, representation?: "source" | "float32"): IAutoMovieMeshSeparationQuery {
    return createMeshSeparationQueryImplementation(mesh, representation);
  }

  /**
   * Read nearest oriented surface distance from a copied triangle mesh.
   *
   * Closed mode is the default and requires paired, oppositely directed edges.
   * Open mode also allows rim edges. Both admit finite positions and connected
   * vertex fans, welding exact-coordinate copies. The caller supplies the
   * outward orientation and embedded geometry needed for a volume reading.
   *
   * A query takes three finite mesh-local metre coordinates. The nearest
   * feature's pseudonormal determines the sign. Equal distances select the
   * lowest original triangle ordinal. Open rim features carry a boundary flag.
   * The previous winner may seed a later query as a pruning bound.
   *
   * @param mesh Oriented triangle surface to snapshot.
   * @param options Boundary mode, closed by default.
   * @returns A nearest-point, normal, signed distance and feature query.
   * @throws Error for unsupported modes, malformed surfaces or points, and
   *   unrepresentable distance arithmetic.
   */
  export function createSignedMeshQuery(mesh: IAutoMovieMesh, options?: IAutoMovieSignedMeshQueryOptions): (point: readonly number[]) => IAutoMovieSignedMeshQueryHit {
    return createSignedMeshQueryImplementation(mesh, options);
  }

  /**
   * Prepare fixed half-plane directions for independent changing-offset queries.
   * Copy the admitted finite unit normals and compute every exact nonparallel
   * pair once. A successful polygon supplies only a cyclic active-edge seed. Its
   * next intersections must satisfy every current inequality before that seed can
   * be reused; otherwise full pair enumeration replaces it. Bounded active
   * normals and feasible cyclic corners prove the seed polygon equals the
   * intersection. Every tight nonparallel pair still receives the weak-direction
   * check. A conservative fixed-normal range certificate admits lazy coordinates
   * only when every pair is finite; uncertified offsets retain full preflight.
   * Offsets and output vertices are never cached or shared between queries.
   * Callers bound the plane population and supply bounded section charts.
   */
  export function createSupportSectionQuery(input: IAutoMovieCreateSupportSectionQuery.IInput): IAutoMovieCreateSupportSectionQuery.IResult {
    return createSupportSectionQueryImplementation(input);
  }

  /**
   * Intersect oriented unit half-planes in an admitted finite XZ chart. Enumerate
   * boundary pairs and retain intersections satisfying every inequality. Tight
   * constraints, rather than coordinate proximity, identify a common vertex. A
   * relative residual filter delegates uncertain signs to the exact-sign
   * determinant owner. Zero incidence means exact equality for the supplied
   * doubles, independently of observation uncertainty. A weak feasible pair
   * refuses. Callers supply finite dense arrays, unit normals and a bounded
   * section.
   */
  export function evaluateSupportSection(input: IAutoMovieEvaluateSupportSection.IInput): IAutoMovieEvaluateSupportSection.IResult {
    return evaluateSupportSectionImplementation(input);
  }

  /**
   * Evaluate a completed quad generating level at its existing topology.
   *
   * Each face in the input must have four corners. A level-zero quad cage
   * qualifies directly. Refine a polygonal cage once before passing its level
   * here. The result shares the level's face, position and UV buffers and
   * supplies limit positions, normals and source-face parameters.
   *
   * @param level Completed quad topology and its generating coordinates.
   * @returns Quad surface in the level's cage-local metre frame.
   * @throws Error for a nonquad input level or unresolved limit evaluation.
   */
  export function evaluateSubdivisionLevel(level: IAutoMovieSubdivisionLevel): IAutoMovieSubdivisionSurface {
    return evaluateSubdivisionLevelImplementation(level);
  }

  /**
   * Fit a manifold quad crop to authored limit points after two refinements.
   *
   * Supply finite cage-local controlling positions and optional finite limit
   * targets in metres, dense anchor flags and safe integer source-face
   * ordinals. Anchor rows constrain the source controls. A limit target
   * constrains the corresponding refined limit point. Coarse controls and
   * fine detail compose on the same refinement identities.
   *
   * The support collar and the refined surface outside the region stay fixed.
   * Active limit targets along unsupported interior creases are refused.
   * Output contains the generating level, solved coarse controls and largest
   * local equality residual. The caller checks the resulting shape and poses.
   *
   * @throws Error for invalid geometry or constraints, incomplete solves or
   *   unrepresentable fitted values.
   */
  export function fitSubdivisionDomain(props: IAutoMovieFitSubdivisionDomain.IProps): IAutoMovieFitSubdivisionDomain.IResult {
    return fitSubdivisionDomainImplementation(props);
  }

  /**
   * Fit disjoint source-face regions and compose their deltas on the joined cage.
   *
   * The requested refinement level is a whole number from 2 through 6 and
   * defaults to 2. Each nonempty region names a disjoint set of source faces,
   * with finite samples and limit targets in cage-local metres. All constraint
   * vertices must belong to the region. An empty list uniformly refines the
   * original cage and returns zero fitting residual.
   *
   * Four edge-adjacent rings support each local solve. The support collar and
   * shared boundaries stay anchored. Globally refined topology, source-face
   * parameters and indexed UVs retain their identities. The result includes
   * the largest local equality residual. The caller checks the resulting
   * shape, intersections and poses.
   *
   * @throws Error for invalid depths, geometry or regions, incomplete fits or
   *   unrepresentable fitted coordinates and residuals.
   */
  export function fitSubdivisionRegions(props: IAutoMovieFitSubdivisionRegions.IProps): IAutoMovieFitSubdivisionRegions.IResult {
    return fitSubdivisionRegionsImplementation(props);
  }

  /**
   * Integrate the strongest compact radial site field over a convex polygon.
   *
   * The caller supplies a dense finite polygon and at most 512 finite sphere
   * centres in one common length unit and an orthonormal plane frame. Site Z
   * is signed distance from the plane. The common radius is positive with
   * representable nonzero square. The field is the strongest positive
   * (1 - distance² / radius²) raised to power 2 or 3.
   *
   * Returns the unsigned footprint area, integrated scalar in squared units
   * and integrated planar gradient in length units. A degenerate footprint
   * or an empty field returns zero scalar and gradient. The caller owns
   * convexity and site selection. Estimates use binary64 arithmetic.
   *
   * @throws Error for invalid input or unrepresentable geometry arithmetic.
   */
  export function integrateRadialField(props: IAutoMovieIntegrateRadialField.IProps): IAutoMovieIntegrateRadialField.IOutput {
    return integrateRadialFieldImplementation(props);
  }

  /**
   * Intersect two convex planar polygons in one common coordinate unit.
   *
   * Sutherland-Hodgman clipping retains the subject's winding and includes the
   * clipping edges. The subject and boundary may wind either way. Inputs must be
   * finite, convex and numerically well scaled. A zero-area boundary returns
   * empty; point/line contact may return a nonempty zero-area outline. Binary64
   * arithmetic has no directed rounding or independent convexity validation.
   */
  export function intersectConvexPolygons(subject: readonly (readonly [number, number])[], boundary: readonly (readonly [number, number])[]): [number, number][] {
    return intersectConvexPolygonsImplementation(subject, boundary);
  }

  /**
   * Draw one clearance segment per witness in the supplied order.
   *
   * Each witness names three safe integer front vertices and three finite
   * weights. Its front position is their weighted sum in mesh-local metres.
   * The back position subtracts the finite signed gap on the selected X, Y
   * or Z axis. A negative gap flags the mark. The caller's anchor names the
   * shared frame, with null for world space.
   *
   * @param props The front mesh, measured axis, ordered witnesses and mark path.
   * @returns Clearance marks with owned segment points and the supplied anchor.
   * @throws Error for malformed witness data, addressing or nonfinite endpoints.
   */
  export function markMeshClearance(props: IAutoMovieMarkMeshClearance.IProps): IAutoMovieMark[] {
    return markMeshClearanceImplementation(props);
  }

  /**
   * Measure convex and concave feature edges and their nearby triangle rows.
   *
   * Supply complete finite XYZ triangles and a positive finite reach in metres.
   * Vertex addresses are safe integers in the input. Coincident positions share
   * welded edge identity. Edges with two
   * nondegenerate incident triangles and a dihedral above 30 degrees qualify.
   * The second face's centroid behind the first face marks a convex feature.
   * Each triangle stores up to sixteen edges by segment-to-triangle distance,
   * with ties resolved by feature ordinal.
   */
  export function measureFeatureEdges(props: IAutoMovieMeasureFeatureEdges.IProps): IAutoMovieMeasureFeatureEdges.IResult {
    return measureFeatureEdgesImplementation(props);
  }

  /**
   * Measure minimum front-minus-back depth over projected triangle overlap.
   *
   * Read both meshes in one metre frame. Project onto the two axes orthogonal
   * to the selected depth axis, and skip triangles of zero projected area. The
   * result in original front-triangle order contains only triangles with
   * overlap. Positive gaps are clear, zero is contact and negative reverses the
   * requested order. The optional visitor receives every overlap vertex and its
   * front barycentric weights. Invalid mesh buffers, a bad axis or overflowing
   * clearance arithmetic raise errors.
   */
  export function measureMeshClearance(front: IAutoMovieMesh, back: IAutoMovieMesh, axis: "x" | "y" | "z", visit?: (witness: IAutoMovieMeshClearanceWitness) => void): IAutoMovieMeasureMeshClearance.IResult {
    return measureMeshClearanceImplementation(front, back, axis, visit);
  }

  /**
   * Enclose each point's projection onto a stored direction in an outward rounded
   * interval, relative to an origin.
   *
   * Points, origin and direction share one metre frame. The direction is scaled
   * so its largest absolute component is one, and is taken as stored: rounding in
   * how a caller proposed it never matters, because the intervals enclose the
   * projections of the supplied points onto exactly this direction. The result
   * also carries an upper enclosure of that scaled direction's norm, so a caller
   * can turn an interval gap into a Euclidean lower bound. A zero direction
   * yields `[0, 0]` for every point and a zero norm, which proves no separation.
   * The origin defaults to the first point.
   *
   * Throws on an empty point run, a missing or non-finite coordinate in a point,
   * the origin or the direction, and, through `adjacentFloat64`, on a
   * difference or enclosure step that overflows. Projection separation and
   * attachment contact are the two consumers.
   *
   * @param points Points to project, read only.
   * @param raw Stored direction, read only.
   * @param origin Reference point the projections are measured from.
   * @returns One owned interval per point and the norm enclosure.
   */
  export function measureProjectionIntervals(points: readonly IAutoMovieVector3[], raw: IAutoMovieVector3, origin?: IAutoMovieVector3): IAutoMovieProjectionIntervals {
    return measureProjectionIntervalsImplementation(points, raw, origin);
  }

  /**
   * Find the smallest joint forward travel of the front mesh's vertices along one
   * positive axis that restores a requested clearance over a back mesh.
   *
   * `measureMeshClearance` supplies every affine overlap witness,
   * already-clear ones included; each becomes the linear constraint that the
   * barycentric blend of its front vertices' travel closes its deficit. The
   * objective is half the sum of lumped mass times squared travel, each vertex's
   * mass a third of every incident triangle's area, an approximation of the
   * surface integral that infers no elasticity or tissue force. Each vertex
   * travels between zero and its largest incident face deficit, so no point moves
   * farther than the conservative per-triangle correction. Only vertices of
   * triangles with a positive deficit get a variable; the result lists them in
   * ascending vertex order with their travel in metres, and is empty when nothing
   * needs to move. Both meshes share the caller's frame and are only read; this
   * is directional ordering, not closed-volume collision or anatomy.
   *
   * Travel is normalized by the largest cap and masses by their mean, scalar
   * changes that keep the minimizer. The solver accepts a row residual of 1e-7 in
   * normalized travel units within 40 rounds; that is solver precision, not added
   * clearance. A negative or non-finite clearance throws, as do the measurement's
   * refusals and an incomplete or infeasible solve, rather than returning the
   * conservative or a relaxed result. Callers must re-check after propagating the
   * travel through a shared skin and after Float32 export.
   *
   * @param front Mesh whose vertices move.
   * @param back Mesh it must clear.
   * @param axis Depth axis; travel is along its positive direction.
   * @param clearance Required nonnegative depth gap in metres.
   * @returns Travel per moved front vertex.
   */
  export function minimizeMeshClearance(front: IAutoMovieMesh, back: IAutoMovieMesh, axis: "x" | "y" | "z", clearance?: number): IAutoMovieMinimizeMeshClearance.IResult {
    return minimizeMeshClearanceImplementation(front, back, axis, clearance);
  }

  /**
   * Admit a surface request and construct its right-handed orthonormal basis in
   * the caller's coordinate frame. The origin is copied unchanged in metres; x is
   * the normalized projection of forward into the normal's plane, y is normal
   * cross x, and normal is the supplied direction normalized. Direction
   * magnitudes supply no scale. Every returned vector is fresh and mutable; input
   * records are read only and are not retained.
   *
   * The normal takes priority through normal-cross-forward, then
   * side-cross-normal. This is Gram-Schmidt without subtracting nearly equal
   * parallel vectors. Nonfinite coordinates, zero directions and exact zero
   * represented cross products refuse. Near-parallel directions remain sensitive
   * to binary64 rounding, including cross-product underflow; there is no angular
   * tolerance or replacement world axis. This constructs a rigid basis only,
   * without admitting a surface mesh or certifying contact/support. Preparation,
   * placement and callers aligning measured geometry share this public
   * computation owner rather than assembling another basis convention.
   *
   * @param frame Origin and two independent directions, only read.
   * @returns Fresh origin and unit x, y and normal axes with x cross y = normal.
   * @throws Error on nonfinite coordinates or zero/represented-parallel
   *   directions.
   */
  export function normalizeSurfaceFrame(frame: IAutoMovieSurfaceFrame): IAutoMovieSweepFrame {
    return normalizeSurfaceFrameImplementation(frame);
  }

  /**
   * Place a prepared rigid triangle in a destination metre frame.
   *
   * Supply all three finite offsets in original order. The normalized heading
   * and plane normal determine the basis, and the target origin provides the
   * centroid. Retain the triangle size and return three newly owned points. A
   * missing offset, nonfinite component, invalid basis or unrepresentable
   * placement raises an error. The result supplies rigid points for the
   * caller's separate support and reach checks.
   */
  export function placeSurfaceFrame(prepared: IAutoMoviePreparedSurfaceFrame, target: IAutoMovieSurfaceFrame): [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3] {
    return placeSurfaceFrameImplementation(prepared, target);
  }

  /**
   * Prepare exactly three finite, noncollinear metre points for rigid placement.
   * Their centroid is the origin, point 0 to point 1 is forward, and the ordered
   * edge cross product supplies the normal. Optional referenceNormal chooses its
   * sign; a zero, nonfinite or exactly perpendicular reference refuses. It does
   * not tilt the triangle. The result owns its coordinates independently of
   * subsequent input edits. Finite inputs whose differences or coordinates
   * overflow refuse; near-collinearity remains a binary64 conditioning limit.
   */
  export function prepareSurfaceFrame(points: readonly IAutoMovieVector3[], referenceNormal?: IAutoMovieVector3): IAutoMoviePreparedSurfaceFrame {
    return prepareSurfaceFrameImplementation(points, referenceNormal);
  }

  /**
   * Realize the public metre-valued bicubic recipe through its owning engine. The
   * polynomial kernel receives millimetres once and returns model metres.
   * Complete prior chunks survive a declared output budget; no source mesh is
   * read. Shared physical identities and actual global indices remain unchanged.
   * complete describes the retained patch domain, while approximationQualified
   * separately states whether the requested field-to-triangle estimate was met.
   * Retained coarse cells can preserve a complete domain with approximation
   * false; source-fit and normal qualifications remain independent of both
   * fields. After streaming ends, unreferenced render vertices left by a local
   * omission are compacted out. Triangle ordinals and physical domain/ID pairs
   * remain the same; only the returned render indices and source-table slots are
   * remapped. Requested triangle parameters retain actual chart coordinates per
   * corner, aligned with triangle ordinals and primitiveRanges, through that
   * compaction. A shared render vertex can have different incident chart
   * coordinates; these records are not per-vertex UV0, skin weights or semantic
   * surface addresses. Optional patch coefficients are the actual post-binding
   * kernel grids in mm, filtered to patches with retained triangles. They let
   * construction consume that same field instead of re-evaluating a pre-binding
   * recipe. Supply Boolean retention flags before work starts. An omitted or
   * false flag leaves its associated optional buffer absent. Invalid model
   * coefficients and declarations keep their admission diagnostics, and the
   * realized mesh includes the independent retained patches.
   */
  export function realizeBicubicAtlas64(input: IAutoMovieBicubicAtlasGeometry, options?: IAutoMovieRealizeBicubicAtlas64.IOptions): IAutoMovieRealizeBicubicAtlas64.IResult {
    return realizeBicubicAtlas64Implementation(input, options);
  }

  /**
   * Resolve a geometry recipe to its mesh and processing diagnostics.
   *
   * Mesh input is returned by reference. A primitive produces fresh arrays and
   * follows the dimension rule in {@link tessellate}. The default `display`
   * mode returns the retained mesh of a partially processed bicubic atlas.
   * Use `complete` to require a fully processed atlas. Completion describes
   * recipe processing.
   *
   * @param geometry The mesh, primitive or atlas recipe to resolve.
   * @param requirement Atlas processing requirement, defaulting to `display`.
   * @returns The mesh, processing completion and diagnostics.
   * @throws Error for an invalid primitive, unknown recipe or incomplete atlas
   * requested in `complete` mode.
   */
  export function realizeGeometry(geometry: IAutoMovieGeometry, requirement?: "complete" | "display"): IAutoMovieRealizeGeometry.IResult {
    return realizeGeometryImplementation(geometry, requirement);
  }

  /**
   * Compose one Catmull-Clark step over sparse source stencils.
   *
   * Supply one source stencil per vertex of the admitted topology. New maps
   * hold vertex, edge and face-point coefficients in the same order as {@link
   * refineSubdivisionPoints}. Each key addresses the original source basis.
   */
  export function refineSubdivisionStencils(topology: IAutoMovieSubdivisionTopology, source: ReadonlyArray<ReadonlyMap<number, number>>): Array<Map<number, number>> {
    return refineSubdivisionStencilsImplementation(topology, source);
  }

  /**
   * Recompute boxes inside an existing hierarchy partition.
   *
   * Supply one replacement for every original leaf entry, in the same common
   * metre frame. The callback owns the replacement records. Recompute each leaf
   * union and then each parent union. The result has new nodes and leaf arrays
   * with the original traversal layout, including entries whose current
   * geometry is degenerate.
   */
  export function refitMeshQueryHierarchy<T extends IAutoMovieMeshQueryHierarchy.IEntry, U extends IAutoMovieMeshQueryHierarchy.IEntry>(source: IAutoMovieMeshQueryHierarchy<T>, replace: (entry: T) => U): IAutoMovieMeshQueryHierarchy<U> {
    return refitMeshQueryHierarchyImplementation<T, U>(source, replace);
  }

  /**
   * Select the triangle patch on the inward side of an oriented boundary.
   *
   * Supply consistently wound manifold triangles and a loop of distinct
   * vertices winding like the selected faces. All vertex identities are
   * nonnegative safe integers. The traversal uses
   * connectivity, with each directed loop edge on its selected face. Missing
   * boundary edges, a nonseparating loop or an outside free edge raise errors.
   * Return original triangle ordinals in ascending order.
   */
  export function selectTriangleRegion(props: IAutoMovieSelectTriangleRegion.IProps): number[] {
    return selectTriangleRegionImplementation(props);
  }

  /**
   * Build sparse frozen-metric bending rows for a quad level.
   *
   * Split every quad on diagonal 0–2. Cotangent stiffness, barycentric area
   * mass and one common energy normalization define the frozen metric. A
   * degenerate triangle or a vertex with no positive area raises an error. Each
   * returned map holds the source vertex coefficients of one row.
   */
  export function subdivisionBendingRows(level: IAutoMovieSubdivisionLevel): Array<Map<number, number>> {
    return subdivisionBendingRowsImplementation(level);
  }

  /**
   * The triangle index run a mesh carries, refused rather than read past its end.
   *
   * An index array that is not a whole number of triangles, or that names a
   * vertex the mesh does not carry, would otherwise read `undefined` and emit
   * `NaN` positions and a `NaN` volume that no downstream check attributes back
   * to the malformed input. A mesh without indices is read as consecutive
   * triangles `0, 1, 2, ...` over its vertices.
   *
   * Positions are not checked for finiteness; callers that need finite
   * coordinates check them separately.
   *
   * @param mesh Mesh to read.
   * @param label Name the error messages give the mesh.
   * @returns The mesh's own `indices` array, not a copy, or a new consecutive run
   *   when it has none; callers must not mutate it.
   * @throws Error when positions are not whole xyz triples, indices are not whole
   *   triangles, or an index is not a safe integer inside the vertex range.
   */
  export function triangleIndicesOf(mesh: IAutoMovieMesh, label: string): number[] {
    return triangleIndicesOfImplementation(mesh, label);
  }

  /**
   * Count components of used triangle vertices under their exact index identity.
   * Coincident positions with different indices stay separate. Unused vertices
   * contribute no component, and an empty triangle population returns zero.
   * Coordinates, winding, area and physical-source aliases do not change this
   * index graph. The result certifies no surface manifoldness or anatomy.
   *
   * @param mesh Borrowed indexed or consecutive-triangle mesh; positions supply
   *   only the vertex count.
   * @returns Components containing at least one triangle, including degenerate
   *   triangles.
   * @throws The canonical triangleIndicesOf refusal for malformed xyz/index
   *   cardinality or out-of-range indices; coordinate finiteness is not needed
   *   for this graph.
   */
  export function countMeshComponents(mesh: IAutoMovieMesh): number {
    return countMeshComponentsImplementation(mesh);
  }

  /**
   * Locate triangle and edge defects in a borrowed indexed or nonindexed mesh.
   *
   * Use complete XYZ and corner triples, including typed arrays. Referenced
   * vertex ordinals are safe integers in range, and the positive finite weld
   * factor must place every coordinate in a finite cell. The optional positive
   * finite sliver threshold measures longest edge divided by altitude.
   * Collinear triangles on three distinct cells have infinite aspect.
   *
   * A lattice-collapsed triangle contributes a degenerate defect. Other
   * triangles expose open, inconsistent and nonmanifold edges through their
   * cell incidence. The first incident triangle owns each defective edge.
   * Defects follow triangle order, with a triangle defect before its edges and
   * edges following traversal order.
   */
  export function measureMeshDefects(mesh: IAutoMovieMeasureMeshDefects.IMesh, options?: IAutoMovieMeasureMeshDefects.IOptions): IAutoMovieMeshDefect[] {
    return measureMeshDefectsImplementation(mesh, options);
  }

  /**
   * Report every pair of a model's mesh parts whose surfaces cross, measured
   * where the parts actually sit in the model's frame.
   *
   * Each mesh part is first carried into the model frame by its own transform
   * and, when attached to a bone the rest pose resolves, by that bone's rest
   * placement, the placement `modelPartMatrices` owns; a part with
   * neither keeps its coordinates exactly. Bicubic recipes use the canonical
   * engine's retained finite mesh, including declared partial output; primitives
   * and unrecognized geometry remain outside this mesh crossing query. A pair
   * appears once, in model part order, only when at least one triangle on either
   * side is crossed, with each side's crossed triangle count and their combined
   * coplanar count. Touching is not crossing: the underlying
   * `AutoMovieEngineMeshCrossingQuery.measure` test is strict, so shells meeting
   * along a seam do not report.
   *
   * An empty result does not mean a healthy model, nor a full one a broken one. A
   * layered character rests with shells inside each other on purpose: the eyeball
   * inside the lid, lashes rooted in skin, the tongue against the teeth. What
   * carries information is the change from a rest pose, so a caller measures its
   * own rest pose once and compares. The report is geometry, not acceptance:
   * crossed triangles hidden inside a closed shell and visible once it opens look
   * the same here, and that judgement stays with rendered review.
   *
   * `withinParts` also measures each part against itself, adding before that
   * part's pairs one entry whose `part` and `other` are both that part, counting
   * its triangles that another triangle of the same part crosses. That is for a
   * continuous skin partitioned into segments, where a fold swallowing its own
   * crease is exactly the penetration the partition exists to find; the same
   * strict rules apply, so a triangle against itself and neighbours sharing an
   * edge or corner without folding are touching. Throws, naming the part, on a
   * mesh part whose index buffer is malformed, and passes on the crossing
   * measure's own refusals.
   *
   * @param model A built model, whatever composed it.
   * @param options `withinParts` also counts each part against itself.
   * @returns One entry per crossing pair, empty when nothing crosses.
   */
  export function measureModelCrossings(model: IAutoMovieModel, options?: IAutoMovieMeasureModelCrossings.IOptions): IAutoMovieModelCrossing[] {
    return measureModelCrossingsImplementation(model, options);
  }

  /**
   * Separate an ordered mesh sequence along one positive local axis, retaining
   * every shape, normal and transverse coordinate. Each earlier/later pair passes
   * an axial bound or complete projected overlap. A signed minimum g imposes
   * t[later]-t[earlier] >= clearance-g. A forward longest-path pass satisfies all
   * pair constraints without an iterative collision correction or a guessed size.
   * Translations are nondecreasing before their common half-range is subtracted;
   * the first/last translations therefore balance around zero. Already separated
   * input has zero travel. Returned meshes own their buffers.
   *
   * Mesh coordinates and nonnegative clearance use metres. Input order is the
   * requested order, not an inferred spatial sort. The same ray-parallel limit as
   * measureMeshClearance applies; this does not pack arbitrary volumes
   * around corners or preserve an external path after separation.
   *
   * @throws Error for malformed triangles, non-finite coordinates or clearance,
   *   an invalid axis, or arithmetic that exceeds finite translations or
   *   positions.
   */
  export function separateMeshSequence(meshes: readonly IAutoMovieMesh[], axis: "x" | "y" | "z", clearance?: number): IAutoMovieMesh[] {
    return separateMeshSequenceImplementation(meshes, axis, clearance);
  }

  /**
   * Refine polygon cages into ordered Catmull-Clark quads and evaluate their limits.
   *
   * Choose one through six whole refinement levels. The first level emits
   * one quad per original corner. Each later level emits four per quad.
   * Boundary edges follow edge-only interpolation and semi-sharp crease
   * weights decay as refinement proceeds.
   *
   * The returned positions and limit positions are in cage-local metres.
   * Limit normals and indexed UVs are face-varying. UV chart boundaries
   * stay pinned, and the source-face parameters retain their cage identities.
   * Unresolved normals and unrepresentable output arithmetic throw.
   *
   * @param props The authored cage and number of refinement levels.
   * @returns The generated surface with positions, normals, UVs and parameters.
   */
  export function subdivideSurface(props: IAutoMovieSubdivideSurface.IProps): IAutoMovieSubdivisionSurface {
    return subdivideSurfaceImplementation(props);
  }

  /**
   * Original ordinals of the triangles whose corners repeat a vertex on the
   * topology weld grid.
   *
   * Two corners repeat when their positions round to the same cell of the
   * engine's shared nanometre grid, `AutoMovieEngineMeshWeldGrid`, even if they are different
   * index entries, so a seam pole or a collapsed fan counts. The portrait Float32
   * gate uses these ordinals to tell an existing seam or pole from a face newly
   * collapsed by single precision, the physical partition matcher requires a
   * repartitioned mesh to keep the same population, and the human local frame
   * skips them when it checks face directions. Only the triangle population is
   * answered, without the edge incidence or signed volume of a complete topology
   * report. Positions are local metres; neither the mesh nor its connectivity is
   * changed.
   *
   * @param mesh Mesh to inspect.
   * @returns Ascending ordinals of degenerate triangles.
   * @throws Error when the index run is malformed.
   */
  export function weldedDegenerateTriangles(mesh: IAutoMovieMesh): number[] {
    return weldedDegenerateTrianglesImplementation(mesh);
  }

  /**
   * Build a boundary representation from planar convex polygonal faces.
   *
   * Extrusion, revolution and sweep each impose a shape on the result; this is
   * the general form for a solid whose faces are simply stated, such as a ridged
   * roof, a wedge or a chamfered pier, without authoring raw vertex arrays. Each
   * face owns its corners, so its flat normal stays sharp across every seam.
   * Faces are emitted in declaration order, each fanned from its first corner,
   * and the input is only read.
   *
   * Texture coordinates are local metres in a frame the face's own normal
   * decides, anchored on the mesh origin before any later mesh transform. A face
   * that is not level takes world up projected into its plane as V, so courses
   * run level and every upright face of one mesh reads the same V at the same
   * height: a wall return, a column wrap and a countertop edge continue their
   * coursing around a corner. U is the remaining in-plane axis and does not
   * continue around a corner, because continuing both axes across a fold is a
   * developed layout this kernel does not cut. A level face takes world +X as U
   * instead, so a floor and the ceiling above it mirror rather than diverge.
   * Because the frame comes from the normal and not from the corner list,
   * coplanar faces form one continuous surface however their corners were typed,
   * and the same polygon started at another corner keeps its atlas.
   *
   * The face normal is taken at the first corner that is not straight, so a
   * straight corner anywhere in the list, the first included, neither collapses
   * the normal nor refuses the face. Refused, each by its own diagnostic naming
   * the face: no faces; fewer than three corners; a non-finite corner; a face
   * whose corners are all collinear; a corner off the face's plane; a reflex
   * corner; and a ring that turns around more than once, such as a pentagram,
   * whose fan would cover ground the face does not. Convexity is required because
   * the face is fanned from its first corner. Whether the result is a closed
   * shell is the caller's to declare and `inspectMeshTopology`'s to
   * measure.
   *
   * @param faces Each face's corners in metres, counter-clockwise seen from
   *   outside.
   * @returns A mesh with flat normals and metric UVs.
   */
  export function buildPolyhedron(faces: ReadonlyArray<readonly IAutoMovieVector3[]>): IAutoMovieMesh {
    return buildPolyhedronImplementation(faces);
  }

  /**
   * Displace a subdivided surface along its normals by one height per vertex, the
   * relief that is finer than a cage can carry, such as an engraved groove or a
   * tendon's ridge.
   *
   * Each vertex moves by its height, metres, outward when positive, along its
   * limit normal, or the normalized mean of its distinct normals where a crease
   * or boundary gives it several; its limit position and its refined control
   * position move alike. Each normal then turns by the change the displacement
   * makes to the mesh's area-weighted normal there: `n + D / |D| - M / |M|`,
   * normalized, where `M` sums the area vectors of the quads that use the normal
   * before the displacement and `D` after it. This is a discrete form of Blinn's
   * (1978) perturbed normal: it adds the tilt the height's slope makes, keeps the
   * exact limit normal wherever every quad around a normal is undisplaced, and
   * agrees with the displaced shape to the mesh's resolution, so relief narrower
   * than about two faces of the subdivided mesh aliases and belongs at a finer
   * level. The orientation check is local to each normal group's aggregate area;
   * it does not certify every face orientation or global absence of
   * self-intersections. The heights usually come from a field evaluated at each
   * vertex's `locateSurfaceVertices` location, which depends on no pose,
   * so a posed surface takes the same heights.
   *
   * @param props.surface The subdivided surface, only read; the result shares its
   *   topology, UV and parameter arrays.
   * @param props.heights One height per vertex, metres, finite, positive outward.
   * @returns The displaced surface: new positions, limit positions and normals
   *   over the same topology.
   * @throws Error when the heights do not match the vertices or are not finite,
   *   or a displacement turns the quads around a normal over.
   */
  export function displaceSurface(props: IAutoMovieDisplaceSurface.IProps): IAutoMovieSubdivisionSurface {
    return displaceSurfaceImplementation(props);
  }

  /**
   * Extrude a convex XY profile along local Z into a closed triangle mesh
   * spanning `-depth / 2` to `+depth / 2`.
   *
   * The profile must be strictly convex: every point must be a hull corner, so a
   * concave, collinear, repeated or interior point is refused, as are fewer than
   * three non-collinear points, a non-finite point and a nonpositive depth. The
   * corners are re-ordered counter-clockwise from the hull's lowest-X corner.
   * Coordinates are metres; the input profile is only read.
   *
   * The result carries area-weighted vertex normals from `meshOf` and no texture
   * coordinates. Its side ring is one strip of shared vertices closed with a
   * modular index, so the vertex that starts the ring also ends it and no single
   * U could be both zero and the perimeter. `AutoMovieEnginePlanarRegion.extrude`
   * takes the same kind of profile, keeps concave outlines and holes, and lays a
   * metric atlas over the result; use it whenever the prism carries a finish.
   *
   * @param props.profile Convex outline in local XY metres.
   * @param props.depth Positive extrusion depth along local Z, in metres.
   * @returns A closed mesh with normals and no UVs.
   */
  export function extrudeProfile(props: IAutoMovieExtrudeProfile.IProps): IAutoMovieMesh {
    return extrudeProfileImplementation(props);
  }

  /**
   * Measure edge incidence and signed origin-tetrahedron volume from a mesh.
   *
   * Positions are finite metres and referenced vertices need representable weld
   * cells. Explicit physical sources retain distinct incidence at coincident
   * contacts. A lattice-collapsed face contributes its ordinal and no edges. A
   * nonempty edge set with exactly two uses per edge is watertight by
   * incidence. Volume is signed in cubic metres. An empty mesh has zero volume
   * and an empty incidence set.
   */
  export function inspectMeshTopology(mesh: IAutoMovieMesh): IAutoMovieMeshTopology {
    return inspectMeshTopologyImplementation(mesh);
  }

  /**
   * Report the topology of each piece of a mesh: its counts, boundary loops,
   * Euler characteristic, manifoldness, orientability, stored winding and genus.
   *
   * Corners are welded exactly as `inspectMeshTopology` welds them,
   * through the shared `weldMeshCorners`: on the `AutoMovieEngineMeshWeldGrid`
   * lattice, or by declared physical sources. Degenerate triangles are skipped as
   * that report skips them. The remaining triangles split into pieces connected
   * through shared edges, so a cube whose faces carry their own corners is one
   * piece while two solids touching at one corner are two. Each piece reports its
   * welded vertex, undirected edge and triangle counts, its boundary loops as
   * connected components of the edges one triangle uses, and `euler = vertices -
   * edges + faces`.
   *
   * A piece is `manifold` when every edge has one or two triangles and each
   * vertex's triangles in the piece form one fan, joined through edges at that
   * vertex. Orientability is asked of the triangles, not of their stored order: a
   * manifold piece is orientable when its triangles can be flipped so every
   * two-triangle edge is traversed oppositely, which a breadth-first
   * two-colouring decides, and it is null for a piece that is not manifold.
   * `consistentlyWound` asks whether the stored order already does so: every edge
   * shared by several triangles is traversed as often in each direction. The
   * genus, `(2 - euler - boundaryLoops) / 2` by the classification of compact
   * surfaces, is reported only for a manifold orientable piece and is null
   * otherwise.
   *
   * Pieces are ordered by their lowest triangle ordinal. A mesh without
   * non-degenerate triangles has no piece. The mesh is only read. A malformed
   * index buffer and invalid physical correspondence throw the same refusals as
   * `inspectMeshTopology`.
   *
   * @param mesh Mesh to measure.
   * @returns One record per piece, in first-triangle order.
   */
  export function measureMeshPieces(mesh: IAutoMovieMesh): IAutoMovieMeshPiece[] {
    return measureMeshPiecesImplementation(mesh);
  }

  /**
   * Place rigid members, merge them, and report the index range each one owns.
   *
   * A group is what lets one merged draw call still say which triangles are the
   * tread and which the riser, so a finish, a budget or a quantity take-off can
   * address a member after the buffers are concatenated. Groups follow member
   * order; `start` and `count` address the merged index buffer, and an unindexed
   * member counts one index per vertex.
   *
   * Each member is placed through `transformMesh` and concatenated by
   * `mergeMeshes`, so both of their coordinate rules apply here. One
   * member without UVs costs the whole assembly its atlas, and a member placed
   * with a scale keeps coordinates that no longer measure its surface. Reuse is
   * where that bites: placing one built member at several sizes is the economy
   * this function exists for and the case that falsifies a metric atlas, so place
   * a reused atlas-bearing member by translation and rotation only and build a
   * second one where the size differs.
   *
   * Throws on a repeated part id and, naming the part, on a malformed
   * index buffer, before any member is placed. Parts are only read.
   *
   * @param parts Members in merge order.
   * @returns The merged mesh and one group per member.
   */
  export function mergeMeshParts(parts: readonly IAutoMovieMeshPart[]): IAutoMovieMeshAssembly {
    return mergeMeshPartsImplementation(parts);
  }

  /**
   * Concatenate rigid meshes into one, rebasing each member's indices in declared
   * order.
   *
   * This concatenates; it is not a boolean union, and the kernel has no solid
   * union, intersection or difference. Overlapping members come back with both
   * surfaces, including the parts now inside the other, and a contact edge welded
   * by position belongs to four triangles rather than two, which
   * `validateMeshTopology` reads as non-manifold. The region replaces a boolean
   * here: `AutoMovieEnginePlanarRegion.extrude` takes an outline and its voids
   * together, so a wall less its openings or a plate less its cut-outs is one
   * solid from one description. A subtraction along a direction the section does
   * not run in, such as a niche stopping partway into a wall, is not offered at
   * all, and `buildWall` refuses the pinched case by name.
   *
   * Normals and texture coordinates survive only when every member carries them.
   * A merged buffer is read by vertex index, so a member without coordinates has
   * no honest filler: zeros would pin its surface to one texel, which reads as
   * flat paint nothing traces back to the merge, while dropping the attribute
   * makes the loss visible at the binding. RGB multipliers and relief weights
   * have an honest identity, one: a member that lacks them receives white or a
   * full weight once any member carries them, and entirely bare inputs acquire
   * neither buffer. Explicit physical source pairs survive every merge; equal
   * pairs across members assert one point and must agree on the current grid, and
   * a member without them contributes `null` entries that keep welding by
   * position. The result owns all of its buffers and metadata.
   *
   * Every member is admitted before anything is appended: a skinned member, an
   * index buffer that is ragged or names a missing vertex, and a normal, UV,
   * colour or relief buffer not aligned to the member's vertices each throw,
   * naming the member's position in the list.
   *
   * @param meshes Rigid members in merge order, only read.
   * @returns One mesh with every member's triangles.
   */
  export function mergeMeshes(meshes: readonly IAutoMovieMesh[]): IAutoMovieMesh {
    return mergeMeshesImplementation(meshes);
  }

  /**
   * Revolve a radius/height profile around local Y into a closed surface.
   *
   * Each profile point is `x` = radius and `y` = height, in metres. Unlike
   * extrusion and sweep, the meridian is taken as authored rather than hulled, so
   * an arbitrary silhouette polyline is allowed here; only its radii must be
   * non-negative. Profile order owns the surface orientation, and every output
   * buffer is new.
   *
   * Closure follows the meridian and is the caller's to declare: a meridian that
   * starts and ends on the axis closes into a solid whose pole rings collapse to
   * zero-area triangles, and one that does not is an open tube with a rim at each
   * end. Neither is repaired.
   *
   * The surface carries a metric atlas measured the way its siblings measure
   * theirs: distance travelled around the section against distance travelled
   * along the path. Around is the arc the vertex actually sits on, `theta` times
   * its own radius, so a baluster turned to a 0.3 m radius shows 1.88 m of grain
   * around it rather than one turn of an image stretched to fit it. Along is the
   * meridian's own polyline length, which is slant distance on a cone and
   * developed height on a cylinder rather than the shortcut through the axis.
   *
   * Around runs against the direction the lattice is built in, and that is the
   * whole reason it is written `2 * pi - theta` rather than `theta`. The outward
   * normal this winding produces, the meridian running up, and `theta` running
   * round form a left-handed triple, so an atlas keyed on `theta` directly comes
   * out mirrored against every other builder here: a letter reads backwards, and
   * a normal map's tangent basis is handed the wrong way, which tilts the
   * lighting rather than merely the image. Reversing the axis that closes on
   * itself costs nothing an author can name, because which way round a surface of
   * revolution is traversed carries no authored meaning, while reversing the
   * meridian instead would put `v = 0` at whichever end of the profile was typed
   * last.
   *
   * The lattice carries a duplicate ring at `theta = 2 * pi`, which is what makes
   * the seam an honest cut: one edge of the seam reads zero and the other reads
   * the full circumference at that radius, so the closing quad never interpolates
   * backwards through the atlas. Those two phases coincide only when the declared
   * texture repeat divides that circumference; the kernel does not stretch a
   * finish to hide a mismatched seam. A changing radius also makes the surface
   * non-developable in general. Scaling by radius preserves local circumference
   * scale on every parallel and therefore shears the flat atlas between unequal
   * parallels instead of pretending one global isometry exists. A meridian point
   * on the axis is a pole, and its whole ring reads zero around, because a circle
   * of no radius has no arc to travel. Its collapsed triangles remain the
   * topology this operator declares; their UVs stay finite, and they are the one
   * place the atlas has no handedness to report. The duplicate seam vertices
   * share their accumulated face normals before normalization, and every
   * duplicate of an axis pole shares that pole's normal as well, so the UV cut
   * does not introduce a lighting discontinuity.
   *
   * How far that shear goes decides what finish the surface can carry. The map is
   * exactly equiareal, its Jacobian determinant one everywhere, so the whole
   * distortion is pure shear of `2 * pi - theta` times `dr / ds`. Worst
   * anisotropy over a full turn is therefore `(sqrt(k * k + 4) + k) / (sqrt(k *
   * k
   *
   * - 4. - K)`at`k = 2 * pi * |dr / ds|`: 1.0 on a cylinder, 2.0 at 6.5 degrees off the
   *                 axis, 4.0 at 13.8 degrees, 21.5 on a 45-degree cone, and 41
   *                 where the meridian runs level, which is what a dome's pole
   *                 and a cone's tip approach. A tile that reads square beside
   *                 the seam is drawn into a ribbon a quarter turn away, and the
   *                 curve of constant `u` spirals instead of following a
   *                 meridian.
   *
   * That is the price of the metric statement rather than a defect awaiting
   * repair. Measuring true arc around forces `u` to be `theta * r` plus some
   * `c(s)`, whose derivative would have to be `-theta * dr / ds` to cancel the
   * shear, and no function of `s` alone does that at every `theta`. Choosing
   * `c(s)` only moves where the shear vanishes, which is why it sits at the seam
   * here; centring it would halve the worst case to 11.8 at a pole, still far
   * past readable. The pole is not a second fault: cut the tip off a cone and the
   * frustum that remains shears exactly as hard, so the collapsed pole triangles
   * above are a topology note rather than the cause.
   *
   * A directional finish therefore wants a meridian within a few degrees of the
   * axis, which is a drum, a shaft, a turret barrel. A sloped or domed form that
   * must carry one is authored as flat faces through
   * {@link buildPolyhedron}, whose per-face frame is isometric, or as a
   * flat cap through {@link AutoMovieEnginePlanarRegion.extrude}, and a spire
   * built as facets is how a spire is built anyway. {@link meshSweep} is
   * not the escape here that it is for the coordinate-less builders. It measures
   * this same pair, a tapered loft shears the same way, and it gives up something
   * this one keeps: the map here is exactly equiareal, while a loft's `v` is path
   * distance rather than surface distance, so a taper or a bend costs it texel
   * density on top of the angle. Where the form has to stay a true surface of
   * revolution, the finish on it stays non-directional.
   *
   * @param props.profile Meridian points from one end to the other, at least two,
   *   with finite coordinates and `x >= 0`.
   * @param props.segments Angular divisions of the full turn, a safe integer of
   *   at least 3.
   * @returns A new unskinned mesh of `(segments + 1) * profile.length` vertices
   *   and `2 * segments * (profile.length - 1)` triangles, with smooth normals
   *   and the metric atlas above.
   * @throws Error when the profile has fewer than two points, a coordinate is not
   *   finite, a radius is negative, or `segments` is not a safe integer of at
   *   least 3.
   */
  export function revolveProfile(props: IAutoMovieRevolveProfile.IProps): IAutoMovieMesh {
    return revolveProfileImplementation(props);
  }

  /**
   * Admit a polygon cage as a copied subdivision level zero.
   *
   * Positions are complete finite XYZ triples in metres. Every polygon has
   * at least three distinct safe integer vertex ordinals and belongs to a
   * consistent manifold fan. Creases join existing edges with finite
   * sharpness from 0 through 10. Optional UV pairs are finite and provide
   * one valid UV ordinal per face corner.
   *
   * Quad corners use their unit-square parameters. Other polygons keep one
   * sub-face address per corner at (0, 0) for the first refinement.
   *
   * @param cage The original control polygons and optional crease and UV data.
   * @returns The level-zero positions, topology, UVs and parameter arrays.
   * @throws Error for malformed storage, geometry, ordinals or topology.
   */
  export function admitSubdivisionCage(cage: IAutoMovieSubdivisionCage): IAutoMovieSubdivisionLevel {
    return admitSubdivisionCageImplementation(cage);
  }

  /**
   * Build the convex hull of a point set as one closed outward mesh.
   *
   * The hull's faces are the supporting planes `physicalHullFaces` finds, each
   * with its loop counter-clockwise seen from outside, and
   * `buildPolyhedron` fans each loop from its first corner with a flat
   * normal and metric UVs. Archetype convex cells and the form expectation
   * check's hull mutant are both this mesh. Points within the hull's coplanarity
   * tolerance of a face lie on it, so a flat ring of many points makes one face.
   * The points are read, and `physicalHullFaces` remembers the hull of this very
   * array, so the array must not change after this call.
   *
   * @param points Points in metres, spanning positive volume.
   * @returns The hull as a closed mesh, in the points' frame.
   * @throws {Error} When the points span no volume: fewer than four points, all
   *   of them in one plane, or a coordinate that is not finite, which leaves the
   *   hull search no finite tolerance.
   */
  export function buildConvexHull(points: readonly IAutoMovieVector3[]): IAutoMovieMesh {
    return buildConvexHullImplementation(points);
  }

  /**
   * Build a rectangular wall in local XY, depth along Z, with rectangular door
   * and window openings cut through it.
   *
   * The wall is partitioned at every opening edge, the cells an opening covers
   * are dropped, and each standing cell emits only the faces no standing
   * neighbour hides. Openings are therefore real holes in beauty, depth, normal
   * and mask passes rather than metadata over an uncut wall, and the standing
   * wall is a closed 2-manifold: a union of one box per cell would leave an
   * interior face between every adjacent pair, an edge shared by four triangles
   * that `validateMeshTopology`, and so `validateModel`, refuses, plus triangles
   * no camera reaches that a budget still counts.
   *
   * Every cell corner is a lattice coordinate minus one half-extent, so the face
   * two adjacent cells share reads the same pair of doubles from both sides and
   * welds exactly. The result is centred on the wall and spans `-depth / 2` to
   * `+depth / 2`; it carries flat per-face normals and no texture coordinates,
   * because which cell a point belongs to depends on the opening list, and an
   * atlas laid on that lattice would shift whenever an opening moves.
   * `AutoMovieEnginePlanarRegion.extrude`, with the panel as its outer ring and
   * the openings as holes, is the atlas-bearing form that also cuts arbitrary
   * outlines.
   *
   * All openings are admitted before the lattice is built, so a refusal never
   * leaves a partial mesh. Refused: a nonpositive or non-finite wall size; an
   * opening with a repeated id, a non-finite origin, a nonpositive size, or a
   * rectangle outside the wall; two overlapping openings; openings meeting only
   * at a corner, which would pinch the wall to a line that needs a general
   * boolean this kernel does not have; and openings that remove the whole wall.
   * Opening records are only read.
   *
   * @param props.width Wall width along X in metres.
   * @param props.height Wall height along Y in metres.
   * @param props.depth Wall thickness along Z in metres.
   * @param props.openings Rectangles to cut, in wall-local metres from the
   *   bottom-left corner.
   * @returns A closed mesh with flat normals and no UVs.
   */
  export function buildWall(props: IAutoMovieBuildWall.IProps): IAutoMovieMesh {
    return buildWallImplementation(props);
  }

  /**
   * Build oriented edge and vertex-fan tables for admitted polygon rows.
   *
   * Face offsets include the final corner count. Within each row use distinct
   * valid vertex indices. Edges follow first occurrence in face and corner
   * order. The fan follows the opposite corner across each entering edge.
   * Boundary edges have sharpness 10, and the interior callback measures each
   * remaining edge once. Inconsistent edge winding, excess incident faces,
   * isolated vertices and disconnected vertex fans raise errors. The result
   * borrows the input row arrays.
   */
  export function buildSubdivisionTopology(vertexCount: number, faceOffsets: number[], faceVertices: number[], sharpnessOf: (a: number, b: number) => number): IAutoMovieSubdivisionTopology {
    return buildSubdivisionTopologyImplementation(vertexCount, faceOffsets, faceVertices, sharpnessOf);
  }

  /**
   * Check a form against the expectation written before measuring it, and run the
   * same shape expectation against the form's box and hull, which it must
   * reject.
   *
   * Every part is realized and placed in the model frame as
   * `measureModelContacts` places it, and the placed parts are merged
   * into one mesh by concatenation. Each given field is then measured: `size`
   * from the merged positions' axis-aligned extents, `pieces` and `genera` from
   * `measureMeshPieces`, `solid` and `empty` from
   * `createMeshWindingQuery`, and `pairs` from
   * `measureModelContacts` with the expectation's `contact`. Each
   * failure becomes one finding naming its field, its subject and the measured
   * value against the expected one.
   *
   * The shape fields, every field but `pairs` and `contact`, also run on two
   * one-part mutants built from every placed vertex: the 12-triangle axis-aligned
   * box and the convex hull from `buildConvexHull`. Their failures are
   * findings with subject `box` or `hull`. A mutant that fails no given shape
   * field and is not listed in `matches` is `loose`: the expectation cannot tell
   * it from the form, so it says too little. An expectation with no shape field
   * therefore reports both mutants loose, and the mutants are not built. The form
   * passes when no finding names the form and `loose` is empty.
   *
   * The model is only read. Throws when `pairs` is given without `contact`, when
   * a pair names a part the model lacks or one part twice, when a shape field
   * needs the hull of placed vertices that span no volume, and passes on the
   * refusals of the realization, placement, winding query and contact report.
   *
   * @param model A built model, whatever composed it.
   * @param expectation What the form must be.
   * @returns The findings and the loose mutants.
   */
  export function checkFormExpectation(model: IAutoMovieModel, expectation: IAutoMovieFormExpectation): IAutoMovieFormCheck {
    return checkFormExpectationImplementation(model, expectation);
  }

  /**
   * Refuse a discrete sampling count that is not a safe integer of at least
   * `least`, such as the segment count of a revolved profile.
   *
   * `label` names the count in the thrown message, which reads `<label> must be a
   * safe integer >= <least>`. The check runs before the builder allocates any
   * buffer sized by the count.
   *
   * @param value Count the author supplied.
   * @param least Smallest count the operation can build from.
   * @param label Name of the count in the diagnostic.
   */
  export function countAtLeast(value: number, least: number, label: string): void {
    countAtLeastImplementation(value, least, label);
  }

  /**
   * Snapshot a triangle surface for generalized winding queries in metres.
   *
   * Supply three finite XYZ coordinates as a point in the same frame as the
   * mesh. Nonfinite mesh positions, query coordinates or winding raise errors.
   * The winding value is the signed sum of triangle solid angles divided
   * by 4π. The surface flag includes triangle edges and corners within the
   * plane-test tolerance of 1e−9 times the triangle's doubled area. Inside
   * requires a point off the surface and absolute winding at least one half.
   * This classification also applies to open patches or multiple shells and
   * keeps the sign of reversed winding.
   */
  export function createMeshWindingQuery(mesh: IAutoMovieMesh): ((point: readonly number[]) => IAutoMovieMeshWinding) {
    return createMeshWindingQueryImplementation(mesh);
  }

  /**
   * The sharpness an edge's two halves carry after one refinement step.
   *
   * DeRose, Kass and Truong (1998) lower a semi-sharp edge's sharpness by one per
   * step, never below zero, so sharpness `s` keeps the sharp rules for `s` steps;
   * the infinitely sharp value 10 never decays.
   *
   * @param sharpness Parent sharpness from 0 to 10.
   * @returns Child sharpness from 0 to 10.
   */
  export function decaySubdivisionSharpness(sharpness: number): number {
    return decaySubdivisionSharpnessImplementation(sharpness);
  }

  /**
   * Create four new, empty attribute buffers for a flat-shaded procedural builder
   * to append to.
   *
   * Each call returns arrays no other caller holds, so two builders running in
   * one call stack never write into each other's mesh. The builder returns the
   * filled target as its mesh, handing the arrays over without a copy.
   *
   * @returns Empty positions, normals, UVs and indices.
   */
  export function emptyMeshTarget(): IAutoMovieMeshTarget {
    return emptyMeshTargetImplementation();
  }

  /**
   * Evaluate the limit position and face-varying limit normals of every vertex of
   * a level.
   *
   * A vertex's limit is the limit of its child, so the level's points are refined
   * once without building the next level's connectivity, and each vertex reads
   * its child's quad one-ring from them: its vertex point, the edge points of its
   * fan edges and the face points of its fan faces. That ring is all quads even
   * when the level has other polygons. While any ring edge keeps a semi-sharp
   * sharpness between 0 and 10, the ring is refined on its own, so a crease that
   * outlasts the requested level still rounds off in the limit exactly as further
   * refinement would; at most ten such steps are needed. `limitSubdivisionRing`
   * then applies the limit masks.
   *
   * Normals are numbered vertex by vertex, sector by sector in fan order, and
   * each corner names the normal of the sector its face belongs to.
   *
   * @param level The final level.
   * @returns Packed limit positions, packed unit normals, and each corner's
   *   normal index.
   */
  export function limitSubdivisionLevel(level: IAutoMovieSubdivisionLevel): IAutoMovieLimitSubdivisionLevel.IResult {
    return limitSubdivisionLevelImplementation(level);
  }

  /**
   * The limit position of a ring's vertex and one limit normal per sector of
   * faces between its infinitely sharp edges.
   *
   * Every edge must be smooth (0) or infinitely sharp (10); `stepSubdivisionRing`
   * spends any semi-sharp remainder first. A vertex with no sharp edge is smooth:
   * its limit is `(n^2 C + 4 sum E + sum D) / (n (n + 5))` and its tangents are
   * the cosine and sine masks with `A = 1 + cos(2 pi / n) + cos(pi / n) sqrt(2
   * (9
   *
   * - Cos(2 pi / n)))`on the edges and`cos(2 pi i / n) + cos(2 pi (i + 1) / n)`on
   *   the diagonals (Halstead, Kass and DeRose 1993), giving one normal. A dart,
   *   with one sharp edge, has another subdivision matrix, so its limit and
   *   tangents come from that matrix's eigenvectors
   *   through`subdivisionRingEigenbasis`. An interior vertex of valence two has
   *   no tangent plane and is refused, as is any vanishing or non-finite normal.
   *
   * With two sharp edges the vertex is on a crease, whose limit is the B-spline
   * point `(A + 4 C + B) / 6` of the crease neighbours. Each side's normal
   * crosses the crease tangent with a cross tangent into that side. For a side of
   * two faces this is the regular B-spline cross derivative, exact. A side of
   * three faces refines on its own as a boundary ring whose dominant tangent
   * eigenvalues, about 0.580 across and 0.5 along the crease, stand clear of the
   * next, 0.410, so its exact tangents come from `subdivisionRingEigenbasis`.
   * Other sides take OpenSubdiv's masks, Biermann, Levin and Zorin's (2000) for
   * four or more faces and the vertex-to-mean-of-crease-neighbours mask for one
   * face. Those are approximations with no exact replacement: under the standard
   * crease rules a side of four faces has a tie for its second tangent eigenvalue
   * and a wider side has two dominant eigenvalues above the crease's 0.5, while a
   * side of one face has a degenerate parametrisation, so the limit surface has
   * no tangent plane containing the crease there.
   *
   * With three or more sharp edges the vertex is a corner and stays put; each
   * sector's normal crosses the tangents of its two bounding crease curves, which
   * leave the corner along their edges, oriented by the sector's own winding. A
   * corner sector whose two crease curves leave in one line has no tangent plane
   * the curves determine, and takes the winding-weighted normal of its ring quads
   * instead.
   *
   * @param ring A one-ring whose sharpness is only 0 or 10.
   * @param vertex Vertex index, for the diagnostic.
   * @returns The limit position, the unit normal of each sector, and each ring
   *   face's sector.
   */
  export function limitSubdivisionRing(ring: IAutoMovieSubdivisionRing, vertex: number): IAutoMovieLimitSubdivisionRing.IResult {
    return limitSubdivisionRingImplementation(ring, vertex);
  }

  /**
   * Report how every pair of a model's parts meets: crossing, contained, touching
   * or apart, with the least gap between their surfaces and how much of each lies
   * inside the other.
   *
   * Every part is realized through `realizeGeometry`, primitives
   * included, and carried into the model frame by `placeModelPartMesh`
   * with its `modelPartMatrices` entry, as
   * `measureModelCrossings` places its parts. One record follows for
   * every unordered pair, in model part order. A pair crosses when
   * `AutoMovieEngineMeshCrossingQuery.measure` finds a transverse or coplanar
   * crossing in either direction, which it can only where the two placed boxes
   * overlap. The gap is 0 for a crossing pair and otherwise the least distance
   * between the surfaces by `measureMeshGap`, for every pair however far
   * apart. Each share is the area of one part's triangles whose centroids the
   * other part's winding query, `createMeshWindingQuery`, finds
   * `inside`, divided by the part's whole area; one centroid stands for each
   * triangle, so a share resolves at the triangle size. A centroid too far from
   * the other part for its winding number to reach 0.5, by an exact solid-angle
   * bound, is decided without a query. The relation is the first that applies:
   * `crossing`; `contained` when either share is exactly 1; `touching` when the
   * gap is at most `options.contact`; `apart` otherwise.
   *
   * A gap below the contact distance keeps two faces from being coplanar, which
   * the strict crossing test may otherwise count as a coplanar crossing where the
   * faces are triangulated along different diagonals. The model is only read.
   * Throws on a missing, negative or non-finite contact distance, on a part whose
   * index buffer is malformed, whose positions are not finite or that has no
   * triangle, naming the part, and passes on the realization's and the crossing
   * measure's own refusals.
   *
   * @param model A built model, whatever composed it.
   * @param options The contact distance in metres.
   * @returns One record per unordered part pair, in model part order.
   */
  export function measureModelContacts(model: IAutoMovieModel, options: IAutoMovieMeasureModelContacts.IOptions): IAutoMovieModelContact[] {
    return measureModelContactsImplementation(model, options);
  }

  /**
   * Wrap a procedural builder's positions and indices as a rigid mesh whose
   * vertex normals are computed from its own triangles.
   *
   * Each vertex normal is the normalized sum of its incident triangles'
   * unnormalized face normals, so larger faces weigh more and the winding decides
   * the side. `normalGroups` lists vertices that duplicate one smooth point at a
   * texture seam; their sums are pooled before normalizing so the seam carries
   * one normal while its positions and UVs stay separate. A vertex no triangle
   * uses keeps the zero vector. The arrays passed in become the mesh's own and
   * must not be reused by the caller; indices are trusted, since every caller
   * generates them.
   *
   * @param positions Packed XYZ positions in metres, adopted by the mesh.
   * @param indices Triangle corner indices, adopted by the mesh.
   * @param uvs Packed UVs adopted by the mesh, or `null` for none.
   * @param normalGroups Vertex sets that share one smooth normal.
   * @returns A mesh with computed normals and no skin.
   */
  export function meshOf(positions: number[], indices: number[], uvs?: number[] | null, normalGroups?: readonly (readonly number[])[]): IAutoMovieMesh {
    return meshOfImplementation(positions, indices, uvs, normalGroups);
  }

  /**
   * Twice the signed area of the triangle `origin -> from -> to`, in square
   * metres: positive for a counter-clockwise turn, negative for clockwise, and
   * zero for collinear points.
   *
   * It is the free-form region kernel's raw orientation measure; callers compare
   * it against the absolute `AutoMovieEnginePlanarEpsilon`. The architecture graph's
   * `planarSide` asks the same question with a tolerance that grows with the
   * figure, which is why the two are not merged.
   *
   * @param origin Shared corner of both edges.
   * @param from End of the first edge.
   * @param to End of the second edge.
   * @returns `(from - origin) x (to - origin)`.
   */
  export function planarCross(origin: IAutoMoviePlanarPoint, from: IAutoMoviePlanarPoint, to: IAutoMoviePlanarPoint): number {
    return planarCrossImplementation(origin, from, to);
  }

  /**
   * Whether two closed segments share any point, touching included.
   *
   * Touching counts because a region whose rings meet at one point is not two
   * regions with a shared corner; it is a surface pinched to a line, the same
   * shape `buildWall` refuses when two openings meet at a corner. A
   * proper crossing needs each segment's endpoints on strictly opposite sides of
   * the other's line, each side more than `AutoMovieEnginePlanarEpsilon` from zero; otherwise
   * the segments meet when an endpoint of one is collinear with the other within
   * that absolute tolerance and its projection parameter lies in [0, 1] widened
   * by the same constant. A zero-length segment never reports a touch through its
   * own projection.
   *
   * @param fromA First endpoint of the first segment.
   * @param toA Second endpoint of the first segment.
   * @param fromB First endpoint of the second segment.
   * @param toB Second endpoint of the second segment.
   * @returns True when the closed segments share a point within tolerance.
   */
  export function planarSegmentsMeet(fromA: IAutoMoviePlanarPoint, toA: IAutoMoviePlanarPoint, fromB: IAutoMoviePlanarPoint, toB: IAutoMoviePlanarPoint): boolean {
    return planarSegmentsMeetImplementation(fromA, toA, fromB, toB);
  }

  /**
   * Classify an off-edge point by the even-odd rule in a closed XY ring.
   *
   * The last corner joins the first. Either winding gives the same answer.
   * Apply the required boundary policy before calling this classifier.
   *
   * @param point Finite off-edge point in the ring's frame and units.
   * @param ring Finite corners in ring order.
   * @returns True when the ray crosses the ring an odd number of times.
   */
  export function pointInPlanarRing(point: IAutoMoviePlanarPoint, ring: readonly IAutoMoviePlanarPoint[]): boolean {
    return pointInPlanarRingImplementation(point, ring);
  }

  /**
   * Append one triangle that owns its three corners and its own plane normal.
   *
   * A lofted quad is only planar when its two sections match, so the two halves
   * of a changing section's quad genuinely face different ways. Giving each
   * triangle its own corners is what lets each carry the normal its own plane
   * has, instead of one averaged direction that neither half points in.
   *
   * The normal is `(b - a) x (c - a)` normalized, so corners in counter-clockwise
   * order seen from outside give an outward normal. A zero-area triangle has no
   * plane and receives the zero vector as its normal.
   *
   * @param target Buffers to append to; three vertices and one triangle are
   *   added.
   * @param corners Each corner's position in metres with its metric `u` and `v`,
   *   in winding order.
   */
  export function pushFlatTriangle(target: IAutoMovieMeshTarget, corners: readonly [
    readonly [IAutoMovieVector3, number, number],
    readonly [IAutoMovieVector3, number, number],
    readonly [IAutoMovieVector3, number, number],
  ]): void {
    pushFlatTriangleImplementation(target, corners);
  }

  /**
   * Refine one admitted subdivision level into quads.
   *
   * Each parent corner creates one child quad in parent winding: vertex,
   * outgoing edge, face point and incoming edge. The two halves of a parent
   * edge inherit its decayed interior sharpness. Quad charts transfer corners,
   * midpoints and the centroid. Each nonquad cage corner starts its own
   * unit-square chart. Admitted UV rows follow the corresponding refinement,
   * and absent UVs stay absent.
   */
  export function refineSubdivisionLevel(level: IAutoMovieSubdivisionLevel): IAutoMovieSubdivisionLevel {
    return refineSubdivisionLevelImplementation(level);
  }

  /**
   * Compute vertex, edge and face points for one Catmull-Clark step.
   *
   * Read packed XYZ triples in the admitted topology's vertex order. Place new
   * vertices first, then edges and faces in their original orders. Face points
   * average corners, edge points blend a smooth four-point average with the
   * endpoint midpoint, and vertex points use the fan's sharpness mask. The
   * output also returns each vertex mask in vertex order.
   */
  export function refineSubdivisionPoints(topology: IAutoMovieSubdivisionTopology, positions: readonly number[]): IAutoMovieRefineSubdivisionPoints.IResult {
    return refineSubdivisionPointsImplementation(topology, positions);
  }

  /**
   * Apply one Catmull-Clark step to face-varying UVs with every UV boundary
   * pinned, OpenSubdiv's `FVAR_LINEAR_BOUNDARIES`.
   *
   * An edge is UV-continuous when it has two faces that name the same UV values
   * at both ends; a mesh boundary edge or a seam is a UV boundary. A UV value at
   * a vertex touching any UV boundary keeps its value, a UV boundary edge gives
   * each side the midpoint of that side's two values, and everything else follows
   * the same rules and masks as the positions, so creases sharpen UVs alike. Each
   * chart's boundary therefore stays the piecewise-linear polygon of its cage UVs
   * at every level while its interior smooths with the surface.
   *
   * Child values are numbered as positions are: one per parent UV value, then one
   * per continuous edge or one per side of a UV boundary edge in edge order, then
   * one per face. Child corner `4 c + j` belongs to the child quad of parent
   * corner `c`, in the order vertex, out-edge, face, in-edge.
   *
   * @param topology Connectivity of the current level.
   * @param uvs Packed UV values of the current level.
   * @param cornerUvs UV value of every corner.
   * @param masks Vertex masks the positions used, one per vertex.
   * @returns Packed next-level UV values and the UV value of every child corner.
   */
  export function refineSubdivisionUvs(topology: IAutoMovieSubdivisionTopology, uvs: readonly number[], cornerUvs: readonly number[], masks: readonly IAutoMovieSubdivisionVertexMask[]): IAutoMovieRefineSubdivisionUvs.IResult {
    return refineSubdivisionUvsImplementation(topology, uvs, cornerUvs, masks);
  }

  /**
   * Signed area enclosed by a closed planar ring, positive when the ring runs
   * counter-clockwise in its `x, y` plane.
   *
   * The last point joins back to the first. Coordinates are metres, so the result
   * is square metres; a self-crossing ring returns the net of its oppositely
   * wound lobes, and fewer than three points return zero.
   *
   * @param points Ring corners in order.
   * @returns Signed area in square metres.
   */
  export function signedArea(points: readonly IAutoMovieProfilePoint[]): number {
    return signedAreaImplementation(points);
  }

  /**
   * Refine the centre of an admitted quad one-ring and its neighbours.
   *
   * Centre, ordered edge neighbours and diagonal points retain their ring
   * layout. Each child diagonal averages the corresponding parent quad. The
   * edges and centre follow the Catmull-Clark sharpness rules, and the returned
   * edge sharpness values decay for the next step.
   */
  export function stepSubdivisionRing(ring: IAutoMovieSubdivisionRing): IAutoMovieSubdivisionRing {
    return stepSubdivisionRingImplementation(ring);
  }

  /**
   * How much of the smooth Catmull-Clark edge rule an edge of the given sharpness
   * takes; the rest is the sharp midpoint rule.
   *
   * DeRose, Kass and Truong (1998) use the sharp rule for sharpness of one or
   * more and interpolate linearly between the smooth and sharp edge points for a
   * fractional sharpness below one, so the smooth share is `1 - s` there and zero
   * from one upwards, including boundary edges at 10.
   *
   * @param sharpness Edge sharpness from 0 to 10.
   * @returns The weight of the smooth edge point, from 0 to 1.
   */
  export function subdivisionEdgeSmoothness(sharpness: number): number {
    return subdivisionEdgeSmoothnessImplementation(sharpness);
  }

  /**
   * Estimate the limit point and tangent span of an admitted stationary quad
   * ring.
   *
   * Use sharpness 0 or 10 so the subdivision rule stays fixed. Affine iteration
   * gives the limit point, and two iterated zero-sum masks yield tangent
   * vectors. The vectors span the tangent plane without a prescribed
   * orientation or magnitude.
   */
  export function subdivisionRingEigenbasis(ring: IAutoMovieSubdivisionRing): IAutoMovieSubdivisionRingEigenbasis.IResult {
    return subdivisionRingEigenbasisImplementation(ring);
  }

  /**
   * Compute the Catmull-Clark centre, edge and face weights for one fan.
   *
   * Use ordered incident sharpness values and the number of face points in the
   * fan. Zero or one sharp edge selects the smooth rule. Two select a crease
   * with weights 3/4, 1/8 and 1/8. Three or more retain the corner. If
   * sharpness decay changes rules, blend them using the mean of the sharpness
   * values that turn smooth, capped at one.
   */
  export function subdivisionVertexMask(sharpness: readonly number[], faceCount: number): IAutoMovieSubdivisionVertexMask {
    return subdivisionVertexMaskImplementation(sharpness, faceCount);
  }

  /**
   * Build indexed triangles for a primitive from its dimensions.
   *
   * Authored dimensions must be finite and strictly positive. Positions are
   * local metres around the origin, with winding counterclockwise as seen
   * from outside. Curved primitives use sixteen angular segments. The sphere
   * uses twelve latitude intervals, and a capsule adds its cylindrical height
   * between the hemispheres. A plane uses the zero-height box topology.
   * Extreme finite dimensions can overflow derived geometry arithmetic.
   *
   * @param shape The primitive and its dimensions in metres.
   * @returns Fresh arrays for positions, normals and triangle indices.
   * @throws RangeError for a nonfinite or nonpositive authored dimension.
   * @throws TypeError for an unknown primitive discriminator.
   */
  export function tessellate(shape: IAutoMoviePrimitiveShape): IAutoMovieTessellation {
    return tessellateImplementation(shape);
  }

  /**
   * Tessellate exactly the support surface that engine height queries read.
   *
   * The footprint is taken as the convex pieces whose union is the region itself,
   * so an L-shaped plate keeps its notch and a slab with an atrium void is drawn
   * with the void open. Drawing the hull instead would put floor under a camera
   * looking down the atrium while `surfaceContains` said there was none, which is
   * the same disagreement between the drawn ground and the queried ground that
   * this function exists to prevent.
   *
   * Level and planar patches fan each piece. Heightfields split each piece at
   * every lattice coordinate inside its plan bounds, clip each lattice cell
   * against the piece, and evaluate every resulting vertex through
   * {@link surfaceHeightAt}. Every vertex therefore sits exactly on the bilinear
   * rule that feet and placement queries obey; inside a cell the drawn surface is
   * the fan's planar interpolation of those vertices, which departs from the
   * bilinear patch where a cell is twisted.
   *
   * Positions are world metres with Y up, triangles face +Y, and vertices with
   * identical plan coordinates are shared, so their normals are the normalized
   * sum of the incident face normals.
   *
   * @param surface Support surface to draw.
   * @returns A new indexed mesh, or `null` when the footprint encloses no area.
   */
  export function tessellateSurface(surface: IAutoMovieSurface): IAutoMovieTessellation | null {
    return tessellateSurfaceImplementation(surface);
  }

  /**
   * Convert a primitive to an indexed {@link IAutoMovieMesh}.
   *
   * Uses {@link tessellate} for admission and geometry. The mesh has normals
   * and null UV and skin fields.
   *
   * @param shape The primitive and its dimensions in metres.
   * @returns A new mesh with caller-owned arrays.
   * @throws RangeError for a nonfinite or nonpositive authored dimension.
   * @throws TypeError for an unknown primitive discriminator.
   */
  export function tessellateToMesh(shape: IAutoMoviePrimitiveShape): IAutoMovieMesh {
    return tessellateToMeshImplementation(shape);
  }

  /**
   * Place an unskinned mesh by per-axis scale, unit quaternion and metre
   * translation.
   *
   * Positions and normals must be finite triples. Scale is finite and nonzero
   * per axis, and rotation's norm may differ from one by at most 1e-6. Normals
   * take inverse scale and rotation before normalization. Reflection reverses
   * triangle winding, and finite zero normals remain zero. The result owns its
   * arrays and carries the supplied UVs, colours, relief weights and physical
   * correspondence. Aliases are checked before and after placement.
   *
   * UVs retain their original chart values. For finishes expressed in metres,
   * build at the intended size and use rigid translation and rotation for
   * placement.
   */
  export function transformMesh(mesh: IAutoMovieMesh, transform: IAutoMovieMeshTransform): IAutoMovieMesh {
    return transformMeshImplementation(mesh, transform);
  }
}
