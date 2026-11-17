/**
 * Named text values a capture request is read from: a page address, a command line, or a component's props written as text.
 *
 * `URLSearchParams` and `Map<string, string>` both satisfy it as they are, so the page passes its address's parameters and the command passes the map `readAutoMovieCaptureArguments` makes, and neither host parses an option itself.
 *
 * @evidence contracts/development/design.md#principled-representation A request is a set of named texts; `get` reads one and `keys` lists the names given, which is what lets the reader refuse a name it does not know and a name given twice.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Two methods, the subset of `URLSearchParams` and `Map` the reader calls; declared structurally so neither host adapts its own object.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No member names a host; an absent key reads as null or undefined, the two absences the two hosts return.
 * @evidence contracts/development/common.md#meaningful-documentation States which objects satisfy it as they are, and what each method returns for an absent key.
 */
export interface IAutoMovieCaptureRequestSource {
  /**
   * The text of a key, null or undefined when the key is absent, and the empty string for a key given without a value, which turns a switch on.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each absence returns and what an empty value means.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; `URLSearchParams`, `Map` or the host's object fixes the behaviour.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; the signature does not constrain an implementation's cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  get(key: string): string | null | undefined;

  /**
   * Every key given, a key given twice listed twice.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is listed and how a repeat appears.
   * @evidenceExclude contracts/development/implementation.md#principled-implementation Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; `URLSearchParams`, `Map` or the host's object fixes the behaviour.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it declares one operation and adds no layer.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; nothing here can special-case a value.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; the signature does not constrain an implementation's cost.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it coordinates no work itself.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Signature only: this declaration has no body, so each implementation answers for its own algorithm, structure and resources; it owns no state, handle or task.
   */
  keys(): Iterable<string>;
}
