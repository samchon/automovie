/**
 * Expression sink supplied by imported runtimes such as VRM managers.
 *
 * @evidence contracts/development/design.md#principled-representation A named normalized-weight callback adapts external expression managers to applyExpression without importing a particular avatar SDK into the viewer's model contract.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One setter is the entire expression capability the viewer needs; imported-runtime flushing is separately represented by the model frame callback.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The sink receives authored preset/channel names and weights directly rather than replacing a foreign manager method or special-casing a particular avatar.
 * @evidence contracts/development/common.md#meaningful-documentation States imported-runtime ownership and the setter's normalized unit-interval weight contract.
 */
export interface IAutoMovieExpressionTarget {
  /**
   * Set one normalized expression channel or preset to a weight in `[0, 1]`.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Receives the semantic name and normalized weight selected by applyExpression, leaving the imported runtime to map that pair to its own expression representation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The narrow setter callback adapts different managers without coupling viewer playback to their concrete SDK classes.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Hosts provide the sink explicitly; playback does not patch an imported manager's original method to steer its state.
   * @evidence contracts/development/common.md#meaningful-documentation Specifies channel/preset naming and the supported unit-interval weight input.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms The callback signature does not choose the host runtime's expression update algorithm.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Expression setting is an effectful host operation with no shared-result promise in this contract.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Setter invocation acquires no viewer-owned manager or lifetime; the host owns any state retained by its callback.
   */
  setExpressionValue: (name: string, weight: number) => void;
}
