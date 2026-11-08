/**
 * The interval endpoint the engine's conic expansion treats as unbounded.
 *
 * Assembly writes this signed sentinel for a null endpoint; admission requires
 * every authored finite coefficient and endpoint to have strictly smaller
 * magnitude. Conic expansion omits only unbounded sides. Changing this boundary
 * requires admission, assembly and expansion to agree. Repository history
 * preserves the preceding Clarabel bridge and its matching 1e30 convention.
 *
 * @evidence contracts/common.md#principled-implementation A shared numerical representation boundary distinguishes nullable unbounded interval sides from authored finite values; admission refuses collisions before CSC assembly and signed conic expansion.
 * @evidence contracts/common.md#clear-and-simple-design Admission, assembly and expansion share this one sentinel instead of separate bounds.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The fixed representation boundary applies to every input and does not remove small coefficients or relax finite constraints.
 * @evidence contracts/common.md#meaningful-documentation States signed null-endpoint encoding, strict finite admission, expansion behavior, coordinated changes and the historical convention.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A scalar representation constant; its consumers own admission and matrix traversal costs.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work No request or phase is coordinated by this immutable scalar.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources An immutable number owns no growing state, handle or task.
 */
export const AUTOMOVIE_QUADRATIC_INFINITY: number = 1e30;
