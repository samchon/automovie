import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";

/**
 * Disposable numeric buffers shared between the phases of one quadratic
 * solve or fixed-matrix model. ADMM finishes reading rhs and xt before a residual check, and its
 * next iteration overwrites both, so those same buffers hold Aᵀy and Px.
 * Polishing consumes them after ADMM and keeps its output iterates separate.
 * Adaptive systems and changed polishing systems use a mutable upper band.
 * The latest polishing factor stays read-only for an exactly matching
 * scaled core, regularization and active row sequence; replacement rotates
 * the old factor into mutable storage. Fixed models likewise retain the
 * last exact adaptive factor, bounding their owner to three factors; each
 * factor has an upper band and exact forward-row copies. One-shot solves
 * keep one mutable factor owner.
 * ADMM's consumed previous-multiplier vector first holds active polishing
 * residuals, then final Ax; rhs carries final Aᵀy to residual admission,
 * with x, y and A unchanged between producer and reader.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines one-shot or fixed-model scratch lifetime, ADMM overwrite boundaries, bounded exact factor reuse and separate output ownership.
 * @evidence contracts/development/design.md#principled-representation Groups distinct n-entry product buffers, an m-entry previous-multiplier/residual/product buffer, borrowed diagnostics and optional factorization storage; the solver supplies compatible disposable buffers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Serves the existing residual, certificate and polishing phases without adding fields to the public problem or state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Keeps mutable systems within one synchronous solver owner, separate from immutable prepared factors and caller-owned iterates, and introduces no body cache or global workspace pool.
 */
export namespace HumanQuadraticWorkspace {
  /**
   * Fixed-size scratch owned by one prepared model and overwritten on every
   * solve. Returned iterates always transfer independently of this owner.
   *
   * @evidence contracts/development/design.md#principled-representation Stores the read-only initial factor, initial-policy rho/threshold baselines, optional distinct adaptations, current soft threshold-shifted bounds, prox-emitted rho*z-y and n/m work. Changed scaled classes invalidate factor/baselines; weights invalidate baselines, and current-bound production/adaptation overwrites every used soft cut before reading.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Contains initial-factor/configuration ownership and disposable arrays consumed by HumanQuadraticSolve; Model owns exact class/weight invalidation, initial/adapted row production owns current soft cuts, and adaptation/polishing retain separate numeric storage/factors.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Retains no public solution, solved status or approximate answer key; each solve selects the RHO0 baseline, never an earlier adaptation. Only exactly unchanged scaled classes/weights permit baseline reuse; discarded candidates reset and current products recompute.
   * @evidence contracts/development/common.md#meaningful-documentation Defines fixed dimensions, initial-factor and baseline dependencies/invalidation, separate adaptive overwrite discipline, model ownership and independence from returned state.
   */
  export interface IMemory {
    /** Read-only initial factor for this fixed P/A and unchanged free/equality/interval classifications; Model invalidates it on any changed scaled classification. */
    initialFactor?: IFactor;

    /** Initial m-entry row steps from current scaled bound classes and fixed RHO0; adaptation never mutates this baseline. */
    rho: Float64Array;

    /** Initial m-entry soft thresholds from current scaled weights and baseline rho; adaptation never mutates this baseline. */
    thresholds: Float64Array;

    /** Model sets this after a changed scaled row class or weight; the next solve fully rebuilds both baseline vectors before reading them. */
    resetSteps: boolean;

    /** Optional distinct m-entry adaptation buffers; every use overwrites both completely from current base, bounds and weights. */
    adapted?: { rho: Float64Array; thresholds: Float64Array };

    /** m-entry rho*z-y, emitted by the preceding prox step and rebuilt after any rho change. */
    rowRhs: Float64Array;

    /** Current soft upper ends plus their thresholds; initial row production and every adaptation overwrite all soft entries. */
    softUpper: Float64Array;

    /** Current soft lower ends minus their thresholds, with the same current-bound/rho lifetime as softUpper. */
    softLower: Float64Array;

    /** Distinct disposable rhs, xt, previous multipliers and factor storage. */
    work: IWork;

    /** Only a discarded ADMM or polishing candidate, never returned state; every entry is reset or overwritten before reuse. */
    spare?: { x: Float64Array; z: Float64Array; y: Float64Array };
  }

  /**
   * Borrowed scratch for successive synchronous solves. Transpose and curvature have
   * length n and rows has length m; all are distinct from matrices and live iterates.
   *
   * @evidence contracts/development/design.md#principled-representation Represents disposable transpose, curvature and row products plus scaled/unscaled diagnostics; compatible n/m lengths and nonaliasing are solver-owned premises.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Contains only buffers and exact adaptive/polishing factor dependencies consumed by current residual, certificate and reduced-system phases.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the owning Band residual type and stores no solution or approximate key; copied rho only proves factor equivalence and never supplies another solve's initial steps, while active-set and delta comparisons are exact.
   * @evidence contracts/development/common.md#meaningful-documentation States buffer sizes, nonaliasing, borrowed residual lifetime and each phase's use of the vectors.
   */
  export interface IWork {
    /** Whether the owner keeps scratch between solves and benefits from bounded factor retention. */
    persistent: boolean;

    /** ADMM rhs, reused for Aᵀy, Aᵀδy, polishing's cost rhs and its final Aᵀy. */
    transpose: Float64Array;

    /** ADMM xt, reused for Px and then polishing's curvature/direction buffer. */
    curvature: Float64Array;

    /** ADMM previous multipliers, then active polishing residuals, then final Ax paired with final Aᵀy for immediate residual admission. */
    rows: Float64Array;

    /** Borrowed values, reset and overwritten by every residual check. */
    residuals: B.IResiduals;

    /** Final polishing x finiteness, valid only with its immediately returned rows/transpose products; other phases ignore it. */
    productFiniteX?: boolean;

    /** One mutable system/factor band, distinct from the retained polishing factor. */
    matrices?: IFactor;

    /** Last polishing factor, immutable until replaced; bounds affect its right-hand side, not its matrix. */
    polish?: IPolish;

    /** Last adapted factor with its exact rho/sigma dependencies, separate from mutable system storage. */
    adaptive?: IAdaptive;

    /** Disposable active row indices and their current bound right-hand sides. */
    active?: { rows: number[]; bounds: number[] };

    /** Disposable n-entry polishing rhs, distinct from the cost rhs retained in transpose. */
    polishRhs?: Float64Array;
  }

  /**
   * One retained adaptive ADMM factor keyed by its exact row steps.
   *
   * @evidence contracts/development/design.md#principled-representation Couples exactly shared scaled P/A identity, copied positive row rho and sigma with the factor of P plus sigma I plus A-transpose diag(rho) A; current q and units do not enter this matrix.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Records only the latest adapted system's dependencies and owned band; initial factors remain with Preparation and polishing has its distinct active-set key.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses exact numeric vector comparisons without adapting from a previous solve's rho or substituting an old iterate.
   * @evidence contracts/development/common.md#meaningful-documentation Defines the reduced-system dependency key, one-entry bound and immutable factor ownership.
   */
  export interface IAdaptive {
    /** Identity shared only by exactly equal scaled P/A pairs with matching dimensions and band. */
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
   *
   * @evidence contracts/development/design.md#principled-representation Couples the canonical factor with exact scaled P/A pair identity, positive regularization and ordered active rows; private curvature-array identity is shared only after full P/A equality with compatible dimensions and topology.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Stores only dependencies needed by the existing polishing reduced system; row bounds, multipliers and candidate iterates are not factor dependencies.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Compares every active row and the exact delta, without approximate numeric keys or reusing a candidate solution.
   * @evidence contracts/development/common.md#meaningful-documentation Defines the matrix equivalence key, independent right-hand side and owned immutable factor lifetime.
   */
  export interface IPolish {
    /** Exactly shared scaled P/A identity, tying together immutable curvature, row coefficients and dimensions. */
    p: Float64Array[];

    /** Regularization used by P plus delta I and active row products divided by delta. */
    delta: number;

    /** Copied ordered active row indices; each contributes one unchanged outer product. */
    active: Int32Array;

    /** Canonical factor excluded from mutable system storage until replacement. */
    matrices: IFactor;
  }

  /**
   * Owned storage for successive systems and Cholesky factors. Upper row i
   * has min(band+1,n-i) entries; forward row i has min(band,i) exact copies.
   *
   * @evidence contracts/development/design.md#principled-representation Stores a canonical upper band transitioning from K to U with K=U-transpose-U and one packed forward mirror with exact numeric row prefixes; dimensions fix every offset and the matching Cholesky pass overwrites all mirrored coefficients.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Supplies one system/factor owner and its dimensions to assembly, Cholesky and substitution; forward copies serve repeated ADMM/polish right-hand sides without recomputing or transposing coefficients per solve.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Keeps mutable factorization storage separate from prepared immutable matrices and cached initial factors; no iterate or body state is stored.
   * @evidence contracts/development/common.md#meaningful-documentation Defines row lengths, dimensions, numeric ownership and the distinction from immutable prepared factors.
   */
  export interface IFactor {
    /** Variable count used to allocate the band. */
    n: number;

    /** Half-bandwidth used to allocate the band. */
    band: number;

    /** Upper K during assembly, then U in place; every entry is reset from P before rebuilding a changed system. */
    system: Float64Array[];

    /** Packed rows of finalized U(t,i) for increasing t in [max(0,i-band),i); Cholesky overwrites every coefficient. */
    forward: Float64Array;

    /** Exact numeric prefix offsets for packed forward rows, n+1 entries; avoids imposing Int32 limits on curvature storage. */
    forwardStart: Float64Array;
  }

  /**
   * Bind the solver's existing rhs, xt and before without allocating another
   * numeric vector. The returned object lives for that solve only.
   *
   * @param transpose Disposable rhs buffer, distinct from curvature and all live inputs.
   * @param curvature Disposable xt buffer of the same length.
   * @param rows ADMM's m-entry before buffer, consumed only after ADMM ends for active polishing residuals and then final row products.
   * @param persistent Whether a fixed model owns this workspace across solves; false for one-shot scratch.
   * @returns A solve-owned workspace with a reusable diagnostic record.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reuses buffers only after ADMM consumes their current values; each subsequent phase resets or completely overwrites the values before reading them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Names the existing scratch roles once and leaves matrix operations and convergence policy with their current owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no shared mutable result, matrix identity cache, numerical cutoff or changed solver decision.
   * @evidence contracts/development/implementation.md#efficient-algorithms Takes O(1) time and object storage, referencing existing n-entry and m-entry arrays without allocating new numeric arrays.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller supplies distinct rhs/xt/before arrays; ADMM's certificate may consume before until ADMM ends, then active polishing residuals use its initialized prefix before final Ax overwrites every entry for the immediate unchanged-x/y/A check; output state stays separate.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns the workspace and one fixed-size diagnostic object; a one-shot solve releases it at completion, while a fixed model retains bounded scratch until collection and never aliases returned iterates.
   * @evidence contracts/development/common.md#meaningful-documentation Describes the phase boundary, borrowed buffers, diagnostic lifetime and absence of numeric-vector allocation.
   */
  export function of(
    transpose: Float64Array,
    curvature: Float64Array,
    rows: Float64Array,
    persistent: boolean = false,
  ): IWork {
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
   * Reset an owned upper band from current P, add its proximal diagonal and
   * provide storage for its in-place factor. Without work, the initial prepared factor gets fresh
   * storage that cannot alias a later solve's mutable matrices.
   *
   * @param s Admitted scaled problem; only its in-range curvature band is read.
   * @param diagonal Positive proximal regularization supplied by ADMM or polishing.
   * @param work Optional solve owner for adaptive and polishing factorization storage.
   * @returns Owned canonical upper band, reset before row assembly and in-place factorization.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Copies each current in-range P row then adds its original proximal diagonal in row order; zero-valued contributions and signed zeros are retained while mathematically absent padding is omitted.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Owns one allocation and regularized reset for both systems, copying each admitted canonical row with TypedArray.set then adding its diagonal before Cholesky overwrites that band with its factor.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Changes no coefficient, arithmetic association or regularization; original supplied padding remains validated and compared by Preparation before this internal reader.
   * @evidence contracts/development/implementation.md#efficient-algorithms With w=band+1, reset costs O(n*w); first use allocates n upper rows and one packed forward buffer of at most n*w coefficients plus n+1 numeric offsets. Matching later uses allocate no arrays, and Cholesky overwrites every forward coefficient.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses only storage for equal n/band and recopies P plus the current diagonal on every call; changed curvature, regularization, rho and active rows are rebuilt rather than treated as a valid old factor.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A persistent workspace retains at most one mutable factor owner plus one read-only adaptive and one read-only polishing factor, each with upper/forward layouts, rotating replaced owners into mutable storage; one-shot work keeps one owner, and calls without work create a separately owned immutable initial factor.
   * @evidence contracts/development/common.md#meaningful-documentation States canonical shapes, complete P reset, shape invalidation and separate initial-factor versus solve-local ownership.
   */
  export function system(
    s: B.IScaled,
    diagonal: number,
    work?: IWork,
  ): IFactor {
    let matrices: IFactor | undefined = work?.matrices;
    if (matrices === undefined || matrices.n !== s.n || matrices.band !== s.band) {
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
   * @param out Disposable n-entry product buffer; every accumulator begins at positive zero, directly at diagonal production or by full reset before a scatter.
   * @param finiteX Optional current-vector finiteness proved by its unchanged producer or same-call reader; absent preserves the local check.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Multiplies symmetric P with its original ordered contributions; for finite x, omitted exact-zero terms contribute only signed zeros to positive-zero accumulators, leaving the same sums. Nonfinite x retains the original full traversal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One overwrite operation serves residual and polishing products, selecting direct positive-zero diagonal emission, ordered sparse-position scatter or unchanged full-band traversal from prepared structure and current x finiteness.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Omits only exact off-diagonal zeros for finite x, preserving positive-zero initialization and each diagonal addition; a nonfinite x resets scratch and uses the original full traversal so zero-times-infinity/NaN still reaches the existing residual rejection.
   * @evidence contracts/development/implementation.md#efficient-algorithms Finite x costs O(n) for diagonal P or O(n+K) for K recorded sparse off-diagonal positions; other cases cost O(n*w). Uses O(1) auxiliary storage beyond out and ignores supplied padding outside the canonical band.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Preparation records exact diagonal/sparse structure with its immutable core; every current x product rebuilds. Diagonal emission writes 0+Pii*xi directly without a separate zero fill, current finite-x proof avoids another scan, and absent proof is checked locally before compression. Nonfinite x retains original zero terms; band zero already has none off diagonal.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates no arrays, changes only out and retains no input after the call.
   * @evidence contracts/development/common.md#meaningful-documentation Defines the scaled symmetric product, nonaliasing premise, reset and preserved accumulation order.
   */
  export function curvature(
    s: B.IScaled,
    x: Float64Array,
    out: Float64Array,
    finiteX?: boolean,
  ): void {
    if (s.band === 0 || s.diagonal) {
      if (s.band === 0 || finiteX === true) {
        for (let i: number = 0; i < s.n; ++i)
          out[i] = 0 + s.p[i]![0]! * x[i]!;
        return;
      }
      if (finiteX === undefined) {
        let finite: boolean = true;
        for (let i: number = 0; i < s.n; ++i) {
          const xi: number = x[i]!;
          if (!Number.isFinite(xi)) {
            finite = false;
            break;
          }
          out[i] = 0 + s.p[i]![0]! * xi;
        }
        if (finite) return;
      }
    }

    // A partial diagonal attempt may have encountered a nonfinite operand;
    // reset before the unchanged scatter restores every original zero term.
    out.fill(0);
    const pattern: B.IScaled["pPattern"] = s.pPattern;
    if (pattern !== undefined && (finiteX ?? x.every(Number.isFinite))) {
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
