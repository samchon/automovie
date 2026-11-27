import type {
  AutoMovieDrawingProjection,
  IAutoMovieBoundaryFace,
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltOpening,
  IAutoMovieBuiltSpace,
  IAutoMovieDeriveDrawing,
  IAutoMovieDeriveDrawingSchedule,
  IAutoMovieDraftDrawingLines,
  IAutoMovieDrawing,
  IAutoMovieDrawingCellSection,
  IAutoMovieDrawingDesignIndex,
  IAutoMovieDrawingEdge,
  IAutoMovieDrawingExtent,
  IAutoMovieDrawingFeature,
  IAutoMovieDrawingFeatureResolution,
  IAutoMovieDrawingFrame,
  IAutoMovieDrawingOpeningMark,
  IAutoMovieDrawingPoint,
  IAutoMovieDrawingRange,
  IAutoMovieDrawingSchedule,
  IAutoMovieDrawingScheduleBox,
  IAutoMovieDrawingToSvg,
  IAutoMovieDrawingTriangle,
  IAutoMovieDrawingView,
  IAutoMovieHalfSpacePlane,
  IAutoMovieMeasureQuantities,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieOpeningArc,
  IAutoMovieOpeningExtent,
  IAutoMovieOpeningFillExtent,
  IAutoMovieOpeningNominalExtent,
  IAutoMovieOpeningProfile,
  IAutoMoviePlanarPoint,
  IAutoMovieQuantityReport,
  IAutoMovieSectionDrawingSpaces,
  IAutoMovieVector3,
} from "@automovie/interface";

import { autoMovieBoundaryFacePoint as autoMovieBoundaryFacePointImplementation } from "./internal/autoMovieBoundaryFacePoint";
import { autoMovieBoundaryShellTriangles as autoMovieBoundaryShellTrianglesImplementation } from "./internal/autoMovieBoundaryShellTriangles";
import { autoMovieDrawingCellSection as autoMovieDrawingCellSectionImplementation } from "./internal/autoMovieDrawingCellSection";
import { autoMovieDrawingCellVolume as autoMovieDrawingCellVolumeImplementation } from "./internal/autoMovieDrawingCellVolume";
import { autoMovieDrawingCutEdges as autoMovieDrawingCutEdgesImplementation } from "./internal/autoMovieDrawingCutEdges";
import { autoMovieDrawingElementTriangles as autoMovieDrawingElementTrianglesImplementation } from "./internal/autoMovieDrawingElementTriangles";
import { autoMovieDrawingExtent as autoMovieDrawingExtentImplementation } from "./internal/autoMovieDrawingExtent";
import { autoMovieDrawingFrame as autoMovieDrawingFrameImplementation } from "./internal/autoMovieDrawingFrame";
import { autoMovieDrawingHasCut as autoMovieDrawingHasCutImplementation } from "./internal/autoMovieDrawingHasCut";
import { autoMovieDrawingIncludedSpaces as autoMovieDrawingIncludedSpacesImplementation } from "./internal/autoMovieDrawingIncludedSpaces";
import { autoMovieDrawingOpeningMark as autoMovieDrawingOpeningMarkImplementation } from "./internal/autoMovieDrawingOpeningMark";
import { autoMovieDrawingPartTriangles as autoMovieDrawingPartTrianglesImplementation } from "./internal/autoMovieDrawingPartTriangles";
import { autoMovieDrawingPlaneDistance as autoMovieDrawingPlaneDistanceImplementation } from "./internal/autoMovieDrawingPlaneDistance";
import { autoMovieDrawingPolygonArea as autoMovieDrawingPolygonAreaImplementation } from "./internal/autoMovieDrawingPolygonArea";
import { autoMovieDrawingRange as autoMovieDrawingRangeImplementation } from "./internal/autoMovieDrawingRange";
import { autoMovieDrawingSilhouetteEdges as autoMovieDrawingSilhouetteEdgesImplementation } from "./internal/autoMovieDrawingSilhouetteEdges";
import { autoMovieDrawingSpaceBox as autoMovieDrawingSpaceBoxImplementation } from "./internal/autoMovieDrawingSpaceBox";
import { autoMovieDrawingToSvg as autoMovieDrawingToSvgImplementation } from "./internal/autoMovieDrawingToSvg";
import { autoMovieOpeningArc as autoMovieOpeningArcImplementation } from "./internal/autoMovieOpeningArc";
import { autoMovieOpeningArea as autoMovieOpeningAreaImplementation } from "./internal/autoMovieOpeningArea";
import { autoMovieOpeningExtent as autoMovieOpeningExtentImplementation } from "./internal/autoMovieOpeningExtent";
import { autoMovieOpeningFillExtent as autoMovieOpeningFillExtentImplementation } from "./internal/autoMovieOpeningFillExtent";
import { autoMovieOpeningHasArc as autoMovieOpeningHasArcImplementation } from "./internal/autoMovieOpeningHasArc";
import { autoMovieOpeningNominalExtent as autoMovieOpeningNominalExtentImplementation } from "./internal/autoMovieOpeningNominalExtent";
import { autoMovieOpeningOutlinePoints as autoMovieOpeningOutlinePointsImplementation } from "./internal/autoMovieOpeningOutlinePoints";
import { clipAutoMovieDrawingTriangles as clipAutoMovieDrawingTrianglesImplementation } from "./internal/clipAutoMovieDrawingTriangles";
import { deriveAutoMovieDrawing as deriveAutoMovieDrawingImplementation } from "./internal/deriveAutoMovieDrawing";
import { deriveAutoMovieDrawingSchedule as deriveAutoMovieDrawingScheduleImplementation } from "./internal/deriveAutoMovieDrawingSchedule";
import { draftAutoMovieDrawingLines as draftAutoMovieDrawingLinesImplementation } from "./internal/draftAutoMovieDrawingLines";
import { indexAutoMovieDrawingDesign as indexAutoMovieDrawingDesignImplementation } from "./internal/indexAutoMovieDrawingDesign";
import { measureAutoMovieQuantities as measureAutoMovieQuantitiesImplementation } from "./internal/measureAutoMovieQuantities";
import { projectAutoMovieDrawingPoint as projectAutoMovieDrawingPointImplementation } from "./internal/projectAutoMovieDrawingPoint";
import { resolveAutoMovieDrawingFeature as resolveAutoMovieDrawingFeatureImplementation } from "./internal/resolveAutoMovieDrawingFeature";
import { roundAutoMovieDrawingPoint as roundAutoMovieDrawingPointImplementation } from "./internal/roundAutoMovieDrawingPoint";
import { roundAutoMovieDrawingScalar as roundAutoMovieDrawingScalarImplementation } from "./internal/roundAutoMovieDrawingScalar";
import { roundAutoMovieDrawingVector as roundAutoMovieDrawingVectorImplementation } from "./internal/roundAutoMovieDrawingVector";
import { sectionAutoMovieDrawingSpaces as sectionAutoMovieDrawingSpacesImplementation } from "./internal/sectionAutoMovieDrawingSpaces";
import { transformAutoMovieDrawingPoint as transformAutoMovieDrawingPointImplementation } from "./internal/transformAutoMovieDrawingPoint";
import { transformAutoMovieDrawingTriangles as transformAutoMovieDrawingTrianglesImplementation } from "./internal/transformAutoMovieDrawingTriangles";
import { triangulateAutoMoviePolygon as triangulateAutoMoviePolygonImplementation } from "./internal/triangulateAutoMoviePolygon";

/** Package-owned drawing and quantity operations. */
export namespace AutoMovieEngineDrawing {
  /**
   * Place one boundary-local point in world space.
   *
   * The face's frame is a full rigid placement, so a wall out of plumb or a
   * sloping soffit resolves exactly here rather than being flattened to a
   * heading. `depth` walks along the face's local +Z axis, the authored outward
   * normal, which is how the two faces of a separation of stated thickness are
   * reached: the boundary shell places its caps at depth 0 and at the face
   * thickness. Validation does not check that +Z really points out of the space.
   *
   * The result is `origin + rotation * (x, y, depth)` in world metres: `point`
   * lies in the face's local XY plane and a negative `depth` moves along local
   * -Z. `face.rotation` is used as given and must be a unit quaternion, which
   * `validateBuiltEnvironment` requires; a non-unit one would scale the offset.
   *
   * @param face Boundary face whose rigid frame places the point.
   * @param point Point in the face's planar outline frame, in metres.
   * @param depth Offset along the face's local +Z axis in metres, default 0.
   * @returns World position in metres.
   */
  export function autoMovieBoundaryFacePoint(
    face: IAutoMovieBoundaryFace,
    point: IAutoMoviePlanarPoint,
    depth: number = 0,
  ): IAutoMovieVector3 {
    return autoMovieBoundaryFacePointImplementation(face, point, depth);
  }
  /**
   * The closed solid one boundary's declared face stands for, as world triangles.
   *
   * A separation is a slab, not a sheet: the face outline swept along its own
   * outward normal by its stated thickness. Both caps are triangulated so the
   * solid is closed, because a plan cut through an open shell would draw only the
   * two ends of a wall, and an elevation of an open shell would draft both rings
   * where one silhouette belongs.
   *
   * The outline may be concave, so the caps are ear-clipped by
   * {@link triangulateAutoMoviePolygon} rather than fanned from one corner, which
   * would put triangles outside an L-shaped soffit. Every triangle is wound
   * outward, which the silhouette pass reads as facing. The face must be the
   * validated record: an outline that is not a simple polygon of at least three
   * corners makes the triangulation throw.
   *
   * @param face Boundary face giving the rigid frame, outline and thickness.
   * @returns `2n` side triangles and `2(n - 2)` cap triangles for an `n`-corner
   *   outline, in world metres.
   */
  export function autoMovieBoundaryShellTriangles(
    face: IAutoMovieBoundaryFace,
  ): IAutoMovieDrawingTriangle[] {
    return autoMovieBoundaryShellTrianglesImplementation(face);
  }
  /**
   * Cross-section of one convex cell on the cut plane, as an unrounded page
   * polygon.
   *
   * Each world half-space `normal . p <= offset` becomes the page half-plane `a x
   * + b y <= c` through the frame's origin, right and up axes, and the section is
   * what survives clipping a square of half-extent
   * {@link AutoMovieEngineDrawingCellBound} by all of them. The square is what makes
   * an unbounded cell detectable: a result that still reaches it was never closed
   * by the design, so `bounded` is `false` and the caller reports a gap instead
   * of printing the square as a room.
   *
   * An empty `polygon` with `bounded: true` means the plane misses the cell. A
   * half-space parallel to the page keeps or removes the whole section by which
   * side of it the plane lies on.
   *
   * @param frame Orthonormal page basis of the view.
   * @param planes The cell's half-spaces; normals need not be unit length.
   * @returns The section's page corners in metres, counter-clockwise, and whether
   *   the cell closed it.
   */
  export function autoMovieDrawingCellSection(
    frame: IAutoMovieDrawingFrame,
    planes: readonly IAutoMovieHalfSpacePlane[],
  ): IAutoMovieDrawingCellSection.IResult {
    return autoMovieDrawingCellSectionImplementation(frame, planes);
  }
  /**
   * Volume of one bounded convex cell in cubic metres, from its own half-spaces,
   * or `null` when the cell is unbounded or degenerate.
   *
   * Every triple of planes is solved for its corner, corners outside any other
   * half-space are discarded, and the survivors are the cell's vertices. Each
   * face is then the hull of the vertices lying on one plane, and the volume is
   * the sum of the cones from the vertices' mean, an interior point of the convex
   * cell, to those faces.
   *
   * `null` covers fewer than four vertices and a face set whose area-weighted
   * normals do not cancel, which is how a cell open on one side is caught even
   * when it has enough corners: a column bounded on four sides and open at the
   * top would otherwise report zero, and a wedge with two capping planes would
   * report a wrong number. Planes repeated exactly or as a scaled copy are
   * counted once, so a repeated half-space adds no second cone.
   *
   * @param planes The cell's half-spaces `normal . p <= offset`; normals must be
   *   non-zero, which validation enforces, and need not be unit length.
   * @returns The cell's volume in cubic metres, or `null`.
   */
  export function autoMovieDrawingCellVolume(
    planes: readonly IAutoMovieHalfSpacePlane[],
  ): number | null {
    return autoMovieDrawingCellVolumeImplementation(planes);
  }
  /**
   * Where the cut plane passes through a triangle soup, as world segments.
   *
   * One segment per triangle with a corner strictly on each side of the plane,
   * beyond {@link AutoMovieEngineDrawingEpsilon}. A triangle lying in the plane, or
   * only touching it, contributes nothing: a face tangent to the cut is not a
   * section, and emitting its edges would draw every interior diagonal of a slab
   * whose top sits at the cut height.
   *
   * Segments are neither joined into loops nor deduplicated; the drafter rounds
   * and deduplicates them with the rest of the linework.
   *
   * @param frame Page basis whose origin and normal define the cut plane.
   * @param triangles World triangles of one drawable.
   * @returns One world segment per straddling triangle, in input order.
   */
  export function autoMovieDrawingCutEdges(
    frame: IAutoMovieDrawingFrame,
    triangles: readonly IAutoMovieDrawingTriangle[],
  ): IAutoMovieDrawingEdge[] {
    return autoMovieDrawingCutEdgesImplementation(frame, triangles);
  }
  /**
   * World triangles of an element's model, or of a chosen subset of its parts.
   *
   * Each part's model-frame tessellation comes from the index's memo and is
   * placed by the element's world matrix, so the result stands where the staged
   * scene puts the element. The caller resolves `model` from the element first,
   * because a missing model is a gap only the caller can word.
   *
   * @param design Index of the design the element belongs to.
   * @param element Element whose world matrix places the model.
   * @param model The element's environment-owned model.
   * @param parts Parts to include; every part of the model when omitted.
   * @returns New world triangles in metres, part by part in the given order.
   */
  export function autoMovieDrawingElementTriangles(
    design: IAutoMovieDrawingDesignIndex,
    element: IAutoMovieBuiltElement,
    model: IAutoMovieModel,
    parts: readonly IAutoMovieModelPart[] = model.parts,
  ): IAutoMovieDrawingTriangle[] {
    return autoMovieDrawingElementTrianglesImplementation(
      design,
      element,
      model,
      parts,
    );
  }
  /**
   * The page box that holds everything a sheet puts on paper, or `null` when
   * nothing is placed.
   *
   * Line ends, region and opening outline corners, resolved dimension ends and
   * resolved note anchors all count. Dimensions and notes are why this is not the
   * box around the linework: a dimension string is drawn beside the plan and a
   * note is led out past what it describes, and the serializer sizes the page
   * from this box, so anything outside it would fall outside the viewBox. A note
   * contributes its anchor, not its glyphs, which the derivation cannot measure
   * without font metrics and declares as a gap; a stale target has no place on
   * the page and contributes nothing.
   *
   * @param drawing The drawing's placed content.
   * @returns The page box in metres, or `null`.
   */
  export function autoMovieDrawingExtent(
    drawing: Pick<
      IAutoMovieDrawing,
      "lines" | "regions" | "openings" | "dimensions" | "annotations"
    >,
  ): IAutoMovieDrawingExtent | null {
    return autoMovieDrawingExtentImplementation(drawing);
  }
  /**
   * Validate one view's placement and resolve its orthonormal page basis.
   *
   * One rule serves every projection: the plane normal points back at the viewer
   * (`-direction`, normalized), the page right axis is `up x normal`, and the
   * page up axis is re-orthogonalized as `normal x right`, so an author may write
   * a nearby cardinal direction instead of an exact in-plane vector. The origin
   * is the view's own origin and is where the cut plane passes.
   *
   * A reflected ceiling plan negates the page right axis, and that single
   * negation is the whole reflection: a coffer then lands on the same page point
   * as the column under it does in the floor plan, so the two sheets overlay.
   *
   * Throws an `Error` naming the view for a non-finite or zero direction or up,
   * an up parallel to the direction, a non-finite origin, a scale that is not a
   * finite positive number, and a `depth` or `overhead` that is neither `null`
   * nor a finite non-negative number.
   *
   * @param view The authored view.
   * @returns The page basis with unit `right`, `up` and `normal` axes.
   */
  export function autoMovieDrawingFrame(
    view: IAutoMovieDrawingView,
  ): IAutoMovieDrawingFrame {
    return autoMovieDrawingFrameImplementation(view);
  }
  /**
   * Whether a projection cuts: removes the material on the viewer's side of its
   * plane and drafts what the plane passes through.
   *
   * Every projection except `elevation` cuts, so a plan, a reflected ceiling plan
   * and a section all draw cut linework and room regions, while an elevation only
   * projects. A new projection added to the closed union is a cutting one unless
   * this rule is changed with it.
   *
   * @param projection The view's projection.
   * @returns `true` for every projection other than `elevation`.
   */
  export function autoMovieDrawingHasCut(
    projection: AutoMovieDrawingProjection,
  ): boolean {
    return autoMovieDrawingHasCutImplementation(projection);
  }
  /**
   * The logical spaces a view draws, descendants included, or `null` for all.
   *
   * An empty `view.spaces` filter means every space. Otherwise the named spaces
   * and every space below them in the space hierarchy are included, because a
   * view filtered to a storey means the rooms in it, and a filter that stopped at
   * the named record would draw an empty sheet for every building that partitions
   * its floors. A named space the design does not declare stays in the set and
   * selects nothing; the caller reports it as a gap.
   *
   * @param environment The validated design, whose space parents resolve and are
   *   acyclic.
   * @param view The view whose space filter applies.
   * @returns The included space ids, or `null` when the view does not filter.
   */
  export function autoMovieDrawingIncludedSpaces(
    environment: IAutoMovieBuiltEnvironment,
    view: IAutoMovieDrawingView,
  ): Set<string> | null {
    return autoMovieDrawingIncludedSpacesImplementation(environment, view);
  }
  /**
   * One opening as a drawing can state it, and what that statement rests on.
   *
   * The size and basis come from {@link autoMovieOpeningNominalExtent}, the rule
   * the schedule also reads: an opening with its own void is marked with `basis:
   * "profile"`, its hull size, and its drafted outline placed on the host
   * boundary's face and projected onto the page on the grid; one sized by its
   * filling element is `basis: "fill"` with an empty outline, because the leaf's
   * extent is not the hole's shape; one with neither is `basis: "none"` with
   * `null` sizes. Validation guarantees a profiled opening's host boundary has a
   * face, which the outline placement relies on.
   *
   * @param design Index of the validated design.
   * @param frame The view's page basis.
   * @param opening Opening to mark.
   * @returns The opening's mark, carrying its identity, basis, outline and size.
   */
  export function autoMovieDrawingOpeningMark(
    design: IAutoMovieDrawingDesignIndex,
    frame: IAutoMovieDrawingFrame,
    opening: IAutoMovieBuiltOpening,
  ): IAutoMovieDrawingOpeningMark {
    return autoMovieDrawingOpeningMarkImplementation(design, frame, opening);
  }
  /**
   * Triangles of one model part in the model's frame, with the part's own
   * transform applied.
   *
   * A primitive is tessellated by the engine's own kernel, so the drawing and the
   * renderer read one description of a box. An imported mesh is taken as written,
   * indexed or not, and its winding is kept because the silhouette pass reads it.
   * Bicubic recipes use the same canonical engine realization as display,
   * including finite partial output; processing qualification is not a drawing
   * gate.
   *
   * Throws an `Error` naming the model and part when the position array is not
   * whole `x, y, z` triples, the index array is not whole triangles, or an index
   * is not an integer naming one of the vertices: drawing whatever prefix happens
   * to divide evenly would hide an authoring defect behind a plausible outline.
   *
   * @param model Model owning the part; used for its id in failures.
   * @param part Part whose geometry and transform are read.
   * @returns The part's triangles in model-frame metres.
   */
  export function autoMovieDrawingPartTriangles(
    model: IAutoMovieModel,
    part: IAutoMovieModelPart,
  ): IAutoMovieDrawingTriangle[] {
    return autoMovieDrawingPartTrianglesImplementation(model, part);
  }
  /**
   * Signed distance in metres from a view's cut plane to a world point.
   *
   * The cut plane passes through the frame's origin with the frame's unit normal,
   * which points back at the viewer, so a positive distance is on the viewer's
   * side, the side a cut removes, and a negative one lies beyond the plane.
   *
   * @param frame Page basis whose origin and unit normal define the plane.
   * @param point World point in metres.
   * @returns `(point - origin) . normal`, in metres.
   */
  export function autoMovieDrawingPlaneDistance(
    frame: IAutoMovieDrawingFrame,
    point: IAutoMovieVector3,
  ): number {
    return autoMovieDrawingPlaneDistanceImplementation(frame, point);
  }
  /**
   * Unsigned area of a simple page polygon, in square metres.
   *
   * The polygon is an implicitly closed ring, so the result does not depend on
   * its winding. Fewer than three corners enclose nothing and yield `0`. A
   * self-crossing ring yields the net of its lobes, so callers pass simple
   * polygons, such as the convex cell sections the drafter produces.
   *
   * @param polygon Page corners in metres.
   * @returns The enclosed area in square metres.
   */
  export function autoMovieDrawingPolygonArea(
    polygon: readonly IAutoMovieDrawingPoint[],
  ): number {
    return autoMovieDrawingPolygonAreaImplementation(polygon);
  }
  /**
   * The lowest and highest of a run of numbers, folded in one pass.
   *
   * `Math.min(...values)` passes one argument per element and overflows the call
   * stack past roughly a hundred thousand values, which an ordinary imported mesh
   * exceeds, so every extreme the drawing and schedule derivations take is folded
   * here instead. Any iterable is accepted, so a caller can stream values without
   * building an array.
   *
   * An empty run yields the identities `{ min: +Infinity, max: -Infinity }`, so a
   * caller that forgot to check for emptiness sees an inverted range rather than
   * a thrown `undefined`. `NaN` values are skipped by the comparisons.
   *
   * @param values Numbers to fold.
   * @returns The smallest and largest value seen.
   */
  export function autoMovieDrawingRange(
    values: Iterable<number>,
  ): IAutoMovieDrawingRange.IResult {
    return autoMovieDrawingRangeImplementation(values);
  }
  /**
   * Silhouette of a triangle soup under the view's orthographic direction.
   *
   * An edge is drawn when the faces meeting along it disagree about facing the
   * viewer, or when only one face owns it. A face's facing is the sign of its
   * winding normal against the frame normal, and an edge-on face counts as facing
   * away, which is what makes a plan of an upright box its four top edges: the
   * top faces the viewer, the walls are edge-on, and the disagreement along each
   * top edge is the outline. Degenerate triangles are skipped.
   *
   * Corners are welded on the rounded output grid before edges are keyed, so two
   * triangles meeting at one corner are recognised as meeting there even when the
   * arithmetic that produced it differed in a last bit. Two corners closer than
   * the grid but on opposite sides of a rounding boundary are not welded.
   *
   * @param frame Page basis whose normal points back at the viewer.
   * @param triangles World triangles of one drawable, in their source winding.
   * @returns One world edge per silhouette or border edge, in first-seen order.
   */
  export function autoMovieDrawingSilhouetteEdges(
    frame: IAutoMovieDrawingFrame,
    triangles: readonly IAutoMovieDrawingTriangle[],
  ): IAutoMovieDrawingEdge[] {
    return autoMovieDrawingSilhouetteEdgesImplementation(frame, triangles);
  }
  /**
   * The world box a space's own declared volume fills, on the drawing grid, or
   * `null` when it declares none this can state exactly.
   *
   * A shell states its vertices, so its box is their bounds. Cells state
   * half-spaces, and a box follows from them only where every plane faces one
   * axis and every axis is closed on both sides; the space's box is then the
   * union of its cells' boxes. A chamfered cell, a cell left open on one side and
   * a space with neither cells nor shell yield `null` rather than an
   * approximation, because a room schedule that printed a made-up extent would be
   * read as a measurement.
   *
   * @param space The validated space.
   * @returns The declared box in world metres, or `null`.
   */
  export function autoMovieDrawingSpaceBox(
    space: IAutoMovieBuiltSpace,
  ): IAutoMovieDrawingScheduleBox | null {
    return autoMovieDrawingSpaceBoxImplementation(space);
  }
  /**
   * Serialize one derived drawing as a self-describing SVG sheet.
   *
   * Every line carries its owner, space, layer and role; every region its space,
   * cell, kind, finish and area; every opening its identity, basis and size, as
   * an empty group when it has no outline; every dimension and note its status,
   * as an empty group with its reason when stale; and every gap is a marker, so a
   * sheet cannot look complete while its record says it is not. The root carries
   * the drawing's protocol, view, environment, projection, discipline, scale and
   * digest.
   *
   * The scale is drafting scale: one model metre is `1000 / scale` page
   * millimetres, so a 1:50 plan prints at 1:50, and pen weights and text height
   * are page millimetres. The page is the drawing's extent plus a fixed
   * {@link AutoMovieEngineDrawingSvgMargin} on each side, with y flipped because SVG
   * y grows downward. Numbers are rounded and printed to three decimals and every
   * attribute value is XML-escaped, so one drawing and view yield one byte
   * sequence.
   *
   * Throws an `Error` when the view is not the one the drawing was derived from,
   * or its pen has a weight, dash or text height that is not a finite positive
   * number.
   *
   * @param props.drawing Drawing to serialize.
   * @param props.view View the drawing was derived from; supplies the pen.
   * @returns The SVG document, lines separated by `\n`, without a trailing
   *   newline.
   */
  export function autoMovieDrawingToSvg(
    props: IAutoMovieDrawingToSvg.IProps,
  ): string {
    return autoMovieDrawingToSvgImplementation(props);
  }
  /**
   * The circular arc one opening-profile edge bulges along, or `null` when the
   * edge is straight.
   *
   * The bulge is the DXF value `tan(|sweep| / 4)`, and a positive bulge leans to
   * the left of the edge's own direction, the same convention `outlineHull`
   * places its sagitta by. The centre therefore sits on the chord's right for a
   * positive bulge, at a signed distance that runs to infinity as the bulge goes
   * to zero, and the sweep runs clockwise, which is what puts the arc on the
   * left. A bulge within {@link AutoMovieEngineOpeningBulgeEpsilon} of zero, or an
   * edge with coincident ends, is straight.
   *
   * @param from Edge start, in profile-frame metres.
   * @param to Edge end, in profile-frame metres.
   * @param bulge The edge's bulge; validation keeps it within `[-1, 1]`.
   * @returns The arc's circle, start angle and signed sweep, or `null`.
   */
  export function autoMovieOpeningArc(
    from: IAutoMoviePlanarPoint,
    to: IAutoMoviePlanarPoint,
    bulge: number,
  ): IAutoMovieOpeningArc | null {
    return autoMovieOpeningArcImplementation(from, to, bulge);
  }
  /**
   * The exact area of an opening's void, in square metres, on the drawing grid.
   *
   * Exact rather than the bounding hull's area, because an area is what glass is
   * ordered by while the hull is what a hole is cut for: the hull errs towards
   * refusing, and carrying that error into a take-off would over-order every
   * arch. The straight polygon's signed area is corrected by each arc's circular
   * segment `r^2 (sweep - sin sweep) / 2` in closed form, not by sampling the
   * chords the drawing drafts. The result is unsigned, so the outline may wind
   * either way, and the profile must be the validated simple outline.
   *
   * @param profile Opening profile with its outline and optional bulges.
   * @returns The void's area in square metres, rounded to the drawing grid.
   */
  export function autoMovieOpeningArea(
    profile: IAutoMovieOpeningProfile,
  ): number {
    return autoMovieOpeningAreaImplementation(profile);
  }
  /**
   * The width and height of an opening's void, in its host face's metres, on the
   * drawing grid.
   *
   * Taken from the engine's own bounding hull of the outline rather than a second
   * arithmetic: `builtBoundaryWallCut` hands that hull to the mesh kernel as the
   * rectangle it cuts, and validation holds the void inside its face by the same
   * hull, so the schedule prints the size of the hole the building has. The hull
   * is tight for an arc on a chord parallel to a face axis, such as an arched
   * head or a round oculus written as two half turns, and larger than the arc for
   * a tilted chord.
   *
   * @param profile Opening profile with its outline and optional bulges.
   * @returns Extent along the face's local X (`width`) and Y (`height`).
   */
  export function autoMovieOpeningExtent(
    profile: IAutoMovieOpeningProfile,
  ): IAutoMovieOpeningExtent.IResult {
    return autoMovieOpeningExtentImplementation(profile);
  }
  /**
   * The nominal width and height a set of world corners stands for, on the
   * drawing grid, reading world `+Y` as up.
   *
   * Openings and rooms stand up: the world Y extent is the height, and the wider
   * of the X and Z extents is the width. A leaf lying on its side therefore reads
   * as a wide, thin opening, which is what its bounding extents say, and is why
   * every report of a fill's size labels it as the leaf's and not the hole's. An
   * empty corner set yields non-finite spans, so callers pass at least one
   * corner.
   *
   * @param corners World corners in metres, such as a filling element's triangle
   *   corners or a room box's two extremes.
   * @returns The wider horizontal span as `width` and the vertical span as
   *   `height`, in metres.
   */
  export function autoMovieOpeningFillExtent(
    corners: readonly IAutoMovieVector3[],
  ): IAutoMovieOpeningFillExtent.IResult {
    return autoMovieOpeningFillExtentImplementation(corners);
  }
  /**
   * Whether any edge of an opening profile bulges into a visible arc.
   *
   * Uses the same {@link AutoMovieEngineOpeningBulgeEpsilon} threshold as
   * `autoMovieOpeningArc`, so a profile reported here as arced has a bulge the
   * drafted outline and the measured area also treat as curved, unless that
   * edge's ends coincide. Absent bulges mean every edge is straight.
   *
   * @param profile Opening profile to inspect.
   * @returns `true` when at least one bulge exceeds the straight-edge threshold.
   */
  export function autoMovieOpeningHasArc(
    profile: IAutoMovieOpeningProfile,
  ): boolean {
    return autoMovieOpeningHasArcImplementation(profile);
  }
  /**
   * The nominal width and height of one opening, and what they were measured
   * from, or `null` when nothing in the design sizes it.
   *
   * The opening's own void wins: it is the only record that describes the hole,
   * and its size is the hull the wall kernel cuts (`basis: "profile"`). Without
   * one, the filling element's world extent stands in (`basis: "fill"`), which is
   * the leaf and not the hole, so every caller labels it. An opening with
   * neither, or whose fill has no environment-owned model or no triangles, is
   * `null`. The drawing and the schedule both read this, so a sheet and a
   * schedule cannot size one opening two ways.
   *
   * @param design Index of the validated design that owns the opening.
   * @param opening Opening to size.
   * @returns The basis and the size in metres on the drawing grid, or `null`.
   */
  export function autoMovieOpeningNominalExtent(
    design: IAutoMovieDrawingDesignIndex,
    opening: IAutoMovieBuiltOpening,
  ): IAutoMovieOpeningNominalExtent.IResult {
    return autoMovieOpeningNominalExtentImplementation(design, opening);
  }
  /**
   * Flatten a profile outline into the points a drawing drafts it through.
   *
   * Each edge contributes its start point, and a bulged edge then contributes the
   * interior chord points of its arc at a fixed angular step of
   * {@link AutoMovieEngineDrawingArcStep}, so the returned ring is an implicitly
   * closed polyline in the profile's planar frame. The density is fixed rather
   * than adaptive so a drawing's linework, and its digest, depend on the design
   * and not on the size of the arc.
   *
   * This is drafting, not measurement: the schedule reads the hull through
   * `autoMovieOpeningExtent` and the take-off reads the exact area through
   * `autoMovieOpeningArea`, and neither reads these chords.
   *
   * @param profile Opening profile with its outline and optional bulges.
   * @returns The drafted ring, in profile-frame metres.
   */
  export function autoMovieOpeningOutlinePoints(
    profile: IAutoMovieOpeningProfile,
  ): IAutoMoviePlanarPoint[] {
    return autoMovieOpeningOutlinePointsImplementation(profile);
  }
  /**
   * Keep only the part of a triangle soup beyond the cut plane, the side a cut
   * leaves standing.
   *
   * Each triangle is clipped against the plane, with corners within
   * {@link AutoMovieEngineDrawingEpsilon} of it kept, and the surviving convex polygon
   * is re-fanned into triangles that keep the source winding. New edges lying in
   * the plane are exactly what the cut linework draws, and the drafter drops
   * their silhouette so no segment is drafted twice.
   *
   * @param frame Page basis whose origin and normal define the cut plane.
   * @param triangles World triangles of one drawable.
   * @returns The kept triangles, in input order, in world metres.
   */
  export function clipAutoMovieDrawingTriangles(
    frame: IAutoMovieDrawingFrame,
    triangles: readonly IAutoMovieDrawingTriangle[],
  ): IAutoMovieDrawingTriangle[] {
    return clipAutoMovieDrawingTrianglesImplementation(frame, triangles);
  }
  /**
   * Derive one drawing from one design and one view.
   *
   * Throws an `Error` when the design fails `validateBuiltEnvironment`, naming
   * the first violation, because a drawing of a graph that does not resolve would
   * be a picture of nothing handed on as evidence. Throws when the view is
   * degenerate, as `autoMovieDrawingFrame` describes, and when it declares two
   * dimensions or two annotations with one id, since a consumer addresses them by
   * id.
   *
   * Everything is computed from the design: lines from element and face-only
   * boundary geometry in each element's current operating state, regions from the
   * cells a cutting view passes through, opening marks from each opening's void
   * or fill, and dimensions and notes from the features their targets pin.
   * Nothing produced here may be read back into the design. What cannot be
   * computed is reported in {@link IAutoMovieDrawing.gaps} rather than omitted,
   * because a sheet that silently leaves something out reads as a building
   * without it. Openings are marked whatever the kind filter says, because the
   * schedule counts them all, and only the space filter selects them.
   *
   * The digest is SHA-256 over the canonical JSON of every other field. Identical
   * canonical payloads give identical digests; a shared digest does not prove
   * field equality because SHA-256 collisions are possible.
   *
   * @param props.environment Design the drawing is taken from.
   * @param props.view View that decides the cut, the direction, the filters and
   *   the targets.
   * @returns The drawing, with sorted lines, regions, openings and gaps and the
   *   view's own dimension and note order.
   */
  export function deriveAutoMovieDrawing(
    props: IAutoMovieDeriveDrawing.IProps,
  ): IAutoMovieDrawing {
    return deriveAutoMovieDrawingImplementation(props);
  }
  /**
   * Schedule every declared space, opening or connector of one design.
   *
   * Throws an `Error` naming the first violation when the design fails
   * `validateBuiltEnvironment`. The schedule and the drawing are two readings of
   * one graph: rows come from the design's own records, so `total` is the number
   * of spaces, openings or connectors it declares, and the row counts sum to it
   * by construction.
   *
   * Openings and connectors are grouped into type rows by kind, model, nominal
   * size and basis; a room is its own row, because two alike rooms are still two
   * rooms to visit. Rows are ordered by kind, model, size, basis and first
   * member, and marked `<kind>-NN` in that order. A row names at most
   * {@link AutoMovieEngineDrawingScheduleMaxMembers} members and counts the rest.
   *
   * An opening's size comes from its authored void or its fill's world extent,
   * labelled fill because the leaf is not the hole; with neither source its sizes
   * remain null and unmeasured. A connector uses its narrowest and lowest
   * declared section. Room rows carry declared-volume and measured-content boxes
   * plus graph relations. A grouped opening/connector row keeps the first sorted
   * occurrence's place, so that location does not describe every member; missing
   * schedule content is stated in gaps.
   *
   * The digest is SHA-256 over the canonical JSON of every other field.
   *
   * This function takes no drawing view and applies no view space or element-kind
   * filter. A space row also includes semantic or unlocated containers, so the
   * whole-design total need not equal the visible members of a filtered drawing.
   * The member-name limit bounds each returned row's named prefix, while
   * occurrences and grouping still process the full selected subject population.
   *
   * @param props.environment Design the schedule is derived from.
   * @param props.subject What to schedule.
   * @returns The schedule record.
   */
  export function deriveAutoMovieDrawingSchedule(
    props: IAutoMovieDeriveDrawingSchedule.IProps,
  ): IAutoMovieDrawingSchedule {
    return deriveAutoMovieDrawingScheduleImplementation(props);
  }
  /**
   * Draft every line one view draws of one validated design, classified by its
   * relation to the cut plane, deduplicated and in canonical order.
   *
   * Drawables are the elements with an environment-owned model and the boundaries
   * that carry a face and are realized by no element, each kept only when `drawn`
   * accepts its kind and space; a boundary is accepted through any space it
   * separates and carries its first space, so a party wall reads the same on both
   * rooms' sheets. An element citing a builder-owned runtime model cannot be
   * drawn and is counted in `unresolvedModels` for the caller's gap.
   *
   * Each drawable is classified by its nearest and deepest corner: wholly on the
   * viewer's side of a cut it is `overhead` while within `view.overhead` and
   * omitted beyond it; wholly deeper than `view.depth` it is `hidden`; otherwise
   * a cut view drafts its section as `cut` and the silhouette of what stands
   * beyond the plane as `projected`. Silhouettes lying in the cut plane are
   * dropped because the cut already draws them. Points are rounded onto the grid,
   * zero-length strokes are dropped, each stroke runs from its smaller point,
   * identical strokes are merged, and the result is sorted by role order, layer,
   * owner and points.
   *
   * @param props.environment The validated design.
   * @param props.view The view whose depth bands apply.
   * @param props.frame The view's resolved page basis.
   * @param props.design Index of `environment`.
   * @param props.cut Whether the view's projection cuts.
   * @param props.drawn Whether a kind and space pass the view's filters.
   * @returns The sorted lines and the count of undrawable elements.
   */
  export function draftAutoMovieDrawingLines(
    props: IAutoMovieDraftDrawingLines.IProps,
  ): IAutoMovieDraftDrawingLines.IResult {
    return draftAutoMovieDrawingLinesImplementation(props);
  }
  /**
   * Index one validated built environment for a drawing derivation.
   *
   * Builds the id lookups every derivation needs, stages every element with
   * `builtEnvironmentWorldMatrices` in its current operating state, and wraps
   * part tessellation in a per-index memo. A derivation builds one index and
   * passes it to every helper, so no lookup scans the environment twice and no
   * part is tessellated twice.
   *
   * The environment must be valid: parents must resolve and be acyclic, as
   * `validateBuiltEnvironment` enforces, or staging throws.
   *
   * @param environment Validated design to index.
   * @returns The index, owned by the caller for one derivation.
   */
  export function indexAutoMovieDrawingDesign(
    environment: IAutoMovieBuiltEnvironment,
  ): IAutoMovieDrawingDesignIndex {
    return indexAutoMovieDrawingDesignImplementation(environment);
  }
  /**
   * Measure everything the design can answer for, and name everything it cannot.
   *
   * Throws an `Error` when `maxContributors` is not a positive safe integer or
   * the design fails `validateBuiltEnvironment`. Every number is arithmetic over
   * authored geometry: a support surface's plan footprint area with holes
   * subtracted, attributed to its space; a space's volume as its shell's exact
   * volume or the sum of its cells' volumes; an opening void's exact area with
   * arcs; a connector route's polyline length; and counts of elements by kind,
   * openings by kind and model occurrences by model. Nothing is looked up,
   * defaulted or carried over from a previous revision.
   *
   * Every subject in {@link AutoMovieEngineQuantitySubjects} gets one finding, so an
   * absent quantity is a stated zero rather than a missing row. A finding names
   * its largest owners up to the bound, counts and sums the rest, and says
   * whether its total is exact; the space-volume total is approximate because
   * overlapping cells are summed. What cannot be measured is a gap. The digest is
   * SHA-256 over the canonical JSON of every other field.
   *
   * @param props.environment Design the quantities are measured from.
   * @param props.maxContributors Owners named per finding; defaults to
   *   {@link AutoMovieEngineQuantityMaxContributors}.
   * @returns The quantity report.
   */
  export function measureAutoMovieQuantities(
    props: IAutoMovieMeasureQuantities.IProps,
  ): IAutoMovieQuantityReport {
    return measureAutoMovieQuantitiesImplementation(props);
  }
  /**
   * Project one world point orthographically onto the view's page, unrounded.
   *
   * The page coordinates are the point's offset from the frame origin measured
   * along the frame's right and up axes, in metres; depth along the normal is
   * dropped. Callers round onto the drawing grid when they store the result.
   *
   * @param frame Orthonormal page basis of the view.
   * @param point World point in metres.
   * @returns The page point in metres.
   */
  export function projectAutoMovieDrawingPoint(
    frame: IAutoMovieDrawingFrame,
    point: IAutoMovieVector3,
  ): IAutoMovieDrawingPoint {
    return projectAutoMovieDrawingPointImplementation(frame, point);
  }
  /**
   * Resolve one pinned feature against the design as it stands now.
   *
   * A target stores where a feature is, not what it measured, so moving a wall
   * moves its dimension and changes its number; and it may store how many
   * features of its kind existed, so replacing a wall with a differently shaped
   * one is reported stale instead of relocating the note onto whichever feature
   * inherited the index. A feature that cannot be found is never approximated to
   * the nearest surviving one.
   *
   * Features are read from the element's world geometry in its current operating
   * state: `axis` is one of the element's three local axes (origin and unit
   * direction); `vertex` and `edge` index the welded corners and undirected edges
   * in coordinate order on the drawing grid, an edge resolving to its midpoint
   * and unit direction; `face` indexes the triangles in part and mesh order and
   * resolves to the triangle's centroid; `centroid` is the mean of the welded
   * corners, which is a vertex average rather than a volume centroid. Every
   * failure is a `stale` result whose `reason` names the cause and whose `count`
   * is the current feature count where one exists.
   *
   * @param environment The validated design.
   * @param feature The pinned target.
   * @param design Index of `environment` to reuse; built from it when omitted.
   * @returns The resolved world point and direction, or a stale result.
   */
  export function resolveAutoMovieDrawingFeature(
    environment: IAutoMovieBuiltEnvironment,
    feature: IAutoMovieDrawingFeature,
    design: IAutoMovieDrawingDesignIndex = indexAutoMovieDrawingDesignImplementation(
      environment,
    ),
  ): IAutoMovieDrawingFeatureResolution {
    return resolveAutoMovieDrawingFeatureImplementation(
      environment,
      feature,
      design,
    );
  }
  /**
   * Round both coordinates of a page point onto the drawing grid.
   *
   * Every page point a drawing stores passes through here, so lines, regions,
   * opening outlines, dimension ends and note anchors share one precision and a
   * point never carries `-0`.
   *
   * @param point Page point in metres.
   * @returns A new page point on the grid.
   */
  export function roundAutoMovieDrawingPoint(
    point: IAutoMovieDrawingPoint,
  ): IAutoMovieDrawingPoint {
    return roundAutoMovieDrawingPointImplementation(point);
  }
  /**
   * Round one drawing scalar onto the fixed output grid of
   * {@link AutoMovieEngineDrawingDecimals} decimal places.
   *
   * Halves round towards positive infinity, as `Math.round` does, and negative
   * zero is normalized to zero: `-0` and `0` stringify differently in a digest's
   * input, so without it a digest would depend on which side of an axis a value
   * approached from.
   *
   * @param value Scalar in the drawing's units, usually metres or square metres.
   * @returns The value on the grid, never `-0`.
   */
  export function roundAutoMovieDrawingScalar(value: number): number {
    return roundAutoMovieDrawingScalarImplementation(value);
  }
  /**
   * Round all three components of a world vector onto the drawing grid.
   *
   * Used for the world values a drawing or schedule stores, such as the drawing's
   * page frame and a room's declared and content boxes, so they share the page
   * precision and never carry `-0`.
   *
   * @param vector World vector or point.
   * @returns A new vector on the grid.
   */
  export function roundAutoMovieDrawingVector(
    vector: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return roundAutoMovieDrawingVectorImplementation(vector);
  }
  /**
   * Section every included logical space's convex cells on a cut view's plane.
   *
   * Each cell the plane passes through becomes one region with its page polygon
   * on the grid, its area and its finish, sorted by space and cell. A space's
   * finish is the one surface material every element realizing a boundary of that
   * space agrees on, or `null` when they disagree or name none, because a finish
   * plan that picked one wall's material would read as a specification.
   *
   * What cannot be sectioned is counted for the caller's gaps instead of drawn: a
   * space stated as a closed shell (`shelled`, since only half-space cells are
   * cut), a cell its half-spaces leave unbounded (`unbounded`), and the ids of
   * included spaces declaring a faceted volume (`faceted`, sorted), whose regions
   * are drawn but stand for a curved region.
   *
   * @param props.environment The validated design.
   * @param props.frame The cut view's page basis.
   * @param props.design Index of `environment`.
   * @param props.spaces Spaces the view includes, or `null` for every space.
   * @returns The regions and the counts and ids behind the section gaps.
   */
  export function sectionAutoMovieDrawingSpaces(
    props: IAutoMovieSectionDrawingSpaces.IProps,
  ): IAutoMovieSectionDrawingSpaces.IResult {
    return sectionAutoMovieDrawingSpacesImplementation(props);
  }
  /**
   * Apply a column-major 4x4 affine matrix to a point.
   *
   * The matrix is the sixteen-number column-major array `Matrix4.compose` and
   * `Matrix4.multiply` produce, with the translation in elements 12 to 14. The
   * projective row is ignored, so the matrix must be affine, which every composed
   * TRS matrix is.
   *
   * @param matrix Column-major affine matrix of sixteen numbers.
   * @param point Point to transform.
   * @returns The transformed point, in the matrix's target frame.
   */
  export function transformAutoMovieDrawingPoint(
    matrix: readonly number[],
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return transformAutoMovieDrawingPointImplementation(matrix, point);
  }
  /**
   * Move every triangle of a list by one column-major affine matrix, usually an
   * element's world matrix.
   *
   * Corner order is kept, so the winding the silhouette pass reads survives
   * whenever the matrix preserves orientation. A mirroring matrix, one with a
   * negative determinant from an odd number of negative scale axes, reverses the
   * apparent facing of every triangle, and the drafter does not compensate.
   *
   * @param matrix Column-major affine matrix of sixteen numbers.
   * @param triangles Triangles in the matrix's source frame.
   * @returns New triangles in the matrix's target frame, in input order.
   */
  export function transformAutoMovieDrawingTriangles(
    matrix: readonly number[],
    triangles: readonly IAutoMovieDrawingTriangle[],
  ): IAutoMovieDrawingTriangle[] {
    return transformAutoMovieDrawingTrianglesImplementation(matrix, triangles);
  }
  /**
   * Ear-clip one simple planar polygon into triangle index triples.
   *
   * Each pass clips the best-scoring remaining corner: a reflex or straight
   * corner scores below a convex corner whose triangle still covers another
   * remaining corner, which scores below a true ear, and among ears the one with
   * the largest turn, the fattest, wins, with ties going to the earliest
   * position. Scoring rather than searching for an ear means some corner is
   * always best, so every pass makes progress.
   *
   * Throws an `Error` for fewer than three corners, and with the
   * {@link AutoMovieEnginePlanarRegion.failure} message for a ring that is not one
   * unambiguous region, because a triangle of undefined or crossing corners would
   * put a face of nothing into a drawing.
   *
   * The ring is walked counter-clockwise whichever way it was authored, so a
   * clockwise outline triangulates as its own region rather than clipping its
   * reflex corners as ears.
   *
   * @param polygon Simple ring in a planar frame, either winding.
   * @returns `n - 2` triples of indices into `polygon`, each wound
   *   counter-clockwise.
   */
  export function triangulateAutoMoviePolygon(
    polygon: readonly IAutoMoviePlanarPoint[],
  ): Array<[number, number, number]> {
    return triangulateAutoMoviePolygonImplementation(polygon);
  }
}
