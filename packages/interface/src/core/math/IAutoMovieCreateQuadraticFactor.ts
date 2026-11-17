/**
 * Sparse KKT factor state used during one quadratic interior-point solve.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Sparse KKT factor state used during one quadratic interior-point solve. Nested contracts define the relevant units, ownership and failure states.
 * @evidence contracts/development/design.md#principled-representation The result exposes mutable factor updates and owned vector solves over one fixed conic matrix structure.
 * @evidence contracts/development/design.md#minimal-and-owned-surface createAutoMovieQuadraticFactor and the interior solver share one factor lifetime and fill count.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Factor availability is separate from program convergence; false and undefined preserve numerical refusal.
 */
export namespace IAutoMovieCreateQuadraticFactor {
  /**
   * Mutable LDL-transpose factor owner for [diag(P), A'; A, -diag(H)]. Symbolic ordering and fill remain fixed while update replaces H and rebuilds numeric factors. Equality entries of H are zero; inequality entries are s/z.
   *
   * Construction assumes admitted conic dimensions and sparse structure. The closure retains the source program, reads its P on updates and copies A into its own sparse matrix, so keep the source unchanged throughout use. Signed pivot stabilization changes factors only; solve refines against the unregularized matrix. Finite refinement is not a convergence certificate.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the KKT matrix, source lifetime, update state, refusal values and owned outputs.
   * @evidence contracts/development/design.md#principled-representation H and RHS use conic numerical scaling; dimensions are m and n+m rather than geometry units. Admission belongs to the numerical caller except for documented method checks.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The interior solver reuses update/solve; nonzeros exposes actual strict-lower fill for diagnostics.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A failed update invalidates the factor and an unavailable solution stays undefined; finite factors do not imply solved program status.
   */
  export type IResult = {
    /**
     * Borrow m diagonal values and refactor. Returns false for a nonfinite/zero pivot, invalidating solve; no explicit length or sign gate exists here. A successful update is required before solving. H is not retained or changed.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents borrowed diagonal lifetime, factor invalidation, refusal and unchecked dimension/sign premises.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation The signature specifies state transitions; createAutoMovieQuadraticFactor owns numeric LDL updates.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure No update body is declared here; the factor implementation owns symbolic/numeric separation.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Pivot stabilization and numeric refusal are implementation obligations, not executable branches in this signature.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Sparse refactor work is measured by the implementation's matrix and fill dimensions.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The signature owns no cache; the enclosing contract states fixed symbolic structure reuse.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Runtime factor storage belongs to the returned factory closure; this declaration acquires none.
     */
    update(h: Float64Array): boolean;

    /**
     * Read n+m RHS values in original variable/constraint order and return a fresh mutable solution in that order. Returns undefined before a successful update, on wrong RHS length or nonfinite substitution/refinement. Up to ten correction passes do not guarantee a residual tolerance; RHS is not changed or retained.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Documents RHS order/borrowing, owned output, unavailable-factor refusal and refinement limits.
     * @evidenceExclude contracts/development/implementation.md#principled-implementation The signature fixes solve/refusal semantics; the factor producer owns substitution and original-system refinement.
     * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure No body or solver phases are implemented in the interface.
     * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts This declaration cannot turn finite vectors into convergence or apply hidden tolerances.
     * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The implementation owns sparse substitution and correction cost; no algorithm executes here.
     * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Repeated RHS work and factor reuse belong to the live factor owner, not this signature.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returned vectors must be owned by the caller; this declaration itself retains no RHS or factor storage.
     */
    solve(rhs: Float64Array): Float64Array | undefined;

    /** Count of stored strict-lower L entries, excluding diagonal pivots; fixed at construction even though this property is writable in the type. */
    nonzeros: number;
  };
}
