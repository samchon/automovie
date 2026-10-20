/**
 * Expression sink supplied by imported runtimes such as VRM managers.
 *
 * @evidence contracts/common.md#principled-implementation A named normalized-weight callback adapts external expression managers to applyExpression without importing a particular avatar SDK into the viewer's model contract.
 * @evidence contracts/common.md#clear-and-simple-design One setter is the entire expression capability the viewer needs; imported-runtime flushing is separately represented by the model frame callback.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The sink receives authored preset/channel names and weights directly rather than replacing a foreign manager method or special-casing a particular avatar.
 * @evidence contracts/common.md#meaningful-documentation States imported-runtime ownership and the setter's normalized unit-interval weight contract.
 * @evidenceExclude contracts/performance.md#efficient-algorithms A callback signature chooses no channel-reset or morph-target traversal algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The sink represents effectful writes and defines no cache or shared request completion.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The host supplies and owns the imported runtime; the interface allocates no manager or expression resource.
 */
export interface IAutoMovieExpressionTarget {
  /**
   * Set one normalized expression channel or preset to a weight in `[0, 1]`.
   *
   * @evidence contracts/common.md#principled-implementation Receives the semantic name and normalized weight selected by applyExpression, leaving the imported runtime to map that pair to its own expression representation.
   * @evidence contracts/common.md#clear-and-simple-design The narrow setter callback adapts different managers without coupling viewer playback to their concrete SDK classes.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Hosts provide the sink explicitly; playback does not patch an imported manager's original method to steer its state.
   * @evidence contracts/common.md#meaningful-documentation Specifies channel/preset naming and the supported unit-interval weight input.
   * @evidenceExclude contracts/performance.md#efficient-algorithms The callback signature does not choose the host runtime's expression update algorithm.
   * @evidenceExclude contracts/performance.md#reuse-equivalent-work Expression setting is an effectful host operation with no shared-result promise in this contract.
   * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Setter invocation acquires no viewer-owned manager or lifetime; the host owns any state retained by its callback.
   */
  setExpressionValue: (name: string, weight: number) => void;
}
