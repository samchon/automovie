import type {
  AutoMovieVector3Tuple,
  IAutoMovieAffineBoxBound,
  IAutoMovieRecoveryChartFitRows,
} from "..";

/**
 * One constrained bicubic Bernstein fit over a shared millimetre control
 * registry. Fixed coefficients remain unchanged, affine relations identify
 * dependent controls, and explicit enclosure bounds constrain independent
 * controls. RecoveryChartFit admits the numeric problem; rank, convergence and
 * sampled residuals are separate result qualifications and do not certify an
 * embedded or source-faithful surface.
 */

export namespace IAutoMovieRecoveryChartFit {
  /**
   * One private chart coefficient problem; callers separate diagnostic
   * observations from public geometry.
   */
  export interface Input {
    /** Millimetre controls; non-null values remain bitwise unchanged. */
    controls: readonly (Readonly<AutoMovieVector3Tuple> | null)[];

    /**
     * Optional feasible original-millimetre coefficients used only to
     * initialize independent unknowns.
     */
    initialControlsMm?: readonly Readonly<AutoMovieVector3Tuple>[];

    /**
     * Acyclic affine identities in original control IDs; fixed entries cannot
     * be dependent.
     */
    relations?: readonly {
      /**
       * Zero-based ordinal in this record's owning cell, component or control
       * registry; it is not a source coordinate.
       */
      id: number;

      /**
       * Sparse affine contributions in original control IDs; duplicate IDs and
       * signed weights retain the owning operation's declared combination
       * rule.
       */
      terms: readonly {
        /**
         * Zero-based ordinal in this record's owning cell, component or control
         * registry; it is not a source coordinate.
         */
        id: number;
        /**
         * Declared scalar row or affine coefficient weight; its sign and
         * normalization follow the enclosing fit or substitution contract.
         */
        weight: number;
      }[];
    }[];

    /** Explicit sparse substitution budgets when affine identities are supplied. */
    relationBudget?: {
      /**
       * Positive integer ceiling on supplied or expanded sparse affine terms,
       * as admitted by the owning operation.
       */
      maxTerms: number;

      /** Positive integer ceiling on acyclic affine dependency expansion depth. */
      maxDepth: number;

      /**
       * Optional cap on an expanded observation stencil; omission uses the
       * fitter's documented default.
       */
      maxRowTerms?: number;
    };

    /** Sixteen registry IDs per patch, u varying fastest within each v row. */
    patches: readonly {
      /**
       * Indices into the shared control registry; bicubic nets use sixteen IDs
       * with u varying fastest.
       */
      controlIds: readonly number[];

      /**
       * Stable identity within the owning chart, boundary or occurrence
       * registry; equal coordinates do not create identity.
       */
      id?: string;

      /**
       * Optional global chart rectangle [u0,v0,u1,v1]; omission leaves only
       * local patch coordinates.
       */
      parameterBounds?: readonly [number, number, number, number];
    }[];

    /**
     * Normalized local u/v and positive physical-area or declared observation
     * weights.
     */
    observations: readonly {
      /**
       * Patch identity or zero-based patch ordinal, according to this record,
       * addressing the supplied coefficient-patch registry.
       */
      patch: number;

      /**
       * Normalized u coordinate in the declared local patch or unit source
       * chart.
       */
      u: number;

      /**
       * Normalized v coordinate in the declared local patch or unit source
       * chart.
       */
      v: number;

      /**
       * Physical position in the registered millimetre frame; no coordinate
       * matching or source repair is implied.
       */
      pointMm: Readonly<AutoMovieVector3Tuple>;

      /**
       * Declared scalar row or affine coefficient weight; its sign and
       * normalization follow the enclosing fit or substitution contract.
       */
      weight: number;

      /**
       * Optional physical directional-derivative observation; absence
       * contributes only the position row.
       */
      physicalJet?: Parameters<IAutoMovieRecoveryChartFitRows.Operation>[0]["physicalJet"];
    }[];

    /**
     * Additional original correspondences checked after solving, without
     * changing the area objective.
     */
    validation?: readonly {
      /**
       * Patch identity or zero-based patch ordinal, according to this record,
       * addressing the supplied coefficient-patch registry.
       */
      patch: number;

      /**
       * Normalized u coordinate in the declared local patch or unit source
       * chart.
       */
      u: number;

      /**
       * Normalized v coordinate in the declared local patch or unit source
       * chart.
       */
      v: number;

      /**
       * Physical position in the registered millimetre frame; no coordinate
       * matching or source repair is implied.
       */
      pointMm: Readonly<AutoMovieVector3Tuple>;
    }[];

    /**
     * Explicit componentwise feasible control enclosure in millimetres,
     * including fixed controls.
     */
    enclosureMm: {
      /** Lower componentwise physical control bound in millimetres. */
      lower: Readonly<AutoMovieVector3Tuple>;
      /** Upper componentwise physical control bound in millimetres. */
      upper: Readonly<AutoMovieVector3Tuple>;
    };

    /**
     * Requested observation residual in millimetres; not a continuous
     * source-distance bound.
     */
    toleranceMm: number;

    /** Positive normalized projected-gradient termination tolerance. */
    gradientTolerance: number;

    /** Positive maximum gradient iterations; exhaustion remains unqualified. */
    maxIterations: number;
  }

  /**
   * Finite fitted coefficients with independent convergence and observation
   * accounting.
   */
  export interface Result {
    /** Millimetre registry in input order, preserving all fixed entries exactly. */
    controls: Readonly<AutoMovieVector3Tuple>[];

    /**
     * True only when numerical full observation rank, gradient termination and
     * supplied residual pass.
     */
    qualified: boolean;

    /** Actual projected-gradient iterations. */
    iterations: number;

    /** Infinity norm of the normalized projected-gradient mapping. */
    projectedGradient: number;

    /** Weighted RMS of all supplied point correspondences, millimetres. */
    rmsMm: number;

    /**
     * Millimetre exchange-length-scaled physical-gradient RMS, separate from
     * position RMS.
     */
    physicalJetRmsMm: number;

    /**
     * Position-plus-physical-gradient objective RMS in the declared millimetre
     * exchange scale.
     */
    objectiveRmsMm: number;

    /**
     * Actual transient signed derivative rows assembled without expanding the
     * observation table.
     */
    physicalJetRows: number;

    /**
     * Original and diagonally transformed spectral estimates and actual restart
     * count, not condition numbers.
     */
    solve: {
      /**
       * Row-sum spectral upper estimate for the original Hessian, not a
       * condition number.
       */
      originalLipschitz: number;

      /**
       * Row-sum spectral upper estimate after diagonal congruence, not a
       * condition number.
       */
      scaledLipschitz: number;

      /**
       * Smallest positive Hessian diagonal; null means no positive entry was
       * observed.
       */
      minimumPositiveDiagonal: number | null;

      /** Largest Hessian diagonal used in scaling and diagnostics. */
      maximumDiagonal: number;

      /** Actual acceleration-momentum resets after objective increase. */
      restarts: number;
    };

    /** Largest supplied point-correspondence residual, millimetres. */
    maximumMm: number;

    /** Unknown coefficient count after fixed shared controls are eliminated. */
    unknownControls: number;

    /**
     * Numerical Gram rank, or null when the explicit dense diagnostic limit is
     * exceeded.
     */
    observationRank: number | null;

    /** Relative Gram pivot threshold; this is not an exact rank certificate. */
    rankTolerance: number;

    /**
     * Smallest accepted over largest Cholesky pivot; not a singular-value
     * condition number.
     */
    gramPivotRatio: number | null;

    /**
     * Column-scaled, twice-reorthogonalized data-row rank, or null at the work
     * limit.
     */
    dataRowRank: number | null;

    /**
     * Accepted data QR diagonal ratio; neither this nor a Gram pivot is a
     * condition number.
     */
    dataQrDiagonalRatio: number | null;

    /**
     * Per-patch maximum over fit and additional validation correspondences,
     * millimetres.
     */
    patchMaximumMm: number[];

    /** Per-patch maximum restricted to rows with unknown coefficient support. */
    patchFreeSupportMaximumMm: number[];

    /**
     * Actual local UV of each patch maximum, used by the declared residual
     * refinement wave.
     */
    patchMaximumLocations: ([number, number] | null)[];

    /**
     * Controls with no positive observation basis support, independent of rank
     * work limits.
     */
    unsupportedControls: number;

    /** Maximum over rows supported entirely by fixed coefficients, millimetres. */
    fixedSupportMaximumMm: number;

    /** Maximum over rows with positive unknown coefficient support, millimetres. */
    freeSupportMaximumMm: number;

    /**
     * Generated patch and local parameters of the largest checked
     * correspondence.
     */
    maximumLocation: {
      /**
       * Patch identity or zero-based patch ordinal, according to this record,
       * addressing the supplied coefficient-patch registry.
       */
      patch: number;

      /**
       * Normalized u coordinate in the declared local patch or unit source
       * chart.
       */
      u: number;

      /**
       * Normalized v coordinate in the declared local patch or unit source
       * chart.
       */
      v: number;

      /**
       * True when every coefficient contributing to this correspondence is
       * fixed by external authority.
       */
      fixedSupport: boolean;
    } | null;

    /**
     * One private worst correspondence and its original affine feasible range;
     * never consumer geometry.
     */
    maximumWitness: {
      /**
       * Patch identity or zero-based patch ordinal, according to this record,
       * addressing the supplied coefficient-patch registry.
       */
      patch: number;

      /**
       * Declared patch identity, or null when the caller supplied only
       * positional patch indices.
       */
      patchId: string | null;

      /**
       * Normalized local patch coordinates [u,v] of the retained
       * correspondence.
       */
      localUV: [number, number];

      /**
       * Global normalized chart coordinates, or null when the patch has no
       * declared global bounds.
       */
      globalUV: [number, number] | null;

      /**
       * Global normalized bounds of the containing refinement leaf, or null
       * when no leaf layout is supplied.
       */
      leafBounds: readonly [number, number, number, number] | null;

      /**
       * Observed target in the operation's millimetre exchange scale;
       * derivative rows retain their physical directional meaning.
       */
      targetMm: Readonly<AutoMovieVector3Tuple>;

      /**
       * Evaluated fitted position at the retained correspondence, in registered
       * millimetres.
       */
      fittedPointMm: Readonly<AutoMovieVector3Tuple>;

      /**
       * Indices into the shared control registry; bicubic nets use sixteen IDs
       * with u varying fastest.
       */
      controlIds: number[];

      /**
       * Bernstein control positions in the common registered millimetre frame,
       * ordered by control registry ID.
       */
      controlsMm: Readonly<AutoMovieVector3Tuple>[];

      /**
       * Signed Bernstein row weights in original control order; derivative rows
       * are not position convex combinations.
       */
      coefficients: number[];

      /**
       * Fixed constants and independent-control terms expressing each retained
       * original control.
       */
      coefficientExpressions: {
        /**
         * Fixed affine control contribution in the same physical millimetre
         * chart as the dependent coefficient.
         */
        constant: Readonly<AutoMovieVector3Tuple>;

        /**
         * Sparse affine contributions in original control IDs; duplicate IDs
         * and signed weights retain the owning operation's declared combination
         * rule.
         */
        terms: {
          /**
           * Zero-based ordinal in this record's owning cell, component or
           * control registry; it is not a source coordinate.
           */
          id: number;
          /**
           * Declared scalar row or affine coefficient weight; its sign and
           * normalization follow the enclosing fit or substitution contract.
           */
          weight: number;
        }[];
      }[];

      /**
       * Original position/physical-gradient correspondences used to diagnose
       * this patch's retained worst witness.
       */
      sampledRows: {
        /**
         * Normalized u coordinate in the declared local patch or unit source
         * chart.
         */
        u: number;

        /**
         * Normalized v coordinate in the declared local patch or unit source
         * chart.
         */
        v: number;

        /**
         * Observed target in the operation's millimetre exchange scale;
         * derivative rows retain their physical directional meaning.
         */
        targetMm: Readonly<AutoMovieVector3Tuple>;

        /**
         * Optional physical directional-derivative observation; absence
         * contributes only the position row.
         */
        physicalJet:
          | IAutoMovieRecoveryChartFit.Input["observations"][number]["physicalJet"]
          | null;
      }[];

      /**
       * Fixed contribution to the affine coefficient row, in registered
       * millimetres.
       */
      constantMm: Readonly<AutoMovieVector3Tuple>;

      /**
       * Sparse affine contributions in original control IDs; duplicate IDs and
       * signed weights retain the owning operation's declared combination
       * rule.
       */
      terms: {
        /**
         * Zero-based ordinal in this record's owning cell, component or control
         * registry; it is not a source coordinate.
         */
        id: number;
        /**
         * Declared scalar row or affine coefficient weight; its sign and
         * normalization follow the enclosing fit or substitution contract.
         */
        weight: number;
        /** Current control value in registered millimetres for this affine term. */
        valueMm: Readonly<AutoMovieVector3Tuple>;
      }[];

      /**
       * Lower physical support or componentwise enclosure bound, in the
       * declared registered millimetre frame.
       */
      lowerMm: Readonly<AutoMovieVector3Tuple>;

      /**
       * Upper physical support or componentwise enclosure bound, in the
       * declared registered millimetre frame.
       */
      upperMm: Readonly<AutoMovieVector3Tuple>;

      /**
       * Single-row affine-box feasibility observation; it does not certify
       * joint fit or continuous source support.
       */
      reachable: ReturnType<IAutoMovieAffineBoxBound.Operation>;

      /**
       * Always null: this coefficient-fit witness does not claim original
       * source-face identity.
       */
      originalSourceFace: null;
    } | null;

    /**
     * Binary64 tangent-plane box gap for the assembled normalized objective;
     * not a rigorous error-bounded certificate.
     */
    optimality: {
      /**
       * Current normalized quadratic objective value under the declared row
       * weights.
       */
      objective: number;

      /** Constant term of the assembled normalized least-squares objective. */
      leastSquaresConstant: number;

      /**
       * Tangent-plane support gap over the feasible normalized box; a numerical
       * bound, not an outward-rounded certificate.
       */
      boxSupportGap: number;

      /** Infinity norm of the original normalized objective gradient. */
      gradientInfinity: number;

      /**
       * Reported objective-gap upper estimate restored to square-millimetre
       * scale.
       */
      physicalObjectiveGapUpperMm2: number;

      /**
       * Positive millimetre scale dividing physical position residuals in the
       * normalized solve.
       */
      normalizationScaleMm: number;

      /** Physical millimetre origin subtracted before the normalized solve. */
      normalizationOriginMm: Readonly<AutoMovieVector3Tuple>;
    };

    /**
     * Unknown vector controls touching at least one declared enclosure
     * coordinate.
     */
    activeEnclosureControls: number;

    /**
     * Largest dependent-control excursion outside the original millimetre
     * enclosure.
     */
    dependentEnclosureViolationMm: number;

    /** Affine substitution accounting; this does not certify convex weights. */
    relationDiagnostics: {
      /**
       * Largest retained affine substitution expression in original control
       * IDs.
       */
      maximumTerms: number;

      /** Deepest affine dependency expansion actually traversed. */
      maximumDepth: number;

      /**
       * Smallest retained affine weight; negative values remain explicit and do
       * not imply convexity.
       */
      minimumWeight: number;

      /**
       * Largest absolute deviation of an affine expression's weight sum from
       * one.
       */
      maximumWeightSumError: number;
    };

    /**
     * Largest assembled reduced observation stencil; the explicit row-work cap
     * includes exact-zero terms.
     */
    maximumRowTerms: number;

    /** Actual stored sparse Hessian entries, including symmetric partners. */
    hessianNonzeros: number;

    /**
     * Unobserved controls and incomplete convergence remain explicit; rank is
     * not certified.
     */
    diagnostics: string[];
  }
}
