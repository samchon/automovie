import { admitSubdivisionCage as admitSubdivisionCageImplementation } from "./internal/admitSubdivisionCage";
import { buildAutoMovieConvexHull as buildAutoMovieConvexHullImplementation } from "./internal/buildAutoMovieConvexHull";
import { buildAutoMovieWall as buildAutoMovieWallImplementation } from "./internal/buildAutoMovieWall";
import { buildSubdivisionTopology as buildSubdivisionTopologyImplementation } from "./internal/buildSubdivisionTopology";
import { checkAutoMovieFormExpectation as checkAutoMovieFormExpectationImplementation } from "./internal/checkAutoMovieFormExpectation";
import { countAtLeast as countAtLeastImplementation } from "./internal/countAtLeast";
import { createAutoMovieMeshWindingQuery as createAutoMovieMeshWindingQueryImplementation } from "./internal/createAutoMovieMeshWindingQuery";
import { decaySubdivisionSharpness as decaySubdivisionSharpnessImplementation } from "./internal/decaySubdivisionSharpness";
import { emptyMeshTarget as emptyMeshTargetImplementation } from "./internal/emptyMeshTarget";
import { limitSubdivisionLevel as limitSubdivisionLevelImplementation } from "./internal/limitSubdivisionLevel";
import { limitSubdivisionRing as limitSubdivisionRingImplementation } from "./internal/limitSubdivisionRing";
import { measureAutoMovieModelContacts as measureAutoMovieModelContactsImplementation } from "./internal/measureAutoMovieModelContacts";
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
import { transformAutoMovieMesh as transformAutoMovieMeshImplementation } from "./internal/transformAutoMovieMesh";

import { buildAutoMoviePolyhedron as buildAutoMoviePolyhedronImplementation } from "./internal/buildAutoMoviePolyhedron";
import { displaceAutoMovieSurface as displaceAutoMovieSurfaceImplementation } from "./internal/displaceAutoMovieSurface";
import { extrudeAutoMovieProfile as extrudeAutoMovieProfileImplementation } from "./internal/extrudeAutoMovieProfile";
import { inspectAutoMovieMeshTopology as inspectAutoMovieMeshTopologyImplementation } from "./internal/inspectAutoMovieMeshTopology";
import { measureAutoMovieMeshPieces as measureAutoMovieMeshPiecesImplementation } from "./internal/measureAutoMovieMeshPieces";
import { mergeAutoMovieMeshParts as mergeAutoMovieMeshPartsImplementation } from "./internal/mergeAutoMovieMeshParts";
import { mergeAutoMovieMeshes as mergeAutoMovieMeshesImplementation } from "./internal/mergeAutoMovieMeshes";
import { revolveAutoMovieProfile as revolveAutoMovieProfileImplementation } from "./internal/revolveAutoMovieProfile";

import { countAutoMovieMeshComponents as countAutoMovieMeshComponentsImplementation } from "./internal/countAutoMovieMeshComponents";
import { measureAutoMovieMeshDefects as measureAutoMovieMeshDefectsImplementation } from "./internal/measureAutoMovieMeshDefects";
import { measureAutoMovieModelCrossings as measureAutoMovieModelCrossingsImplementation } from "./internal/measureAutoMovieModelCrossings";
import { separateAutoMovieMeshSequence as separateAutoMovieMeshSequenceImplementation } from "./internal/separateAutoMovieMeshSequence";
import { subdivideAutoMovieSurface as subdivideAutoMovieSurfaceImplementation } from "./internal/subdivideAutoMovieSurface";
import { weldedDegenerateTriangles as weldedDegenerateTrianglesImplementation } from "./internal/weldedDegenerateTriangles";

import { type IAutoMovieAdmitBicubicAtlas, type IAutoMovieBicubicAtlasGeometry, type IAutoMovieFeatureEdgeDistance, type IAutoMovieVector3, type IAutoMovieSpatialQueryEntry, type IAutoMovieTriangleAttachmentContactBound, type IAutoMovieMeshQueryHierarchy, type IAutoMovieCreateEllipticLoftAtlas, type IAutoMovieMesh, type IAutoMovieMeshDeformationInfluence, type IAutoMovieMeshDeformationField, type IAutoMovieCreateMeshDepthSampler, type IAutoMovieMeshRayCaster, type IAutoMovieMeshSeparationQuery, type IAutoMovieSignedMeshQueryHit, type IAutoMovieSignedMeshQueryOptions, type IAutoMovieCreateSupportSectionQuery, type IAutoMovieEvaluateSupportSection, type IAutoMovieSubdivisionSurface, type IAutoMovieSubdivisionLevel, type IAutoMovieFitSubdivisionDomain, type IAutoMovieFitSubdivisionRegions, type IAutoMovieIntegrateRadialField, type IAutoMovieMark, type IAutoMovieMarkMeshClearance, type IAutoMovieMeasureFeatureEdges, type IAutoMovieMeasureMeshClearance, type IAutoMovieMeshClearanceWitness, type IAutoMovieProjectionIntervals, type IAutoMovieMinimizeMeshClearance, type IAutoMovieSweepFrame, type IAutoMovieSurfaceFrame, type IAutoMoviePreparedSurfaceFrame, type IAutoMovieRealizeBicubicAtlas64, type IAutoMovieRealizeGeometry, type IAutoMovieGeometry, type IAutoMovieSubdivisionTopology, type IAutoMovieSelectTriangleRegion, type IAutoMovieMeshDefect, type IAutoMovieMeasureMeshDefects, type IAutoMovieModelCrossing, type IAutoMovieModel, type IAutoMovieMeasureModelCrossings, type IAutoMovieSubdivideSurface, type IAutoMovieDisplaceSurface, type IAutoMovieExtrudeProfile, type IAutoMovieMeshTopology, type IAutoMovieMeshPiece, type IAutoMovieMeshAssembly, type IAutoMovieMeshPart, type IAutoMovieRevolveProfile, type IAutoMovieSubdivisionCage, type IAutoMovieBuildWall, type IAutoMovieFormCheck, type IAutoMovieFormExpectation, type IAutoMovieMeshWinding, type IAutoMovieMeshTarget, type IAutoMovieLimitSubdivisionLevel, type IAutoMovieLimitSubdivisionRing, type IAutoMovieSubdivisionRing, type IAutoMovieModelContact, type IAutoMovieMeasureModelContacts, type IAutoMoviePlanarPoint, type IAutoMovieRefineSubdivisionPoints, type IAutoMovieRefineSubdivisionUvs, type IAutoMovieSubdivisionVertexMask, type IAutoMovieProfilePoint, type IAutoMovieSubdivisionRingEigenbasis, type IAutoMovieTessellation, type IAutoMoviePrimitiveShape, type IAutoMovieSurface, type IAutoMovieMeshTransform } from "@automovie/interface";
import { admitAutoMovieBicubicAtlas as admitAutoMovieBicubicAtlasImplementation } from "./internal/admitAutoMovieBicubicAtlas";
import { assertAutoMovieDeformedTriangles as assertAutoMovieDeformedTrianglesImplementation } from "./internal/assertAutoMovieDeformedTriangles";
import { autoMovieFeatureEdgeDistance as autoMovieFeatureEdgeDistanceImplementation } from "./internal/autoMovieFeatureEdgeDistance";
import { boundAutoMovieConvexSeparation as boundAutoMovieConvexSeparationImplementation } from "./internal/boundAutoMovieConvexSeparation";
import { boundAutoMovieMeshQueryPoint as boundAutoMovieMeshQueryPointImplementation } from "./internal/boundAutoMovieMeshQueryPoint";
import { boundAutoMovieProjectionSeparation as boundAutoMovieProjectionSeparationImplementation } from "./internal/boundAutoMovieProjectionSeparation";
import { boundAutoMovieTriangleAttachmentContact as boundAutoMovieTriangleAttachmentContactImplementation } from "./internal/boundAutoMovieTriangleAttachmentContact";
import { buildAutoMovieMeshQueryHierarchy as buildAutoMovieMeshQueryHierarchyImplementation } from "./internal/buildAutoMovieMeshQueryHierarchy";
import { collectAutoMovieSpatialQueryCandidates as collectAutoMovieSpatialQueryCandidatesImplementation } from "./internal/collectAutoMovieSpatialQueryCandidates";
import { createAutoMovieEllipticLoftAtlas as createAutoMovieEllipticLoftAtlasImplementation } from "./internal/createAutoMovieEllipticLoftAtlas";
import { createAutoMovieMeshDeformer as createAutoMovieMeshDeformerImplementation } from "./internal/createAutoMovieMeshDeformer";
import { createAutoMovieMeshDepthSampler as createAutoMovieMeshDepthSamplerImplementation } from "./internal/createAutoMovieMeshDepthSampler";
import { createAutoMovieMeshRayCaster as createAutoMovieMeshRayCasterImplementation } from "./internal/createAutoMovieMeshRayCaster";
import { createAutoMovieMeshSeparationQuery as createAutoMovieMeshSeparationQueryImplementation } from "./internal/createAutoMovieMeshSeparationQuery";
import { createAutoMovieSignedMeshQuery as createAutoMovieSignedMeshQueryImplementation } from "./internal/createAutoMovieSignedMeshQuery";
import { createAutoMovieSupportSectionQuery as createAutoMovieSupportSectionQueryImplementation } from "./internal/createAutoMovieSupportSectionQuery";
import { evaluateAutoMovieSupportSection as evaluateAutoMovieSupportSectionImplementation } from "./internal/evaluateAutoMovieSupportSection";
import { evaluateSubdivisionLevel as evaluateSubdivisionLevelImplementation } from "./internal/evaluateSubdivisionLevel";
import { fitAutoMovieSubdivisionDomain as fitAutoMovieSubdivisionDomainImplementation } from "./internal/fitAutoMovieSubdivisionDomain";
import { fitAutoMovieSubdivisionRegions as fitAutoMovieSubdivisionRegionsImplementation } from "./internal/fitAutoMovieSubdivisionRegions";
import { integrateAutoMovieRadialField as integrateAutoMovieRadialFieldImplementation } from "./internal/integrateAutoMovieRadialField";
import { intersectAutoMovieConvexPolygons as intersectAutoMovieConvexPolygonsImplementation } from "./internal/intersectAutoMovieConvexPolygons";
import { markAutoMovieMeshClearance as markAutoMovieMeshClearanceImplementation } from "./internal/markAutoMovieMeshClearance";
import { measureAutoMovieFeatureEdges as measureAutoMovieFeatureEdgesImplementation } from "./internal/measureAutoMovieFeatureEdges";
import { measureAutoMovieMeshClearance as measureAutoMovieMeshClearanceImplementation } from "./internal/measureAutoMovieMeshClearance";
import { measureAutoMovieProjectionIntervals as measureAutoMovieProjectionIntervalsImplementation } from "./internal/measureAutoMovieProjectionIntervals";
import { minimizeAutoMovieMeshClearance as minimizeAutoMovieMeshClearanceImplementation } from "./internal/minimizeAutoMovieMeshClearance";
import { normalizeAutoMovieSurfaceFrame as normalizeAutoMovieSurfaceFrameImplementation } from "./internal/normalizeAutoMovieSurfaceFrame";
import { placeAutoMovieSurfaceFrame as placeAutoMovieSurfaceFrameImplementation } from "./internal/placeAutoMovieSurfaceFrame";
import { prepareAutoMovieSurfaceFrame as prepareAutoMovieSurfaceFrameImplementation } from "./internal/prepareAutoMovieSurfaceFrame";
import { realizeAutoMovieBicubicAtlas64 as realizeAutoMovieBicubicAtlas64Implementation } from "./internal/realizeAutoMovieBicubicAtlas64";
import { realizeAutoMovieGeometry as realizeAutoMovieGeometryImplementation } from "./internal/realizeAutoMovieGeometry";
import { refineSubdivisionStencils as refineSubdivisionStencilsImplementation } from "./internal/refineSubdivisionStencils";
import { refitAutoMovieMeshQueryHierarchy as refitAutoMovieMeshQueryHierarchyImplementation } from "./internal/refitAutoMovieMeshQueryHierarchy";
import { selectAutoMovieTriangleRegion as selectAutoMovieTriangleRegionImplementation } from "./internal/selectAutoMovieTriangleRegion";
import { subdivisionBendingRows as subdivisionBendingRowsImplementation } from "./internal/subdivisionBendingRows";
import { triangleIndicesOf as triangleIndicesOfImplementation } from "./internal/triangleIndicesOf";

/** Public operations for Auto Movie Engine Geometry. */
export namespace AutoMovieEngineGeometry {
  /**
   * Admit the global recipe and identify its structurally usable patch
   * occurrences. Invalid coefficient or canonical-boundary declarations omit only
   * incident patches and retain exact diagnostics; valid independent patches
   * remain available for display. Producer source-fit qualifications are retained
   * as diagnostics independently of structural completeness and never suppress
   * finite usable patches. An empty declared patch array is an explicit
   * incomplete generated domain.
   */
  export function admitBicubicAtlas(input: IAutoMovieBicubicAtlasGeometry): IAutoMovieAdmitBicubicAtlas.IResult {
    return admitAutoMovieBicubicAtlasImplementation(input);
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
   * address a vertex of all four arrays, which `createAutoMovieMeshDeformer`
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
    assertAutoMovieDeformedTrianglesImplementation(source, target, indices, cofactors);
  }

  /**
   * The distances from a point on one triangle of a measured mesh to the nearest
   * convex and the nearest concave feature edge in that triangle's list, capped
   * at `reach`: the CPU reference of what a worn material's fragment shader
   * computes at its bind-pose position.
   *
   * Every list holds each feature edge within reach of its triangle, so for a
   * point on the triangle any edge nearer than `reach` is listed, unless the list
   * hit its limit of 16. The capped result is therefore the exact distance to the
   * nearest feature edge of each sign whenever that distance is below `reach`,
   * and `reach` otherwise, however finely the faces are tessellated.
   *
   * @throws When `triangle` is not an index of the measured triangles.
   */
  export function featureEdgeDistance(props: IAutoMovieFeatureEdgeDistance.IProps): IAutoMovieFeatureEdgeDistance.IResult {
    return autoMovieFeatureEdgeDistanceImplementation(props);
  }

  /**
   * A conservative separation of the convex hulls of nonempty finite XYZ vertex
   * runs. Points, closed segments, filled triangles and convex cells are
   * measured, including degenerate hulls. Coordinates are represented binary64
   * metres; vectors and arrays remain caller-owned and the scalar result owns no
   * mutable snapshot.
   *
   * For any nonzero stored direction d, every convex combination has a projection
   * between its vertices' extrema. A positive projection gap divided by |d| is
   * therefore a lower bound on Euclidean separation by Cauchy-Schwarz. Each
   * subtraction, product, sum, square root and division is enclosed outward by
   * adjacent binary64 numbers. The direction's norm uses an upper enclosure. No
   * fixed spatial tolerance or approximate closest distance can create PASS.
   * Input coordinates and differences must admit finite enclosing arithmetic;
   * overflow throws instead of returning an unqualified separation, as do an
   * empty run, a non-finite coordinate and a negative or NaN `sufficient`.
   *
   * Candidate directions are every vertex-triple normal, `b`'s first, then the
   * displacement between the two first vertices, then the closest-point
   * displacement of every vertex pair of `a` against every vertex pair of `b`,
   * taken from the shared segment kernel. Approximate witnesses only choose
   * directions: even a poor direction retains the projection proof. Zero means
   * touching, intersecting, or unresolved; it does not assert an intersection.
   * This is neither signed side classification nor a complete contact-manifold
   * query. In particular a triangle containing an allowed attachment point still
   * receives zero when another part crosses.
   *
   * `sufficient` stops once a direction already proves that nonnegative requested
   * separation. The returned bound can then be weaker than another direction's;
   * omitted or infinite `sufficient` examines all directions. This cost control
   * changes no admission: callers accept only a bound at least their requested
   * separation. `spend` is an optional caller-owned work counter, invoked before
   * each normal triple, each projection axis and each pair calculation; the
   * resident mesh separation query always supplies its budget and passes its
   * resident triangle as `b`.
   */
  export function boundConvexSeparation(a: readonly IAutoMovieVector3[], b: readonly IAutoMovieVector3[], sufficient?: number, spend?: () => void): number {
    return boundAutoMovieConvexSeparationImplementation(a, b, sufficient, spend);
  }

  /**
   * Internal squared point-to-box lower bound for admitted nearest-query data.
   * Bounds and point use XYZ metres; cutoff is the running nonnegative squared
   * distance, with infinity admitting the complete sum. The signed-query owner
   * validates finite coordinates and representable distance arithmetic before
   * traversal; this hot primitive borrows that admission and checks no buffers.
   *
   * Terms accumulate in X/Y/Z order, matching the complete squared distance. A
   * partial sum strictly above cutoff can return immediately because adding
   * nonnegative squared terms cannot lower it. Such a return is a pruning
   * witness, not the full box distance. Equality continues, preserving equal
   * distance candidates and original triangle tie-breaking. Node ordering omits
   * cutoff and therefore receives the unchanged complete distance.
   */
  export function boundMeshQueryPoint(node: Readonly<Pick<IAutoMovieSpatialQueryEntry, "low" | "high">>, point: readonly number[], cutoff?: number): number {
    return boundAutoMovieMeshQueryPointImplementation(node, point, cutoff);
  }

  /**
   * A lower bound on the Euclidean separation of two convex hulls, proved along
   * one stored direction.
   *
   * Each run is a nonempty list of binary64 vertices in one metre frame, taken as
   * its convex hull: a complete convex feature, or the two opposite corners of a
   * box when the direction is a coordinate axis. Degenerate hulls are admitted. A
   * zero direction proves nothing and returns zero, as does any direction along
   * which the two projections overlap or touch; zero therefore means unproved,
   * not intersecting. The bound qualifies the represented coordinates only, not
   * an analytic surface, a signed side or a contact manifold. Nothing is
   * mutated.
   *
   * Throws on an empty run and, through `measureAutoMovieProjectionIntervals`, on
   * a non-finite coordinate or an overflowing enclosure.
   * `boundAutoMovieConvexSeparation` and the resident separation query's box
   * pruning are the consumers; their approximate witnesses only choose the
   * direction.
   *
   * @param a First vertex run.
   * @param b Second vertex run.
   * @param raw Stored direction; any nonzero scale.
   * @returns A nonnegative separation lower bound in metres.
   */
  export function boundProjectionSeparation(a: readonly IAutoMovieVector3[], b: readonly IAutoMovieVector3[], raw: IAutoMovieVector3): number {
    return boundAutoMovieProjectionSeparationImplementation(a, b, raw);
  }

  /**
   * Bound how far from its root any contact of an anchored fan with one support
   * triangle can lie.
   *
   * `fan[0]` is the root, already registered on the support by the caller's
   * canonical seat check, and `fan[1]` and `fan[2]` are the row's actual corners;
   * `support` is one original host triangle. Both are metres in one frame and are
   * only read. The function trusts the root's registration and says nothing about
   * any other host triangle, which needs its own strict separation proof; the
   * resident separation query supplies both.
   *
   * The support's stored face normal is only a direction. Outward intervals
   * enclose the whole support slab along it; with H its top, the root's deficit
   * is delta = max(0, H - root low) and the corners' smallest clearance above H
   * is s. When s > 0, a contact point's combined non-root barycentric weight is
   * at most delta / (delta + s), so its distance from the root is at most that
   * weight times the larger corner L1 distance from the root. A shallow emergence
   * therefore enlarges the cap through the explicit denominator. A nonpositive s
   * or a collapsed support leaves the proof false. Neither the winding nor the
   * cap says anything about tissue volume or burial.
   *
   * Throws when either triangle is not three finite vertices, when the support's
   * edge differences overflow, or, through the shared enclosure arithmetic, when
   * an enclosure step overflows.
   *
   * @param fan Root followed by the two row corners.
   * @param support One original host triangle.
   * @returns The proof flag, the cap in metres, and the slab quantities behind
   *   it.
   */
  export function boundTriangleAttachmentContact(fan: readonly IAutoMovieVector3[], support: readonly IAutoMovieVector3[]): IAutoMovieTriangleAttachmentContactBound {
    return boundAutoMovieTriangleAttachmentContactImplementation(fan, support);
  }

  /**
   * Partition resident entry boxes into a median box hierarchy.
   *
   * The signed, separation and crossing queries supply triangle boxes, lash
   * contact supplies capsule boxes and the body envelope supplies point boxes,
   * all with finite XYZ extrema and centres in one metre frame. Every node
   * encloses every descendant, so its box distance is a lower bound for any
   * nearest-feature walk. No coordinate or identity changes; the stage sorts the
   * caller's array in place and keeps the original entries in its leaves, and an
   * input of at most twelve entries is returned as one leaf holding that same
   * array. Changing any entry's geometry requires rebuilding the tree.
   *
   * The widest node axis chooses each split, with X before Y before Z on equal
   * widths, and the stable centre sort keeps input order among equal centres. The
   * twelve-entry leaf size bounds direct entry work per leaf; it changes
   * traversal cost, never a query's answer. An empty input yields one leaf with
   * positive and negative infinity extrema, the empty union's sentinels rather
   * than a finite box; the signed query refuses empty surfaces before this
   * stage.
   *
   * @param entries Caller-owned entries, reordered in place.
   * @returns The hierarchy's root node.
   */
  export function buildMeshQueryHierarchy<T extends IAutoMovieMeshQueryHierarchy.IEntry>(entries: T[]): IAutoMovieMeshQueryHierarchy<T> {
    return buildAutoMovieMeshQueryHierarchyImplementation<T>(entries);
  }

  /**
   * Collect the hierarchy entries whose boxes can meet a subject box, ordered by
   * the first cell of an XYZ grid they share with the subject.
   *
   * `hierarchy` is the tree `buildAutoMovieMeshQueryHierarchy` built from the
   * owner's resident entries, and `subject` is a box in the same metre frame.
   * `overlap` keeps entries whose actual boxes overlap the subject's, boundaries
   * included. `shared-cell` keeps the wider population whose boxes occupy a
   * common grid cell of width `cell`, which lash contact reads as its contact
   * neighbourhood. In both modes the result is sorted by the first shared cell
   * index in X, then Y, then Z, and then by original ordinal, so the order is a
   * deterministic function of the geometry and not of the tree's shape.
   *
   * Cell indices are read from coordinates by division and floor, never by
   * stepping through cells, so work follows the resident population and not
   * coordinate magnitude. An infinite cell width puts every finite coordinate in
   * cell zero, and indices that overflow to the same infinity compare equal and
   * fall to the ordinal tie-break. No entry geometry, coordinate or contact
   * allowance is changed.
   *
   * @param hierarchy Tree over the resident entries.
   * @param subject Box the candidates must reach.
   * @param cell Positive cell width in metres for ordering and `shared-cell`.
   * @param population Which entries qualify.
   * @returns Qualifying entries by reference, in cell then ordinal order.
   */
  export function collectSpatialQueryCandidates<T extends IAutoMovieSpatialQueryEntry>(hierarchy: IAutoMovieMeshQueryHierarchy<T>, subject: IAutoMovieSpatialQueryEntry, cell: number, population: "overlap" | "shared-cell"): T[] {
    return collectAutoMovieSpatialQueryCandidatesImplementation<T>(hierarchy, subject, cell, population);
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
   */
  export function createEllipticLoftAtlas(input: IAutoMovieCreateEllipticLoftAtlas.IInput): IAutoMovieCreateEllipticLoftAtlas.IResult {
    return createAutoMovieEllipticLoftAtlasImplementation(input);
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
   * vertex, a non-finite result, and, through `assertAutoMovieDeformedTriangles`,
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
    return createAutoMovieMeshDeformerImplementation(fields);
  }

  /**
   * Index a resident mesh for repeated axis-aligned depth queries.
   *
   * The returned sampler takes a point `(u, v)` in the plane perpendicular to
   * `axis` and answers the smallest and largest depth along `axis` at which a
   * triangle covers it, or `null` when none does. The query plane is Y/Z for
   * depth X, Z/X for depth Y and X/Y for depth Z, in the mesh-local metre frame.
   * An open surface may return equal depths, winding does not matter, and a point
   * on a shared edge belongs to both neighbours. A triangle whose projection has
   * zero area, one parallel to the query axis, is skipped, so the sampler reports
   * a surface envelope and not a closed-volume test.
   *
   * The mesh is copied into the index at creation, so later caller mutations
   * never change an answer. Creation throws on an invalid axis, a malformed index
   * buffer, a non-finite position, or projected area or extent arithmetic that
   * overflows; a query throws on a non-finite coordinate or depth.
   *
   * @param mesh Resident surface, snapshotted.
   * @param axis Depth axis.
   * @returns The depth query.
   */
  export function createMeshDepthSampler(mesh: IAutoMovieMesh, axis: "x" | "y" | "z"): IAutoMovieCreateMeshDepthSampler.IResult {
    return createAutoMovieMeshDepthSamplerImplementation(mesh, axis);
  }

  /**
   * Index a resident mesh for repeated ray queries.
   *
   * The mesh is copied into typed arrays at creation, so later caller mutations
   * never change an answer. The index is a bounding volume hierarchy: each node
   * splits its triangles at the median of their centroids along the axis the
   * centroids spread furthest, down to four triangles a leaf. `nearest` returns
   * the travel to the first triangle in metres along the normalized direction, or
   * null; `nearestHit` also returns that triangle's original ordinal, the lowest
   * one among equal travels, with the same raw travel including the sign of zero;
   * `blocked` answers only whether any triangle lies in range and stops at the
   * first. Returned records are new per query.
   *
   * A hit counts when its travel lies in `[minimum, maximum]`, minimum defaulting
   * to zero so a ray leaving a surface can skip the triangle it starts on, and
   * positive infinity meaning no maximum. A query may exclude original triangle
   * ordinals, such as the faces around its own attachment vertex; that changes
   * which triangles are targets, never the origin or a band of near hits. Winding
   * does not matter, an edge belongs to both its triangles, and a ray whose
   * Moller-Trumbore determinant is within 1e-18 of zero is treated as parallel to
   * that triangle and passes it. A missing hit is an observation gap, not proof
   * that the origin is inside or outside anything.
   *
   * Finite coordinates do not guarantee representable intermediate arithmetic.
   * Creation throws on a malformed index buffer, a non-finite position or an
   * unrepresentable edge; a query throws, naming the triangle where one is
   * involved, on unrepresentable box, determinant, barycentric or travel
   * arithmetic instead of producing a NaN hit. Centroids whose sum overflows are
   * averaged after scaling by their largest magnitude, a direction whose norm
   * overflows or is subnormal is normalized after the same scaling, and a
   * subnormal direction component whose reciprocal is infinite uses direct slab
   * division; ordinary inputs keep plain arithmetic.
   *
   * @param mesh Resident surface, snapshotted.
   * @returns The three ray queries over one shared index.
   */
  export function createMeshRayCaster(mesh: IAutoMovieMesh): IAutoMovieMeshRayCaster {
    return createAutoMovieMeshRayCasterImplementation(mesh);
  }

  /**
   * Compile a resident surface into a conservative whole-feature separation
   * query.
   *
   * The mesh is snapshotted, so changing its positions or indices later needs a
   * new query. Open sheets, disconnected components and degenerate triangles are
   * admitted, since unsigned separation needs no winding, closure or volume.
   * `representation` chooses whether the snapshot measures the source binary64
   * coordinates or their Float32 roundings, the buffer an exporter will write;
   * both keep the binary64 coordinates as the reference for attachment seats.
   * Original triangle ordinals survive the hierarchy's reordering.
   *
   * A call takes a feature, a nonempty finite XYZ vertex run in the same metre
   * frame measured as its convex hull, a nonnegative requested clearance and a
   * caller-owned work budget. It bounds the feature's separation from every
   * resident triangle: a hierarchy box is skipped only when an enclosed axis
   * projection already proves the requested clearance, and every remaining
   * triangle is bounded by `boundAutoMovieConvexSeparation`. This is neither ray
   * sampling nor a nearest-corner test. `certified` means the complete feature is
   * at least the clearance away, and at zero clearance strictly positive; false
   * means unproved, including touches, crossings and rounding at an exact limit,
   * and neither diagnoses penetration nor selects a closest point. `lowerBound`
   * is capped at the clearance, or is the smallest positive double at zero
   * clearance, which is a proof threshold rather than a distance estimate;
   * `triangle` is the original ordinal of the triangle that lowered it below that
   * cap, the lowest on ties, or -1 when none did.
   *
   * At zero clearance, a three-vertex fan may carry attachment metadata: its
   * root's canonical barycentric seat on a source triangle and the original
   * triangles incident to that seat. The root must equal that seat exactly, in
   * the snapshot's representation, and each support must contain the seat's
   * supporting corners. Each support must then bound the whole fan's contact
   * through `boundAutoMovieTriangleAttachmentContact`, reported as an
   * `attachmentCaps` entry, and every other triangle still needs strict positive
   * separation. Such a result reports `lowerBound` zero, because certification is
   * that combined proof and not positive separation. Without metadata a fan
   * touching its root is simply unproved.
   *
   * Compilation throws on an unknown representation, a malformed or empty index
   * buffer, a non-finite position, or a Float32 rounding that overflows. Every
   * visited box, with its up to three axis projections, spends one budget unit,
   * and every tested support, triangle, normal triple, projection axis and edge
   * pair spends one more before its work. Exhaustion and malformed input throw by
   * name; the caller owns the spent count and must not reset it during
   * refinement. A failed call accepts no geometry and retries nothing. The
   * returned query's `separated` runs the same walk and stops at the first
   * triangle whose bound falls below the target; since the running bound only
   * falls, its decision equals the full measurement's and it never spends more.
   *
   * @param mesh Resident surface, snapshotted.
   * @param representation Coordinates the snapshot measures.
   * @returns The compiled query.
   */
  export function createMeshSeparationQuery(mesh: IAutoMovieMesh, representation?: "source" | "float32"): IAutoMovieMeshSeparationQuery {
    return createAutoMovieMeshSeparationQueryImplementation(mesh, representation);
  }

  /**
   * Compile a closed oriented surface, or an open oriented sheet, into a
   * nearest-point and signed-distance query.
   *
   * Unlike a depth envelope, which cannot tell the inside from empty space
   * between solids or behind a concavity, this reads the nearest feature: its
   * face projection or closed edge segment gives the distance, and the side of
   * its pseudonormal, the face normal, the sum of an edge's face normals or the
   * angle-weighted vertex normal (Baerentzen and Aanaes, 2005), gives the sign,
   * positive on the oriented exterior. Coordinates are metres, and a point near
   * the surface gets the computed value, not one forced through a tolerance.
   *
   * The mesh is snapshotted, so changing it later needs a new query. Vertices
   * that share exact coordinates are welded, joining UV-split copies without
   * moving them. Admission throws on a malformed or empty index buffer, a
   * non-finite position, a triangle without positive finite area, an edge used by
   * more than two triangles or by two with the same direction, and a vertex whose
   * incident triangles form more than one fan. A closed surface also requires
   * every edge to be paired. The caller still owns an embedded,
   * non-self-intersecting, outward-oriented surface, cavity walls included, which
   * this neither infers nor repairs; reversing every face reverses the sign.
   *
   * With `boundary: "open"` an oriented sheet is admitted: an edge used by one
   * triangle takes that face's normal as its pseudonormal. A sheet's sign is
   * meaningful only within its reach, the distance below which the nearest
   * feature's orientation still separates the two sides, which the caller states
   * from its own geometry; a result whose nearest feature is a rim edge or rim
   * vertex reports `boundary: true`, meaning its side is not a side of the
   * sheet's interior. A closed surface never reports it.
   *
   * Callers query in very large numbers, such as a hair strand stepping a few
   * millimetres at a time against a head, so the leaf loop allocates nothing and
   * each query first measures the triangle the previous one won, which for a
   * walking caller supplies the bound that prunes most of the tree. Neither
   * changes an answer: only boxes farther than the running best are skipped, and
   * among equally near features the lowest triangle ordinal wins. A query throws
   * on a point that is not three finite coordinates or whose distance to the
   * surface's box overflows.
   *
   * @param mesh Surface to snapshot.
   * @param options Closed (default) or open boundary contract.
   * @returns The query for one XYZ point.
   */
  export function createSignedMeshQuery(mesh: IAutoMovieMesh, options?: IAutoMovieSignedMeshQueryOptions): (point: readonly number[]) => IAutoMovieSignedMeshQueryHit {
    return createAutoMovieSignedMeshQueryImplementation(mesh, options);
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
    return createAutoMovieSupportSectionQueryImplementation(input);
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
    return evaluateAutoMovieSupportSectionImplementation(input);
  }

  /**
   * Evaluate a completed generating level without another topology refinement.
   *
   * This boundary lets a refined fitting domain emit its existing LOD instead of
   * multiplying render triangles merely because fitting added controls. Original
   * source-face parameters and indexed face-varying UV identities are copied from
   * the level unchanged. The level must come from cage admission or the
   * maintained refiner; this function performs no admission or repair.
   */
  export function evaluateSubdivisionLevel(level: IAutoMovieSubdivisionLevel): IAutoMovieSubdivisionSurface {
    return evaluateSubdivisionLevelImplementation(level);
  }

  /**
   * Fit an explicitly refined generating domain to authored coarse limit points.
   *
   * Two uniform Catmull-Clark steps introduce fitting freedom, as in the
   * refinement principle of Halstead, Kass and DeRose (1993), section 5. The
   * objective is instead the frozen discrete cotangent bending norm documented by
   * subdivisionBendingRows, not that paper's analytic plate integral.
   * https://www.eecs.umich.edu/courses/eecs598-1/halstead.pdf
   *
   * Coordinates are hierarchical: Q = R P + D, with D zero at retained original
   * indices. Source control anchors constrain P. Independent source limit targets
   * constrain the limit of Q; an index may carry both equations. Fine controls
   * wholly supported by anchored P have zero detail. Outside regionFaces the
   * refined original control surface is fixed, preserving the consumer's
   * neighbouring surface rather than an isolated patch's boundary rule.
   *
   * The input is a manifold quad crop with a caller-owned support collar. Active
   * limit targets incident to an interior sharp edge are refused because their
   * limit masks are not smooth/boundary masks. Other support creases retain their
   * actual affine refinement and sharpness. The caller must validate support
   * against the whole joined consumer and preserve physical measurements not
   * implied by point equations. No embedding, no-fold, clinical measurement, or
   * pose guarantee is made.
   */
  export function fitSubdivisionDomain(props: IAutoMovieFitSubdivisionDomain.IProps): IAutoMovieFitSubdivisionDomain.IResult {
    return fitAutoMovieSubdivisionDomainImplementation(props);
  }

  /**
   * Fit disjoint geometric regions on their actual joined subdivision domain.
   *
   * Every region receives four edge-adjacent face rings of support: two are the
   * two-step refinement support and two retain the limit one-ring. The collar's
   * controls and the exterior refined surface are anchored. Local-to-global
   * vertex identity is followed through exact edge/face subdivision identities,
   * never spatial welding. Only solved control deltas are composed into the
   * globally refined original cage, so artificial crop boundaries cannot replace
   * the joined surface. Original indexed UVs and source-face parameters refine
   * globally once and never pass through a value-based UV repacker.
   *
   * Regions must be disjoint source-face sets; shared boundaries are exterior
   * anchors for both. Constraints must lie on their region's source vertices.
   * Support creases preserve their actual refinement; active target fans with
   * interior sharp edges are refused by the domain fitter. The fit result still
   * requires the caller's physical measurement, intersection and pose checks.
   */
  export function fitSubdivisionRegions(props: IAutoMovieFitSubdivisionRegions.IProps): IAutoMovieFitSubdivisionRegions.IResult {
    return fitAutoMovieSubdivisionRegionsImplementation(props);
  }

  /**
   * Integrate a strongest-site equal-radius compact radial field over a convex
   * planar domain.
   *
   * Coordinates and radius use one common unit in an orthonormal plane frame;
   * each site's z is its signed distance from that plane. The scalar is the
   * strongest positive sphere section q^power, where q=1-distance²/radius². Equal
   * radii make the strongest site a nearest-site half-plane partition. Green's
   * theorem reduces each cell's radial polynomial to edge integrals: four-point
   * Gauss-Legendre is exact for the interior degree-six polynomial in real
   * arithmetic, and the exterior zero-divergence flux uses a signed angle. The
   * returned gradient is the area integral of that scalar's physical planar
   * derivative, not a normal-map or BRDF average.
   *
   * The caller supplies the actual convex domain, rather than an extrapolation
   * from a smaller domain. This operation neither enumerates sites nor chooses an
   * application-specific field scale or eligibility. At most 512 sites bound
   * quadratic cell clipping; larger requests fail explicitly. Floating-point
   * cancellation near tangent circles or nearly coincident sites remains finite
   * precision, not a directed-rounding certificate. Degenerate footprints return
   * zero after input admission.
   */
  export function integrateRadialField(props: IAutoMovieIntegrateRadialField.IProps): IAutoMovieIntegrateRadialField.IOutput {
    return integrateAutoMovieRadialFieldImplementation(props);
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
    return intersectAutoMovieConvexPolygonsImplementation(subject, boundary);
  }

  /**
   * Turn the witnesses of a mesh clearance measurement into inspection marks: one
   * segment per witness from its point on the front surface to the matching point
   * on the back surface, flagged where the back lies in front.
   *
   * A witness's front point is its front triangle's vertices weighted by its
   * barycentric weights, and its back point is that point moved `gap` metres back
   * along the measured axis, because the gap is the front depth minus the back
   * depth there. Each becomes a segment of kind `clearance`, label `clearance
   * witness`, colour yellow-green `9acd32`, at path `<path>/clearance/<ordinal>`,
   * flagged when its gap is negative. Coordinates are those of the meshes, which
   * share one frame; `anchor` names the scene object that frame belongs to, or
   * null for world space.
   *
   * It throws for a witness that names a vertex outside the front mesh or does
   * not hold three vertices and three weights.
   *
   * @param props.path The front object's path, which the marks extend.
   * @param props.front The front mesh the witnesses were measured on.
   * @param props.axis The depth axis the clearance was measured along.
   * @param props.witnesses Witnesses as `measureAutoMovieMeshClearance` hands
   *   them to its visitor.
   * @param props.anchor Path of the object whose frame the meshes share, or null
   *   for world space.
   * @returns One mark per witness, in the witnesses' order.
   */
  export function markMeshClearance(props: IAutoMovieMarkMeshClearance.IProps): IAutoMovieMark[] {
    return markAutoMovieMeshClearanceImplementation(props);
  }

  /**
   * Find a triangle mesh's convex and concave feature edges and, for each
   * triangle, the ones within reach of it.
   *
   * 1. Vertices with exactly equal positions are welded, so a flat-shaded mesh whose
   *    vertices are split at hard edges still shares those edges. Triangles of
   *    zero area are skipped.
   * 2. An edge shared by exactly two welded triangles is a feature edge when the
   *    angle between their face normals exceeds 30°; an edge with one triangle (a
   *    boundary) or more than two (non-manifold) is not. The edge is convex when
   *    the second triangle's centroid lies behind the first triangle's plane,
   *    against its normal, and concave otherwise. Edges are listed in the order
   *    their first triangle and its side occur in the input.
   * 3. Each triangle keeps the feature edges whose segment lies within `reach` of
   *    the triangle, nearest first with ties broken by edge index, up to 16. The
   *    segment-to-triangle distance is zero when the segment pierces the
   *    triangle, and otherwise the least of its endpoints' distances to the
   *    triangle and its distances to the triangle's three sides, which is exact
   *    for a segment and a triangle in 3D.
   *
   * Because a triangle lists every edge within reach, not only its own sides, a
   * fragment inside a face subdivided into many triangles sees the same edges as
   * in the face's one quad; edges themselves are split into collinear pieces by
   * such subdivision, which leaves every distance unchanged. The work is a fixed
   * function of the input, so a mesh measured twice gives equal output.
   *
   * Cost is O(T log T) for welding and adjacency plus O(T × E) for the lists,
   * with T triangles and E feature edges; meshes this measures are generated sets
   * of at most tens of thousands of triangles, measured once when a model is
   * built.
   *
   * @throws When `reach` is not finite and above zero, or an index is out of
   *   range.
   */
  export function measureFeatureEdges(props: IAutoMovieMeasureFeatureEdges.IProps): IAutoMovieMeasureFeatureEdges.IResult {
    return measureAutoMovieFeatureEdgesImplementation(props);
  }

  /**
   * Measure front-minus-back depth along one axis over the complete projected
   * overlap of two triangle meshes.
   *
   * Each entry belongs to one front triangle, by ordinal, and gives its smallest
   * signed depth separation from any back triangle in mesh-local metres: positive
   * is clear, zero is contact, negative breaks the declared front-back ordering.
   * A front triangle with no projected overlap is not reported. The projection
   * plane is Y/Z for depth X, Z/X for depth Y and X/Y for depth Z. Triangles
   * parallel to the depth axis are skipped, so this is directional surface
   * ordering, not a closed-volume collision test. Both meshes must already share
   * a frame; callers own transforms and which pairs may touch. Neither input is
   * changed.
   *
   * The optional `visit` receives every overlap polygon vertex as a witness,
   * clear ones included, so a later coupled displacement can keep every one of
   * those inequalities and not only the violated ones. Throws on an invalid axis,
   * a malformed index buffer, a non-finite position, and projected area, clipping
   * or depth arithmetic that overflows.
   *
   * @param front Mesh that should lie in front.
   * @param back Mesh that should lie behind.
   * @param axis Depth axis; larger values are farther front.
   * @param visit Optional receiver of every overlap witness.
   * @returns Minimum depth gap per overlapping front triangle, in ordinal order.
   */
  export function measureMeshClearance(front: IAutoMovieMesh, back: IAutoMovieMesh, axis: "x" | "y" | "z", visit?: (witness: IAutoMovieMeshClearanceWitness) => void): IAutoMovieMeasureMeshClearance.IResult {
    return measureAutoMovieMeshClearanceImplementation(front, back, axis, visit);
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
   * the origin or the direction, and, through `adjacentAutoMovieFloat64`, on a
   * difference or enclosure step that overflows. Projection separation and
   * attachment contact are the two consumers.
   *
   * @param points Points to project, read only.
   * @param raw Stored direction, read only.
   * @param origin Reference point the projections are measured from.
   * @returns One owned interval per point and the norm enclosure.
   */
  export function measureProjectionIntervals(points: readonly IAutoMovieVector3[], raw: IAutoMovieVector3, origin?: IAutoMovieVector3): IAutoMovieProjectionIntervals {
    return measureAutoMovieProjectionIntervalsImplementation(points, raw, origin);
  }

  /**
   * Find the smallest joint forward travel of the front mesh's vertices along one
   * positive axis that restores a requested clearance over a back mesh.
   *
   * `measureAutoMovieMeshClearance` supplies every affine overlap witness,
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
    return minimizeAutoMovieMeshClearanceImplementation(front, back, axis, clearance);
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
    return normalizeAutoMovieSurfaceFrameImplementation(frame);
  }

  /**
   * Place a prepared rigid triangle at a requested centroid, heading and normal.
   * Output points retain their source order and pairwise distances up to binary64
   * rounding. The target normal fixes the plane; forward is projected into it and
   * normalized, so neither direction supplies scale. Prepared data is borrowed
   * unchanged and output records are independent. Invalid directions, malformed
   * offset counts, nonfinite offsets or unrepresentable results throw. Three
   * targets constrain a rigid patch; they do not prove whole-body support or IK
   * reachability, which remain with the actual consumer.
   */
  export function placeSurfaceFrame(prepared: IAutoMoviePreparedSurfaceFrame, target: IAutoMovieSurfaceFrame): [IAutoMovieVector3, IAutoMovieVector3, IAutoMovieVector3] {
    return placeAutoMovieSurfaceFrameImplementation(prepared, target);
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
    return prepareAutoMovieSurfaceFrameImplementation(points, referenceNormal);
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
   * recipe. Omitted/false retains no coefficient snapshots; invalid retention
   * flags reject before work.
   */
  export function realizeBicubicAtlas64(input: IAutoMovieBicubicAtlasGeometry, options?: IAutoMovieRealizeBicubicAtlas64.IOptions): IAutoMovieRealizeBicubicAtlas64.IResult {
    return realizeAutoMovieBicubicAtlas64Implementation(input, options);
  }

  /**
   * Resolve each public geometry recipe through its deterministic engine owner.
   * Mesh input is borrowed unchanged; recipes produce newly owned arrays. Atlas
   * completion and diagnostics describe processing, not shape quality. Retained
   * finite geometry is returned by default, including for indirect framing and
   * drawing callers. Only an explicit complete-processing query refuses partial
   * output; display never opts into that gate.
   */
  export function realizeGeometry(geometry: IAutoMovieGeometry, requirement?: "complete" | "display"): IAutoMovieRealizeGeometry.IResult {
    return realizeAutoMovieGeometryImplementation(geometry, requirement);
  }

  /**
   * Compose one Catmull-Clark refinement with sparse affine source stencils.
   * Vertex, edge and face output order agrees with refineSubdivisionPoints.
   * Coefficients come from topology and sharpness, never from basis probing.
   */
  export function refineSubdivisionStencils(topology: IAutoMovieSubdivisionTopology, source: ReadonlyArray<ReadonlyMap<number, number>>): Array<Map<number, number>> {
    return refineSubdivisionStencilsImplementation(topology, source);
  }

  /**
   * Refit an admitted hierarchy's fixed partition with fresh replacement entries.
   * The internal query owner supplies one replacement for every original leaf
   * entry, retaining its population and identity. Replacement bounds must enclose
   * the actual current geometry in one common metre frame. No entry is removed,
   * reordered or inspected for area; even a currently degenerate triangle keeps
   * its place for later snapshots. Boxes are recomputed from every replacement.
   *
   * The returned tree and leaf arrays are independent of the source tree. Entry
   * ownership belongs to replace; the crossing owner returns fresh triangle
   * records, so snapshots share only their immutable index layout. This primitive
   * neither mutates a resident tree nor caches a previous world placement.
   */
  export function refitMeshQueryHierarchy<T extends IAutoMovieMeshQueryHierarchy.IEntry, U extends IAutoMovieMeshQueryHierarchy.IEntry>(source: IAutoMovieMeshQueryHierarchy<T>, replace: (entry: T) => U): IAutoMovieMeshQueryHierarchy<U> {
    return refitAutoMovieMeshQueryHierarchyImplementation<T, U>(source, replace);
  }

  /**
   * Select the connected triangle patch on the inward side of an oriented mesh
   * boundary.
   *
   * The boundary lists each vertex once, in the order the selected faces wind:
   * the triangle that traverses boundary edge `a -> b` in that direction is
   * inside. Selection floods across shared edges from those triangles and never
   * crosses a boundary edge, so it depends on connectivity alone and a pose or a
   * folded projection cannot change which triangles a closed loop encloses.
   *
   * The input must have consistently wound manifold edges, every triangle with
   * three distinct vertices. A boundary edge missing from the mesh is refused, a
   * loop that does not separate the surface is refused, and on an open surface
   * the patch may not reach a free edge outside the supplied boundary.
   *
   * @param props.indices Triangle corner indices, three per triangle.
   * @param props.boundary Distinct vertex indices of the closed loop, at least
   *   three, wound like the selected faces.
   * @returns Sorted original triangle ordinals of the patch, suitable for removal
   *   without renumbering.
   * @throws Error naming the failed requirement when the input or boundary breaks
   *   any rule above.
   */
  export function selectTriangleRegion(props: IAutoMovieSelectTriangleRegion.IProps): number[] {
    return selectAutoMovieTriangleRegionImplementation(props);
  }

  /**
   * Frozen-metric discrete bending residuals M^(-1/2) C on a quad cage. C is
   * cotangent stiffness and M barycentric area mass. The diagonal 0–2 matches the
   * emitted render triangles. This discrete norm approximates bending; it is not
   * the analytic plate integral of Halstead et al. (1993). Zero-area triangles or
   * zero vertex mass are refused, with no regularizer.
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
    return countAutoMovieMeshComponentsImplementation(mesh);
  }

  /**
   * List every defect of a triangle mesh with the vertices that carry it, so an
   * inspection can draw each one where it is instead of reading a count.
   *
   * `positions` is flat xyz in any one length unit and `indices` holds triangle
   * corners, or is `null` for a non-indexed list whose every three vertices are
   * one triangle. Both are read in place, typed arrays included, and neither is
   * changed. Vertices weld by position: each coordinate is multiplied by
   * `options.weld`, the number of lattice cells per unit of length, and rounded
   * to the nearest whole cell, and vertices in the same cell on all three axes
   * are one corner. The default is `AutoMovieEngineMeshWeldGrid`, a nanometre grid when the
   * unit is the metre. Welding by cell is not welding by distance: two points
   * closer than a cell that fall on either side of a rounding boundary stay
   * apart.
   *
   * A triangle whose corners weld onto fewer than three cells is `degenerate` and
   * contributes no edges. Every other triangle contributes its three edges
   * between welded corners. An edge used by exactly one triangle is `open`, by
   * more than two `non-manifold`, and by exactly two that traverse it in the same
   * direction `inconsistent`, which is also what a triangle stored twice reports
   * on all three edges. A non-manifold edge is not tested for winding. `sliver`
   * is reported only when `options.sliver` is given: a triangle on three distinct
   * cells whose aspect, its longest edge squared divided by twice its area,
   * exceeds that limit. The aspect is dimensionless and equals the longest edge
   * over the height standing on it: `2 / sqrt(3)` for an equilateral triangle, 2
   * for a right isosceles one, and infinite for collinear corners on distinct
   * cells. It is measured on the stored positions, not on the lattice.
   *
   * Defects come in ascending order of the first triangle that carries them.
   * Within one triangle its own `degenerate` or `sliver` defect comes first, then
   * its edges in corner order: corner 0 to 1, 1 to 2, 2 to 0. An edge is listed
   * once, at the first triangle that uses it. The same input always gives the
   * same list.
   *
   * It throws a named `Error` for a position count not divisible by three, a
   * corner count not divisible by three, an index that is not a whole number
   * inside the position buffer, a `weld` or `sliver` that is not positive and
   * finite, a vertex whose lattice coordinate is not finite, and more than 94 906
   * 265 vertices. Only edge incidence is measured: a vertex where two fans touch
   * and surfaces that cross each other are not found here.
   *
   * @param mesh Position and index buffers to measure.
   * @param options `weld` is the lattice's cells per unit of length, default
   *   `AutoMovieEngineMeshWeldGrid`. `sliver` is the aspect limit above which a triangle is a
   *   sliver; absent, no sliver is reported.
   * @returns The defects, empty for a closed, consistently wound mesh without
   *   degenerate triangles.
   */
  export function measureMeshDefects(mesh: IAutoMovieMeasureMeshDefects.IMesh, options?: IAutoMovieMeasureMeshDefects.IOptions): IAutoMovieMeshDefect[] {
    return measureAutoMovieMeshDefectsImplementation(mesh, options);
  }

  /**
   * Report every pair of a model's mesh parts whose surfaces cross, measured
   * where the parts actually sit in the model's frame.
   *
   * Each mesh part is first carried into the model frame by its own transform
   * and, when attached to a bone the rest pose resolves, by that bone's rest
   * placement, the placement `autoMovieModelPartMatrices` owns; a part with
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
    return measureAutoMovieModelCrossingsImplementation(model, options);
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
   * measureAutoMovieMeshClearance applies; this does not pack arbitrary volumes
   * around corners or preserve an external path after separation.
   *
   * @throws Error for malformed triangles, non-finite coordinates or clearance,
   *   an invalid axis, or arithmetic that exceeds finite translations or
   *   positions.
   */
  export function separateMeshSequence(meshes: readonly IAutoMovieMesh[], axis: "x" | "y" | "z", clearance?: number): IAutoMovieMesh[] {
    return separateAutoMovieMeshSequenceImplementation(meshes, axis, clearance);
  }

  /**
   * Refine a polygon cage into a Catmull-Clark subdivision surface and evaluate
   * its limit positions and normals.
   *
   * Each level applies Catmull and Clark's (1978) face, edge and vertex rules.
   * Boundary edges are infinitely sharp, so a boundary follows the cubic B-spline
   * of its cage edges, and a boundary vertex with one face is rounded rather than
   * kept, OpenSubdiv's edge-only boundary interpolation. Creases follow DeRose,
   * Kass and Truong (1998): a vertex with two sharp edges takes the crease rule,
   * one with three or more is a corner, and semi-sharp edges blend into smooth
   * ones as their sharpness decays. After the first level every face is a quad,
   * so the cage may mix triangles, pentagons and other polygons with its quads.
   *
   * The limit position and normal of each vertex come from the published limit
   * masks, evaluated after any semi-sharp sharpness left at the final level is
   * spent, so they are what infinite refinement gives and do not depend on the
   * level. A vertex on an infinitely sharp crease or boundary gets one normal per
   * side. The exceptions are boundary or crease sides of one face, such as a cage
   * corner under edge-only interpolation, or of four or more faces: there the
   * limit surface has no tangent plane containing the crease, and the normal is
   * OpenSubdiv's approximating mask, as `limitSubdivisionRing` explains.
   *
   * UVs refine face-varying with every chart boundary pinned, so an authored UV
   * layout keeps its chart outlines exactly. The surface is deterministic: the
   * same cage and level give the same numbers in the same order on every host.
   *
   * Refused before refinement: every defect `admitSubdivisionCage` lists, and a
   * level that is not an integer from 1 to 6. The cap exists because each level
   * multiplies the quad count by four, so the output is at most 1,024 quads per
   * cage corner. A vertex whose limit normal vanishes, such as an interior vertex
   * of valence two or a collapsed cage, is refused after refinement.
   *
   * @param props.cage The control cage, only read.
   * @param props.levels Number of refinement steps, an integer from 1 to 6.
   * @returns The refined quads, limit positions and normals, UVs and cage
   *   parameters.
   */
  export function subdivideSurface(props: IAutoMovieSubdivideSurface.IProps): IAutoMovieSubdivisionSurface {
    return subdivideAutoMovieSurfaceImplementation(props);
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
   * shell is the caller's to declare and `inspectAutoMovieMeshTopology`'s to
   * measure.
   *
   * @param faces Each face's corners in metres, counter-clockwise seen from
   *   outside.
   * @returns A mesh with flat normals and metric UVs.
   */
  export function buildPolyhedron(faces: ReadonlyArray<readonly IAutoMovieVector3[]>): IAutoMovieMesh {
    return buildAutoMoviePolyhedronImplementation(faces);
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
   * vertex's `locateAutoMovieSurfaceVertices` location, which depends on no pose,
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
    return displaceAutoMovieSurfaceImplementation(props);
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
    return extrudeAutoMovieProfileImplementation(props);
  }

  /**
   * Measure a mesh's triangle topology and signed volume from its actual buffers
   * instead of assuming them.
   *
   * Without physical source correspondence, vertices weld by position on the
   * `AutoMovieEngineMeshWeldGrid` lattice, so face-local corners can still form one shell. A
   * mesh that declares physical sources instead keeps their incidence across
   * contact: two different sources stay distinct even where they touch. A
   * triangle whose corners collapse onto fewer than three grid cells is counted
   * degenerate, by ordinal, and contributes no edges in either mode. A closed
   * solid reports `watertight`; an assembly whose members share faces, or a
   * surface meant to stay open, reports its boundary and non-manifold edge counts
   * rather than passing. Non-finite components are counted across positions,
   * normals, UVs, colours and relief weights. Coordinates are metres and the
   * volume, by the divergence theorem, is cubic metres, positive for an
   * outward-wound closed shell.
   *
   * This measures; it does not judge. `validateMeshTopology` is the verdict on
   * the same surface, adding winding consistency and an `expectClosed`
   * declaration, and `validateModel` runs it on every mesh a model carries. A
   * malformed index buffer and invalid physical correspondence throw their own
   * named refusals. The mesh is only read.
   *
   * @param mesh Mesh to measure.
   * @returns Counts, degenerate ordinals, closure and volume.
   */
  export function inspectMeshTopology(mesh: IAutoMovieMesh): IAutoMovieMeshTopology {
    return inspectAutoMovieMeshTopologyImplementation(mesh);
  }

  /**
   * Report the topology of each piece of a mesh: its counts, boundary loops,
   * Euler characteristic, manifoldness, orientability, stored winding and genus.
   *
   * Corners are welded exactly as `inspectAutoMovieMeshTopology` welds them,
   * through the shared `weldAutoMovieMeshCorners`: on the `AutoMovieEngineMeshWeldGrid`
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
   * `inspectAutoMovieMeshTopology`.
   *
   * @param mesh Mesh to measure.
   * @returns One record per piece, in first-triangle order.
   */
  export function measureMeshPieces(mesh: IAutoMovieMesh): IAutoMovieMeshPiece[] {
    return measureAutoMovieMeshPiecesImplementation(mesh);
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
   * Each member is placed through `transformAutoMovieMesh` and concatenated by
   * `mergeAutoMovieMeshes`, so both of their coordinate rules apply here. One
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
    return mergeAutoMovieMeshPartsImplementation(parts);
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
   * all, and `buildAutoMovieWall` refuses the pinched case by name.
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
    return mergeAutoMovieMeshesImplementation(meshes);
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
   * {@link buildAutoMoviePolyhedron}, whose per-face frame is isometric, or as a
   * flat cap through {@link AutoMovieEnginePlanarRegion.extrude}, and a spire
   * built as facets is how a spire is built anyway. {@link meshAutoMovieSweep} is
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
    return revolveAutoMovieProfileImplementation(props);
  }

  /**
   * Validate a subdivision cage and turn it into level zero.
   *
   * Refused, each with the offending index, before any refinement: positions that
   * are empty, not packed in threes or not finite; no faces; a face with fewer
   * than three corners, a corner that indexes no vertex, or a repeated vertex; a
   * crease with an invalid end, equal ends, a sharpness outside 0 to 10, a
   * repeated edge, or no matching cage edge; UVs without UV faces or the reverse,
   * UVs not packed in pairs or not finite, UV faces not shaped like the faces, a
   * UV index out of range, a UV shared by two vertices, or an unused UV; and
   * every manifold refusal of `buildSubdivisionTopology`. Inputs are only read.
   *
   * @param cage The authored cage.
   * @returns Level zero, with each quad corner at its parameter square corner and
   *   each other corner at `(0, 0)` of its own sub-face.
   */
  export function admitSubdivisionCage(cage: IAutoMovieSubdivisionCage): IAutoMovieSubdivisionLevel {
    return admitSubdivisionCageImplementation(cage);
  }

  /**
   * Build the convex hull of a point set as one closed outward mesh.
   *
   * The hull's faces are the supporting planes `physicalHullFaces` finds, each
   * with its loop counter-clockwise seen from outside, and
   * `buildAutoMoviePolyhedron` fans each loop from its first corner with a flat
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
    return buildAutoMovieConvexHullImplementation(points);
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
    return buildAutoMovieWallImplementation(props);
  }

  /**
   * Build the edges and vertex fans of polygon rows, refusing anything that is
   * not an oriented manifold.
   *
   * Edges are numbered by first appearance walking faces in order and corners in
   * order. Each fan is walked from its start by stepping to the opposite corner
   * of the current corner's in-edge, which is the counter-clockwise neighbour
   * when the two faces traverse the edge in opposite directions. Refused, by cage
   * vertex and face indices: an edge used by more than two faces, an edge two
   * faces traverse in the same direction, a vertex in no face, and a vertex whose
   * faces form more than one fan. Rows must already hold valid, distinct vertex
   * indices per face; `subdivideAutoMovieSurface` checks that before calling.
   *
   * @param vertexCount Number of vertices the rows index.
   * @param faceOffsets Row starts, one more entry than faces.
   * @param faceVertices Vertex of every corner.
   * @param sharpnessOf Sharpness of the interior edge between two vertices.
   * @returns The level's connectivity, with boundary edges at sharpness 10.
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
   * `measureAutoMovieModelContacts` places it, and the placed parts are merged
   * into one mesh by concatenation. Each given field is then measured: `size`
   * from the merged positions' axis-aligned extents, `pieces` and `genera` from
   * `measureAutoMovieMeshPieces`, `solid` and `empty` from
   * `createAutoMovieMeshWindingQuery`, and `pairs` from
   * `measureAutoMovieModelContacts` with the expectation's `contact`. Each
   * failure becomes one finding naming its field, its subject and the measured
   * value against the expected one.
   *
   * The shape fields, every field but `pairs` and `contact`, also run on two
   * one-part mutants built from every placed vertex: the 12-triangle axis-aligned
   * box and the convex hull from `buildAutoMovieConvexHull`. Their failures are
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
    return checkAutoMovieFormExpectationImplementation(model, expectation);
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
   * Compile any triangle surface into a query that tells solid from empty space
   * at one point by the generalized winding number.
   *
   * The winding number is the sum of the signed solid angles every triangle
   * subtends at the point, divided by 4 pi (Jacobson, Kavan and Sorkine-Hornung
   * 2013, "Robust Inside-Outside Segmentation using Generalized Winding
   * Numbers"); each triangle's solid angle is the closed form of Van Oosterom and
   * Strackee (1983). Unlike the pseudonormal sign of
   * `createAutoMovieSignedMeshQuery`, it needs no closed, embedded manifold: an
   * open tube, overlapping shells in one index buffer, an edge shared by more
   * than two triangles and a nearly closed surface all read as the share of the
   * view they cover. A point counts as `inside` when it is not on the surface and
   * its absolute winding number is at least 0.5, so an inward-wound shell is
   * solid too and `winding` keeps the sign.
   *
   * Solid angles are singular on the surface, so the same pass first tests
   * whether the point lies on a triangle: within a slack of 1e-9 of that
   * triangle's doubled area from its plane and inside its three edges, edges and
   * corners included, the test `builtSpaceContainsPoint` has always used. A
   * triangle whose doubled area is at most 1e-12 m2 has no plane to test: it
   * holds no surface point and contributes nothing to the sum, which is its exact
   * solid angle when its area is zero; the closed form would instead give plus or
   * minus 2 pi at a point on its line.
   *
   * The mesh is snapshotted, so changing it later needs a new query. Coordinates
   * are metres in the mesh's frame. Admission throws on a malformed index buffer,
   * a non-finite position and a mesh without triangles. A query throws on a point
   * that is not three finite coordinates.
   *
   * @param mesh Surface to snapshot; only read.
   * @returns The query for one XYZ point in metres.
   */
  export function createMeshWindingQuery(mesh: IAutoMovieMesh): ((point: readonly number[]) => IAutoMovieMeshWinding) {
    return createAutoMovieMeshWindingQueryImplementation(mesh);
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
   * Every part is realized through `realizeAutoMovieGeometry`, primitives
   * included, and carried into the model frame by `placeAutoMovieModelPartMesh`
   * with its `autoMovieModelPartMatrices` entry, as
   * `measureAutoMovieModelCrossings` places its parts. One record follows for
   * every unordered pair, in model part order. A pair crosses when
   * `AutoMovieEngineMeshCrossingQuery.measure` finds a transverse or coplanar
   * crossing in either direction, which it can only where the two placed boxes
   * overlap. The gap is 0 for a crossing pair and otherwise the least distance
   * between the surfaces by `measureAutoMovieMeshGap`, for every pair however far
   * apart. Each share is the area of one part's triangles whose centroids the
   * other part's winding query, `createAutoMovieMeshWindingQuery`, finds
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
    return measureAutoMovieModelContactsImplementation(model, options);
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
   * shape `buildAutoMovieWall` refuses when two openings meet at a corner. A
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
   * Whether a point lies inside a closed ring by the even-odd rule, casting a ray
   * along +X.
   *
   * The answer is defined only for a point off the ring: both callers have
   * already refused ring contact, so the point they probe never lies on an edge.
   * The ring may be wound either way. Unlike the architecture graph's
   * `pointInPolygon`, a boundary point is not classified as inside.
   *
   * @param point Point to classify.
   * @param ring Closed ring, the last corner joined back to the first.
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
   * Refine a subdivision level once into an all-quad level.
   *
   * Parent corner `c`, at vertex `v` of face `f`, becomes child face `c` with
   * corners `v`, the point of its out-edge, the point of `f`, and the point of
   * its in-edge, which keeps the parent winding. The two halves of a parent edge
   * take its decayed sharpness and the edges inside a parent face are smooth.
   *
   * Corner parameters halve: a child corner takes its parent corner's value, the
   * midpoint towards the neighbouring corner, or the face centroid. The cage's
   * non-quad faces instead give each child quad its own unit square on sub-face
   * `k`, as `IAutoMovieSubdivisionParameter` documents.
   *
   * @param level The level to refine.
   * @returns The next level.
   */
  export function refineSubdivisionLevel(level: IAutoMovieSubdivisionLevel): IAutoMovieSubdivisionLevel {
    return refineSubdivisionLevelImplementation(level);
  }

  /**
   * Apply one Catmull-Clark step to vertex positions: every vertex, edge and face
   * point of the next level.
   *
   * The output holds the vertex points in vertex order, then the edge points in
   * edge order, then the face points in face order. A face point is the average
   * of its corners. An edge point is `(A + B + F0 + F1) / 4`, the ends and the
   * two adjacent face points, blended towards the midpoint `(A + B) / 2` by
   * `subdivisionEdgeSmoothness`, so boundary and sharp edges take the midpoint. A
   * vertex point applies `subdivisionVertexMask` to the vertex, its edge
   * neighbours and the new face points of its fan.
   *
   * @param topology Connectivity of the current level.
   * @param positions Packed positions of the current level.
   * @returns Packed next-level points and the vertex mask used for each vertex.
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
   * Refine a vertex's quad one-ring once, giving the one-ring of the vertex's
   * child.
   *
   * The child's diagonals are the new face points `(C + E_i + D_i + E_{i+1}) /
   * 4`, its edge neighbours the new edge points of the ring edges, and its centre
   * the new vertex point, by the same rules as `refineSubdivisionPoints`. Every
   * point it needs lies inside the ring's quads, so the ring refines without the
   * rest of the mesh.
   *
   * @param ring The current one-ring.
   * @returns The child's one-ring with decayed sharpness.
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
   * The limit point and two tangent vectors of a ring's vertex, from the dominant
   * left eigenvectors of the ring's own subdivision matrix.
   *
   * Refining a one-ring is linear in its points, so it is a square matrix `S`
   * over the centre, edge neighbours and diagonals, built here by refining one
   * unit ring per point with `stepSubdivisionRing`. Because the rules are affine,
   * `S` keeps constants, so its dominant eigenvalue is 1 and the matching left
   * eigenvector, scaled to sum 1, is the limit-position mask; the two dominant
   * left eigenvectors among the masks that sum to zero span the tangent masks
   * (Halstead, Kass and DeRose 1993 derive the smooth case in closed form). Both
   * are found by iteration on `S` from the left: plain power iteration for the
   * limit, and orthogonal iteration of a two-dimensional zero-sum subspace for
   * the tangents, re-orthonormalised every step so the weaker tangent is never
   * lost to the stronger one. `limitSubdivisionRing` uses this for darts and for
   * crease sides of three faces, whose sharp edges give them other matrices than
   * the published masks assume. The tangent search converges at the ratio of the
   * third to the second dominant zero-sum eigenvalue, about 0.94 for a dart of
   * valence 12, so `EIGEN_STEPS` iterations reach rounding.
   *
   * @param ring A one-ring whose sharpness is only 0 or 10.
   * @returns The limit point and two vectors spanning the tangent plane,
   *   unoriented.
   */
  export function subdivisionRingEigenbasis(ring: IAutoMovieSubdivisionRing): IAutoMovieSubdivisionRingEigenbasis.IResult {
    return subdivisionRingEigenbasisImplementation(ring);
  }

  /**
   * The Catmull-Clark vertex-point mask for a vertex with the given fan edge
   * sharpness, including the semi-sharp transition blend.
   *
   * The rule follows the number of fan edges with positive sharpness (boundary
   * edges count, at 10): none or one (smooth or dart) takes Catmull and Clark's
   * `(F + 2R + (n - 3) P) / n`, which is `(n - 2) / n` on the vertex and `1 /
   * n^2` on each edge neighbour and face point; two (crease) takes the crease
   * rule `(6 P + A + B) / 8` over the two sharp neighbours; three or more
   * (corner) keeps the vertex. When decaying the sharpness changes the rule, the
   * mask is the blend DeRose, Kass and Truong (1998) give for fractional
   * sharpness: the parent rule weighted by the mean parent sharpness of the edges
   * that turn smooth, at most one, and the child rule weighted by the rest, as
   * OpenSubdiv computes it.
   *
   * @param sharpness Sharpness of each fan edge, 10 for boundary edges.
   * @param faceCount Number of fan faces.
   * @returns The vertex, edge-neighbour and face-point weights.
   */
  export function subdivisionVertexMask(sharpness: readonly number[], faceCount: number): IAutoMovieSubdivisionVertexMask {
    return subdivisionVertexMaskImplementation(sharpness, faceCount);
  }

  /**
   * Tessellate a {@link AutoMoviePrimitiveShape} into a triangle mesh.
   *
   * Lets the LLM-authored "named dimensions" path (a 0.4 m sphere, a capsule)
   * become concrete geometry a renderer can draw, without the model ever emitting
   * vertices. The engine owns this fixed primitive recipe independently of the
   * rendering host; renderer precision and appearance are separate observations.
   *
   * Coordinates are local metres, centred on the origin, and faces wind
   * counter-clockwise from outside. Dimensions must already have passed model
   * validation. Sphere, cylinder and cone use sixteen angular segments; the
   * sphere has twelve latitude rings. Planes retain the zero-height box topology.
   * Capsules share the sphere's latitude lattice, with two equator rings joined
   * by the authored cylindrical body height and hemispheres centred at its ends.
   * Each call returns fresh indexed position and normal arrays, without UVs.
   * Finite admitted dimensions can still overflow derived capsule height or
   * normal arithmetic; this producer does not refuse every extreme invalid mesh.
   *
   * @throws Error when the runtime primitive discriminator is unknown.
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
   * Tessellate a primitive and wrap it as a complete {@link IAutoMovieMesh}.
   *
   * The mesh is indexed, carries the primitive's own normals, and has no UVs and
   * no skin, because a primitive states no atlas and rides its part's bone as a
   * rigid whole. Callers use it where a mesh is required, such as placing a
   * primitive with {@link transformAutoMovieMesh} or merging it with authored
   * parts.
   *
   * @param shape Primitive to tessellate.
   * @returns A new mesh whose arrays are owned by the caller.
   * @throws Error when `shape.type` is not a known primitive.
   */
  export function tessellateToMesh(shape: IAutoMoviePrimitiveShape): IAutoMovieMesh {
    return tessellateToMeshImplementation(shape);
  }

  /**
   * Place a rigid mesh by translation, unit quaternion, and per-axis scale.
   *
   * Positions take the full placement, normals take the inverse transpose (so a
   * non-uniform scale does not tilt them off the surface), and a mirroring scale
   * flips triangle winding so the outward face stays outward. UVs ride along
   * untouched, because a placement moves a surface without re-cutting its atlas.
   * Linear RGB and relief weights follow the same vertex identities and are
   * copied unchanged. Physical correspondence is admitted, copied with its
   * original source pairs, and admitted again on the placed positions, because a
   * placement must not separate aliases on the shared weld grid. Reusing a pair
   * in another placement still asserts one point; a later merge refuses
   * disagreement rather than renaming the physical instance.
   *
   * That is what makes a placed member's coordinates local rather than global,
   * and it is the one thing to know before rotating an atlas-bearing member.
   * {@link buildAutoMoviePolyhedron} decides each face's frame from world up in
   * the frame the mesh was built in, so a panel built upright and then laid down
   * by a rotation keeps the upright face's frame while presenting a level face.
   * Build the member in the orientation it will be seen in, or accept that its
   * grain travels with it, which is what a real board does when it is turned.
   *
   * A rotation is where riding along is free. A scale is not, and it is the one
   * case where carrying the atlas unchanged costs the set its unit. A metric set
   * says one unit is one metre of surface, and a scaled placement stretches the
   * surface while leaving the numbers where they were, so a member built at unit
   * size and placed at three times it reads one metre where the surface now
   * measures three: the finish comes out three times too large, uniformly. A
   * non-uniform scale is worse than wrong by a constant, because each face takes
   * its own factor and the set stops being metric by any single number at all.
   *
   * Nothing downstream recovers it. `validateTextureScale` measures a binding
   * against the part's own coordinate span and never reads a placement, so a
   * scaled member's declaration passes exactly as it did before it was scaled.
   * Author an atlas-bearing member at the size it will be seen at and place it
   * with translation and rotation, or drop `coordinateSource` on it rather than
   * claiming metres a scale has already falsified.
   *
   * @param mesh Unskinned mesh in its local metre frame; never modified.
   * @param transform Placement, each field defaulting to identity.
   * @returns A new mesh whose arrays share nothing with the input; its index
   *   buffer is always present.
   * @throws Error when the mesh is skinned, its indices are incomplete or out of
   *   range, its physical correspondence is malformed before or after placement,
   *   a placement field is not finite, the rotation is not unit within 1e-6, or a
   *   scale component is zero.
   */
  export function transformMesh(mesh: IAutoMovieMesh, transform: IAutoMovieMeshTransform): IAutoMovieMesh {
    return transformAutoMovieMeshImplementation(mesh, transform);
  }
}
