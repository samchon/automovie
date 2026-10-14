/**
 * A candidate's hold on the source generation while it loads.
 *
 * The token is compile-window authority for this loading candidate, not proof that its frame is healthy or that a selected document was restored. The host must release the hold when the candidate loads, fails or is removed; missing label authority after release is null.
 *
 * @evidence contracts/common.md#principled-implementation An owned window token separates candidate compile authority from readiness, and release returns the server's label or explicit unproven null.
 * @evidence contracts/common.md#clear-and-simple-design The handle exposes only token and release while HTTP request ownership and generation-window bookkeeping remain in their implementation owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A held token is not a successful-frame verdict, and failed label retrieval supplies no fabricated revision.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes compile authority from health/restore success and identifies host release paths and null label meaning.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This handle type implements no request or window-label lookup algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The schema declares idempotent release semantics but implements no shared completion promise itself.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The opening operation owns its live request and the host owns release duty; the interface acquires no native handle itself.
 *
 * @author Samchon
 */
export interface IHumanViewerCandidateHold {
  /** The window's token, passed to the candidate page. */
  token: string;

  /**
   * End the hold (idempotent) and resolve with the label the server gave the window. Null means that the label remains unproven after the request or reply fails.
   *
   * @evidence contracts/common.md#principled-implementation Hold release ends compile withdrawal ownership before consulting the server's authoritative window label.
   * @evidence contracts/common.md#clear-and-simple-design One completion hides native request abortion and label transport from the candidate host.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Failed label retrieval remains null rather than a guessed current revision.
   * @evidence contracts/common.md#meaningful-documentation The member specifies idempotence, label authority and unproven null completion.
   * @evidenceExclude contracts/performance.md#efficient-algorithms This release signature selects no HTTP or server window algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Repeated release sharing is implemented by the returned handle owner.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The opening operation owns the request retired through this callback; this signature allocates none.
   */
  release: () => Promise<string | null>;
}
