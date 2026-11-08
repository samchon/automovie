import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import { RecoveryChartFitPrepare } from "./RecoveryChartFitPrepare";
import { RecoveryChartFitReport } from "./RecoveryChartFitReport";
import { RecoveryChartFitRows as O } from "./RecoveryChartFitRows";
import { RecoveryChartFitSolve } from "./RecoveryChartFitSolve";
import { RecoveryChartFitSystem } from "./RecoveryChartFitSystem";
import { RecoveryChartReachableBox as W } from "./RecoveryChartReachableBox";

/**
 * Joint Bernstein fitting with fixed shared coefficients and explicit box constraints.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Records physical units, numerical termination and the distinction between observation residual and surface fidelity.
 * @evidence contracts/development/design.md#principled-representation Represents Joint Bernstein fitting with fixed shared coefficients and explicit box constraints: companion namespace of 3 members (`Input`, `Result`, `fit`); units and frames named in its text: local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `RecoveryChartFit` in packages/recovery/src/internal/RecoveryChartFit.ts; its surface is the 3 members listed and the text shows 8 other files naming it, mostly packages/recovery (8), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace RecoveryChartFit {
  /**
   * One private chart coefficient problem; callers separate diagnostic observations from public geometry.
   *
   * @evidence contracts/development/design.md#principled-representation Explicit chart parameters, physical observations and a shared coefficient registry define linear Bernstein fitting with box constraints.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Null entries without affine owners are independent unknowns; repeated IDs and declared acyclic relations express positional sharing between patches.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The caller must supply the enclosure and parameter correspondence; the fitter infers neither topology nor material transport.
   * @evidence contracts/development/common.md#meaningful-documentation States coefficient ordering, fixed authority, physical units and explicit work limits.
   */
  export interface Input {
    /** Millimetre controls; non-null values remain bitwise unchanged. */
    controls: readonly (C.Vector | null)[];

    /** Optional feasible original-millimetre coefficients used only to initialize independent unknowns. */
    initialControlsMm?: readonly C.Vector[];

    /** Acyclic affine identities in original control IDs; fixed entries cannot be dependent. */
    relations?: readonly {
      id: number;
      terms: readonly { id: number; weight: number }[];
    }[];

    /** Explicit sparse substitution budgets when affine identities are supplied. */
    relationBudget?: {
      maxTerms: number;
      maxDepth: number;
      maxRowTerms?: number;
    };

    /** Sixteen registry IDs per patch, u varying fastest within each v row. */
    patches: readonly {
      controlIds: readonly number[];
      id?: string;
      parameterBounds?: readonly [number, number, number, number];
    }[];

    /** Normalized local u/v and positive physical-area or declared observation weights. */
    observations: readonly {
      patch: number;
      u: number;
      v: number;
      pointMm: C.Vector;
      weight: number;
      physicalJet?: Parameters<typeof O>[0]["physicalJet"];
    }[];

    /** Additional original correspondences checked after solving, without changing the area objective. */
    validation?: readonly {
      patch: number;
      u: number;
      v: number;
      pointMm: C.Vector;
    }[];

    /** Explicit componentwise feasible control enclosure in millimetres, including fixed controls. */
    enclosureMm: { lower: C.Vector; upper: C.Vector };

    /** Requested observation residual in millimetres; not a continuous source-distance bound. */
    toleranceMm: number;

    /** Positive normalized projected-gradient termination tolerance. */
    gradientTolerance: number;

    /** Positive maximum gradient iterations; exhaustion remains unqualified. */
    maxIterations: number;
  }

  /**
   * Finite fitted coefficients with independent convergence and observation accounting.
   *
   * @evidence contracts/development/design.md#principled-representation The result retains the constrained coefficients and evaluates every original weighted observation after solving.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Numerical convergence, residual acceptance and unresolved identifiability are separate fields.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Neither a solved gradient nor a small sample residual is labelled an injectivity or continuous-surface certificate.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes finite display data from convergence, source coverage and actual surface quality.
   */
  export interface Result {
    /** Millimetre registry in input order, preserving all fixed entries exactly. */
    controls: C.Vector[];

    /** True only when numerical full observation rank, gradient termination and supplied residual pass. */
    qualified: boolean;

    /** Actual projected-gradient iterations. */
    iterations: number;

    /** Infinity norm of the normalized projected-gradient mapping. */
    projectedGradient: number;

    /** Weighted RMS of all supplied point correspondences, millimetres. */
    rmsMm: number;

    /** Millimetre exchange-length-scaled physical-gradient RMS, separate from position RMS. */
    physicalJetRmsMm: number;

    /** Position-plus-physical-gradient objective RMS in the declared millimetre exchange scale. */
    objectiveRmsMm: number;

    /** Actual transient signed derivative rows assembled without expanding the observation table. */
    physicalJetRows: number;

    /** Original and diagonally transformed spectral estimates and actual restart count, not condition numbers. */
    solve: {
      originalLipschitz: number;
      scaledLipschitz: number;
      minimumPositiveDiagonal: number | null;
      maximumDiagonal: number;
      restarts: number;
    };

    /** Largest supplied point-correspondence residual, millimetres. */
    maximumMm: number;

    /** Unknown coefficient count after fixed shared controls are eliminated. */
    unknownControls: number;

    /** Numerical Gram rank, or null when the explicit dense diagnostic limit is exceeded. */
    observationRank: number | null;

    /** Relative Gram pivot threshold; this is not an exact rank certificate. */
    rankTolerance: number;

    /** Smallest accepted over largest Cholesky pivot; not a singular-value condition number. */
    gramPivotRatio: number | null;

    /** Column-scaled, twice-reorthogonalized data-row rank, or null at the work limit. */
    dataRowRank: number | null;

    /** Accepted data QR diagonal ratio; neither this nor a Gram pivot is a condition number. */
    dataQrDiagonalRatio: number | null;

    /** Per-patch maximum over fit and additional validation correspondences, millimetres. */
    patchMaximumMm: number[];

    /** Per-patch maximum restricted to rows with unknown coefficient support. */
    patchFreeSupportMaximumMm: number[];

    /** Actual local UV of each patch maximum, used by the declared residual refinement wave. */
    patchMaximumLocations: ([number, number] | null)[];

    /** Controls with no positive observation basis support, independent of rank work limits. */
    unsupportedControls: number;

    /** Maximum over rows supported entirely by fixed coefficients, millimetres. */
    fixedSupportMaximumMm: number;

    /** Maximum over rows with positive unknown coefficient support, millimetres. */
    freeSupportMaximumMm: number;

    /** Generated patch and local parameters of the largest checked correspondence. */
    maximumLocation: {
      patch: number;
      u: number;
      v: number;
      fixedSupport: boolean;
    } | null;

    /** One private worst correspondence and its original affine feasible range; never consumer geometry. */
    maximumWitness: {
      patch: number;
      patchId: string | null;
      localUV: [number, number];
      globalUV: [number, number] | null;
      leafBounds: readonly [number, number, number, number] | null;
      targetMm: C.Vector;
      fittedPointMm: C.Vector;
      controlIds: number[];
      controlsMm: C.Vector[];
      coefficients: number[];
      coefficientExpressions: {
        constant: C.Vector;
        terms: { id: number; weight: number }[];
      }[];
      sampledRows: {
        u: number;
        v: number;
        targetMm: C.Vector;
        physicalJet: Input["observations"][number]["physicalJet"] | null;
      }[];
      constantMm: C.Vector;
      terms: { id: number; weight: number; valueMm: C.Vector }[];
      lowerMm: C.Vector;
      upperMm: C.Vector;
      reachable: ReturnType<typeof W>;
      originalSourceFace: null;
    } | null;

    /** Binary64 tangent-plane box gap for the assembled normalized objective; not a rigorous error-bounded certificate. */
    optimality: {
      objective: number;
      leastSquaresConstant: number;
      boxSupportGap: number;
      gradientInfinity: number;
      physicalObjectiveGapUpperMm2: number;
      normalizationScaleMm: number;
      normalizationOriginMm: C.Vector;
    };

    /** Unknown vector controls touching at least one declared enclosure coordinate. */
    activeEnclosureControls: number;

    /** Largest dependent-control excursion outside the original millimetre enclosure. */
    dependentEnclosureViolationMm: number;

    /** Affine substitution accounting; this does not certify convex weights. */
    relationDiagnostics: {
      maximumTerms: number;
      maximumDepth: number;
      minimumWeight: number;
      maximumWeightSumError: number;
    };

    /** Largest assembled reduced observation stencil; the explicit row-work cap includes exact-zero terms. */
    maximumRowTerms: number;

    /** Actual stored sparse Hessian entries, including symmetric partners. */
    hessianNonzeros: number;

    /** Unobserved controls and incomplete convergence remain explicit; rank is not certified. */
    diagnostics: string[];
  }

  /**
   * Solve one constrained chart with assembled shared-control normal equations.
   * A positive diagonal congruence scales the original symmetric Gram problem and
   * its feasible box. The original projected-gradient mapping, not a transformed
   * residual, determines numerical termination. Each accelerated step
   * projects unknown coefficients onto the declared box; objective increase
   * restarts momentum. No geometry is sampled or tessellated here.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Position and physical-gradient rows share exact affine coefficient identities; diagonal congruence preserves the declared least-squares objective and box, while termination evaluates the original projected-gradient mapping. Pivoted Cholesky reports numerical observation rank independently of residual and convergence; the enclosure does not create observational information.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Sparse normal-equation assembly removes observation-count work from each iteration; final residuals still evaluate the original correspondences.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No regularizer, enclosure relaxation, coefficient clipping after solving, hidden smoothing or source mesh fallback changes the declared problem.
   * @evidence contracts/development/common.md#meaningful-documentation Numerical Gram rank uses a declared machine-scale pivot tolerance, not exact rank or a singular-value certificate; embedding and continuous source distance remain unproved.
   * @evidence contracts/development/implementation.md#efficient-algorithms For N observations and reduced stencil width W, assembly costs O(N*W squared), with W at most 16 for identity-only controls or the explicit affine row cap (128 by default). I iterations cost O(I(H+M)); storage is O(H+M) plus bounded substitution expressions. Rank diagnostics use O(M squared) memory only up to 512 unknown controls and direct QR has a separate 50000000 scalar-projection budget; unavailable diagnostics retain an unqualified finite candidate.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Fixed contributions, normalized weights, sparse Hessian, right-hand sides and row-sum spectral bound are assembled once and reused by every gradient iteration.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Observation arrays remain caller-owned; sparse normal equations and the bounded dense rank workspace expire on return, while coefficients, scalar diagnostics and one bounded private witness return to the caller. The public observer removes that witness into a separate private sidecar.
   */
  export function fit(input: Input): Result {
    const prepared: ReturnType<typeof RecoveryChartFitPrepare> =
      RecoveryChartFitPrepare(input);
    const system: ReturnType<typeof RecoveryChartFitSystem> =
      RecoveryChartFitSystem(input, prepared);
    const solution: ReturnType<typeof RecoveryChartFitSolve> =
      RecoveryChartFitSolve(input, prepared, system);
    return RecoveryChartFitReport(input, prepared, system, solution);
  }
}
