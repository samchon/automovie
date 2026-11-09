/**
 * A reversible renderer configuration for one beauty or structural pass.
 *
 * @evidence contracts/development/design.md#principled-representation Captured renderer tone mapping, exposure and shadow policy can be restored after the pass while scene-owned environment declarations remain unchanged.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The caller needs only an undo callback; applyRendererEnvironment retains the prior renderer fields and precedence decisions.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Structural-pass bypass is a supported pass policy rather than a fixture-specific renderer override.
 * @evidence contracts/development/common.md#meaningful-documentation States reversibility for beauty/structural renderer configuration and restoration of every touched property.
 */
export interface IAutoMovieRendererEnvironmentHandle {
  /**
   * Restore every renderer property touched by the configuration.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The producer callback independently restores captured curve, exposure, shadow enablement and shadow type, reporting failures only after all assignments are attempted.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The callback closes over one pre-pass snapshot and is shared by normal teardown and failed configuration recovery.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A restoration assignment failure is preserved rather than swallowed to certify a restored renderer.
   * @evidence contracts/development/common.md#meaningful-documentation Specifies restoration of all renderer properties this configuration touched.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Four property restorations are fixed-size work independent of scene complexity.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The producer marks restoration complete only after all assignments succeed and skips later successful restore calls.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Restoring borrowed property values allocates or disposes no renderer resource.
   */
  restore: () => void;
}
