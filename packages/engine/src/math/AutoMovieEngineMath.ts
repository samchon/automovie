import { addAutoMovieQuadraticProduct as addAutoMovieQuadraticProductImplementation } from "./internal/addAutoMovieQuadraticProduct";
import { addPositiveModulo as addPositiveModuloImplementation } from "./internal/addPositiveModulo";
import { adjacentAutoMovieFloat64 as adjacentAutoMovieFloat64Implementation } from "./internal/adjacentAutoMovieFloat64";
import { type IAutoMovieSolveQuadraticProgram, type IAutoMovieVector3, type IAutoMovieClosestSegmentPoints, type IAutoMovieJacobianCofactor, type IAutoMovieQuadraticConicProgram, type IAutoMovieQuadraticConstraintBasis, type IAutoMovieQuadraticRow, type IAutoMovieCreateQuadraticFactor, type IAutoMovieCreateQuadraticMemory, type IAutoMovieMesh, type IAutoMovieSingularDecomposition, type IAutoMovieSingularMatrixBudget, type IAutoMovieFitRigidMeshTransform, type IAutoMovieColor, type IAutoMovieMeasureQuadraticState, type IAutoMovieQuadraticState, type IAutoMovieSimplexMinimum, type IAutoMovieSimplexAtom, type IAutoMovieSimplexBudget, type IAutoMovieAngleRange, type IAutoMovieHullEdge, type IAutoMovieQuadraticPolishingResult, type IAutoMovieQuadraticRefinementOptions, type IAutoMovieQuadraticRefinementInterval, type IAutoMovieQuaternion, type IAutoMovieQrDesignReduction, type IAutoMovieQrDesignBudget, type IAutoMovieQuadraticRefinementResult, type IAutoMovieResolvedPhysicalVertices, type IAutoMovieRigidTransformVelocity, type IAutoMovieTransform, type IAutoMovieSolveBoundedDisplacement, type IAutoMovieSolveHalfPlaneProgram, type IAutoMovieSolveQuadraticKernel, type IAutoMovieQuadraticWorkingSetStep, type IAutoMovieWeldMeshVertices } from "@automovie/interface";
import { admitAutoMovieQuadraticProgram as admitAutoMovieQuadraticProgramImplementation } from "./internal/admitAutoMovieQuadraticProgram";
import { assembleAutoMovieQuadraticProgram as assembleAutoMovieQuadraticProgramImplementation } from "./internal/assembleAutoMovieQuadraticProgram";
import { assignAutoMovieMinimumCost as assignAutoMovieMinimumCostImplementation } from "./internal/assignAutoMovieMinimumCost";
import { bracketedBisection as bracketedBisectionImplementation } from "./internal/bracketedBisection";
import { bracketedCrossing as bracketedCrossingImplementation } from "./internal/bracketedCrossing";
import { bracketedMinimum as bracketedMinimumImplementation } from "./internal/bracketedMinimum";
import { bracketedRoot as bracketedRootImplementation } from "./internal/bracketedRoot";
import { clampAutoMovieUnitInterval as clampAutoMovieUnitIntervalImplementation } from "./internal/clampAutoMovieUnitInterval";
import { closestPointOnSegmentXZ as closestPointOnSegmentXZImplementation } from "./internal/closestPointOnSegmentXZ";
import { closestPointsBetweenSegments as closestPointsBetweenSegmentsImplementation } from "./internal/closestPointsBetweenSegments";
import { cofactorAutoMovieJacobian as cofactorAutoMovieJacobianImplementation } from "./internal/cofactorAutoMovieJacobian";
import { convexHull2D as convexHull2DImplementation } from "./internal/convexHull2D";
import { createAutoMovieQuadraticConicProgram as createAutoMovieQuadraticConicProgramImplementation } from "./internal/createAutoMovieQuadraticConicProgram";
import { createAutoMovieQuadraticConstraintBasis as createAutoMovieQuadraticConstraintBasisImplementation } from "./internal/createAutoMovieQuadraticConstraintBasis";
import { createAutoMovieQuadraticFactor as createAutoMovieQuadraticFactorImplementation } from "./internal/createAutoMovieQuadraticFactor";
import { createAutoMovieQuadraticMemory as createAutoMovieQuadraticMemoryImplementation } from "./internal/createAutoMovieQuadraticMemory";
import { createMeshEdgeKey as createMeshEdgeKeyImplementation } from "./internal/createMeshEdgeKey";
import { createMeshPhysicalPartitionMatcher as createMeshPhysicalPartitionMatcherImplementation } from "./internal/createMeshPhysicalPartitionMatcher";
import { cubicHermiteValue as cubicHermiteValueImplementation } from "./internal/cubicHermiteValue";
import { decomposeAutoMovieSingularMatrix as decomposeAutoMovieSingularMatrixImplementation } from "./internal/decomposeAutoMovieSingularMatrix";
import { determinantAutoMovieMatrix3 as determinantAutoMovieMatrix3Implementation } from "./internal/determinantAutoMovieMatrix3";
import { equilibrateAutoMovieQuadraticProgram as equilibrateAutoMovieQuadraticProgramImplementation } from "./internal/equilibrateAutoMovieQuadraticProgram";
import { fitRigidMeshTransform as fitRigidMeshTransformImplementation } from "./internal/fitRigidMeshTransform";
import { interpolateAutoMovieTrianglePoint as interpolateAutoMovieTrianglePointImplementation } from "./internal/interpolateAutoMovieTrianglePoint";
import { linearColorToSrgbHex as linearColorToSrgbHexImplementation } from "./internal/linearColorToSrgbHex";
import { measureAutoMovieQuadraticState as measureAutoMovieQuadraticStateImplementation } from "./internal/measureAutoMovieQuadraticState";
import { midpoint as midpointImplementation } from "./internal/midpoint";
import { minimizeAutoMovieSimplexQuadratic as minimizeAutoMovieSimplexQuadraticImplementation } from "./internal/minimizeAutoMovieSimplexQuadratic";
import { mixSeed as mixSeedImplementation } from "./internal/mixSeed";
import { nearestAngleAlias as nearestAngleAliasImplementation } from "./internal/nearestAngleAlias";
import { nearestHullEdge as nearestHullEdgeImplementation } from "./internal/nearestHullEdge";
import { orderAutoMovieQuadraticMatrix as orderAutoMovieQuadraticMatrixImplementation } from "./internal/orderAutoMovieQuadraticMatrix";
import { overflowsBinary64 as overflowsBinary64Implementation } from "./internal/overflowsBinary64";
import { pointHullDistance as pointHullDistanceImplementation } from "./internal/pointHullDistance";
import { pointInHull as pointInHullImplementation } from "./internal/pointInHull";
import { pointSegmentDistance as pointSegmentDistanceImplementation } from "./internal/pointSegmentDistance";
import { polishAutoMovieQuadraticProgram as polishAutoMovieQuadraticProgramImplementation } from "./internal/polishAutoMovieQuadraticProgram";
import { polynomialUnitRoots as polynomialUnitRootsImplementation } from "./internal/polynomialUnitRoots";
import { positiveModulo as positiveModuloImplementation } from "./internal/positiveModulo";
import { quaternionFromAutoMovieBasis as quaternionFromAutoMovieBasisImplementation } from "./internal/quaternionFromAutoMovieBasis";
import { quaternionInterpolationCriticalRatios as quaternionInterpolationCriticalRatiosImplementation } from "./internal/quaternionInterpolationCriticalRatios";
import { reduceAutoMovieQrDesign as reduceAutoMovieQrDesignImplementation } from "./internal/reduceAutoMovieQrDesign";
import { refineAutoMovieQuadraticProgram as refineAutoMovieQuadraticProgramImplementation } from "./internal/refineAutoMovieQuadraticProgram";
import { resolveAutoMovieMeshPhysicalVertices as resolveAutoMovieMeshPhysicalVerticesImplementation } from "./internal/resolveAutoMovieMeshPhysicalVertices";
import { rigidTransformVelocity as rigidTransformVelocityImplementation } from "./internal/rigidTransformVelocity";
import { roundToThousandths as roundToThousandthsImplementation } from "./internal/roundToThousandths";
import { seededValue as seededValueImplementation } from "./internal/seededValue";
import { segmentIndex as segmentIndexImplementation } from "./internal/segmentIndex";
import { segmentSegmentDistance as segmentSegmentDistanceImplementation } from "./internal/segmentSegmentDistance";
import { solveAutoMovieBoundedDisplacement as solveAutoMovieBoundedDisplacementImplementation } from "./internal/solveAutoMovieBoundedDisplacement";
import { solveAutoMovieHalfPlaneProgram as solveAutoMovieHalfPlaneProgramImplementation } from "./internal/solveAutoMovieHalfPlaneProgram";
import { solveAutoMovieQuadraticInterior as solveAutoMovieQuadraticInteriorImplementation } from "./internal/solveAutoMovieQuadraticInterior";
import { solveAutoMovieQuadraticKernel as solveAutoMovieQuadraticKernelImplementation } from "./internal/solveAutoMovieQuadraticKernel";
import { solveAutoMovieQuadraticProgram as solveAutoMovieQuadraticProgramImplementation } from "./internal/solveAutoMovieQuadraticProgram";
import { solveAutoMovieQuadraticStep as solveAutoMovieQuadraticStepImplementation } from "./internal/solveAutoMovieQuadraticStep";
import { solveAutoMovieQuadraticWorkingSetStep as solveAutoMovieQuadraticWorkingSetStepImplementation } from "./internal/solveAutoMovieQuadraticWorkingSetStep";
import { srgbHexToLinearColor as srgbHexToLinearColorImplementation } from "./internal/srgbHexToLinearColor";
import { weldMeshVertices as weldMeshVerticesImplementation } from "./internal/weldMeshVertices";
import { wrapDegrees as wrapDegreesImplementation } from "./internal/wrapDegrees";

/** Public operations for Auto Movie Engine Math. */
export namespace AutoMovieEngineMath {
  /**
   * Add a product to one interleaved twofold accumulator: high at 2_index and low
   * at 2_index+1. The caller owns complete storage and initializes both parts.
   * Ogita, Rump and Oishi (2005), algorithms 3.1, 3.3 and 5.3, derive the
   * TwoSum/TwoProduct correction used here:
   * https://www.tuhh.de/ti3/paper/rump/OgRuOi05.pdf
   *
   * Binary64 splitting retains product rounding error and TwoSum retains addition
   * rounding error. Exact power-of-two transfers prevent splitter overflow; a
   * large product is scaled before the error calculation. Without underflow the
   * product decomposition is exact; underflow retains the paper's absolute-error
   * limitation. Nonfinite arithmetic propagates to the numerical owner's refusal.
   * This improves evaluation of the same coefficients, never their objective,
   * constraint, stabilization or convergence tolerances.
   */
  export function addQuadraticProduct(target: Float64Array, index: number, a: number, b: number): void {
    addAutoMovieQuadraticProductImplementation(target, index, a, b);
  }

  /**
   * Add an offset on a positive cyclic domain without perturbing an ordinary
   * phase when the offset is zero or a whole period.
   *
   * Normalizing both operands before their sum prevents a neutral elapsed/start
   * offset from enlarging an already-normalized phase and introducing another
   * wrapping error.
   *
   * Finite operands and a finite positive period are caller premises. An
   * overflowing sum of normalized operands is reduced by subtracting the
   * remaining period instead; ordinary representable sums retain their existing
   * expression order. Results retain binary64 rounding.
   */
  export function addPositiveModulo(value: number, offset: number, period: number): number {
    return addPositiveModuloImplementation(value, offset, period);
  }

  /**
   * The binary64 number adjacent to a finite value, one unit in the last place
   * toward positive or negative infinity.
   *
   * Callers widen a rounded result outward by one representable step so a
   * computed bound encloses the exact one, as interval and enclosure code does
   * after a rounded subtraction or division; no spatial tolerance or unit is
   * involved. Zero of either sign steps to the signed smallest subnormal, and a
   * smallest subnormal stepping toward zero returns a zero carrying its sign.
   *
   * @param value Finite value to step from; either infinity throws.
   * @param upper True for the neighbour toward positive infinity, false for the
   *   one toward negative infinity.
   * @returns The adjacent finite value. Stepping beyond `Number.MAX_VALUE` in
   *   either direction throws instead of returning an infinity.
   */
  export function adjacentFloat64(value: number, upper: boolean): number {
    return adjacentAutoMovieFloat64Implementation(value, upper);
  }

  /**
   * Check explicit diagonal-program admission rules without building its sparse
   * matrix.
   *
   * The bounded displacement and underwear-surface working-set callers admit the
   * whole program before restricting it; assembly and original-coordinate
   * refinement share this admission. Inactive malformed rows cannot evade the
   * check. This does not solve the program or prove its feasibility, convergence,
   * conditioning or post-transform geometry.
   *
   * The program needs one through 2^31-1 variables, at most 2^31-1 rows, complete
   * diagonal/linear/optional initial vectors, a nonnegative diagonal and equally
   * sized row weights/indices. Indices must be unique in-range integers and
   * nullable inclusive bounds must be ordered. Each supplied coefficient or
   * nonnull endpoint is finite with magnitude strictly below the numerical 1e30
   * infinity sentinel; exact zero coefficients remain unchanged.
   *
   * Array containers and row shape are typed caller premises. Indexed reads
   * refuse resident holes, and explicit rule failures throw before matrix
   * assembly without changing inputs. Int32 dimensions do not prove aggregate
   * CSC-entry, factor-fill or TypeScript workspace capacity: the duplicate marker
   * or later numerical storage can still fail to allocate, and host allocation or
   * malformed-container errors need not have a named rule message.
   *
   * @param input Program to check; it is only read.
   */
  export function admitQuadraticProgram(input: [IAutoMovieSolveQuadraticProgram.IInput][0]): void {
    admitAutoMovieQuadraticProgramImplementation(input);
  }

  /**
   * Admits a sparse-row quadratic program and lays its constraint matrix out in
   * the compressed sparse column form the engine numerical kernel reads.
   *
   * Admission is `admitAutoMovieQuadraticProgram`, so an inadmissible program
   * throws before anything is built. Column `c` holds its nonzeros at
   * `columns[c]` up to `columns[c + 1]`, in ascending row order, and a weight of
   * exactly zero is kept as an explicit entry. A null row endpoint becomes
   * `-AUTOMOVIE_QUADRATIC_INFINITY` or `AUTOMOVIE_QUADRATIC_INFINITY`, the
   * kernel's unbounded sentinel.
   *
   * @param input Program in sparse-row form; it is only read.
   * @returns Kernel input whose `columns`, `rowIndices`, `values`, `lower` and
   *   `upper` are new arrays, while `diagonal`, `linear` and `initial` are the
   *   caller's own arrays, so mutating them later changes the assembled program.
   */
  export function assembleQuadraticProgram(input: [IAutoMovieSolveQuadraticProgram.IInput][0]): [
  {
    diagonal: readonly number[];
    linear: readonly number[];
    columns: readonly number[];
    rowIndices: readonly number[];
    values: readonly number[];
    lower: readonly number[];
    upper: readonly number[];
    initial?: readonly number[];
  },
][0] {
    return assembleAutoMovieQuadraticProgramImplementation(input);
  }

  /**
   * The assignment of rows to distinct columns of least total cost: the Hungarian
   * method (Kuhn 1955) in its shortest-augmenting-path form, for a rectangular
   * cost table with no more rows than columns.
   *
   * Row `i` is given column `result[i]`; no two rows share a column, and the sum
   * of `cost[i][result[i]]` is the least any such assignment reaches. Ties are
   * broken by the scan order of rows and columns, so the same table always gives
   * the same assignment.
   *
   * @param cost The cost of giving each row each column: `rows` arrays of
   *   `columns` finite numbers, `rows <= columns`.
   * @returns The column of each row.
   * @throws {Error} When the table is ragged, has more rows than columns, or
   *   holds a value that is not finite: a caller's defect. Also when finite costs
   *   are so far apart that the potentials' reduced costs overflow binary64
   *   (differences beyond the largest double), which the shortest-path search
   *   cannot order.
   */
  export function assignMinimumCost(cost: readonly (readonly number[])[]): number[] {
    return assignAutoMovieMinimumCostImplementation(cost);
  }

  /**
   * The boundary of a yes-or-no condition between two arguments, the condition
   * holding at one and not at the other, by bisection.
   *
   * Each step reads the condition at the bracket's midpoint and keeps the half
   * whose ends still disagree, so the bracket halves on every step and the
   * boundary never leaves it. Where the condition is the sign of a continuous
   * function, `bracketedRoot` finds the crossing in fewer evaluations; this is
   * for a condition that has no value to interpolate, or whose value jumps (one
   * shape left as another is met), where a chord would misread it. The ends are
   * the caller's to have read: neither is evaluated here.
   *
   * @param holds The condition.
   * @param low The end where the condition holds; it may lie either side of
   *   `high`.
   * @param high The end where it does not.
   * @param tolerance The bracket width at which the search stops, in the
   *   argument's unit; positive. A tolerance finer than the spacing of doubles at
   *   the boundary stops at two adjacent doubles instead, the finest bracket the
   *   arithmetic holds.
   * @returns The end of the final bracket where the condition does not hold,
   *   within `tolerance` of the boundary, or one double from it when the
   *   tolerance is finer than that; `high` itself when the bracket is already no
   *   wider than `tolerance`.
   * @throws If an end is not finite or the tolerance is not positive and finite.
   */
  export function bracketedBisection(holds: (x: number) => boolean, low: number, high: number, tolerance: number): number {
    return bracketedBisectionImplementation(holds, low, high, tolerance);
  }

  /**
   * Close a bracket onto the place where a continuous reading crosses from one
   * side of a threshold to the other, keeping which end lies on which side: the
   * lower end is never past the threshold and the upper end always is, as a
   * bisection keeps them, at a final width no greater than the one asked.
   *
   * The reading is first driven by the Illinois false position (`bracketedRoot`),
   * each of whose readings is inside the bracket and moves the end of its own
   * side exactly as a bisection's reading does. Whatever width that leaves (a
   * reading of exactly zero ends it at once; a reading that is not finite is
   * never handed to it) is then bisected away, so the final width is the caller's
   * whatever the reading does. A caller that asks the width a number of
   * bisections would leave therefore gets a crossing at least as fine as theirs,
   * in fewer readings where the reading is smooth.
   *
   * @param props The reading less its threshold (`f`, positive on one side);
   *   which sign is past the threshold (`past`); the bracket's two ends, `low`
   *   not past and `high` past; their readings when the caller has them
   *   (`known`), so they are not read again; and the final width, positive.
   * @returns The final bracket: `low`, the greatest argument read that is not
   *   past the threshold, and `high`, the least read that is.
   */
  export function bracketedCrossing(props: {
  f: (x: number) => number;
  past: (value: number) => boolean;
  low: number;
  high: number;
  known?: { low: number; high: number };
  tolerance: number;
}): { low: number; high: number } {
    return bracketedCrossingImplementation(props);
  }

  /**
   * The argument at which a function of one variable is least on an interval, by
   * Brent's method (Brent 1973, "Algorithms for Minimization without
   * Derivatives", chapter 5, `localmin`).
   *
   * Each step fits a parabola through the three best points found and takes its
   * lowest point when that lies inside the bracket, moves less than half the step
   * before last and does not come within the tolerance of an end; otherwise it
   * takes a golden-section step into the larger part. The bracket always holds
   * the least point found, so on a function with one low on the interval (a
   * convex one, for instance) the search closes on it superlinearly where the
   * function is smooth and never slower than golden section where it is not (a
   * kink, a flat stretch).
   *
   * @param f The function; it is evaluated only inside the interval, never at its
   *   ends.
   * @param low One end of the interval.
   * @param high The other end.
   * @param tolerance The absolute width, in the argument's unit, the low is
   *   located to; positive.
   * @param limit The most evaluations.
   * @returns The argument of the least value found and that value.
   * @throws If an end is not finite or the tolerance is not positive and finite.
   */
  export function bracketedMinimum(f: (x: number) => number, low: number, high: number, tolerance: number, limit?: number): { at: number; value: number } {
    return bracketedMinimumImplementation(f, low, high, tolerance, limit);
  }

  /**
   * A root of a continuous function between two arguments where it takes opposite
   * signs, by the Illinois variant of the false position method (Dowell and
   * Jarratt 1971).
   *
   * Each step evaluates the function where the chord through the bracket's two
   * ends crosses zero and keeps the half that still brackets the root. When the
   * same end is kept twice in a row its value is halved for the next chord, so
   * both ends close on the root and the order of convergence is about 1.44 on a
   * smooth function, against one bit a step for bisection. The root never leaves
   * the bracket, so the method needs no derivative and no guard.
   *
   * @param f The function.
   * @param low One end of the bracket.
   * @param high The other end.
   * @param tolerance The bracket width at which the search stops, in the
   *   argument's unit; positive.
   * @param limit The most evaluations after the two ends'.
   * @returns The last argument evaluated, within `tolerance` of a root unless the
   *   limit ran out first; an end itself when the function is zero there.
   * @throws If an end or its value is not finite, the two values share a sign, or
   *   the tolerance is not positive and finite.
   */
  export function bracketedRoot(f: (x: number) => number, low: number, high: number, tolerance: number, limit?: number): number {
    return bracketedRootImplementation(f, low, high, tolerance, limit);
  }

  /**
   * Clamp a scalar into the closed unit interval [0, 1].
   *
   * Values below zero become zero and values above one become one; NaN stays NaN,
   * so a malformed input is never disguised as an endpoint. Segment parameters
   * and blend fractions share this one owner.
   */
  export function clampUnitInterval(value: number): number {
    return clampAutoMovieUnitIntervalImplementation(value);
  }

  /**
   * Closest horizontal point on the closed start/end segment, with returned Y
   * zero. Exact coincident endpoints remain a point; every nonzero span remains a
   * segment. Coordinates share one metre frame. The shared segment query's finite
   * arithmetic admission and binary64 witness precision apply after height is
   * discarded.
   */
  export function closestPointOnSegmentXZ(point: Pick<IAutoMovieVector3, "x" | "z">, start: Pick<IAutoMovieVector3, "x" | "z">, end: Pick<IAutoMovieVector3, "x" | "z">): IAutoMovieVector3 {
    return closestPointOnSegmentXZImplementation(point, start, end);
  }

  /**
   * Closest witnesses on bounded segments in one metre coordinate frame. Inputs
   * are unchanged; each result owns its points. segmentSegmentDistance consumes
   * this same calculation, including its precision and failure contract.
   *
   * Minimise |r+s_u-t_v| over [0,1]^2. The four boundary minima and the minimum
   * on the clipped stationary line u.(r+s_u-t_v)=0 contain a global minimiser. On
   * that line the residual is affine: project its origin onto that residual
   * segment without dividing by |u|^2*|v|^2-(u.v)^2. This avoids cancellation and
   * the absolute parallel threshold that lost small interior closest pairs. The
   * constrained-quadratic construction follows Eberly, Robust Computation of
   * Distance Between Line Segments (2023), sections 2 and 4; here the clipped
   * stationary line is minimised by its residual segment directly.
   *
   * Local differences are scaled by their largest component before dot products.
   * Math.hypot retains tiny residual lengths without squaring them to zero. Exact
   * zero-length segments remain points. Nonfinite coordinates, overflowed
   * differences, a nonzero span whose scaled squared length underflows, or an
   * unrepresentable witness distance refuse rather than fabricate separation.
   * Binary64 witnesses still round: this is not an exact contact predicate or a
   * certified distance lower bound. Callers own their precision allowance and
   * represented-output verification. Equal computed residual distances choose the
   * lowest first-segment parameter, then the lowest second parameter. Reversing a
   * segment changes that canonical orientation on a nonunique minimum; it does
   * not change the separation.
   *
   * @see https://www.geometrictools.com/Documentation/DistanceLine3Line3.pdf (modified September 21, 2023), sections 2 and 4.
   */
  export function closestPointsBetweenSegments(a: IAutoMovieVector3, b: IAutoMovieVector3, c: IAutoMovieVector3, d: IAutoMovieVector3): IAutoMovieClosestSegmentPoints {
    return closestPointsBetweenSegmentsImplementation(a, b, c, d);
  }

  /**
   * Evaluate one finite orientation-preserving 3×3 deformation Jacobian. Input
   * and returned matrix use row-major order and dimensionless entries. The
   * cofactor matrix is det(J) times inverse(J)-transpose, so it transports
   * oriented area vectors and positive determinant leaves normal direction
   * unchanged by that scalar. No inverse or absolute singularity epsilon is
   * used.
   *
   * This is the arithmetic owner used by createAutoMovieMeshDeformer's normal and
   * face-direction checks. It does not construct a deformation Jacobian, choose a
   * surface's transverse extension, or establish emitted geometry. The consumer
   * still checks every used transported vector and actual cell: cofactor entries
   * can overflow even when the determinant remains finite. Caller arrays are
   * unchanged and the returned object/matrix are owned.
   */
  export function cofactorJacobian(jacobian: readonly number[]): IAutoMovieJacobianCofactor {
    return cofactorAutoMovieJacobianImplementation(jacobian);
  }

  /**
   * 2D convex hull and point queries over the horizontal XZ plane.
   *
   * Points are {@link IAutoMovieVector3}; only `x` and `z` are used (`y` ignored),
   * because support and balance are decided by the ground-plane footprint. The
   * hull is built with Andrew's monotone chain, deterministic (no `Math.random`)
   * so support/topple judgments are reproducible, and canonicalized to
   * counter-clockwise order, so callers never have to assume the input points
   * were given convex or correctly ordered.
   */
  export function convexHull2D(points: readonly IAutoMovieVector3[]): IAutoMovieVector3[] {
    return convexHull2DImplementation(points);
  }

  /**
   * Expand admitted interval CSC into the engine's zero/nonnegative standard
   * form. Equalities precede finite upper/lower sides; a lower side negates A and
   * b. Original-row signed dual reconstruction uses the returned mapping. Caller
   * arrays are copied before subsequent numerical scaling; initial is ignored.
   */
  export function createQuadraticConicProgram(input: [
    {
      diagonal: readonly number[];
      linear: readonly number[];
      columns: readonly number[];
      rowIndices: readonly number[];
      values: readonly number[];
      lower: readonly number[];
      upper: readonly number[];
      initial?: readonly number[];
    },
  ][0]): IAutoMovieQuadraticConicProgram {
    return createAutoMovieQuadraticConicProgramImplementation(input);
  }

  /**
   * Factor a working transpose by column-pivoted Householder QR, without A_A'.
   * Only structural identities reduce rows: a nonzero free a_x_j=0 fixes x_j=0,
   * irrespective of a's magnitude/sign, and an all-zero zero endpoint is
   * tautological. Every other numerical rank ambiguity refuses rather than
   * discarding a row. Original coefficients/bounds are borrowed read-only; all
   * factors are owned. Gill and Wong (2014), sections 2-3, require an independent
   * working basis: https://www.ccom.ucsd.edu/~peg/papers/genqp.pdf Binary64 rank
   * readings and affine reconstruction remain separate from the refinement
   * caller's unchanged full original-row KKT and geometry admission.
   */
  export function createQuadraticConstraintBasis(rows: readonly IAutoMovieQuadraticRow[], bounds: readonly number[], free: readonly boolean[], variables: number): IAutoMovieQuadraticConstraintBasis {
    return createAutoMovieQuadraticConstraintBasisImplementation(rows, bounds, free, variables);
  }

  /**
   * Own sparse LDL-transpose factors of [diag(P), A'; A, -diag(H)]. H is zero for
   * equality rows and s/z for inequalities. Symbolic elimination and ordering are
   * reused within this solve; only diagonal values change between iterations.
   * Davis's left-looking elimination-tree LDL algorithm computes actual fill.
   * Signed static/dynamic pivot stabilization affects factors only; every solve
   * refines against the original, unregularized KKT matrix. Twofold product sums
   * retain cancellation in elimination, substitution and original-system
   * residuals; rounded residuals cannot certify their own error.
   *
   * The regularization/refinement constants retain Clarabel 0.11.1 defaults.
   * Finite refinement is not a convergence proof: the interior-point owner must
   * still establish the original primal/dual residual and objective-gap tests.
   */
  export function createQuadraticFactor(data: IAutoMovieQuadraticConicProgram): IAutoMovieCreateQuadraticFactor.IResult {
    return createAutoMovieQuadraticFactorImplementation(data);
  }

  /**
   * Create an independent synchronous TypeScript workspace owner. Byte requests
   * are positive integers at most 2^32-1, rounded up for aligned float64 storage.
   * Each borrow receives fresh zero-initialized storage at byte address zero; no
   * factor, iterate or previous value survives into the next borrow.
   *
   * Nested borrowing refuses. A callback exception propagates after releasing
   * ownership in finally. Heap getters refuse after release; a caller that
   * retains results copies their values. Already obtained typed views remain
   * ordinary JS references, so they are not a memory-safety sandbox and can delay
   * host GC.
   */
  export function createQuadraticMemory(): IAutoMovieCreateQuadraticMemory.IResult {
    return createAutoMovieQuadraticMemoryImplementation();
  }

  /**
   * Choose an exact key for pairs of welded vertex identities.
   *
   * A mesh consumer supplies the welded population once, then calls this key
   * function with integer endpoints in [0, vertexCount), retaining their order.
   * When vertexCount squared is a safe integer, from * vertexCount + to is an
   * injective base-vertexCount encoding and every intermediate is exact. Larger
   * populations retain a delimited integer pair instead of losing low bits or
   * introducing a mesh-size refusal. The representation stays fixed throughout
   * one traversal, so numeric and string identities cannot mix for one edge.
   * Directed consumers pass from/to unchanged; undirected consumers order the
   * pair before calling, since endpoint order is part of this key's identity.
   *
   * This helper owns pair encoding only. Position quantization, endpoint ordering
   * and incidence counts stay with the welding and consuming owners. No geometry
   * or caller state is mutated, and a malformed population refuses before a key
   * function exists. Endpoint admission is the consuming caller's precondition.
   */
  export function createMeshEdgeKey(vertexCount: number): (from: number, to: number) => number | string {
    return createMeshEdgeKeyImplementation(vertexCount);
  }

  /**
   * Capture mesh connectivity, physical source meaning and the legacy partition
   * before reusing an earlier topology admission. Source aliases still need
   * current-grid agreement; legacy vertices are rewelded on every candidate.
   * Coordinate-collapsed face ordinals are also captured: a formerly redundant
   * triangle becoming active changes incidence even with fixed source identities.
   * A source ID/domain mutation invalidates reuse even if incidence is unchanged.
   * Absolute positions and source-table numbering may change without changing
   * these facts. Capture owns its arrays, so later caller mutations cannot
   * rewrite its expectation. This matcher does not admit the initial topology or
   * certify any geometry, area, material, normal or intersection.
   *
   * Invalid capture throws; malformed candidates return false for ordinary
   * validation rather than reusing a cached verdict. XYZ units are metres.
   */
  export function createMeshPhysicalPartitionMatcher(mesh: IAutoMovieMesh): (candidate: IAutoMovieMesh) => boolean {
    return createMeshPhysicalPartitionMatcherImplementation(mesh);
  }

  /**
   * One scalar component of glTF cubic Hermite interpolation.
   *
   * `outTangent` belongs to the left key and `inTangent` to the right; both are
   * derivatives per second, so the segment `span` scales them before the Hermite
   * basis is applied. The sampler and every range proof share this evaluator: a
   * validator proving a different polynomial than playback uses is no proof.
   */
  export function cubicHermiteValue(left: number, outTangent: number, right: number, inTangent: number, span: number, t: number): number {
    return cubicHermiteValueImplementation(left, outTangent, right, inTangent, span, t);
  }

  /**
   * Decompose original rows by cyclic one-sided Jacobi column rotations. The
   * method rotates A and accumulates V; it never forms A transpose A. A common
   * maximum-entry scale protects the ordinary pair dot products. Numerical null
   * columns remain in V, including when there are fewer rows than columns. Their
   * left directions and relative accuracy remain unresolved. This bounded kernel
   * does not implement LAPACK's preconditioning, scaled-pair rotations or
   * high-relative-accuracy guarantees for extreme column disparities. The
   * one-sided construction is described by LAPACK DGESVJ:
   * https://www.netlib.org/lapack/lapack_routine/dgesvj.f
   */
  export function decomposeSingularMatrix(rows: readonly (readonly number[])[], budget: IAutoMovieSingularMatrixBudget): IAutoMovieSingularDecomposition {
    return decomposeAutoMovieSingularMatrixImplementation(rows, budget);
  }

  /**
   * Evaluate a finite row-major 3 by 3 determinant with an exact-sign fallback. A
   * conservative forward-error filter accepts a separated binary64 value.
   * Uncertain cancellation instead sums the six products of the input doubles as
   * exact signed binary integers and exponents. Its returned magnitude is rounded
   * to a representable double; zero is returned only for an exactly zero sum. An
   * unrepresentable nonzero magnitude refuses rather than becoming zero. This
   * proves the sign of the supplied doubles, not a physical measurement.
   */
  export function determinantMatrix3(matrix: readonly number[]): number {
    return determinantAutoMovieMatrix3Implementation(matrix);
  }

  /**
   * Apply ten bounded Ruiz diagonal equilibration passes to owned conic arrays.
   * The change x=D_xhat, z=E_zhat/c is invertible; it alters neither the authored
   * objective nor constraints. Original-coordinate residuals undo every scale.
   * Bounds and pass count retain the preceding Clarabel configuration.
   */
  export function equilibrateQuadraticProgram(data: IAutoMovieQuadraticConicProgram): void {
    equilibrateAutoMovieQuadraticProgramImplementation(data);
  }

  /**
   * Fit a proper rotation and translation between corresponding mesh vertices.
   * The facial basis builder uses this to perform a shape-edited rigid component
   * without allowing expression targets to scale, shear or reflect its geometry.
   * Inputs are flat XYZ buffers in the same units, and a nonempty, unique
   * selection indexes both. No input is mutated. Apply the returned rotation to a
   * point minus referenceCenter, then add targetCenter. Centered application
   * avoids cancellation between a large translation and a rotated absolute
   * coordinate.
   *
   * Horn's absolute-orientation method (JOSA A 4, 1987, pp. 629–642, section 4)
   * maximizes q^T N q for a unit quaternion. N is symmetric 4 by 4; its largest
   * eigenvector gives the least-squares proper rotation. Scale is fixed at one.
   * Cyclic Jacobi rotations diagonalize N to floating precision. Normalizing the
   * centered clouds before their products keeps covariance representable across
   * coordinate scales; normalizing covariance stabilizes the solve. Repeated
   * maximal eigenvalues have multiple optimal rotations; the fixed sweep and
   * first-maximum ordering select one deterministically. A collapsed covariance
   * selects identity and the centroid translation. This fit is geometric, and
   * establishes neither a physiological joint trajectory nor nonpenetration.
   */
  export function fitRigidMeshTransform(props: IAutoMovieFitRigidMeshTransform.IProps): IAutoMovieFitRigidMeshTransform.IResult {
    return fitRigidMeshTransformImplementation(props);
  }

  /**
   * A represented triangle seat from three admitted barycentric coefficients. The
   * coefficient sum's outward addition enclosure must contain one; negative,
   * nonfinite or wrong-sized inputs refuse. Producer coefficients round, so exact
   * rational equality is not required. Coefficients are not renormalized: the
   * established three multiply/add source seat remains bit-identical. Attachment
   * registration accounts for its represented departure from the ideal plane.
   * Current geometry and seating consume the same multiplication order. Points
   * and weights remain caller-owned and the returned metre vector is owned.
   */
  export function interpolateTrianglePoint(points: readonly IAutoMovieVector3[], weights: readonly number[]): IAutoMovieVector3 {
    return interpolateAutoMovieTrianglePointImplementation(points, weights);
  }

  /**
   * Encode a linear color as the `#RRGGBB` swatch that displays it.
   *
   * The quantized inverse of {@link srgbHexToLinearColor}, and the shared way to
   * write an `IAutoMovieColor.hex` label or a bare sRGB palette entry from a
   * triple. Without it the contract's promise that `hex` is derived from the
   * linear components is an obligation with nothing behind it, which is what left
   * every label in the product hand-typed and unchecked.
   *
   * Components outside `[0, 1]` are clamped, because a swatch cannot represent
   * light the display cannot emit and the eight-bit form is the gamut. A
   * non-finite component is refused instead: it names no color at any exposure,
   * and rounding it would write `NaN` into a string that reads like a swatch.
   */
  export function linearColorToSrgbHex(color: Pick<IAutoMovieColor, "r" | "g" | "b">): string {
    return linearColorToSrgbHexImplementation(color);
  }

  /**
   * Measure homogeneous equations and original-coordinate termination quantities.
   * Residual signs are rx=-Px-A'z-q_tau and rz=Ax+s-b_tau. Costs divide by tau
   * and undo objective scaling; infeasibility quantities remain homogeneous.
   * Stable Euclidean norms retain the preceding solver's residual definitions.
   * Product/addition corrections remain through sparse residuals and costs; the
   * gap is formed before the two reported costs round to individual numbers.
   */
  export function measureQuadraticState(data: IAutoMovieQuadraticConicProgram, state: IAutoMovieQuadraticState): IAutoMovieMeasureQuadraticState.IResult {
    return measureAutoMovieQuadraticStateImplementation(data, state);
  }

  /**
   * Binary64 midpoint of two finite coordinates, preserving the ordinary
   * summed-half expression whenever its sum is representable.
   *
   * A same-sign pair past half the largest double can overflow on addition
   * although its midpoint is finite. Only that case uses left plus half the
   * difference; opposite-sign pairs cannot overflow the sum. The result is
   * rounded arithmetic, not an exact-real enclosure.
   */
  export function midpoint(left: number, right: number): number {
    return midpointImplementation(left, right);
  }

  /**
   * Minimize half ||sum(lambda_i_a_i)||^2 + sum(lambda_i_b_i) on the simplex.
   * Pairwise Frank-Wolfe transfers mass from the most expensive occupied atom to
   * the cheapest atom, with exact quadratic line search and complete pricing.
   * Lacoste-Julien and Jaggi (2015), Algorithm 2, describes the pairwise update.
   * Exact-arithmetic pricing bounds convex objective error, not parameter error.
   * Computed gaps include measured simplex-mass correction, but are not interval
   * certificates of all dot-product rounding at a requested sub-ulp target.
   */
  export function minimizeSimplexQuadratic(width: number, atoms: readonly IAutoMovieSimplexAtom[], tolerance: number, budget: IAutoMovieSimplexBudget, charge?: (work: number) => void): IAutoMovieSimplexMinimum {
    return minimizeAutoMovieSimplexQuadraticImplementation(width, atoms, tolerance, budget, charge);
  }

  /**
   * Fold one full safe-integer seed into a domain-separated 32-bit state.
   *
   * Both 32-bit words participate, so values separated by 2^32 remain distinct.
   * The function is pure and stable across effect, combat, formation, and
   * instance-set runtimes.
   */
  export function mixSeed(seed: number, salt: number): number {
    return mixSeedImplementation(seed, salt);
  }

  /**
   * The full-turn alias of an angle nearest an interval: one inside it when any
   * is, the angle itself first; otherwise the alias with the least overshoot, the
   * lower one on a tie. A `null` interval is the immobile one, which admits only
   * 0. No angle is clamped.
   *
   * The nearest alias matters for an interval no alias can hit exactly. An
   * immobile axis admits only 0, and an extraction returns its half turn as 180
   * degrees less a rounding error, so the alternate chart's 360 degrees less that
   * error has no alias at exactly 0; left unaliased it would score a full turn of
   * overshoot and lose a chart choice to a far worse chart, on rounding noise
   * alone.
   *
   * @param angle Degrees.
   * @param range The interval, degrees; `null` for an immobile axis.
   * @returns The alias, degrees.
   */
  export function nearestAngleAlias(angle: number, range: IAutoMovieAngleRange | null): number {
    return nearestAngleAliasImplementation(angle, range);
  }

  /**
   * The hull boundary edge nearest to `point`, the tip-over axis when an object
   * topples over that edge. A single-vertex hull degenerates to a zero-length
   * edge at that vertex. Empty hulls throw because no boundary edge exists.
   * Endpoints alias the hull's own point records; equal computed distances keep
   * the first declared edge.
   */
  export function nearestHullEdge(point: IAutoMovieVector3, hull: readonly IAutoMovieVector3[]): IAutoMovieHullEdge {
    return nearestHullEdgeImplementation(point, hull);
  }

  /**
   * Deterministic minimum-degree elimination of the sparse symmetric KKT graph.
   * An indexed heap chooses degree then original ordinal; eliminating a vertex
   * joins its remaining neighbors and releases its adjacency. This records fill
   * without allocating a dense N-by-N matrix. Dense fill is still possible for
   * intrinsically dense graphs; the factor's actual nonzeros own that cost.
   */
  export function orderQuadraticMatrix(data: IAutoMovieQuadraticConicProgram): Int32Array {
    return orderAutoMovieQuadraticMatrixImplementation(data);
  }

  /**
   * Whether one IEEE 754 operation on finite operands overflowed binary64.
   *
   * Rounding a result past `Number.MAX_VALUE` produces a signed infinity (IEEE
   * 754-2019 §7.4), so a caller tests the result of the operation that can
   * overflow, at that operation, rather than validating its inputs.
   *
   * @param value The rounded result of one sum, difference, product or quotient.
   * @returns True when the operation overflowed.
   */
  export function overflowsBinary64(value: number): boolean {
    return overflowsBinary64Implementation(value);
  }

  /**
   * Distance from `point` to a convex hull on the XZ plane: `0` when inside,
   * otherwise the distance to the nearest boundary. Degenerate hulls fall back to
   * the distance to their single vertex (size 1) or segment (size 2).
   */
  export function pointHullDistance(point: IAutoMovieVector3, hull: readonly IAutoMovieVector3[]): number {
    return pointHullDistanceImplementation(point, hull);
  }

  /**
   * Is `point` inside (or on the boundary of) a counter-clockwise hull? Always
   * `false` for a degenerate hull of fewer than three vertices (a point or a
   * segment cannot enclose area).
   */
  export function pointInHull(point: IAutoMovieVector3, hull: readonly IAutoMovieVector3[]): boolean {
    return pointInHullImplementation(point, hull);
  }

  /**
   * Distance in metres from a point to a closed segment in one coordinate frame.
   * Coincident endpoints give point distance without collapsing tiny nonzero
   * spans. The shared segment owner admits finite represented arithmetic and
   * reports rounded witnesses rather than a certified exact separation bound.
   */
  export function pointSegmentDistance(point: IAutoMovieVector3, start: IAutoMovieVector3, end: IAutoMovieVector3): number {
    return pointSegmentDistanceImplementation(point, start, end);
  }

  /**
   * Prepare a correction near an unchanged native primal and signed dual. When
   * the independent original-row owner has already admitted feasibility and
   * complementarity, retain that primal and cyclically minimize stationarity's
   * squared Euclidean norm over each signed-dual coordinate. Its box comes from
   * the same original equality, null-bound and complementarity predicate; native
   * multipliers need no initial global clipping. Original full-row KKT alone
   * admits the result, and Euclidean decrease guarantees no infinity-norm success
   * or convergence within the caller's finite work budget.
   *
   * Wright (2015), sections 1.1-1.2, treats box constraints by coordinate
   * indicators and exact scalar minimization: https://arxiv.org/pdf/1502.04759 A
   * different native residual signature instead selects joint correction. Neither
   * problem phase names nor particular original rows select the method. Each
   * started dual sweep or working solve consumes that one unchanged budget.
   *
   * The refinement owner supplies exact coefficient groups and their interval
   * intersections. Only identical sparse A rows share an equation: proportional,
   * differently signed or differently scaled rows remain separate. Their active
   * endpoint is the strongest original lower/upper owner, so nested copies cannot
   * demand incompatible endpoint equations for the same affine value.
   *
   * The sum of original signed multipliers is the group multiplier because the
   * coefficients are identical. Corrections preserve that equation and restore
   * its signed multiplier to the original endpoint owner. A point intersection
   * allows a free multiplier: its sign chooses the lower or upper owner,
   * including point intersections formed by separate one-sided inequalities.
   * Every original row stays in independent final admission; grouping is no
   * deleted QP constraint.
   *
   * Joint correction uses a changing independent working basis. Its native start
   * must be feasible on every original row within the unchanged caller threshold;
   * initial inequalities must also be practically active at that threshold. This
   * is an explicit finite-arithmetic premise, not an exact feasible-point
   * theorem. Wrong-sign working multipliers leave the basis; every original row
   * can block a primal step and supply its exact endpoint owner. Structural zero
   * equalities compress exactly; other unresolved dependence refuses without row
   * deletion. QR solves the unchanged PSD objective on the working null space.
   * Flat descent needs a finite original-row blocker; rank uncertainty preserves
   * native state. Each attempted working solve shares the same finite budget as
   * dual sweeps. Gill and Wong (2014), sections 2-3, describe independent working
   * bases, sign-aware changes and blocking constraints:
   * https://www.ccom.ucsd.edu/~peg/papers/genqp.pdf No shifted/penalized
   * feasibility phase, extra native solve or convergence guarantee is supplied
   * here. A trial is adopted only after original full KKT. Before a flat step, a
   * separate working-normal dual estimate is paired with its own affine origin
   * and measured by that same original full-row owner. Nonzero projected scalars
   * introduce no new stopping epsilon. A failed normal candidate neither replaces
   * the live flat state nor supplies optimum sign departures; finite objective
   * and native status remain with the final refiner.
   *
   * @param groups Refiner-owned exact coefficient groups with original endpoint
   *   owners and complete original ordinals; inputs have passed its intersection
   *   check.
   * @param readMerit Original full-row KKT maximum, owned by the refinement
   *   caller.
   * @param readGradient Original stationarity measurement, owned by that caller.
   * @param readComplementarity Original signed/null/equality predicate, owned by
   *   that caller.
   * @param fixedPrimalEligible Original native feasibility and complementarity
   *   already pass.
   * @throws {Error} When `options.maximumRefinements` is not a nonnegative safe
   *   integer, the budget both correction loops count against.
   */
  export function polishQuadraticProgram(input: IAutoMovieSolveQuadraticProgram.IInput, native: IAutoMovieSolveQuadraticProgram.IResult, options: IAutoMovieQuadraticRefinementOptions, groups: readonly IAutoMovieQuadraticRefinementInterval[], readMerit: (primal: readonly number[], dual: readonly number[]) => number, readGradient: (
    primal: readonly number[],
    dual: readonly number[],
  ) => number[], readComplementarity: (
    row: number,
    value: number,
    multiplier: number,
  ) => number, fixedPrimalEligible: boolean): IAutoMovieQuadraticPolishingResult {
    return polishAutoMovieQuadraticProgramImplementation(input, native, options, groups, readMerit, readGradient, readComplementarity, fixedPrimalEligible);
  }

  /**
   * Real polynomial roots on the closed unit interval, from ascending
   * coefficients.
   */
  export function polynomialUnitRoots(input: readonly number[]): number[] {
    return polynomialUnitRootsImplementation(input);
  }

  /**
   * Return value mod period in [0, period), preserving ordinary
   * already-normalized values; negative zero becomes positive zero.
   *
   * Callers validate their finite positive period. Computing the remainder once
   * avoids the extra add/subtract of double modulo, which can perturb an in-range
   * serialized continuity phase.
   */
  export function positiveModulo(value: number, period: number): number {
    return positiveModuloImplementation(value, period);
  }

  /**
   * Unit quaternion of the rotation whose columns are the orthonormal vectors
   * `x`, `y`, `z` (local axes expressed in world). Shepperd's method: pick the
   * largest diagonal term so the square root never divides by a small number. The
   * result is normalized; the inputs are read only and must already be an
   * orthonormal right-handed frame, which this function does not check.
   */
  export function quaternionFromBasis(x: IAutoMovieVector3, y: IAutoMovieVector3, z: IAutoMovieVector3): IAutoMovieQuaternion {
    return quaternionFromAutoMovieBasisImplementation(x, y, z);
  }

  /**
   * Interior ratios where a component of Quaternion.slerp is stationary.
   *
   * Inputs are admitted finite, nearly unit quaternion keys. A negative endpoint
   * dot negates the second quaternion for the shorter arc. The near-parallel
   * branch shares the sampler's threshold and equality rule. Endpoints and
   * one-sided key boundaries remain the caller's checks; roots have floating
   * precision.
   */
  export function quaternionInterpolationCriticalRatios(a: IAutoMovieQuaternion, b: IAutoMovieQuaternion): number[] {
    return quaternionInterpolationCriticalRatiosImplementation(a, b);
  }

  /**
   * Compress original least-squares rows by streaming Givens rotations. The
   * returned upper design and transformed right side preserve the variable
   * dependent objective; the remaining orthogonal residual is a constant term. No
   * normal matrix, pivot-based rank claim or inverse is formed. The caller must
   * qualify the compressed original design independently before solving.
   */
  export function reduceQrDesign(rows: readonly (readonly number[])[], right: readonly number[], budget: IAutoMovieQrDesignBudget): IAutoMovieQrDesignReduction {
    return reduceAutoMovieQrDesignImplementation(rows, right, budget);
  }

  /**
   * Polish a Solved native diagonal convex QP in its original coordinates. Exact
   * coefficient copies retain intersected interval metadata; every original row
   * remains in final feasibility, stationarity and complementarity checks.
   * Independently feasible and complementary native values first retain their
   * primal while signed-dual coordinate corrections seek original stationarity.
   * Otherwise exact interval intersections supply compatible active endpoint
   * equations for corrections near the original native primal and signed dual.
   * Only identical coefficients share an equation; every original row and
   * endpoint remains in independent final admission.
   *
   * Only a finite candidate satisfying every original KKT condition at the
   * caller's unchanged tolerance replaces the preceding native primal and dual.
   * Failed or wrongly selected active sets retain the original candidate, native
   * status and actual polishing diagnostics. An AlmostSolved or infeasible native
   * result is never promoted. No extra native solve, slack expansion, objective
   * amplification or permanent ridge is introduced. One selected path owns the
   * caller's existing correction budget; no failed path adds a second budget.
   *
   * Stellato et al. (2020), section 4, describe active-set polishing and
   * correction against the unregularized KKT:
   * https://cse.lab.imtlucca.it/~bemporad/publications/papers/osqp-paper.pdf
   * Float64, finite numerical factors and the existing work budget do not imply
   * uniform accuracy or convergence. Original KKT admission remains independent
   * of downstream geometric, anatomical, Float32 and rendered acceptance.
   */
  export function refineQuadraticProgram(input: IAutoMovieSolveQuadraticProgram.IInput, initial: IAutoMovieSolveQuadraticProgram.IResult, options: IAutoMovieQuadraticRefinementOptions): IAutoMovieQuadraticRefinementResult {
    return refineAutoMovieQuadraticProgramImplementation(input, initial, options);
  }

  /**
   * Resolve actual source-point aliases and current-position legacy vertices.
   * Source pairs are interned in first render occurrence order, independently of
   * ID magnitude or table order. Legacy labels use the existing nanometre grid
   * and never share an identity with an explicit source point. Each source alias
   * must agree on that same grid in the mesh's local metre frame.
   *
   * Omitted correspondence delegates exactly to position welding. Explicit
   * correspondence needs dense aligned arrays, finite XYZ, nonblank domains, safe
   * nonnegative IDs and resident source references. Malformed metadata or
   * separated aliases throw a named physicalVertices refusal; no fallback hides
   * the declaration. Unused and repeated valid source rows are harmless. Returned
   * arrays are owned. Geometry, indices, areas and intersections remain their
   * independent owners' obligations, not a promise of this equivalence.
   */
  export function resolveMeshPhysicalVertices(mesh: Pick<IAutoMovieMesh, "positions" | "physicalVertices">): IAutoMovieResolvedPhysicalVertices {
    return resolveAutoMovieMeshPhysicalVerticesImplementation(mesh);
  }

  /**
   * Finite WORLD rigid-frame velocities over a positive interval: translation
   * secant in metres/second and shortest-arc rotation secant in radians/second.
   * Both frames must describe the same rigid identity in WORLD coordinates. The
   * caller owns deterministic actual sampling and selects one continuous branch;
   * these two frames cannot reveal intervening turns, constraints or impacts.
   * This is not an instantaneous derivative or a momentum estimate.
   *
   * Rotation admission uses the engine's existing 1e-6 unit-norm rule. Admitted
   * rotations are normalized into private copies for the logarithm. A computed
   * relative quaternion with exactly zero scalar component refuses because its
   * half-turn has two equally short axes. Nonpositive/nonfinite time, invalid
   * components or unrepresentable arithmetic throw RangeError without changing
   * either input. Scale is outside this rigid frame observation; a deforming
   * point needs its own actual point samples.
   */
  export function rigidTransformVelocity(previous: Readonly<Pick<IAutoMovieTransform, "translation" | "rotation">>, current: Readonly<Pick<IAutoMovieTransform, "translation" | "rotation">>, elapsedSeconds: number): IAutoMovieRigidTransformVelocity.IResult {
    return rigidTransformVelocityImplementation(previous, current, elapsedSeconds);
  }

  /**
   * Quote a measurement at three decimal places, such as millimetres of distance
   * or milliseconds of time, using binary64 scaling and Math.round.
   *
   * The result is for prose, with the rounding of the scaled binary64 value
   * rather than exact decimal arithmetic. Very large magnitudes may print in
   * scientific notation.
   *
   * @param value Measurement to quote.
   * @returns Math.round(value * 1000) / 1000 when the scaled value is
   *   representable; otherwise a finite input is already coarser than the
   *   requested decimal precision and is returned unchanged.
   */
  export function roundToThousandths(value: number): number {
    return roundToThousandthsImplementation(value);
  }

  /**
   * Return one deterministic half-open [0, 1) sample from ordered seed parts.
   *
   * Callers must include a stable domain constant when the same identities feed
   * independent decisions such as misfire, hit, scale, or palette.
   */
  export function seededValue(...values: number[]): number {
    return seededValueImplementation(...values);
  }

  /**
   * Find the lower index of an admitted interior sample. An exact key selects the
   * segment ending at that key. The caller handles the first and last keys.
   *
   * @param length Number of strictly increasing finite key times, at least two.
   * @param timeAt Read a key time by index.
   * @param time The strictly interior sample time on the same clock.
   * @returns The lower index of the straddling segment.
   */
  export function segmentIndex(length: number, timeAt: (index: number) => number, time: number): number {
    return segmentIndexImplementation(length, timeAt, time);
  }

  /**
   * Minimum separation of bounded segments in one metre coordinate frame. The
   * closest-pair owner supplies both this scalar and the contact-normal
   * witnesses. Its collapsed-segment, finite-arithmetic and binary64 precision
   * contract applies here too. Inputs are unchanged.
   */
  export function segmentSegmentDistance(a: IAutoMovieVector3, b: IAutoMovieVector3, c: IAutoMovieVector3, d: IAutoMovieVector3): number {
    return segmentSegmentDistanceImplementation(a, b, c, d);
  }

  /**
   * Minimize 1/2 sum(mass[i] * travel[i]^2) with 0 <= travel <= upper and every
   * supplied row. Masses are strictly positive. Each row has a grouping identity
   * used to add its group's worst unsatisfied condition per round. Row order
   * breaks equal-error ties deterministically. The all-zero start is the exact
   * unconstrained minimum, so an already-clear problem needs no native solve.
   *
   * Inputs must be scaled by the caller into suitable numerical units. Tolerance
   * is a positive absolute row-value error in those units, not anatomical slack.
   * Maximum rounds is a positive integer work budget. An unsatisfied restricted
   * problem with no participating variable refuses before numerical iteration.
   * Native failure, an exhausted budget or a residual that fails on already
   * selected rows throws with native status, residual and round count. This owner
   * admits displacement before any geometry consumer can apply it; no relaxed
   * bound or objective is substituted.
   */
  export function solveBoundedDisplacement(input: IAutoMovieSolveBoundedDisplacement.IInput): IAutoMovieSolveBoundedDisplacement.IResult {
    return solveAutoMovieBoundedDisplacementImplementation(input);
  }

  /**
   * The point of a disc nearest a preferred point that satisfies a set of
   * half-planes in the plane, or, when no point satisfies them all, the point of
   * the disc that violates the worst of them least: the two- and
   * three-dimensional linear programs of optimal reciprocal collision avoidance
   * (van den Berg, Guy, Lin and Manocha 2011, Reciprocal n-body collision
   * avoidance, Robotics Research, Springer Tracts in Advanced Robotics 70,
   * sections 5.2 and 5.3).
   *
   * A half-plane is a directed line, a point and a unit direction; a point `v`
   * lies inside it when `det(direction, point - v) <= 0`, on the direction's
   * left. The program is solved incrementally, the half-planes added in their
   * given order (Seidel's randomised incremental algorithm in its deterministic
   * order, which keeps the result reproducible): while the current optimum
   * satisfies the next half-plane it stays; otherwise the new optimum lies on
   * that half-plane's line and is found by a one-dimensional program along it
   * against the earlier half-planes and the disc. When that fails, the
   * three-dimensional program takes the point of the disc whose greatest signed
   * distance into the violated half-planes is least, by the same incremental
   * method on the projected half-planes of the planes that bound it.
   *
   * The first `hard` half-planes stay hard in that fallback: the paper's obstacle
   * half-planes, which the projected programs carry unchanged while only the
   * later ones are relaxed. When the hard half-planes leave no point of the disc
   * between them, every half-plane is relaxed alike.
   *
   * @param lines The half-planes, in order.
   * @param radius The disc's radius about the origin, positive.
   * @param preferred The preferred point.
   * @param hard How many leading half-planes the fallback keeps, from 0 (the
   *   default) to their count.
   * @returns The point found, and whether every half-plane holds at it.
   * @throws {Error} When the radius is not positive and finite, `hard` is not a
   *   whole count within the half-planes, a direction is not a unit vector, or a
   *   value is not finite: a caller's defect.
   */
  export function solveHalfPlaneProgram(lines: readonly IAutoMovieSolveHalfPlaneProgram.ILine[], radius: number, preferred: IAutoMovieSolveHalfPlaneProgram.IPoint, hard?: number): IAutoMovieSolveHalfPlaneProgram.IResult {
    return solveAutoMovieHalfPlaneProgramImplementation(lines, radius, preferred, hard);
  }

  /**
   * Engine-owned homogeneous predictor-corrector for diagonal convex QPs with
   * equality/nonnegative cones, following Goulart and Chen (2024), sections 2-3.
   * Every solve is cold. It has no clock, random source, runtime module, process
   * or external numerical service. The supplied workspace holds its iterate and
   * results copy out before the synchronous borrow ends.
   *
   * Full termination retains 1e-9 primal/dual feasibility and
   * absolute-or-relative gap. Certificate, reduced-accuracy, iteration and
   * progress criteria retain Clarabel 0.11.1 meanings; reduced accuracy is status
   * 4, never status 1. Finite arithmetic can refuse ill-conditioned inputs.
   * Caller-specific physical acceptance and subsequent transformations remain
   * independent obligations.
   */
  export function solveQuadraticInterior(data: IAutoMovieQuadraticConicProgram, workspace: Float64Array, originalCount: number): IAutoMovieSolveQuadraticKernel.IResult {
    return solveAutoMovieQuadraticInteriorImplementation(data, workspace, originalCount);
  }

  /**
   * Solve one admitted interval CSC problem entirely in engine-owned TypeScript.
   * The public adapter owns semantic admission and original-row residual checks.
   * This boundary owns equivalent conic expansion, reversible equilibration and
   * the cold homogeneous interior-point solve. The compatibility initial vector
   * remains ignored, with no retained factors or preceding-call warm state.
   *
   * Status 1 is Solved, 2/3 are primal/dual infeasibility, 4 is AlmostSolved; 5/6
   * are reduced-accuracy infeasibility, 7 is the iteration limit, 9 is numerical
   * refusal and 10 is insufficient progress. Only status 1 means full
   * convergence. Zero variables return negative API status with unavailable
   * diagnostics as NaN. Unsuccessful vectors must not be accepted as geometry.
   * Historical native transport and bytes remain in repository history, outside
   * shipped product paths.
   */
  export function solveQuadraticKernel(input: IAutoMovieSolveQuadraticKernel.IInput): IAutoMovieSolveQuadraticKernel.IResult {
    return solveAutoMovieQuadraticKernelImplementation(input);
  }

  /**
   * Solve a nonempty positive-semidefinite diagonal quadratic program. Finite
   * coefficients and endpoints must have magnitude below 1e30, the numerical
   * infinity sentinel; larger finite values cannot be represented as such by this
   * backend. Diagonal entries are nonnegative, not necessarily positive. Sparse
   * arrays, duplicate indices and reversed bounds are refused.
   *
   * Status 1 is the full solved status. Other statuses and all residuals are
   * retained, including infeasibility and incomplete iteration. A caller must
   * choose an acceptance tolerance in its own units and check the original
   * geometry after subsequent transformations. This function does not turn a
   * solver status or objective decrease into a geometric validity certificate.
   */
  export function solveQuadraticProgram(input: IAutoMovieSolveQuadraticProgram.IInput): IAutoMovieSolveQuadraticProgram.IResult {
    return solveAutoMovieQuadraticProgramImplementation(input);
  }

  /**
   * Compute an affine or combined homogeneous Newton direction using one already
   * factored sparse KKT and its constant RHS solution K^-1[-q;b]. The scalar
   * Schur complement retains x'Px/tau, so PSD/zero curvature needs no epigraph or
   * added objective ridge. Orthant centrality is s*z and H=s/z; zero-cone rows
   * have H=0 and a zero slack direction.
   *
   * Goulart and Chen (2024), sections 3.2-3.3, derive this condensed solve. The
   * combined RHS includes Mehrotra's affine product correction and uses the
   * first-iteration damping of the preceding Clarabel configuration. Twofold sums
   * retain cancellation in the scalar Schur equation and direction
   * reconstruction. Expanding P*(xi-ci)^2-P*ci^2 removes cancelling ci squares.
   */
  export function solveQuadraticStep(data: IAutoMovieQuadraticConicProgram, state: IAutoMovieQuadraticState, reading: IAutoMovieMeasureQuadraticState.IResult, factor: IAutoMovieCreateQuadraticFactor.IResult, constant: Float64Array, sigma: number, mu: number, damping: number, affine?: IAutoMovieQuadraticState): IAutoMovieQuadraticState | undefined {
    return solveAutoMovieQuadraticStepImplementation(data, state, reading, factor, constant, sigma, mu, damping, affine);
  }

  /**
   * Minimize the unchanged diagonal PSD objective on an independent working
   * space. Householder QR of sqrt(H)_Z avoids a Schur normal-equation factor.
   * Exact flat columns retain their coordinate when their linear term is zero;
   * otherwise a zero-curvature descent direction requires the caller's
   * complete-row blocker. Other numerical rank ambiguity refuses without removing
   * a constraint or adding objective curvature. The caller retains its feasible
   * native state and alone checks the original full KKT. Gill and Wong (2014),
   * sections 2-3: https://www.ccom.ucsd.edu/~peg/papers/genqp.pdf The finite
   * arithmetic and rank test establish no convergence guarantee. A normal
   * projection at the affine origin is a separate least-residual dual candidate,
   * even when a flat direction prevents a working-space minimum. It is not a
   * second-order-consistent LP basis or a subspace-optimum certificate.
   * Column-pivoted QR's A_P=Q*R convention is documented by LAPACK DGEQP3:
   * https://www.netlib.org/lapack/double/dgeqp3.f An unavailable normal
   * projection leaves a valid flat continuation available. Inputs are borrowed
   * after the refinement owner's complete QP validation; owned dense coordinates
   * have finite-memory limits, not full-row scalability.
   */
  export function solveQuadraticWorkingSetStep(diagonal: readonly number[], linear: readonly number[], rows: readonly IAutoMovieQuadraticRow[], bounds: readonly number[], free: readonly boolean[], preceding: readonly number[]): IAutoMovieQuadraticWorkingSetStep {
    return solveAutoMovieQuadraticWorkingSetStepImplementation(diagonal, linear, rows, bounds, free, preceding);
  }

  /**
   * Decode one sRGB `#RRGGBB` swatch into the linear color materials are typed
   * in.
   *
   * A hex swatch is display-encoded: its digits are what a monitor is asked to
   * emit, not the energy a shader integrates. Dividing them by 255 and calling
   * the result linear is a transcription, not a conversion, and it lands roughly
   * 2.3x too bright at midtones: `#808080` reads as linear `0.502` when the
   * swatch means linear `0.216`. That transcription is exactly how one production
   * ended up covering a single roof in two colors, because instanced slots decode
   * their palette while a material carrying the same digits did not.
   *
   * The returned `hex` is re-encoded from the decoded triple rather than copied
   * from the argument, so the label a caller stores can never disagree with the
   * numbers beside it. The round trip is exact for all 256 channel values, and a
   * mixed-case argument comes back normalized.
   *
   * Alpha is `1`: a six-digit swatch is opaque by definition, and a slot where
   * opacity is irrelevant states that by overwriting `a` with `null`.
   */
  export function srgbHexToLinearColor(hex: string): IAutoMovieColor {
    return srgbHexToLinearColorImplementation(hex);
  }

  /**
   * Intern finite XYZ tuples in first-occurrence order using nanometre
   * topology-grid identity. Invalid tuple cardinality, holes and nonfinite
   * coordinates throw. Safe rounded grid indexes keep their integer labels and
   * signed-zero convention. Larger coordinates use an axis-local exact-coordinate
   * label: adjacent binary64 values there are farther apart than one grid cell,
   * so distinct coordinates cannot weld.
   */
  export function weldMeshVertices(positions: readonly number[]): IAutoMovieWeldMeshVertices.IResult {
    return weldMeshVerticesImplementation(positions);
  }

  /**
   * An angle in degrees wrapped to the half-open interval [-180, 180): the signed
   * shortest turn equivalent to it, so the difference of two headings passed
   * through it is the shortest arc between them.
   *
   * @param degrees A finite angle, degrees.
   * @returns The equivalent angle in [-180, 180).
   */
  export function wrapDegrees(degrees: number): number {
    return wrapDegreesImplementation(degrees);
  }
}
