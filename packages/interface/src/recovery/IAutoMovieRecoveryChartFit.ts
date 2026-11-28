import type {
  AutoMovieVector3Tuple,
  IAutoMovieAffineBoxBound,
  IAutoMovieRecoveryChartFitRows,
} from "..";

/**
 * Physical observation input and numerical result of one constrained bicubic
 * coefficient fit.
 */

export namespace IAutoMovieRecoveryChartFit {
  /**
   * Fit weighted chart observations against a shared millimetre control
   * registry. Supply the enclosure, observation population and work controls
   * for a joint normalized solve.
   */
  export interface Input {
    /**
     * Registered millimetre control positions. A null slot leaves the control
     * free or subject to an affine relation.
     */
    controls: readonly (Readonly<AutoMovieVector3Tuple> | null)[];

    /**
     * Optional physical starting coefficients in original registry order. The
     * fit copies only values for independent controls.
     */
    initialControlsMm?: readonly Readonly<AutoMovieVector3Tuple>[];

    /**
     * Optional acyclic identities assigning dependent controls as weighted sums
     * of original IDs.
     */
    relations?: readonly {
      /** Dependent control's original registry id. */
      id: number;

      /** Signed original-control contributions that define the dependent value. */
      terms: readonly {
        /** Original registry id of one contributing control. */
        id: number;
        /** Signed multiplier of that control in the affine identity. */
        weight: number;
      }[];
    }[];

    /**
     * Explicit affine expansion and reduced-row budgets when relations are
     * present.
     */
    relationBudget?: {
      /** Maximum sparse terms retained during identity expansion. */
      maxTerms: number;

      /** Maximum acyclic dependency depth. */
      maxDepth: number;

      /**
       * Cap on all reduced observation-row addresses. Defaults to 128 with
       * relations or 16 without them.
       */
      maxRowTerms?: number;
    };

    /**
     * Bicubic patch nets, each using sixteen original control IDs with U
     * varying fastest.
     */
    patches: readonly {
      /** Sixteen original registry IDs in U-fastest Bernstein order. */
      controlIds: readonly number[];

      /** Optional stable patch identifier copied into diagnostics. */
      id?: string;

      /** Optional global normalized patch bounds [uMin, uMax, vMin, vMax]. */
      parameterBounds?: readonly [number, number, number, number];
    }[];

    /**
     * Weighted original millimetre point correspondences in each patch's local
     * unit chart, with optional physical tangent rows.
     */
    observations: readonly {
      /** Zero-based index of this observation's patch. */
      patch: number;

      /** Local U parameter in [0, 1]. */
      u: number;

      /** Local V parameter in [0, 1]. */
      v: number;

      /** Observed [X, Y, Z] in registered millimetres. */
      pointMm: Readonly<AutoMovieVector3Tuple>;

      /** Positive observation weight before normalization by total weight. */
      weight: number;

      /** Optional scaled physical tangent rows for this observation. */
      physicalJet?: Parameters<IAutoMovieRecoveryChartFitRows.Operation>[0]["physicalJet"];
    }[];

    /**
     * Additional original correspondences checked after fitting, outside the
     * assembled objective.
     */
    validation?: readonly {
      /** Zero-based patch index of this check-only sample. */
      patch: number;

      /** Local U parameter of the validation correspondence. */
      u: number;

      /** Local V parameter of the validation correspondence. */
      v: number;

      /** Observed validation position in registered millimetres. */
      pointMm: Readonly<AutoMovieVector3Tuple>;
    }[];

    /** Componentwise lower and upper control bounds in registered millimetres. */
    enclosureMm: {
      /** Lower [X, Y, Z] control enclosure in registered millimetres. */
      lower: Readonly<AutoMovieVector3Tuple>;
      /** Upper [X, Y, Z] control enclosure in registered millimetres. */
      upper: Readonly<AutoMovieVector3Tuple>;
    };

    /** Requested maximum sampled position residual in millimetres. */
    toleranceMm: number;

    /** Positive projected-gradient threshold in normalized original coordinates. */
    gradientTolerance: number;

    /** Positive iteration cap for the projected box solve. */
    maxIterations: number;
  }

  /**
   * Reconstructed millimetre coefficients with separate numerical convergence,
   * rank, sampled-error and enclosure evidence.
   */
  export interface Result {
    /**
     * Fitted registry in input order and registered millimetres, with the
     * original fixed values preserved.
     */
    controls: Readonly<AutoMovieVector3Tuple>[];

    /**
     * Whether full observed rank, normalized projected gradient, sampled
     * position maximum and dependent enclosure pass together.
     */
    qualified: boolean;

    /** Projected proposals attempted by the normalized box solver. */
    iterations: number;

    /**
     * Infinity norm of the projected-gradient mapping in original normalized
     * box coordinates.
     */
    projectedGradient: number;

    /** Weighted RMS of fitting position observations in millimetres. */
    rmsMm: number;

    /** Weighted RMS of exchange-length-scaled tangent residuals, in millimetres. */
    physicalJetRmsMm: number;

    /**
     * Root of the combined position and physical-gradient mean square, in
     * millimetres.
     */
    objectiveRmsMm: number;

    /** Number of generated signed derivative rows consumed during assembly. */
    physicalJetRows: number;

    /**
     * Sparse box solver estimates, diagonal range and realized momentum restart
     * count.
     */
    solve: {
      /** Original normalized Hessian absolute row-sum estimate. */
      originalLipschitz: number;

      /** Absolute row-sum estimate after diagonal congruence. */
      scaledLipschitz: number;

      /** Smallest positive original Gram diagonal, or null if absent. */
      minimumPositiveDiagonal: number | null;

      /** Largest original Gram diagonal used by the box solver. */
      maximumDiagonal: number;

      /** Projected-acceleration momentum restarts actually taken. */
      restarts: number;
    };

    /**
     * Largest observed position residual across fitting and validation samples,
     * in millimetres.
     */
    maximumMm: number;

    /**
     * Number of independent vector controls after fixed and dependent
     * elimination.
     */
    unknownControls: number;

    /**
     * Numerical Gram rank, or null if the rank work cap excludes the
     * calculation.
     */
    observationRank: number | null;

    /** Relative pivot floor for the Gram rank decision. */
    rankTolerance: number;

    /**
     * Smallest accepted over largest Gram Cholesky pivot, or null when
     * unavailable.
     */
    gramPivotRatio: number | null;

    /**
     * Numerical rank of scaled original observation rows, or null under its
     * work cap.
     */
    dataRowRank: number | null;

    /**
     * Smallest accepted to largest diagonal magnitude of the data-row
     * factorization, or null when unavailable.
     */
    dataQrDiagonalRatio: number | null;

    /**
     * Maximum checked position residual per patch, in original input patch
     * order and millimetres.
     */
    patchMaximumMm: number[];

    /**
     * Maximum measured residual per patch over samples with independent
     * coefficient support.
     */
    patchFreeSupportMaximumMm: number[];

    /**
     * Local [u, v] of the first strict maximum in each patch, or null when none
     * was recorded.
     */
    patchMaximumLocations: ([number, number] | null)[];

    /** Count of independent controls with no positive observation Gram diagonal. */
    unsupportedControls: number;

    /**
     * Maximum measured residual among rows without independent positional
     * support, in millimetres.
     */
    fixedSupportMaximumMm: number;

    /**
     * Maximum measured residual among rows with independent positional support,
     * in millimetres.
     */
    freeSupportMaximumMm: number;

    /**
     * Patch and local coordinates of the first strictly larger global sampled
     * maximum, or null when unavailable.
     */
    maximumLocation: {
      /** Original input patch index of the worst sample. */
      patch: number;

      /** Worst sample's local U parameter. */
      u: number;

      /** Worst sample's local V parameter. */
      v: number;

      /**
       * True when no positive position basis coefficient carries independent
       * terms.
       */
      fixedSupport: boolean;
    } | null;

    /**
     * Private maximum-sample record with its original controls and affine
     * reachability calculation, or null.
     */
    maximumWitness: {
      /** Original input patch index of the witness. */
      patch: number;

      /** Copied declared patch identifier, or null when absent. */
      patchId: string | null;

      /** Local [u, v] of the retained maximum sample. */
      localUV: [number, number];

      /** Global [u, v] obtained from the leaf bounds, or null without bounds. */
      globalUV: [number, number] | null;

      /**
       * Global normalized bounds [uMin, uMax, vMin, vMax], or null without
       * them.
       */
      leafBounds: readonly [number, number, number, number] | null;

      /** Observed maximum-sample position in registered millimetres. */
      targetMm: Readonly<AutoMovieVector3Tuple>;

      /** Fitted maximum-sample position in registered millimetres. */
      fittedPointMm: Readonly<AutoMovieVector3Tuple>;

      /** Original registry IDs of the sixteen controls supporting the witness. */
      controlIds: number[];

      /**
       * Physical millimetre control positions in the witness's local basis
       * order.
       */
      controlsMm: Readonly<AutoMovieVector3Tuple>[];

      /**
       * Sixteen position Bernstein weights aligned with the original control
       * IDs.
       */
      coefficients: number[];

      /**
       * Reduced affine expressions associated with the witness's original
       * control slots.
       */
      coefficientExpressions: {
        /** Fixed millimetre contribution of this control expression. */
        constant: Readonly<AutoMovieVector3Tuple>;

        /** Independent original control terms for this expression. */
        terms: {
          /** Original independent control id in this reduced expression. */
          id: number;
          /** Signed coefficient multiplying that independent control. */
          weight: number;
        }[];
      }[];

      /** Bounded fitting samples from the same patch in input observation order. */
      sampledRows: {
        /** Local U of one retained diagnostic row sample. */
        u: number;

        /** Local V of one retained diagnostic row sample. */
        v: number;

        /** Observed position of that sample in registered millimetres. */
        targetMm: Readonly<AutoMovieVector3Tuple>;

        /** Sample's original scaled tangent rows, or null if absent. */
        physicalJet:
          | IAutoMovieRecoveryChartFit.Input["observations"][number]["physicalJet"]
          | null;
      }[];

      /** Fixed millimetre contribution after composing the witness position row. */
      constantMm: Readonly<AutoMovieVector3Tuple>;

      /**
       * Independent-control contributions after composing the witness position
       * row.
       */
      terms: {
        /** Independent original control ID in the composed witness. */
        id: number;
        /** Combined signed weight of that independent control. */
        weight: number;
        /** Fitted independent control position in registered millimetres. */
        valueMm: Readonly<AutoMovieVector3Tuple>;
      }[];

      /** Original lower physical box bound for the witness. */
      lowerMm: Readonly<AutoMovieVector3Tuple>;

      /** Original upper physical box bound for the witness. */
      upperMm: Readonly<AutoMovieVector3Tuple>;

      /**
       * Reachable physical box and target distance for this one affine position
       * row.
       */
      reachable: ReturnType<IAutoMovieAffineBoxBound.Operation>;

      /**
       * Null because this coefficient witness does not carry original face
       * identity.
       */
      originalSourceFace: null;
    } | null;

    /**
     * Normalized quadratic objective, numerical tangent box gap and associated
     * physical scale.
     */
    optimality: {
      /** Evaluated normalized box quadratic at the returned control iterate. */
      objective: number;

      /** Constant term of the normalized least-squares objective. */
      leastSquaresConstant: number;

      /** Numerical tangent-plane support gap over the original normalized box. */
      boxSupportGap: number;

      /** Infinity norm of the original normalized quadratic gradient. */
      gradientInfinity: number;

      /**
       * Physical squared-millimetre estimate derived by rescaling the
       * normalized gap.
       */
      physicalObjectiveGapUpperMm2: number;

      /** Millimetre length used to divide physical coordinates. */
      normalizationScaleMm: number;

      /** Registered millimetre origin used to translate the fit. */
      normalizationOriginMm: Readonly<AutoMovieVector3Tuple>;
    };

    /**
     * Independent controls touching at least one enclosure coordinate after
     * solving.
     */
    activeEnclosureControls: number;

    /**
     * Largest componentwise millimetre excursion from the enclosure for an
     * affine-dependent control.
     */
    dependentEnclosureViolationMm: number;

    /**
     * Observed affine substitution depth, term counts and signed weight
     * diagnostics.
     */
    relationDiagnostics: {
      /** Largest retained independent-term expression. */
      maximumTerms: number;

      /** Deepest observed affine dependency chain. */
      maximumDepth: number;

      /** Smallest signed original source weight after flattening. */
      minimumWeight: number;

      /** Largest deviation of a retained affine weight sum from one. */
      maximumWeightSumError: number;
    };

    /**
     * Largest reduced observation stencil assembled, counting stored exact-zero
     * terms.
     */
    maximumRowTerms: number;

    /** Number of stored sparse Hessian entries, including mirrored counterparts. */
    hessianNonzeros: number;

    /** Observed numerical and fitting qualifications that remain unresolved. */
    diagnostics: string[];
  }
}
