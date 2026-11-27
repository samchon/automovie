import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";

/**
 * Bind the solver's existing rhs, xt and before without allocating another
 * numeric vector. The returned object lives for that solve only.
 *
 * @param transpose Disposable rhs buffer, distinct from curvature and all live
 *   inputs.
 * @param curvature Disposable xt buffer of the same length.
 * @param rows ADMM's m-entry before buffer, consumed only after ADMM ends for
 *   active polishing residuals and then final row products.
 * @param persistent Whether a fixed model owns this workspace across solves;
 *   false for one-shot scratch.
 * @returns A solve-owned workspace with a reusable diagnostic record.
 */
export function HumanQuadraticWorkspace(
  transpose: Float64Array,
  curvature: Float64Array,
  rows: Float64Array,
  persistent: boolean = false,
): HumanQuadraticWorkspace.IWork {
  return {
    persistent,
    transpose,
    curvature,
    rows,
    residuals: {
      primal: 0,
      primalScale: 0,
      dual: 0,
      dualScale: 0,
      scaledPrimal: 0,
      scaledPrimalScale: 0,
      scaledDual: 0,
      scaledDualScale: 0,
    },
  };
}

/**
 * Disposable numeric buffers shared between the phases of one quadratic solve
 * or fixed-matrix model. ADMM finishes reading rhs and xt before a residual
 * check, and its next iteration overwrites both, so those same buffers hold Aᵀy
 * and Px. Polishing consumes them after ADMM and keeps its output iterates
 * separate. Adaptive systems and changed polishing systems use a mutable upper
 * band. The latest polishing factor stays read-only for an exactly matching
 * scaled core, regularization and active row sequence; replacement rotates the
 * old factor into mutable storage. Fixed models likewise retain the last exact
 * adaptive factor, bounding their owner to three factors; each factor has an
 * upper band and exact forward-row copies. One-shot solves keep one mutable
 * factor owner. ADMM's consumed previous-multiplier vector first holds active
 * polishing residuals, then final Ax; rhs carries final Aᵀy to residual
 * admission, with x, y and A unchanged between producer and reader.
 */
export namespace HumanQuadraticWorkspace {
  /**
   * Fixed-size scratch owned by one prepared model and overwritten on every
   * solve. Returned iterates always transfer independently of this owner.
   */
  export interface IMemory {
    /**
     * Read-only initial factor for this fixed P/A and unchanged
     * free/equality/interval classifications; Model invalidates it on any
     * changed scaled classification.
     */
    initialFactor?: IFactor;

    /**
     * Initial m-entry row steps from current scaled bound classes and fixed
     * RHO0; adaptation never mutates this baseline.
     */
    rho: Float64Array;

    /**
     * Initial m-entry soft thresholds from current scaled weights and baseline
     * rho; adaptation never mutates this baseline.
     */
    thresholds: Float64Array;

    /**
     * Model sets this after a changed scaled row class or weight; the next
     * solve fully rebuilds both baseline vectors before reading them.
     */
    resetSteps: boolean;

    /**
     * Optional distinct m-entry adaptation buffers; every use overwrites both
     * completely from current base, bounds and weights.
     */
    adapted?: IMemoryAdapted;

    /**
     * M-entry rho*z-y, emitted by the preceding prox step and rebuilt after any
     * rho change.
     */
    rowRhs: Float64Array;

    /**
     * Current soft upper ends plus their thresholds; initial row production and
     * every adaptation overwrite all soft entries.
     */
    softUpper: Float64Array;

    /**
     * Current soft lower ends minus their thresholds, with the same
     * current-bound/rho lifetime as softUpper.
     */
    softLower: Float64Array;

    /** Distinct disposable rhs, xt, previous multipliers and factor storage. */
    work: IWork;

    /**
     * Only a discarded ADMM or polishing candidate, never returned state; every
     * entry is reset or overwritten before reuse.
     */
    spare?: IMemorySpare;
  }

  /**
   * Borrowed scratch for successive synchronous solves. Transpose and curvature
   * have length n and rows has length m; all are distinct from matrices and
   * live iterates.
   */
  export interface IWork {
    /**
     * Whether the owner keeps scratch between solves and benefits from bounded
     * factor retention.
     */
    persistent: boolean;

    /** ADMM rhs, reused for Aᵀy, Aᵀδy, polishing's cost rhs and its final Aᵀy. */
    transpose: Float64Array;

    /** ADMM xt, reused for Px and then polishing's curvature/direction buffer. */
    curvature: Float64Array;

    /**
     * ADMM previous multipliers, then active polishing residuals, then final Ax
     * paired with final Aᵀy for immediate residual admission.
     */
    rows: Float64Array;

    /** Borrowed values, reset and overwritten by every residual check. */
    residuals: B.IResiduals;

    /**
     * One mutable system/factor band, distinct from the retained polishing
     * factor.
     */
    matrices?: IFactor;

    /**
     * Last polishing factor, immutable until replaced; bounds affect its
     * right-hand side, not its matrix.
     */
    polish?: IPolish;

    /**
     * Last adapted factor with its exact rho/sigma dependencies, separate from
     * mutable system storage.
     */
    adaptive?: IAdaptive;

    /** Disposable active row indices and their current bound right-hand sides. */
    active?: IWorkActive;

    /**
     * Disposable n-entry polishing rhs, distinct from the cost rhs retained in
     * transpose.
     */
    polishRhs?: Float64Array;
  }

  /** One retained adaptive ADMM factor keyed by its exact row steps. */
  export interface IAdaptive {
    /**
     * Identity shared only by exactly equal scaled P/A pairs with matching
     * dimensions and band.
     */
    p: Float64Array[];

    /** Positive proximal diagonal used by the retained reduced system. */
    sigma: number;

    /** Copied row steps, independent of the solve's next adaptation. */
    rho: Float64Array;

    /** Read-only factor until replacement rotates it into mutable storage. */
    matrices: IFactor;
  }

  /**
   * One polishing factor and the exact fixed-matrix/active-set dependencies
   * that formed it; current bound values enter only the right-hand side.
   */
  export interface IPolish {
    /**
     * Exactly shared scaled P/A identity, tying together immutable curvature,
     * row coefficients and dimensions.
     */
    p: Float64Array[];

    /**
     * Regularization used by P plus delta I and active row products divided by
     * delta.
     */
    delta: number;

    /**
     * Copied ordered active row indices; each contributes one unchanged outer
     * product.
     */
    active: Int32Array;

    /** Canonical factor excluded from mutable system storage until replacement. */
    matrices: IFactor;
  }

  /**
   * Owned storage for successive systems and Cholesky factors. Upper row i has
   * min(band+1,n-i) entries; forward row i has min(band,i) exact copies.
   */
  export interface IFactor {
    /** Variable count used to allocate the band. */
    n: number;

    /** Half-bandwidth used to allocate the band. */
    band: number;

    /**
     * Upper K during assembly, then U in place; every entry is reset from P
     * before rebuilding a changed system.
     */
    system: Float64Array[];

    /**
     * Packed rows of finalized U(t,i) for increasing t in [max(0,i-band),i);
     * Cholesky overwrites every coefficient.
     */
    forward: Float64Array;

    /**
     * Exact numeric prefix offsets for packed forward rows, n+1 entries; avoids
     * imposing Int32 limits on curvature storage.
     */
    forwardStart: Float64Array;
  }

  /**
   * Reset an owned upper band from current P, add its proximal diagonal and
   * provide storage for its in-place factor. Without work, the initial prepared
   * factor gets fresh storage that cannot alias a later solve's mutable
   * matrices.
   *
   * @param s Admitted scaled problem; only its in-range curvature band is read.
   * @param diagonal Positive proximal regularization supplied by ADMM or
   *   polishing.
   * @param work Optional solve owner for adaptive and polishing factorization
   *   storage.
   * @returns Owned canonical upper band, reset before row assembly and in-place
   *   factorization.
   */
  export function system(
    s: B.IScaled,
    diagonal: number,
    work?: IWork,
  ): IFactor {
    let matrices: IFactor | undefined = work?.matrices;
    if (
      matrices === undefined ||
      matrices.n !== s.n ||
      matrices.band !== s.band
    ) {
      const forwardStart: Float64Array = new Float64Array(s.n + 1);
      let entries: number = 0;
      for (let i: number = 0; i < s.n; ++i) {
        forwardStart[i] = entries;
        entries += Math.min(s.band, i);
      }
      forwardStart[s.n] = entries;
      matrices = {
        n: s.n,
        band: s.band,
        system: Array.from(
          { length: s.n },
          (_: unknown, i: number): Float64Array =>
            new Float64Array(Math.min(s.band + 1, s.n - i)),
        ),
        forward: new Float64Array(entries),
        forwardStart,
      };
      if (work !== undefined) work.matrices = matrices;
    }
    for (let i: number = 0; i < s.n; ++i) {
      const row: Float64Array = matrices.system[i]!;
      row.set(s.p[i]!);
      row[0] = row[0]! + diagonal;
    }
    return matrices;
  }

  /**
   * Overwrite a disposable buffer with P̄x in the original band traversal.
   *
   * @param s Read-only scaled matrices with canonical upper-band row lengths.
   * @param x Current variable vector, distinct from out.
   * @param out Disposable n-entry product buffer; every accumulator begins at
   *   positive zero, directly at diagonal production or by full reset before a
   *   scatter.
   */
  export function curvature(
    s: B.IScaled,
    x: Float64Array,
    out: Float64Array,
  ): void {
    if (s.band === 0 || s.diagonal) {
      for (let i: number = 0; i < s.n; ++i) out[i] = 0 + s.p[i]![0]! * x[i]!;
      return;
    }
    out.fill(0);
    const pattern: B.IScaled["pPattern"] = s.pPattern;
    if (pattern !== undefined) {
      for (let i: number = 0; i < s.n; ++i) {
        const row: Float64Array = s.p[i]!;
        const xi: number = x[i]!;
        out[i] = out[i]! + row[0]! * xi;
        const end: number = pattern.start[i + 1]!;
        for (let a: number = pattern.start[i]! + 1; a < end; ++a) {
          const j: number = pattern.offsets[a]!;
          const coefficient: number = row[j]!;
          out[i] = out[i]! + coefficient * x[i + j]!;
          out[i + j] = out[i + j]! + coefficient * xi;
        }
      }
      return;
    }
    for (let i: number = 0; i < s.n; ++i) {
      const row: Float64Array = s.p[i]!;
      const xi: number = x[i]!;
      out[i] = out[i]! + row[0]! * xi;
      for (let j: number = 1; j < row.length; ++j) {
        const coefficient: number = row[j]!;
        out[i] = out[i]! + coefficient * x[i + j]!;
        out[i + j] = out[i + j]! + coefficient * xi;
      }
    }
  }
}

/** The record of `IWorkActive`'s site. */
type IWorkActive = { rows: number[]; bounds: number[] };

/** The record of `IMemorySpare`'s site. */
type IMemorySpare = { x: Float64Array; z: Float64Array; y: Float64Array };

/** The record of `IMemoryAdapted`'s site. */
type IMemoryAdapted = { rho: Float64Array; thresholds: Float64Array };
