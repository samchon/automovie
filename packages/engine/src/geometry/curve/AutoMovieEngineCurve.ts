import { type IAutoMovieAdmitContourEvents64, type IAutoMovieContourLoft64, type IAutoMoviePlanContourSlabs64Props, type IAutoMovieCurvePrimitive64, type IAutoMovieCurveBoundary64, type IAutoMovieBicubicAtlasPlan64, type IAutoMovieBicubicAtlasTessellation64, type IAutoMovieBicubicAtlasRegistry64, type IAutoMovieBicubicAtlas64, type IAutoMovieCanonicalBoundaryPhase64, type IAutoMovieBicubicAtlasVertex64, type AutoMovieVector3Tuple, type IAutoMovieEvaluateBernstein64, type IAutoMovieBernsteinCurvePiece64, type IAutoMovieEvaluateCurve64, type IAutoMovieEvaluateHermiteGregory64, type IAutoMovieEvaluateImplicitProjection64, type IAutoMovieContourLoftEmission64, type IAutoMovieContourLoftSink64, type IAutoMovieGenerateSupportCurve64, type IAutoMovieMeasureContourFace64, type IAutoMovieCurveLengthMeasurement64, type IAutoMovieCubicBezierCurve64, type IAutoMovieMeasureCurveLength64, type IAutoMoviePlanContourSlabs64Slab, type IAutoMoviePlanContourWalks64Plans, type IAutoMoviePlanContourWalks64Ring, type IAutoMoviePlanLocalHermite64, type IAutoMovieLocalHermiteStream64, type IAutoMoviePrepareBicubicAtlasBoundary64, type IAutoMoviePrepareContourBoundaries64, type IAutoMovieContourLoftCurves64, type IAutoMoviePrepareContourBoundaries64Ring, type IAutoMoviePrepareContourBoundaries64Group, type IAutoMoviePrepareContourDocument64Document, type IAutoMovieRefineContourInteractions64, type IAutoMovieRefineContourInteractions64Ring, type IAutoMovieSampleContourRing64, type IAutoMovieSplitContourLeaf64, type IAutoMovieTessellateContourPath64, type IAutoMovieObservation, type IAutoMovieTessellateParametricAtlas64 } from "@automovie/interface";
import { admitAutoMovieContourEvents64 as admitAutoMovieContourEvents64Implementation } from "./internal/admitAutoMovieContourEvents64";
import { admitAutoMovieContourIntervals64 as admitAutoMovieContourIntervals64Implementation } from "./internal/admitAutoMovieContourIntervals64";
import { assertAutoMovieCurve64 as assertAutoMovieCurve64Implementation } from "./internal/assertAutoMovieCurve64";
import { assertAutoMovieCurveBoundary64 as assertAutoMovieCurveBoundary64Implementation } from "./internal/assertAutoMovieCurveBoundary64";
import { AutoMovieBicubicAtlasPlan64 as AutoMovieBicubicAtlasPlan64Implementation } from "./internal/AutoMovieBicubicAtlasPlan64";
import { AutoMovieBicubicAtlasRegistry64 as AutoMovieBicubicAtlasRegistry64Implementation } from "./internal/AutoMovieBicubicAtlasRegistry64";
import { AutoMovieBicubicAtlasVertex64 as AutoMovieBicubicAtlasVertex64Implementation } from "./internal/AutoMovieBicubicAtlasVertex64";
import { compileAutoMovieNormalizedPhases64 as compileAutoMovieNormalizedPhases64Implementation } from "./internal/compileAutoMovieNormalizedPhases64";
import { computeAutoMovieContourNormals64 as computeAutoMovieContourNormals64Implementation } from "./internal/computeAutoMovieContourNormals64";
import { evaluateAutoMovieBernstein64 as evaluateAutoMovieBernstein64Implementation } from "./internal/evaluateAutoMovieBernstein64";
import { evaluateAutoMovieCurve64 as evaluateAutoMovieCurve64Implementation } from "./internal/evaluateAutoMovieCurve64";
import { evaluateAutoMovieHermiteGregory64 as evaluateAutoMovieHermiteGregory64Implementation } from "./internal/evaluateAutoMovieHermiteGregory64";
import { evaluateAutoMovieImplicitProjection64 as evaluateAutoMovieImplicitProjection64Implementation } from "./internal/evaluateAutoMovieImplicitProjection64";
import { generateAutoMovieContourLoft64 as generateAutoMovieContourLoft64Implementation } from "./internal/generateAutoMovieContourLoft64";
import { generateAutoMovieSupportCurve64 as generateAutoMovieSupportCurve64Implementation } from "./internal/generateAutoMovieSupportCurve64";
import { measureAutoMovieContourFace64 as measureAutoMovieContourFace64Implementation } from "./internal/measureAutoMovieContourFace64";
import { measureAutoMovieCubicCurveLength64 as measureAutoMovieCubicCurveLength64Implementation } from "./internal/measureAutoMovieCubicCurveLength64";
import { measureAutoMovieCurveLength64 as measureAutoMovieCurveLength64Implementation } from "./internal/measureAutoMovieCurveLength64";
import { planAutoMovieContourSlabs64 as planAutoMovieContourSlabs64Implementation } from "./internal/planAutoMovieContourSlabs64";
import { planAutoMovieContourWalks64 as planAutoMovieContourWalks64Implementation } from "./internal/planAutoMovieContourWalks64";
import { planAutoMovieLocalHermite64 as planAutoMovieLocalHermite64Implementation } from "./internal/planAutoMovieLocalHermite64";
import { prepareAutoMovieBicubicAtlasBoundary64 as prepareAutoMovieBicubicAtlasBoundary64Implementation } from "./internal/prepareAutoMovieBicubicAtlasBoundary64";
import { prepareAutoMovieContourBoundaries64 as prepareAutoMovieContourBoundaries64Implementation } from "./internal/prepareAutoMovieContourBoundaries64";
import { prepareAutoMovieContourDocument64 as prepareAutoMovieContourDocument64Implementation } from "./internal/prepareAutoMovieContourDocument64";
import { refineAutoMovieContourInteractions64 as refineAutoMovieContourInteractions64Implementation } from "./internal/refineAutoMovieContourInteractions64";
import { rootsAutoMovieCubicBernstein64 as rootsAutoMovieCubicBernstein64Implementation } from "./internal/rootsAutoMovieCubicBernstein64";
import { sampleAutoMovieContourRing64 as sampleAutoMovieContourRing64Implementation } from "./internal/sampleAutoMovieContourRing64";
import { splitAutoMovieContourLeaf64 as splitAutoMovieContourLeaf64Implementation } from "./internal/splitAutoMovieContourLeaf64";
import { tessellateAutoMovieContourLoft64 as tessellateAutoMovieContourLoft64Implementation } from "./internal/tessellateAutoMovieContourLoft64";
import { tessellateAutoMovieContourPath64 as tessellateAutoMovieContourPath64Implementation } from "./internal/tessellateAutoMovieContourPath64";
import { tessellateAutoMovieContourStrip64 as tessellateAutoMovieContourStrip64Implementation } from "./internal/tessellateAutoMovieContourStrip64";
import { tessellateAutoMovieParametricAtlas64 as tessellateAutoMovieParametricAtlas64Implementation } from "./internal/tessellateAutoMovieParametricAtlas64";
import { triangulateAutoMovieParameterCell64 as triangulateAutoMovieParameterCell64Implementation } from "./internal/triangulateAutoMovieParameterCell64";

/** Public operations for Auto Movie Engine Curve. */
export namespace AutoMovieEngineCurve {
  /**
   * Admit saved event addresses and quarantine defective incident declarations. A
   * missing saved bracket cannot be located and refuses globally. Within a known
   * bracket, invalid terminals, coordinates, incidence or names remain local
   * reasons; no replacement terminal, contour association or critical coordinate
   * is inferred. Duplicate names quarantine every participant rather than
   * selecting one owner.
   */
  export function admitContourEvents64(input: IAutoMovieContourLoft64): IAutoMovieAdmitContourEvents64.IResult {
    return admitAutoMovieContourEvents64Implementation(input);
  }

  /** Admit explicit adjacent intervals while retaining independent usable groups. */
  export function admitContourIntervals64(props: IAutoMoviePlanContourSlabs64Props): Map<number, IAutoMovieContourLoft64.IInterval> | undefined {
    return admitAutoMovieContourIntervals64Implementation(props);
  }

  /**
   * Reject malformed coefficient fields before evaluation or publication.
   * Successful admission establishes finite dense represented data and a
   * resolvable phase partition; it does not prove regularity, continuity,
   * nonintersection or visibility.
   *
   * @param curve Complete caller-owned primitive; positions are millimetres.
   * @throws Error when representation, finiteness, phase partition or supported
   *   denominator conditions fail.
   */
  export function assertCurve64(curve: IAutoMovieCurvePrimitive64): void {
    assertAutoMovieCurve64Implementation(curve);
  }

  /**
   * Admit a named closed cubic section and its complete longitudinal
   * first-variation control field. Section phase widths must sum exactly to one
   * turn; fullJ is measured per longitudinal millimetre.
   *
   * @param boundary Section positions in millimetres and matching mm-per-mm
   *   first-variation controls.
   * @throws Error on any missing coefficient, identity, topology or physical-unit
   *   mismatch.
   */
  export function assertCurveBoundary64(boundary: IAutoMovieCurveBoundary64): void {
    assertAutoMovieCurveBoundary64Implementation(boundary);
  }

  /**
   * Admit canonical atlas coefficients and plan adaptive leaves under the
   * original shared cell budget.
   */
  export function bicubicAtlasPlan64(input: IAutoMovieBicubicAtlasTessellation64.Input, SIDES: readonly (readonly number[])[], CORNERS: readonly (readonly [number, number, number])[]): IAutoMovieBicubicAtlasPlan64.IResult {
    return AutoMovieBicubicAtlasPlan64Implementation(input, SIDES, CORNERS);
  }

  /**
   * Register shared corners, exact edge phases and incidence before atlas
   * emission.
   */
  export function bicubicAtlasRegistry64(input: IAutoMovieBicubicAtlasTessellation64.Input, prepared: IAutoMovieBicubicAtlasPlan64.IResult, SIDES: readonly (readonly number[])[], CORNERS: readonly (readonly [number, number, number])[]): IAutoMovieBicubicAtlasRegistry64.IResult {
    return AutoMovieBicubicAtlasRegistry64Implementation(input, prepared, SIDES, CORNERS);
  }

  /**
   * Create the current patch vertex owner while reading the live generator chunk
   * for each allocation.
   */
  export function bicubicAtlasVertex64(input: IAutoMovieBicubicAtlasTessellation64.Input, prepared: IAutoMovieBicubicAtlasPlan64.IResult, registered: IAutoMovieBicubicAtlasRegistry64.IResult, p: number, patch: IAutoMovieBicubicAtlas64.Patch, phaseMaps: Map<number, IAutoMovieCanonicalBoundaryPhase64[]>[], local: Map<string, IAutoMovieBicubicAtlas64.Vertex>, cursor: IAutoMovieBicubicAtlasVertex64.ICursor, currentChunk: () => IAutoMovieBicubicAtlasTessellation64.Chunk, jet: IAutoMovieBicubicAtlasVertex64.IJet, edgeUV: (side: number, t: number) => [number, number], SIDES: readonly (readonly number[])[]): (
  sample: IAutoMovieBicubicAtlas64.Sample,
) => IAutoMovieBicubicAtlas64.Vertex {
    return AutoMovieBicubicAtlasVertex64Implementation(input, prepared, registered, p, patch, phaseMaps, local, cursor, currentChunk, jet, edgeUV, SIDES);
  }

  /**
   * Admit a positive normalized piecewise phase chart without changing its
   * coefficients. Cumulative boundaries must be representably increasing; only
   * the final endpoint absorbs the declared binary64 summation roundoff.
   */
  export function compileNormalizedPhases64(widths: readonly number[], count: number): number[] {
    return compileAutoMovieNormalizedPhases64Implementation(widths, count);
  }

  /**
   * Accumulate emitted contour-face area vectors and normalize each vertex once.
   * Positions remain in the original common millimetre chart. Opposing areas can
   * cancel; a zero accumulated vector stays zero without a substitute normal.
   */
  export function computeContourNormals64(vertices: readonly Readonly<AutoMovieVector3Tuple>[], triangles: readonly (readonly [number, number, number])[]): number[] {
    return computeAutoMovieContourNormals64Implementation(vertices, triangles);
  }

  /**
   * Evaluate an admitted Bernstein piece at local t in [0,1], returning position
   * in millimetres and its derivative per local t. De Casteljau evaluation
   * preserves the supplied degree; rational coordinates use the quotient rule and
   * hybrid Y uses its independent polynomial degree.
   *
   * @param piece Complete actual coefficient field; enclosing primitive admission
   *   supplies dense-array guarantees.
   * @param t Normalized local parameter, including both endpoints.
   * @throws Error for inconsistent degree, domain or cache, nonpositive
   *   denominator or unresolved underflow.
   */
  export function evaluateBernstein64(piece: IAutoMovieBernsteinCurvePiece64, t: number): IAutoMovieEvaluateBernstein64.IResult {
    return evaluateAutoMovieBernstein64Implementation(piece, t);
  }

  /**
   * Evaluate a millimetre primitive in its declared phase chart. Piecewise
   * derivatives are divided by the selected positive phase width; analytic oval
   * derivatives are per turn. Interior seams choose the following piece, and the
   * final endpoint chooses the final piece at local t=1.
   *
   * @param curve Complete generating coefficients and their physical phase chart.
   * @param parameter Value from 0 through the sum of phase widths, or through 1
   *   turn for an oval.
   * @throws Error when admission, domain selection or represented arithmetic is
   *   unresolved.
   */
  export function evaluateCurve64(curve: IAutoMovieCurvePrimitive64, parameter: number): IAutoMovieEvaluateCurve64.IResult {
    return evaluateAutoMovieCurve64Implementation(curve, parameter);
  }

  /**
   * Evaluate a rational Hermite transfinite chart and its analytic first
   * partials. Four boundary functions carry position, along-edge tangent, cross
   * derivative and its along-edge derivative, in bottom/right/top/left order.
   * Cross derivatives always follow increasing chart u or v, independently of
   * boundary walk. Corner positions and first derivatives must be compatible;
   * mixed derivatives may differ. Distance-weighted Gregory twists reconcile
   * those mixed corner values. The result is rational, with removable corner
   * limits, and is not a bicubic.
   */
  export function evaluateHermiteGregory64(edges: readonly ((t: number) => {
    point: AutoMovieVector3Tuple;
    tangent: AutoMovieVector3Tuple;
    cross: AutoMovieVector3Tuple;
    crossTangent: AutoMovieVector3Tuple;
  })[], u: number, v: number): IAutoMovieEvaluateHermiteGregory64.IResult {
    return evaluateAutoMovieHermiteGregory64Implementation(edges, u, v);
  }

  /**
   * Continue an implicit level along one declared constant physical direction.
   * Seed and target first derivatives use the caller's same parameter domain.
   * Optional second derivatives are propagated analytically for curve consumers.
   * Four level homotopy steps start at the seed's own level. Newton backtracking
   * accepts only decreasing level residuals inside the caller's physical search
   * distance. A singular direction, unsupported query or failed solve throws; the
   * seed is never returned as replacement geometry after a failed solve. This
   * local continuation does not certify a unique root or an embedded chart.
   * Failed solves retain their physical query and bounded ray samples in the
   * error message. Those samples diagnose the selected ray; they do not prove
   * existence or absence of roots between samples or on another ray.
   */
  export function evaluateImplicitProjection64(props: IAutoMovieEvaluateImplicitProjection64.IProps): IAutoMovieEvaluateImplicitProjection64.IResult {
    return evaluateAutoMovieImplicitProjection64Implementation(props);
  }

  /**
   * Generate an indexed contour loft from actual cubic coefficients and declared
   * signed topology.
   *
   * Cubics are admitted and adaptively subdivided by the engine's Bernstein
   * operator. Optional complete interval groups supply exact continuation;
   * otherwise ordinary boundaries use legacy greedy nearest geometric
   * continuation. Critical incidence overrides the legacy policy. Unsupported
   * explicit groups remain local gaps without discarding other contours at the
   * same cut. Oriented slit walks support splits and cavity changes, with a
   * regular exterior seam before fixed-seam minimum-area elementary tiling
   * (Fuchs, Kedem and Uselton 1977,
   * https://www.cs.jhu.edu/~misha/Fall13b/Papers/Fuchs77.pdf). The fixed-seam
   * optimum is not a global cyclic optimum or an injectivity certificate. Only an
   * isolated declared minimum or maximum receives its explicit generating
   * terminal. Finite unmatched contours remain unresolved. Output callbacks
   * retain original face order; the sink owns actual normal accumulation and
   * publication. Empty sections exactly at declared critical coordinates have no
   * generating boundary and are omitted; the event's explicitly declared
   * before/after section brackets remain mandatory. Coordinates convert from
   * millimetres to metres exactly once at output publication. Unrepresentable
   * curve boundaries or source identities remain local unresolved groups. Finite
   * positive-area tiles remain displayable when incidence, links or orientation
   * are unqualified. Strip observations distinguish quality diagnostics and
   * computational work from missing geometry. A failed millimetre cubic retains
   * its dense finite endpoint in construction only; an untrusted endpoint leaves
   * empty construction. Addressable malformed events remain local diagnostics. A
   * closest polygon-chord slit selects a source phase; its actual point and child
   * restrictions come from that saved polynomial. Child chord bounds and shared
   * ring interactions are re-established before emission. The final bridge is not
   * certified globally closest, nonintersecting or embedded.
   */
  export function generateContourLoft64(input: IAutoMovieContourLoft64, sink: IAutoMovieContourLoftSink64): IAutoMovieContourLoftEmission64 {
    return generateAutoMovieContourLoft64Implementation(input, sink);
  }

  /**
   * Generate a planar convex curve from a finite Fourier support function. For
   * the outward normal n=(cos(theta),sin(theta)) and tangent t=(-sin,cos),
   * X=h*n+h'*t and X'=(h+h'')*t. The support integral is the convex perimeter,
   * not the arclength of a nonconvex source outline. See Antunes and Bogosel,
   * https://arxiv.org/abs/1809.00254 . Coefficients and positions use
   * millimetres.
   *
   * The returned polynomial Hermite curve approximates that analytic equation.
   * Its fourth-derivative remainder and positive-radius lower estimate are
   * numerical evaluations of analytic inequalities, not outward-rounded binary64
   * certificates. The polynomial's own perimeter is not silently equated to the
   * support integral. Refusal concerns this representation, not the source
   * object.
   */
  export function generateSupportCurve64(props: IAutoMovieGenerateSupportCurve64.IProps): IAutoMovieGenerateSupportCurve64.IResult {
    return generateAutoMovieSupportCurve64Implementation(props);
  }

  /** Preserve the contour stage's original millimetre and metre area predicates. */
  export function measureContourFace64(p: AutoMovieVector3Tuple, q: AutoMovieVector3Tuple, r: AutoMovieVector3Tuple): IAutoMovieMeasureContourFace64.IResult {
    return measureAutoMovieContourFace64Implementation(p, q, r);
  }

  /**
   * Integrate a cubic curve's physical speed with composite eight-point
   * Gauss-Legendre quadrature. Controls use millimetres, so the returned length
   * uses millimetres independently of the curve's phase unit or piece widths.
   * Doubling the subdivisions supplies an observed difference, not an error
   * bound. The original interior-only finite-final policy remains: endpoint-only
   * speed overflow and underflowed contributions do not add admission failures
   * here.
   */
  export function measureCubicCurveLength64(curve: IAutoMovieCubicBezierCurve64, subdivisions?: number): IAutoMovieCurveLengthMeasurement64 {
    return measureAutoMovieCubicCurveLength64Implementation(curve, subdivisions);
  }

  /**
   * Measure original three-dimensional source derivatives by composite
   * eight-point Gauss-Legendre quadrature, retaining each piece's parameter and
   * millimetres. The derivative is dP/dparameter in mm per parameter unit; its
   * domain supplies that parameter unit, so their product is mm. Pieces need not
   * share a chart. Callbacks are pure and finite on their closed domains,
   * including endpoints. The caller owns the original source, partition,
   * world-frame chain rule and any continuity, closure or anatomical
   * interpretation. Singular/improper endpoint derivatives are unsupported;
   * finite zero speed is permitted.
   *
   * The finer K*2 result and its absolute difference from K are observations, not
   * an error bound or automatic convergence/regularity certificate. Narrow
   * features can escape both rules, and errors of different pieces can cancel.
   * This uses the existing cubic-length rule (NIST DLMF 3.5(v)); finite inputs
   * also require representable widths, quadrature nodes and intermediate sums.
   *
   * @param pieces Original derivative readers and finite increasing domains,
   *   nonempty.
   * @param subdivisions Equal panels per piece, an integer in [1,1024].
   * @returns Finer length and the absolute coarse/fine difference, both mm.
   * @throws Invalid data, nonfinite/underflowing arithmetic or collapsed nodes;
   *   callback exceptions propagate unchanged.
   */
  export function measureCurveLength64(pieces: IAutoMovieMeasureCurveLength64.IPieces, subdivisions?: number): IAutoMovieCurveLengthMeasurement64 {
    return measureAutoMovieCurveLength64Implementation(pieces, subdivisions);
  }

  /**
   * Plan contour slabs from explicit incidence or the existing nearest legacy
   * policy. Explicit mode uses exact event brackets and local loop ordinals.
   * Missing or conflicting local partitions remain diagnosed gaps; independent
   * valid groups survive without rematching them. It supports ordinary one-to-one
   * strips and isolated regular simple events; sector order, handles, critical
   * clusters and injectivity are not inferred.
   */
  export function planContourSlabs64(props: IAutoMoviePlanContourSlabs64Props): IAutoMoviePlanContourSlabs64Slab[] {
    return planAutoMovieContourSlabs64Implementation(props);
  }

  /**
   * Freezes branch slit choices before emission and expands them through shared
   * contour refinements. All prepare calls must finish before the first resolve;
   * ring order and point identities remain fixed. Polygon-chord slit parameters
   * are chosen once; the insertion callback supplies the actual
   * source-authoritative endpoint. Subsequent cuts of the same sheet edge enrich
   * that walk without recomputing a nearest point or welding separate sheets by
   * their coordinates.
   */
  export function planContourWalks64<R extends IAutoMoviePlanContourWalks64Ring>(owner: (point: AutoMovieVector3Tuple) => R | undefined, identity: (point: AutoMovieVector3Tuple) => string | undefined, inserted: (
    point: AutoMovieVector3Tuple,
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
    t: number,
  ) => void): IAutoMoviePlanContourWalks64Plans<R> {
    return planAutoMovieContourWalks64Implementation<R>(owner, identity, inserted);
  }

  /** Prepare bounded adaptive leaves for one immutable physical Hermite run. */
  export function planLocalHermite64(input: IAutoMovieLocalHermiteStream64.Input): IAutoMoviePlanLocalHermite64.IResult {
    return planAutoMovieLocalHermite64Implementation(input);
  }

  /**
   * Prepare declared canonical curves, coefficient identities and complete edge
   * uses. Matching four-ID tuples transport one explicit oriented interval to
   * unbound incident sides. Their legacy render-normal owner remains separate
   * from explicit normal fans. Every constructed coefficient is shared by its
   * declared ID before tessellation; independently evaluated conflicting
   * assignments omit only incident patches. Exact positions validate existing
   * relations and never create identities. Equal restricted nets with different
   * named intervals retain their finite fields; inter-authority tessellation
   * sharing remains an explicit unqualified relation. Inputs must remain
   * immutable until the returned closures are released.
   */
  export function prepareBicubicAtlasBoundary64(input: IAutoMovieBicubicAtlasTessellation64.Input, sides: readonly (readonly number[])[]): IAutoMoviePrepareBicubicAtlasBoundary64.IResult {
    return prepareAutoMovieBicubicAtlasBoundary64Implementation(input, sides);
  }

  /**
   * Reach one shared-boundary refinement state before choosing and freezing any
   * branch slit. A later interaction can refine a course shared with an earlier
   * group, so all groups are revisited until no source restriction changes.
   * Source-authoritative slit insertion can change chords again, so its final
   * rings pass through the same refinement fixed point. Slit phases remain fixed
   * while cached walks expand through these shared refinements. Every incident
   * slab then uses the same ring objects and inherited phase identities; separate
   * coordinates are never welded. Unresolved geometric qualification remains
   * diagnostic while finite geometry stays admissible. Per-pass timings are
   * opt-in observations and never influence refinement or publication.
   */
  export function prepareContourBoundaries64<R extends IAutoMoviePrepareContourBoundaries64Ring, G extends IAutoMoviePrepareContourBoundaries64Group>(plans: IAutoMoviePrepareContourBoundaries64.IPlans<G>, rings: R[][], coordinates: readonly number[], leaf: (
    point: AutoMovieVector3Tuple,
  ) => IAutoMovieContourLoftCurves64.Leaf | undefined, register: (ring: R, knot: IAutoMovieContourLoftCurves64.Knot) => void, prepareSlit: (rings: R[], selection: number[]) => void, toleranceMm: number, observeWork: boolean): IAutoMoviePrepareContourBoundaries64.IResult<G> {
    return prepareAutoMovieContourBoundaries64Implementation<R, G>(plans, rings, coordinates, leaf, register, prepareSlit, toleranceMm, observeWork);
  }

  /** Admit saved contour events and build the local physical section document. */
  export function prepareContourDocument64(input: IAutoMovieContourLoft64): IAutoMoviePrepareContourDocument64Document {
    return prepareAutoMovieContourDocument64Implementation(input);
  }

  /**
   * Refine interacting display chords from their retained Bernstein restrictions
   * before slit ownership freezes. A dominant-plane projection is used for the
   * common planar section; exact dyadic orientation tests detect intersections of
   * the represented binary64 chords. Only a contacted curved source restriction
   * is split, retaining its original physical tolerance, parameter interval and
   * existing endpoint identity. A genuine linear contact or exhausted numeric
   * subdivision remains explicit and keeps finite geometry. This is not a
   * certificate of source-curve simplicity, injectivity or exact floating-point
   * subdivision. Actual predicate/refinement counts are returned; elapsed time is
   * measured only on explicit request.
   */
  export function refineContourInteractions64<R extends IAutoMovieRefineContourInteractions64Ring>(rings: R[], selection: number[], leaf: (
    point: AutoMovieVector3Tuple,
  ) => IAutoMovieContourLoftCurves64.Leaf | undefined, register: (ring: R, knot: IAutoMovieContourLoftCurves64.Knot) => void, toleranceMm: number, observeWork?: boolean): IAutoMovieRefineContourInteractions64.IResult {
    return refineAutoMovieContourInteractions64Implementation<R>(rings, selection, leaf, register, toleranceMm, observeWork);
  }

  /**
   * Approximate the isolated roots of four finite scalar cubic Bernstein
   * coefficients on [0,1]. Critical points partition sign-monotone intervals;
   * near-zero values use 64 epsilon times max(1, coefficient magnitude), sign
   * changes receive 58 bisections, and roots within 1e-10 merge. The identically
   * zero polynomial returns no discrete roots. These are binary64 construction
   * rules, not interval certificates.
   */
  export function rootsCubicBernstein64(q: readonly number[]): number[] {
    return rootsAutoMovieCubicBernstein64Implementation(q);
  }

  /**
   * Sample one declared closed polynomial without leaking a local refusal
   * downstream. An admitted curve retains its exact name and complete phase
   * period. A failed millimetre cubic retains its actual dense finite first
   * endpoint as construction only; an absent or untrusted physical endpoint
   * produces empty construction. Failed metadata is never evaluated again to
   * obtain a period or geometry.
   */
  export function sampleContourRing64(curve: IAutoMovieCubicBezierCurve64, toleranceMm: number): IAutoMovieSampleContourRing64.IResult {
    return sampleAutoMovieContourRing64Implementation(curve, toleranceMm);
  }

  /**
   * Split a retained source restriction at its declared interior phase and
   * repartition both children under the same finite-segment chord bound. A
   * parent's bound need not hold against a child's different chord, even for a
   * straight geometric trace. The shared point is the Bernstein split endpoint,
   * never its proxy chord point. Ancestry depth and phase limits are inherited
   * without resetting subdivision. Already qualified explicit children need no
   * additional adaptive work, even if their exact restriction increases ancestry
   * beyond the adaptive depth limit.
   */
  export function splitContourLeaf64(source: IAutoMovieContourLoftCurves64.Leaf, phase: number, toleranceMm: number): IAutoMovieSplitContourLeaf64.IResult {
    return splitAutoMovieContourLeaf64Implementation(source, phase, toleranceMm);
  }

  /**
   * Materialize the original contour kernel into its existing memory result.
   * Source-free coefficients and declared incidence retain their original
   * ordering. Normals use the original face/corner reduction, with no
   * source-normal fallback.
   */
  export function tessellateContourLoft64(input: IAutoMovieContourLoft64): IAutoMovieContourLoft64.IResult {
    return tessellateAutoMovieContourLoft64Implementation(input);
  }

  /**
   * Generate an indexed surface from saved physical polygon identities and P/Q
   * paths. P emits (P_i,Q_j,P_next); Q emits (Q_next,P_i,Q_j). Positive XZ rings
   * and increasing Y stations give outward winding on an ordinary exterior slab.
   * This operation validates the path, not its optimization or geometric
   * embedding. Finite positive-area faces survive incidence warnings; collapsed
   * faces are counted.
   */
  export function tessellateContourPath64(input: IAutoMovieTessellateContourPath64.IInput): IAutoMovieTessellateContourPath64.IResult {
    return tessellateAutoMovieContourPath64Implementation(input);
  }

  /**
   * Finds a fixed-seam periodic tiling and reports sheet qualification separately
   * from displayable geometry. The first seam lies on its exterior; the other
   * starts at its nearest existing knot. This discrete dynamic-program optimum
   * does not certify a global cyclic optimum or injectivity. Each walk may
   * contain an explicitly doubled branch slit with distinct sheet ownership. If
   * no qualified path exists, its finite positive-area candidate remains
   * displayable with an unqualified observation. A zero-length slit retains
   * distinct sheet identities; only its zero-area tiles are omitted, with
   * explicit partial-output diagnostics. The optional observer receives input
   * sizes, search work, qualification and diagnostics; elapsed time is measured
   * only when requested.
   */
  export function tessellateContourStrip64(rawA: AutoMovieVector3Tuple[], rawB: AutoMovieVector3Tuple[], emit: (
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
    c: AutoMovieVector3Tuple,
  ) => void, identity?: (point: AutoMovieVector3Tuple) => string | undefined, observe?: (observation: IAutoMovieObservation) => void, observeWork?: boolean): void {
    tessellateAutoMovieContourStrip64Implementation(rawA, rawB, emit, identity, observe, observeWork);
  }

  /**
   * Sample finite parametric charts with declared boundary incidence. Fields and
   * first partials use millimetres; output positions use metres. The four sides
   * are bottom/right/top/left, each in its increasing local coordinate. Exact
   * canonical phase requests are unioned across every incident restriction before
   * emission. Extra exterior samples enter the containing cell's parameter
   * polygon. Boundary owners supply positions; all conflicting incident charts
   * are omitted before emission, while distinct chart normal fans remain
   * separate. Callbacks and their input coefficients must remain immutable for
   * the call's lifetime. This fixed lattice has no field-to-triangle error or
   * G1/immersion certificate. A nonlinear restriction declares both parameterize
   * and localize. Their values are checked on the finite schedule, not certified
   * over the continuous domain. Original local addresses are retained for a
   * restriction's own requests, so an approximate numerical inverse cannot
   * replace an exact authored lattice point. A zero chart cross product may carry
   * an authored analytic normalLimit. Its use is counted separately and does not
   * remove the singular parameter sample or certify that the caller derived a
   * unique continuous surface normal.
   */
  export function tessellateParametricAtlas64(props: IAutoMovieTessellateParametricAtlas64.IProps): IAutoMovieTessellateParametricAtlas64.IResult {
    return tessellateAutoMovieParametricAtlas64Implementation(props);
  }

  /**
   * Triangulate a parameter rectangle using its existing perimeter samples only.
   * The immutable perimeter starts at the bottom-left corner and traverses
   * bottom, right, top and left counterclockwise. Each side is monotone and
   * includes its corners. Equal numeric coordinates may carry distinct
   * authoritative samples; their perimeter order and object references remain
   * intact.
   *
   * A monotone zipper joins the bottom and top chains. Additional left and right
   * samples split their owning exterior triangle edge. No analytic cell-center
   * point is introduced. Matching bottom/top u samples therefore retain vertical
   * fiber edges, including when those fibers have side subdivisions. For
   * identical translated curves this preserves extruded polygon face planes in
   * exact arithmetic. Unequal boundary sample sets and arbitrary curved fields
   * have no normal-error guarantee. The caller retains its field approximation
   * and arithmetic diagnostics. Zero-area parameter triangles remain for the
   * caller to count and omit.
   */
  export function triangulateParameterCell64<T>(boundary: readonly T[], coordinates: (point: T) => readonly [number, number]): [T, T, T][] {
    return triangulateAutoMovieParameterCell64Implementation<T>(boundary, coordinates);
  }
}
