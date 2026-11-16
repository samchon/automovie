import type { HumanQuadraticBand as B } from "./HumanQuadraticBand";

/**
 * Disposable numeric buffers shared between the phases of one quadratic
 * solve. ADMM finishes reading rhs and xt before a residual check, and its
 * next iteration overwrites both, so those same buffers hold Aᵀy and Px.
 * Polishing consumes them after ADMM and keeps its output iterates separate.
 * Adaptive and polishing systems additionally share one lazily allocated
 * canonical upper-band buffer, rebuilt numerically and factored in place each use.
 * ADMM's consumed previous-multiplier vector first holds active polishing
 * residuals, then final Ax; rhs carries final Aᵀy to residual admission,
 * with x, y and A unchanged between producer and reader.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines the solve-local scratch lifetime, the ADMM overwrite boundary and separate ownership of returned iterates.
 * @evidence contracts/development/design.md#principled-representation Groups distinct n-entry product buffers, an m-entry previous-multiplier/residual/product buffer, borrowed diagnostics and optional factorization storage; the solver supplies compatible disposable buffers.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Serves the existing residual, certificate and polishing phases without adding fields to the public problem or state.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Keeps mutable systems local to one solve, separate from immutable prepared factors and caller-owned iterates, and introduces no body cache or global workspace pool.
 */
export namespace HumanQuadraticWorkspace {
  /**
   * Borrowed scratch for one synchronous solve. Transpose and curvature have
   * length n and rows has length m; all are distinct from matrices and live iterates.
   *
   * @evidence contracts/development/design.md#principled-representation Represents disposable transpose, curvature and row products plus scaled/unscaled diagnostics; compatible n/m lengths and nonaliasing are solver-owned premises.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Contains only buffers read and overwritten by current residual, certificate, adaptive-factor and polishing consumers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the owning Band residual type and stores no solution, adaptive parameter history or approximate numeric key.
   * @evidence contracts/development/common.md#meaningful-documentation States buffer sizes, nonaliasing, borrowed residual lifetime and each phase's use of the vectors.
   */
  export interface IWork {
    /** ADMM rhs, reused for Aᵀy, Aᵀδy, polishing's cost rhs and its final Aᵀy. */
    transpose: Float64Array;

    /** ADMM xt, reused for Px and then polishing's curvature/direction buffer. */
    curvature: Float64Array;

    /** ADMM previous multipliers, then active polishing residuals, then final Ax paired with final Aᵀy for immediate residual admission. */
    rows: Float64Array;

    /** Borrowed values, reset and overwritten by every residual check. */
    residuals: B.IResiduals;

    /** One owned in-place system/factor buffer, created only when a solve needs factorization. */
    matrices?: IFactor;
  }

  /**
   * Owned storage for one solve's successive systems and upper Cholesky
   * factors. Row i stores min(band+1,n-i) entries in either phase.
   *
   * @evidence contracts/development/design.md#principled-representation Stores a canonical upper band that transitions from K to U with K=U-transpose-U; dimensions determine its allocation and every stored entry participates in the matrix or factor.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Supplies one matrix and its allocation dimensions to system and the two Band factorization consumers; a separate lower factor is unnecessary.
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
  }

  /**
   * Bind the solver's existing rhs, xt and before without allocating another
   * numeric vector. The returned object lives for that solve only.
   *
   * @param transpose Disposable rhs buffer, distinct from curvature and all live inputs.
   * @param curvature Disposable xt buffer of the same length.
   * @param rows ADMM's m-entry before buffer, consumed only after ADMM ends for active polishing residuals and then final row products.
   * @returns A solve-owned workspace with a reusable diagnostic record.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reuses buffers only after ADMM consumes their current values; each subsequent phase resets or completely overwrites the values before reading them.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Names the existing scratch roles once and leaves matrix operations and convergence policy with their current owners.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no shared mutable result, matrix identity cache, numerical cutoff or changed solver decision.
   * @evidence contracts/development/implementation.md#efficient-algorithms Takes O(1) time and object storage, referencing existing n-entry and m-entry arrays without allocating new numeric arrays.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The caller supplies distinct rhs/xt/before arrays; ADMM's certificate may consume before until ADMM ends, then active polishing residuals use its initialized prefix before final Ax overwrites every entry for the immediate unchanged-x/y/A check; output state stays separate.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The workspace is local to one solve, owns one fixed-size diagnostic object and releases all references when the solve returns or throws.
   * @evidence contracts/development/common.md#meaningful-documentation Describes the phase boundary, borrowed buffers, diagnostic lifetime and absence of numeric-vector allocation.
   */
  export function of(
    transpose: Float64Array,
    curvature: Float64Array,
    rows: Float64Array,
  ): IWork {
    return {
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
   * @evidence contracts/development/implementation.md#efficient-algorithms With w=band+1, reset costs O(n*w); the first request allocates one band of at most n*w entries, and matching later requests allocate no matrix arrays.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses only storage for equal n/band and recopies P plus the current diagonal on every call; changed curvature, regularization, rho and active rows are rebuilt rather than treated as a valid old factor.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources A solve retains one mutable band until return or throw; a call without work creates independent storage that becomes the immutable prepared initial factor, with no second temporary factor matrix.
   * @evidence contracts/development/common.md#meaningful-documentation States canonical shapes, complete P reset, shape invalidation and separate initial-factor versus solve-local ownership.
   */
  export function system(
    s: B.IScaled,
    diagonal: number,
    work?: IWork,
  ): IFactor {
    let matrices: IFactor | undefined = work?.matrices;
    if (matrices === undefined || matrices.n !== s.n || matrices.band !== s.band) {
      matrices = {
        n: s.n,
        band: s.band,
        system: Array.from(
          { length: s.n },
          (_: unknown, i: number): Float64Array =>
            new Float64Array(Math.min(s.band + 1, s.n - i)),
        ),
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
   * @param out Disposable n-entry product buffer, reset to positive zero first.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Multiplies the symmetric matrix by adding both contributions of each upper-band entry in the unchanged scalar order; an exact diagonal matrix with finite x needs only its same positive-zero-plus-diagonal products.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One overwrite operation serves residual checks and polishing curvature products, with an exact diagonal path and the unchanged general band traversal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Omits only exact off-diagonal zeros for finite x, preserving positive-zero initialization and each diagonal addition; a nonfinite x resets scratch and uses the original full traversal so zero-times-infinity/NaN still reaches the existing residual rejection.
   * @evidence contracts/development/implementation.md#efficient-algorithms Takes O(n) time for finite x and exact diagonal curvature, otherwise O(n*w) with w=band+1, and O(1) auxiliary storage beyond the supplied buffer; supplied padding outside the in-range band is not read.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Preparation records the exact diagonal premise from admitted canonical P, preserved by finite positive Ruiz factors and retained only with its exactly matched numeric core; every current x product is rebuilt without carrying a product across iterates.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Allocates no arrays, changes only out and retains no input after the call.
   * @evidence contracts/development/common.md#meaningful-documentation Defines the scaled symmetric product, nonaliasing premise, reset and preserved accumulation order.
   */
  export function curvature(
    s: B.IScaled,
    x: Float64Array,
    out: Float64Array,
  ): void {
    out.fill(0);
    if (s.diagonal && s.band > 0) {
      let finite: boolean = true;
      for (let i: number = 0; i < s.n; ++i) {
        const xi: number = x[i]!;
        if (!Number.isFinite(xi)) {
          finite = false;
          break;
        }
        out[i] = out[i]! + s.p[i]![0]! * xi;
      }
      if (finite) return;

      // Preserve the original nonfinite propagation through exact zero terms.
      out.fill(0);
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
