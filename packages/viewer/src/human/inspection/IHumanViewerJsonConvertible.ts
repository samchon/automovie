/**
 * A value that may define JSON's `toJSON` conversion.
 *
 * @evidence contracts/common.md#principled-implementation Projects the optional standard JSON toJSON hook used by the streamed preview encoder before serializing a value.
 * @evidence contracts/common.md#clear-and-simple-design Keeps JSON conversion separate from the codec's own cycle, scalar and chunk handling.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unknown converted values still require normal JSON encoding rules; the hook is effectful user code and can throw or mutate state.
 * @evidence contracts/common.md#meaningful-documentation Documents optional conversion and member-key argument, including the empty root key; no schema or geometry admission is implied.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface performs no conversion; encoder work follows visited JSON values and output bytes.
 * @evidence contracts/performance.md#reuse-equivalent-work The encoder calls the hook at its actual JSON boundary rather than memoizing conversions by object identity across requests.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The input value owns its hook and returned value lifetime; the shape owns no output stream, worker or persistent cache.
 *
 * @author Samchon
 */
export interface IHumanViewerJsonConvertible {
  /**
   * JSON's conversion hook, called with the member key.
   *
   * @evidence contracts/common.md#principled-implementation Converts this value using JSON's member-key convention before the preview encoder handles the returned unknown value.
   * @evidence contracts/common.md#clear-and-simple-design One optional standard hook preserves JSON semantics without introducing a separate numerical representation protocol.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts A callable hook executes with its original value as this; thrown conversion failures propagate rather than producing a fabricated encoded preview.
   * @evidence contracts/common.md#meaningful-documentation key is the member name or empty root key; the return can be any JSON-processed value and does not bypass cycle/scalar rules.
   * @evidence contracts/performance.md#efficient-algorithms Callback cost is defined by the value's owner; the encoder's traversal/chunk generation additionally scales with the resulting JSON.
   * @evidence contracts/performance.md#reuse-equivalent-work Conversion is effectful and not shared merely because an object reappears; actual JSON boundary invocation preserves its semantics.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary converted value remains only through serialization; stream/chunk buffers and cycles are tracked by the codec owner, not this member.
   */
  toJSON?: (key: string) => unknown;
}
