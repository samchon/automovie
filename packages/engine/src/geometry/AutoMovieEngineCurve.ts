import { tessellateBicubicAtlas64 as tessellateBicubicAtlas64Implementation } from "./curve/internal/tessellateBicubicAtlas64";
import { tessellateLocalHermite64 as tessellateLocalHermite64Implementation } from "./curve/internal/tessellateLocalHermite64";
import { type IAutoMovieAdmitContourEvents64, type IAutoMovieContourLoft64, type IAutoMoviePlanContourSlabs64Props, type IAutoMovieCurvePrimitive64, type IAutoMovieCurveBoundary64, type IAutoMovieBicubicAtlasPlan64, type IAutoMovieBicubicAtlasTessellation64, type IAutoMovieBicubicAtlasRegistry64, type IAutoMovieBicubicAtlas64, type IAutoMovieCanonicalBoundaryPhase64, type IAutoMovieBicubicAtlasVertex64, type AutoMovieVector3Tuple, type IAutoMovieEvaluateBernstein64, type IAutoMovieBernsteinCurvePiece64, type IAutoMovieEvaluateCurve64, type IAutoMovieEvaluateHermiteGregory64, type IAutoMovieEvaluateImplicitProjection64, type IAutoMovieContourLoftEmission64, type IAutoMovieContourLoftSink64, type IAutoMovieGenerateSupportCurve64, type IAutoMovieMeasureContourFace64, type IAutoMovieCurveLengthMeasurement64, type IAutoMovieCubicBezierCurve64, type IAutoMovieMeasureCurveLength64, type IAutoMoviePlanContourSlabs64Slab, type IAutoMoviePlanContourWalks64Plans, type IAutoMoviePlanContourWalks64Ring, type IAutoMoviePlanLocalHermite64, type IAutoMovieLocalHermiteStream64, type IAutoMoviePrepareBicubicAtlasBoundary64, type IAutoMoviePrepareContourBoundaries64, type IAutoMovieContourLoftCurves64, type IAutoMoviePrepareContourBoundaries64Ring, type IAutoMoviePrepareContourBoundaries64Group, type IAutoMoviePrepareContourDocument64Document, type IAutoMovieRefineContourInteractions64, type IAutoMovieRefineContourInteractions64Ring, type IAutoMovieSampleContourRing64, type IAutoMovieSplitContourLeaf64, type IAutoMovieTessellateContourPath64, type IAutoMovieObservation, type IAutoMovieTessellateParametricAtlas64 } from "@automovie/interface";
import { admitContourEvents64 as admitContourEvents64Implementation } from "./curve/internal/admitContourEvents64";
import { admitContourIntervals64 as admitContourIntervals64Implementation } from "./curve/internal/admitContourIntervals64";
import { assertCurve64 as assertCurve64Implementation } from "./curve/internal/assertCurve64";
import { assertCurveBoundary64 as assertCurveBoundary64Implementation } from "./curve/internal/assertCurveBoundary64";
import { bicubicAtlasPlan64 as bicubicAtlasPlan64Implementation } from "./curve/internal/bicubicAtlasPlan64";
import { bicubicAtlasRegistry64 as bicubicAtlasRegistry64Implementation } from "./curve/internal/bicubicAtlasRegistry64";
import { bicubicAtlasVertex64 as bicubicAtlasVertex64Implementation } from "./curve/internal/bicubicAtlasVertex64";
import { compileNormalizedPhases64 as compileNormalizedPhases64Implementation } from "./curve/internal/compileNormalizedPhases64";
import { computeContourNormals64 as computeContourNormals64Implementation } from "./curve/internal/computeContourNormals64";
import { evaluateBernstein64 as evaluateBernstein64Implementation } from "./curve/internal/evaluateBernstein64";
import { evaluateCurve64 as evaluateCurve64Implementation } from "./curve/internal/evaluateCurve64";
import { evaluateHermiteGregory64 as evaluateHermiteGregory64Implementation } from "./curve/internal/evaluateHermiteGregory64";
import { evaluateImplicitProjection64 as evaluateImplicitProjection64Implementation } from "./curve/internal/evaluateImplicitProjection64";
import { generateContourLoft64 as generateContourLoft64Implementation } from "./curve/internal/generateContourLoft64";
import { generateSupportCurve64 as generateSupportCurve64Implementation } from "./curve/internal/generateSupportCurve64";
import { measureContourFace64 as measureContourFace64Implementation } from "./curve/internal/measureContourFace64";
import { measureCubicCurveLength64 as measureCubicCurveLength64Implementation } from "./curve/internal/measureCubicCurveLength64";
import { measureCurveLength64 as measureCurveLength64Implementation } from "./curve/internal/measureCurveLength64";
import { planContourSlabs64 as planContourSlabs64Implementation } from "./curve/internal/planContourSlabs64";
import { planContourWalks64 as planContourWalks64Implementation } from "./curve/internal/planContourWalks64";
import { planLocalHermite64 as planLocalHermite64Implementation } from "./curve/internal/planLocalHermite64";
import { prepareBicubicAtlasBoundary64 as prepareBicubicAtlasBoundary64Implementation } from "./curve/internal/prepareBicubicAtlasBoundary64";
import { prepareContourBoundaries64 as prepareContourBoundaries64Implementation } from "./curve/internal/prepareContourBoundaries64";
import { prepareContourDocument64 as prepareContourDocument64Implementation } from "./curve/internal/prepareContourDocument64";
import { refineContourInteractions64 as refineContourInteractions64Implementation } from "./curve/internal/refineContourInteractions64";
import { rootsCubicBernstein64 as rootsCubicBernstein64Implementation } from "./curve/internal/rootsCubicBernstein64";
import { sampleContourRing64 as sampleContourRing64Implementation } from "./curve/internal/sampleContourRing64";
import { splitContourLeaf64 as splitContourLeaf64Implementation } from "./curve/internal/splitContourLeaf64";
import { tessellateContourLoft64 as tessellateContourLoft64Implementation } from "./curve/internal/tessellateContourLoft64";
import { tessellateContourPath64 as tessellateContourPath64Implementation } from "./curve/internal/tessellateContourPath64";
import { tessellateContourStrip64 as tessellateContourStrip64Implementation } from "./curve/internal/tessellateContourStrip64";
import { tessellateParametricAtlas64 as tessellateParametricAtlas64Implementation } from "./curve/internal/tessellateParametricAtlas64";
import { triangulateParameterCell64 as triangulateParameterCell64Implementation } from "./curve/internal/triangulateParameterCell64";

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
    return admitContourEvents64Implementation(input);
  }

  /** Admit explicit adjacent intervals while retaining independent usable groups. */
  export function admitContourIntervals64(props: IAutoMoviePlanContourSlabs64Props): Map<number, IAutoMovieContourLoft64.IInterval> | undefined {
    return admitContourIntervals64Implementation(props);
  }

  /**
   * Admit a complete millimetre curve and its declared phase chart.
   *
   * Polynomial and rational Bernstein pieces have whole degrees and dense
   * finite coefficient arrays. Rational weights are positive and finite.
   * An optional control cache must agree with the finite represented
   * numerator-to-denominator quotients. Piece phase widths increase the
   * cumulative phase at each step. An analytic oval uses orthonormal axes
   * and positive radii over one turn.
   *
   * @param curve The caller's generating coefficients and phase units.
   * @throws Error when the representation fails admission.
   */
  export function assertCurve64(curve: IAutoMovieCurvePrimitive64): void {
    assertCurve64Implementation(curve);
  }

  /**
   * Check a named cubic boundary and its longitudinal derivative field.
   *
   * The closed section's name equals the boundary ID, and its phase widths sum
   * exactly to one turn. Positions use millimetres, and fullJ holds one
   * four-control derivative span per section span in millimetres per
   * longitudinal millimetre. Axis and derivative vectors must contain three
   * finite components.
   */
  export function assertCurveBoundary64(boundary: IAutoMovieCurveBoundary64): void {
    assertCurveBoundary64Implementation(boundary);
  }

  /**
   * Plan bicubic atlas leaves within a shared cell budget.
   *
   * The estimate uses millimetre coefficients on a unit parameter cell.
   * Unrepresentable estimates omit the affected cell with a diagnostic.
   * The default budget policy omits unresolved cells. An explicit coarse
   * policy can retain finite leaves that exceed tolerance.
   *
   * @param input Canonical atlas and finite positive tolerance. Cell and chunk
   * limits are safe integers with minima of one and three, respectively.
   * The first vertex index is a nonnegative safe integer and defaults to zero.
   * Patch and authority coefficient IDs are safe in-range registry indices.
   * Supply Boolean retention flags when requesting optional output buffers.
   * @param SIDES Control slots for each oriented patch side.
   * @param CORNERS Unit chart coordinates and control slot for each corner.
   * @returns Prepared boundary data and retained plans with diagnostics.
   * @throws Error for malformed global policy, registry addresses or boundary
   * declarations. A nonfinite arithmetic estimate leaves an empty local
   * plan with its diagnostic.
   */
  export function bicubicAtlasPlan64(input: IAutoMovieBicubicAtlasTessellation64.Input, SIDES: readonly (readonly number[])[], CORNERS: readonly (readonly [number, number, number])[]): IAutoMovieBicubicAtlasPlan64.IResult {
    return bicubicAtlasPlan64Implementation(input, SIDES, CORNERS);
  }

  /**
   * Register shared corners, exact edge phases and incidence before atlas
   * emission.
   */
  export function bicubicAtlasRegistry64(input: IAutoMovieBicubicAtlasTessellation64.Input, prepared: IAutoMovieBicubicAtlasPlan64.IResult, SIDES: readonly (readonly number[])[], CORNERS: readonly (readonly [number, number, number])[]): IAutoMovieBicubicAtlasRegistry64.IResult {
    return bicubicAtlasRegistry64Implementation(input, prepared, SIDES, CORNERS);
  }

  /**
   * Create the current patch vertex owner while reading the live generator chunk
   * for each allocation.
   */
  export function bicubicAtlasVertex64(input: IAutoMovieBicubicAtlasTessellation64.Input, prepared: IAutoMovieBicubicAtlasPlan64.IResult, registered: IAutoMovieBicubicAtlasRegistry64.IResult, p: number, patch: IAutoMovieBicubicAtlas64.Patch, phaseMaps: Map<number, IAutoMovieCanonicalBoundaryPhase64[]>[], local: Map<string, IAutoMovieBicubicAtlas64.Vertex>, cursor: IAutoMovieBicubicAtlasVertex64.ICursor, currentChunk: () => IAutoMovieBicubicAtlasTessellation64.Chunk, jet: IAutoMovieBicubicAtlasVertex64.IJet, edgeUV: (side: number, t: number) => [number, number], SIDES: readonly (readonly number[])[]): (
  sample: IAutoMovieBicubicAtlas64.Sample,
) => IAutoMovieBicubicAtlas64.Vertex {
    return bicubicAtlasVertex64Implementation(input, prepared, registered, p, patch, phaseMaps, local, cursor, currentChunk, jet, edgeUV, SIDES);
  }

  /**
   * Admit a positive normalized piecewise phase chart without changing its
   * coefficients. Cumulative boundaries must be representably increasing; only
   * the final endpoint absorbs the declared binary64 summation roundoff.
   */
  export function compileNormalizedPhases64(widths: readonly number[], count: number): number[] {
    return compileNormalizedPhases64Implementation(widths, count);
  }

  /**
   * Accumulate emitted contour-face area vectors and normalize each vertex once.
   * Positions remain in the original common millimetre chart. Opposing areas can
   * cancel; a zero accumulated vector stays zero without a substitute normal.
   */
  export function computeContourNormals64(vertices: readonly Readonly<AutoMovieVector3Tuple>[], triangles: readonly (readonly [number, number, number])[]): number[] {
    return computeContourNormals64Implementation(vertices, triangles);
  }

  /**
   * Evaluate one Bernstein piece and its local derivative at t in [0,1].
   *
   * The normalized parameter is finite and includes both endpoints.
   * Position is in millimetres and the derivative is per unit local t.
   * Polynomial and rational fields retain their declared degrees.
   * A hybrid piece uses its separate polynomial degree on Y.
   *
   * @param piece Complete generating coefficients with finite controls and
   *   positive finite weights for rational pieces.
   * @param t Finite local parameter, including 0 and 1.
   * @returns Owned position and local derivative triples.
   * @throws Error for invalid coefficients or domain, inconsistent cache or
   *   unrepresentable result arithmetic.
   */
  export function evaluateBernstein64(piece: IAutoMovieBernsteinCurvePiece64, t: number): IAutoMovieEvaluateBernstein64.IResult {
    return evaluateBernstein64Implementation(piece, t);
  }

  /**
   * Evaluate a millimetre curve and its tangent in the declared phase chart.
   *
   * A finite nonnegative phase lies within the summed piece widths, or one
   * turn for an analytic oval. Interior seams select the following piece.
   * The final endpoint selects local 1 of the last piece. The tangent is
   * millimetres per declared parameter unit.
   *
   * @param curve Complete curve coefficients and phase chart.
   * @param parameter Finite phase on the curve's closed parameter interval.
   * @returns Curve point and phase derivative.
   * @throws Error for invalid input or unrepresentable point or tangent.
   */
  export function evaluateCurve64(curve: IAutoMovieCurvePrimitive64, parameter: number): IAutoMovieEvaluateCurve64.IResult {
    return evaluateCurve64Implementation(curve, parameter);
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
    return evaluateHermiteGregory64Implementation(edges, u, v);
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
    return evaluateImplicitProjection64Implementation(props);
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
    return generateContourLoft64Implementation(input, sink);
  }

  /**
   * Approximate a convex Fourier support function as a closed X/Z Bézier curve.
   *
   * Supply one through seventeen finite harmonic pairs in millimetres.
   * The zeroth has positive cosine and zero sine. The common angular
   * partition is a power of two from 4 through 4096, with phase in turns.
   * The curve position is h times the outward normal plus h' times the
   * tangent. Its sampled radius estimate must resolve positive h + h''.
   *
   * The analytic perimeter integrates the support function in millimetres.
   * The radius and Hermite remainder are finite numerical estimates of
   * analytic bounds. They qualify the chosen polynomial representation.
   *
   * @throws Error for invalid harmonics or partition size, unresolved
   *   positive curvature radius or nonfinite qualifications and controls.
   */
  export function generateSupportCurve64(props: IAutoMovieGenerateSupportCurve64.IProps): IAutoMovieGenerateSupportCurve64.IResult {
    return generateSupportCurve64Implementation(props);
  }

  /** Preserve the contour stage's original millimetre and metre area predicates. */
  export function measureContourFace64(p: AutoMovieVector3Tuple, q: AutoMovieVector3Tuple, r: AutoMovieVector3Tuple): IAutoMovieMeasureContourFace64.IResult {
    return measureContourFace64Implementation(p, q, r);
  }

  /**
   * Estimate the millimetre length of an admitted cubic curve.
   *
   * Use a whole panel count from 1 to 1024, with one by default. Integrate each
   * span's local speed at eight interior Gauss–Legendre nodes per panel and
   * repeat at twice the panel count. Return the finer length and the absolute
   * difference of the two estimates. The comparison is a sampling diagnostic.
   * Only interior nodes contribute to this cubic measurement. Nonfinite
   * integrated length raises an error.
   */
  export function measureCubicCurveLength64(curve: IAutoMovieCubicBezierCurve64, subdivisions?: number): IAutoMovieCurveLengthMeasurement64 {
    return measureCubicCurveLength64Implementation(curve, subdivisions);
  }

  /**
   * Measure curve length from the original world derivatives in millimetres.
   *
   * Supply one or more finite increasing parameter charts, each with a
   * representable width and a pure derivative yielding three finite
   * coordinates. Each derivative uses millimetres per chart unit. The
   * operation reads both endpoints, then the interior quadrature nodes.
   * Zero speed is valid.
   *
   * The panel count is a whole number from 1 through 1024, default 1.
   * The eight-point Gauss-Legendre rule returns the finer estimate and the
   * absolute difference from the coarser estimate. The caller owns any
   * convergence criterion.
   *
   * @param pieces Original derivative readers with finite closed domains.
   * @param subdivisions Panels per piece in the coarse estimate.
   * @returns Finite finer length and observed difference, in millimetres.
   * @throws Error for invalid charts or unresolved arithmetic. A derivative
   *   callback's exception propagates unchanged.
   */
  export function measureCurveLength64(pieces: IAutoMovieMeasureCurveLength64.IPieces, subdivisions?: number): IAutoMovieCurveLengthMeasurement64 {
    return measureCurveLength64Implementation(pieces, subdivisions);
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
    return planContourSlabs64Implementation(props);
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
    return planContourWalks64Implementation<R>(owner, identity, inserted);
  }

  /**
   * Prepare a physical-station Hermite field and its bounded interval planner.
   *
   * The field borrows the supplied millimetre courses. Keep them unchanged
   * while reading or planning. A plan computes one interval on demand. An
   * unrepresentable derivative estimate or exhausted cell budget explains
   * why the interval has no retained leaves.
   *
   * @param input Named station run with finite positive tolerance, a positive
   * safe integer cell cap and a safe integer chunk cap of at least three.
   * The first vertex index is a nonnegative safe integer and defaults to zero.
   * @returns The prepared field and its interval planner.
   * @throws Error for inadmissible input or unsupported work limits.
   */
  export function planLocalHermite64(input: IAutoMovieLocalHermiteStream64.Input): IAutoMoviePlanLocalHermite64.IResult {
    return planLocalHermite64Implementation(input);
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
   * sharing remains an explicit unqualified relation. Authority control IDs
   * are safe integer registry addresses, and the endpoints of each binding are
   * distinct finite values in [0, 1]. Keep inputs immutable while using the
   * returned closures.
   */
  export function prepareBicubicAtlasBoundary64(input: IAutoMovieBicubicAtlasTessellation64.Input, sides: readonly (readonly number[])[]): IAutoMoviePrepareBicubicAtlasBoundary64.IResult {
    return prepareBicubicAtlasBoundary64Implementation(input, sides);
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
    return prepareContourBoundaries64Implementation<R, G>(plans, rings, coordinates, leaf, register, prepareSlit, toleranceMm, observeWork);
  }

  /** Admit saved contour events and build the local physical section document. */
  export function prepareContourDocument64(input: IAutoMovieContourLoft64): IAutoMoviePrepareContourDocument64Document {
    return prepareContourDocument64Implementation(input);
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
    return refineContourInteractions64Implementation<R>(rings, selection, leaf, register, toleranceMm, observeWork);
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
    return rootsCubicBernstein64Implementation(q);
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
    return sampleContourRing64Implementation(curve, toleranceMm);
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
    return splitContourLeaf64Implementation(source, phase, toleranceMm);
  }

  /**
   * Materialize the original contour kernel into its existing memory result.
   * Source-free coefficients and declared incidence retain their original
   * ordering. Normals use the original face/corner reduction, with no
   * source-normal fallback.
   */
  export function tessellateContourLoft64(input: IAutoMovieContourLoft64): IAutoMovieContourLoft64.IResult {
    return tessellateContourLoft64Implementation(input);
  }

  /**
   * Build an indexed strip from saved contour rings and their declared walks.
   *
   * Each ring lies at a finite Y station in world millimetres and has positive
   * projected XZ winding. Each pair advances both rings once with P and Q steps
   * from in-range safe integer vertex ordinals and increasing stations. P
   * emits (P_i,Q_j,P_next) and Q emits (Q_next,P_i,Q_j). An ordinary exterior
   * slab winds outward with these orders.
   *
   * Mesh positions and closed construction rings are in metres. Each retained
   * face has a finite positive area in square millimetres. The pair counts
   * omitted faces and reports retained area and its absolute discrepancy from
   * the finite nonnegative optimizer objective. Incidence warnings preserve
   * retained faces. Unresolved vertex normals are zero with a diagnostic.
   * The diagnostics qualify path arithmetic and incidence. The caller owns
   * optimizer correctness, source fidelity and geometric embedding.
   *
   * @throws Error for invalid rings or walks, or if a pair's retained areas
   *   cannot be summed to a finite value.
   */
  export function tessellateContourPath64(
    input: IAutoMovieTessellateContourPath64.IInput,
  ): IAutoMovieTessellateContourPath64.IResult {
    return tessellateContourPath64Implementation(input);
  }

  /**
   * Emit a periodic triangle strip between two area-spanning walks.
   *
   * Choose the first seam on its exterior and the second at its nearest
   * existing knot. Among fixed-seam candidates the search minimizes total
   * triangle area. Separate identities can distinguish the two sides of a
   * doubled branch slit. The observer reports sheet qualification independently
   * from emitted geometry. If no candidate qualifies, finite positive-area
   * tiles can remain available with diagnostics. Supply work observation to
   * measure elapsed time. Slit identities remain separate even when their
   * points coincide.
   */
  export function tessellateContourStrip64(rawA: AutoMovieVector3Tuple[], rawB: AutoMovieVector3Tuple[], emit: (
    a: AutoMovieVector3Tuple,
    b: AutoMovieVector3Tuple,
    c: AutoMovieVector3Tuple,
  ) => void, identity?: (point: AutoMovieVector3Tuple) => string | undefined, observe?: (observation: IAutoMovieObservation) => void, observeWork?: boolean): void {
    tessellateContourStrip64Implementation(rawA, rawB, emit, identity, observe, observeWork);
  }

  /**
   * Tessellate a fixed parametric atlas using shared canonical boundary
   * samples.
   *
   * Supply integer lattice counts in [1, 128], finite chart positions and first
   * partials in millimetres, and four directed edges in bottom, right, top and
   * left order. Output positions use metres. Nonlinear restrictions supply
   * paired parameterize and localize callbacks. Chart requests keep their exact
   * phase keys and original local addresses.
   *
   * A callback failure omits its chart and releases its partial output and
   * vertex budget. Boundary planning discards requests supplied only by failed
   * charts. A conflict between finite boundary points omits the incident
   * charts. Shared positions can carry separate chart normal fans. An authored
   * finite limiting normal can resolve a zero cross product and is counted
   * separately. Keep chart and boundary owners immutable during the call.
   */
  export function tessellateParametricAtlas64(props: IAutoMovieTessellateParametricAtlas64.IProps): IAutoMovieTessellateParametricAtlas64.IResult {
    return tessellateParametricAtlas64Implementation(props);
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
    return triangulateParameterCell64Implementation<T>(boundary, coordinates);
  }
  /**
   * Tessellate complete bicubic patches with explicit shared control identities.
   * Sixteen controls are row-major: v rows, u columns, all in millimetres.
   * Matching four-ID boundary tuples, including reversals, own one edge; matching
   * endpoint control IDs own one corner. Different IDs at equal positions stay
   * separate. Output positions are metres, indices are append-only global indices
   * from vertexOffset, and a chunk may reference earlier vertices. Inputs remain
   * immutable until completion. Optional triangle-corner parameters retain each
   * accepted triangle's actual chart coordinates independently of shared render
   * vertices and normal fans. They follow emitted triangle order, including after
   * local omissions.
   *
   * Exact Bernstein restrictions refine each unit cell using the same-parameter
   * Taylor estimate Muu/8+Muv/4+Mvv/8. Second-partial coefficient norms bound
   * these derivatives in exact arithmetic; binary64 estimates are not
   * outward-rounded certificates. Every incident patch registers boundary
   * requests before emission. Line registries add hanging corners to
   * parameter-boundary triangulations without a global grid. Bottom/top chains
   * are zipped before exterior hanging edges are split, using their existing
   * samples rather than an analytic cell-center vertex. Matching translated
   * boundary polygons retain station-parallel face planes in exact arithmetic.
   * Unequal samples and general fields acquire no normal-error bound. Source
   * fidelity, immersion, orientability and absence of intersections are
   * unproved.
   *
   * MaxCells bounds allocated leaf slots across the atlas. A cell needing
   * refinement after the budget is exhausted follows cellBudgetPolicy: the strict
   * default leaves an explicit gap, while retain-coarse emits that existing
   * finite leaf once with its actual error estimate and
   * approximationQualified=false. A split parent is never retained with its
   * children. All retained leaves enter the same edge-request union, so coarse
   * budget retention does not bypass boundary conformity. Legacy four-ID edges
   * share the first retained incident patch's normal. Explicit canonical bindings
   * instead construct the edge coefficients before bounds, union exact dyadic
   * phase requests and alias hanging corners by declared endpoints. Distinct
   * exact phases retain separate identities even when their binary64 views
   * coincide; zero-area triangles remain counted omissions. An inverse that
   * cannot represent an interior coordinate omits that request with a local
   * diagnostic, preserving other requests and patches without welding or altering
   * coefficients. Optional coefficient retention copies the actual post-binding
   * root grids into the terminal summary and streamed chunks in mm. Omission or
   * false allocates no snapshot and leaves emitted geometry unchanged. A prepared
   * grid can exist for an omitted region; the public realizer separately filters
   * snapshots to retained triangle owners. Position owners are independent of
   * render normal fans, preserving both crease banks' analytic normals without
   * averaging. This establishes no G1 certificate. Canonical endpoint values must
   * agree exactly across declared corner aliases. Conflicting classes omit only
   * their incident patches with explicit diagnostics. Consistent bindings
   * construct the shared corner in every incident chart before derivative bounds,
   * including charts that retain an unbound side at that corner. Complete legacy
   * edge tuples consume that same constructed edge, including reversal.
   * Equivalent nets under different authoritative intervals retain finite
   * geometry with an explicit inter-authority polygon-conformity limitation.
   * Exact zero or nonfinite normals remain zero with counts; finite positive-area
   * geometry survives normal qualifications. Malformed global policy, retention
   * flags or coefficient registry addresses throw before the first chunk.
   */
  export function* tessellateBicubicAtlas64(
    input: IAutoMovieBicubicAtlasTessellation64.Input,
  ): Generator<
    IAutoMovieBicubicAtlasTessellation64.Chunk,
    IAutoMovieBicubicAtlasTessellation64.Summary,
    void
  > {
    return yield* tessellateBicubicAtlas64Implementation(input);
  }

  /**
   * Stream a conforming open mesh of the local linear physical Hermite field.
   * Input courses are complete millimetre cubic curves with common normalized
   * phase; their direction and ordinary-run graph authority are supplied by the
   * caller. Positions/construction are published in metres. Indices are global,
   * beginning at vertexOffset, and may reference vertices published in earlier
   * chunks of this run. Every shared station uses the same actual vertex index
   * and authoritative source jet.
   *
   * Exact tensor restrictions are refined until Muu/8+Muv/4+Mvv/8 <= toleranceMm,
   * using maxima of Bernstein second-derivative coefficient norms on each local
   * unit cell. Taylor's formula and barycentric coordinate variances <=1/4 bound
   * the same-parameter affine error of each parameter triangle in exact
   * arithmetic. Binary64 estimates are not outward-rounded certificates. This
   * bound concerns the new Hermite field, not source-surface distance,
   * monotonicity or injectivity. Bottom/top boundary chains are zipped and
   * exterior hanging edges subdivided using existing samples only. Identical
   * translated polygons with matching phase samples retain station-parallel face
   * planes; general normal error is unbounded.
   *
   * Corners use right-sided analytic normals (u=1 left-sided); unresolved normals
   * remain zero with diagnostics. Zero-area triangles are counted and omitted.
   * Resource limits or unresolved interval arithmetic leave a diagnostic gap
   * while other intervals survive. Input admission failures reject the run. Ruled
   * station interpolation is C0 only and chooses right incident station normals,
   * with the final station left-sided. Quadratic mode C1 requires same-chart C1
   * input courses; crease/G1 input does not acquire parametric C1 from station
   * interpolation.
   */
  export function* tessellateLocalHermite64(
    input: IAutoMovieLocalHermiteStream64.Input,
  ): Generator<
    IAutoMovieLocalHermiteStream64.Chunk,
    IAutoMovieLocalHermiteStream64.Summary,
    void
  > {
    return yield* tessellateLocalHermite64Implementation(input);
  }
}
