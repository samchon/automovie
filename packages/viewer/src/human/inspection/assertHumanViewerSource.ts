/**
 * Refuse candidate publication when compilation is serving fallback modules. The active iframe keeps its committed build; only a successful source generation may create the replacement. The host reports this cause beside the last good frame instead of labeling old modules as a new source revision.
 *
 * @evidence contracts/common.md#principled-implementation A non-null current compilation cause refuses replacement publication while null permits the candidate to continue its other readiness checks.
 * @evidence contracts/common.md#clear-and-simple-design One nullable-error boundary keeps compile fallback authority separate from retained-display and hardware readiness.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing last-good modules cannot be announced as a successfully compiled new revision while the current source reports failure.
 * @evidence contracts/common.md#meaningful-documentation The comment explains fallback refusal and preservation of the active iframe's committed frame.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A nullable cause comparison selects no dependency traversal or compilation algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A prior null compilation error cannot certify a new candidate after source authority changes.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources This assertion acquires no compiler process or module cache and leaves candidate/display resource ownership with the host.
 */
export function assertHumanViewerSource(error: string | null): void {
  if (error !== null) throw new Error("Current source error: " + error);
}
