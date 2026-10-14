/**
 * A reversible renderer configuration for one beauty or structural pass.
 *
 * @evidence contracts/common.md#principled-implementation Captured renderer tone mapping, exposure and shadow policy can be restored after the pass while scene-owned environment declarations remain unchanged.
 * @evidence contracts/common.md#clear-and-simple-design The caller needs only an undo callback; applyRendererEnvironment retains the prior renderer fields and precedence decisions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Structural-pass bypass is a supported pass policy rather than a fixture-specific renderer override.
 * @evidence contracts/common.md#meaningful-documentation States reversibility for beauty/structural renderer configuration and restoration of every touched property.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This lifecycle interface performs no renderer configuration strategy itself.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Restoration memoization is implemented by applyRendererEnvironment, not by the erased handle type.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The handle borrows the host renderer and acquires no context or native target.
 *
 * @author Samchon
 */
export interface IAutoMovieRendererEnvironmentHandle {
  /**
   * Restore every renderer property touched by the configuration.
   *
   * @evidence contracts/common.md#principled-implementation The producer callback independently restores captured curve, exposure, shadow enablement and shadow type, reporting failures only after all assignments are attempted.
   * @evidence contracts/common.md#clear-and-simple-design The callback closes over one pre-pass snapshot and is shared by normal teardown and failed configuration recovery.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A restoration assignment failure is preserved rather than swallowed to certify a restored renderer.
   * @evidence contracts/common.md#meaningful-documentation Specifies restoration of all renderer properties this configuration touched.
   * @evidenceExclude contracts/performance.md#efficient-algorithms Four property restorations are fixed-size work independent of scene complexity.
   * @evidence contracts/performance.md#reuse-equivalent-work The producer marks restoration complete only after all assignments succeed and skips later successful restore calls.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Restoring borrowed property values allocates or disposes no renderer resource.
   */
  restore: () => void;
}

